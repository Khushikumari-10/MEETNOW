// Import React and necessary dependencies
import React, { useContext, useState } from 'react';
import withAuth from '../utils/withAuth'; // Higher-order component for authentication
import { useNavigate } from 'react-router-dom'; // For navigation
import "../App.css"; // Custom styles
import { Button, IconButton, TextField, Typography} from '@mui/material'; // Material-UI components
import RestoreIcon from '@mui/icons-material/Restore'; // History icon
import { AuthContext } from '../contexts/AuthContext'; // Authentication context

// Main Home component
function HomeComponent() {
    // Hooks for navigation and state management
    const navigate = useNavigate();

    const [meetingCode, setMeetingCode] = useState(""); // Stores meeting code input
    const [error, setError] = useState(""); // Stores error messages
    const { addToUserHistory } = useContext(AuthContext); // Get function from auth context
    
    // Function to handle joining a video call
    const handleJoinVideoCall = async () => {
        // Validate meeting code is not empty
        if (!meetingCode.trim()) {
            setError("Please enter a meeting code");
            return;
        }
        
        try {
            // Add meeting to user's history
            await addToUserHistory(meetingCode);
            // Navigate to meeting room
            navigate(`/${meetingCode}`);
        } catch (err) {
            // Handle errors
            setError("Failed to join meeting. Please try again.");
        }
    }

    // Component rendering
    return (
        <div className='homeContainer'>
            {/* Navigation bar */}
            <nav className="homeNav">
                <div className="navHeader">
                    {/* Clickable logo that navigates to home */}
                    <h1 className="logo" onClick={() => navigate("/")}>
                        Meet Now
                    </h1>
                </div>

                {/* Navigation actions */}
                <div className="navActions">
                    {/* History button */}
                    <IconButton 
                        onClick={() => navigate("/history")} // Navigate to history page
                        sx={{ color: 'white'}} 
                    >
                        <RestoreIcon /> {/* History icon */}
                        <Typography variant="body1" sx={{ ml: 1 }}>History</Typography>
                    </IconButton>
                    {/* Logout button */}
                    <Button 
                        onClick={() => {
                            localStorage.removeItem("token"); // Remove auth token
                            navigate("/auth"); // Navigate to auth page
                        }}
                        sx={{
                            color: 'white',
                            border: '1px solid white', 
                            borderRadius: '50px', 
                            ml: 2, 
                            '&:hover': {
                                backgroundColor: 'rgba(255,255,255,0.1)' 
                            },
                        }}
                    >
                        Logout
                    </Button>
                </div>
            </nav>

            {/* Main content area */}
            <div className="meetContainer">
                {/* Left panel with text and join form */}
                <div className="leftPanel">
                    <div className="meetContent">
                        {/* Gradient text heading */}
                        <Typography variant="h3" sx={{ 
                            fontWeight: 700, 
                            mb: 3, 
                            background: 'linear-gradient(to right, #3e0551, #8a2be2)', 
                            WebkitBackgroundClip: 'text', 
                            backgroundClip: 'text', 
                            color: 'transparent' 
                        }}>
                            Premium Quality Video Calls
                        </Typography>

                        {/* Join meeting container */}
                        <div className="joinContainer">
                            {/* Meeting code input field */}
                            <TextField 
                                onChange={e => {
                                    setMeetingCode(e.target.value); // Update meeting code
                                    setError(""); // Clear any errors when typing
                                }} 
                                label="Meeting Code" 
                                variant="outlined"
                                color="secondary"
                                error={!!error} // Show error state if error exists
                                helperText={error} // Display error message
                                sx={{
                                    flex: 1, // Take available space
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '20px',
                                        backgroundColor: 'white' 
                                    }
                                }}
                            />
                            {/* Join button */}
                            <Button 
                                onClick={handleJoinVideoCall} 
                                variant='contained'
                                sx={{
                                    borderRadius: '20px', 
                                    ml: 1, 
                                    backgroundColor: '#3e0551', 
                                    '&:hover': {
                                        backgroundColor: '#5e0780', 
                                        transform: 'translateY(-2px)'
                                    },
                                }}
                            >
                                Join
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Right panel with logo image */}
                <div className='rightPanel'>
                    <img src='/logo3.png' alt="Meet Now Logo" className="homeImage" />
                </div>
            </div>
        </div>
    )
}

// Export the component wrapped with authentication HOC
export default withAuth(HomeComponent)
