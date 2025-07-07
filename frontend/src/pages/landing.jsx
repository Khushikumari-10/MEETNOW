// Import React dependencies
import React from 'react';    
import "../App.css"; // Import CSS styles    
import { Link, useNavigate } from "react-router-dom"; // Routing utilities

// Main LandingPage component
export default function LandingPage() {
  // Navigation hook for programmatic routing
  let navigate = useNavigate();

  return (
    // Main container for the landing page
    <div className='landingPageContainer'>

      {/* Navbar*/}
      <nav className="navBar">
        {/* Logo/header section */}
        <div className="navHeader">
          <h1 className="logo">Meet Now</h1>
        </div>

        {/* Navigation buttons */}
        <div className="navList">
          {/* Guest access button */}
          <button className="navButton" onClick={() => navigate("/sdkhfc")}>
            Join as Guest
          </button>
          {/* Registration button */}
          <button className="navButton" onClick={() => navigate("/auth")}>
            Register
          </button>
          {/* Login button */}
          <button className="navButton" onClick={() => navigate("/auth")}>
            Login
          </button>
        </div>
      </nav>

      {/* Main content section */}
      <div className="landingPageMainContainer">
        {/* Content container */}
        <div className="mainContent">
          <h1 className="content">
            <span className="highlight">Connect</span> with your loved ones
          </h1>
          
          <p className="subContent">Bridge distances instantly with Meet Now</p>
          
          <button className="startButton">
            {/* Link to authentication page */}
            <Link to={"/auth"}>Get Started</Link>
          </button>
        </div>
      </div>

    </div>
  )
}