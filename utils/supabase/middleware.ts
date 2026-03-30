import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || '';

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // refreshing the auth token
  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // By default, protect all routes in this CRM EXCEPT /login
  const isPublicRoute = pathname === '/login';

  if (!isPublicRoute) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      const redirectResponse = NextResponse.redirect(url);
      
      // Copy cookies from refreshed supabaseResponse to the redirect response
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value);
      });

      return redirectResponse;
    }
  }

  // Redirect authenticated users away from /login
  if (pathname === '/login' && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    const redirectResponse = NextResponse.redirect(url);

    // Copy cookies from refreshed supabaseResponse to the redirect response
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });

    return redirectResponse;
  }

  return supabaseResponse;
}
