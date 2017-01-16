INSERT INTO groups (name) VALUES ('Mäntyniemi');
INSERT INTO groups (name) VALUES ('Herrakerho');

INSERT INTO users (username, email, password, first_name, last_name, default_group_id, image)
VALUES ('jenni', 'jenni@fi.fi', encode(digest('salasana', 'sha1'), 'hex'), 'Jenni', 'Haukio', 1, '1.png');
INSERT INTO users (username, email, password, first_name, last_name, default_group_id, image)
VALUES ('sale', 'sauli@fi.fi', encode(digest('salasana', 'sha1'), 'hex'), 'Sauli', 'Niinistö', 1, '2.jpg');

INSERT INTO group_users (user_id, group_id) VALUES (1, 1);
INSERT INTO group_users (user_id, group_id) VALUES (2, 1);
INSERT INTO group_users (user_id, group_id) VALUES (2, 2);

INSERT INTO CATEGORIES (group_id, name) VALUES (1, 'Ruoka'), (1, 'Viihde'), (1, 'Asuminen') RETURNING id;
INSERT INTO CATEGORIES (parent_id, group_id, name) VALUES
  (1, 1, 'Työpaikkalounas'), (1, 1, 'Ravintola'), (1, 1, 'Ruokakauppa'),
  (2, 1, 'Lehtitilaukset'), (2, 1, 'Elokuvat ja sarjat'), (2, 1, 'Kirjat'),
  (3, 1, 'Lainanhoito'), (3, 1, 'Pakolliset'), (3, 1, 'Sisustus'), (3, 1, 'Rakentaminen'), (3, 1, 'Piha');

INSERT INTO sources (group_id, name) VALUES (1, 'Yhteinen tili'), (1, 'Jennin tili'), (1, 'Salen tili') RETURNING id;
INSERT INTO source_users (source_id, user_id, share) VALUES (1, 1, 1), (1, 2, 1), (2, 1, 1), (3, 2, 1);
