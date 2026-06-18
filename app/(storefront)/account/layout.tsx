import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirectTo=/account");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, shipping_address")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-gold mb-2">
            My Account
          </p>
          <h1 className="text-3xl font-black text-foreground">
            Welcome back, {profile?.full_name?.split(" ")[0] ?? "there"} 👋
          </h1>
          <p className="text-muted-foreground mt-1">{user.email}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
