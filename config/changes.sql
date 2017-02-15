-- After 7.1.2017
ALTER TABLE users ADD COLUMN default_group_id INTEGER REFERENCES groups (id) DEFAULT NULL;
ALTER TABLE group_users ADD COLUMN default_source_id INTEGER REFERENCES sources (id) DEFAULT NULL;

-- After 15.1.2017
ALTER TABLE users ADD COLUMN image VARCHAR(32) DEFAULT NULL;
UPDATE USERS SET image='1.png' WHERE id=1;
UPDATE USERS SET image='2.jpg' WHERE id=2;

-- On 21.1.2017
ALTER TABLE sources ADD COLUMN abbreviation VARCHAR(32) DEFAULT NULL;
ALTER TABLE sources ADD COLUMN image VARCHAR(32) DEFAULT NULL;

-- On 8.2.2017
DROP INDEX "expenses_user_date" CASCADE;
CREATE INDEX "expenses_group_date" ON expenses (group_id, date);
ALTER TABLE expenses RENAME COLUMN description TO title;
ALTER TABLE expenses ADD COLUMN description TEXT DEFAULT NULL;

-- On 11.2.2017
ALTER TABLE sessions ADD COLUMN refresh_token VARCHAR(40);
CREATE INDEX "sessions_refresh_token" ON sessions (refresh_token);

-- On 13.2.2017
ALTER TABLE expenses ADD COLUMN confirmed BOOLEAN NOT NULL DEFAULT TRUE;

-- On 14.2.2017
CREATE TYPE expense_division_type AS ENUM ('cost', 'benefit', 'income', 'split');
ALTER TABLE expense_division ALTER COLUMN type TYPE expense_division_type USING (type::TEXT::expense_division_type);
DROP TYPE expense_type;
CREATE TYPE expense_type AS ENUM ('expense', 'income');
ALTER TABLE expenses ADD COLUMN type expense_type NOT NULL DEFAULT 'expense';

-- On 15.2.2017
CREATE TYPE recurring_period AS ENUM ('monthly', 'yearly');
CREATE TABLE IF NOT EXISTS recurring_expenses (
  id SERIAL PRIMARY KEY,
  template_expense_id INTEGER REFERENCES expenses(id) ON DELETE CASCADE NOT NULL,
  group_id INTEGER REFERENCES groups(id) NOT NULL,
  period recurring_period NOT NULL,
  occurs_until DATE DEFAULT NULL,
  next_missing DATE DEFAULT NULL
);
ALTER TABLE expenses ADD COLUMN recurring_expense_id INTEGER REFERENCES recurring_expenses(id) DEFAULT NULL;
ALTER TABLE expenses ADD COLUMN template BOOLEAN NOT NULL DEFAULT FALSE;
DROP INDEX "expenses_group_date";
CREATE INDEX "expenses_group_date" ON expenses (group_id, template, date);
