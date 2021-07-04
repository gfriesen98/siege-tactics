const express = require('express');
const app = express();
const path = require('path');
app.use(express.static('public'));
const http = require('http');
const server = http.createServer(app);
const {Server} = require('socket.io');
const io = new Server(server);
var users = {};
var lineHistory = [];
var states = [];

/**
 * Gets all users registered to a room
 * @param {String} roomName room name
 * @returns Object
 */
 function getUsersInRoom(roomName) {
  let temp = [];
  for (let key in users) {
    if (users[key].roomName === roomName) {
      temp.push(users[key]);
    }
  }
  return temp;
}

/**
 * Disconnects and unregisters a user
 * @param {String} socketID socket id
 * @returns Object
 */
function disconnectUser(socketID) {
  let temp = {};
  for (let key in users) {
    if (users[key].socketId === socketID) {
      temp = users[key];
      delete users[key];
      break;
    }
  }
  return temp;
}

/**
 * Registers a user and returns itself 
 * @param {String} nickname nickname
 * @param {String} roomName room name
 * @param {String} socketID socket id
 * @returns Object
 */
function registerUser(nickname, roomName, socketID) {
  if (users[nickname] === undefined) {
    var userID = Object.keys(users).length+100;
    users[nickname] = {
      id: userID,
      roomName: roomName,
      nickname: nickname,
      socketId: socketID
    };
  }

  return users[nickname];
}

/**
 * Deletes all drawn lines saved server side for the connected room
 * @param {String} roomName connected room name
 */
function clearLines(roomName) {
  for (let i = 0; i < lineHistory.length; i++) {
    if (lineHistory[i].roomName === roomName) {
      lineHistory[i].deleted = true;
    }
  }
}

io.on('connection', (socket) => {
  console.log('connect')

  /**
   * Listens for user join
   * 
   * Adds new user to a list so we can map a nickname to the socketId
   */
  socket.on('join', ({nickName, roomName, imageUrl, select, floor}) => {
    user = registerUser(nickName, roomName, socket.id);

    var newState = {
      roomName: roomName,
      imageUrl: imageUrl,
      map: select,
      floor: floor
    }

    if (states.length < 1) {
      console.log('FIRST ROOM STATE: ', newState);
      states.push(newState);
    } else {
      console.log('NEW ROOM STATE: ', newState);
      /**
       * ISSUE: We do not properly compare incoming newState.
       * 
       * If there is more than one room, we do not properly
       * compare against the existing array. If newState belongs 
       * to a new room then the state should default to the default
       * states in the client, but it doesn't. It will display the last
       * selected state (which is sent from client).
       */
      for (let i = 0 ; i < states.length ; i++) {
        if (states[i].roomName != newState.roomName) {
          // states.push(newState);
          newState = states[i];
          break;
        }
      }
    }
    console.log('STATES:', states);
    socket.join(roomName);

    /**
     * Emits 'joined'
     * 
     * Sends connected user information to the client
     */
    socket.emit('joined', {joined: true, roomName: roomName, nickName: nickName, connectedClients: getUsersInRoom(roomName)});
    for (let i = 0 ; i < lineHistory.length ; i++) {
      if (lineHistory.deleted !== undefined) {
        let line = lineHistory[i].line;
        let room = lineHistory[i].roomName;
        console.log('LINE', line);
        console.log('ROOM', room);
        io.to(room).emit('room_draw', line);
      }
    }
    io.to(roomName).emit('set_image', {roomName, nickName, imageUrl: newState.imageUrl, map: newState.map, nFloor: newState.floor, clear: false});
    io.to(roomName).emit('update', {users: getUsersInRoom(roomName)});
  });

  /**
   * Listens for socket disconnects
   * 
   * Removes the disconnected user from the list of users.
   */
  socket.on('disconnect', () => {
    let t = disconnectUser(socket.id);
    io.to(t.roomName).emit('update', {users: getUsersInRoom(t.roomName)});
    console.log('disconnected user', users);
  });

  /**
   * Listens for draw_line
   * 
   * Saves drawn lines server side so we can send drawings to
   * all connected clients in the room
   */
  socket.on('draw_line', ({roomName, line}) => {
    lineHistory.push({line: line, roomName: roomName});
    io.to(roomName).emit('room_draw', line);
  });

  /**
   * Listens for map changes.
   * 
   * Updates server side state of the current room
   */
  socket.on('change', ({roomName, nickName, imageUrl, map, nFloor}) => {
    let newState = {
      roomName: roomName,
      imageUrl: imageUrl,
      map: map,
      floor: nFloor
    }

    console.log('INCOMING STATE: ', newState);
    for (let i = 0; i < states.length; i++) {
      if (states[i].roomName === roomName) {
        console.log('OLD STATE: ',states[i])
        states[i] = newState;
        console.log('NEW STATE: ',states[i])
        var curr = states[i];
        break;
      }
    }

    io.to(roomName).emit('set_image', {roomName, nickName, imageUrl: curr.imageUrl, map: curr.map, nFloor: curr.floor, clear: true});

    clearLines(roomName);
  });

});

//!!PRODUCTION!!
//!!Comment out for development!!
//Hosting on Heroku
app.use(express.static(path.join(__dirname, '/client/build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname+'/client/build/index.html'));
})

server.listen(process.env.PORT || 5000, () => {
  console.log('server running on port 5000');
});