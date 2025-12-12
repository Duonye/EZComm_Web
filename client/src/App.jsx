
// export default App;
import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";

/* Material UI & Styling */
import { createTheme, ThemeProvider } from "@mui/material";
import { teal } from "@mui/material/colors";
import "./App.css";

const theme = createTheme({
    palette: {
        primary: {
            main: teal[800]
        }
    }
});

/* Components */
import Header from "./components/Header";
import Chat from "./components/Chat";
import Login from "./components/Login";

function App() {
    /* State */
    const [joinInfo, setJoinInfo] = useState({
        userName: '',
        roomName: '',
        error: ''
    });
    const [chatLog, setChatLog] = useState([]);
    const [socketConnected, setSocketConnected] = useState(false);
    const [roomUsers, setRoomUsers] = useState([]);
    const [typingUsers, setTypingUsers] = useState([]);
    
    /* WebSocket */
    const socket = useRef(null);

    const connectToServer = () => {
        try {
            const wsServerAddress = window.location.port == 5173 ? "ws://localhost:9000" : "/";
            socket.current = io(wsServerAddress, {
                transports: ["websocket"],
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                forceNew: true 
            });

            socket.current.on("connect", () => {
                console.log("Socket connected");
                setSocketConnected(true);
            });

            socket.current.on("connect_error", (err) => {
                console.log("Connection error:", err);
                setSocketConnected(false);
            });

            socket.current.on("join-response", (response) => {
                console.log("Join response:", response);
                setJoinInfo(response);
            });

            socket.current.on("chat update", (log) => {
                setChatLog(log);
            });

            socket.current.on("room-users", (users) => {
                setRoomUsers(users);
            });

            socket.current.on("typing", (users) => {
                setTypingUsers(users);
            });

            return () => {
                if (socket.current) {
                    socket.current.disconnect();
                }
            };
        } catch (e) {
            console.error("Connection error:", e);
        }
    };

    const joinRoom = (joinData) => {
        if (socket.current && socket.current.connected) {
            console.log("Emitting join:", joinData);
            socket.current.emit("join", joinData);
            setTypingUsers([]);
        } else {
            console.error("Socket not connected");
            setJoinInfo(prev => ({
                ...prev,
                error: "Connection error. Please refresh and try again."
            }));
        }
    };

    const handleLeaveRoom = () => {
        if (socket.current?.connected) {
            // Notify room that user is leaving
            const leaveMessage = `${joinInfo.userName} has left the room`;
            socket.current.emit("message", leaveMessage);
            
            // Disconnect and reset state
            socket.current.disconnect();
            setJoinInfo({ userName: '', roomName: '', error: '' });
            setChatLog([]);
            setRoomUsers([]);
            
            // Reconnect to allow rejoining
            connectToServer();
        }
    };

    const sendMessage = (text) => {
        if (socket.current?.connected) {
            socket.current.send(text);
        }
    };

    const notifyTyping = (typingInfo) => {
        if (socket.current?.connected) {
            socket.current.emit("typing", typingInfo);
        }
    };

    const sendEdit = (editInfo) => {
        if (socket.current?.connected) {
            socket.current.emit("edit", editInfo);
        }
    };
    
    const sendDelete = () => {
        if (socket.current?.connected) {
            socket.current.emit("delete");
        }
    };

    useEffect(() => {
        connectToServer();
        return () => {
            if (socket.current) {
                socket.current.disconnect();
            }
        };
    }, []);

    const hasJoined = () => joinInfo.userName && joinInfo.roomName && !joinInfo.error;

    return (
        <ThemeProvider theme={theme}>
            <Header title="Chat App - DA" />
            {hasJoined() ? (
                <Chat
                    {...joinInfo}
                    sendMessage={sendMessage}
                    sendEdit={sendEdit}
                    sendDelete={sendDelete}
                    chatLog={chatLog}
                    onLeaveRoom={handleLeaveRoom}
                    roomUsers={roomUsers}
                    notifyTyping={notifyTyping}
                    typingUsers={typingUsers}
                />
            ) : (
                <Login joinRoom={joinRoom} error={joinInfo.error} />
            )}
        </ThemeProvider>
    );
}

export default App;