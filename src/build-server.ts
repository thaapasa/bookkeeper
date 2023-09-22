/* eslint-disable no-console */

async function bundle() {
  console.log('Bunding code');
  const build = await Bun.build({
    entrypoints: ['src/server/BookkeeperServer.ts'],
    outdir: './build-server',
    target: 'bun',
    sourcemap: 'external',
    external: ['sharp'],
  });

  for (const output of build.outputs) {
    console.log('Built file', output.path);
  }
}

bundle().catch(e => {
  console.log('Error building app', e);
});
