// Import React and necessary Material-UI components
import * as React from 'react';
import Avatar from '@mui/material/Avatar';  // For displaying user avatars
import Button from '@mui/material/Button';   // For buttons
import CssBaseline from '@mui/material/CssBaseline';    // For CSS reset/normalization
import TextField from '@mui/material/TextField';   // For input fields
import Paper from '@mui/material/Paper';    
import Box from '@mui/material/Box'; 
import Grid from '@mui/material/Grid';   
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { createTheme, ThemeProvider } from '@mui/material/styles';  // For custom theming
import { AuthContext } from '../contexts/AuthContext';     // Authentication context
import { Snackbar, Typography, Link } from '@mui/material';    // For notifications, text, and links
import { useNavigate } from 'react-router-dom';  // For navigation
import "../App.css";   // Custom styles

// Create a custom theme with purple primary color and rounded buttons/inputs
const theme = createTheme({
  palette: {
    primary: {
      main: '#3e0551',
    },
    secondary: {
      main: '#e0aaff',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '50px',
          textTransform: 'none',
          fontWeight: 600,
          padding: '10px 24px',
          boxShadow: 'none',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '50px',
          },
        },
      },
    },
  },
});

// Main authentication component
export default function Authentication() {
    // State variables for form data and UI
    const [username, setUsername] = React.useState("");  // Stores username input
    const [password, setPassword] = React.useState("");    // Stores password input
    const [name, setName] = React.useState("");   // Stores name input (for registration)
    const [error, setError] = React.useState("");   // Stores error messages
    const [message, setMessage] = React.useState("");  // Stores success messages
    const [formState, setFormState] = React.useState(0);   // 0 = login, 1 = register
    const [open, setOpen] = React.useState(false);   // Controls snackbar visibility
    
    const { handleRegister, handleLogin } = React.useContext(AuthContext);   // Get authentication functions from context
    const navigate = useNavigate();   // Navigation function

    const validateForm = () => {
        // Check if username or password is empty
        if (!username.trim() || !password.trim()) {
            setError("Username and password are required");
            return false;
        }
        
        // For registration, check if name is provided
        if (formState === 1 && !name.trim()) {
            setError("Full name is required");
            return false;
        }
        
        setError("");   // Clear errors if validation passes
        return true;
    };

    // Authentication handler (login/register)
    const handleAuth = async () => {
        // Validate form before proceeding
        if (!validateForm()) {
            return;
        }

        try {
            if (formState === 0) {
                // Handle login
                await handleLogin(username, password);
            }
            if (formState === 1) {
                // Handle registration
                let result = await handleRegister(name, username, password);
                setMessage(result);   // Set success message
                setOpen(true);  // Show snackbar
                setError("");  // Clear errors
                 // Reset form and switch to login view
                setUsername("");
                setPassword("");
                setFormState(0);
            }
        } catch (err) {
            // Handle errors from API
            setError(err.response?.data?.message || "An error occurred");
        }
    };
    
    // Component rendering
    return (
        <ThemeProvider theme={theme}>
            {/* Navbar */}
            <nav className="authNav">
                <div className="navHeader">
                    <h1 className="logo" onClick={() => navigate("/")}>
                        Meet Now
                    </h1>
                </div>
            </nav>

            {/* Main grid layout */}
            <Grid container component="main" sx={{ height: 'calc(100vh - 70px)', mt: '70px' }}>
                <CssBaseline />  {/* CSS normalization */}
                
                {/* Left side with background image */}
                <Grid
                    sx={{
                        background: 'linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url("/background.png")',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flex: { xs: 0, md: 7 },
                    }}
                >
                    {/* Welcome message that changes based on form state */}
                    <Box sx={{ color: 'white', textAlign: 'center', p: 4 }}>
                        <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
                            {formState === 0 ? 'Welcome Back' : 'Join Meet Now'}
                        </Typography>
                        <Typography variant="h6">
                            {formState === 0 
                                ? 'Sign in to continue your conversations' 
                                : 'Create an account to get started'}
                        </Typography>
                    </Box>
                </Grid>
                
                {/* Right side with form */}
                <Grid
                    component={Paper}
                    elevation={6}
                    square
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        backgroundColor: 'white',
                        flex: { xs: 12, md: 5 },
                    }}
                >
                    {/* Form container */}
                    <Box
                        sx={{
                            my: 4,
                            mx: 4,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                        }}
                    >
                        {/* Lock icon avatar */}
                        <Avatar sx={{ 
                            m: 2, 
                            bgcolor: 'primary.main',
                            width: 60, 
                            height: 60,
                        }}>
                            <LockOutlinedIcon fontSize="medium" />
                        </Avatar>

                        {/* Toggle between login and register */}
                        <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                            <Button 
                                variant={formState === 0 ? "contained" : "outlined"}
                                onClick={() => {
                                    setFormState(0);
                                    setError("");
                                }}
                                sx={{
                                    minWidth: 120,
                                    bgcolor: formState === 0 ? 'primary.main' : 'transparent',
                                    color: formState === 0 ? 'white' : 'primary.main',
                                    borderColor: 'primary.main',
                                }}
                            >
                                Sign In
                            </Button>
                            <Button 
                                variant={formState === 1 ? "contained" : "outlined"}
                                onClick={() => {
                                    setFormState(1);
                                    setError("");
                                }}
                                sx={{
                                    minWidth: 120,
                                    bgcolor: formState === 1 ? 'primary.main' : 'transparent',
                                    color: formState === 1 ? 'white' : 'primary.main',
                                    borderColor: 'primary.main',
                                }}
                            >
                                Sign Up
                            </Button>
                        </Box>

                        {/* Form fields */}
                        <Box component="form" noValidate sx={{ mt: 1, width: '100%' }}>
                            {/* Name field (only shown for registration) */}
                            {formState === 1 && (
                                <TextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    label="Full Name"
                                    value={name}
                                    autoFocus
                                    onChange={(e) => setName(e.target.value)}
                                    sx={{ mb: 2 }}
                                    error={error.includes("Full name")}
                                />
                            )}

                            {/* Username field */}
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                label="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                sx={{ mb: 2 }}
                                error={error.includes("Username")}
                            />

                            {/* Password field */}
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                label="Password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                sx={{ mb: 2 }}
                                error={error.includes("Password")}
                            />

                            {/* Error message display */}
                            {error && (
                                <Typography color="error" sx={{ mt: 1, textAlign: 'center' }}>
                                    {error}
                                </Typography>
                            )}

                            {/* Submit button */}
                            <Button
                                fullWidth
                                variant="contained"
                                onClick={handleAuth}
                                sx={{ 
                                    mt: 3, 
                                    mb: 2,
                                    py: 1.5,
                                    fontSize: '1rem',
                                    bgcolor: 'primary.main',
                                    '&:hover': {
                                        bgcolor: 'primary.dark',
                                    }
                                }}
                            >
                                {formState === 0 ? "Sign In" : "Create Account"}
                            </Button>

                            {/* Toggle link between login and register */}
                            <Typography variant="body2" sx={{ textAlign: 'center', mt: 2 }}>
                                {formState === 0 
                                    ? "Don't have an account? " 
                                    : "Already have an account? "}
                                <Link 
                                    component="button" 
                                    onClick={() => {
                                        setFormState(formState === 0 ? 1 : 0);
                                        setError("");
                                    }}
                                    sx={{ 
                                        color: 'primary.main',
                                        fontWeight: 600,
                                        textDecoration: 'none',
                                        '&:hover': {
                                            textDecoration: 'underline',
                                        }
                                    }}
                                >
                                    {formState === 0 ? "Sign Up" : "Sign In"}
                                </Link>
                            </Typography>
                        </Box>
                    </Box>
                </Grid>
            </Grid>

            {/* Success message snackbar (notification) */}
            <Snackbar
                open={open}
                autoHideDuration={3000}
                onClose={() => setOpen(false)}
                message={message}
                sx={{
                    '& .MuiSnackbarContent-root': {
                        bgcolor: 'primary.main',
                        color: 'white',
                        borderRadius: '50px',
                    }
                }}
            />
        </ThemeProvider>
    );
}
