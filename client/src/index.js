import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import { SocketContext, socket } from './SocketContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import App from './App';
import Room from './Room';

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