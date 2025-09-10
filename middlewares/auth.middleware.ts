import { ROUTE_RULES, STORAGE_KEYS } from "@/constants";
import { MiddlewareFactory } from "@/middleware";

import { NextRequest, NextResponse } from "next/server";

const isPublicRoute = (pathname: string) => {
  // The root path should be considered public (it's the login page)
  if (pathname === "/") return true;
  
  return ROUTE_RULES.public.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
};

const authMiddleware: MiddlewareFactory = () => {
  return async (request: NextRequest) => {
    const { pathname } = request.nextUrl;

    // Skip authentication for public routes
    if (isPublicRoute(pathname)) {
      return NextResponse.next();
    }

    // For API routes that don't require authentication, we can skip
    if (pathname.startsWith("/api/auth")) {
      return NextResponse.next();
    }

    try {
      // Get the authentication token
      const token = request.cookies.get(STORAGE_KEYS.AUTH_TOKEN)?.value;

      // If no token, redirect to login (root path)
      if (!token) {
        // Don't redirect if we're already on the login page
        if (pathname === "/") {
          return NextResponse.next();
        }
        
        const loginUrl = new URL("/", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
      }

      // TODO: If user has token - verify it 
      // TODO: Add token verification implementation

      // Token exists, allow the request to proceed
      return NextResponse.next();
    } catch (error) {
      // If there's an error checking auth, redirect to login (root path)
      // Don't redirect if we're already on the login page
      if (pathname === "/") {
        return NextResponse.next();
      }
      
      const loginUrl = new URL("/", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  };
};

export default authMiddleware;
