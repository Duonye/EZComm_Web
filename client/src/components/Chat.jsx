import { useState, useEffect, useRef } from "react";
import {
    Box,
    Paper,
    CardHeader,
    CardContent,
    Divider,
    Typography,
    TextField,
    Button,
    List,
    ListItem,
    Stack,
    Drawer
} from "@mui/material";

import SendIcon from '@mui/icons-material/Send';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import { format, getDay } from "date-fns";

const Chat = (props) => {
    const [menuOpen, setMenuOpen] = useState(false);

    const renderMenu = () => (
        <Box sx={{ width: 250, p: 2 }}>
            <Typography variant="h6" gutterBottom>
                Room Details
            </Typography>
            <Typography variant="subtitle1">
                Room: {props.roomName}
            </Typography>
            <Typography variant="subtitle1">
                Users: {props.roomUsers?.length || 0}
            </Typography>
            <List>
                {props.roomUsers?.map(user => (
                    <ListItem key={user.name}>
                        <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            gap: 1
                        }}>
                            <Box sx={{
                                width: 16,
                                height: 16,
                                backgroundColor: user.color,
                                borderRadius: '50%'
                            }} />
                            <Typography>{user.name}</Typography>
                        </Box>
                    </ListItem>
                ))}
            </List>
        </Box>
    );

    const renderMessage = (message, index) => {
        /* Skip rendering if message is deleted */
        if (message.deletedAt) {
            return (
                <div key={index} className="message">
                    <div className="message-bubble" style={{ borderColor: message.color }}>
                        <Typography variant="body2" sx={{ textAlign: "right", fontStyle: "italic" }}>
                            (deleted) {format(new Date(message.timestamp), "HH:mm")}
                        </Typography>
                    </div>
                </div>
            );
        }
        /* New Day Messages */
        if (message.newDay) {
            return (
                <div key={index} style={{ marginBottom: "1em" }}>
                    <Typography variant="h6" textAlign="center">
                        <strong>{message.text}</strong>
                    </Typography>
                </div>
            );
        }
    
        /* Typing Feedback Messages */
        if (message.typingFeedback) {
            return (
                <Typography key="typing-feedback" ref={lastMessageRef} variant="body1"
                    textAlign="center" sx={{ marginBottom: "1em" }}
                >
                    <i>{message.text}</i>
                </Typography>
            );
        }
    
        /* Safely handle timestamp */
        /* Timestamp with edit indicator */
    const messageTimestamp = (
        <Typography variant="body2" sx={{ textAlign: "right" }}>
            {message.editedAt && <span style={{ fontStyle: "italic" }}>(edited) </span>}
            {format(new Date(message.timestamp), "HH:mm")}
        </Typography>
    );
    
        /* Meta Chat Messages */
        if (message.sender === '') {
            return (
                <div key={index} style={{ margin: "1em 0" }}>
                    <Typography variant="h6" textAlign="center">
                        <i>{message.text}</i>
                    </Typography>
                    {messageTimestamp && (
                        <Typography variant="body2" textAlign="center">
                            <i>{messageTimestamp}</i>
                        </Typography>
                    )}
                </div>
            );
        }
    
        /* User Messages */
        const yourOwnMessage = message.sender === props.userName;
        const messageClassName = yourOwnMessage ? "user-message" : "message";
    
        
        return (
            
            <div key={index} className={messageClassName}>
                <div className="message-bubble" style={{ borderColor: message.color }}>
                    <Typography variant="h6" className="message-text" sx={{ color: message.color }}>
                        <strong>{message.sender}</strong>
                    </Typography>
                    <Typography variant="h6" className="message-text">
                        {message.text}
                    </Typography>
                    {messageTimestamp && (
                        <Typography variant="body2" sx={{ textAlign: "right" }}>
                            {messageTimestamp}
                        </Typography>
                    )}
                </div>
            </div>
        );
    };
    /* Chat Log */

    const lastMessageRef = useRef(null);
    
    const renderChatLog = () => {
        const chat = props.chatLog ?? [];
        const chatWithSpecialMessages = [];
    
        // Handle day change messages
        let lastMessage = null;
        chat.forEach(message => {
            if (!lastMessage || getDay(lastMessage.timestamp) !== getDay(message.timestamp)) {
                chatWithSpecialMessages.push({
                    sender: '',
                    text: format(new Date(message.timestamp), "PPPP"),
                    newDay: true
                });
            }
            chatWithSpecialMessages.push(message);
            lastMessage = message;
        });
    
        // Handle typing notifications
        const otherTypingUsers = props.typingUsers?.filter(u => u !== props.userName) || [];
        if (otherTypingUsers.length > 0) {
            let typingText = "";
            if (otherTypingUsers.length === 1) {
                typingText = `${otherTypingUsers[0]} is typing...`;
            } else if (otherTypingUsers.length === 2) {
                typingText = `${otherTypingUsers[0]} and ${otherTypingUsers[1]} are typing...`;
            } else {
                typingText = "Several people are typing...";
            }
    
            chatWithSpecialMessages.push({
                sender: '',
                text: typingText,
                typingFeedback: true
            });
        }
    
        return chatWithSpecialMessages.map(renderMessage);
    };
    
    useEffect(() => {
        lastMessageRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [props.chatLog]);

    /* Send Message */

    const [messageText, setMessageText] = useState("");

    const handleSendMessage = () => {
        if (!messageText) return;

        // Handle edit command
        if (messageText.startsWith('/edit ')) {
            const newText = messageText.substring(6).trim();
            if (newText) {
                props.sendEdit({ newText });
                setMessageText('');
                return;
            }
        }
        
        // Handle delete command
        if (messageText === '/del') {
            props.sendDelete();
            setMessageText('');
            return;
        }

        props.sendMessage(messageText);
        setMessageText('');

        // Notify server typing has stopped
        props.notifyTyping && props.notifyTyping({ 
            roomName: props.roomName, 
            userName: props.userName, 
            isTyping: false 
        });
    };

    const handleMessageTextChange = (e) => {
        const newText = e.target.value;
        setMessageText(newText);

        // Check if typing status changed
        const startedTyping = messageText === "" && newText !== "";
        const stoppedTyping = messageText !== "" && newText === "";

        if (startedTyping || stoppedTyping) {
            props.notifyTyping && props.notifyTyping({
                roomName: props.roomName,
                userName: props.userName,
                isTyping: startedTyping
            });
        }
    };


    /* Render Component */

    return (
        <Paper elevation={4} sx={{ mt: "0.5em", display: "flex", flexDirection: "column" }}>
            <Drawer anchor="left" open={menuOpen} onClose={() => setMenuOpen(false)}>
                {renderMenu()}
            </Drawer>
            
            <Stack direction="row" sx={{
                alignItems: "center", 
                justifyContent: "space-between",
                pl: "1em", 
                pr: "1em"
            }}>
                <Button variant="contained" onClick={() => setMenuOpen(true)}>
                    <MenuIcon />
                </Button>
                <CardHeader title={props.roomName} />
                <Button variant="contained" onClick={props.onLeaveRoom}>
                    <LogoutIcon />
                </Button>
            </Stack>
            <Divider />
            {/* <CardHeader title={`${props.roomName} (as ${props.userName})`} /> */}
            <Divider />
            <CardContent>
                <List sx={{ height: "60vh", overflowY: "scroll", textAlign: "left" }}>
                    {renderChatLog()}
                </List>
                <Divider />
                <Box sx={{ mt: "1em", display: "flex", direction: "row", flex: 1 }}>
                <TextField 
                    fullWidth 
                    sx={{ mr: "1em", flex: 9 }}
                    value={messageText} 
                    onChange={handleMessageTextChange}
                    onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                        }
                    }}
                    multiline
                    maxRows={4}
                />
                    <Button 
                    fullWidth 
                    variant="contained" 
                    sx={{ flex: 1 }}
                    onClick={handleSendMessage}
                >
                    <SendIcon />
                </Button>
                </Box>
                
            </CardContent>
            
        </Paper>
        
    );
};

export default Chat;