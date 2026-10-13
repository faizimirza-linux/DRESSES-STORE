"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Mail,
  Lock,
  User,
  Loader2,
  ShieldCheck,
  ArrowLeft,
  KeyRound,
  Sparkles,
  TriangleAlert,
  Wand2,
} from "lucide-react";
import { BUSINESS } from "@/lib/business";

type Mode = "login" | "register" | "forgot";
type Step = "credentials" | "otp" | "newpass" | "done";

/* --------------------------- OAuth buttons -------------------------------- */

function OAuthButtons({ next }: { next: string }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <a
        href={`/api/auth/oauth/google?next=${encodeURIComponent(next)}`}
        className="flex items-center justify-center gap-2 rounded-full border border-ink/15 bg-cream px-4 py-3 text-sm font-semibold text-ink transition-all hover:border-burgundy/40 hover:shadow-card"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" />
          <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l3.66-2.84Z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52Z" />
        </svg>
        Google
      </a>
      <a
        href={`/api/auth/oauth/apple?next=${encodeURIComponent(next)}`}
        className="flex items-center justify-center gap-2 rounded-full border border-ink/15 bg-cream px-4 py-3 text-sm font-semibold text-ink transition-all hover:border-burgundy/40 hover:shadow-card"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-ink" aria-hidden>
          <path d="M17.05 20.28c-.98.95-2.05.86-3.08.38-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.38C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8.98-.2 1.92-.87 3.03-.83 1.32.11 2.31.63 2.96 1.58-2.72 1.63-2.28 5.24.45 6.24-.6 1.57-1.36 3.13-2.52 4.18ZM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25Z" />
        </svg>
        Apple
      </a>
    </div>
  );
}

/* ------------------------------- OTP input -------------------------------- */

function OtpBoxes({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(6, " ").slice(0, 6).split("");

  function setDigit(i: number, d: string) {
    const clean = d.replace(/\D/g, "").slice(-1);
    const arr = value.padEnd(6, " ").split("");
    arr[i] = clean || " ";
    onChange(arr.join("").replace(/ +$/g, ""));
    if (clean && i < 5) refs.current[i + 1]?.focus();
  }

  return (
    <div className="flex justify-between gap-2" onPaste={(e) => {
      e.preventDefault();
      const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
      onChange(text);
      refs.current[Math.min(text.length, 5)]?.focus();
    }}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          value={d.trim()}
          inputMode="numeric"
          maxLength={1}
          onChange={(e) => setDigit(i, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !d.trim() && i > 0) refs.current[i - 1]?.focus();
          }}
          className="h-13 w-11 rounded-xl border border-ink/15 bg-cream text-center font-display text-xl font-bold text-burgundy outline-none transition-all focus:border-burgundy focus:ring-2 focus:ring-burgundy/15 sm:h-14 sm:w-12"
        />
      ))}
    </div>
  );
}

/* -------------------------------- main form ------------------------------- */

export function AuthForm({
  mode,
  next = "/account",
  oauthError,
}: {
  mode: Mode;
  next?: string;
  oauthError?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("credentials");
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [purpose, setPurpose] = useState<"verify" | "login" | "reset">(
    mode === "forgot" ? "reset" : mode === "register" ? "verify" : "login",
  );
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(
    oauthError === "oauth_not_configured"
      ? "Social sign-in isn't configured yet. Add that provider's client ID and client secret to the Vercel environment, then redeploy — or use email below."
      : null,
  );
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setPurpose(mode === "forgot" ? "reset" : mode === "register" ? "verify" : "login");
    setStep("credentials");
    setError(null);
    setNotice(null);
    setOtp("");
  }, [mode]);

  const titles: Record<Mode, { title: string; sub: string }> = {
    login: { title: "Welcome back", sub: "Sign in to track orders, save measurements and checkout faster." },
    register: { title: "Create your account", sub: "Sixty seconds — then a lifetime of perfect fits." },
    forgot: { title: "Reset your password", sub: "We'll email you a one-time verification code." },
  };

  async function post(url: string, body: Record<string, unknown>) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? "Something went wrong");
    return data;
  }

  async function submitCredentials(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "register") {
        if (form.password.length < 8) throw new Error("Password must be at least 8 characters.");
        const data = await post("/api/auth/register", {
          name: form.name,
          email: form.email,
          password: form.password,
        });
        setDevOtp(data.devOtp ?? null);
        setStep("otp");
        setNotice(`We sent a 6-digit code to ${form.email}.`);
      } else if (mode === "login") {
        const data = await post("/api/auth/login", { email: form.email, password: form.password });
        setDevOtp(data.devOtp ?? null);
        setStep("otp");
        setNotice(`We sent a 6-digit code to ${form.email}.`);
      } else {
        const data = await post("/api/auth/forgot-password", { email: form.email });
        setDevOtp(data.devOtp ?? null);
        setStep("otp");
        setNotice(data.message ?? `If an account exists for ${form.email}, a code is on its way.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function submitOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const data = await post("/api/auth/verify-otp", { email: form.email, code: otp, purpose });
      if (purpose === "reset") {
        setResetToken(data.resetToken);
        setStep("newpass");
        setNotice("Code verified — set your new password.");
      } else {
        setNotice("Verified! Signing you in…");
        setStep("done");
        setTimeout(() => {
          router.push(next);
          router.refresh();
        }, 800);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code");
    } finally {
      setBusy(false);
    }
  }

  async function submitNewPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (form.password.length < 8) throw new Error("Password must be at least 8 characters.");
      if (form.password !== form.confirm) throw new Error("Passwords don't match.");
      await post("/api/auth/reset-password", { token: resetToken, password: form.password });
      setStep("done");
      setNotice("Password updated! Redirecting to sign in…");
      setTimeout(() => router.push("/login"), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset password");
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setError(null);
    setBusy(true);
    try {
      const url = purpose === "reset" ? "/api/auth/forgot-password" : mode === "register" ? "/api/auth/register" : "/api/auth/login";
      const body = purpose === "login" ? { email: form.email, password: form.password } : mode === "register" ? { name: form.name, email: form.email, password: form.password } : { email: form.email };
      const data = await post(url, body);
      setDevOtp(data.devOtp ?? null);
      setNotice("A fresh code is on its way.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto grid min-h-dvh max-w-7xl gap-10 px-5 pt-36 pb-16 md:px-8 lg:grid-cols-[1fr_1fr] lg:pt-40">
      {/* form side */}
      <div className="flex flex-col justify-center">
        <motion.div
          key={`${mode}-${step}`}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="card mx-auto w-full max-w-md p-8 md:p-10"
        >
          {step === "otp" && (
            <button onClick={() => setStep("credentials")} className="mb-4 flex items-center gap-1.5 text-xs font-semibold text-ink-soft hover:text-burgundy">
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>
          )}

          <p className="eyebrow">{mode === "login" ? "Sign in" : mode === "register" ? "Join DRESSES" : "Account recovery"}</p>
          <h1 className="mt-2 font-display text-4xl font-medium text-ink">
            {step === "otp" ? "Enter your code" : step === "newpass" ? "New password" : titles[mode].title}
          </h1>
          <p className="mt-2 text-sm text-ink-soft">
            {step === "otp"
              ? `A 6-digit verification code was sent to ${form.email || "your email"}.`
              : step === "newpass"
                ? "Choose a fresh password for your account."
                : titles[mode].sub}
          </p>

          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 flex items-start gap-2 rounded-xl bg-burgundy/10 px-4 py-3 text-xs font-semibold text-burgundy">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" /> {error}
            </motion.p>
          )}
          {notice && !error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 flex items-start gap-2 rounded-xl bg-gold/15 px-4 py-3 text-xs font-semibold text-ink">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-gold" /> {notice}
            </motion.p>
          )}

          {/* credentials step */}
          {step === "credentials" && (
            <form onSubmit={submitCredentials} className="mt-6 space-y-4">
              {mode !== "forgot" && <OAuthButtons next={next} />}
              {mode !== "forgot" && (
                <div className="flex items-center gap-3 text-[11px] font-bold tracking-widest text-ink/35 uppercase">
                  <span className="h-px flex-1 bg-ink/10" /> or with email <span className="h-px flex-1 bg-ink/10" />
                </div>
              )}
              {mode === "register" && (
                <div className="relative">
                  <User className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-ink/35" />
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" className="field pl-11" />
                </div>
              )}
              <div className="relative">
                <Mail className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-ink/35" />
                <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email address" className="field pl-11" />
              </div>
              {mode !== "forgot" && (
                <div className="relative">
                  <Lock className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-ink/35" />
                  <input required type="password" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={mode === "register" ? "Password (min. 8 characters)" : "Password"} className="field pl-11" />
                </div>
              )}
              {mode === "login" && (
                <div className="text-right">
                  <Link href="/forgot-password" className="text-xs font-semibold text-burgundy link-underline">
                    Forgot password?
                  </Link>
                </div>
              )}
              <button disabled={busy} className="btn-primary w-full">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "login" ? "Continue" : mode === "register" ? "Create Account" : "Send Reset Code"}
              </button>
              <p className="text-center text-xs text-ink-soft">
                {mode === "login" ? (
                  <>New to DRESSES? <Link href={`/register?next=${encodeURIComponent(next)}`} className="font-bold text-burgundy link-underline">Create an account</Link></>
                ) : mode === "register" ? (
                  <>Already have an account? <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-bold text-burgundy link-underline">Sign in</Link></>
                ) : (
                  <>Remembered it? <Link href="/login" className="font-bold text-burgundy link-underline">Back to sign in</Link></>
                )}
              </p>
            </form>
          )}

          {/* OTP step */}
          {step === "otp" && (
            <form onSubmit={submitOtp} className="mt-6 space-y-5">
              <OtpBoxes value={otp} onChange={setOtp} />
              {devOtp && (
                <button
                  type="button"
                  onClick={() => setOtp(devOtp)}
                  className="flex w-full items-center justify-between rounded-xl border border-dashed border-gold/60 bg-gold/10 px-4 py-2.5 text-xs font-semibold text-ink transition-colors hover:bg-gold/20"
                >
                  <span className="flex items-center gap-2">
                    <Wand2 className="h-3.5 w-3.5 text-gold" /> Dev mode — tap to autofill
                  </span>
                  <span className="font-display text-base font-bold tracking-[0.3em] text-burgundy">{devOtp}</span>
                </button>
              )}
              <button disabled={busy || otp.length !== 6} className="btn-primary w-full">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ShieldCheck className="h-4 w-4" /> Verify Code</>}
              </button>
              <p className="text-center text-xs text-ink-soft">
                Didn't get it?{" "}
                <button type="button" onClick={resend} disabled={busy} className="font-bold text-burgundy link-underline">
                  Resend code
                </button>
              </p>
            </form>
          )}

          {/* new password step */}
          {step === "newpass" && (
            <form onSubmit={submitNewPassword} className="mt-6 space-y-4">
              <div className="relative">
                <KeyRound className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-ink/35" />
                <input required type="password" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="New password" className="field pl-11" />
              </div>
              <div className="relative">
                <Lock className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-ink/35" />
                <input required type="password" minLength={8} value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} placeholder="Confirm new password" className="field pl-11" />
              </div>
              <button disabled={busy} className="btn-primary w-full">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Password"}
              </button>
            </form>
          )}

          {/* done */}
          {step === "done" && (
            <div className="mt-8 flex flex-col items-center text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 15 }} className="grid h-16 w-16 place-items-center rounded-full bg-burgundy">
                <ShieldCheck className="h-8 w-8 text-cream" />
              </motion.div>
              <p className="mt-4 text-sm font-semibold text-ink">{notice}</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* visual side */}
      <div className="relative hidden overflow-hidden rounded-[32px] shadow-luxe lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/products/b13.jpg" alt="DRESSES bridal craftsmanship" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-wine/85 via-wine/25 to-transparent" />
        <div className="absolute right-10 bottom-10 left-10 text-cream">
          <p className="font-display text-3xl leading-snug font-medium italic">
            “Every stitch placed like it matters — because it does.”
          </p>
          <p className="mt-3 text-xs font-bold tracking-[0.24em] text-gold-light uppercase">
            {BUSINESS.name} · {BUSINESS.city}
          </p>
        </div>
      </div>
    </div>
  );
}
