"use client";
import React, { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

// Register required components for Chart.js
ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const RestDaysBarChart = () => {
  const [startDate, setStartDate] = useState("2024-01-01");
  const [endDate, setEndDate] = useState("2024-12-31");
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch the data
  const fetchRankings = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `http://localhost:8000/api/rest_rankings?start_date=${encodeURIComponent(
          startDate
        )}&end_date=${encodeURIComponent(endDate)}`
      );
      if (!response.ok) {
        throw new Error("Error fetching data");
      }
      const data = await response.json();

      // Use a Map to track the max rest days for each team
      const maxRestDaysMap = new Map();
      data.rankings.forEach((team) => {
        if (
          !maxRestDaysMap.has(team.teamname) ||
          team.days_of_rest > maxRestDaysMap.get(team.teamname).days_of_rest
        ) {
          maxRestDaysMap.set(team.teamname, team); // Store the team with max rest days
        }
      });

      setRankings(Array.from(maxRestDaysMap.values())); // Convert Map back to array
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRankings();
  }, [startDate, endDate]);

  // Helper function to generate chart data
  const generateChartData = () => ({
    labels: rankings.map((team) => team.teamname), // X-axis labels for team names
    datasets: [
      {
        label: "Rest Days",
        data: rankings.map((team) => team.days_of_rest), // Y-axis data for rest days
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  });

  // Chart options with filtering via the legend
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: true, // Display the legend to allow filtering
        onClick: (e, legendItem, legend) => {
          const index = legendItem.datasetIndex;
          const ci = legend.chart;
          const meta = ci.getDatasetMeta(index);

          // Toggle visibility of the clicked legend item
          meta.hidden =
            meta.hidden === null ? !ci.data.datasets[index].hidden : null;
          ci.update();
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.raw} days`,
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
      },
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1, // Control step size of Y-axis
        },
      },
    },
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Longest Rest Span (No Games) by Team</h1>

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
        <button onClick={fetchRankings} style={styles.button}>
          Fetch Data
        </button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={styles.error}>Error: {error}</p>}

      <div style={styles.chartContainer}>
        <Bar data={generateChartData()} options={chartOptions} />
      </div>
    </div>
  );
};

// Styles
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
};

export default RestDaysBarChart;
