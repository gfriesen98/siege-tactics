import socketio from 'socket.io-client';
import React from 'react';
const ENDPOINT = 'http://10.0.0.113:5000';

// export const socket = socketio.connect(); PRODUCTION
export const socket = socketio.connect(ENDPOINT); //DEV
export const SocketContext = React.createContext();
