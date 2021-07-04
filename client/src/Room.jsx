import React, { useContext, useEffect, useRef, useState } from 'react';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { useParams } from 'react-router-dom';
import { SocketContext, socket } from './SocketContext';

export default function Room(props) {
  const {id} = useParams();
  const [roomName, setRoom] = useState(id);
  const [nickName, setNickname] = useState(props.location.state.nickName);
  const [clients, setClients] = useState([]);
  const [select, setSelect] = useState('consulate'); //default to consulate for now
  const [floor, setFloor] = useState(1);
  const [url, setUrl] = useState(`/consulate/1.jpg`);

  const socket = useContext(SocketContext);
  const canvasRef = useRef(null); //Will be set to <canvas/> when it loads
  const mouse = { //set up mouse coords
    click: false,
    move: false,
    pos: {
      x: 0,
      y: 0
    },
    pos_prev: false
  };

  /**
   * When we change states that come from the backend socket, dont change the
   * state early, like in onEvent functions, but rather on a socket event. 
   * This keeps states between clients in sync.
   * 
   * Examples seen in the handleSelect function. We dont immediately set the
   * state in that function, but instead wait for a response from the socket,
   * then change the state!
   */

  /**
   * Set some misc. socket events on component load.
   * 
   * update: listens for when new users join to set list of connected clients
   * join: emit an event on component load to notify server that a client has joined
   * joined: updates user list mid session when another user joins
   * set_image: watches for when a user changes the map, then redraw the map
   */
  useEffect(() => {
    socket.on('update', ({users}) => {
      setClients(users);
    });

    socket.emit('join', {nickName, roomName, imageUrl: url, select, floor});
    socket.on('joined', ({joined, imageUrl, roomName, nickName, connectedClients}) => {
      setClients(connectedClients);
    });

    if (canvasRef.current) {
      socket.on('set_image', ({roomName, nickName, imageUrl, map, nFloor, clear}) => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (clear) {
          context.clearRect(0,0,1600,900);
          setUrl(imageUrl);
          setFloor(nFloor);
          setSelect(map);
        } else {
          setUrl(imageUrl);
          setFloor(nFloor);
          setSelect(map);
        }
      });
    }
  }, []);

  /**
   * On component load set a room_draw listener to draw lines
   * on client load from the socket server
   */
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      socket.on('room_draw', (res) => {
        const line = res;
        context.strokeStyle = 'red';
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(line[0].x, line[0].y);
        context.lineTo(line[1].x, line[1].y);
        context.stroke();
      });
    }
  }, []);

  /**
   * Sets client mouse coordinates on mouse down
   * @param {event} e event
   */
  function onMouseDown(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    mouse.pos.x = e.clientX - rect.left;
    mouse.pos.y = e.clientY - rect.top;
    mouse.click = true;
  }

  /**
   * Determines if the user is not clicking
   * @param {event} e event
   */
  function onMouseUp(e) {
    mouse.click = false;
  }

  /**
   * Sets the client mouse position on mouse move
   * @param {event} e event
   */
  function onMouseMove(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    mouse.pos.x = e.clientX - rect.left;
    mouse.pos.y = e.clientY - rect.top;
    mouse.move = true;
  }

  /**
   * Runs on load to check if the client is drawing or not
   * Emits a socket event on draw line
   */
  function mainLoop() {
    if (mouse.click && mouse.move && mouse.pos_prev) {
      socket.emit('draw_line', {roomName: roomName, line: [mouse.pos, mouse.pos_prev]});
      mouse.move = false;
    }
    mouse.pos_prev = {
      x: mouse.pos.x,
      y: mouse.pos.y
    };
    setTimeout(mainLoop, 25);
  }
  mainLoop();

  /**
   * Emits a socket event to change the map floor up
   * TODO do not go more than the amount of floors the map has :/
   */
  function handleUp() {
    let temp = floor;
    temp++;
    let u = `/${select}/${temp}.jpg`;
    socket.emit('change', {roomName, nickName, imageUrl: u, map: select, nFloor: temp});
  }

  /**
   * Emits a socket event to change the map floor down
   * TODO do not go less than 1
   */
  function handleDown() {
    let temp = floor;
    temp--;
    let u = `/${select}/${temp}.jpg`; 
    socket.emit('change', {roomName, nickName, imageUrl: u, map: select, nFloor: temp});
  }

  /**
   * Emits a socket event to change the map
   * @param {event} e event
   */
  function handleSelect(e) {
    let u = `/${select}/1.jpg`;
    socket.emit('change', {roomName, nickName, imageUrl: u, map: e.target.value, nFloor: 1});
  }

  return (
    <div>
      {clients.length > 0 && clients.map(n => (
        <p>{n.nickname}</p>
      ))}
      <select value={select} onChange={handleSelect}>
        <option value='consulate'>consulate</option>
        <option value="bank">bank</option>
        <option value="clubhouse">clubhouse</option>
        <option value="favela">favela</option>
        <option value="house">house</option>
        <option value="oregon">oregon</option>
        <option value="skyscraper">skyscraper</option>
        <option value="villa">villa</option>
        <option value="border">border</option>
        <option value="fortress">fortress</option>
        <option value="kafe">kafe</option>
        <option value="outback">outback</option>
        <option value="themepark">themepark</option>
        <option value="yacht">yacht</option>
        <option value="chalet">chalet</option>
        <option value="coastline">coastline</option>
        <option value="hereford">hereford base</option>
        <option value="kanal">kanal</option>
        <option value="plane">plane</option>
        <option value="tower">tower</option>
      </select>
      <div>
        <button onClick={handleUp}>floor up</button>
        <button onClick={handleDown}>floor down</button>
      </div>
      <div>
        <TransformWrapper panning={{disabled: true}}>
          <TransformComponent>
            <canvas style={{
                border: '1px black solid',
                backgroundImage: `url(${url})`,
              }}
              id='drawing'
              width={1600} height={900}
              ref={canvasRef}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}></canvas>
          </TransformComponent>
        </TransformWrapper>
      </div>
    </div>
  )
}