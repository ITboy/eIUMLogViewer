var Server = require('socket.io');
var fs = require("fs");
var path=require("path");
var eIUMLogViewer = require("./eIUMLogViewerComponent");
var spawn = require('child_process').spawn;

const BIN_DIR='D:';
//const logFile = '/f/LEO/project/eIUMLogViewer/ocs.log';
const logFile = 'ocs.log';
var createSocket = function(http) {
  var io = new Server(http);
  var stream;
  //var tail = spawn(BIN_DIR + '/tail.exe -f', [logFile]);
  var tail;
  io.on('connection', function(socket){
    console.log('a user connected');
    if (tail) {
      tail.kill();
    }
    tail = spawn('tail', ['-n', '+0', '-f', logFile]);
    //stream = fs.createReadStream(path.join(__dirname, "ocs.log"))
    stream = tail.stdout
      .pipe(eIUMLogViewer.spiltLine())
      .pipe(eIUMLogViewer.reAlignLine())
      .pipe(eIUMLogViewer.parseLogLine())
      .pipe(eIUMLogViewer.bufferedLog(500, 500), {end: false})
      .on('data', function(chunk, enc, callback) {
        console.log("read data");
        socket.emit('data', chunk);
      }).on('end', function() {
        console.log("\n----------READ EOF--------------\n");
      });

    socket.on('refresh', function() {
      console.log('refresh ...');
      tail.kill();

      tail = spawn('D:\\tail.exe', ['-n', '+0', '-f', logFile]);
      //stream = fs.createReadStream(path.join(__dirname, "ocs.log"))

      stream = tail.stdout
        .pipe(eIUMLogViewer.spiltLine())
        .pipe(eIUMLogViewer.reAlignLine())
        .pipe(eIUMLogViewer.parseLogLine())
        .pipe(eIUMLogViewer.bufferedLog(100, 1000), {end: false})
        .on('data', function(chunk, enc, callback) {
          console.log("read data");
          socket.emit('data', chunk);
        }).on('end', function() {
          console.log("\n----------READ EOF--------------\n");
        });
    });

    socket.on('pause', function() {
      console.log('pause ...');

      stream.pause();
    });

    socket.on('resume', function() {
      console.log('resume ...');

      stream.resume();
    });
  });


};

module.exports = createSocket;
