import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isRouteAllowed, PUBLIC_DASHBOARD_ROUTES, PERMISSION_ROUTE_MAP } from "@/lib/permissions";
import type { PermissionMap } from "@/lib/permissions";

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

  // --- Permission Enforcement for Authenticated Users ---
  if (user && !isPublicRoute) {
    // 1. Skip check for internals/static files
    if (
      pathname.startsWith('/_next') || 
      pathname.startsWith('/api') || 
      pathname === '/favicon.ico' || 
      pathname.startsWith('/public') ||
      pathname.startsWith('/site.webmanifest')
    ) {
      return supabaseResponse;
    }

    // 2. Check if this path matches a PUBLIC_DASHBOARD_ROUTES prefix — bypass entirely
    if (PUBLIC_DASHBOARD_ROUTES.some(pub => pathname === pub || pathname.startsWith(pub + '/'))) {
      return supabaseResponse;
    }

    // 3. Only enforce permissions for routes that are ACTUALLY GATED in PERMISSION_ROUTE_MAP.
    //    Any route not listed there is auth-only (allowed for any logged-in user).
    const allGatedRoutes = Object.values(PERMISSION_ROUTE_MAP);
    const isGatedRoute = allGatedRoutes.some(
      gated => pathname === gated || pathname.startsWith(gated + '/')
    );

    // Route is not gated at all — let it through (it's auth-only)
    if (!isGatedRoute) {
      return supabaseResponse;
    }

    // 4. This IS a gated route → fetch user's role permissions and check
    const { data: userRow } = await supabase
      .from('users')
      .select('type, role_id')
      .eq('id', user.id)
      .single();

    let permissions: PermissionMap = {};
    const isAdmin = userRow?.type === 'Admin';

    if (!isAdmin && userRow?.role_id) {
      const { data: roleRow } = await supabase
        .from('roles')
        .select('permissions')
        .eq('id', userRow.role_id)
        .single();
      
      if (roleRow && roleRow.permissions) {
        permissions = roleRow.permissions as PermissionMap;
      }
    }

    const permitted = isRouteAllowed(pathname, permissions, isAdmin);
    
    if (!permitted) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      url.searchParams.set('access_denied', '1');
      const redirectResponse = NextResponse.redirect(url);

      supabaseResponse.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value);
      });

      return redirectResponse;
    }
  }

  return supabaseResponse;
}
