/**
 * OpenTelemetry preload script for production.
 *
 * This file is loaded via `bun --preload` BEFORE the main server bundle,
 * ensuring that OTel instrumentation hooks are registered before any
 * instrumented modules (pg, express, http) are imported.
 *
 * In the bundled output, all static ESM imports are resolved before any
 * code executes, so OTel must be initialized in a separate preload file
 * to ensure it hooks into the module system before pg-promise is loaded.
 *
 * When OTEL_EXPORTER_OTLP_ENDPOINT is not set, this is a complete no-op.
 */
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import {
  ATTR_SERVICE_NAME,
  SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
} from '@opentelemetry/semantic-conventions';
import * as dotenv from 'dotenv';

dotenv.config();

const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

if (endpoint) {
  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || 'bookkeeper',
    [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: process.env.OTEL_ENVIRONMENT || 'production',
  });

  const sdk = new NodeSDK({
    resource,
    traceExporter: new OTLPTraceExporter(),
    instrumentations: [
      new HttpInstrumentation(),
      new ExpressInstrumentation(),
      new PgInstrumentation(),
    ],
  });

  sdk.start();

  // Store reference so the main app can shut it down
  (globalThis as Record<string, unknown>).__otelSdk = sdk;
}
