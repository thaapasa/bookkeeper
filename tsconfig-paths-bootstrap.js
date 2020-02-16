const tsConfig = require('./tsconfig.prod.json');
const tsConfigPaths = require('tsconfig-paths');

const baseUrl = './src'; // Either absolute or relative path. If relative it's resolved to current working directory.
tsConfigPaths.register({
  baseUrl,
  paths: tsConfig.compilerOptions.paths,
});
