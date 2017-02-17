SELECT s.token, s.user_id as id, s.login_time, u.username, u.email, u.first_name, u.last_name, g.id AS group_id, g.name as group_name FROM sessions s
            INNER JOIN users u ON (s.user_id = u.id)
            LEFT JOIN group_users go ON (go.user_id = u.id AND go.group_id = COALESCE(NULL, u.default_group_id))
            LEFT JOIN groups g ON (g.id = go.group_id)
            WHERE s.token='53112e213709cb7058491c02bf54de128a4d0d2c' AND s.expiry_time > NOW();

SELECT id, email, first_name, last_name FROM users
WHERE id=1 AND (SELECT COUNT(*) FROM group_users WHERE user_id=1 AND group_id=1) > 0;

SELECT id, parent_id, name FROM categories WHERE group_id=1
ORDER BY (CASE WHEN parent_id IS NULL THEN 1 ELSE 0 END) DESC, parent_id ASC, name;

-- Show all values in an enum type
SELECT enum_range(NULL::expense_type);


EXPLAIN ANALYZE
SELECT s.id, s.group_id, name, (SELECT SUM(share) FROM source_users WHERE source_id = s.id) AS shares, so.user_id, so.share
FROM sources s
  LEFT JOIN source_users so ON (so.source_id = s.id)
WHERE group_id = 1;

EXPLAIN ANALYZE
SELECT org.*, so.user_id, so.share
FROM (SELECT s.id, s.group_id, name, (SELECT SUM(share) FROM source_users WHERE source_id = s.id) AS shares FROM sources s WHERE group_id = 1) org
  LEFT JOIN source_users so ON (so.source_id = org.id);

-- Expenses between two dates
EXPLAIN ANALYSE
SELECT id, date::DATE, receiver, e.type, e.sum::MONEY::NUMERIC, title, description, confirmed,
    source_id, e.user_id, created_by_id, group_id, category_id, created,
  COALESCE(d1.sum, '0.00'::NUMERIC::MONEY)::MONEY::NUMERIC AS user_benefit,
  COALESCE(d2.sum, '0.00'::NUMERIC::MONEY)::MONEY::NUMERIC AS user_cost,
  COALESCE(d3.sum, '0.00'::NUMERIC::MONEY)::MONEY::NUMERIC AS user_income,
  COALESCE(d4.sum, '0.00'::NUMERIC::MONEY)::MONEY::NUMERIC AS user_split,
  (COALESCE(d1.sum, '0.00'::NUMERIC::MONEY) + COALESCE(d2.sum, '0.00'::NUMERIC::MONEY))::MONEY::NUMERIC AS user_value FROM expenses e
  LEFT JOIN expense_division d1 ON (d1.expense_id = e.id AND d1.user_id = 1 AND d1.type='benefit')
  LEFT JOIN expense_division d2 ON (d2.expense_id = e.id AND d2.user_id = 1 AND d2.type='cost')
  LEFT JOIN expense_division d3 ON (d3.expense_id = e.id AND d3.user_id = 1 AND d3.type='income')
  LEFT JOIN expense_division d4 ON (d4.expense_id = e.id AND d4.user_id = 1 AND d4.type='split')
  WHERE group_id=1 AND date >= '2017-01-01'::DATE AND date < '2017-03-01'::DATE ORDER BY DATE ASC;

EXPLAIN ANALYSE
SELECT MIN(id) AS id, MIN(date) AS date, MIN(receiver) AS receiver, MIN(type) AS type, MIN(sum) AS sum,
  MIN(title) AS title, MIN(description) AS description, BOOL_AND(confirmed) AS confirmed, MIN(source_id) AS source_id,
  MIN(user_id) AS user_id, MIN(created_by_id) AS created_by_id, MIN(group_id) AS group_id, MIN(category_id) AS category_id,
  MIN(created) AS created,
  SUM(cost) AS user_cost, SUM(benefit) AS user_benefit, SUM(income) AS user_income, SUM(split) AS user_split,
  SUM(cost + benefit + income + split) AS user_value
FROM
  (SELECT id, date::DATE, receiver, e.type, e.sum::MONEY::NUMERIC, title, description, confirmed,
  source_id, e.user_id, created_by_id, group_id, category_id, created,
  (CASE WHEN d.type = 'cost' THEN d.sum::NUMERIC ELSE 0::NUMERIC END) AS cost,
  (CASE WHEN d.type = 'benefit' THEN d.sum::NUMERIC ELSE 0::NUMERIC END) AS benefit,
  (CASE WHEN d.type = 'income' THEN d.sum::NUMERIC ELSE 0::NUMERIC END) AS income,
  (CASE WHEN d.type = 'split' THEN d.sum::NUMERIC ELSE 0::NUMERIC END) AS split
  FROM expenses e
  LEFT JOIN expense_division d ON (d.expense_id = e.id AND d.user_id = 1)
WHERE group_id=1 AND date >= '2017-01-01'::DATE AND date < '2017-03-01'::DATE ORDER BY DATE ASC) breakdown
GROUP BY id;


-- Totals as two subqueries
EXPLAIN ANALYSE
SELECT
  (SELECT COALESCE(SUM(sum), '0.00'::NUMERIC::MONEY)::MONEY::NUMERIC FROM expense_division
  WHERE expense_id IN (SELECT id FROM expenses WHERE group_id=1 AND date >= '2017-01-01'::DATE AND date < '2017-02-01'::DATE)
  AND type='benefit' AND user_id = 1) AS benefit,
  (SELECT COALESCE(SUM(sum), '0.00'::NUMERIC::MONEY)::MONEY::NUMERIC FROM expense_division
  WHERE expense_id IN (SELECT id FROM expenses WHERE group_id=1 AND date >= '2017-01-01'::DATE AND date < '2017-02-01'::DATE)
        AND type='cost' AND user_id = 1) AS cost;

-- Totals as joins and subqueries
EXPLAIN ANALYSE
SELECT
  COALESCE(SUM(benefit), '0.00'::NUMERIC::MONEY)::MONEY::NUMERIC as benefit,
  COALESCE(SUM(cost), '0.00'::NUMERIC::MONEY)::MONEY::NUMERIC AS cost FROM
  (SELECT e.sum, d1.sum AS benefit, d2.sum AS cost FROM expenses e
    LEFT JOIN expense_division d1 ON (d1.expense_id = e.id AND d1.user_id = 1 AND d1.type='benefit')
    LEFT JOIN expense_division d2 ON (d2.expense_id = e.id AND d2.user_id = 1 AND d2.type='cost')
    WHERE group_id=1 AND date >= '2017-01-01'::DATE AND date < '2017-02-01'::DATE) breakdown;

-- Totals as sum select from fully expanded table with different types as different columns
EXPLAIN ANALYSE
SELECT
  COALESCE(SUM(benefit), '0.00'::NUMERIC) as benefit,
  COALESCE(SUM(cost), '0.00'::NUMERIC) AS cost,
  COALESCE(SUM(income), '0.00'::NUMERIC) AS income,
  COALESCE(SUM(split), '0.00'::NUMERIC) AS split
FROM (SELECT
     (CASE WHEN d.type = 'cost' THEN d.sum::NUMERIC ELSE 0::NUMERIC END) AS cost,
     (CASE WHEN d.type = 'benefit' THEN d.sum::NUMERIC ELSE 0::NUMERIC END) AS benefit,
     (CASE WHEN d.type = 'income' THEN d.sum::NUMERIC ELSE 0::NUMERIC END) AS income,
     (CASE WHEN d.type = 'split' THEN d.sum::NUMERIC ELSE 0::NUMERIC END) AS split
   FROM expenses e
    LEFT JOIN expense_division d ON (d.expense_id = e.id AND d.user_id = 1)
  WHERE group_id=1 AND date >= '2017-01-01'::DATE AND date < '2017-03-01'::DATE) breakdown;


-- Find out if there are unconfirmed expenses
SELECT COUNT(*) FROM expenses WHERE group_id=1 AND date < '2017-03-01'::DATE AND confirmed=false;

-- Search receivers
SELECT receiver, COUNT(*) AS AMOUNT FROM expenses WHERE group_id=1 AND receiver ILIKE '%ke%' GROUP BY receiver ORDER BY amount DESC;
