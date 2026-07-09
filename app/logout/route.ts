import { logout } from "@/lib/services/authService";

export async function GET() {
  await logout();
  // request.url から絶対URLを組み立てると、プロキシ環境によっては内部アドレス（0.0.0.0等）に
  // 解決されてしまうことがあるため、ブラウザ側で現在のオリジンに対して解決される相対パスを使う
  return new Response(null, {
    status: 302,
    headers: { Location: "/login" },
  });
}
