import React, { createRef, useContext, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import {BrowserRouter as Router, Switch, Route, useParams} from 'react-router-dom';
import {SocketContext, socket} from './SocketContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import App from './App';

ReactDOM.render(
  <Router>
    <Switch>

      <Route exact path='/' render={(props) => 
        <SocketContext.Provider value={socket}>
          <App {...props}/>
        </SocketContext.Provider>
      } />

      <Route path='/room/:id' render={(props) => 
        <SocketContext.Provider value={socket}>
          <Room {...props} />
        </SocketContext.Provider>
      } />

    </Switch>
  </Router>,
  document.getElementById('root')
);

function Room(props) {
  const {id} = useParams();
  const socket = useContext(SocketContext);
  const canvasRef = useRef(null);
  const ref = useRef(null);
  const mouse = {
    click: false,
    move: false,
    pos: {
      x: 0,
      y: 0
    },
    pos_prev: false
  };
  const [roomName, setRoom] = useState(id);
  const [nickName, setNickname] = useState(props.location.state.nickName);
  const [clients, setClients] = useState([]);
  const [select, setSelect] = useState('consulate');
  const [floor, setFloor] = useState(1);
  const [url, setUrl] = useState(`/consulate/1.jpg`);
  const [changeMessage, setChangeMessage] = useState({})
  const pixelRatio = window.devicePixelRatio;

  useEffect(() => {
    socket.on('update', ({users}) => {
      setClients(users);
    });

    socket.emit('join', {nickName, roomName, imageUrl: url, select, floor});
    socket.on('joined', ({joined, imageUrl, roomName, nickName, connectedClients}) => {
      setClients(connectedClients);
    });

    socket.on('set_image', ({roomName, nickName, imageUrl, map, nFloor, clear}) => {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      // context.clearRect(0,0,1600,900);
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
  }, []);

  /** !!loads drawings on join!! */
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    // var background = new Image();
    // background.src = 'http://10.0.0.113:5000/r6-maps-consulate-blueprint-1.jpg';
    // background.onload = () => {
    //   context.drawImage(background, 0,0);
    // }
    socket.on('room_draw', (res) => {
      const line = res;
      // var context = canvasRef.current.getContext('2d');
      context.strokeStyle = 'red';
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(line[0].x, line[0].y);
      context.lineTo(line[1].x, line[1].y);
      context.stroke();
    });
  }, []);

  function handleClick() {
    let context = canvasRef.current.getContext("2d");
    context.fillStyle = 'blue';
    context.fillRect(100,100,32,32);
  }

  function onMouseDown(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    mouse.pos.x = e.clientX - rect.left;
    mouse.pos.y = e.clientY - rect.top;
    mouse.click = true;
  }

  function onMouseUp(e) {
    mouse.click = false;
  }

  function onMouseMove(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    mouse.pos.x = e.clientX - rect.left;
    mouse.pos.y = e.clientY - rect.top;
    mouse.move = true;
  }

  function mainLoop() {
    if (mouse.click && mouse.move && mouse.pos_prev) {
      // console.log(mouse);
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

  function handleUp() {
    let temp = floor;
    temp++;
    let u = `/${select}/${temp}.jpg`;
    socket.emit('change', {roomName, nickName, imageUrl: u, map: select, nFloor: temp});
  }

  function handleDown() {
    let temp = floor;
    temp--;
    let u = `/${select}/${temp}.jpg`;
    socket.emit('change', {roomName, nickName, imageUrl: u, map: select, nFloor: temp});
  }

  return (
    <div>
      {clients.length > 0 && clients.map(n => (
        <p>{n.nickname}</p>
      ))}
      <select defaultValue={select}>
        <option value='consulate'>consulate</option>
      </select>
      <div>
        <button onClick={handleUp}>floor up</button>
        <button onClick={handleDown}>floor down</button>
      </div>
      <div style={{width: '100%', height: '100%'}}>
        <canvas style={{border: '1px black solid', backgroundImage: `url(${url})`}}
          id='drawing'
          width={1600} height={900}
          ref={canvasRef}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}></canvas>
      </div>
    </div>
  )
}