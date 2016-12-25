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

INSERT INTO users (email, password, firstname, lastname)
       VALUES ('jenni@fi.fi', encode(digest('salasana', 'sha1'), 'hex'), 'Jenni', 'Haukio');
INSERT INTO users (email, password, firstname, lastname)
       VALUES ('sauli@fi.fi', encode(digest('salasana', 'sha1'), 'hex'), 'Sauli', 'Niinistö');

CREATE TABLE IF NOT EXISTS sessions (
  token VARCHAR(40) PRIMARY KEY,
  userid INTEGER REFERENCES users (id),
  logintime TIMESTAMP WITH TIME ZONE,
  expirytime TIMESTAMP WITH TIME ZONE
);
CREATE INDEX "sessions_expiry" ON sessions (expirytime);

CREATE TABLE IF NOT EXISTS groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(128)
);
INSERT INTO groups (name) VALUES ('Mäntyniemi');
INSERT INTO groups (name) VALUES ('Herrakerho');

CREATE TABLE IF NOT EXISTS group_users (
  userid INTEGER REFERENCES users (id),
  groupid INTEGER REFERENCES groups (id)
);
CREATE INDEX "group_users_userid" ON group_users(userid);

INSERT INTO group_users (userid, groupid) VALUES (1, 1);
INSERT INTO group_users (userid, groupid) VALUES (2, 1);
INSERT INTO group_users (userid, groupid) VALUES (2, 2);


CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  userid INTEGER REFERENCES users (id),
  date DATE,
  created TIMESTAMP WITH TIME ZONE,
  receiver VARCHAR(50),
  sum MONEY,
  description VARCHAR(255),
  source VARCHAR(50),
  category VARCHAR(50)
);
CREATE INDEX "expenses_user_date" ON expenses (userid, date);
