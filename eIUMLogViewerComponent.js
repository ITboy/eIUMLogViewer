const util = require('util');
var fs = require("fs");
var path=require("path");
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
  return through2({objectMode: true}, function(chunk, enc, callback) {
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
    var logLineFormat = "<tr class='log_line'><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td style='display:none'>%s</td></tr>";

    var logLine = util.format(logLineFormat, chunk.logTime.format("YYYY-MM-DD"), chunk.logTime.format("HH:mm:ss.SSS"), chunk.logLevel, chunk.iumRule, chunk.thread, chunk.shortMessage, chunk.message);
    this.push(logLine);
    callback();
  });
};

exports.formatHtml = formatHtml;
exports.parseLogLine = parseLogLine;
exports.spiltLine = spiltLine;
exports.reAlignLine = reAlignLine;
