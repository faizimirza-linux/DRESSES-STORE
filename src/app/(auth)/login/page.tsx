import { AuthForm } from "@/components/auth-form";

export const metadata = { title: "Sign In" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const sp = await searchParams;
  return <AuthForm mode="login" next={sp.next ?? "/account"} oauthError={sp.error} />;
}
