import React, { createRef, useContext, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import {BrowserRouter as Router, Switch, Route, useParams} from 'react-router-dom';
import {SocketContext, socket} from './SocketContext';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
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
  var originx = 0;
  var originy = 0;
  var scale = 1;
  const [roomName, setRoom] = useState(id);
  const [nickName, setNickname] = useState(props.location.state.nickName);
  const [clients, setClients] = useState([]);
  const [select, setSelect] = useState('consulate');
  const [floor, setFloor] = useState(1);
  // const [url, setUrl] = useState(`/consulate/1.jpg`); PRODUCTION
  const [url, setUrl] = useState(`http://10.0.0.113:5000/consulate/1.jpg`);
  const [pos, setPos] = useState({ x: 0, y: 0, scale: 1});

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
    }
  }, []);

  /** !!loads drawings on join!! */
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
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
    }
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

  function onMouseScroll(e) {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    var mousex = mouse.pos.x - canvas.offsetLeft;
    var mousey = mouse.pos.y - canvas.offsetTop;
    var wheel = e.nativeEvent.wheelDelta/120;
    console.log(e);

    var zoom = Math.pow(1+Math.abs(wheel)/2, wheel > 0 ? 1 : -1);

    context.translate(originx, originy);
    context.scale(zoom,zoom);
    context.translate(
      -( mousex / scale + originx - mousex / (scale*zoom) ),
      -( mousey / scale + originy - mousey / (scale*zoom) )
    );

    originx = ( mousex / scale + originx - mousex / (scale*zoom) );
    originy = ( mousey / scale + originy - mousey / (scale*zoom) );
    scale *=zoom;
  }

  function onWheelCapture(e) {
    const delta = e.deltaY * -0.01;
    const newScale = pos.scale + delta;
    const ratio = 1 - newScale / pos.scale;

    setPos({
      scale: newScale,
      x: pos.x + (e.clientX - pos.x) * ratio,
      y: pos.y + (e.clientY - pos.y) * ratio
    });
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
    // let u = `/${select}/${temp}.jpg`; PRODUCTION
    let u = `http://10.0.0.113:5000/${select}/${temp}.jpg`; //DEV
    socket.emit('change', {roomName, nickName, imageUrl: u, map: select, nFloor: temp});
  }

  function handleDown() {
    let temp = floor;
    temp--;
    // let u = `/${select}/${temp}.jpg`; PRODUCTION
    let u = `http://10.0.0.113:5000/${select}/${temp}.jpg`; //DEV
    socket.emit('change', {roomName, nickName, imageUrl: u, map: select, nFloor: temp});
  }

  function handleSelect(e) {
    // setSelect(e.target.value);
    let u = `http://10.0.0.113:5000/${e.target.value}/1.jpg`;
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
      <div style={{width: '100%', height: '100%'}}>
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