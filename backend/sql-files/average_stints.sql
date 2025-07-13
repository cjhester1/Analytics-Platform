WITH game_info AS (
    -- Add game date and opponent team name
    SELECT 
        sc.game_id,
        sc.game_date,
        t."teamId" AS team_id,
        t."teamName" AS team_name,
        opp."teamName" AS opponent_name
    FROM game_schedule sc
    JOIN team t ON sc.home_id = t."teamId" OR sc.away_id = t."teamId"
    JOIN team opp ON (sc.home_id = opp."teamId" AND sc.away_id = t."teamId") OR (sc.away_id = opp."teamId" AND sc.home_id = t."teamId")
),
ranked_lineups AS (
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
        (12 * 60) AS stint_start_time,
        0 AS stint_end_time
    FROM player_names pn
),
stint_durations AS (
    -- Calculate stint duration and count for each player per game
    SELECT
        sc.game_id,
        sc.team_id,
        sc.player_name,
        sc.stint_number,  -- Include stint number for each game appearance
        COUNT(sc.stint_number) AS game_stints,  -- Total stints for each player in a given game
        SUM(sc.stint_start_time - sc.stint_end_time) AS total_stint_duration
    FROM stint_counter sc
    GROUP BY sc.game_id, sc.team_id, sc.player_name, sc.stint_number
),
total_player_stints AS (
    -- Calculate total stints and unique game dates for each player across all games
    SELECT
        sd.player_name,
        SUM(sd.game_stints) AS total_stints,  -- Sum up total stints across all games
        COUNT(DISTINCT gi.game_date) AS unique_game_dates  -- Count unique game dates for each player
    FROM stint_durations sd
    JOIN game_info gi ON sd.game_id = gi.game_id AND sd.team_id = gi.team_id
    GROUP BY sd.player_name
)
-- Final selection: calculate average stints per game and stint length in minutes:seconds format
SELECT 
    gi.game_date,
    gi.team_name AS team,
    gi.opponent_name AS opponent,
    sd.player_name,
    sd.stint_number,  -- Stint number for each appearance in a game
    tp.total_stints,  -- Total stints across all games for the player
    ROUND(tp.total_stints / (tp.unique_game_dates * 4), 2) AS avg_stints_per_game,  -- Divide total stints by (unique game dates * 4 periods)
    -- Convert average stint length to minutes and seconds
    FLOOR(AVG(sd.total_stint_duration / sd.game_stints) / 60) || ':' || LPAD(CAST(FLOOR(MOD(AVG(sd.total_stint_duration / sd.game_stints), 60)) AS TEXT), 2, '0') AS avg_stint_length
FROM stint_durations sd
JOIN game_info gi ON sd.game_id = gi.game_id AND sd.team_id = gi.team_id
JOIN total_player_stints tp ON sd.player_name = tp.player_name  -- Join total stints and unique game dates
GROUP BY gi.game_date, gi.team_name, gi.opponent_name, sd.player_name, sd.stint_number, tp.total_stints, tp.unique_game_dates
ORDER BY gi.game_date ASC, gi.team_name, sd.player_name;
