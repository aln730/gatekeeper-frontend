import NextAuth from "next-auth";
import type { JWT } from "next-auth/jwt";
import { AUTH_PROVIDER_ID, REFRESH_TOKEN_ERROR } from "@/lib/constants";

async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const response = await fetch(
      "https://sso.csh.rit.edu/auth/realms/csh/protocol/openid-connect/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.AUTH_OIDC_ID!,
          client_secret: process.env.AUTH_OIDC_SECRET!,
          grant_type: "refresh_token",
          refresh_token: token.refreshToken as string,
        }),
      }
    );

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const refreshed = await response.json();

    return {
      ...token,
      accessToken: refreshed.access_token,
      refreshToken: refreshed.refresh_token ?? token.refreshToken,
      expiresAt: Math.floor(Date.now() / 1000) + (refreshed.expires_in as number),
      error: undefined,
    };
  } catch {
    return { ...token, error: REFRESH_TOKEN_ERROR };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    {
      id: AUTH_PROVIDER_ID,
      name: "CSH SSO",
      type: "oidc",
      issuer: "https://sso.csh.rit.edu/auth/realms/csh",
      clientId: process.env.AUTH_OIDC_ID,
      clientSecret: process.env.AUTH_OIDC_SECRET,
      authorization: { params: { scope: "openid profile email" } },
    },
  ],
  pages: {
    signIn: "/signin",
    error: "/auth-error",
  },
  callbacks: {
    jwt({ token, account, profile }) {
          if (account) {
            const payload = JSON.parse(
              Buffer.from((account as any).access_token.split(".")[1], "base64").toString()
            );
            return {
              ...token,
              accessToken: account.access_token,
              refreshToken: account.refresh_token,
              idToken: account.id_token,
              expiresAt: account.expires_at,
              username: (profile as any)?.preferred_username,
              groups: payload.groups ?? [],
              error: undefined,
            };
          }

      if (token.expiresAt && Date.now() < token.expiresAt * 1000) {
        return token;
      }

      return refreshAccessToken(token);
    },
    session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.error = token.error as string | undefined;
      session.username = token.username;
      session.groups = token.groups ?? [];
      session.idToken = token.idToken as string;
      return session;
    },
  },
});
