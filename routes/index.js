var express = require('express');
var router = express.Router();

var path=require("path");
var fs = require("fs");
var spawn = require('child_process').spawn;
var http = require('http').Server(app);
var app = require('../app.js');
var io = require('socket.io')(http);


//var eIUMLogViewer = require("eIUMLogViewerComponent");

var server = "snap@15.114.119.56";
var filename = "/var/opt/SIU_snap/log/ocs.log";

router.get("/", function(req, res) {
  /*
  var logContent = [];
  var tail = spawn("ssh", [server, "cat", filename]);

  fs.createReadStream(path.join(__dirname, "../ocs.log"))
  //tail.stdout
    .pipe(eIUMLogViewer.spiltLine())
    .pipe(eIUMLogViewer.reAlignLine())
    .pipe(eIUMLogViewer.parseLogLine())
//    .pipe(eIUMLogViewer.formatHtml())
    .on('data', function(chunk, enc, callback) {
      logContent.push(chunk);
    }).on('end', function() {
      res.render('index', {log_body_content: logContent});
  });
   */
  //res.send("<h1>Hello World</h1>");
  io.on('connection', function(socket){
    console.log('A user is connected');
  });
  res.render('index');
});

module.exports = router;
