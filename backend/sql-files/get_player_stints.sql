CREATE OR REPLACE FUNCTION public.get_player_stints(p_start_date date, p_end_date date)
  RETURNS TABLE(game_date date, team_name text, opponent_name text, player_name text, period integer, stint_number bigint, stint_start_time text, stint_end_time text)
  LANGUAGE plpgsql
 AS $function$
 BEGIN
     RETURN QUERY
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
                (SELECT COUNT(DISTINCT lineup_num) FROM ranked_lineups AS inner_rl WHERE inner_rl.game_id = rl.game_id AND inner_rl.team_id = rl.team_id AND inner_rl.period = rl.period) AS total_lineups
            FROM ranked_lineups rl
            GROUP BY rl.game_id, rl.team_id, rl.period, rl.player_id
            HAVING COUNT(DISTINCT rl.lineup_num) = (SELECT COUNT(DISTINCT lineup_num) FROM ranked_lineups AS inner_rl WHERE inner_rl.game_id = rl.game_id AND inner_rl.team_id = rl.team_id AND inner_rl.period = rl.period)
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
                '12:00' AS stint_start_time,
                '00:00' AS stint_end_time
            FROM player_names pn
        ),
        game_info AS (
            SELECT
                sc.game_id,
                CAST(sc.game_date AS DATE) as game_date,
                t."teamId" AS team_id,
                t."teamName" AS team_name,
                opp."teamName" AS opponent_name
            FROM game_schedule sc
            JOIN team t ON sc.home_id = t."teamId" OR sc.away_id = t."teamId"
            JOIN team opp ON (sc.home_id = opp."teamId" AND sc.away_id = t."teamId") OR (sc.away_id = opp."teamId" AND sc.home_id = t."teamId")
        )
        SELECT
            gi.game_date,
            gi.team_name::text,
            gi.opponent_name::text,
            sc.player_name::text,
            sc.period::integer,
            sc.stint_number::bigint,
            sc.stint_start_time::text,
            sc.stint_end_time::text
        FROM stint_counter sc
        JOIN game_info gi ON sc.game_id = gi.game_id AND sc.team_id = gi.team_id
        WHERE gi.game_date BETWEEN p_start_date AND p_end_date
        ORDER BY gi.game_date ASC, gi.team_name, sc.player_name, sc.period;
 END;
 $function$;