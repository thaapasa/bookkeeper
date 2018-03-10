# Kukkaro (bookkeeper)

## Development

### Settings

Setup autorebase on `git`:

```sh
git config branch.autosetuprebase always
git config branch.master.rebase true
```

Install development tools:

```sh
npm install -g ts-node typescript nodemon tslint
```

### Server

Create file `.env` with the following contents (adjust as required):

```sh
SERVER_PORT=3100
LOG_LEVEL=info
SHOW_ERROR_CAUSE=true
SESSION_TIMEOUT=20 minutes
DB_URL=postgresql://localhost/bookkeeper?user=bookkeeper&password=kakkuloskakahvit&ssl=false
DB_SSL=false
DEBUG=bookkeeper*
```

Start server by running `npm run watch-server`.

The `DEBUG` switch (in `.env` or supplied as an environment variable) controls logging output.

### Client web app

Start development build by running `npm run start-client`.

You can see console logging by setting the `debug` variable to `localStorage`; 
for example: `localStorage.debug = 'bookkeeper*'`.

### npm scripts

`npm run <target>`:

- `watch-server`: Start server for development use (runs `ts-node` with `nodemon`)
- `watch-client`: Start client builder for development
- `build-server`: Build production version of server under `build-server/`
- `build-client`: Build production bundle of web app under `build/`
- `start-server-prod`: Starts the production server (requires that `build-server` has been run)
- `ps-server`: Shows the process number of the active server
- `kill-server`: Kills the running server instance (in case the port has not been released)

### Testing

- Unit tests: run `npm test`

## Images

- Source image (bank card): 52 x 34 px = 208 x 136 px @4x

