import { redirect } from "next/navigation";
import Dashboard from "@/components/dashboard";
import { getCurrentSession } from "@/lib/auth";

export default async function Home() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  return <Dashboard email={session.email} />;
}
