import { NextResponse } from "next/server";
import { logout } from "@/lib/services/authService";

export async function GET(request: Request) {
  await logout();
  return NextResponse.redirect(new URL("/login", request.url));
}
