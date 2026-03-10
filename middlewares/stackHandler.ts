import {
  NextMiddleware,
  NextResponse,
  NextRequest,
  NextFetchEvent,
} from "next/server";

import { MiddlewareFactory } from "@/middleware";

export function stackMiddlewares(
  functions: MiddlewareFactory[] = [],
  index = 0,
): NextMiddleware {
  const current = functions[index];

  if (current) {
    const next = stackMiddlewares(functions, index + 1);

    return async (request: NextRequest, event: NextFetchEvent) => {
      return current(next)(request, event);
    };
  }

  // Final middleware return
  return (_request: NextRequest) => NextResponse.next();
}
