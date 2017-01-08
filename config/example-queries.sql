SELECT s.token, s.user_id as id, s.login_time, u.username, u.email, u.first_name, u.last_name, g.id AS group_id, g.name as group_name FROM sessions s
            INNER JOIN users u ON (s.user_id = u.id)
            LEFT JOIN group_users go ON (go.user_id = u.id AND go.group_id = COALESCE(NULL, u.default_group_id))
            LEFT JOIN groups g ON (g.id = go.group_id)
            WHERE s.token='53112e213709cb7058491c02bf54de128a4d0d2c' AND s.expiry_time > NOW();

SELECT id, email, first_name, last_name FROM users
WHERE id=1 AND (SELECT COUNT(*) FROM group_users WHERE user_id=1 AND group_id=1) > 0;

SELECT id, parent_id, name FROM categories WHERE group_id=1
ORDER BY (CASE WHEN parent_id IS NULL THEN 1 ELSE 0 END) DESC, parent_id ASC, name;


EXPLAIN ANALYZE
SELECT s.id, s.group_id, name, (SELECT SUM(share) FROM source_users WHERE source_id = s.id) AS shares, so.user_id, so.share
FROM sources s
  LEFT JOIN source_users so ON (so.source_id = s.id)
WHERE group_id = 1;

EXPLAIN ANALYZE
SELECT org.*, so.user_id, so.share
FROM (SELECT s.id, s.group_id, name, (SELECT SUM(share) FROM source_users WHERE source_id = s.id) AS shares FROM sources s WHERE group_id = 1) org
  LEFT JOIN source_users so ON (so.source_id = org.id);

