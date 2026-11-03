import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in · Talindia admin", robots: { index: false, follow: false } };

async function RedirectIfSignedIn() {
  if (await getSession()) redirect("/admin/");
  return null;
}

export default function LoginPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-muted px-4 py-10">
      <Suspense fallback={null}>
        <RedirectIfSignedIn />
      </Suspense>
      <div className="w-full max-w-sm rounded-xl bg-card p-6 shadow-sm sm:p-8">
        <Image src="/brand/logo-dark.webp" alt="Talindia" width={367} height={73} unoptimized className="mb-6 h-8 w-auto" />
        <h1 className="mb-1 text-xl font-bold">Admin sign in</h1>
        <p className="mb-6 text-sm text-muted-foreground">Manage trainings, enquiries and site content.</p>
        <LoginForm />
      </div>
    </main>
  );
}
