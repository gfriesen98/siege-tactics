import socketio from 'socket.io-client';
import React from 'react';
const ENDPOINT = 'http://10.0.0.113:5000';

export const socket = socketio.connect();
export const SocketContext = React.createContext();
