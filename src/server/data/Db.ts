import pgp from 'pg-promise';
import { config } from '../Config';

export const db = pgp()(config.dbUrl);
