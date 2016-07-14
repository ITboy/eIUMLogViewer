const util = require('util');
var fs = require("fs");
var through2 = require("through2");
var moment = require("moment");
var express = require("express");
var app = express();

var spiltLine = function() {
  var data = new Buffer("");

  return through2(function(chunk, enc, callback) {
    var i = 0, newLineIndex = 0;

    for (i=0; i<chunk.length; i++) {
      if (chunk[i] == 10 || chunk[i] == 13) {
        data = Buffer.concat([data, chunk.slice(newLineIndex, i)]);

        this.push(data);
        data = new Buffer("");
        newLineIndex = i+1;
      }
    }
    if (i < chunk.length) {
      data = chunk.slice(i+1);
    } else {
      data = new Buffer("");
    }
    callback();
  });
};

var reAlignLine = function() {
  var alignLine;

  return through2(function(chunk, end, callback) {
    var dateLength = 23;
    var dateStr = chunk.slice(0, dateLength);

    var date = moment(dateStr.toString(), "MM/DD/YYYY HH:mm:ss.SSS", true);

    if (!date.isValid()) {
      alignLine = Buffer.concat([alignLine, chunk]);
    } else if (!alignLine) {
      alignLine = chunk;
    } else {
      this.push(alignLine);

      alignLine = chunk;
    }
    callback();
  });
};

var parseLogLine = function() {
  return through2({objectMode: true}, function(chunk, end, callback) {
    var chunkStr = chunk.toString("utf8");
    var headArray = chunkStr.split(" ", 6);
    var logTimeStr = headArray[0] + ' ' + headArray[1] + ' ' + headArray[2];
    var thread = headArray[3];
    var iumRuleStr = headArray[4];
    var logLevelStr = headArray[5];
    var message = chunkStr.substr(logTimeStr.length + thread.length + iumRuleStr.length + logLevelStr.length + 4);

    console.log(logTimeStr);
    var logTime = moment(logTimeStr, "MM-DD-YYYY HH:mm:ss.SSS Z");
    var iumRule = iumRuleStr.substr(1, iumRuleStr.length-2);
    var logLevel = logLevelStr.substr(0, logLevelStr.length-1);
    var shortMessage = message.substr(0, 300);
/*
    console.log("-------------------------%s", logTimeStr);
    console.log("-------------------------%s", thread);
    console.log("-------------------------%s", iumRule);
    console.log("-------------------------%s", logLevel);
    console.log("-------------------------%s", message);
*/
    this.push(
      {
        logTime:logTime,
        thread:thread,
        logLevel:logLevel,
        iumRule:iumRule,
        shortMessage:shortMessage,
        message:message
      }
    );
    callback();
  });
};

var formatHtml = function() {
  return through2({objectMode: true}, function(chunk, enc, callback) {
    var logLineFormat = "<tr><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td></tr>";

    var logLine = util.format(logLineFormat, chunk.logTime.format("YYYY-MM-DD"), chunk.logTime.format("HH:mm:ss.SSS"), chunk.logLevel, chunk.iumRule, chunk.thread, chunk.shortMessage);
    this.push(logLine);
    callback();
  });
};


var debugStream = through2(function(chunk, enc, callback) {
  //console.log("------------------BEGIN--------------\n" + chunk.toString("utf8"));
  //console.log("------------------END--------------\n");
  this.push(Buffer.concat([new Buffer("<div style='margin:auto; width:800px; border:1px solid'>"), chunk, new Buffer("</div>\n")]));
  callback();
});

//fs.createReadStream("ocs-full.log").pipe(spiltLine()).pipe(reAlignLine()).pipe(debugStream);
//fs.createReadStream("ocs-full-bak.log").pipe(spiltLine()).pipe(reAlignLine()).pipe(formatHtml).pipe(fs.createWriteStream("transform.html"));
//06/21/2016 22:45:52.231 GMT+08:0
/*
 var aDate = moment("06/21/2016 22:45:52.231 GMT+08:0", "MM-DD-YYYY HH:mm:ss Z");
console.log(aDate.isValid());
console.log(aDate.zone());
console.log(aDate.utcOffset());
*/

//fs.createReadStream("ocs.log").pipe(spiltLine()).pipe(reAlignLine()).pipe(parseLogLine()).pipe(formatHtml()).pipe(debugStream);

/*
setTimeout(function(){
  console.log("begin");
  fs.createReadStream("ocs-full-bak.log").pipe(spiltLine()).pipe(reAlignLine()).pipe(debugStream)
  console.log("end");
}, 3000);
*/
app.get('/', function (req, res) {
  res.write(`<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="http://code.jquery.com/mobile/1.4.5/jquery.mobile-1.4.5.min.css">
<script src="http://code.jquery.com/jquery-1.11.3.min.js"></script>
<script src="http://code.jquery.com/mobile/1.4.5/jquery.mobile-1.4.5.min.js"></script>
<style>
th
{
border-bottom: 1px solid #d6d6d6;
}
tr:nth-child(even)
{
background:#e9e9e9;
}
</style>
</head>
<body>

<div data-role="page" id="pageone">
  <div data-role="header">
    <h1>eIUM log viewer</h1>
  </div>

  <div data-role="main" class="ui-content">
    <form>
      <input id="filterTable-input" data-type="search" placeholder="Search ...">
    </form>
    <table data-role="table" data-mode="columntoggle" class="ui-responsive ui-shadow" id="myTable" data-filter="true" data-input="#filterTable-input">
      <thead>
        <tr>
          <th data-priority="1">Date</th>
          <th data-priority="6">Time</th>
          <th data-priority="2">Thread</th>
          <th data-priority="3">eIUM Rule</th>
          <th data-priority="4">Log Level</th>
          <th data-priority="5">Short Message</th>
        </tr>
      </thead>
                <tbody>
        `);
  fs.createReadStream("ocs.log").pipe(spiltLine()).pipe(reAlignLine()).pipe(parseLogLine()).pipe(formatHtml()).on('end', function() {
    res.write(`</tbody>
    </table>
  </div>
</div>
</body>
</html>`);
    console.log("--------------------------------------------------------------");
    res.end();
  }).pipe(res, {end:false});
  });

app.get('/a', function (req, res) {
  //fs.createReadStream("ocs-full-bak.log").pipe(spiltLine()).pipe(reAlignLine()).pipe(formatHtml).pipe(res);
  //fs.createReadStream("ocs-full-bak.log").pipe(spiltLine()).pipe(reAlignLine()).pipe(debugStream).pipe(res);
  //res.write("hahah");
  res.end("hahah");
});

app.use(express.static("public"));
app.listen(3000, function () {
  console.log('eIUM log view listening on port 3000!');
});
