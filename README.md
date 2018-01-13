# Kukkaro (bookkeeper)

## Kehitys

### Asetukset

Aseta gitin autorebase käyttöön:

```
git config branch.autosetuprebase always
git config branch.master.rebase true
```

Asenna kehitystyökalut:

```
npm install -g ts-node typescript nodemon tslint
```

### Palvelin

Luo tiedosto `.env` ja laita sinne sisällöksi (korjaa konffit vastaamaan omaa ympäristöä):
```
SERVER_PORT=3100
LOG_LEVEL=info
SHOW_ERROR_CAUSE=true
SESSION_TIMEOUT=20 minutes
DB_URL=postgresql://localhost/bookkeeper?user=bookkeeper&password=kakkuloskakahvit&ssl=false
DB_SSL=false
```

Käynnistä ajamalla `npm run watch:server`.

Lokitusta näkee kun asettaa `DEBUG`-ympäristömuuttujan, esim. `DEBUG=bookkeeper* npm run watch:server`.

### Appis

Käynnistä ajamalla `npm run start:client`.

Lokituksen saa näkyviin kun asettaa `localStorage`en konsolissa `debug`-muuttujaan
jonkun arvon, esim. `localStorage.debug = 'bookkeeper*'`.
