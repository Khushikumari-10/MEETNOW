import { useEffect, useState } from "react";    // Import necessary React hooks
import { useNavigate } from "react-router-dom";    // Import navigation hook from React Router

// Define the Higher-Order Component (HOC) that adds authentication protection
const withAuth = (WrappedComponent) => {
    
    const AuthComponent = (props) => {    // Create and return the authentication wrapper component
        
        const navigate = useNavigate();    // Initialize navigation function
        const [isAuth, setIsAuth] = useState(null);    // null = loading, false = not auth, true = auth

        // Effect runs once when component mounts
        useEffect(() => {
            
            const token = localStorage.getItem("token");    // Check for authentication token in localStorage
            
            if (!token) {
                navigate("/auth"); //if no token found - Redirect to authentication page
                setIsAuth(false); //Set auth state to false
            } else {
                
                setIsAuth(true);    // If token exists, set auth state to true
            }
        }, [navigate]); // Dependency array with navigate function

        if (isAuth === null) return null; // Loading state
        if (!isAuth) return null;       // Prevents unauthorized render before redirect

        return <WrappedComponent {...props} />;    // Render the original component with all its props
    };

    
    return AuthComponent;    // Return the authentication wrapper component
};

export default withAuth