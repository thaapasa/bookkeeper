/* eslint-disable no-console */

async function bundle() {
  console.log('Bunding code');
  const build = await Bun.build({
    entrypoints: ['src/server/BookkeeperServer.ts'],
    outdir: './build-server',
    target: 'bun',
    sourcemap: 'external',
    external: [
      'sharp',
      // OTel + pg must remain as runtime require() calls so that
      // auto-instrumentation can monkey-patch pg for SQL spans
      'pg',
      'pg-promise',
      '@opentelemetry/api',
      '@opentelemetry/sdk-node',
      '@opentelemetry/exporter-trace-otlp-http',
      '@opentelemetry/instrumentation-express',
      '@opentelemetry/instrumentation-http',
      '@opentelemetry/instrumentation-pg',
      '@opentelemetry/resources',
      '@opentelemetry/semantic-conventions',
    ],
  });

  for (const output of build.outputs) {
    console.log('Built file', output.path);
  }
}

bundle().catch(e => {
  console.log('Error building app', e);
});
