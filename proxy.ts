import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { buildAuthErrorUrl } from "@/lib/auth-utils";

export function proxy(req: NextRequest) {
  if (req.nextUrl.searchParams.get("error")) {
    return NextResponse.redirect(new URL(buildAuthErrorUrl(req.nextUrl.searchParams), req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/auth/callback/csh"],
};
