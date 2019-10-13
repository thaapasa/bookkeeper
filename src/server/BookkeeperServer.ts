import * as dotenv from 'dotenv';
dotenv.config();

import * as bodyParser from 'body-parser';
import debug from 'debug';
import express from 'express';
import * as path from 'path';
import * as api from './Api';
import { config } from './Config';

const log = debug('bookkeeper:server');

const curDir = process.cwd();
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));

api.registerAPI(app);
app.get(/\/p\/.*/, (_, res) =>
  res.sendFile(path.join(curDir + '/public/index.html'))
);

try {
  app.listen(config.port, () => {
    log('Kukkaro server started with configuration', config);
  });
} catch (er) {
  log('Error in server:', er);
}
