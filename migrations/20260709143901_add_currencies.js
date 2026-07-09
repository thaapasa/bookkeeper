'use strict';

// EUR is deliberately not a row: expenses.currency_id IS NULL means the expense is in EUR.
// The seeded set is limited to codes present in the ECB daily reference rate feed, since
// those are the only ones that can be automatically converted.
exports.up = knex =>
  knex.raw(/*sql*/ `
    CREATE TABLE currencies (
      id SERIAL PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      symbol TEXT NOT NULL,
      name TEXT NOT NULL,
      country_code TEXT
    );

    INSERT INTO currencies (code, symbol, name, country_code) VALUES
      ('USD', '$',  'Yhdysvaltain dollari',      'US'),
      ('GBP', '£',  'Englannin punta',           'GB'),
      ('SEK', 'kr', 'Ruotsin kruunu',            'SE'),
      ('NOK', 'kr', 'Norjan kruunu',             'NO'),
      ('DKK', 'kr', 'Tanskan kruunu',            'DK'),
      ('ISK', 'kr', 'Islannin kruunu',           'IS'),
      ('CHF', 'Fr', 'Sveitsin frangi',           'CH');
 
    ALTER TABLE expenses
      ADD COLUMN currency_id INTEGER REFERENCES currencies(id),
      ADD COLUMN original_currency_value NUMERIC(10,2),
      ADD CONSTRAINT expenses_currency_pair_chk
        CHECK ((currency_id IS NULL) = (original_currency_value IS NULL));
  `);

exports.down = knex =>
  knex.raw(/*sql*/ `
    ALTER TABLE expenses
      DROP CONSTRAINT IF EXISTS expenses_currency_pair_chk,
      DROP COLUMN IF EXISTS original_currency_value,
      DROP COLUMN IF EXISTS currency_id;

    DROP TABLE IF EXISTS currencies;
  `);

/*
Full currency table for reference:

('USD', '$',  'Yhdysvaltain dollari',      'US'),
('GBP', '£',  'Englannin punta',           'GB'),
('SEK', 'kr', 'Ruotsin kruunu',            'SE'),
('NOK', 'kr', 'Norjan kruunu',             'NO'),
('DKK', 'kr', 'Tanskan kruunu',            'DK'),
('ISK', 'kr', 'Islannin kruunu',           'IS'),
('CHF', 'Fr', 'Sveitsin frangi',           'CH'),
('PLN', 'zł', 'Puolan złoty',              'PL'),
('CZK', 'Kč', 'Tšekin koruna',             'CZ'),
('HUF', 'Ft', 'Unkarin forintti',          'HU'),
('TRY', '₺',  'Turkin liira',              'TR'),
('JPY', '¥',  'Japanin jeni',              'JP'),
('CNY', '¥',  'Kiinan juan',               'CN'),
('HKD', '$',  'Hongkongin dollari',        'HK'),
('SGD', '$',  'Singaporen dollari',        'SG'),
('THB', '฿',  'Thaimaan baht',             'TH'),
('INR', '₹',  'Intian rupia',              'IN'),
('KRW', '₩',  'Etelä-Korean won',          'KR'),
('AUD', '$',  'Australian dollari',        'AU'),
('NZD', '$',  'Uuden-Seelannin dollari',   'NZ'),
('CAD', '$',  'Kanadan dollari',           'CA'),
('MXN', '$',  'Meksikon peso',             'MX'),
('BRL', 'R$', 'Brasilian real',            'BR'),
('ZAR', 'R',  'Etelä-Afrikan randi',       'ZA'),

*/
