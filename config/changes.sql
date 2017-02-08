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
