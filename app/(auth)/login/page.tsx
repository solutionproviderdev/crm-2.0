"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn, Loader2 } from "lucide-react";
import { login } from "@/app/actions/auth";

export default function LoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await login(formData);
      if (!result.success) {
        setError(result.error);
      } else {
        router.replace("/dashboard");
        router.refresh();
      }
    });
  }

  return (
    <div className="min-h-screen flex bg-[#f0f4f8]">
      {/* ── Left Brand Panel ─────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#006080] flex-col items-center justify-center p-12">
        {/* Animated circles */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="brand-circle brand-circle-1" />
          <div className="brand-circle brand-circle-2" />
          <div className="brand-circle brand-circle-3" />
        </div>

        <div className="relative z-10 text-center text-white max-w-sm">
          {/* Logo mark */}
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 shadow-2xl">
            <span className="text-3xl font-black tracking-tighter text-white">SP</span>
          </div>

          <h1 className="text-4xl font-black tracking-tight mb-3">
            EaseIT<span className="text-white/60"> CRM</span>
          </h1>
          <p className="text-white/70 text-base leading-relaxed">
            Streamline your sales, manage leads, and grow your business with the
            all-in-one platform built for Solution Provider.
          </p>

          <div className="mt-12 grid grid-cols-3 gap-4 text-center">
            {[
              { label: "Lead Tracking", icon: "📊" },
              { label: "Team Management", icon: "👥" },
              { label: "Smart Meetings", icon: "📅" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl bg-white/10 backdrop-blur-sm p-3 border border-white/10"
              >
                <div className="text-2xl mb-1">{item.icon}</div>
                <div className="text-xs font-medium text-white/80">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom tag */}
        <div className="absolute bottom-6 text-white/40 text-xs">
          © 2026 Solution Provider. All rights reserved.
        </div>
      </div>

      {/* ── Right Login Panel ─────────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#006080]">
            <span className="text-sm font-black text-white">SP</span>
          </div>
          <span className="text-xl font-black text-[#006080]">
            EaseIT<span className="text-gray-700">CRM</span>
          </span>
        </div>

        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl shadow-black/5 border border-gray-100 p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
              <p className="mt-1 text-sm text-gray-500">
                Sign in to your account to continue
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  required
                  placeholder="you@example.com"
                  className="login-input"
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    placeholder="••••••••"
                    className="login-input pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember + Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="remember"
                    className="h-4 w-4 rounded border-gray-300 text-[#006080] focus:ring-[#006080] accent-[#006080]"
                  />
                  <span className="text-sm text-gray-600">Remember me</span>
                </label>
                <button
                  type="button"
                  className="text-sm text-[#006080] hover:text-[#004d66] font-medium transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 flex items-start gap-2">
                  <span className="text-red-500 mt-0.5 shrink-0">⚠</span>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isPending}
                id="login-submit-btn"
                className="login-btn"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    Sign in
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-xs text-gray-400">
            📞 01949-654499 &nbsp;·&nbsp; Solution Provider
          </p>
        </div>
      </div>

      <style>{`
        .login-input {
          display: block;
          width: 100%;
          border-radius: 0.625rem;
          border: 1px solid #e5e7eb;
          background: #f9fafb;
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
          color: #111827;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
        }
        .login-input::placeholder { color: #9ca3af; }
        .login-input:focus {
          border-color: #006080;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(0,96,128,0.1);
        }
        .login-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 100%;
          border-radius: 0.625rem;
          background: #006080;
          color: white;
          font-weight: 600;
          font-size: 0.9rem;
          padding: 0.75rem 1rem;
          border: none;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s, box-shadow 0.2s;
          box-shadow: 0 2px 8px rgba(0,96,128,0.3);
        }
        .login-btn:hover:not(:disabled) {
          background: #005070;
          box-shadow: 0 4px 14px rgba(0,96,128,0.4);
          transform: translateY(-1px);
        }
        .login-btn:active:not(:disabled) { transform: translateY(0); }
        .login-btn:disabled { opacity: 0.65; cursor: not-allowed; }

        .brand-circle {
          position: absolute;
          border-radius: 9999px;
          background: rgba(255,255,255,0.05);
          animation: float 8s ease-in-out infinite;
        }
        .brand-circle-1 { width: 400px; height: 400px; top: -100px; left: -100px; animation-duration: 9s; }
        .brand-circle-2 { width: 300px; height: 300px; bottom: -80px; right: -80px; animation-duration: 11s; animation-delay: -3s; }
        .brand-circle-3 { width: 200px; height: 200px; top: 50%; left: 50%; margin: -100px; animation-duration: 7s; animation-delay: -5s; }

        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-20px) scale(1.03); }
        }
      `}</style>
    </div>
  );
}
