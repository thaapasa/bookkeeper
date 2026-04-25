/**
 * Helper for wrapping a service-level operation in an OpenTelemetry span.
 *
 * The span is set as the active span for the duration of `fn`, so any spans
 * created inside (e.g. SQL spans from the pg-promise hooks in `Db.ts`) become
 * children of this one. Errors are recorded and the span is marked as ERROR.
 *
 * No-op when OTel is not initialized — `trace.getTracer` returns a no-op
 * tracer that runs `fn` without any tracing overhead.
 */
import { Attributes, SpanStatusCode, trace } from '@opentelemetry/api';

const tracer = trace.getTracer('bookkeeper-service');

export function withSpan<T>(
  name: string,
  attributes: Attributes,
  fn: () => Promise<T>,
): Promise<T> {
  return tracer.startActiveSpan(name, { attributes }, async span => {
    try {
      return await fn();
    } catch (err) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: String(err) });
      span.recordException(err as Error);
      throw err;
    } finally {
      span.end();
    }
  });
}
