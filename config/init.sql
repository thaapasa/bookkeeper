-- PostgreSQL
CREATE USER bookkeeper WITH PASSWORD 'kakkuloskakahvit';
CREATE EXTENSION pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(128) UNIQUE,
  password VARCHAR(40),
  firstname VARCHAR(128),
  lastname VARCHAR(128)
);

INSERT INTO users (email, password, firstname, lastname) VALUES ('jenni@fi.fi',
                                                                 encode(digest('salasana', 'sha1'), 'hex'), 'Jenni', 'Haukio');
INSERT INTO users (email, password, firstname, lastname) VALUES ('sauli@fi.fi',
                                                                 encode(digest('salasana', 'sha1'), 'hex'), 'Sauli', 'Niinistö');
