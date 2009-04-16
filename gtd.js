
function init_todo() {
    var d = document.createElement("div");
    d.setAttribute('id', 'tododiv');
    $("#todo").wrap(d);
    $("#tododiv").css("border","3px solid red")
    $("#tododiv + p").css("border","3px solid green")
};

function init_structure() {
    var headerList = document.getElementsByTagName("h1");
    for (var i = 0; i < headerList.length; i++) {  
        if (i == headerList.length) {
            break;
        }
        var header = headerList[i];  
        var nextHeader = headerList[i+1];
        var nextSibling = header.nextSibling;
        var div = document.createElement('div');
        header.parentNode.replaceChild(div, header);  
        div.appendChild(header);  
        while (nextSibling != nextHeader) {
            var tmpSibling = nextSibling.nextSibling;
            var tmpParent = nextSibling.parentNode;
            tmpParent.removeChild(nextSibling);
            div.appendChild(nextSibling);
            nextSibling = tmpSibling;
        }        
    }
}

$(document).ready(function(){
	//init_todo();
	init_structure();
 });
