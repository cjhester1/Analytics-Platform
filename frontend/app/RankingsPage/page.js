"use client"; // Make this a client-side component

import React, { useState, useEffect } from "react";

// Helper function to convert date format to "YYYY-MM-DD HH:MM:SS"
const formatDateTime = (dateTime) => {
  const date = new Date(dateTime);
  const formattedDate = date.toISOString().replace("T", " ").substring(0, 19); // "YYYY-MM-DD HH:MM:SS"
  return formattedDate;
};

const RankingsPage = () => {
  // Define states for the start date, end date, rankings data, loading state, and error handling
  const [startDate, setStartDate] = useState("2024-01-01T00:00"); // Default start date
  const [endDate, setEndDate] = useState("2024-01-31T23:59"); // Default end date
  const [rankings, setRankings] = useState([]); // State to store the fetched rankings data
  const [loading, setLoading] = useState(false); // Boolean to track loading state
  const [error, setError] = useState(null); // State to handle error messages

  // Function to fetch team rankings based on the date range
  const fetchRankings = async () => {
    setLoading(true); // Set loading to true when fetching begins
    setError(null); // Reset error before fetching data

    try {
      // Format the start and end dates before sending them to the backend
      const formattedStartDate = formatDateTime(startDate);
      const formattedEndDate = formatDateTime(endDate);

      // Make an API call to the backend with the formatted dates
      const response = await fetch(
        `http://localhost:8000/api/team_rankings_range?start_date=${encodeURIComponent(
          formattedStartDate
        )}&end_date=${encodeURIComponent(formattedEndDate)}`
      );

      // Handle the response
      if (!response.ok) {
        throw new Error("Error fetching data"); // Throw error if response is not OK
      }
      const data = await response.json(); // Parse the JSON data
      console.log("Fetched rankings:", data); // Log the data for debugging
      setRankings(data.rankings || []); // Set the rankings state with fetched data
    } catch (err) {
      console.error("Error fetching rankings:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Automatically fetch rankings when the component mounts and when start or end date changes
  useEffect(() => {
    fetchRankings();
  }, [startDate, endDate]);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Team Rankings - Games Played</h1>

      {/* Input fields to select the date range */}
      <div style={styles.inputContainer}>
        <div>
          <label style={styles.label}>Start Date:</label>
          {/* Input for selecting start date */}
          <input
            type="datetime-local"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={styles.input}
          />
        </div>
        <div>
          <label style={styles.label}>End Date:</label>
          {/* Input for selecting end date */}
          <input
            type="datetime-local"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={styles.input}
          />
        </div>
        {/* Button to manually trigger the fetch function */}
        <button onClick={fetchRankings} style={styles.button}>
          Fetch Rankings
        </button>
      </div>

      {/* Display loading message or error if present */}
      {loading && <p>Loading...</p>}
      {error && <p style={styles.error}>Error: {error}</p>}

      {/* Table displaying the rankings data */}
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Team Name</th>
            <th style={styles.th}>Total Games Played</th>
            <th style={styles.th}>Wins</th>
            <th style={styles.th}>Losses</th>
            <th style={styles.th}>Win Percentage</th>
            <th style={styles.th}>Total Games Played Rank</th>
            <th style={styles.th}>Home Games Played</th>
            <th style={styles.th}>Away Games Played</th>
            <th style={styles.th}>Home Games Played Rank</th>
            <th style={styles.th}>Away Games Played Rank</th>
          </tr>
        </thead>
        <tbody>
          {/* Check if rankings data exists and display it */}
          {rankings && rankings.length > 0 ? (
            rankings.map((team, index) => (
              <tr key={index}>
                <td style={styles.td}>{team.team_name}</td>
                <td style={styles.td}>{team.games_played}</td>
                <td style={styles.td}>{team.wins}</td>
                <td style={styles.td}>{team.losses}</td>
                <td style={styles.td}>{team.win_percentage}</td>
                <td style={styles.td}>{team.total_games_rank}</td>
                <td style={styles.td}>{team.home_games}</td>
                <td style={styles.td}>{team.away_games}</td>
                <td style={styles.td}>{team.home_games_rank}</td>
                <td style={styles.td}>{team.away_games_rank}</td>
              </tr>
            ))
          ) : (
            <tr>
              {/* Display a message if no data is available */}
              <td colSpan="8" style={styles.noData}>
                No data available for the selected date range
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

// Styles for the page and components
const styles = {
  container: {
    padding: "20px",
    paddingTop: "120px", // Padding at the top to account for any navbar
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#f9f9f9",
    maxWidth: "1200px",
    margin: "0 auto", // Center the content
  },
  title: {
    textAlign: "center",
    color: "#333",
    fontSize: "24px",
    marginBottom: "20px",
  },
  inputContainer: {
    display: "flex",
    justifyContent: "space-around",
    marginBottom: "20px",
  },
  label: {
    fontSize: "16px",
    color: "#333",
    marginRight: "10px",
  },
  input: {
    padding: "10px",
    fontSize: "16px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    marginRight: "10px",
  },
  button: {
    padding: "10px 20px",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "20px",
  },
  th: {
    backgroundColor: "#333",
    color: "#fff",
    padding: "10px",
    textAlign: "center",
  },
  td: {
    padding: "10px",
    borderBottom: "1px solid #ccc",
    textAlign: "center",
    color: "#333",
  },
  noData: {
    textAlign: "center",
    color: "#999",
    padding: "20px",
  },
  error: {
    color: "red",
  },
};

export default RankingsPage;
