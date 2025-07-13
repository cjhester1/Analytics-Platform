## Query Documentation

### Defining Primary Keys and Foreign Keys

**Primary and Composite Keys:**

- **team:** `teamId`
- **team_affiliate:** Composite key of `nba_teamId` and `glg_teamId`
- **game_schedule:** `game_id`
- **roster:** Composite key of `team_id` and `player_id`
- **player:** `player_id`
- **lineup:** Composite key of `team_id`, `player_id`, `lineup_num`, and `game_id`

**Problems/Bugs Encountered + Solutions:**

**Problem:** Ran into issues ensuring that relationships between tables such as team, player, and game_schedule remained consistent during the data transfer, especially when dealing with foreign key constraints.
**Solution:** I defined foreign key relationships between the tables. For example, `teamId` in the `game_schedule` and `roster` tables references `teamId` in the `team` table. This ensured referential integrity, meaning that each record in the `game_schedule` or `roster` table had a valid reference to a team.

**Problem:** I needed the data transfer script to handle not only initial data loads but also updates and merges when new data became available. When I implemented solution initially it was duplicating records & breaking foreign key relationships.
**Solution:** I used SQL `ON CONFLICT` clauses to update records if a conflict arose on the primary key. This ensured that the code could handle merging new data into existing tables without causing inconsistencies.

**Solution:**
For the `team` table, I used `teamId` as the primary key, as it uniquely identifies each team.
For `player`, I used `playerId` as the primary key.
For `game_schedule`, `gameId` served as the primary key.
The `lineup` and `roster` tables used composite keys based on combinations of `playerId`, `teamId`, and `gameId` to ensure data consistency across multiple relationships. This ensured that each record was uniquely identifiable and maintained relational integrity across tables.

### Basic Queries (SQL)

### SQL query that can calculate team win-loss records, sorted by win percentage (defined as wins divided by games played)

**Calculating Team Win-Loss Records**

**Overview** Calculate each team's win-loss records, sorted by win percentage, and display key statistics such as Team Name, Games Played, Wins, Losses, Win Percentage, and Team Rank based on win percentage.

- **Final table includes:** team name, games played, wins, losses, win percentage

- **Query** `get_team_ranking_range.sql`
  ```sql
  SELECT * FROM get_team_rankings_range('2024-01-01 00:00:00', '2024-12-31 23:59:59');
  ```

**team ranks (highest to lowest) in terms of games played, home games, and away games during this month of the season (code extends to additional month as data is added to the data set. For each, both the number of games and the ranks are shown)**

- **Query** `get_team_ranking_range.sql`
  ```sql
  SELECT * FROM get_team_rankings_range('2024-01-01 00:00:00', '2024-01-31 23:59:59'); -- dynamically change months to see range
  SELECT * FROM get_team_rankings_range('2024-01-01 00:00:00', '2024-01-15 23:59:59', 'home'); -- dynamically change months and look at home games only
  SELECT * FROM get_team_rankings_range('2024-01-01 00:00:00', '2024-01-15 23:59:59', 'away'); -- dynamically change months and look at away games only
  ```

**Steps in My Approach:**

1.  **Data Source:**
    - The team information was retrieved from the `team` table, while the game results were sourced from the `game_schedule` table.
    - Each row in the `game_schedule` table stores game data with columns for `home_id`, `away_id`, and their respective scores, which were essential for calculating wins and losses.
2.  **Calculate Wins and Losses:**
    - Wins and losses were computed by comparing the scores of the home and away teams for each game.
      - **Win:** A win was recorded when a team’s score (either as home or away) was greater than the opposing team’s score.
      - **Loss:** A loss was recorded when the team’s score was lower than the opposing team's score.
    - I checked both the `home_id` and `away_id` for each game to assign wins or losses appropriately to the respective teams.
3.  **Count Games Played:**
    - The total number of games played by each team was calculated by counting how many times a team appeared in the `home_id` or `away_id` columns of the `game_schedule` table.
    - This ensured that both home and away games were accounted for accurately in the total games played.
4.  **Calculate Win Percentage:**
    - The win percentage was calculated using the formula: `Win Percentage = Wins / (Wins + Losses)`
    - In cases where a team had not played any games (both wins and losses were zero), I handled the potential division by zero error by setting the win percentage to 0 for teams with no games.
5.  **Rank Teams by Win Percentage:**
    - To rank the teams based on their win percentage, I used the `DENSE_RANK()` function.
    - This method ensures that teams with the same win percentage are given the same rank, and the next rank is assigned correctly without skipping any ranks.
6.  **Display View in Postgres:**
    - I created a query that would output all the calculated fields in a clean, readable format in Postgres, displaying the team name, number of games played, wins, losses, win percentage, and their overall rank.

**Problems/Bugs Encountered + Solutions:**

**Problem:** When calculating the win percentage, I encountered an issue where teams that had not played any games (both wins and losses were zero) resulted in division by zero errors.
**Solution:** I used a conditional `ROUND()` function to ensure that division only occurred when the total number of games played was greater than zero. For teams that had not played any games, I set their win percentage to 0 to avoid the division by zero error. This ensured that teams without games were handled gracefully in the output.

### Ranking Teams by Total, Home, and Away Games Played

**Overview** Enhance the existing SQL query (rankings) include rankings for each team based on:

- Total Games Played
- Home Games Played
- Away Games Played

**Approach**

1.  The query should handle dynamic date ranges and not require manual adjustments for different months.
2.  The output should display team name, games played, wins, losses, win percentage, and ranks for total games played, home games, and away games.

**Steps in My Approach:**

1.  **Define the Time Frame Dynamically:**
    - To ensure the query can handle any date range or month, I added a `WHERE` clause to filter the games based on the provided start and end dates. This allows the query to accommodate varying amounts of data over time, such as filtering for different months or entire seasons.
2.  **Aggregate Team Statistics:**
    - In addition to calculating the total games played, I extended the query to also calculate:
      - **Home Games Played:** Count of games where the team appears as the `home_id`.
      - **Away Games Played:** Count of games where the team appears as the `away_id`.
    - This required separating the aggregation logic for home and away games while maintaining an overall count for total games played.
3.  **Calculate Win Percentage Safely:**
    - I maintained the logic from Problem 2a to calculate the win percentage. If a team had no games played (both wins and losses were zero), I ensured that the win percentage was set to 0 to avoid division by zero errors.
4.  **Implement Ranking Using Window Functions:**
    - I used `DENSE_RANK()` to assign ranks based on:
      - **Total Games Played:** Ranking teams by the total number of games played.
      - **Home Games Played:** Ranking teams by home games played.
      - **Away Games Played:** Ranking teams by away games played.
    - The `DENSE_RANK()` function ensures that if two teams have the same number of games, they will share the same rank.

**Problems/Bugs Encountered + Solutions:**

**Problem:** Ensuring that the query could handle filtering by months or extended periods was initially challenging. I needed to account for dynamic date ranges, as the amount of data could vary depending on the period (month, season, etc.).
**Solution:** I introduced a `WHERE` clause to filter the game data by date range. This allows the query to dynamically adapt to different time frames and calculate the same statistics for different periods without requiring manual adjustments. As new data is ingested, the query remains scalable and reusable, providing consistent results across any date range.

### Back-to-Back (B2B) which is if a team played 2 days in a row (regardless of start time). For the test data given I wrote queries to find which team had the most Home-Home B2Bs + Which had the most Away-Away B2Bs

**Overview**

- **Home-Home B2Bs:** Identify teams that played two consecutive home games on back-to-back days.
- **Away-Away B2Bs:** Identify teams that played two consecutive away games on back-to-back days.

- **Query** `Get_b2b_rankings.sql`
  ```sql
  SELECT * FROM get_b2b_rankings('2024-01-01', '2024-12-31');
  ```

**Steps in My Approach:**

1.  **List All Team Games with Roles:**
    - For each game, I created two records: one for the home team and one for the away team, indicating the role (home or away) each team played in that game. This allowed me to analyze each game from both perspectives.
2.  **Sort Games Chronologically for Each Team:**
    - I ordered each team's games by `game_date` to identify games that were played consecutively. This sorting was necessary to compare a team’s back-to-back games accurately.
3.  **Use Window Functions to Compare Consecutive Games:**
    - Using the `LAG` window function, I accessed the previous game’s date and role (home or away) for each team. This allowed me to compare whether the current game was played on the day immediately following the previous game and whether both games were home or away.
4.  **Identify Back-to-Backs:**
    - I checked if the current game and the previous game were played on consecutive days by comparing the `game_date` values.
    - Then, I determined whether both games were played at home (for Home-Home B2Bs) or away (for Away-Away B2Bs) based on the role of the team in each game (home or away).
5.  **Aggregate Counts per Team:**
    - For each team, I counted how many times they had Home-Home B2Bs and Away-Away B2Bs. This was done by summing up the consecutive games that matched the conditions defined in the previous step.
6.  **Identify Teams with the Maximum Counts:**
    - Finally, I identified the teams with the highest number of Home-Home and Away-Away B2Bs by sorting the aggregated counts and selecting the top team(s) for each category.

**Problems/Bugs Encountered + Solutions:**

**Problem:** Initially, I encountered issues where games played late at night or in different time zones caused B2Bs to be missed. Even though the games were technically back-to-back, their start times crossed into different calendar days, making it difficult to capture them correctly.
**Solution:** I ignored the specific start times of the games and focused solely on the calendar days using `game_date`. This way, I could determine whether the games were played on consecutive days, regardless of timezone differences or late-night start times. This adjustment ensured that all back-to-backs were identified properly.

**Problem:** It was challenging to differentiate between Home-Home and Away-Away B2Bs within the same query. Both conditions needed to be evaluated for each team, making it hard to classify the games accurately.
**Solution:** I used conditional logic to check the location of each game. For Home-Home B2Bs, I compared the `home_id` of the current game with the `home_id` of the previous game to see if the same team played at home two days in a row. Similarly, for Away-Away B2Bs, I compared the `away_id` values. By separating the conditions for home and away, I ensured that each B2B was correctly classified.

### Ranking Teams Based on Rest Periods Between Games

**Overview**

- To calculate and rank the rest periods for each NBA team between two consecutive games, allowing teams to be ranked based on the longest rest periods.

**Steps in My Approach:**

1.  **Define the Function:**
    - I created a PostgreSQL function `get_ranked_rest_between_games(p_start_date DATE, p_end_date DATE)` to calculate the rest periods for each team between consecutive games within the specified date range (`p_start_date` and `p_end_date`).
2.  **Extract Home and Away Games for Each Team:**
    - In the function, I used a `UNION ALL` to merge both home and away games for each team into a single dataset. This unified dataset allowed me to analyze rest periods regardless of whether the team played at home or away.
3.  **Sort the Games Chronologically for Each Team:**
    - I used the `LAG()` window function to retrieve each team's previous game, ordered by `game_date`. Sorting the games chronologically for each team ensured I could correctly calculate rest periods between consecutive games.
4.  **Calculate the Rest Period:**
    - For each game where a previous game existed, I calculated the number of days between the current game and the previous game using date subtraction (`game_date - prev_game_date`). This value was stored as `days_of_rest`, representing the rest period between the two games.
5.  **Rank the Teams Based on Rest Period:**
    - Using the `DENSE_RANK()` window function, I ranked the teams based on their longest rest period. Teams with the same number of rest days received the same rank, and the ranking was dense (no skipped ranks between teams with equal rest).
6.  **Final Query and Return Table:**
    - The function returns a table with the following columns:
      - `teamName`: The name of the team.
      - `days_of_rest`: The number of rest days between two consecutive games.
      - `first_game_date`: The date of the first game in the rest period.
      - `second_game_date`: The date of the second game in the rest period.
      - `rest_rank`: The rank of the team based on their longest rest period, where 1 indicates the most rest.
7.  **Optimize the Query:**
    - The final query orders the results by `rest_rank` and `days_of_rest` to ensure that the team with the most rest appears at the top of the results, followed by teams with shorter rest periods.

**Problems/Bugs Encountered + Solutions:**

**No Problems for this section:** This approach was straightforward and worked as intended. The function logic was simple and effective in calculating rest periods and ranking teams without any significant issues during implementation.

**Counting and Ranking 3-in-4 Games**

**Objective:** Rank teams based on the number of instances where they played 3 games over a 4-day period (referred to as "3-in-4s").

**Steps in My Approach:**

1.  **Extract All Games by Team**
    - Use `game_schedule` to list all games for each team, both as home and away teams.
2.  **Sort Games by Date for Each Team**
    - Order the games chronologically for each team based on `game_date`.
3.  **Calculate Date Differences Between Games**
    - Use the `LAG()` window function to calculate the difference in days between the current game and previous games. This helps track consecutive games for each team.
4.  **Filter for 3-in-4s**
    - Filter for instances where the team has played 3 games within 4 days by checking the difference between the game dates and applying a condition to ensure the total span between the first and third game is 3 or fewer days.
5.  **Rank Teams Based on 3-in-4s**
    - Count the number of "3-in-4s" for each team and rank them accordingly.

**Problems/Bugs Encountered + Solutions:**

**Problem:** Handling Teams with Sparse Schedules
Certain teams had long gaps between games, which interfered with calculating consecutive game spans and sometimes produced inaccurate results.
**Solution:** I ensured that teams with too few games in the range were excluded from the 3-in-4 analysis by adding conditions in the query that required at least two prior games to evaluate 3-in-4s. This approach allowed me to accurately identify and rank teams based on their 3-in-4 occurrences while avoiding edge cases that would produce inaccurate results.

**Problem:** Inconsistent Date Formats
At first, there was an issue where some dates were stored in different formats, leading to discrepancies when calculating the date differences for 3-in-4s.
**Solution:** I made sure to cast all date fields into consistent formats using `CAST()` and checked that all entries were parsed into the correct date type

### Lineups Queries (SQL)

**Objective:** Identify continuous stints for each player (i.e., when they are continuously on the court without being substituted), including the stint start and end times, and format the times in a readable way.

**Steps in My Approach:**

1.  **Track Continuous Player Presence:**
    - For each player, I tracked their continuous presence on the court, specifically looking for sequences where they were not substituted (12 mins).
    - To do this, I grouped together all consecutive lineups where a player remained on the court without substitution.
2.  **Define Stints:**
    - A stint began when a player entered the court (`time_in`) and ended when they were substituted out or the period ended (`time_out`).
    - I used the `LAG()` function to identify when a player’s lineup changed. If the player’s current lineup was different from the previous one (based on `lineup_num`), I marked the end of the previous stint and the start of a new one.
3.  **Formatting Stint Times:**
    - The `time_in` and `time_out` fields were originally in seconds, counting down from 720 (12 minutes) to 0.
    - I formatted these times into `mm:ss` format to ensure the stint times were easily readable, starting from 12:00 and going down to 00:00 as each period progressed.

**Problems/Bugs Encountered + Solutions:**

**Problem:** Overlapping stints and correctly identifying substitutions.
**Issue:** It was difficult to determine when a stint should end and a new stint should begin, especially when players were substituted frequently.
**Solution:** I used window functions like `LAG()` and `LEAD()` to detect changes in the player’s lineup by comparing the previous and next lineup numbers. This allowed me to accurately track when a player was continuously on the court and when they were substituted, ensuring that the stints were generated correctly and without overlap.
