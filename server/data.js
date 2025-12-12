let users = new Set();

const registerUser = (userName) => {
    users.add(userName);
    console.log(`User registered: ${userName}`);
}

const unregisterUser = (userName) => {
    users.delete(userName);
    console.log(`User removed: ${userName}`);
}

const isUserNameTaken = (userName) => {
    return users.has(userName);
}

let roomLogs = {};
const roomLog = room => roomLogs[room];
const addMessage = (room, messageInfo) => {
    if (!roomLogs[room]) {
        roomLogs[room] = [];
    }
    roomLogs[room].push({
        ...messageInfo,
        timestamp: Date.now()  // Add timestamp
    });
}

class Room {
    static #rooms = {};

    #name = "";
    #log = [];
    #typingUsers = new Set();

    constructor(name) {
        this.#name = name;
    }

    static get(roomName) {
        if (!Room.#rooms[roomName]) {
            Room.#rooms[roomName] = new Room(roomName);
        }
        return Room.#rooms[roomName];
    }

    get name() {
        return this.#name;
    }

    get log() {
        return this.#log;
    }

    addMessage(messageInfo) {
        messageInfo.timestamp = Date.now();
        this.#log.push(messageInfo);
    }

    updateTypingStatus(userName, isTyping) {
        if (isTyping) {
            this.#typingUsers.add(userName);
        } else {
            this.#typingUsers.delete(userName);
        }
    }

    get typingUsers() {
        return Array.from(this.#typingUsers);
    }
}
const updateTypingStatus = (roomName, userName, isTyping) => {
    Room.get(roomName).updateTypingStatus(userName, isTyping);
};

const getTypingUsers = (roomName) => {
    return Room.get(roomName).typingUsers;
};
export {
    registerUser,
    unregisterUser,
    isUserNameTaken,
    roomLog,
    addMessage,
    updateTypingStatus,
    getTypingUsers
}