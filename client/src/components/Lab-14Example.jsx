import { useState, useEffect, useRef } from "react";
import {
    Paper,
    CardHeader,
    CardContent,
    Typography,
    TextField,
    Button
} from "@mui/material";

import io from "socket.io-client";

const Socket = () => {

    /* Chat Log */

    const [chatLog, setChatLog] = useState([]);

    // https://react.dev/reference/react/useState#setstate
    // If you pass a function as nextState, it will be treated as an updater function
    // It should take the pending state as its only argument and return the next state
    const appendToChatLog = newLine => setChatLog(currentLog => [...currentLog, newLine]);
    const renderChatLog = () => chatLog.map((line, index) => <div key={index}>
        <Typography variant="h6">{line}</Typography>
    </div>);

    /* Log In */

    // (1) State for room joining data

    /* Room */

    const [roomName, setRoomName] = useState("");

    /* WebSocket */

    // https://react.dev/reference/react/useRef
    // useRef is a React Hook that lets you reference a value that’s not needed for rendering
    const effectRan = useRef(false);
    const socket = useRef();

    const connectToServer = () => {
        if (effectRan.current) return; // Don't run twice with Strict Mode

        try {
            // Only use localhost:9000 if the app is being hosted on port 5173 (i.e. Vite)
            const wsServerAddress = window.location.port == 5173 ? "localhost:9000" : "/";
            const ws = io.connect(wsServerAddress, {
                forceNew: true,
                transports: ["websocket"],
            });

            // (2) Listeners for chat room joining and log updates

            socket.current = ws;
            effectRan.current = true; // Flag to prevent connecting twice
        }
        catch (e) {
            console.warn(e);
        }
    };

    const joinRoom = () => {
        // (3) Emit join request to the server
    }

    /* Component Life Cycle */

    useEffect(() => {
        connectToServer();
    }, []);

    /* Component Rendering - These will become their own components */

    const renderLogInWindow = () => (
        <Paper elevation={4} sx={{ mt: "1em" }}>
            <CardContent>
                <CardHeader title="Join Chat Room" />
                <TextField fullWidth label="User Name"
                    sx={{ mb: "1em" }}
                    value="" // (5) Needs to connect with (1)
                    onChange={null} // (5) Needs to connect with (1)
                />
                <TextField fullWidth label="Room Name"
                    sx={{ mb: "1em" }}
                    value="" // (5) Needs to connect with (1)
                    onChange={null} // (5) Needs to connect with (1)
                />
                
                {/* Needs to be disabled until both user name and room name exist */}
                <Button fullWidth variant="contained" onClick={() => {
                    // (6) Needs to connect with (3) to emit the join request
                }}>
                    Join Room
                </Button>
            </CardContent>
        </Paper >
    );

    const renderChatWindow = () => (
        <Paper elevation={4} sx={{ mt: "1em" }}>
            <CardHeader title={roomName} />
            <CardContent>
                {renderChatLog()}
            </CardContent>
        </Paper>
    );

    /* App Rendering */

    return roomName ? renderChatWindow() : renderLogInWindow();
};

export default Socket;