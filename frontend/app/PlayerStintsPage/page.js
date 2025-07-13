"use client";
import { useState, useEffect } from "react";
import { useUser, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";

const PlayerStintsPage = () => {
  const { isLoaded, user } = useUser(); // Clerk hook to get the user
  const [role, setRole] = useState(null); // State to store the user's role
  const [startDate, setStartDate] = useState(""); // State to store start date
  const [endDate, setEndDate] = useState(""); // State to store end date
  const [stintData, setStintData] = useState([]); // State to store fetched data
  const [isLoading, setIsLoading] = useState(false); // State to track loading
  const [error, setError] = useState(null); // State to track errors

  // Fetch player stints data from FastAPI
  const fetchPlayerStints = async () => {
    setIsLoading(true); // Set loading to true when fetch starts
    setError(null); // Reset the error state before fetching
    try {
      const response = await fetch(
        `http://localhost:8000/api/player_stints?start_date=${startDate}&end_date=${endDate}`
      );
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      const data = await response.json();
      setStintData(data.stints || []);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false); // Set loading to false when fetch completes
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent form from reloading the page
    fetchPlayerStints(); // Call the function to fetch data
  };

  // Fetch user role once signed in
  useEffect(() => {
    if (isLoaded && user) {
      const orgRole = user?.organizationMemberships?.[0]?.role;
      setRole(orgRole);
    }
  }, [isLoaded, user]);

  // If the user is not signed in and still loading
  if (!isLoaded) {
    return <p>Loading...</p>;
  }

  // If the user is not signed in and finished loading, show the sign-in button
  if (!user) {
    return (
      <div>
        <h2>You need to sign in to access this page</h2>
        <SignInButton />
      </div>
    );
  }

  // If the user is signed in but does not have the admin role
  if (role !== "org:admin") {
    return (
      <div>
        <h2>Access Denied</h2>
        <p>You do not have permission to access this page. Admins only.</p>
      </div>
    );
  }

  // Main page content for admins
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Player Stints Data</h1>
      <form onSubmit={handleSubmit} style={styles.inputContainer}>
        <div>
          <label style={styles.label}>Start Date:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            style={styles.input}
          />
        </div>
        <div>
          <label style={styles.label}>End Date:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
            style={styles.input}
          />
        </div>
        <button type="submit" style={styles.button}>
          Fetch Stints Data
        </button>
      </form>

      {isLoading && <p style={styles.loading}>Loading data, please wait...</p>}
      {error && <p style={styles.error}>Failed to load data: {error}</p>}

      {!isLoading && !error && stintData.length > 0 && (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Game Date</th>
              <th style={styles.th}>Team Name</th>
              <th style={styles.th}>Opponent Name</th>
              <th style={styles.th}>Player Name</th>
              <th style={styles.th}>Period</th>
              <th style={styles.th}>Stint Number</th>
              <th style={styles.th}>Start Time</th>
              <th style={styles.th}>End Time</th>
            </tr>
          </thead>
          <tbody>
            {stintData.map((stint, index) => (
              <tr key={index}>
                <td style={styles.td}>{stint.game_date}</td>
                <td style={styles.td}>{stint.team_name}</td>
                <td style={styles.td}>{stint.opponent_name}</td>
                <td style={styles.td}>{stint.player_name}</td>
                <td style={styles.td}>{stint.period}</td>
                <td style={styles.td}>{stint.stint_number}</td>
                <td style={styles.td}>{stint.stint_start_time}</td>
                <td style={styles.td}>{stint.stint_end_time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!isLoading && !error && stintData.length === 0 && (
        <p style={styles.noData}>No data available for the selected dates.</p>
      )}
    </div>
  );
};

// Styles for the page
const styles = {
  container: {
    padding: "20px",
    paddingTop: "120px",
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#f9f9f9",
    maxWidth: "1200px",
    margin: "0 auto",
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
  loading: {
    textAlign: "center",
    color: "#007bff",
  },
};

export default PlayerStintsPage;
