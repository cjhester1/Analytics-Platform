CREATE OR REPLACE FUNCTION public.get_b2b_rankings(p_start_date date, p_end_date date)
  RETURNS TABLE(teamname text, total_b2b bigint, total_b2b_rank bigint, home_home_b2b bigint, home_home_b2b_rank bigint, away_away_b2b bigint, away_away_b2b_rank bigint)
  LANGUAGE plpgsql
 AS $function$
 BEGIN
     RETURN QUERY
     WITH team_games AS (
         -- Unified list of all games for each team within the specified date range
         SELECT
             g."game_id",
             g."home_id" AS "team_id",
             CAST(g."game_date" AS DATE) AS "game_date",
             'home' AS "game_type"
         FROM "game_schedule" g
         WHERE CAST(g."game_date" AS DATE) BETWEEN p_start_date AND p_end_date

         UNION ALL

         SELECT
             g."game_id",
             g."away_id" AS "team_id",
             CAST(g."game_date" AS DATE) AS "game_date",
             'away' AS "game_type"
         FROM "game_schedule" g
         WHERE CAST(g."game_date" AS DATE) BETWEEN p_start_date AND p_end_date
     ),
     team_games_ordered AS (
         -- Order games for each team by date and retrieve the previous game's date and type
         SELECT
             tg."team_id",
             tg."game_date",
             tg."game_type",
             LAG(tg."game_date") OVER (PARTITION BY tg."team_id" ORDER BY tg."game_date") AS "prev_game_date",
             LAG(tg."game_type") OVER (PARTITION BY tg."team_id" ORDER BY tg."game_date") AS "prev_game_type"
         FROM team_games tg
     ),
     b2b_identification AS (
         -- Identify Back-to-Backs: Home-Home and Away-Away on consecutive days
         SELECT
             tgo."team_id",
             CASE
                 WHEN tgo."game_type" = 'home'
                      AND tgo."prev_game_type" = 'home'
                      AND tgo."game_date" = tgo."prev_game_date" + INTERVAL '1 day'
                 THEN 1
                 ELSE 0
             END AS "is_home_home_b2b",
             CASE
                 WHEN tgo."game_type" = 'away'
                      AND tgo."prev_game_type" = 'away'
                      AND tgo."game_date" = tgo."prev_game_date" + INTERVAL '1 day'
                 THEN 1
                 ELSE 0
             END AS "is_away_away_b2b",
             CASE
                 WHEN (tgo."game_type" = tgo."prev_game_type")
                      AND tgo."game_date" = tgo."prev_game_date" + INTERVAL '1 day'
                 THEN 1
                 ELSE 0
             END AS "is_total_b2b"
         FROM team_games_ordered tgo
         WHERE tgo."prev_game_date" IS NOT NULL
     ),
     b2b_counts AS (
         -- Aggregate Back-to-Back counts per team
         SELECT
             tb."team_id",
             t."teamName",
             SUM(tb."is_home_home_b2b") AS "home_home_b2b",
             SUM(tb."is_away_away_b2b") AS "away_away_b2b",
             SUM(tb."is_total_b2b") AS "total_b2b"
         FROM b2b_identification tb
         JOIN "team" t ON t."teamId" = tb."team_id"
         GROUP BY tb."team_id", t."teamName"
     ),
     ranked_b2b AS (
         -- Rank teams based on total Back-to-Backs
         SELECT
             b2b."teamName",
             b2b."total_b2b",
             b2b."home_home_b2b",
             b2b."away_away_b2b",
             DENSE_RANK() OVER (ORDER BY b2b."total_b2b" DESC) AS "total_b2b_rank",
             DENSE_RANK() OVER (ORDER BY b2b."home_home_b2b" DESC) AS "home_home_b2b_rank",
             DENSE_RANK() OVER (ORDER BY b2b."away_away_b2b" DESC) AS "away_away_b2b_rank"
         FROM b2b_counts b2b
     )

     -- Final Selection with Separate Rankings
     SELECT
         rb."teamName",
         rb."total_b2b",
         rb."total_b2b_rank",
         rb."home_home_b2b",
         rb."home_home_b2b_rank",
         rb."away_away_b2b",
         rb."away_away_b2b_rank"
     FROM ranked_b2b rb
     ORDER BY rb."total_b2b_rank", rb."home_home_b2b_rank", rb."away_away_b2b_rank", rb."teamName";
 END;
 $function$