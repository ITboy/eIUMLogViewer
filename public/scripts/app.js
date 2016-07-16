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

});
