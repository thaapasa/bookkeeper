
INSERT INTO users (email, password, first_name, last_name)
VALUES ('jenni@fi.fi', encode(digest('salasana', 'sha1'), 'hex'), 'Jenni', 'Haukio');
INSERT INTO users (email, password, first_name, last_name)
VALUES ('sauli@fi.fi', encode(digest('salasana', 'sha1'), 'hex'), 'Sauli', 'Niinistö');

SELECT id, email, first_name, last_name FROM users
  WHERE id=1 AND (SELECT COUNT(*) FROM group_users WHERE user_id=1 AND group_id=1) > 0;


INSERT INTO groups (name) VALUES ('Mäntyniemi');
INSERT INTO groups (name) VALUES ('Herrakerho');

INSERT INTO group_users (user_id, group_id) VALUES (1, 1);
INSERT INTO group_users (user_id, group_id) VALUES (2, 1);
INSERT INTO group_users (user_id, group_id) VALUES (2, 2);

INSERT INTO CATEGORIES (group_id, name) VALUES (1, 'Ruoka'), (1, 'Viihde'), (1, 'Asuminen') RETURNING id;
INSERT INTO CATEGORIES (parent_id, group_id, name) VALUES
  (1, 1, 'Työpaikkalounas'), (1, 1, 'Ravintola'), (1, 1, 'Ruokakauppa'),
  (2, 1, 'Lehtitilaukset'), (2, 1, 'Elokuvat ja sarjat'), (2, 1, 'Kirjat'),
  (3, 1, 'Lainanhoito'), (3, 1, 'Pakolliset'), (3, 1, 'Sisustus'), (3, 1, 'Rakentaminen'), (3, 1, 'Piha');

SELECT id, parent_id, name FROM categories WHERE group_id=1
ORDER BY (CASE WHEN parent_id IS NULL THEN 1 ELSE 0 END) DESC, parent_id ASC, name;
