const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const Filter = require("bad-words");
const {
  generateMessage,
  generateLocationMessage
} = require("../src/utils/messages");
const {
  addUser,
  getUser,
  getUsersInRoom,
  removeUser
} = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, "../public");

app.use(express.static(publicDirectoryPath));

io.on("connection", socket => {
  console.log("New WebSocket connection");

  socket.on("join", ({ username, room }, callback) => {
    const { user, error } = addUser({ id: socket.id, username, room });

    if (error) {
      return callback(error);
    }

    socket.join(user.room);

    socket.emit("message", {
      username: "Admin",
      ...generateMessage("Welcome!")
    });
    socket.broadcast
      .to(user.room)
      .emit("message", {
        username: "Admin",
        ...generateMessage(`${user.username} has joined!`)
      });

      // Tell everyone in the room a new user has entered
      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room)
      })
  });

  // The callback function is the acknowledgement callback. You can also pass args to the callback
  socket.on("sendMessage", (message, callback) => {
    const filter = new Filter();
    if (filter.isProfane(message)) {
      return callback("Profanity is not allowed!");
    }
    const user = getUser(socket.id);
    if (!user) {
      return callback("Message unable to be sent");
    }
    io.to(user.room).emit("message", {
      username: user.username,
      ...generateMessage(message)
    });
    callback("Message delivered");
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit("message", {
        username: "Admin",
        ...generateMessage(`${user.username} has left`)
      });
      
      // Tell everyone a user has left
      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room)
      })
    }
  });

  socket.on("sendLocation", ({ latitude, longitude }, callback) => {
    const user = getUser(socket.id);
    if (!user) {
      return callback("Location message unable to be sent");
    }
    io.to(user.room).emit("sendLocationMessage", {
      username: user.username,
      ...generateLocationMessage(
        `https://google.com/maps?q=${longitude},${latitude}`
      )
    });
    callback("Location shared!");
  });
});

server.listen(port, () => {
  console.log(`Server is up on port ${port}!`);
});
