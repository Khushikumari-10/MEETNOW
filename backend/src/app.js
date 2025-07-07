import dotenv from 'dotenv';
if (process.env.NODE_ENV !== "IS_PROD") {
  dotenv.config();
}

import express from "express"; // Express framework for handling HTTP requests
import { createServer } from "node:http"; // Node's HTTP module to create server

import { connectToSocket } from "./controllers/socketManager.js"; // Socket.IO setup
import mongoose from "mongoose"; // MongoDB ODM (Object Data Modeling)

// Import middleware and routes
import cors from "cors"; // Cross-Origin Resource Sharing middleware
import userRoutes from "./routes/user.routes.js";          // User-related routes

// Initialize Express application
const app = express(); // Create Express instance

// Create HTTP server and integrate with Express
const server = createServer(app); // This allows Socket.IO to work with Express

// Initialize Socket.IO and connect it to our HTTP server
const io = connectToSocket(server); // This sets up all Socket.IO event handlers

// Configure application settings
app.set("port", (process.env.PORT || 8080)); // Set port from environment variable or default to 8080

// Configure middleware
app.use(cors()); // Enable CORS for all routes (allows cross-origin requests)
app.use(express.json({ limit: "40kb" })); // Parse JSON bodies (max 40kb)
app.use(express.urlencoded({ limit: "40kb", extended: true })); // Parse URL-encoded bodies

// Configure routes
app.use("/api/v1/users", userRoutes); // Mount userRoutes with version prefix

// Database connection and server startup function
const start = async () => {  
    // Connect to MongoDB Atlas database
    // app.set("mongo_user")
    const connectionDb = await mongoose.connect(process.env.ATLASDB_URL);
        
    //Log successful database connection
    console.log(`MONGO Connected DB Host: ${connectionDb.connection.host}`);
        
    // Start listening for requests
    server.listen(app.get("port"), () => {
        console.log("LISTENING ON PORT 8080");
    });
}


start();  // Start the application