import { Activity, ArrowRight, HeartPulse, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { LoginInput, RegisterInput } from "../../lib/api";

const passwordMessage =
  "Use at least 12 characters with uppercase, lowercase, number, and symbol.";

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required.")
});

const registerSchema = loginSchema.extend({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  password: z
    .string()
    .min(12, passwordMessage)
    .regex(/[a-z]/, passwordMessage)
    .regex(/[A-Z]/, passwordMessage)
    .regex(/[0-9]/, passwordMessage)
    .regex(/[^A-Za-z0-9]/, passwordMessage)
});

type AuthMode = "login" | "register";
type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

type AuthPageProps = {
  isSubmitting: boolean;
  errorMessage?: string;
  onLogin: (input: LoginInput) => void;
  onRegister: (input: RegisterInput) => void;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-2 text-xs font-semibold text-rose-600">{message}</p>;
}

function LoginForm({ errorMessage, isSubmitting, onLogin }: Pick<AuthPageProps, "errorMessage" | "isSubmitting" | "onLogin">) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    setError
  } = useForm<LoginFormValues>({ defaultValues: { email: "", password: "" } });

  const submit = handleSubmit((values) => {
    const result = loginSchema.safeParse(values);
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof LoginFormValues;
        setError(field, { message: issue.message });
      });
      return;
    }
    onLogin(result.data);
  });

  return (
    <form className="mt-7 space-y-5" onSubmit={submit}>
      <div>
        <label className="text-sm font-bold text-slate-800" htmlFor="login-email">Email address</label>
        <input
          autoComplete="email"
          className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
          id="login-email"
          placeholder="javed.demo@example.com"
          type="email"
          {...register("email")}
        />
        <FieldError message={errors.email?.message} />
      </div>

      <div>
        <label className="text-sm font-bold text-slate-800" htmlFor="login-password">Password</label>
        <input
          autoComplete="current-password"
          className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
          id="login-password"
          placeholder="Your password"
          type="password"
          {...register("password")}
        />
        <FieldError message={errors.password?.message} />
      </div>

      {errorMessage ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{errorMessage}</div> : null}

      <button
        className="button-motion inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-bold text-white shadow-lg shadow-slate-950/10 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Opening vault..." : "Login to MedVault"}
        <ArrowRight size={17} />
      </button>
    </form>
  );
}

function RegisterForm({ errorMessage, isSubmitting, onRegister }: Pick<AuthPageProps, "errorMessage" | "isSubmitting" | "onRegister">) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    setError
  } = useForm<RegisterFormValues>({ defaultValues: { name: "", email: "", password: "" } });

  const submit = handleSubmit((values) => {
    const result = registerSchema.safeParse(values);
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof RegisterFormValues;
        setError(field, { message: issue.message });
      });
      return;
    }
    onRegister(result.data);
  });

  return (
    <form className="mt-7 space-y-5" onSubmit={submit}>
      <div>
        <label className="text-sm font-bold text-slate-800" htmlFor="register-name">Full name</label>
        <input
          autoComplete="name"
          className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
          id="register-name"
          placeholder="Javed Khan"
          type="text"
          {...register("name")}
        />
        <FieldError message={errors.name?.message} />
      </div>

      <div>
        <label className="text-sm font-bold text-slate-800" htmlFor="register-email">Email address</label>
        <input
          autoComplete="email"
          className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
          id="register-email"
          placeholder="you@example.com"
          type="email"
          {...register("email")}
        />
        <FieldError message={errors.email?.message} />
      </div>

      <div>
        <label className="text-sm font-bold text-slate-800" htmlFor="register-password">Password</label>
        <input
          autoComplete="new-password"
          className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
          id="register-password"
          placeholder="StrongPass123!"
          type="password"
          {...register("password")}
        />
        <FieldError message={errors.password?.message} />
      </div>

      {errorMessage ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{errorMessage}</div> : null}

      <button
        className="button-motion inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-bold text-white shadow-lg shadow-slate-950/10 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Creating secure account..." : "Create secure account"}
        <ArrowRight size={17} />
      </button>
    </form>
  );
}

export function AuthPage({ errorMessage, isSubmitting, onLogin, onRegister }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>("login");

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#eef6f2] text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden bg-slate-950 px-10 py-10 text-white lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(20,184,166,0.35),transparent_28%),radial-gradient(circle_at_82%_24%,rgba(245,158,11,0.22),transparent_25%),linear-gradient(135deg,#020617_0%,#0f172a_52%,#042f2e_100%)]" />
          <div className="absolute bottom-16 right-14 h-72 w-72 rounded-full bg-teal-400/10 blur-3xl" />

          <div className="relative z-10 flex min-h-full flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-500 text-white shadow-lg shadow-teal-500/25">
                <HeartPulse size={25} />
              </div>
              <div>
                <p className="text-xl font-black tracking-tight">MedVault</p>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-100/70">Personal Health Timeline</p>
              </div>
            </div>

            <div className="max-w-xl pb-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-teal-100 backdrop-blur">
                <Sparkles size={15} />
                Senior MERN security flow
              </div>
              <h1 className="mt-7 text-5xl font-black leading-[1.02] tracking-tight xl:text-6xl">
                Your medical story, protected by a real auth system.
              </h1>
              <p className="mt-6 max-w-lg text-base leading-8 text-slate-200">
                JWT cookies, refresh-token rotation, RBAC-ready APIs, and a clean dashboard experience for patient timelines.
              </p>
            </div>

            <div className="grid max-w-2xl grid-cols-3 gap-3">
              {[
                { icon: ShieldCheck, label: "httpOnly cookies" },
                { icon: LockKeyhole, label: "Argon2id backend" },
                { icon: Activity, label: "Timeline APIs" }
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                  <item.icon className="text-teal-200" size={20} />
                  <p className="mt-3 text-sm font-bold text-white">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-8 sm:py-10 lg:min-h-0">
          <div className="page-fade w-full max-w-md">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-teal-700 text-white">
                <HeartPulse size={23} />
              </div>
              <div>
                <p className="text-lg font-black">MedVault</p>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-700">Health timeline</p>
              </div>
            </div>

            <div className="glass-panel soft-pop rounded-3xl p-5 sm:rounded-[2rem] sm:p-8">
              <div className="inline-flex rounded-full bg-slate-100 p-1">
                {(["login", "register"] as const).map((item) => (
                  <button
                    className={`button-motion rounded-full px-4 py-2 text-sm font-black capitalize transition ${mode === item ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
                    key={item}
                    onClick={() => setMode(item)}
                    type="button"
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div className="mt-7">
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-teal-700">
                  {mode === "login" ? "Welcome back" : "Start securely"}
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                  {mode === "login" ? "Login to your vault" : "Create your MedVault"}
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  {mode === "login"
                    ? "Use the account you created while testing the backend. The API sets secure cookies automatically."
                    : "Create a new account and MedVault will open the dashboard with your authenticated session."}
                </p>
              </div>

              {mode === "login" ? (
                <LoginForm errorMessage={errorMessage} isSubmitting={isSubmitting} onLogin={onLogin} />
              ) : (
                <RegisterForm errorMessage={errorMessage} isSubmitting={isSubmitting} onRegister={onRegister} />
              )}
            </div>

            <p className="mt-5 text-center text-xs font-semibold leading-5 text-slate-500">
              Dev note: access and refresh tokens are stored in httpOnly cookies, so JavaScript cannot read them directly.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
