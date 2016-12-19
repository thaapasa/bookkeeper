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

CREATE TABLE IF NOT EXISTS sessions (
  token VARCHAR(40) PRIMARY KEY,
  userId INTEGER REFERENCES users (id),
  loginTime TIMESTAMP WITH TIME ZONE,
  expiryTime TIMESTAMP WITH TIME ZONE
);
CREATE INDEX "sessions_expiry" ON sessions (expiryTime);


CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  userId INTEGER REFERENCES users (id),
  date DATE,
  created TIMESTAMP WITH TIME ZONE,
  receiver VARCHAR(50),
  sum MONEY,
  description VARCHAR(255),
  source VARCHAR(50),
  category VARCHAR(50)
);
