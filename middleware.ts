import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  let response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next()
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // Public routes mapping
  const isPublicRoute = path === "/login" || path.startsWith("/api/payment/doku-callback")

  // Redirect unauthenticated users to login
  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Redirect authenticated users away from login
  if (user && path === "/login") {
    return NextResponse.redirect(new URL("/", request.url))
  }

  // Role based protection
  if (user) {
    // We need to fetch the role from our public.users table
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
      
    const role = userData?.role || 'cashier'

    // Root redirect - default to dashboard for everyone for now to fix user frustration
    if (path === '/') {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    // Role specific logic (can be expanded later)
    // For now, let's allow all authenticated users to access common pages during simulation
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
