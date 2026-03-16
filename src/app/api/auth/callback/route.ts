import { createServerClient } from "@supabase/ssr"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get("next") ?? "/"

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            // we don't need to get cookies in this route
            return []
          },
          setAll(cookiesToSet) {
             // Let middleware handle setting cookies or we can implement it here.
             // We'll let Next.js Response handle the Set-Cookie headers.
          },
        },
      }
    )

    // Using exchangeCodeForSession will set the auth cookie
    // Wait, createServerClient in route handler requires slightly different cookie handling
    // We'll rely on the standard SSR setup
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
