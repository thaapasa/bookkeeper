/**
 * Sets the OTel span name and http.route attribute from the Express request.
 *
 * Bun's module loader doesn't trigger the Express auto-instrumentation hooks,
 * so we set the route info manually. This is a no-op when OTel is not active.
 */
import { trace } from '@opentelemetry/api';
import { Request } from 'express';

export function setOtelRouteInfo(req: Request): void {
  const span = trace.getActiveSpan();
  if (!span) {
    return;
  }
  const route = req.baseUrl + (req.route?.path ?? req.path);
  span.setAttribute('http.route', route);
  span.updateName(`${req.method} ${route}`);
}
