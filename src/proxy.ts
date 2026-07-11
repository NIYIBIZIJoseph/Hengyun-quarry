// src/proxy.ts
import { NextRequest, NextResponse } from 'next/server';

// Routes that don't require authentication
const publicRoutes = ['/', '/login', '/api/auth/login', '/api/auth/verify-2fa'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // ✅ Allow all /api/public/* routes
  if (pathname.startsWith('/api/public')) {
    return NextResponse.next();
  }
  
  // ✅ Allow maintenance page
  if (pathname === '/maintenance') {
    return NextResponse.next();
  }
  
  // Allow other public routes
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return NextResponse.next();
  }
  
  // ✅ Protect dashboard and API routes
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/api/')) {
    const token = request.cookies.get('token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');
    
    // ✅ Only log in development and skip noisy endpoints
    if (process.env.NODE_ENV === 'development') {
      const skipLogging = ['/notifications', '/preferences', '/ping', '/health'];
      if (!skipLogging.some(p => pathname.includes(p))) {
        console.log('🔵 Proxy - Path:', pathname);
        console.log('🔵 Proxy - Token exists:', !!token);
      }
    }
    
    if (!token) {
      // For API calls, return 401 instead of redirect
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      // For dashboard pages, redirect to login
      const loginUrl = new URL('/login', request.url);
      // Preserve the original URL to redirect back after login
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // ✅ Optional: Check if token is expired or invalid
    // You could add a token validation here
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - .well-known (for security/verification)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|.well-known).*)',
  ],
};