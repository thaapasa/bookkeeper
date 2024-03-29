'use strict';

/* eslint-disable no-undef  */

exports.seed = knex =>
  knex.raw(/*sql*/ `
  INSERT INTO groups (name) VALUES ('Mäntyniemi');
  INSERT INTO groups (name) VALUES ('Herrakerho');

  INSERT INTO users (username, email, password, first_name, last_name, default_group_id, image)
    VALUES ('jenni', 'jenni@fi.fi', encode(digest('salasana', 'sha1'), 'hex'), 'Jenni', 'Haukio', 1, '1.png');
  INSERT INTO users (username, email, password, first_name, last_name, default_group_id, image)
    VALUES ('sale', 'sauli@fi.fi', encode(digest('salasana', 'sha1'), 'hex'), 'Sauli', 'Niinistö', 1, '2.jpg');
  INSERT INTO shortcuts (user_id, group_id, title, expense)
    VALUES (2, 1,
      'S-market', 
      '{"sum":"79.36","title":"Ruokaostokset","benefit":[1,2],"receiver":"S-market","sourceId":3,"categoryId":1,"description":"Kävin kotimatkalla kaupassa","subcategoryId":6}'::JSONB
    );

  INSERT INTO sources (group_id, name, image) VALUES 
    (1, 'Yhteinen tili', 'spankki.png'),
    (1, 'Jennin tili', 'op-white.png'),
    (1, 'Salen tili', 'op-orange.png') RETURNING id;
  INSERT INTO source_users (source_id, user_id, share) VALUES
    (1, 1, 1), (1, 2, 1), (2, 1, 1), (3, 2, 1);

  INSERT INTO group_users (user_id, group_id, default_source_id) VALUES (1, 1, 1);
  INSERT INTO group_users (user_id, group_id, default_source_id) VALUES (2, 1, 1);
  INSERT INTO group_users (user_id, group_id, default_source_id) VALUES (2, 2, 2);

  INSERT INTO CATEGORIES (group_id, name) VALUES
    (1, 'Ruoka'), (1, 'Viihde'), (1, 'Asuminen')
    RETURNING id;

  INSERT INTO CATEGORIES (parent_id, group_id, name) VALUES
    (1, 1, 'Työpaikkalounas'), (1, 1, 'Ravintola'), (1, 1, 'Ruokakauppa'),
    (2, 1, 'Lehtitilaukset'), (2, 1, 'Elokuvat ja sarjat'), (2, 1, 'Kirjat'),
    (3, 1, 'Lainanhoito'), (3, 1, 'Pakolliset'), (3, 1, 'Sisustus'), (3, 1, 'Rakentaminen'), (3, 1, 'Piha');
`);
