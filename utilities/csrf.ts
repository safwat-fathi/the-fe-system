"use server";

import { randomBytes } from "crypto";

import { cookies } from "next/headers";

const CSRF_COOKIE_NAME = process.env.NEXT_PUBLIC_CSRF_COOKIE_NAME;

/**
 * Generates a new CSRF token and stores it in a cookie
 * @returns The CSRF token
 */
export async function generateCSRFToken(): Promise<string> {
  if (!CSRF_COOKIE_NAME) {
    throw new Error("CSRF_COOKIE_NAME is not defined");
  }

  // Create a token using the secret and random bytes
  const randomData = randomBytes(32).toString("hex");
  const secret = process.env.CSRF_SECRET;
  const token = Buffer.from(`${randomData}-${secret}`).toString("base64");

  const cookieStore = await cookies();

  // Set the token as a secure, httpOnly cookie
  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 3600, // 1 hour
  });

  return token;
}

/**
 * Validates a provided CSRF token against the one stored in the cookie
 * @param token The token to validate
 * @returns True if the token is valid, false otherwise
 */
export async function validateCSRFToken(token: string): Promise<boolean> {
  if (!CSRF_COOKIE_NAME) {
    throw new Error("CSRF_COOKIE_NAME is not defined");
  }

  const cookieStore = await cookies();
  const storedToken = cookieStore.get(CSRF_COOKIE_NAME)?.value;

  // Clear the token after validation to prevent replay attacks
  cookieStore.delete(CSRF_COOKIE_NAME);

  return (
    token !== undefined && storedToken !== undefined && token === storedToken
  );
}

/**
 * Gets the current CSRF token from the cookie (for form rendering)
 * @returns The CSRF token or null if not found
 */
export async function getCSRFToken(): Promise<string | null> {
  if (!CSRF_COOKIE_NAME) {
    throw new Error("CSRF_COOKIE_NAME is not defined");
  }

  const cookieStore = await cookies();

  return cookieStore.get(CSRF_COOKIE_NAME)?.value || null;
}
