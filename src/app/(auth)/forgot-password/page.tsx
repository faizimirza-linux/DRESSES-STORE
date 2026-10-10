import { AuthForm } from "@/components/auth-form";

export const metadata = { title: "Forgot Password" };

export default function ForgotPasswordPage() {
  return <AuthForm mode="forgot" />;
}
