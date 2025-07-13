from fastapi import FastAPI, Query
from sqlalchemy import create_engine, text
from datetime import datetime
import os
from fastapi.middleware.cors import CORSMiddleware
from transfer_data import initialize_database
import sys
from contextlib import redirect_stdout, redirect_stderr

app = FastAPI()

@app.on_event("startup")
async def startup_event():
    log_file_path = "/app/startup_log.txt" # Path inside the container
    with open(log_file_path, "w") as f:
        with redirect_stdout(f), redirect_stderr(f):
            initialize_database()
    print(f"Startup logs written to {log_file_path}") # This will appear in docker logs

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Adjust this to frontend URL
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)


# Set up the database connection
DATABASE_URL = os.getenv('DATABASE_URL')
engine = create_engine(DATABASE_URL)

#Player Stints
# Function to get player stints
def get_player_stints(start_date: str, end_date: str):
    query = """
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
                '12:00' AS stint_start_time,
                '00:00' AS stint_end_time
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
        SELECT 
            gi.game_date,
            gi.team_name,
            gi.opponent_name,
            sc.player_name,
            sc.period,
            sc.stint_number,
            sc.stint_start_time,
            sc.stint_end_time
        FROM stint_counter sc
        JOIN game_info gi ON sc.game_id = gi.game_id AND sc.team_id = gi.team_id
        WHERE gi.game_date BETWEEN :start_date AND :end_date
        ORDER BY gi.game_date ASC, gi.team_name, sc.player_name, sc.period;
    """
    try:
        with engine.connect() as connection:
            result = connection.execute(text(query), {"start_date": start_date, "end_date": end_date})
            records = []
            for row in result:
                row_dict = {
                    "game_date": row[0],
                    "team_name": row[1],
                    "opponent_name": row[2],
                    "player_name": row[3],
                    "period": row[4],
                    "stint_number": row[5],
                    "stint_start_time": row[6],
                    "stint_end_time": row[7]
                }
                records.append(row_dict)
        return records
    except Exception as e:
        return {"error": str(e)}


# Add the FastAPI route to fetch player stints
@app.get("/api/player_stints")
def player_stints(
    start_date: str = Query(..., description="Start date in format 'YYYY-MM-DD'"),
    end_date: str = Query(..., description="End date in format 'YYYY-MM-DD'")
):
    # Validate and parse the dates
    try:
        datetime.strptime(start_date, "%Y-%m-%d")
        datetime.strptime(end_date, "%Y-%m-%d")
    except ValueError:
        return {"error": "Invalid date format. Please use 'YYYY-MM-DD'."}
    
    # Call the function to get the player stints data
    data = get_player_stints(start_date, end_date)
    return {"stints": data}

#Ranked Rest
# Function to call the SQL function for ranked rest between games in PostgreSQL with date range
def get_ranked_rest_between_games(start_date: str, end_date: str):
    query = "SELECT * FROM get_ranked_rest_between_games(:start_date, :end_date)"  # Call  SQL function
    try:
        with engine.connect() as connection:
            result = connection.execute(text(query), {"start_date": start_date, "end_date": end_date})
            
            # Process the result
            records = []
            for row in result:
                row_dict = {
                    "teamname": row[0],         
                    "days_of_rest": row[1],      
                    "first_game_date": row[2],   
                    "second_game_date": row[3],   
                    "rest_rank": row[4],          
                }
                records.append(row_dict)         # Add the constructed dictionary to the records list
        return records
    except Exception as e:
        return {"error": str(e)}

# FastAPI route to accept start_date and end_date as query parameters for the rest between games ranking
@app.get("/api/rest_rankings")
def rest_rankings(
    start_date: str = Query(..., description="Start date in format 'YYYY-MM-DD'"),
    end_date: str = Query(..., description="End date in format 'YYYY-MM-DD'")
):
    # Call the function to get rankings for rest between games within the date range
    data = get_ranked_rest_between_games(start_date, end_date)
    return {"rankings": data}

#Back2back Rankings   
# Function to call the SQL function for b2b rankings in PostgreSQL with date ranges
def get_b2b_rankings(start_date: str, end_date: str):
    query = "SELECT * FROM get_b2b_rankings(:start_date, :end_date)"
    try:
        with engine.connect() as connection:
            result = connection.execute(text(query), {"start_date": start_date, "end_date": end_date})
            records = []
            for row in result:
                row_dict = {
                    "team_name": row[0],      #
                    "total_b2b": row[1],
                    "total_b2b_rank": row[2],
                    "home_home_b2b_rank": row[3],
                    "away_away_b2b_rank": row[4],
                    "home_home_b2b": row[5],  
                    "away_away_b2b": row[6]   
                }
                records.append(row_dict)
        return records
    except Exception as e:
        return {"error": str(e)}

# FastAPI route to accept start_date and end_date for B2B rankings
@app.get("/api/b2b_rankings")
def b2b_rankings(
    start_date: str = Query(..., description="Start date in format 'YYYY-MM-DD'"),
    end_date: str = Query(..., description="End date in format 'YYYY-MM-DD'")
):
    # Validate and parse the dates
    try:
        datetime.strptime(start_date, "%Y-%m-%d")
        datetime.strptime(end_date, "%Y-%m-%d")
    except ValueError:
        return {"error": "Invalid date format. Please use 'YYYY-MM-DD'."}
    
    # Call the function to get B2B rankings
    data = get_b2b_rankings(start_date, end_date)
    return {"rankings": data}

#Team Rankings
# Function to call the SQL function for team rankings in PostgreSQL with date ranges
def get_team_rankings_range(start_date: str, end_date: str):
    query = text("SELECT * FROM get_team_rankings_range(CAST(:start_date AS timestamp), CAST(:end_date AS timestamp))")  # Call SQL function
    try:
        with engine.connect() as connection:
            result = connection.execute(query, {"start_date": start_date, "end_date": end_date})
            
            # Process the result
            records = []
            for row in result:
                row_dict = {
                    "team_name": row[0],
                    "games_played": row[1],
                    "wins": row[2],
                    "losses": row[3],
                    "win_percentage": row[4],
                    "total_games_rank": row[7],
                    "home_games": row[8],
                    "away_games": row[10],
                    "home_games_rank": row[9],
                    "away_games_rank": row[11]
                }
                records.append(row_dict)
        return records
    except Exception as e:
        return {"error": str(e)}

# FastAPI route to accept start_date and end_date as query parameters
@app.get("/api/team_rankings_range")
def team_rankings_range(
    start_date: str = Query(..., description="Start date in format 'YYYY-MM-DD HH:MM:SS'"),
    end_date: str = Query(..., description="End date in format 'YYYY-MM-DD HH:MM:SS'")
):
    # Validate and parse the dates
    try:
        datetime.strptime(start_date, "%Y-%m-%d %H:%M:%S")
        datetime.strptime(end_date, "%Y-%m-%d %H:%M:%S")
    except ValueError:
        return {"error": "Invalid date format. Please use 'YYYY-MM-DD HH:MM:SS'."}
    
    # Call the function to get team rankings within the date range
    data = get_team_rankings_range(start_date, end_date)
    return {"rankings": data}