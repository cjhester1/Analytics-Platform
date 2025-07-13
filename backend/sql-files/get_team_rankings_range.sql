CREATE OR REPLACE FUNCTION public.get_team_rankings_range(start_date timestamp without time zone, end_date timestamp without time zone)
  RETURNS TABLE("teamName" text, games_played bigint, wins bigint, losses bigint, win_percentage numeric, win_percentage_rank bigint, total_games bigint, total_games_rank bigint, home_games bigint, home_games_rank bigint, away_games bigint, away_games_rank bigint)
  LANGUAGE plpgsql
 AS $function$
 BEGIN
     RETURN QUERY
     WITH team_stats AS (
         -- Calculate wins, losses, and games played for each team within the date range
         SELECT
             t."teamId",
             t."teamName",
             SUM(
                 CASE
                     WHEN g."home_id" = t."teamId" AND g."home_score" > g."away_score" THEN 1
                     WHEN g."away_id" = t."teamId" AND g."away_score" > g."home_score" THEN 1
                     ELSE 0
                 END
             ) AS wins,
             SUM(
                 CASE
                     WHEN g."home_id" = t."teamId" AND g."home_score" < g."away_score" THEN 1
                     WHEN g."away_id" = t."teamId" AND g."away_score" < g."home_score" THEN 1
                     ELSE 0
                 END
             ) AS losses,
             COUNT(g."game_id") AS games_played  -- Total games played (home or away)
         FROM "team" t
         LEFT JOIN "game_schedule" g ON t."teamId" IN (g."home_id", g."away_id")
         WHERE g."game_date"::timestamp BETWEEN start_date AND end_date
         GROUP BY t."teamId", t."teamName"
     ),

     game_ranks AS (
         -- Calculate the number of games played, home games, away games, and their respective ranks within the date range
         SELECT
             t."teamId",
             COUNT(g."game_id") AS total_games,
             COUNT(CASE WHEN g."home_id" = t."teamId" THEN 1 ELSE NULL END) AS home_games,
             COUNT(CASE WHEN g."away_id" = t."teamId" THEN 1 ELSE NULL END) AS away_games,
             DENSE_RANK() OVER (ORDER BY COUNT(g."game_id") DESC) AS total_games_rank,
             DENSE_RANK() OVER (ORDER BY COUNT(CASE WHEN g."home_id" = t."teamId" THEN 1 ELSE NULL END) DESC) AS home_games_rank,
             DENSE_RANK() OVER (ORDER BY COUNT(CASE WHEN g."away_id" = t."teamId" THEN 1 ELSE NULL END) DESC) AS away_games_rank
         FROM "team" t
         LEFT JOIN "game_schedule" g ON t."teamId" IN (g."home_id", g."away_id")
         WHERE g."game_date"::timestamp BETWEEN start_date AND end_date
         GROUP BY t."teamId"
     )

     -- Combine both win-loss stats and game ranks
     SELECT
         ts."teamName",
         ts.games_played,
         ts.wins,
         ts.losses,
         CASE
             WHEN ts.games_played > 0 THEN ROUND(CAST(ts.wins AS DECIMAL) / ts.games_played, 3)
             ELSE 0.0
         END AS win_percentage,
         DENSE_RANK() OVER (
             ORDER BY
                 CASE
                     WHEN ts.games_played > 0 THEN ROUND(CAST(ts.wins AS DECIMAL) / ts.games_played, 3)
                     ELSE 0.0
                 END DESC
         ) AS win_percentage_rank,
         gr.total_games,
         gr.total_games_rank,
         gr.home_games,
         gr.home_games_rank,
         gr.away_games,
         gr.away_games_rank
     FROM team_stats ts
     JOIN game_ranks gr ON ts."teamId" = gr."teamId"
     ORDER BY gr.total_games_rank;
 END;
 $function$