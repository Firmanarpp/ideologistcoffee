"use client"

import { login } from "./actions"
import { useState } from "react"
import { Coffee, Loader2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setError(null)
    const result = await login(formData)
    if (result?.error) {
      setError(result.error)
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Pane - Branding */}
      <div className="hidden w-1/2 flex-col justify-between bg-[#4A3022] p-12 text-[#FDFBF7] lg:flex relative overflow-hidden">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(#FDFBF7 1px, transparent 1px)", backgroundSize: "40px 40px" }}></div>
        
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FDFBF7] text-[#4A3022]">
            <Coffee className="h-6 w-6" />
          </div>
          <span className="text-2xl font-semibold tracking-wider">IDEOLOGIST</span>
        </div>

        <div className="relative z-10 mt-auto">
          <h1 className="text-5xl font-light leading-tight tracking-wide">
            Fueling ideas,<br />one cup at a time.
          </h1>
          <p className="mt-6 text-lg text-[#FDFBF7]/80 font-light max-w-md">
            The premium point of sale system designed specifically for modern coffee shops.
          </p>
        </div>
      </div>

      {/* Right Pane - Login Form */}
      <div className="flex w-full items-center justify-center bg-[#FDFBF7] p-8 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-10 text-center lg:hidden flex flex-col items-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#4A3022] text-[#FDFBF7] mb-4 shadow-lg shadow-[#4A3022]/20">
              <Coffee className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-semibold text-[#1A1A1A] tracking-wider">IDEOLOGIST</h1>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-semibold text-[#1A1A1A]">Welcome back</h2>
            <p className="mt-2 text-sm text-gray-500">Sign in to your account to continue</p>
          </div>

          {error && (
            <div className="mt-6 flex items-center gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-600 border border-red-100 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <form action={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#1A1A1A]" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="admin@ideologist.com"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[#1A1A1A] text-sm focus:border-[#4A3022] focus:outline-none focus:ring-1 focus:ring-[#4A3022] transition-colors"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#1A1A1A]" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[#1A1A1A] text-sm focus:border-[#4A3022] focus:outline-none focus:ring-1 focus:ring-[#4A3022] transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "w-full rounded-xl bg-[#4A3022] px-4 py-3.5 text-sm font-medium text-white shadow-lg shadow-[#4A3022]/25 transition-all hover:bg-[#3A251A] focus:outline-none focus:ring-2 focus:ring-[#4A3022] focus:ring-offset-2 disabled:opacity-70 flex justify-center items-center gap-2",
                isLoading && "cursor-not-allowed"
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="mt-8 border-t border-gray-100 pt-6 text-center">
            <p className="text-xs text-gray-400">
               Ideologist POS Version 1.0.0<br/>Secure connection via Supabase
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
