-- PostgreSQL
CREATE USER bookkeeper WITH PASSWORD 'kakkuloskakahvit';
CREATE EXTENSION pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(128) UNIQUE NOT NULL,
  password VARCHAR(40) NOT NULL,
  firstname VARCHAR(128),
  lastname VARCHAR(128)
);
CREATE INDEX "users_email" ON users (email);

INSERT INTO users (email, password, firstname, lastname)
       VALUES ('jenni@fi.fi', encode(digest('salasana', 'sha1'), 'hex'), 'Jenni', 'Haukio');
INSERT INTO users (email, password, firstname, lastname)
       VALUES ('sauli@fi.fi', encode(digest('salasana', 'sha1'), 'hex'), 'Sauli', 'Niinistö');

CREATE TABLE IF NOT EXISTS sessions (
  token VARCHAR(40) PRIMARY KEY,
  userid INTEGER REFERENCES users (id) NOT NULL,
  logintime TIMESTAMP WITH TIME ZONE NOT NULL,
  expirytime TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX "sessions_token" ON sessions (token);
CREATE INDEX "sessions_expiry" ON sessions (expirytime);

CREATE TABLE IF NOT EXISTS groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(128)
);
INSERT INTO groups (name) VALUES ('Mäntyniemi');
INSERT INTO groups (name) VALUES ('Herrakerho');

CREATE TABLE IF NOT EXISTS group_users (
  userid INTEGER REFERENCES users (id) NOT NULL,
  groupid INTEGER REFERENCES groups (id) NOT NULL
);
CREATE INDEX "group_users_userid" ON group_users(userid);

INSERT INTO group_users (userid, groupid) VALUES (1, 1);
INSERT INTO group_users (userid, groupid) VALUES (2, 1);
INSERT INTO group_users (userid, groupid) VALUES (2, 2);


CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  groupid INTEGER REFERENCES groups (id) NOT NULL,
  userid INTEGER REFERENCES users (id) NOT NULL,
  date DATE NOT NULL,
  created TIMESTAMP WITH TIME ZONE NOT NULL,
  receiver VARCHAR(50),
  sum MONEY NOT NULL,
  description VARCHAR(255),
  source VARCHAR(50),
  category VARCHAR(50)
);
CREATE INDEX "expenses_user_date" ON expenses (userid, date);

CREATE TYPE expense_type AS ENUM ('cost', 'benefit');
CREATE TABLE IF NOT EXISTS expense_division (
  expenseid INTEGER REFERENCES expenses (id) NOT NULL,
  userid INTEGER REFERENCES users (id) NOT NULL,
  type expense_type NOT NULL,
  sum MONEY NOT NULL
);


CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  parentid INTEGER REFERENCES categories(id) DEFAULT NULL,
  groupid INTEGER REFERENCES groups (id) NOT NULL,
  name VARCHAR(50) NOT NULL
);
CREATE INDEX "categories_groupid" ON categories (groupid);
INSERT INTO CATEGORIES (groupid, name) VALUES (1, 'Ruoka'), (1, 'Viihde'), (1, 'Asuminen') RETURNING id;
INSERT INTO CATEGORIES (parentid, groupid, name) VALUES
  (1, 1, 'Työpaikkalounas'), (1, 1, 'Ravintola'), (1, 1, 'Ruokakauppa'),
  (2, 1, 'Lehtitilaukset'), (2, 1, 'Elokuvat ja sarjat'), (2, 1, 'Kirjat'),
  (3, 1, 'Lainanhoito'), (3, 1, 'Pakolliset'), (3, 1, 'Sisustus'), (3, 1, 'Rakentaminen'), (3, 1, 'Piha');

SELECT id, parentid, name FROM categories WHERE groupid=1
  ORDER BY (CASE WHEN parentid IS NULL THEN 1 ELSE 0 END) DESC, parentid ASC, name;
