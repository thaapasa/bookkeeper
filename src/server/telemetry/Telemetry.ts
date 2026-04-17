/**
 * OpenTelemetry initialization for Grafana Cloud.
 *
 * IMPORTANT: This module must be imported and initTelemetry() called
 * BEFORE any other server imports so that auto-instrumentations can
 * patch http and express modules.
 *
 * SQL spans are created manually in Db.ts via pg-promise event hooks
 * rather than using PgInstrumentation, because Bun's bundler hoists
 * external imports above initTelemetry() in production builds, so pg
 * is already loaded before the SDK can monkey-patch it.
 *
 * When OTEL_EXPORTER_OTLP_ENDPOINT is not set, this is a complete no-op.
 * The exporters auto-read OTEL_EXPORTER_OTLP_ENDPOINT and
 * OTEL_EXPORTER_OTLP_HEADERS from the environment.
 */
import * as dotenv from 'dotenv';

// Load env vars early so OTel config is available
dotenv.config();

import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import {
  ATTR_SERVICE_NAME,
  SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
} from '@opentelemetry/semantic-conventions';

// Fail fast when Grafana is slow or unreachable so the exporter cannot stall
// the request path at startup (SDK defaults are 10s exporter / 30s BSP export).
const EXPORT_TIMEOUT_MS = 3000;

let sdk: NodeSDK | undefined;

export function initTelemetry(): void {
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  if (!endpoint) {
    return;
  }

  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || 'bookkeeper',
    [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: process.env.OTEL_ENVIRONMENT || 'development',
  });

  const spanProcessor = new BatchSpanProcessor(
    new OTLPTraceExporter({ timeoutMillis: EXPORT_TIMEOUT_MS }),
    { exportTimeoutMillis: EXPORT_TIMEOUT_MS },
  );

  sdk = new NodeSDK({
    resource,
    spanProcessors: [spanProcessor],
    instrumentations: [new HttpInstrumentation(), new ExpressInstrumentation()],
  });

  sdk.start();
}

export async function shutdownTelemetry(): Promise<void> {
  if (sdk) {
    await sdk.shutdown();
  }
}
