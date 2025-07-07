import React, { useEffect, useRef, useState } from 'react'
import { Badge, IconButton, TextField } from '@mui/material';
import { Button } from '@mui/material';
import io from "socket.io-client";
import styles from "../styles/videoComponent.module.css";
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import ChatIcon from '@mui/icons-material/Chat';
import { Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import server from "../environment";

// Server configuration for socket.io connection
const server_url = server;

// Object to store all active peer connections
var connections = {};

// ICE server configuration for WebRTC (using Google's public STUN server)
const peerConfigConnections = {
    "iceServers": [
        { "urls": "stun:stun.l.google.com:19302" }
    ]
}

export default function VideoMeetComponent() {
    // Refs for managing socket and video elements
    var socketRef = useRef(); // Socket.io connection reference
    let socketIdRef = useRef(); // Current user's socket ID
    let localVideoRef = useRef(); // Reference to local video element
    
    // State for media availability and control
    let [videoAvailable, setVideoAvailable] = useState(true); 
    let [audioAvailable, setAudioAvailable] = useState(true);
    let [video, setVideo] = useState([]);  
    let [audio, setAudio] = useState();
    let [screen, setScreen] = useState();
    
    // State for UI controls
    let [showModal, setModal] = useState(false);  
    let [screenAvailable, setScreenAvailable] = useState();  
    let [messages, setMessages] = useState([]);  
    let [message, setMessage] = useState("");  
    let [newMessages, setNewMessages] = useState(0);  
    let [askForUsername, setAskForUsername] = useState(true);   
    let [username, setUsername] = useState("");  
    
    // Refs and state for remote videos
    const videoRef = useRef([]);
    let [videos, setVideos] = useState([]);

    // Check and request media permissions on component mount
    const getPermissions = async () => {
        try {
            // Check video permission
            const videoPermission = await navigator.mediaDevices.getUserMedia({video: true})
            setVideoAvailable(!!videoPermission);

            // Check audio permission
            const audioPermission = await navigator.mediaDevices.getUserMedia({audio: true})
            setAudioAvailable(!!audioPermission);

            // Check screen sharing support
            setScreenAvailable(!!navigator.mediaDevices.getDisplayMedia);

            // Initialize media stream if permissions granted
            if(videoAvailable || audioAvailable) {
                const userMediaStream = await navigator.mediaDevices.getUserMedia({ 
                    video: videoAvailable, 
                    audio: audioAvailable
                }); 
                if(userMediaStream) {
                    window.localStream = userMediaStream;
                    if(localVideoRef.current) {
                        localVideoRef.current.srcObject = userMediaStream;
                    }
                }
            }
        } catch (error) {
            console.error("Permission error:", error);
        }
    }

    // Initialize permissions on component mount
    useEffect(() => {
        getPermissions();
    }, [])

    // Handler for successful media stream acquisition
    let getUserMediaSuccess = (stream) => {    
        try {
            // Stop any existing tracks
            window.localStream.getTracks().forEach(track => track.stop())   
        } catch (e) { console.log(e) }

        // Update local stream and video element
        window.localStream = stream;   
        localVideoRef.current.srcObject = stream;

        // Update all peer connections with new stream
        for (let id in connections) {
            if (id === socketIdRef.current) continue;

            connections[id].addStream(window.localStream);
            connections[id].createOffer().then((description) => {
                connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                    })
                    .catch(e => console.log(e))
            })
        }

        // Handle track ending (e.g., camera disconnected)
        stream.getTracks().forEach(track => track.onended = () => {    
            setVideo(false);
            setAudio(false);
            try {
                let tracks = localVideoRef.current.srcObject.getTracks();
                tracks.forEach(track => track.stop());
            } catch (e) { console.log(e) }

            // Replace with black/silence stream
            let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
            window.localStream = blackSilence();
            localVideoRef.current.srcObject = window.localStream;

            // Update all peers
            for (let id in connections) {
                connections[id].addStream(window.localStream);
                connections[id].createOffer().then((description) => {
                    connections[id].setLocalDescription(description)
                        .then(() => {
                            socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                        })
                        .catch(e => console.log(e))
                })
            }
        })
    }

    // Utility functions for silent audio and black video
    let silence = () => {
        let ctx = new AudioContext();
        let oscillator = ctx.createOscillator();
        let dst = oscillator.connect(ctx.createMediaStreamDestination());
        oscillator.start();
        ctx.resume();
        return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
    }
    
    let black = ({ width = 640, height = 480 } = {}) => {
        let canvas = Object.assign(document.createElement("canvas"), { width, height });
        canvas.getContext('2d').fillRect(0, 0, width, height);
        let stream = canvas.captureStream();
        return Object.assign(stream.getVideoTracks()[0], { enabled: false });
    }

    // Main function to get user media
    let getUserMedia = () => {      
        if ((video && videoAvailable) || (audio && audioAvailable)) {
            navigator.mediaDevices.getUserMedia({ video: video, audio: audio })
                .then(getUserMediaSuccess)
                .catch((e) => console.log(e))
        } else {
            try {
                let tracks = localVideoRef.current.srcObject.getTracks();
                tracks.forEach(track => track.stop());
            } catch (e) { }
        }
    }

    // Update media when video/audio state changes
    useEffect(() => {
        if (video !== undefined && audio !== undefined) {
            getUserMedia();
        }
    }, [video, audio])

    // Handler for incoming WebRTC signals
    let gotMessageFromServer = (fromId, message) => {
        var signal = JSON.parse(message);

        if (fromId !== socketIdRef.current) {
            if (signal.sdp) {
                // Handle SDP offers/answers
                connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {    
                    if (signal.sdp.type === 'offer') {
                        // Create answer if we received an offer
                        connections[fromId].createAnswer().then((description) => {
                            connections[fromId].setLocalDescription(description).then(() => {
                                socketRef.current.emit('signal', fromId, JSON.stringify({ 'sdp': connections[fromId].localDescription }))
                            }).catch(e => console.log(e))
                        }).catch(e => console.log(e))
                    }
                }).catch(e => console.log(e))
            }

            if (signal.ice) {
                // Add ICE candidate for connection establishment
                connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e))
            }
        }
    }

    // Connect to signaling server and set up event handlers
    let connectToSocketServer = () => {
        socketRef.current = io.connect(server_url, { secure: false });

        socketRef.current.on('signal', gotMessageFromServer);

        socketRef.current.on('connect', () => {
            // Join the room/call
            socketRef.current.emit('join-call', window.location.href);
            socketIdRef.current = socketRef.current.id;   

            // Set up chat message handler
            socketRef.current.on('chat-message', addMessage);

            // Handle user leaving
            socketRef.current.on('user-left', (id) => {
                setVideos((videos) => videos.filter((video) => video.socketId !== id));   
            })

            // Handle new user joining
            socketRef.current.on('user-joined', (id, clients) => {
                clients.forEach((socketListId) => {
                    // Create new peer connection
                    connections[socketListId] = new RTCPeerConnection(peerConfigConnections);

                    // ICE candidate handler
                    connections[socketListId].onicecandidate = function (event) {
                        if (event.candidate != null) {
                            socketRef.current.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate }));   
                        }
                    }

                    // Stream addition handler
                    connections[socketListId].onaddstream = (event) => {
                        // Check if video already exists
                        let videoExists = videoRef.current.find(video => video.socketId === socketListId);

                        if (videoExists) {
                            // Update existing stream
                            setVideos(videos => {
                                const updatedVideos = videos.map(video =>
                                    video.socketId === socketListId ? { ...video, stream: event.stream } : video
                                );
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        } else {
                            // Add new video
                            let newVideo = {
                                socketId: socketListId,
                                stream: event.stream,
                                autoplay: true,
                                playsinline: true
                            };

                            setVideos(videos => {
                                const updatedVideos = [...videos, newVideo];
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        }
                    };

                    // Add local stream to connection
                    if (window.localStream !== undefined && window.localStream !== null) {
                        connections[socketListId].addStream(window.localStream);
                    } else {
                        // Use black/silence if no local stream
                        let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
                        window.localStream = blackSilence();
                        connections[socketListId].addStream(window.localStream);
                    }
                })

                // If we're the new user, establish connections with all peers
                if (id === socketIdRef.current) {   
                    for (let id2 in connections) {
                        if (id2 === socketIdRef.current) continue;   

                        try {
                            connections[id2].addStream(window.localStream)  
                        } catch (e) { }

                        // Create offer for each peer
                        connections[id2].createOffer().then((description) => {
                            connections[id2].setLocalDescription(description)
                                .then(() => {
                                    socketRef.current.emit('signal', id2, JSON.stringify({ 'sdp': connections[id2].localDescription }))
                                })
                                .catch(e => console.log(e))
                        })
                    }
                }
            })
        })
    }

    // Initialize media and connect to server
    let getMedia = () => {
        setVideo(videoAvailable);
        setAudio(audioAvailable);
        connectToSocketServer();
    }

    // Media control handlers
    let handleVideo = () => setVideo(!video);
    let handleAudio = () => setAudio(!audio);

    // Screen sharing handlers
    let getDislayMediaSuccess = (stream) => {
        try {
            window.localStream.getTracks().forEach(track => track.stop())
        } catch (e) { console.log(e) }

        window.localStream = stream;
        localVideoRef.current.srcObject = stream;

        // Update all peers with new screen share stream
        for (let id in connections) {
            if (id === socketIdRef.current) continue;

            connections[id].addStream(window.localStream);
            connections[id].createOffer().then((description) => {
                connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                    })
                    .catch(e => console.log(e))
            })
        }

        // Handle screen sharing ending
        stream.getTracks().forEach(track => track.onended = () => {      
            setScreen(false);
            try {
                let tracks = localVideoRef.current.srcObject.getTracks();
                tracks.forEach(track => track.stop());
            } catch (e) { console.log(e) }

            // Revert to black/silence or camera
            let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
            window.localStream = blackSilence();
            localVideoRef.current.srcObject = window.localStream;
            getUserMedia();
        })
    }

    let getDislayMedia = () => {
        if (screen) {
            if (navigator.mediaDevices.getDisplayMedia) {
                navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                    .then(getDislayMediaSuccess)
                    .catch((e) => console.log(e))
            }
        }
    }

    useEffect(() => {
        if (screen !== undefined) {
            getDislayMedia();
        }
    }, [screen])

    let handleScreen = () => setScreen(!screen);

    // Chat message handlers
    const addMessage = (data, sender, socketIdSender) => {
        setMessages((prevMessages) => [
            ...prevMessages,
            { sender: sender, data: data }
        ]);
        if (socketIdSender !== socketIdRef.current) {
            setNewMessages((prevNewMessages) => prevNewMessages + 1);
        }
    };

    let sendMessage = () => {
        socketRef.current.emit('chat-message', message, username)
        setMessage("");
    }

    // Navigation and call control
    let navigate = useNavigate();
    let handleEndCall = () => {
        try {
            let tracks = localVideoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
        } catch (e) { }
        navigate("/home");
    };

    let connect = () => {
        setAskForUsername(false);
        getMedia();
    };

    // Render UI
    return (
        <div>            
            {/* Username input form */}
            {askForUsername === true ?    

                // lobby
                <div className={styles.meetLobby}>
                    {/* Navbar */}
                    <nav className={styles.meetnav}>
                        <div className={styles.navHeader}>
                            <h1 className={styles.logo}  onClick={() => navigate("/")}>Meet Now</h1>
                        </div>
                        <div className={styles.navList}>
                            <button className={styles.navButton} onClick={() => navigate("/sdkhfc")}>
                                Join as Guest
                            </button>
                            <button className={styles.navButton} onClick={() => navigate("/auth")}>
                                Register
                            </button>
                            <button className={styles.navButton} onClick={() => navigate("/auth")}>
                                Login
                            </button>
                        </div>
                    </nav>
                    <div className={styles.lobbyContent}>
                        <Typography 
                            variant="h4" 
                            sx={{ 
                                fontWeight: 700,
                                mt: 3,
                                background: 'linear-gradient(to right, #3e0551, #8a2be2)',
                                WebkitBackgroundClip: 'text',
                                backgroundClip: 'text',
                                color: 'transparent'   
                            }}                                                   
                        >
                            Enter into Lobby
                        </Typography>    
                        <div className={styles.meetUsername}>
                            <TextField id="outlined-basic" color="secondary" label="Username" value={username} onChange={e => setUsername(e.target.value)} variant="outlined" fullWidth/>
                            <Button variant="contained" style={{ backgroundColor: '#3e0551' }} onClick={connect}>Connect</Button>
                        </div>
                        <div className={styles.meetPreviewVideo}>
                            <video ref={localVideoRef} autoPlay muted style={{ width: "100%", height: "100%" }} ></video>
                        </div>
                    </div>
                </div> : 

                <div className={styles.meetVideoContainer}>
                    {/* Chat Room */}
                    {showModal ? <div className={styles.chatRoom}>
                        <div className={styles.chatContainer}>
                            <h1>Chat</h1>
                            <div className={styles.chattingDisplay}>
                                {messages.length !== 0 ? messages.map((item, index) => {
                                    return (
                                        <div style={{ marginBottom: "20px" }} key={index}>
                                            <p style={{ fontWeight: "bold" }}>{item.sender}</p>
                                            <p>{item.data}</p>
                                        </div>
                                    );
                                }) : <p>No Messages Yet</p>}
                            </div>
                            <div className={styles.chattingArea}>
                                <TextField value={message} onChange={(e) => setMessage(e.target.value)} id="outlined-basic" color="secondary" label="Enter Your chat" variant="outlined" />
                                <Button variant='contained' style={{ backgroundColor: '#3e0551' }} onClick={sendMessage}>Send</Button>
                            </div>
                        </div>
                    </div> : <></>}

                    {/* Control buttons */}
                    <div className={styles.buttonContainers}>
                        <IconButton onClick={handleVideo} style={{ color: "white" }}>
                            {(video === true) ? <VideocamIcon /> : <VideocamOffIcon />}
                        </IconButton>
                        <IconButton onClick={handleEndCall} style={{ color: "red" }}>
                            <CallEndIcon />
                        </IconButton>
                        <IconButton onClick={handleAudio} style={{ color: "white" }}>
                            {audio === true ? <MicIcon /> : <MicOffIcon />}
                        </IconButton>

                        {screenAvailable === true ?
                            <IconButton onClick={handleScreen} style={{ color: "white" }}>
                                {screen === true ? <ScreenShareIcon /> : <StopScreenShareIcon />}
                            </IconButton> 
                            : <></>
                        }

                        <Badge badgeContent={newMessages} max={999} color='secondary'>
                            <IconButton onClick={() => setModal(!showModal)} style={{ color: "white" }}>
                                <ChatIcon />                       
                            </IconButton>
                        </Badge>
                    </div>

                    {/* Local video */}
                    <video className={styles.meetUserVideo} ref={localVideoRef} autoPlay muted></video>

                    {/* Remote videos */}
                    <div className={styles.conferenceView}>
                        {videos.map((video, index) => (
                            <div key={`${video.socketId}-${index}`}> 
                                <video
                                    data-socket={video.socketId}
                                    ref={ref => {
                                        if (ref && video.stream) {
                                        ref.srcObject = video.stream;
                                        }
                                    }}
                                    autoPlay
                                    playsInline
                                />
                            </div>
                        ))}
                    </div>
                </div>
            }
        </div>
    )
} 