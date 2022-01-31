const http = require('http');
const path = require('path');
const express = require('express');
const socketio = require('socket.io');
const app = express();
const PORT = 3000;
const server = http.createServer(app);
const io = socketio(server);
const cors = require('cors');
const { addUser, removeUser, getUser, getUsers } = require('./userFunctions');

const routerPage = require('./Routers/routers')

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());
// router handler
app.use('/', routerPage)

// -------------------------------------------------------------------------
io.on('connect', socket => {
  // when the user enters the room
  socket.on('join', ({ name, room }) => {
    const { user } = addUser({ name, room });

    socket.join(user.room);
    socket.emit('message', { user: 'admin', message: `${user.name}, welcome to room ${user.room}!` });
    socket.broadcast.emit('message', { user: 'admin', message: `${user.name} has joined the room!` });
    io.to(user.room).emit('roomInfo', { room: user.room, users: getUsers(users.room) });
  });

  // when the user send a message
  socket.on('sendMessage', ({ name, message }) => {
    const user = getUser(name);
    io.to(user.room).emit('message', { user: user.name, message: message });
  });

  // when the user leave the room
  socket.on('disconnect', name => {
    const user = removeUser(name);
    io.to(user.room).emit('message', { user: 'admin', message: `${user.name} has left the room` });
    io.to(user.room).emit('roomInfo', { room: user.room, users: getUsers(user.room)});
  });
});


// -------------------------------------------------------------------------

// router error 
app.use((req, res) => res.status(404).send('This is not the page you\'re looking for...'));

// express error handler 
app.use((err, req, res, next) => {
    const defaultErr = {
        log: 'Express error handler caught unknown middleware error',
        status: 400,
        message: {err: 'An error has occurred!'}
    };
    const errorObj = Object.assign({}, defaultErr, err);
    console.log(errorObj.log);
    return res.status(errorObj.status).json(errorObj.message);
})

// listen to server
app.listen(PORT, () => {
    console.log(`Server listening on port: ${PORT}...`);
});