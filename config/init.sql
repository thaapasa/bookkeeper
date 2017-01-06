-- PostgreSQL
CREATE USER bookkeeper WITH PASSWORD 'kakkuloskakahvit';
CREATE EXTENSION pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(128) UNIQUE NOT NULL,
  password VARCHAR(40) NOT NULL,
  first_name VARCHAR(128),
  last_name VARCHAR(128)
);
CREATE INDEX "users_email" ON users (email);

INSERT INTO users (email, password, first_name, last_name)
       VALUES ('jenni@fi.fi', encode(digest('salasana', 'sha1'), 'hex'), 'Jenni', 'Haukio');
INSERT INTO users (email, password, first_name, last_name)
       VALUES ('sauli@fi.fi', encode(digest('salasana', 'sha1'), 'hex'), 'Sauli', 'Niinistö');

CREATE TABLE IF NOT EXISTS sessions (
  token VARCHAR(40) PRIMARY KEY,
  user_id INTEGER REFERENCES users (id) NOT NULL,
  login_time TIMESTAMP WITH TIME ZONE NOT NULL,
  expiry_time TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX "sessions_token" ON sessions (token);
CREATE INDEX "sessions_expiry" ON sessions (expiry_time);

CREATE TABLE IF NOT EXISTS groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(128)
);
CREATE TABLE IF NOT EXISTS group_users (
  user_id INTEGER REFERENCES users (id) NOT NULL,
  group_id INTEGER REFERENCES groups (id) NOT NULL
);
CREATE INDEX "group_users_user_id" ON group_users(user_id);

INSERT INTO groups (name) VALUES ('Mäntyniemi');
INSERT INTO groups (name) VALUES ('Herrakerho');

INSERT INTO group_users (user_id, group_id) VALUES (1, 1);
INSERT INTO group_users (user_id, group_id) VALUES (2, 1);
INSERT INTO group_users (user_id, group_id) VALUES (2, 2);


CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  parent_id INTEGER REFERENCES categories(id) DEFAULT NULL,
  group_id INTEGER REFERENCES groups (id) NOT NULL,
  name VARCHAR(50) NOT NULL
);
CREATE INDEX "categories_group_id" ON categories (group_id);
INSERT INTO CATEGORIES (group_id, name) VALUES (1, 'Ruoka'), (1, 'Viihde'), (1, 'Asuminen') RETURNING id;
INSERT INTO CATEGORIES (parent_id, group_id, name) VALUES
  (1, 1, 'Työpaikkalounas'), (1, 1, 'Ravintola'), (1, 1, 'Ruokakauppa'),
  (2, 1, 'Lehtitilaukset'), (2, 1, 'Elokuvat ja sarjat'), (2, 1, 'Kirjat'),
  (3, 1, 'Lainanhoito'), (3, 1, 'Pakolliset'), (3, 1, 'Sisustus'), (3, 1, 'Rakentaminen'), (3, 1, 'Piha');

SELECT id, parent_id, name FROM categories WHERE group_id=1
ORDER BY (CASE WHEN parent_id IS NULL THEN 1 ELSE 0 END) DESC, parent_id ASC, name;


CREATE TABLE IF NOT EXISTS sources (
  id SERIAL PRIMARY KEY,
  group_id INTEGER REFERENCES users (id) NOT NULL,
  name VARCHAR(100) NOT NULL
);
CREATE INDEX "sources_group_id" ON sources (group_id);

CREATE TABLE IF NOT EXISTS source_users (
  source_id INTEGER REFERENCES sources (id) NOT NULL,
  user_id INTEGER REFERENCES users (id) NOT NULL,
  share INTEGER
);
CREATE INDEX "source_users_source_id_user_id" ON source_users (source_id, user_id);

INSERT INTO sources (group_id, name) VALUES (1, 'Yhteinen tili'), (1, 'Jennin tili'), (1, 'Salen tili') RETURNING id;
INSERT INTO source_users (source_id, user_id, share) VALUES (1, 1, 1), (1, 2, 1), (2, 1, 1), (3, 2, 1);

CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  group_id INTEGER REFERENCES groups (id) NOT NULL,
  user_id INTEGER REFERENCES users (id) NOT NULL,
  date DATE NOT NULL,
  created TIMESTAMP WITH TIME ZONE NOT NULL,
  receiver VARCHAR(50),
  sum MONEY NOT NULL,
  description VARCHAR(255),
  source_id INTEGER REFERENCES sources (id),
  category_id INTEGER REFERENCES categories (id)
);
CREATE INDEX "expenses_user_date" ON expenses (user_id, date);

CREATE TYPE expense_type AS ENUM ('cost', 'benefit');
CREATE TABLE IF NOT EXISTS expense_division (
  expense_id INTEGER REFERENCES expenses (id) ON DELETE CASCADE NOT NULL,
  user_id INTEGER REFERENCES users (id) NOT NULL,
  type expense_type NOT NULL,
  sum MONEY NOT NULL
);

