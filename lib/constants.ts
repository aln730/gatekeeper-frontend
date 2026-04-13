export const AUTH_PROVIDER_ID = "csh";
export const REFRESH_TOKEN_ERROR = "RefreshAccessTokenError";

export const DEFAULT_NO_ACCESS = "You do not have access to this door.";

// Door-specific messages, keyed by door name
export const DOOR_ACCESS_DENIED_MESSAGES: Record<string, string> = {
  "Project Room": "Have you completed the required safety seminar?",
  "Server Room": "Server Room access requires being an active RTP.",
};

// Auth error messages shown on /auth-error, keyed by next-auth error code
export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  Configuration: "There is a problem with the server configuration.",
  AccessDenied: "You do not have permission to sign in.",
  Verification: "The sign-in link is no longer valid.",
  invalid_scope: "The application requested an invalid OAuth scope. Contact a system administrator.",
};
