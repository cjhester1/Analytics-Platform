WITH ranked_lineups AS (
    SELECT 
        l.game_id,
        l.team_id,
        l.lineup_num,
        l.period,
        l.time_in,
        l.time_out,
        l.player_id,
        ROW_NUMBER() OVER (PARTITION BY l.game_id, l.team_id, l.lineup_num, l.period ORDER BY l.player_id) AS player_rank
    FROM lineup l
),
full_period_stints AS (
    SELECT
        rl.game_id,
        rl.team_id,
        rl.period,
        rl.player_id,
        COUNT(DISTINCT rl.lineup_num) AS lineup_appearance_count,
        (SELECT COUNT(DISTINCT lineup_num) FROM ranked_lineups WHERE game_id = rl.game_id AND team_id = rl.team_id AND period = rl.period) AS total_lineups
    FROM ranked_lineups rl
    GROUP BY rl.game_id, rl.team_id, rl.period, rl.player_id
    HAVING COUNT(DISTINCT rl.lineup_num) = (SELECT COUNT(DISTINCT lineup_num) FROM ranked_lineups WHERE game_id = rl.game_id AND team_id = rl.team_id AND period = rl.period)
),
player_names AS (
    SELECT 
        fps.game_id,
        fps.team_id,
        fps.period,
        fps.player_id,
        p.first_name || ' ' || p.last_name AS player_name
    FROM full_period_stints fps
    JOIN player p ON fps.player_id = p.player_id
),
stint_counter AS (
    SELECT 
        pn.game_id,
        pn.team_id,
        pn.period,
        pn.player_name,
        ROW_NUMBER() OVER (PARTITION BY pn.game_id, pn.team_id, pn.player_name ORDER BY pn.period) AS stint_number,
        (12 * 60) AS stint_start_time,  -- Convert 12 minutes into 720 seconds
        0 AS stint_end_time  -- End of the period is 0 seconds
    FROM player_names pn
),
game_info AS (
    SELECT 
        sc.game_id,
        sc.game_date,
        t."teamId" AS team_id,
        t."teamName" AS team_name,
        opp."teamName" AS opponent_name
    FROM game_schedule sc
    JOIN team t ON sc.home_id = t."teamId" OR sc.away_id = t."teamId"
    JOIN team opp ON (sc.home_id = opp."teamId" AND sc.away_id = t."teamId") OR (sc.away_id = opp."teamId" AND sc.home_id = t."teamId")
)
-- Final selection
SELECT 
    gi.game_date,
    gi.team_name AS team,
    gi.opponent_name AS opponent,
    sc.player_name,
    sc.period,
    sc.stint_number,
    sc.stint_start_time,  -- Now showing as seconds
    sc.stint_end_time  -- Now showing as seconds
FROM stint_counter sc
JOIN game_info gi ON sc.game_id = gi.game_id AND sc.team_id = gi.team_id
ORDER BY gi.game_date ASC, gi.team_name, sc.player_name, sc.period;
