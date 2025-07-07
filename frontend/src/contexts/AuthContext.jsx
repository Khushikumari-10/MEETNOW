// Importing required modules
import axios from "axios"; // HTTP client for making requests
import httpStatus from "http-status"; // HTTP status codes utility
import { createContext, useContext, useState } from "react"; // React hooks
import { useNavigate } from "react-router-dom"; // Routing navigation hook
import server from "../environment";

// Creating an authentication context with empty default value
export const AuthContext = createContext({});

// Creating an axios client instance with base URL
const client = axios.create({
    baseURL: `${server}/api/v1/users` // Base URL for API endpoints
});

// AuthProvider component that will wrap the application to provide auth functionality
export const AuthProvider = ({ children }) => {

    // Using the auth context (though this might not be needed here)
    const authContext = useContext(AuthContext);

    // State for storing user data, initialized with authContext
    const [userData, setUserData] = useState(authContext);

    // Hook for programmatic navigation
    const router = useNavigate();  //useNavigate() sirf router ke ander kaam krega

    // Function to handle user registration
    const handleRegister = async (name, username, password) => {
        try {
            // Making POST request to register endpoint
            let request = await client.post("/register", {
                name: name,
                username: username,
                password: password
            });
    
            // If registration is successful (201 Created)
            if (request.status === httpStatus.CREATED) {
                return request.data.message; // Return success message
            };
        } catch (err) {
            throw err; // Propagate any errors
        }
    }

    // Function to handle user login
    const handleLogin = async (username, password) => {
        try {
            // Making POST request to login endpoint
            let request = await client.post("/login", {
                username: username,
                password: password
            });

            // console.log(username, password) // Logging credentials (for debugging)
            // console.log(request.data) // Logging response data (for debugging)

            // If login is successful (200 OK)
            if (request.status === httpStatus.OK) {
                localStorage.setItem("token", request.data.token); // Store token in localStorage
                router("/home") // Navigate to home page
            }
        } catch (err) {
            // console.error("Login error:", err.response ? err.response.data : err.message);
            throw err; // Propagate any errors
        }
    }

    // Function to get user's activity history
    const getHistoryOfUser = async () => {
        try {
            // Making GET request to get activity history
            let request = await client.get("/get_all_activity", {
                params: {
                    token: localStorage.getItem("token") // Passing token as query param
                }
            });
            return request.data // Return the activity data
        } catch (err) {
            throw err; // Propagate any errors
        }
    }

    // Function to add a meeting to user's history
    const addToUserHistory = async (meetingCode) => {
        try {
            // Making POST request to add activity
            let request = await client.post("/add_to_activity", {
                token: localStorage.getItem("token"), // Passing token in body
                meeting_code: meetingCode // Passing meeting code
            });
            return request // Return the response
        } catch (e) {
            throw e; // Propagate any errors
        }
    }

    // Object containing all the values and functions to be provided by context
    const data = {
        userData, setUserData, addToUserHistory, getHistoryOfUser, handleRegister, handleLogin
    }

    // Return the provider component with all the data as value
    return (
        <AuthContext.Provider value={data}>
            {children}
        </AuthContext.Provider>
    )
}