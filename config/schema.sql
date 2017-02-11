CREATE TABLE IF NOT EXISTS groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(128)
);
COMMENT ON TABLE groups IS 'All expenses belong to a single group. Users can be part of many groups.';

CREATE TABLE IF NOT EXISTS sources (
  id SERIAL PRIMARY KEY,
  group_id INTEGER REFERENCES users (id) NOT NULL,
  name VARCHAR(100) NOT NULL,
  abbreviation VARCHAR(32) DEFAULT NULL,
  image VARCHAR(32) DEFAULT NULL
);
CREATE INDEX "sources_group_id" ON sources (group_id);
COMMENT ON TABLE sources IS 'Sources define how the costs of an expense are divided between group members';
COMMENT ON COLUMN sources.abbreviation IS 'Abbreviation is shown in lists if image is not defined';
COMMENT ON COLUMN sources.image IS 'Relative path to an image depicting the source';


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
COMMENT ON TABLE users IS 'Registered users';
COMMENT ON COLUMN users.username IS 'Username is used for logging in. Uniquely identifies the user.';
COMMENT ON COLUMN users.password IS 'Password is used for logging in. Stored value is password hashed with SHA1.';
COMMENT ON COLUMN users.default_group_id IS 'This group id is used when no other group id is specified.';
COMMENT ON COLUMN users.image IS 'Avatar image of user';

CREATE TABLE IF NOT EXISTS group_users (
  user_id INTEGER REFERENCES users (id) NOT NULL,
  group_id INTEGER REFERENCES groups (id) NOT NULL,
  default_source_id INTEGER REFERENCES sources (id) DEFAULT NULL
);
CREATE INDEX "group_users_user_id" ON group_users(user_id);
COMMENT ON TABLE group_users IS 'Links between users and groups.';
COMMENT ON COLUMN group_users.default_source_id IS 'Default source in expenses. May be initially selected in UI.';

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
COMMENT ON TABLE sessions IS 'Active sessions and expiry tokens.';
COMMENT ON COLUMN sessions.token IS 'Access token, used to authorize operations, if refresh_token is also specified. If refresh_token field is NULL, then this is the refresh token and may only be used to authorize session refresh.';


CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  parent_id INTEGER REFERENCES categories(id) DEFAULT NULL,
  group_id INTEGER REFERENCES groups (id) NOT NULL,
  name VARCHAR(50) NOT NULL
);
CREATE INDEX "categories_group_id" ON categories (group_id);
COMMENT ON TABLE categories IS 'Expense categories';




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
  title VARCHAR(255),
  description TEXT DEFAULT NULL,
  source_id INTEGER REFERENCES sources (id) NOT NULL,
  category_id INTEGER REFERENCES categories (id) NOT NULL
);
CREATE INDEX "expenses_group_date" ON expenses (group_id, date);
COMMENT ON TABLE expenses IS 'Expenses';

CREATE TABLE IF NOT EXISTS expense_division (
  expense_id INTEGER REFERENCES expenses (id) ON DELETE CASCADE NOT NULL,
  user_id INTEGER REFERENCES users (id) NOT NULL,
  type expense_type NOT NULL,
  sum MONEY NOT NULL
);
COMMENT ON TABLE expense_division IS 'Describes how each expense item is divided between group users';
