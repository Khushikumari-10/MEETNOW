// Authentication Routes - Handles user login, registration, and meeting history
import httpStatus from "http-status"; // Import HTTP status codes for responses
import { User } from "../models/user.model.js"; // Import User model 
import bcrypt, { hash } from "bcrypt"; // Import bcrypt for password hashing and comparison
import crypto from "crypto"; // Import crypto for generating random tokens
import { Meeting } from "../models/meeting.model.js"; // Import Meeting model for meeting history

// Login function - handles user authentication
const login = async(req, res) => {
    
    const { username, password } = req.body;    // Extract username and password from request body

    // Check if username or password is missing
    if(!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    try {        
        const user = await User.findOne({ username });  // Find user in database by username
        
        // If user not found, return 404 error
        if(!user) {
            return res.status(httpStatus.NOT_FOUND).json({message: "User Not Found"});
        } 

        // Compare provided password with stored hashed password
        let isPasswordCorrect = await bcrypt.compare(password, user.password);

        // If password is correct
        if(isPasswordCorrect) {                          
            let token = crypto.randomBytes(20).toString("hex");  // Generate random token for session
            user.token = token;  // Save token to user document in database
            await user.save();          

            return res.status(httpStatus.OK).json({ token: token });    // Return success response with the token
        } else {           
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid Username or password" })  ;// Return unauthorized if password is wrong
        }

    } catch(e) {       
        res.status(500).json({ message: `Something went wrong ${e}`});    // Handle any unexpected errors
    }
}

// Register function - handles new user registration
const register = async (req, res) => {   
    const { name, username, password } = req.body;    // Extract name, username and password from request body

    try {        
        const existingUser = await User.findOne({ username });  

        // Check if user already exists
        if(existingUser) {
            return res.status(httpStatus.FOUND).json({ message: "User already exist" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);    // Hash the password for secure storage

        // Create new user
        const newUser = new User({
            name: name,
            username: username,
            password: hashedPassword
        });

        await newUser.save();    // Save new user to database
        
        res.status(httpStatus.CREATED).json({ message: "User Registered" });    // Return success response
    } catch (e) {       
        res.json({ message: `Something went wrong ${e}`});   // Handle any unexpected errors
    }
}

// Add meeting to user's history
const addToHistory = async(req, res) =>  {
    const { token, meeting_code } = req.body;    // Extract token and meeting code from request body

    try {
        const user = await User.findOne({ token: token }); //find user by their token

        // Create new meeting record
        const newMeeting = new Meeting ({
            user_id: user.username, // Store username as user identifier
            meetingCode: meeting_code // Store the meeting code
        });
        
        await newMeeting.save();    // Save meeting to database
        res.status(httpStatus.CREATED).json({ message: "Added to history"});    // Return success response       
    } catch(e) {
        res.json({ message: `Something went wrong ${e}`});   // Handle any unexpected errors
    }
}

// Get user's meeting history
const getUserHistory = async(req, res) => {
    const { token } = req.query;    // Extract token from query parameters
    
    try {      
        const user = await User.findOne({ token: token });   // Find user by their token
        const meetings = await Meeting.find({ user_id: user.username });  // Find all meetings associated with this user
        res.json(meetings);    // Return the meetings array
    } catch(e) {     
        res.json({ message: `Something went wrong ${e}`});   // Handle any unexpected errors
    }
}

// Export all the route handlers
export { login, register, addToHistory, getUserHistory }