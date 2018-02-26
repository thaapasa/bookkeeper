# Kukkaro (bookkeeper)

## Kehitys

### Asetukset

Aseta gitin autorebase käyttöön:

```sh
git config branch.autosetuprebase always
git config branch.master.rebase true
```

Asenna kehitystyökalut:

```sh
npm install -g ts-node typescript nodemon tslint
```

### Palvelin

Luo tiedosto `.env` ja laita sinne sisällöksi (korjaa konffit vastaamaan omaa ympäristöä):

```sh
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

### Skriptit

`npm run <target>`:

- `watch-server`: Käynnistää palvelimen kehitystä varten (ajaa `nodemon`in avulla `ts-node`a)
- `watch-client`: Käynnistää appiksen kehitystä varten
- `build-server`: Kääntää palvelimesta prod-buildin hakemistoon `build-server/`
- `build-client`: Kääntää appiksesta prod-buildin hakemistoon `build/`
- `start-server-prod`: Käynnistää prod-buildatun palvelimen (vaatii että `build-server` on ajettu)
- `ps-server`: Listaa ajossa olevan kehityspalvelimen prosessinumeron
- `kill-server`: Tappaa ajossa olevan kehityspalvelimen (aja jos palvelimen portti ei ole vapautunut)

### Testaus

- Yksikkötestit: Aja `npm test`
- Palvelimen testit: TODO

## Kuvat

- Lähde (kortti): 52 x 34 px = 208 x 136 px @4x
