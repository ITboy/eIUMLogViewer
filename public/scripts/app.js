  //var socket = io();

  //socket.on('connection', function(socket))
var app = angular.module('eIUMLogViewerApp', []);

app.controller('getLogObjController', function($scope, $timeout){
  var socket = io("http://127.0.0.1:3000");
  $scope.logObjs = [];

  // schedule to fetch data

  var FETCH_DATA_INTERVAL = 1000;
  var nextKey, firstKey;

  var fetchDataTimer = setInterval(function() {
    console.log('timer... nextKey: ' + nextKey);
    if (nextKey) {
      fetchData(nextKey, FETCH_DATA_COUNT, function(log) {
        console.dir(log);
        $scope.logObjs.unshift(log);
        $scope.$apply();
        nextKey += 1;
      });
    }
  }, FETCH_DATA_INTERVAL);

  // socket io event handler
  socket.on('data', function(data){
    console.log('recevie data:' + data);

    for (i = 0; i<data.length; i++) {
      //$scope.logObjs.unshift(data[i]);
      addLog(data[i]);
    }
    //$scope.$apply();
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
  const FETCH_DATA_COUNT = 5;
  var db;

  var openDb = function() {
    console.log("openDb ...");
    var req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onsuccess = function (evt) {
      // Better use "this" than "req" to get the result to avoid problems with
      // garbage collection.
      // db = req.result;
      db = this.result;
      console.log("openDb DONE");
      clearObjectStore();
    };
    req.onerror = function (evt) {
      console.error("openDb:", evt.target.errorCode);
    };

    req.onupgradeneeded = function (evt) {
      console.log("openDb.onupgradeneeded");
      var store = evt.currentTarget.result.createObjectStore(
        DB_STORE_NAME, { keyPath: 'id', autoIncrement: true });
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

  var clearObjectStore = function(store_name) {
    var store = getObjectStore(DB_STORE_NAME, 'readwrite');
    var req = store.clear();
    req.onsuccess = function(evt) {
      console.log("Store cleared");
    };
    req.onerror = function (evt) {
      console.error("clearObjectStore:", evt.target.errorCode);
    };
  };

  var addLog = function(log) {
    console.log("add Log arguments:", arguments);

    var store = getObjectStore(DB_STORE_NAME, 'readwrite');
    var req;
    try {
      req = store.add(log);
    } catch (e) {
      if (e.name == 'DataCloneError')
        console.log("This engine doesn't know how to clone a Blob, " +
                    "use Firefox");
      throw e;
    }
    req.onsuccess = function (evt) {
      console.log("Insertion in DB successful");
      if (!firstKey) {
        // set 1 to firstKey, so the next add Log will not enter this block
        // and do the fetchFirstKey again.
        firstKey = 1;
        fetchFirstKey();
      }
    };
    req.onerror = function() {
      console.error("add log error", this.error);
    };
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
    var store = getObjectStore(DB_STORE_NAME, 'readwrite');
    var req;
    var keyRangeValue = IDBKeyRange.bound(startKey, startKey + recordCount, false, true);

    req = store.openCursor(keyRangeValue);

    req.onsuccess = function(event) {
      var cursor = event.target.result;
      if(cursor) {
        var value = cursor.value;
        callback(value);
        cursor.continue();
      } else {
        // no more results
        console.log('fetchData: No more results');
      }
    };
    req.onerror = function() {
      console.error("fetch data error", this.error);
    };
  };

  openDb();
});
