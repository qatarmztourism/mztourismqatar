import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js Edge Middleware for MZ Tourism Qatar
 *
 * Security Enforcement:
 * 1. Global Defense-in-Depth Security Headers on all HTTP responses.
 * 2. Path Traversal & Malicious Character Mitigation.
 * 3. Cache-Control guards on private/authenticated endpoints.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Block directory traversal or null byte injection attempts
  if (pathname.includes("..") || pathname.includes("%00") || pathname.includes("\\")) {
    return new NextResponse("Bad Request - Malformed Path", { status: 400 });
  }

  const response = NextResponse.next();

  // Defense-in-depth HTTP security headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("X-DNS-Prefetch-Control", "on");

  // Prevent caching of private admin and account responses
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/en/admin") ||
    pathname.startsWith("/ar/admin") ||
    pathname.startsWith("/account") ||
    pathname.startsWith("/en/account") ||
    pathname.startsWith("/ar/account")
  ) {
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    response.headers.set("Pragma", "no-cache");
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static assets (.svg, .png, .jpg, .jpeg, .webp, .avif)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif)$).*)",
  ],
};
