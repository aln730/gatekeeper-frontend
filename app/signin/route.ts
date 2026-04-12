import { signIn } from "@/lib/auth";
import { AUTH_PROVIDER_ID } from "@/lib/constants";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const callbackUrl = req.nextUrl.searchParams.get("callbackUrl") ?? "/";
  await signIn(AUTH_PROVIDER_ID, { redirectTo: callbackUrl });
}
