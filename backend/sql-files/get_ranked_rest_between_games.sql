CREATE OR REPLACE FUNCTION public.get_ranked_rest_between_games(p_start_date date, p_end_date date)
  RETURNS TABLE(teamname text, days_of_rest bigint, first_game_date date, second_game_date date, rest_rank bigint)
  LANGUAGE plpgsql
 AS $function$
 BEGIN
     RETURN QUERY
     WITH team_games AS (
         -- Unified list of all games for each team within the specified date range
         SELECT
             g."home_id" AS "team_id",
             CAST(g."game_date" AS DATE) AS "game_date"
         FROM "game_schedule" g
         WHERE CAST(g."game_date" AS DATE) BETWEEN p_start_date AND p_end_date

         UNION ALL

         SELECT
             g."away_id" AS "team_id",
             CAST(g."game_date" AS DATE) AS "game_date"
         FROM "game_schedule" g
         WHERE CAST(g."game_date" AS DATE) BETWEEN p_start_date AND p_end_date
     ),
     team_games_ordered AS (
         -- Order games for each team by date and retrieve the previous game's date
         SELECT
             tg."team_id",
             tg."game_date",
             LAG(tg."game_date") OVER (PARTITION BY tg."team_id" ORDER BY tg."game_date") AS "prev_game_date"
         FROM team_games tg
     ),
     rest_periods AS (
         -- Calculate the rest period between consecutive games
         SELECT
             tgo."team_id",
             tgo."prev_game_date" AS "first_game_date",
             tgo."game_date" AS "second_game_date",
             (tgo."game_date" - tgo."prev_game_date")::BIGINT AS "days_of_rest"
         FROM team_games_ordered tgo
         WHERE tgo."prev_game_date" IS NOT NULL
     )
     -- Rank teams based on the longest rest period
     SELECT
         t."teamName",
         rp."days_of_rest",
         rp."first_game_date",
         rp."second_game_date",
         DENSE_RANK() OVER (ORDER BY rp."days_of_rest" DESC) AS "rest_rank"
     FROM rest_periods rp
     JOIN "team" t ON t."teamId" = rp."team_id"
     ORDER BY "rest_rank", rp."days_of_rest" DESC;
 END;
 $function$