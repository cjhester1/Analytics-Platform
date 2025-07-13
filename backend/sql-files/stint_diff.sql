WITH game_info AS (
    -- Add game date and opponent team name, including win/loss determination
    SELECT 
        sc.game_id,
        sc.game_date,
        t."teamId" AS team_id,
        t."teamName" AS team_name,
        opp."teamName" AS opponent_name,
        CASE 
            WHEN sc.home_id = t."teamId" AND sc.home_score > sc.away_score THEN 'win'
            WHEN sc.away_id = t."teamId" AND sc.away_score > sc.home_score THEN 'win'
            ELSE 'loss'
        END AS result
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
        COUNT(DISTINCT gi.game_date) AS unique_game_dates,  -- Count unique game dates for each player
        -- Calculate win/loss stints and durations
        SUM(CASE WHEN gi.result = 'win' THEN sd.game_stints ELSE 0 END) AS total_stints_wins,
        SUM(CASE WHEN gi.result = 'loss' THEN sd.game_stints ELSE 0 END) AS total_stints_losses,
        SUM(CASE WHEN gi.result = 'win' THEN sd.total_stint_duration ELSE 0 END) AS total_stint_duration_wins,
        SUM(CASE WHEN gi.result = 'loss' THEN sd.total_stint_duration ELSE 0 END) AS total_stint_duration_losses,
        COUNT(DISTINCT CASE WHEN gi.result = 'win' THEN gi.game_id ELSE NULL END) AS win_games,
        COUNT(DISTINCT CASE WHEN gi.result = 'loss' THEN gi.game_id ELSE NULL END) AS loss_games
    FROM stint_durations sd
    JOIN game_info gi ON sd.game_id = gi.game_id AND sd.team_id = gi.team_id
    GROUP BY sd.player_name
)
-- Final selection: calculate average stints and stint lengths for all games, wins, losses, and the difference
SELECT 
    tp.player_name,
    tp.unique_game_dates,  -- Number of unique game dates
    tp.total_stints,  -- Total stints across all games
    ROUND(tp.total_stints / (tp.unique_game_dates), 2) AS avg_stints_per_game_all,  -- Corrected: average stints per game
    -- Handle division by zero for win_games and convert to minutes:seconds
    CASE 
        WHEN tp.win_games > 0 THEN 
            FLOOR(SUM(tp.total_stint_duration_wins) / (tp.win_games) / 60)::TEXT || ':' || LPAD(FLOOR(MOD(SUM(tp.total_stint_duration_wins) / (tp.win_games), 60))::TEXT, 2, '0')
        ELSE '0:00' 
    END AS avg_stint_length_wins,  -- Average stint length for wins in minutes:seconds
    -- Handle division by zero for loss_games and convert to minutes:seconds
    CASE 
        WHEN tp.loss_games > 0 THEN 
            FLOOR(SUM(tp.total_stint_duration_losses) / (tp.loss_games) / 60)::TEXT || ':' || LPAD(FLOOR(MOD(SUM(tp.total_stint_duration_losses) / (tp.loss_games), 60))::TEXT, 2, '0')
        ELSE '0:00'
    END AS avg_stint_length_losses,  -- Average stint length for losses in minutes:seconds
    -- Handle division by zero for win_games and loss_games for average stints
    CASE 
        WHEN tp.win_games > 0 THEN ROUND(tp.total_stints_wins / (tp.win_games), 2) 
        ELSE 0 
    END AS avg_stints_per_game_wins,  -- Corrected: average stints per game in wins
    CASE 
        WHEN tp.loss_games > 0 THEN ROUND(tp.total_stints_losses / (tp.loss_games), 2) 
        ELSE 0 
    END AS avg_stints_per_game_losses,  -- Corrected: average stints per game in losses
    -- Calculate the difference between wins and losses
    ROUND(CASE 
        WHEN tp.win_games > 0 THEN tp.total_stints_wins / (tp.win_games) 
        ELSE 0 
    END - 
    CASE 
        WHEN tp.loss_games > 0 THEN tp.total_stints_losses / (tp.loss_games)
        ELSE 0
    END, 2) AS stint_diff_wins_losses  -- Difference in stints per game between wins and losses
FROM total_player_stints tp
GROUP BY tp.player_name, tp.unique_game_dates, tp.total_stints, tp.total_stints_wins, tp.total_stints_losses, tp.total_stint_duration_wins, tp.total_stint_duration_losses, tp.win_games, tp.loss_games
ORDER BY tp.player_name;
