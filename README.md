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

## Sum / balance calculation

Each expense has a sum stored in DB table `expenses.sum`, and a corresponding
division as rows in `expense_division`.

### Expense sum invariant

Expense sum is always non-negative.

### Expense division invariant

For each `expense_division.expense_id`, the sum `sum(expense_division.sum)` equals `0`.

### Expense types

There are three types of expenses: `expense`, `income`, and `transfer`.

- `expense`: user has purchased something. 
  The sum `sum(expense.sum)` for `expense.type = expense` gives the total cost of the registered
  expenses.
  Each `expense` is divided into `cost`s and `benefit`s:
    - `cost`: tracks who has paid for the expense
    - `benefit`: tracks who benefits from the purchase
- `income`: user has received income.
  The sum `sum(expense.sum)` for `expense.type = income` gives the total income of the registered
  expenses.
  Each `income` is divided into `income`s and `split`s:
    - `income`: tracks who has received the money
    - `split`: tracks who should benefit from the money
- `transfer`: money is transferred within the group.
  These expenses do not contribute to total cost or income, but they do affect user balance.
  Each `transfer` is divided into `transferor`s and `transferee`s:
    - `transferor`: tracks who has transferred the money
    - `transferee`: tracks who has received the money

#### Invariants

- For each expense with `expense.type = expense`:
    - The sum of division rows with `expense_division.type = cost` must equal `-expense.sum`
    - The sum of division rows with `expense_division.type = benefit` must equal `expense.sum`
- For each expense with `expense.type = income`:
    - The sum of division rows with `expense_division.type = income` must equal `expense.sum`
    - The sum of division rows with `expense_division.type = split` must equal `-expense.sum`
- For each expense with `expense.type = transfer`:
    - The sum of division rows with `expense_division.type = transferor` must equal `-expense.sum`
    - The sum of division rows with `expense_division.type = transferee` must equal `expense.sum`

### User balance / debts

For user `u` with id `u.id`, we define `user value` as the 
sum `sum(expense_division.sum)` of all division rows 
with `expense_division.user_id = u.id`.

A positive `user value` means that the user has gained more benefit than losses from the
registered expenses, and a negative value means that the user has paid for more than what
he has benefitted.

Thus, we further define `user balance` to equal `user value` negated, so that 
`user balance` means (semantically) what the user's current balance is (in regards to the
registered entries); a positive `user balance` means that the user is owed money, and 
a negative `user balance` means that the user is behind the budget and should pay for
shared expenses.
