SELECT s.token, s.user_id as id, s.login_time, u.username, u.email, u.first_name, u.last_name, g.id AS group_id, g.name as group_name FROM sessions s
            INNER JOIN users u ON (s.user_id = u.id)
            LEFT JOIN group_users go ON (go.user_id = u.id AND go.group_id = COALESCE(NULL, u.default_group_id))
            LEFT JOIN groups g ON (g.id = go.group_id)
            WHERE s.token='53112e213709cb7058491c02bf54de128a4d0d2c' AND s.expiry_time > NOW();
