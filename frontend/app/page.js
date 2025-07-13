"use client";
import { useEffect } from "react";
import { useUser, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs"; // Clerk components for authentication

export default function Page() {
  const { isLoaded, user } = useUser(); // Get Clerk's user status

  // Disable scrolling if the user is not signed in
  useEffect(() => {
    if (!user) {
      document.body.style.overflow = "hidden"; // Disable scrolling
    } else {
      document.body.style.overflow = "auto"; // Enable scrolling when signed in
    }

    // Cleanup to re-enable scrolling when component is unmounted
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [user]);

  return (
    <>
      {/* Signed in content */}
      <SignedIn>
        <div style={styles.container}>
          {/* Background video */}
          <video autoPlay muted loop style={styles.videoBackground}>
            <source
              src="/background.mp4" // Video path relative to the public folder
              type="video/mp4"
            />
            Your browser does not support the video tag.
          </video>

          {/* Overlay content */}
          <div style={styles.overlay}>
            <h1 style={styles.title}></h1>
            <p style={styles.description}>
              Explore detailed NBA analytics, including Games Played rankings,
              Back-to-Back performance, Rest span rankings, and Player Stint
              metrics. Dive deep into game statistics with interactive charts
              and detailed tables, designed to help you track performance and
              give you deeper insights.
            </p>

            {/* Dashboard sections */}
            <div style={styles.sections}>
              <div style={styles.sectionCard}>
                <h2>Team Rankings</h2>
                <p>
                  View comprehensive NBA team Games Played rankings, updated
                  daily to reflect the latest performance metrics.
                </p>
                <a href="/RankingsPage" style={styles.linkButton}>
                  Go to Games Played Rankings
                </a>
              </div>

              <div style={styles.sectionCard}>
                <h2>Back-to-Back Analysis</h2>
                <p>
                  Discover which NBA teams have the most back-to-back games,
                  home and away included, within a given timeframe.
                </p>
                <a href="/B2BRankings" style={styles.linkButton}>
                  Go to B2B Analysis
                </a>
              </div>

              <div style={styles.sectionCard}>
                <h2>Rest Days Insights</h2>
                <p>Track NBA teams' Rest rankings within a given timeframe.</p>
                <a href="/RestRankingsPage" style={styles.linkButton}>
                  Go to Rest Insights
                </a>
              </div>

              <div style={styles.sectionCard}>
                <h2>Player Stint Analysis</h2>
                <p>
                  Analyze player stints during games to understand rotation
                  patterns and impacts on team performance.
                </p>
                <a href="/PlayerStintsPage" style={styles.linkButton}>
                  Go to Player Stints
                </a>
              </div>
            </div>
          </div>
        </div>
      </SignedIn>

      {/* Sign-in content */}
      <SignedOut>
        <div style={styles.signInContainer}>
          <div style={styles.signInOverlay}>
            <h2 style={styles.signInTitle}>
              You need to sign in to access this page.
            </h2>
            <SignInButton />
          </div>
        </div>
      </SignedOut>
    </>
  );
}

// Styles for the landing page and sections
const styles = {
  container: {
    position: "relative",
    height: "100vh",
    width: "100vw",
    overflow: "hidden",
  },
  videoBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    zIndex: -1,
    filter: "brightness(0.7)", // Dims video for better readability of text
  },
  overlay: {
    position: "relative",
    zIndex: 2,
    color: "#fff",
    textAlign: "center",
    padding: "20px",
    backgroundColor: "rgba(0, 0, 0, 0.4)", // Light black overlay for better text contrast
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  title: {
    fontSize: "48px",
    fontWeight: "bold",
    marginBottom: "20px",
  },
  description: {
    fontSize: "20px",
    marginBottom: "40px",
    maxWidth: "800px",
    margin: "0 auto",
    lineHeight: "1.6",
  },
  sections: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", // Adjusts to fit screen size
    gap: "20px",
    marginTop: "40px",
  },
  sectionCard: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: "20px",
    borderRadius: "10px",
    textAlign: "center",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
    transition: "transform 0.3s",
  },
  linkButton: {
    marginTop: "15px",
    display: "inline-block",
    padding: "10px 20px",
    color: "#333333",
    backgroundColor: "#fff",
    textDecoration: "none",
    borderRadius: "5px",
    transition: "background-color 0.3s",
  },
  // Sign-in overlay styles
  signInContainer: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0, 0, 0, 0.8)", // Dark overlay
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  signInOverlay: {
    backgroundColor: "#fff",
    padding: "40px",
    borderRadius: "10px",
    textAlign: "center",
    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)", // Add shadow for emphasis
  },
  signInTitle: {
    fontSize: "24px",
    color: "#333",
    marginBottom: "20px",
  },
};
