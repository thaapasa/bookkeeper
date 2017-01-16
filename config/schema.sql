CREATE TABLE IF NOT EXISTS groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(128)
);

CREATE TABLE IF NOT EXISTS sources (
  id SERIAL PRIMARY KEY,
  group_id INTEGER REFERENCES users (id) NOT NULL,
  name VARCHAR(100) NOT NULL
);
CREATE INDEX "sources_group_id" ON sources (group_id);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(32) UNIQUE NOT NULL,
  email VARCHAR(128) UNIQUE NOT NULL,
  password VARCHAR(40) NOT NULL,
  first_name VARCHAR(128),
  last_name VARCHAR(128),
  default_group_id INTEGER REFERENCES groups (id) DEFAULT NULL,
  image VARCHAR(32) DEFAULT NULL
);
CREATE INDEX "users_email" ON users (email);

CREATE TABLE IF NOT EXISTS group_users (
  user_id INTEGER REFERENCES users (id) NOT NULL,
  group_id INTEGER REFERENCES groups (id) NOT NULL,
  default_source_id INTEGER REFERENCES sources (id) DEFAULT NULL
);
CREATE INDEX "group_users_user_id" ON group_users(user_id);

CREATE TABLE IF NOT EXISTS source_users (
  source_id INTEGER REFERENCES sources (id) NOT NULL,
  user_id INTEGER REFERENCES users (id) NOT NULL,
  share INTEGER
);
CREATE INDEX "source_users_source_id_user_id" ON source_users (source_id, user_id);




CREATE TABLE IF NOT EXISTS sessions (
  token VARCHAR(40) PRIMARY KEY,
  user_id INTEGER REFERENCES users (id) NOT NULL,
  login_time TIMESTAMP WITH TIME ZONE NOT NULL,
  expiry_time TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX "sessions_token" ON sessions (token);
CREATE INDEX "sessions_expiry" ON sessions (expiry_time);


CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  parent_id INTEGER REFERENCES categories(id) DEFAULT NULL,
  group_id INTEGER REFERENCES groups (id) NOT NULL,
  name VARCHAR(50) NOT NULL
);
CREATE INDEX "categories_group_id" ON categories (group_id);




CREATE TYPE expense_type AS ENUM ('cost', 'benefit');

CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  group_id INTEGER REFERENCES groups (id) NOT NULL,
  user_id INTEGER REFERENCES users (id) NOT NULL,
  date DATE NOT NULL,
  created_by_id INTEGER REFERENCES users (id) NOT NULL,
  created TIMESTAMP WITH TIME ZONE NOT NULL,
  receiver VARCHAR(50),
  sum MONEY NOT NULL,
  description VARCHAR(255),
  source_id INTEGER REFERENCES sources (id) NOT NULL,
  category_id INTEGER REFERENCES categories (id) NOT NULL
);
CREATE INDEX "expenses_user_date" ON expenses (user_id, date);

CREATE TABLE IF NOT EXISTS expense_division (
  expense_id INTEGER REFERENCES expenses (id) ON DELETE CASCADE NOT NULL,
  user_id INTEGER REFERENCES users (id) NOT NULL,
  type expense_type NOT NULL,
  sum MONEY NOT NULL
);
