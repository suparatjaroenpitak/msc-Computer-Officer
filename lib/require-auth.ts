import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export async function requirePageSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/?auth=required");
  return session;
}

export async function getRequiredApiSession() {
  return getServerSession(authOptions);
}
