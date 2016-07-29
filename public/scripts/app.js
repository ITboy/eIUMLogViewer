$(function(){
  $(".log_line").on( "mouseover", function() {
    $(this).addClass("ui-bar-a");
  }).on( "mouseout", function() {
    $(this).removeClass("ui-bar-a");
  }).on("click", function(){
    var childrenCells=$(this).children();
    var length = childrenCells.length;
    var messageCell = $(childrenCells[length-1]);
    alert(messageCell.text());
    alert($("#active-message").children("ui-content").text());
    $("#active-message").children("ui-content").text(messageCell.text());
    $("#triger-click").click();
  });

  $("[href^='#nme']").click(function(){
    var targetId = $(this).attr("href");
    var targetIndex = targetId.substr("#nme".length);
    var rawHtml = $("#raw" + targetIndex + " div pre").html();
    var jsonObj = parseMessage(rawHtml);
    $("#objNME" + targetIndex).treeview({data:jsonObj.nme});
  });

  $("[href^='#snme']").click(function(){
    var targetId = $(this).attr("href");
    var targetIndex = targetId.substr("#snme".length);
    var rawHtml = $("#raw" + targetIndex + " div pre").html();
    var jsonObj = parseMessage(rawHtml);
    $("#objSNME" + targetIndex).treeview({data:jsonObj.snme});
  });
});
