import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Skip API routes and static/user-uploaded assets
  if (pathname.startsWith('/api/') || pathname.startsWith('/_next') || pathname.startsWith('/uploads/') || pathname === '/favicon.ico') {
    return NextResponse.next()
  }

  // Login page is always accessible
  if (pathname === '/login') return NextResponse.next()

  const userId = req.cookies.get('fleet_user_id')?.value
  if (!userId) return NextResponse.redirect(new URL('/login', req.url))
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|uploads|favicon.ico).*)'],
}
