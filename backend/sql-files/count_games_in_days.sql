CREATE OR REPLACE FUNCTION public.count_games_in_days(
    num_games INTEGER, 
    num_days INTEGER, 
    start_date DATE, 
    end_date DATE
)
RETURNS TABLE(team_id INTEGER, game_count INTEGER)
LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    WITH team_games AS (
        -- Select all games (home and away) within the specified date range
        SELECT
            g."game_id",
            CAST(g."home_id" AS INTEGER) AS "team_id",  -- Cast home team_id to INTEGER
            CAST(g."game_date" AS DATE) AS "game_date"
        FROM "game_schedule" g
        WHERE CAST(g."game_date" AS DATE) BETWEEN start_date AND end_date

        UNION ALL

        SELECT
            g."game_id",
            CAST(g."away_id" AS INTEGER) AS "team_id",  -- Cast away team_id to INTEGER
            CAST(g."game_date" AS DATE) AS "game_date"
        FROM "game_schedule" g
        WHERE CAST(g."game_date" AS DATE) BETWEEN start_date AND end_date
    ),
    ranked_games AS (
        -- Rank games by team and date, and calculate date differences between games
        SELECT
            tg."team_id",
            tg."game_date",
            LAG(tg."game_date", num_games - 1) OVER (PARTITION BY tg."team_id" ORDER BY tg."game_date") AS prev_game
        FROM team_games tg
    ),
    valid_games AS (
        -- Filter for games that are within the specified number of days
        SELECT
            rg."team_id",
            COUNT(*) AS game_count
        FROM ranked_games rg
        WHERE rg."prev_game" IS NOT NULL
          AND rg."game_date" - rg."prev_game" <= num_days - 1
        GROUP BY rg."team_id"
    )
    SELECT * FROM valid_games;
END;
$function$;
