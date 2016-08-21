var express = require('express');
var router = express.Router();

var spawn = require('child_process').spawn;
var http = require('http').Server(app);
var app = require('../app.js');
var io = require('socket.io')(http);




var server = "snap@15.114.119.56";
var filename = "/var/opt/SIU_snap/log/ocs.log";

router.get("/", function(req, res) {
  /*
  var logContent = [];
  var tail = spawn("ssh", [server, "cat", filename]);
*/
  //res.send("<h1>Hello World</h1>");

  res.render('index');
});

module.exports = router;
