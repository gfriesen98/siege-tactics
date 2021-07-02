import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Redirect } from 'react-router-dom';
import { SocketContext } from './SocketContext';

export default function App(props) {
  const [roomName, setRoomName] = useState('');
  const [nickName, setNickName] = useState('');
  const [redirect, setRedirect] = useState({success: false, roomName: ''});
  const socket = useContext(SocketContext);

  function handleCreate() {
    socket.emit('create', {nickName, roomName});
    socket.on('created', res => {
      console.log(res);
      if (res.created) {
        setRedirect({success: true, roomName: res.roomName});
      }
    });
  }

  function handleJoin() {
    // socket.emit('join', {nickName, roomName});
    // socket.on('joined', res => {
    // });
    setRedirect({success: true, roomName: roomName});
  }

  return (
    <div>
      {redirect.success  && <Redirect to={{
        pathname: `/room/${roomName}`,
        state: { nickName: nickName }
      }}/>}
      <input type='text' onChange={(e) => {setRoomName(e.target.value)}} placeholder='room name'/>
      <input type="text" onChange={(e) => {setNickName(e.target.value)}} placeholder='nickname'/>
      <br />
      <button onClick={handleJoin} >join room</button>
    </div>
  );
}
