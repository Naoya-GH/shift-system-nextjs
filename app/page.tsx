import { redirect } from "next/navigation";
import { currentUser } from "@/lib/services/authService";

export default async function HomePage() {
  const user = await currentUser();
  if (!user) {
    redirect("/login");
  }
  redirect(user.role === "owner" ? "/owner/shifts" : "/request");
}
