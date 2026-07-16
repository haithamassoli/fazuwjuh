import { httpRouter } from "convex/server";
import { authComponent, createAuth } from "./auth";

const http = httpRouter();

// Next.js proxies /api/auth/* to these routes (same-origin) — no CORS needed.
authComponent.registerRoutes(http, createAuth);

export default http;
