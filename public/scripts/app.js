  //var socket = io();

  //socket.on('connection', function(socket))
var app = angular.module('eIUMLogViewerApp', []);

app.controller('getLogObjController', function($scope, $timeout){
  var socket = io("http://127.0.0.1:3000");
  $scope.logObjs = [];

  socket.on('data', function(data){
    console.log('recevie data:' + data);
    for (i = 0; i<data.length; i++) {
      $scope.logObjs.unshift(data[i]);
    }
    $scope.$apply();
  });

  $scope.refresh = function() {
    console.log('refresh');
    $scope.logObjs = [];
    socket.emit('refresh');
  };

  $scope.pause = function() {
    console.log('pause');
    socket.emit('pause');
  };

  $scope.resume = function() {
    console.log('resume');
    socket.emit('resume');
  };
});
