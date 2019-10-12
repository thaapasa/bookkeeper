import * as dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import * as bodyParser from 'body-parser';
import { config } from './Config';
import * as api from './Api';
import * as path from 'path';
import debugSetup from 'debug';
const debug = debugSetup('bookkeeper:server');

const curDir = process.cwd();
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));

api.registerAPI(app);
app.get(/\/p\/.*/, (_, res) => res.sendFile(path.join(curDir + '/public/index.html')));

try {
  app.listen(config.port, () => {
    debug('Kukkaro server started with configuration', config);
  });
} catch (er) {
  debug('Error in server:', er);
}
