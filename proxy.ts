import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "./lib/sessionToken";
import { appConfig } from "./lib/config";

const ROLE_RULES: { prefix: string; role: "owner" | "staff" }[] = [
  { prefix: "/owner", role: "owner" },
  { prefix: "/request", role: "staff" },
  { prefix: "/schedule", role: "staff" },
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get(appConfig.session.cookieName)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const rule = ROLE_RULES.find((r) => pathname.startsWith(r.prefix));
  if (rule && session.role !== rule.role) {
    return NextResponse.redirect(new URL("/403", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/request/:path*", "/schedule/:path*", "/owner/:path*", "/account/:path*"],
};
