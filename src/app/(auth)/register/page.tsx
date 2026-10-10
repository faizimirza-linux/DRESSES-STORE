import { AuthForm } from "@/components/auth-form";

export const metadata = { title: "Create Account" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;
  return <AuthForm mode="register" next={sp.next ?? "/account"} />;
}
