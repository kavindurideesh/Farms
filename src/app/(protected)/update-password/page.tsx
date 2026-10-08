import { Suspense } from "react";
import Image from "next/image";
import { updatePassword } from "../../actions";

function ErrorMessage({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
      <span className="shrink-0 mt-0.5">⚠</span>
      <span>{decodeURIComponent(error)}</span>
    </div>
  );
}

export default async function UpdatePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f0faf3] px-4">
      <div className="w-full max-w-sm space-y-7">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-24 h-24 rounded-2xl bg-white shadow-md border border-green-100 flex items-center justify-center overflow-hidden">
            <Image src="/logo.png" alt="Logo" width={88} height={88} className="object-contain" priority />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-green-900">Update Password</h1>
            <p className="text-sm text-green-700/70 mt-1">Enter your new password below</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-green-100 shadow-sm overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-green-500 to-emerald-400" />
          <div className="p-8 space-y-5">
            <Suspense fallback={null}>
              <ErrorMessage error={error} />
            </Suspense>

            <form action={updatePassword} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-sm font-semibold text-green-900">New Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  minLength={6}
                  className="w-full rounded-lg border border-green-200 bg-green-50 px-3.5 py-2.5 text-sm text-green-900 outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                />
              </div>

              <button type="submit" className="mt-1 w-full rounded-lg bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold text-sm py-2.5 transition">
                Update Password
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
