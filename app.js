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

function clearRoom(roomName) {
  for (let i = 0; i < lineHistory.length; i++) {
    if (lineHistory[i].roomName === roomName) {
      delete lineHistory[i];
    }
  }
}

function updateImagesRooms(roomName, imageUrl, select, floor) {
  let temp = {
    roomName: roomName,
    imageUrl: imageUrl,
    map: select,
    floor: floor
  }
  if (states.length === 0) {
    states.push(temp);
    return states[0];
  } else {
    for (let i = 0; i < states.length; i++) {
      if (states[i].roomName === roomName) {
        states[i].imageUrl = imageUrl;
        states[i].map = select;
        states[i].floor = floor;
        return states[i];
      }
    }
  }
}

function getImageUrlFromRoom(roomName) {
  for (let i = 0; i < states.length; i++) {
    if (states[i].roomName === roomName) {
      return states[i].imageUrl;
    }
  }
}

function compareOnJoin(roomName, imageUrl) {
  for (let i = 0; i < states.length; i++) {
    if (states[i].roomName === roomName) {
      if (states[i].imageUrl !== imageUrl) {
        return states[i].imageUrl;
      } else {
        return imageUrl;
      }
    }
  }
}

function getCurrentState(roomName) {
  for (let i = 0; i < states.length; i++) {
    if (states[i].roomName === roomName) {
      return states[i];
    }
  }
}

io.on('connection', (socket) => {
  // socket.emit('test', new Date());
  console.log('connect')

  socket.on('join', ({nickName, roomName, imageUrl, select, floor}) => {
    user = registerUser(nickName, roomName, socket.id);

    var newState = {
      roomName: roomName,
      imageUrl: imageUrl,
      map: select,
      floor: floor
    }

    if (states.length < 1) {
      states.push(newState);
    } else {
      for (let i = 0 ; i < states.length ; i++) {
        if (states[i] != newState) {
          newState = states[i];
          break;
        }
      }
    }

    console.log('STATES:', states);
    
    socket.join(roomName);

    socket.emit('joined', {joined: true, roomName: roomName, nickName: nickName, connectedClients: getUsersInRoom(roomName)});
    // console.log(lineHistory);
    for (let i = 0 ; i < lineHistory.length ; i++) {
      let line = lineHistory[i].line;
      let room = lineHistory[i].roomName;
      console.log('LINE', line);
      console.log('ROOM', room);
      io.to(room).emit('room_draw', line);
    }
    io.to(roomName).emit('set_image', {roomName, nickName, imageUrl: newState.imageUrl, map: newState.map, nFloor: newState.floor, clear: false});
    io.to(roomName).emit('update', {users: getUsersInRoom(roomName)});
  });

  socket.on('disconnect', () => {
    let t = disconnectUser(socket.id);
    io.to(t.roomName).emit('update', {users: getUsersInRoom(t.roomName)});
    console.log('disconnected user', users);
  });

  socket.on('draw_line', ({roomName, line}) => {
    console.log('line', line);
    lineHistory.push({line: line, roomName: roomName});
    io.to(roomName).emit('room_draw', line);
  });

  socket.on('change', ({roomName, nickName, imageUrl, map, nFloor}) => {
    // image = updateImagesRooms(roomName, imageUrl, select, floor);
    let newState = {
      roomName: roomName,
      imageUrl: imageUrl,
      map: map,
      floor: nFloor
    }

    console.log('(CHANGE) NEW STATE:', newState);
    for (let i = 0; i < states.length; i++) {
      if (states[i].roomName === roomName) {
        states[i] = newState;
        var curr = states[i];
        break;
      }
    }
    console.log('STATES CHANGED TO',states);
    io.to(roomName).emit('set_image', {roomName, nickName, imageUrl: curr.imageUrl, map: curr.map, nFloor: curr.floor, clear: true});
  });

});

app.use(express.static(path.join(__dirname, '../build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname+'../build/index.html'));
})

server.listen(process.env.PORT || 5000, () => {
  console.log('server running on port 5000');
});