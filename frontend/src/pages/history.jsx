// Import React hooks and components
import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext'; // Authentication context
import { useNavigate } from 'react-router-dom'; // For navigation
import { Card, CardContent, Typography, IconButton, Box, CircularProgress, Button } from '@mui/material'; // Material-UI components
import HomeIcon from '@mui/icons-material/Home'; // Home icon
import HistoryIcon from '@mui/icons-material/History'; // History icon
import "../App.css"; // Custom styles

// Main History component
export default function History() {
    // Get history function from auth context
    const { getHistoryOfUser } = useContext(AuthContext);

    // State variables for component
    const [meetings, setMeetings] = useState([]); // Stores meeting history
    const [loading, setLoading] = useState(true); // Loading state
    const [error, setError] = useState(null); // Error state

    const navigate = useNavigate(); // Navigation function

    // Effect hook to fetch meeting history when component mounts
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                setLoading(true); 
                const history = await getHistoryOfUser(); 
                setMeetings(history);
            } catch (err) {
                setError('Failed to load meeting history'); 
                console.error(err); 
            } finally {
                setLoading(false); // Stop loading regardless of success/failure
            }
        };
        fetchHistory(); // Call the async function
    }, [getHistoryOfUser]); // Dependency array with getHistoryOfUser

    // Function to format date strings into readable format
    const formatDate = (dateString) => {
        const date = new Date(dateString); // Create Date object
        const options = { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        };
        return new Intl.DateTimeFormat('en-US', options).format(date); // Format using Intl
    };

    // Component rendering
    return (
        <div className="historyContainer">
            {/* Navigation bar */}
            <nav className="historyNav">
                <div className="navHeader">
                    {/* Home button */}
                    <IconButton 
                        onClick={() => navigate("/home")} // Navigate to home
                        sx={{ color: 'white' }} 
                    >
                        <HomeIcon fontSize="large" /> 
                    </IconButton>
                    {/* Page title */}
                    <Typography variant="h5" sx={{ ml: 2, color: 'white', mt:1 }}>
                        Meeting History
                    </Typography>
                </div>
            </nav>
           
            {/* Main content area */}
            <Box className="historyContent">
                {/* Loading state */}
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                        <CircularProgress size={60} sx={{ color: '#3e0551' }} /> 
                    </Box>
                ) : error ? (
                    /* Error state */
                    <Box sx={{ textAlign: 'center', mt: 4 }}>
                        <Typography color="error" sx={{ mb: 2 }}>{error}</Typography> 
                        <Button 
                            variant="contained" 
                            onClick={() => window.location.reload()} // Reload page
                            sx={{
                                backgroundColor: '#3e0551', 
                                '&:hover': { backgroundColor: '#5e0780' } 
                            }}
                        >
                            Retry
                        </Button>
                    </Box>
                ) : meetings.length === 0 ? (
                    /* Empty state */
                    <Box sx={{ textAlign: 'center', mt: 4 }}>
                        <HistoryIcon sx={{ fontSize: 60, color: 'text.disabled' }} /> 
                        <Typography variant="h6" sx={{ mt: 2 }}>
                            No meeting history found
                        </Typography>
                    </Box>
                ) : (
                    /* Meeting list */
                    meetings.map((meeting, index) => (
                        // Meeting card for each history item
                        <Card 
                            key={index}
                            sx={{ 
                                mb: 2, 
                                borderRadius: '12px', 
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)', 
                                '&:hover': {
                                    transform: 'translateY(-2px)', 
                                    boxShadow: '0 6px 16px rgba(0,0,0,0.15)' 
                                },
                                transition: 'all 0.3s ease'
                            }}
                        >
                            <CardContent>
                                {/* Meeting code */}
                                <Typography 
                                    variant="h6" 
                                    sx={{ 
                                        fontWeight: 600, 
                                        color: '#3e0551', 
                                        mb: 1 
                                    }}
                                >
                                    Meeting Code: {meeting.meetingCode}
                                </Typography>
                                {/* Formatted date with calendar emoji */}
                                <Typography 
                                    variant="body1" 
                                    color="text.secondary"
                                    sx={{ display: 'flex', alignItems: 'center' }}
                                >
                                    <span style={{ marginRight: '8px' }}>🗓</span>
                                    {formatDate(meeting.date)}
                                </Typography>
                                {/* Join again button */}
                                <Button
                                    variant="outlined"
                                    sx={{
                                        mt: 2,
                                        color: '#3e0551', 
                                        borderColor: '#3e0551', 
                                        '&:hover': {
                                            backgroundColor: 'rgba(62, 5, 81, 0.08)',
                                            borderColor: '#3e0551'
                                        }
                                    }}
                                    onClick={() => navigate(`/${meeting.meetingCode}`)} // Navigate to meeting
                                >
                                    Join Again
                                </Button>
                            </CardContent>
                        </Card>
                    ))
                )}
            </Box>
        </div>
    );
}