// Socket.IO server implementation for real-time communication (video calls and chat)
import { Server } from "socket.io"; // Import Socket.IO server

// Global storage objects:
let connections = {};   // Tracks which sockets are in which rooms (room path → array of socket IDs)
let messages = {};     // Stores chat messages organized by room (room path → message history)
let timeOnline = {};    // Tracks connection times for each socket (socket ID → connection timestamp)

// Main function to set up Socket.IO server
export const connectToSocket = (server) => {
    // Create Socket.IO server instance with CORS configuration for development
    const io = new Server(server, {
        cors: {
            origin: "*", // Allow all origins (for development only)
            methods: ["GET", "POST"], // Allowed HTTP methods
            allowedHeaders: ["*"], // Allowed headers
            credentials: true // Allow credentials
        }
    });

    // Handle new socket connections
    io.on("connection", (socket) => {
        console.log("SOMETHING CONNECTED"); // Log new connection

        // Handle when a user joins a video call room
        socket.on("join-call", (path) => {
            // Create room entry if it doesn't exist
            if(connections[path] === undefined) {
                connections[path] = [];
            }

            // Add socket to the room
            connections[path].push(socket.id);
            // Record connection time
            timeOnline[socket.id] = new Date();

            // Notify all users in the room about the new connection
            for (let a = 0; a < connections[path].length; a++) {
                io.to(connections[path][a]).emit("user-joined", socket.id, connections[path]);
            }

            // Send message history to the new user if room has messages
            if (messages[path] !== undefined) {
                for (let a = 0; a < messages[path].length; ++a) {
                    io.to(socket.id).emit("chat-message", 
                        messages[path][a]['data'], 
                        messages[path][a]['sender'], 
                        messages[path][a]['socket-id-sender']);
                }
            }
        });

        // Handle WebRTC signaling messages between peers
        socket.on("signal", (toId, message) => {
            io.to(toId).emit("signal", socket.id, message); // Forward signal to specific user
        });

        // Handle new chat messages
        socket.on("chat-message", (data, sender) => {
            // Find which room the sender is in
            const [matchingRoom, found] = Object.entries(connections)
                .reduce(([room, isFound], [roomKey, roomValue]) => {
                    if (!isFound && roomValue.includes(socket.id)) {
                        return [roomKey, true]; // Found the room
                    }
                    return [room, isFound];
                }, ['', false]);

            if (found === true) {
                // Initialize message storage if needed
                if (messages[matchingRoom] === undefined) {
                    messages[matchingRoom] = [];
                }

                // Store the new message
                messages[matchingRoom].push({ 
                    'sender': sender, 
                    "data": data, 
                    "socket-id-sender": socket.id 
                });
                
                console.log("message", matchingRoom, ":", sender, data);

                // Broadcast message to all in the room
                connections[matchingRoom].forEach((elem) => {
                    io.to(elem).emit("chat-message", data, sender, socket.id)
                })
            }
        });

        // Handle disconnections
        socket.on("disconnect", () => {
            // Calculate how long the user was connected
            var diffTime = Math.abs(timeOnline[socket.id] - new Date());

            var key;

            // Find which room the disconnecting user was in
            for (const [k, v] of JSON.parse(JSON.stringify(Object.entries(connections)))) {
                for (let a = 0; a < v.length; ++a) {
                    if (v[a] === socket.id) {
                        key = k; // Found the room

                        // Notify all remaining users about the departure
                        for (let a = 0; a < connections[key].length; ++a) {
                            io.to(connections[key][a]).emit('user-left', socket.id);
                        }

                        // Remove user from the room
                        var index = connections[key].indexOf(socket.id);
                        connections[key].splice(index, 1);

                        // Clean up empty rooms
                        if (connections[key].length === 0) {
                            delete connections[key];
                        }
                    }
                }
            }
        });
    });
    
    return io; // Return the configured Socket.IO instance
}