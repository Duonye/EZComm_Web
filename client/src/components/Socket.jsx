import { useState, useEffect, useRef } from "react";
import {
    Paper,
    CardHeader,
    CardContent,
    Typography,
    TextField,
    Button,
} from "@mui/material";
import io from "socket.io-client";

const Socket = () => {
    /* Chat Log */
    const [chatLog, setChatLog] = useState([]);

    /* Log In */
    const [userName, setUserName] = useState("");
    const [roomNameInput, setRoomNameInput] = useState(""); // Renamed to distinguish from joined room
    const [joinedRoom, setJoinedRoom] = useState(null); // Track if we've joined a room

    /* WebSocket */
    const effectRan = useRef(false);
    const socket = useRef();

    /* Append to Chat Log */
    const appendToChatLog = (newLine) => setChatLog((currentLog) => [...currentLog, newLine]);

    /* Connect to Server */
    const connectToServer = () => {
        if (effectRan.current) return;
    
        try {
            const wsServerAddress = window.location.port == 5173 ? "localhost:9000" : "/";
            const ws = io.connect(wsServerAddress, {
                forceNew: true,
                transports: ["websocket"],
            });
    
            ws.on("joined", (roomName) => {
                appendToChatLog(`You joined room: ${roomName}`);
                setJoinedRoom(roomName); // Set the joined room
            });
    
            ws.on("user joined", (userName) => {
                appendToChatLog(`${userName} joined the room`);
            });
    
            socket.current = ws;
            effectRan.current = true;
        } catch (e) {
            console.warn(e);
        }
    };

    /* Join Room */
    const joinRoom = () => {
        if (socket.current && userName && roomNameInput) {
            console.log("Joining room:", { userName, roomName: roomNameInput });
            const joinInfo = { userName, roomName: roomNameInput };
            socket.current.emit("join", joinInfo);
        }
    };

    /* Component Life Cycle */
    useEffect(() => {
        connectToServer();
    }, []);

    /* Render Log In Window */
    const renderLogInWindow = () => (
        <Paper elevation={4} sx={{ mt: "1em" }}>
            <CardContent>
                <CardHeader title="Join Chat Room" />
                <TextField
                    fullWidth
                    label="User Name"
                    sx={{ mb: "1em" }}
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                />
                <TextField
                    fullWidth
                    label="Room Name"
                    sx={{ mb: "1em" }}
                    value={roomNameInput}
                    onChange={(e) => setRoomNameInput(e.target.value)}
                />
                <Button
                    fullWidth
                    variant="contained"
                    onClick={joinRoom}
                    disabled={!userName || !roomNameInput}
                >
                    Join Room
                </Button>
            </CardContent>
        </Paper>
    );

    /* Render Chat Window */
    const renderChatWindow = () => (
        <Paper elevation={4} sx={{ mt: "1em" }}>
            <CardHeader title={joinedRoom} />
            <CardContent>
                {chatLog.map((line, index) => (
                    <Typography key={index} variant="h6">
                        {line}
                    </Typography>
                ))}
            </CardContent>
        </Paper>
    );

    /* App Rendering */
    console.log("Rendering:", joinedRoom ? "Chat Window" : "Login Window");
    return joinedRoom ? renderChatWindow() : renderLogInWindow();
};

export default Socket;