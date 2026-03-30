import { type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

/**
 * The middleware simply delegates to updateSession which:
 * 1. Refreshes the Supabase session cookie
 * 2. Redirects unauthenticated users away from /dashboard to /login
 * 3. Redirects authenticated users away from /login to /dashboard
 *
 * Fine-grained permission checks happen inside the dashboard layout (server component),
 * not here — doing a DB query in middleware on every request is too slow.
 */
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
