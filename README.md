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
npm install -g ts-node typescript nodemon
```

### Palvelin

Käynnistä ajamalla `npm run watch:server`.

### Appis

Käynnistä ajamalla `npm run start:client`.
