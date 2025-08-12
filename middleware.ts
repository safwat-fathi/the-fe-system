import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value
  const isLoginPage = request.nextUrl.pathname === '/'
  const isPublicPage = request.nextUrl.pathname.startsWith('/_next') || 
                      request.nextUrl.pathname.startsWith('/api') ||
                      request.nextUrl.pathname.includes('.')

  // السماح بالصفحات العامة
  if (isPublicPage) {
    return NextResponse.next()
  }

  // إذا كان المستخدم في صفحة تسجيل الدخول ولديه توكن صالح، توجيه للداشبورد
  if (isLoginPage && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // إذا كان المستخدم يحاول الوصول لصفحة محمية بدون توكن، توجيه لصفحة تسجيل الدخول
  if (!isLoginPage && !token) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
