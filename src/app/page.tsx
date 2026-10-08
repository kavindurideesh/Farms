import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { signIn } from "./actions";

function LoginError({ error }: { error: string | undefined }) {
  if (!error) return null;
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
    >
      <span className="shrink-0 mt-0.5">⚠</span>
      <span>{decodeURIComponent(error)}</span>
    </div>
  );
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f0faf3] px-4">
      <div className="w-full max-w-sm space-y-7">

        {/* Logo + Brand */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-24 h-24 rounded-2xl bg-white shadow-md border border-green-100 flex items-center justify-center overflow-hidden">
            <Image
              src="/logo.png"
              alt="Kamali's Flowers logo"
              width={88}
              height={88}
              className="object-contain"
              priority
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-green-900">
              Kamali&apos;s Flowers
            </h1>
            <p className="text-sm text-green-700/70 mt-1">
              Sign in to your admin account
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-green-100 shadow-sm overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-green-500 to-emerald-400" />
          <div className="p-8 space-y-5">

            <Suspense fallback={null}>
              <LoginError error={error} />
            </Suspense>

            <form action={signIn} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-green-900"
                >
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="kavindurideesh@gmail.com"
                  className="w-full rounded-lg border border-green-200 bg-green-50 px-3.5 py-2.5 text-sm text-green-900 placeholder:text-green-400 outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-green-900"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-green-200 bg-green-50 px-3.5 py-2.5 text-sm text-green-900 placeholder:text-green-400 outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                />
              </div>

              <button
                type="submit"
                className="mt-1 w-full rounded-lg bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold text-sm py-2.5 transition focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Sign in
              </button>
              <div className="text-center pt-2">
                <Link href="/forgot-password" className="text-sm font-medium text-green-600 hover:text-green-800 transition">
                  Forgot your password?
                </Link>
              </div>
            </form>
          </div>
        </div>

        <p className="text-center text-xs text-green-700/50">
          Kamali&apos;s Flowers &copy; {new Date().getFullYear()} &mdash; Admin Portal
        </p>
      </div>
    </div>
  );
}
