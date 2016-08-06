var Server = require('socket.io');

var createSocket = function(http) {
  var io = new Server(http);

  io.on('connection', function(socket){
    console.log('a user connected');
  });
}

module.exports = createSocket;
