"use client";
import React, { useState, useEffect } from "react";
import { useUser, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs"; // Clerk components for authentication
import {
  Chart as ChartJS,
  RadarController,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js"; //Chart Components
import { Radar } from "react-chartjs-2"; //Using a Radar Chart

// Register chart components for Radar chart
ChartJS.register(
  RadarController,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const B2BRankingsRadarChart = () => {
  const { isLoaded, user } = useUser(); // Get the current user and auth status from Clerk
  const [role, setRole] = useState(null); // Store the user's role
  const [startDate, setStartDate] = useState("2024-01-01"); // State for the start date of data
  const [endDate, setEndDate] = useState("2024-12-31"); // State for the end date of data
  const [rankings, setRankings] = useState([]); // Store the fetched rankings
  const [loading, setLoading] = useState(false); // State to track loading
  const [error, setError] = useState(null); // State to track errors

  // Fetch the B2B rankings based on the selected date range
  const fetchB2BRankings = async () => {
    setLoading(true); // Start loading state
    setError(null); // Reset error before fetching

    try {
      const response = await fetch(
        `http://localhost:8000/api/b2b_rankings?start_date=${encodeURIComponent(
          startDate
        )}&end_date=${encodeURIComponent(endDate)}`
      );
      if (!response.ok) {
        throw new Error("Error fetching data"); // Handle response error
      }
      const data = await response.json();
      setRankings(data.rankings || []); // Set rankings with fetched data
    } catch (err) {
      setError(err.message); // Catch and set any error that occurs during fetching
    } finally {
      setLoading(false); // End loading state once fetching completes
    }
  };

  // Fetch rankings when the component mounts or when dates change
  useEffect(() => {
    fetchB2BRankings();
  }, [startDate, endDate]);

  // Check if the user is signed in and fetch the user's role
  useEffect(() => {
    if (isLoaded && user) {
      const orgRole = user?.organizationMemberships?.[0]?.role;
      setRole(orgRole); // Set the user's role
    }
  }, [isLoaded, user]);

  // Show loading state until user data is fetched
  if (!isLoaded) {
    return <p>Loading...</p>;
  }

  // Show sign-in button if the user is not signed in
  if (!user) {
    return (
      <div style={styles.centeredContainer}>
        <h2>You need to sign in to access this page</h2>
        <SignInButton />
      </div>
    );
  }

  // If the user does not have the "admin" role, show an access denied message
  if (role !== "org:admin") {
    return (
      <div style={styles.adminOverlay}>
        <div style={styles.adminCard}>
          <h2 style={styles.adminTitle}>Restricted Access</h2>
          <p style={styles.adminMessage}>
            This page is for administrators only. Please contact your admin if
            you believe this is an error.
          </p>
          <a href="/" style={styles.goBackButton}>
            Go Back Home
          </a>{" "}
          {/* Button to navigate back to home page */}
        </div>
      </div>
    );
  }

  // Generate the chart data for the Radar chart
  const generateChartData = () => {
    return {
      labels: ["Total B2B", "Home-Home B2B", "Away-Away B2B"], // Radar chart labels
      datasets: rankings.map((team, index) => ({
        label: team.team_name, // Label for each team's data
        data: [team.total_b2b, team.home_home_b2b, team.away_away_b2b], // Data for each category
        backgroundColor: `rgba(${Math.random() * 255}, ${
          Math.random() * 255
        }, ${Math.random() * 255}, 0.5)`, // Randomized background color for each team every time data is fetched
        borderColor: `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${
          Math.random() * 255
        }, 1)`, // Randomized border color for each team
        borderWidth: 2,
        fill: true, // Fill the radar chart area
      })),
    };
  };

  // Chart configuration options
  const chartOptions = {
    scales: {
      r: {
        beginAtZero: true, // Start the radar chart at 0
        ticks: {
          stepSize: 1, // Steps for the radar chart values
        },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: "right", // Position the legend on the right
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.raw}`, // Format tooltip labels
        },
      },
    },
    responsive: true, // Make chart responsive to screen size
  };

  // Render the page with the chart and inputs
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Most Back-to-Back (B2B) Games - Radar Chart</h1>

      <div style={styles.inputContainer}>
        <div>
          <label style={styles.label}>Start Date:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={styles.input}
          />
        </div>
        <div>
          <label style={styles.label}>End Date:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={styles.input}
          />
        </div>
        <button onClick={fetchB2BRankings} style={styles.button}>
          Fetch B2B Rankings
        </button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={styles.error}>Error: {error}</p>}

      <div style={styles.chartContainer}>
        <Radar data={generateChartData()} options={chartOptions} />
      </div>
    </div>
  );
};

// Styles for the page and admin overlay
const styles = {
  container: {
    padding: "20px",
    paddingTop: "80px",
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#f9f9f9",
    maxWidth: "1200px",
    margin: "40px auto",
  },
  title: {
    textAlign: "center",
    color: "#333",
    fontSize: "28px",
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
  chartContainer: {
    marginTop: "40px",
  },
  error: { color: "red" },

  // Styles for the admin access overlay
  adminOverlay: {
    position: "fixed", // Full-screen overlay
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0, 0, 0, 0.8)", // Semi-transparent dark background
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000, // Ensure it's on top of everything else
  },
  adminCard: {
    backgroundColor: "#fff", // White card background
    padding: "40px",
    borderRadius: "10px",
    textAlign: "center",
    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.3)", // Soft shadow for the card
  },
  adminTitle: {
    fontSize: "24px",
    color: "#ff4d4f", // Red accent for the title
    marginBottom: "20px",
  },
  adminMessage: {
    fontSize: "18px",
    color: "#333",
    marginBottom: "20px",
  },
  goBackButton: {
    display: "inline-block",
    padding: "10px 20px",
    backgroundColor: "#007bff",
    color: "#fff",
    borderRadius: "5px",
    textDecoration: "none",
  },
};

export default B2BRankingsRadarChart;
