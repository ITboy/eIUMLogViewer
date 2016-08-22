  //var socket = io();

  //socket.on('connection', function(socket))
var app = angular.module('eIUMLogViewerApp', []);

app.controller('getLogObjController', function($scope, $timeout){
  var socket = io("http://204.44.89.221:3000");
  $scope.logObjs = [];

  // schedule to fetch data

  const FETCH_DATA_INTERVAL = 200;
  const FETCH_DATA_COUNT = 20;
  var nextKey =0 , firstKey = 0;
  var fetchDataTimer;

  var showLog = function() {
    console.log('timer... nextKey: ' + nextKey);
      fetchData(nextKey, FETCH_DATA_COUNT, function(logs) {
        //console.dir(log);
        if (logs && logs.length > 0) {
          async.each(logs, function(log) {
            $scope.logObjs.unshift(log);
          });
          $scope.$apply();
          nextKey += logs.length;
        }
        fetchDataTimer = setTimeout(showLog, FETCH_DATA_INTERVAL);
      });
  };

  // socket io event handler
  socket.on('data', function(data){
    console.log('recevie data:' + data.length);

    addLog(data);

    if (!fetchDataTimer) {
      showLog();
    }
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

  // Create IndexedDB
  const DB_NAME = 'eIUMLogViewerDB';
  const DB_VERSION = 1;
  const DB_STORE_NAME = 'eIUMLog';

  var db;

  var openDb = function(callback) {
    console.log("openDb ...");
    var req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onsuccess = function (evt) {
      // Better use "this" than "req" to get the result to avoid problems with
      // garbage collection.
      // db = req.result;
      db = this.result;
      console.log("openDb DONE");
      callback(null);
    };

    req.onerror = function (evt) {
      console.error("openDb:", evt.target.errorCode);
      callback(evt.target.errorCode);
    };

    req.onupgradeneeded = function (evt) {
      console.log("openDb.onupgradeneeded");
      var store = evt.currentTarget.result.createObjectStore(
        DB_STORE_NAME, { keyPath: 'id'});
    };
  };

  /**
   * @param {string} store_name
   * @param {string} mode either "readonly" or "readwrite"
   */
  var getObjectStore = function (store_name, mode) {
    var tx = db.transaction(store_name, mode);
    return tx.objectStore(store_name);
  };

  var clearObjectStore = function(callback, store_name) {
    var store = getObjectStore(DB_STORE_NAME, 'readwrite');
    var req = store.clear();
    req.onsuccess = function(evt) {
      console.log("Store cleared");
      callback(null);
    };
    req.onerror = function (evt) {
      console.error("clearObjectStore:", evt.target.errorCode);
      callback(evt.target.errorCode);
    };
  };
  var logId = 0;
  var addLog = function(logs) {
    console.log("add Log" + logId);

    var store = getObjectStore(DB_STORE_NAME, 'readwrite');
    var req;
    for (i in logs) {
      try {
        req = store.add(logs[i]);
        req.logId = logId;
        console.time(logId);
        logId ++;

      } catch (e) {
        if (e.name == 'DataCloneError')
          console.log("This engine doesn't know how to clone a Blob, " +
                      "use Firefox");
        throw e;
      }
      req.onsuccess = function (evt) {
        console.log("Insertion in DB successful:" + evt.target.logId);
        console.timeEnd(evt.target.logId);
      };
      req.onerror = function() {
        console.error("add log error", this.error);
      };
    }
  };

  var fetchFirstKey = function() {
    var store = getObjectStore(DB_STORE_NAME, 'readwrite');
    var req;

    req = store.openKeyCursor();

    req.onsuccess = function(event) {
      var cursor = event.target.result;
      if(cursor) {
        console.log('fetchFirstKey: ' + cursor.key);
        nextKey = firstKey = cursor.key;
      } else {
        // no more results
        console.log('fetchFirstKey: No result found');
      }
    };
    req.onerror = function() {
      console.error("fetchFirstKey error", this.error);
    };
  };

  var fetchData = function(startKey, recordCount, callback) {
    var store = getObjectStore(DB_STORE_NAME, 'readonly');
    var req;
    var keyRangeValue = IDBKeyRange.bound(startKey, startKey + recordCount, false, true);
    var logs = [];
    req = store.openCursor(keyRangeValue);

    req.onsuccess = function(event) {
      var cursor = event.target.result;
      if(cursor) {
        console.log('fetch data..');
        logs.push(cursor.value);
        cursor.continue();
      } else {
        // no more results
        console.log('fetchData: No more results');
        callback(logs);
      }
    };
    req.onerror = function() {
      console.error("fetch data error", this.error);
    };
  };

  async.series([
    function(callback) {
      openDb(callback);
    },
    function(callback) {
      clearObjectStore(callback, DB_STORE_NAME);
    }
    ], function(err, results) {

    });
});
