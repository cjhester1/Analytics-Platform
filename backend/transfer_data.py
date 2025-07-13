import os  # For environment variables
import pandas as pd  # For handling data
from sqlalchemy import create_engine, MetaData, Table, Column, Integer, String, Float, DateTime, text  # For database operations
from sqlalchemy.exc import SQLAlchemyError  # For error handling in SQLAlchemy

# Load the database URL from the environment variable (set in docker-compose.yml)
DATABASE_URL = os.getenv('DATABASE_URL')

# Check if DATABASE_URL is being set correctly
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set or empty!")
else:
    print(f"DATABASE_URL: {DATABASE_URL}")

# Create an engine object to connect to the PostgreSQL database using SQLAlchemy
engine = create_engine(DATABASE_URL)

# Dictionary mapping JSON files to their corresponding PostgreSQL table names
#also define the column structure for each table (example)
tables_structure = {
    'team.json': ('team', {
        'teamId': (Integer, True),  # Use Integer type, this should map to integer in PostgreSQL
        'leagueLk': (String(10), False),  # Specify length for VARCHAR to enforce character varying
        'teamName': (String(50), False),
        'teamNameShort': (String(10), False),
        'teamNickname': (String(50), False)
    }),
    'player.json': ('player', {
        'player_id': (Integer, True),  
        'first_name': (String(50), False),  
        'last_name': (String(50), False)
    }),
    'game_schedule.json': ('game_schedule', {
        'game_id': (Integer, True), 
        'home_id': (Integer, False), 
        'home_score': (Integer, False),
        'away_id': (Integer, False),
        'away_score': (Integer, False),
        'game_date': (DateTime, False)
    }),
    'lineup.json': ('lineup', {
        'team_id': (Integer, True),  
        'player_id': (Integer, True),  
        'lineup_num': (Integer, True),
        'period': (Integer, False),
        'time_in': (Float, False),  # Keep as Float, maps to double precision in PostgreSQL
        'time_out': (Float, False),
        'game_id': (Integer, True)  
    }),
    'roster.json': ('roster', {
        'team_id': (Integer, True),  
        'player_id': (Integer, True),  
        'first_name': (String(50), False),  
        'last_name': (String(50), False),
        'position': (String(5), False),
        'contract_type': (String(20), False)
    }),
    'team_affiliate.json': ('team_affiliate', {
        'nba_teamId': (Integer, True),  
        'nba_abrv': (String(10), False),
        'glg_teamId': (Integer, True),  
        'glg_abrv': (String(10), False)
    })
}

# Function to drop a table if it exists with explicit transaction commit
def drop_table(table_name):
    with engine.connect() as connection:
        transaction = connection.begin()  # Start a transaction
        try:
            print(f"Attempting to drop table '{table_name}'...")
            connection.execute(text(f"DROP TABLE IF EXISTS {table_name} CASCADE"))
            print(f"Table '{table_name}' dropped.")
            transaction.commit()  # Explicitly commit the transaction
        except SQLAlchemyError as e:
            print(f"Error dropping table {table_name}: {e}")
            transaction.rollback()  # Rollback the transaction in case of error


# Function to dynamically create tables based on structure
def create_table_if_not_exists(table_name, columns):
    metadata = MetaData()
    try:
        table = Table(
            table_name,
            metadata,
            *(Column(col_name, col_type, primary_key=is_primary) for col_name, (col_type, is_primary) in columns.items())
        )
        # Create the table in the database if it doesn't exist
        metadata.create_all(engine)
        print(f"Table '{table_name}' created.")
    except SQLAlchemyError as e:
        print(f"Error creating table {table_name}: {e}")

# Function to load and synchronize data from a JSON file
def load_json_to_db(file_path, table_name, columns, primary_key_column):
    if not os.path.exists(file_path):
        print(f"File {file_path} not found. Skipping table {table_name}.")
        return

    try:
        df = pd.read_json(file_path)
        create_table_if_not_exists(table_name, columns)
        df.to_sql(table_name, engine, if_exists='replace', index=False)  # Replace data each time
        print(f"Synchronized data for table '{table_name}'.")
    except Exception as e:
        print(f"Error synchronizing data into {table_name}: {e}")

def drop_all_tables():
    for _, (table_name, _) in tables_structure.items():
        drop_table(table_name)

def execute_sql_files():
    # Correctly locate the sql-files directory relative to the current script
    sql_files_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), 'sql-files'))
    
    if not os.path.isdir(sql_files_dir):
        print(f"SQL files directory not found at: {sql_files_dir}")
        return

    # List of SQL files that define functions (based on our analysis)
    function_sql_files = [
        'count_games_in_days.sql',
        'get_b2b_rankings.sql',
        'get_ranked_rest_between_games.sql',
        'get_team_rankings_range.sql',
        'get_player_stints.sql'
    ]
    
    with engine.connect() as connection:
        for sql_file in function_sql_files:
            file_path = os.path.join(sql_files_dir, sql_file)
            print(f"Processing file: {sql_file}")
            print(f"File exists: {os.path.exists(file_path)}")
            try:
                with open(file_path, 'r') as f:
                    sql_command = f.read()
                    print(f"SQL command start: {sql_command[:100].strip()}...")
                    # Check if the file contains a CREATE FUNCTION statement
                    if "CREATE OR REPLACE FUNCTION" in sql_command.upper() and sql_command.strip():
                        print(f"'CREATE OR REPLACE FUNCTION' found in {sql_file}.")
                        transaction = connection.begin()
                        try:
                            print(f"Executing SQL from {sql_file}...")
                            connection.execute(text(sql_command))
                            transaction.commit()
                            print(f"Successfully executed {sql_file}.")
                        except SQLAlchemyError as e:
                            print(f"Error executing {sql_file}: {e}")
                            transaction.rollback()
                        except Exception as e:
                            print(f"Unexpected error during execution of {sql_file}: {e}")
                            transaction.rollback()
                    else:
                        print(f"Skipping {sql_file}: Does not contain a CREATE FUNCTION statement or is empty.")
            except Exception as e:
                print(f"Error reading file {sql_file}: {e}")

def initialize_database():
    """Drops all tables, loads data from JSON files, and creates functions from SQL files."""
    print("DEBUG: initialize_database() called.")
    print("--- Starting Database Initialization ---")
    
    # 1. Drop all existing tables
    drop_all_tables()
    
    # 2. Recreate tables and load data from JSON files
    print("--- Loading data into tables ---")
    for file_name, (table_name, columns) in tables_structure.items():
        file_path = os.path.join('dev_test_data', file_name)
        try:
            primary_key_column = next(col_name for col_name, (col_type, is_primary) in columns.items() if is_primary)
        except StopIteration:
            raise ValueError(f"No primary key defined for table {table_name}")
        
        load_json_to_db(file_path, table_name, columns, primary_key_column)
        
    # 3. Execute SQL files to create database functions
    print("--- Creating database functions ---")
    execute_sql_files()
    
    print("--- Database Initialization Complete ---")
