var path=require("path");
var fs = require("fs");
var eIUMLogViewer = require("eIUMLogViewerComponent");

exports.index = function(req, res) {
  var logContent = [];

  fs.createReadStream(path.join(__dirname, "../ocs.log"))
    .pipe(eIUMLogViewer.spiltLine())
    .pipe(eIUMLogViewer.reAlignLine())
    .pipe(eIUMLogViewer.parseLogLine())
//    .pipe(eIUMLogViewer.formatHtml())
    .on('data', function(chunk, enc, callback) {
      logContent.push(chunk);
    }).on('end', function() {
      res.render('index', {log_body_content: logContent});
  });
};
