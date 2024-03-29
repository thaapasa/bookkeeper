'use strict';

/* eslint-disable no-undef */

exports.up = knex =>
  knex.raw(/*sql*/ `
  CREATE EXTENSION pgcrypto;

  CREATE TYPE recurring_period AS ENUM ('monthly', 'yearly');
  COMMENT ON TYPE recurring_period IS 'How often a recurring expense occurs';

  CREATE TYPE expense_type AS ENUM ('expense', 'income', 'transfer');
  COMMENT ON TYPE expense_type IS 'Expense is split to cost and benefit, income is split to income and split, transfer is split to transferor and transferee';

  CREATE TYPE expense_division_type AS ENUM ('cost', 'benefit', 'income', 'split', 'transferor', 'transferee');
  COMMENT ON TYPE expense_division_type IS 'Expenses are divided into items of this type. Cost (negative) and benefit (positive) must sum to zero; similarly income (positive) and split (negative); transferor (-) and transferee (+).';


  CREATE TABLE IF NOT EXISTS groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(128)
  );
  COMMENT ON TABLE groups IS 'All idnses belong to a single group. Users can be part of many groups.';


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
  COMMENT ON TABLE users IS 'Registered users';
  COMMENT ON COLUMN users.username IS 'Username is used for logging in. Uniquely identifies the user.';
  COMMENT ON COLUMN users.password IS 'Password is used for logging in. Stored value is password hashed with SHA1.';
  COMMENT ON COLUMN users.default_group_id IS 'This group id is used when no other group id is specified.';
  COMMENT ON COLUMN users.image IS 'Avatar image of user';

  DROP INDEX IF EXISTS users_email;
  CREATE INDEX users_email ON users (email);


  CREATE TABLE IF NOT EXISTS sources (
    id SERIAL PRIMARY KEY,
    group_id INTEGER REFERENCES users (id) NOT NULL,
    name VARCHAR(100) NOT NULL,
    abbreviation VARCHAR(32) DEFAULT NULL,
    image VARCHAR(32) DEFAULT NULL
  );
  COMMENT ON TABLE sources IS 'Sources define how the costs of an expense are divided between group members';
  COMMENT ON COLUMN sources.abbreviation IS 'Abbreviation is shown in lists if image is not defined';
  COMMENT ON COLUMN sources.image IS 'Relative path to an image depicting the source';

  DROP INDEX IF EXISTS sources_group_id;
  CREATE INDEX sources_group_id ON sources (group_id);


  CREATE TABLE IF NOT EXISTS group_users (
    user_id INTEGER REFERENCES users (id) NOT NULL,
    group_id INTEGER REFERENCES groups (id) NOT NULL,
    default_source_id INTEGER REFERENCES sources (id) DEFAULT NULL
  );
  COMMENT ON TABLE group_users IS 'Links between users and groups.';
  COMMENT ON COLUMN group_users.default_source_id IS 'Default source in expenses. May be initially selected in UI.';

  DROP INDEX IF EXISTS group_users_user_id;
  CREATE INDEX group_users_user_id ON group_users (user_id);

  CREATE TABLE IF NOT EXISTS source_users (
    source_id INTEGER REFERENCES sources (id) NOT NULL,
    user_id INTEGER REFERENCES users (id) NOT NULL,
    share INTEGER
  );

  DROP INDEX IF EXISTS source_users_source_id_user_id;
  CREATE INDEX source_users_source_id_user_id ON source_users (source_id, user_id);


  CREATE TABLE IF NOT EXISTS sessions (
    token VARCHAR(40) PRIMARY KEY,
    refresh_token VARCHAR(40),
    user_id INTEGER REFERENCES users (id) NOT NULL,
    login_time TIMESTAMP WITH TIME ZONE NOT NULL,
    expiry_time TIMESTAMP WITH TIME ZONE NOT NULL
  );
  COMMENT ON TABLE sessions IS 'Active sessions and expiry tokens.';
  COMMENT ON COLUMN sessions.token IS 'Access token, used to authorize operations, if refresh_token is also specified. If refresh_token field is NULL, then this is the refresh token and may only be used to authorize session refresh.';
  COMMENT ON COLUMN sessions.refresh_token IS 'Refresh token linked to this session. There should also be a row b with b.refresh_token=this.token and b.refresh_token=NULL.';

  DROP INDEX IF EXISTS sessions_token;
  CREATE INDEX sessions_token ON sessions (token);

  DROP INDEX IF EXISTS sessions_refresh_token;
  CREATE INDEX sessions_refresh_token ON sessions (refresh_token);
  
  DROP INDEX IF EXISTS sessions_expiry;
  CREATE INDEX sessions_expiry ON sessions (expiry_time);


  CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER REFERENCES categories(id) DEFAULT NULL,
    group_id INTEGER REFERENCES groups (id) NOT NULL,
    name VARCHAR(50) NOT NULL
  );
  COMMENT ON TABLE categories IS 'Expense categories';

  DROP INDEX IF EXISTS categories_group_id;
  CREATE INDEX categories_group_id ON categories (group_id);


  CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    group_id INTEGER REFERENCES groups (id) NOT NULL,
    user_id INTEGER REFERENCES users (id) NOT NULL,
    type expense_type NOT NULL DEFAULT 'expense',
    date DATE NOT NULL,
    created_by_id INTEGER REFERENCES users (id) NOT NULL,
    created TIMESTAMP WITH TIME ZONE NOT NULL,
    receiver VARCHAR(50),
    confirmed BOOLEAN NOT NULL DEFAULT TRUE,
    template BOOLEAN NOT NULL DEFAULT FALSE,
    sum MONEY NOT NULL,
    title VARCHAR(255),
    description TEXT DEFAULT NULL,
    source_id INTEGER REFERENCES sources (id) NOT NULL,
    category_id INTEGER REFERENCES categories (id) NOT NULL
  );
  COMMENT ON TABLE expenses IS 'Expenses';
  COMMENT ON COLUMN expenses.confirmed IS 'Unconfirmed expenses may trigger a warning in the UI';
  COMMENT ON COLUMN expenses.template IS 'Templates are not included in calculations';

  DROP INDEX IF EXISTS expenses_group_date;
  CREATE INDEX expenses_group_date ON expenses (group_id, template, date);


  CREATE TABLE IF NOT EXISTS expense_division (
    expense_id INTEGER REFERENCES expenses (id) ON DELETE CASCADE NOT NULL,
    user_id INTEGER REFERENCES users (id) NOT NULL,
    type expense_division_type NOT NULL,
    sum MONEY NOT NULL
  );
  COMMENT ON TABLE expense_division IS 'Describes how each expense item is divided between group users';


  CREATE TABLE IF NOT EXISTS recurring_expenses (
    id SERIAL PRIMARY KEY,
    template_expense_id INTEGER REFERENCES expenses(id) ON DELETE CASCADE NOT NULL,
    group_id INTEGER REFERENCES groups(id) NOT NULL,
    period recurring_period NOT NULL,
    occurs_until DATE DEFAULT NULL,
    next_missing DATE DEFAULT NULL
  );
  COMMENT ON TABLE recurring_expenses IS 'Defines which expenses are recurring and how often they occur';
  COMMENT ON COLUMN recurring_expenses.template_expense_id IS 'Expense data is copied from this expense when creating a new copy of the expense';
  COMMENT ON COLUMN recurring_expenses.period IS 'How often the expense recurs';
  COMMENT ON COLUMN recurring_expenses.occurs_until IS 'Expenses will be generated up to this point (not past this date)';
  COMMENT ON COLUMN recurring_expenses.next_missing IS 'Tells the next data for which an expense is yet to be generated';

  ALTER TABLE expenses ADD COLUMN recurring_expense_id INTEGER REFERENCES recurring_expenses(id) DEFAULT NULL;
`);

exports.down = knex =>
  knex.raw(`
  DROP TABLE cannot_rollback_this_migration;
`);
