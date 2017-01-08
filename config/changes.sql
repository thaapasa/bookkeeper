-- After 7.1.2017
ALTER TABLE users ADD COLUMN default_group_id INTEGER REFERENCES groups (id) DEFAULT NULL;
