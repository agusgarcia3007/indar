import { auth } from "./auth";

export async function getSession(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });
  return session;
}

export async function requireAuth(request: Request) {
  const session = await getSession(request);
  if (!session) {
    return null;
  }
  return session;
}

type RouteHandler = (req: Request) => Promise<Response>;

export function authenticated(handler: (req: Request, session: NonNullable<Awaited<ReturnType<typeof getSession>>>) => Promise<Response>): RouteHandler {
  return async (req: Request) => {
    const session = await requireAuth(req);
    if (!session) {
      return errorResponse("Unauthorized", 401);
    }
    return handler(req, session);
  };
}

export function jsonResponse(data: unknown, status = 200) {
  return Response.json(data, { status });
}

export function errorResponse(error: string, status = 400) {
  return Response.json({ error }, { status });
}
