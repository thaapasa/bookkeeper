/**
 * Sets the OTel span name and http.route attribute from the Express request.
 *
 * Bun's module loader doesn't trigger the Express auto-instrumentation hooks,
 * so we set the route info manually. This is a no-op when OTel is not active.
 *
 * @param routeOverride - Use when the route is a regex or otherwise not available via req.route
 */
import { trace } from '@opentelemetry/api';
import { Request } from 'express';

export function setOtelRouteInfo(req: Request, routeOverride?: string): void {
  const span = trace.getActiveSpan();
  if (!span) {
    return;
  }
  const route = routeOverride ?? req.baseUrl + (req.route?.path ?? req.path);
  span.setAttribute('http.route', route);
  span.updateName(`${req.method} ${route}`);
}
