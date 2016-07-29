const util = require('util');
var fs = require("fs");
var path=require("path");
var through2 = require("through2");
var moment = require("moment");
var express = require("express");
var app = express();
var SNME2json = require("SNME2Json");

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
  return through2({objectMode: true}, function(chunk, enc, callback) {
    var chunkStr = chunk.toString("utf8");
    var headArray = chunkStr.split(" ", 6);
    var logTimeStr = headArray[0] + ' ' + headArray[1] + ' ' + headArray[2];
    var thread = headArray[3];
    var iumRuleStr = headArray[4];
    var logLevelStr = headArray[5];
    var message = chunkStr.substr(logTimeStr.length + thread.length + iumRuleStr.length + logLevelStr.length + 4);

    console.log(logTimeStr);
    var logFullTime = moment(logTimeStr, "MM-DD-YYYY HH:mm:ss.SSS Z");
    var logDate = logFullTime.format("YYYY-MM-DD");
    var logTime = logFullTime.format("HH:mm:ss.SSS");
    var iumRule = iumRuleStr.substr(1, iumRuleStr.length-2);
    var logLevel = logLevelStr.substr(0, logLevelStr.length-1);
    var shortMessage = message.substr(0, 300);

    this.push(
      {
        logDate: logDate,
        logTime: logTime,
        thread: thread,
        logLevel: logLevel,
        iumRule: iumRule,
        shortMessage: shortMessage,
        message: message,
        objectMessage: parseMessage(message),
      }
    );
    callback();
  });
};

var formatHtml = function() {
  return through2({objectMode: true}, function(chunk, enc, callback) {
    var logLineFormat = `
                <div class="panel panel-default">
                  <a data-toggle="collapse" href="#collapse" class="list-group-item">
                        <div class='col-md-1'>%s</div>
                        <div class='col-md-1'>%s</div>
                        <div class='col-md-1'>%s</div>
                        <div class='col-md-2'>%s</div>
                        <div class='col-md-2'>%s</div>
                        <div class='col-md-5'>%s</div
                  </a>
                  <div id="collapse" class="panel-collapse collapse">
                    <div class="panel-body">%s</div>
                  </div>
                </div>`;

    var logLine = util.format(logLineFormat, chunk.logTime.format("YYYY-MM-DD"), chunk.logTime.format("HH:mm:ss.SSS"), chunk.logLevel, chunk.iumRule, chunk.thread, chunk.shortMessage, chunk.message);
    this.push(logLine);
    callback();
  });
};

var parseMessage = function(rawMessage) {
  var trimMessage = rawMessage.trim();
  var messageHeader, tmpMessageHeader, nme, snme;

  if (trimMessage.length === 0 || trimMessage[0] !== '[' || trimMessage.indexOf(']') === -1) {
    return rawMessage;
  }
  var nmeStart = trimMessage.indexOf(']') +1;
  messageHeader = trimMessage.substr(1, nmeStart-1);
  var leftMessage = trimMessage.substr(nmeStart).trim();
  var commaArray = leftMessage.split(',');

  if (commaArray.length === 0 || commaArray[1].indexOf("=") === -1) {
    return rawMessage;
  }


  for (var i=0; i<commaArray.length; i++) {
    var validateStr = commaArray[i];
    if (validateStr.indexOf("=") !== -1 && validateStr.indexOf("{") === -1 && validateStr.indexOf("[") === -1) {
      continue;
    } else {
      break;
    }
  }
  var seperatorPos = leftMessage.indexOf(commaArray[i]) - 1;
  seperatorPos = leftMessage.indexOf('\n', seperatorPos);
  var nmeStr = leftMessage.substr(0, seperatorPos);
  var snmeStr = leftMessage.substr(seperatorPos);

  nme = SNME2json.json2TreeViewObj(SNME2json.parseNME(nmeStr));
  snme = SNME2json.json2TreeViewObj(SNME2json.parseSNME(snmeStr));
  return {
    messageHeader: messageHeader,
    nme: nme,
    snme: snme
  };
};

exports.formatHtml = formatHtml;
exports.parseLogLine = parseLogLine;
exports.spiltLine = spiltLine;
exports.reAlignLine = reAlignLine;
