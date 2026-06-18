import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your KAIVA account",
};

export default function LoginPage() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  );
}
