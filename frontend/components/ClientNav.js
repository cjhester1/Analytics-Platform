"use client"; // This makes the component client-side
import { useEffect, useState } from "react";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import Link from "next/link";
import { Navbar, Nav, Container, NavDropdown } from "react-bootstrap";

export default function ClientNav() {
  const { user } = useUser(); // Get user data
  const [role, setRole] = useState(null);
  const [showNavbar, setShowNavbar] = useState(true); // State to track navbar visibility
  let lastScrollY = 0; // Track the last scroll position

  // Handle scroll to show/hide the navbar
  const handleScroll = () => {
    const currentScrollY = window.scrollY;
    if (currentScrollY > lastScrollY) {
      setShowNavbar(false); // Hide navbar on scroll down ** functionality not working yet
    } else {
      setShowNavbar(true); // Show navbar on scroll up
    }
    lastScrollY = currentScrollY;
  };

  // Attach the scroll event listener
  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Fetch user role once signed in
  useEffect(() => {
    if (user) {
      const orgRole = user?.organizationMemberships?.[0]?.role;
      setRole(orgRole);
    }
  }, [user]);

  return (
    <>
      <SignedIn>
        <Navbar
          bg="light"
          variant="light"
          expand="lg"
          fixed="top"
          className={showNavbar ? "navbar-visible" : "navbar-hidden"} // Toggle visibility with class
          style={{ transition: "top 0.3s" }} // Smooth transition effect
        >
          <Container className="justify-content-between">
            {/* Navbar Brand with NBA logo */}
            <Navbar.Brand as={Link} href="/">
              <img
                src="/nba-logo-transparent.png" // Path to the logo in the public folder
                alt="NBA Logo"
                style={{ width: "40px", marginRight: "10px" }} // Adjust the size as needed
              />
              Analytics
            </Navbar.Brand>

            {/* Toggler for Mobile View */}
            <Navbar.Toggle aria-controls="basic-navbar-nav" />

            <Navbar.Collapse
              id="basic-navbar-nav"
              className="justify-content-center"
            >
              {/* Links centered */}
              <Nav>
                <Nav.Link as={Link} href="/RankingsPage">
                  Games Played Rankings
                </Nav.Link>
                <Nav.Link as={Link} href="/B2BRankings">
                  B2B Rankings
                </Nav.Link>
                <Nav.Link as={Link} href="/RestRankingsPage">
                  Rest Rankings
                </Nav.Link>
                <Nav.Link as={Link} href="/PlayerStintsPage">
                  Player Stint Metrics
                </Nav.Link>
              </Nav>
            </Navbar.Collapse>
            {/* Conditional Admin and Member Links */}

            {/* {role === "org:admin" && (
              <Navbar.Brand title="Admin">Admin</Navbar.Brand>
            )} */}
            {/* {role === "org:member" && (
              <Navbar.Brand title="Member">
                Signed in as Staff Member - Restricted Access
              </Navbar.Brand>
            )} */}

            {/* User Button aligned on the right */}
            <Navbar.Collapse className="justify-content-end">
              <UserButton />
            </Navbar.Collapse>
          </Container>
        </Navbar>
      </SignedIn>

      <style jsx>{`
        .navbar-visible {
          top: 0;
        }

        .navbar-hidden {
          top: -80px; /* Adjust this value based on navbar height */
        }

        nav {
          position: fixed;
          width: 100%;
          z-index: 999; /* Ensure the navbar stays on top */
        }
      `}</style>
    </>
  );
}
