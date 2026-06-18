"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { toast } from "sonner";

type Mode = "login" | "signup";

export function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/";
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
        router.push(redirectTo);
        router.refresh();
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        toast.success("Account created! Check your email to confirm.");
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "An error occurred";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 gradient-hero">
      <div className="w-full max-w-sm animate-scale-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-black tracking-[0.3em] text-shimmer">
            KAIVA
          </Link>
          <p className="text-muted-foreground text-sm mt-2">
            {mode === "login" ? "Sign in to your account" : "Create your account"}
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          {/* Mode Toggle */}
          <div className="flex bg-muted rounded-full p-1 mb-6">
            <button
              id="login-tab"
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${
                mode === "login"
                  ? "bg-gold text-[#0a0a0a]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign In
            </button>
            <button
              id="signup-tab"
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${
                mode === "signup"
                  ? "bg-gold text-[#0a0a0a]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <Input
                id="auth-fullname"
                label="Full Name"
                placeholder="Priya Sharma"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            )}
            <Input
              id="auth-email"
              label="Email"
              type="email"
              placeholder="priya@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <Input
              id="auth-password"
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />

            <button
              id="auth-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-gold text-[#0a0a0a] rounded-full font-bold text-sm hover:bg-gold-light transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : null}
              {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          By continuing, you agree to our{" "}
          <a href="#" className="text-gold hover:underline">Terms of Service</a>
        </p>
      </div>
    </div>
  );
}
