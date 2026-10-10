import { redirect } from "next/navigation";

/** Legacy route — the full reset flow now lives on /forgot-password. */
export default function ResetPasswordPage() {
  redirect("/forgot-password");
}
