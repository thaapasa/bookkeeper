CREATE USER 'bookkeeper'@'localhost' IDENTIFIED BY 'kakkuloskakahvit';

CREATE DATABASE bookkeeper;

GRANT ALL PRIVILEGES ON  bookkeeper.* to 'bookkeeper'@'localhost' WITH GRANT OPTION;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(128),
  password VARCHAR(40),
  firstname VARCHAR(128),
  lastname VARCHAR(128),
  KEY email (email)
) engine=InnoDB default charset utf8;

INSERT INTO users (email, password, firstname, lastname) VALUES ('jenni@fi.fi', sha1('salasana'), 'Jenni', 'Haukio');

INSERT INTO users (email, password, firstname, lastname) VALUES ('sauli@fi.fi', sha1('salasana'), 'Sauli', 'Niinistö');

