-- Step 1: Create a CTE to get player data for each game, period, and lineup_num
WITH lineup_data AS (
    SELECT
        game_id,
        team_id,
        lineup_num,
        period,
        time_in,
        time_out,
        ROW_NUMBER() OVER (PARTITION BY game_id, team_id, lineup_num, period ORDER BY time_in) AS player_rank,
        player_id
    FROM lineup
),

-- Step 2: Pivot player data to create columns for each of the 5 players
wide_lineup AS (
    SELECT
        game_id,
        team_id,
        lineup_num,
        period,
        time_in,
        time_out,
        MAX(CASE WHEN player_rank = 1 THEN player_id END) AS player_1,
        MAX(CASE WHEN player_rank = 2 THEN player_id END) AS player_2,
        MAX(CASE WHEN player_rank = 3 THEN player_id END) AS player_3,
        MAX(CASE WHEN player_rank = 4 THEN player_id END) AS player_4,
        MAX(CASE WHEN player_rank = 5 THEN player_id END) AS player_5
    FROM lineup_data
    GROUP BY game_id, team_id, lineup_num, period, time_in, time_out
)

-- Final Step: Select the result from the pivoted data
SELECT
    game_id,
    team_id,
    lineup_num,
    period,
    time_in,
    time_out,
    player_1,
    player_2,
    player_3,
    player_4,
    player_5
FROM wide_lineup
ORDER BY game_id, team_id, lineup_num, period, time_in;
