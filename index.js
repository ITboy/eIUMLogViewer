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
    var dataLength = 23;
    var dataStr = chunk.slice(0, dataLength);

    var date = moment(dataStr, "MM/DD/YYYY HH:mm:ss.SSS", true);

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

    var logTime = moment(logTimeStr, "MM-DD-YYYY HH:mm:ss Z");
    var iumRule = iumRuleStr.substr(1, iumRuleStr.length-2);
    var logLevel = logLevelStr.substr(0, logLevelStr.length-1);
    var shortMessage = message.substr(0, 50);
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
        thread, thread,
        shortMessage:shortMessage,
        message:message
      }
    );
    callback();
  });
};

var formatHtml = function() {
  return through2({objectMode: true}, function(chunk, enc, callback) {
    var logLineFormat = `<div class='log_line'>
                        <div class='log_line_head'>
                                <div class='log_line_time'>%s</div>
                                <div class='log_line_thread'>%s</div>
                                <div class='log_line_rule'>%s</div>
                                <div class='log_line_log_level'>%s</div>
                                <div class='log_line_short_message'>%s</div>
                        </div>
                        <div class="log_line_message">%s</div>
                   </div>`;

   var logLine = util.format(logLineFormat, chunk.logTime.toString(), chunk.logLevel, chunk.iumRule, chunk.thread, chunk.shortMessage, chunk.message);
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
  res.write("<html><head><title>eIUM Log View</title><link rel='stylesheet' type='text/css' href='main.css'></head><body>");
  fs.createReadStream("ocs.log").pipe(spiltLine()).pipe(reAlignLine()).pipe(parseLogLine()).pipe(formatHtml()).on('end', function() {
    res.write("</body></html>");
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
