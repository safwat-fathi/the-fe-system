export class AuthenticationError extends Error {
  constructor(message: string = "Authentication required") {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = "Authorization required") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export const rethrowAuthenticationError = (error: unknown): void => {
  if (error instanceof AuthenticationError) {
    throw error;
  }
}
