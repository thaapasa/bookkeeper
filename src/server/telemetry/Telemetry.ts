/**
 * OpenTelemetry initialization for Grafana Cloud.
 *
 * IMPORTANT: This module must be imported and initTelemetry() called
 * BEFORE any other server imports so that auto-instrumentations can
 * patch http, express, pg, and pino modules.
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
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import {
  ATTR_SERVICE_NAME,
  SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
} from '@opentelemetry/semantic-conventions';

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

  sdk = new NodeSDK({
    resource,
    traceExporter: new OTLPTraceExporter(),
    instrumentations: [
      new HttpInstrumentation(),
      new ExpressInstrumentation(),
      new PgInstrumentation(),
    ],
  });

  sdk.start();
}

export async function shutdownTelemetry(): Promise<void> {
  if (sdk) {
    await sdk.shutdown();
  }
}
