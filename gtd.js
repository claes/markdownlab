var ical = {
    todos:[],
    contexts: {
    },
    projects: {
    },
    todoStats: {
	total: 0,
	notstarted: 0,
	completed: 0,
	cancelled: 0,
	inprocess: 0,
	halted: 0,
	needsaction: 0,
	unknown: 0
    }
};

function init_tickler() {

    //TODOs
    $('#tickler').append('<ul id="todo-stats" class="tickler-selectable"><li id="todo-stats-total" todostatus="all">Number of todos: '+ical.todoStats.total+'</li>' +
			 '<li id="todo-stats-notstarted" todostatus="notstarted">Not started: '+ical.todoStats.notstarted+'</li>' + 
			 '<li id="todo-stats-completed" class="completed" todostatus="completed">Completed: '+ical.todoStats.completed+'</li>' + 
			 '<li id="todo-stats-cancelled" todostatus="cancelled">Cancelled: '+ical.todoStats.cancelled+'</li>' + 
			 '<li id="todo-stats-inprocess" todostatus="inprocess">In process: '+ical.todoStats.inprocess+'</li>' + 
			 '<li id="todo-stats-halted" todostatus="halted">Halted: '+ical.todoStats.halted+'</li>' + 
			 '<li id="todo-stats-needsaction" todostatus="needsaction">Needs action: '+ical.todoStats.needsaction+'</li>' + 
			 '<li id="todo-stats-unknown" todostatus="unknown">Unknown status: '+ical.todoStats.unknown+'</li></ul>' 
			 );

    $("#todo-stats").selectable({
				   stop: function(event, ui){
                                       $("[todostatus]", this).each(function(){
                                               var todostatus = $(this).attr('todostatus');
                                               if (todostatus) {
                                                   if ($(this).hasClass('ui-selected')) {
                                                       $("p." + todostatus).slideUp("slow");
                                                   } else {
                                                       $("p." + todostatus).slideDown("slow");
                                                   }
                                               }
                                           });
	    }});


    //Contexts
    $('#tickler').append('<p>Contexts:<ul id="context-stats" class="tickler-selectable" ></ul></p>');
    for (var context in ical.contexts) {
	$('#context-stats').append('<li id="todo-contexts-'+context+'" contextname="'+context+'" >' + context + '</li>');
    }
    $("#context-stats").selectable({
				   stop: function(event, ui){
                                       $("[contextname]", this).each(function(){
                                               var context = $(this).attr('contextname');
                                               if (context) {
                                                   if ($(this).hasClass('ui-selected')) {
                                                       $("p.context-" + context).slideUp("slow");
                                                   } else {
                                                       $("p.context-" + context).slideDown("slow");
                                                   }
                                               }
                                           });
	    }});

    $('#tickler').append('<p>Projects:<ul id="projects-stats" class="tickler-selectable" ></ul></p>');
    for (var project in ical.projects) {
	$('#projects-stats').append('<li id="todo-projects-'+project+'" projectname="'+project+'" >' + ical.projects[project] + '</li>');
    }


    $('#tickler').append('<p>Projects table:<table id="projects-table" ></table>');
    for (var project in ical.projects) {
	$('#projects-table').append('<tr><td id="todo-project-'+project+'">' + ical.projects[project] + '</td></tr>');
	$('#todo-project-'+project).click(function() {
		alert('print');
		$('#todo').jqprint();
		return (false);
	    });
    }


}


function wrap_todo(todoElem) {

    var text = todoElem.textExtraWhitespace();

    //todo is identified by brackets around a char
    var todoSymbol = /^\[(.)\]/.exec(text);
    //Mark as todo item
    if (todoSymbol) {
	if (todoSymbol.index != -1) {
	    todoElem.addClass("todo");
	}
	//kind of event
	var todoStatus;
	if (todoSymbol[1] == " ") {
	    todoStatus = "notstarted";
	} else if (todoSymbol[1] == "+") {
	    todoStatus = "completed"; //in ical for todo
	} else if (todoSymbol[1] == '-') {
	    todoStatus = "cancelled";   //in ical for todo
	} else if (todoSymbol[1] == '>') {
	    todoStatus = "inprocess"; // in ical for todo
	} else if (todoSymbol[1] == '<') {
	    todoStatus = "halted";
	} else if (todoSymbol[1] == '!') {
	    todoStatus = "needsaction";
	} else if (todoSymbol[1] == '?') {
	    todoStatus = "unknown"
		} 
	if (todoStatus) {
	    todoElem.addClass(todoStatus);
	    ical.todoStats.total++;
	    ical.todoStats[todoStatus]++;
	}

	var todo = new Object();
	var keyword;
	var dateExpr = '[0-9]{4,4}-[0-9]{2,2}-[0-9]{2,2}';
	var stringExpr = '[^\s]*';
	var todoDateKeywords = ['due', //ical 'due'. when a todo is expected to be completed. 
				'dtstart' //ical 'dtstart'. when a calendar component begins
				];
	for (var i = 0; i < todoDateKeywords.length; i++) {
	    keyword = todoDateKeywords[i];
	    var expr = new RegExp(keyword + ':(' + dateExpr + ')').exec(text);
	    if (expr && expr.index != -1) {
		var dateObj = new Date();
		dateObj.setISO8601(expr[1])
		    todo[keyword] = dateObj;
	    }
	}
	var todoStringKeywords = ['class', //public / private / confidential
				  'geo', // longitude + latitude
				  'location', //string describing location
				  'priority', //integer, lower is higher, 1 is highest, 0 is undefined
				  'percent-complete', //int 1-100 for percent completeness
				  'uid', //unique id of this todo
				  'url' //url that describes this todo further
				  ];
	for (var i = 0; i < todoStringKeywords.length; i++) {
	    keyword = todoStringKeywords[i];
	    var expr = new RegExp(keyword + ':(' + stringExpr + ')').exec(text);
	    if (expr && expr.index != -1) {
		todo[keyword] = expr[1];
	    }
	}

	//Find contexts: strings started by @. Have no ical relationship
	var contexts = text.match(/@([^\s]+)/g);
	if (contexts && contexts.length > 0) {
	    var comment = "";
	    for (var i = 0; i < contexts.length; i++) {
		var context = contexts[i].slice(1); //strip @ sign
		comment += context;
		ical.contexts[context] = true;
	    }
	    todo.contexts = contexts;
	    todo.comment = comment;
	    todoElem.addClass('context-'+context);
	}

	//Find project: this is the heading this todo is sorted under
	//In markdown each heading is contained in a div which uses
	//the heading name as basis for its id
	var projectDiv = todoElem.closest('div');
	if (projectDiv && projectDiv.get(0)) {
	    projectDiv.addClass('project');
	    var projectId = projectDiv.get(0).id;
	    var projectName = projectDiv.children('h1');
	    if (projectId && projectName) {
		todo.project = projectName.text();
		ical.projects[projectId] = projectName.text();
	    }
	}

	todo.description = text;
	todo.status = todoStatus;
	todo.symbol = todoSymbol[1];
	todo.element = todoElem;
		
	ical.todos.push(todo);

    }
}

function init_todo() {

    $("div > p").each(function() {
	    wrap_todo($(this));
       	});

    $("dl > p.definitionCombo").each(function() {
	    wrap_todo($(this));
	});

}

function init_structure() {
    $('body > *').wrapAll('<div id="left"></div>');
    $('body').append('<div id="right">'+
		     '<ul><li><a href="#tickler">Tickler</a></li><li><a href="#timeline">Timeline</a></li></ul>' +
		     '<div id="tickler"></div>'+
		     '<div id="timeline"><noscript></noscript></div>'+
		     '</div>');

    //should wrap definition lists as well
    var definitionLists = document.getElementsByTagName('dl');
    for (var j = 0; j < definitionLists.length; j++) {
	var dtList = definitionLists[j].getElementsByTagName('dt');
	if (dtList) {
	    for (var i = 0; i < dtList.length; i++) {  
		if (i == dtList.length) {
		    break;
		}
		var dt = dtList[i];  
		var nextDt = dtList[i+1];
		var nextSibling = dt.nextSibling;
		//Adding p elements between dl and dt/dd is invalid HTML4 but works
		//in Firefox. I think it is pretty ok given that otherwise
		//we need much more complicated transformations. 
		var p = document.createElement('p');
		$(p).addClass('definitionCombo');
		dt.parentNode.replaceChild(p, dt);  
		p.appendChild(dt);  
		while (nextSibling != nextDt) {
		    var tmpSibling = nextSibling.nextSibling;
		    var tmpParent = nextSibling.parentNode;
		    tmpParent.removeChild(nextSibling);
		    p.appendChild(nextSibling);
		    nextSibling = tmpSibling;
		}        
	    }
	}
    }

}



var timeline;
var timeline_data;

function init_timeline_data() {
    timeline_data = new Object();
    timeline_data['dateTimeFormat'] = 'iso8601';
    timeline_data['events'] = new Array();

    //First, parse ical todos
    for (var i = 0; i < ical.todos.length; i++) {
	var todo = ical.todos[i];
	if (todo.dtstart) {
	    var e = new Object();
	    if (todo.dtstart) {
		e['start'] = todo.dtstart.toISO8601String(3);
	    }
	    if (todo.due) {
		e['end'] = todo.due.toISO8601String(3);
		if (! todo.dtstart) {
		    e['start'] = todo.due.toISO8601String(3);
		    e['durationEvent'] = false;
		}
	    }
	    e['title'] = todo.title;
	    e['description'] = todo.description;
	    timeline_data['events'].push(e);
	    e['todo'] = todo;
	}
    }
}

function init_timeline() {
    var eventSource = new Timeline.DefaultEventSource();
    var bandInfos = [
		     Timeline.createBandInfo({
			     width:          "60%", 
			     eventSource:    eventSource,
			     intervalUnit:   Timeline.DateTime.DAY, 
			     intervalPixels: 100
			 }),
		     Timeline.createBandInfo({
			     width:          "20%", 
			     eventSource:    eventSource,
			     intervalUnit:   Timeline.DateTime.MONTH, 
			     intervalPixels: 75
			 }),
		     Timeline.createBandInfo({
			     width:          "20%", 
			     eventSource:    eventSource,
			     intervalUnit:   Timeline.DateTime.YEAR, 
			     intervalPixels: 200
			 })
		     ];
    bandInfos[1].syncWith = 0;
    bandInfos[2].syncWith = 1;
    bandInfos[0].highlight = true;
    bandInfos[1].highlight = true;
    bandInfos[2].highlight = true;
    var timelineElement = document.getElementById('timeline');
    timeline = Timeline.create(timelineElement, bandInfos, Timeline.HORIZONTAL);
    var url = '.'; // The base url for image, icon and background image references in the data
    eventSource.loadJSON(timeline_data, url); // The data was stored into the timeline_data variable.
    timeline.layout(); // display the Timeline    

    var resizeTimerID = null;
    $(window).resize(function() {
	    if (resizeTimerID == null) {
		resizeTimerID = window.setTimeout(function() {
			resizeTimerID = null;
			timeline.layout();
		    }, 250);
	    }
	});

    //When clicked, focus on the todo item associated with this "bubble"
    Timeline.OriginalEventPainter.prototype._showBubble = function(x, y, evt) {
	if (evt._obj && evt._obj.todo) {
	    $('.focus').removeClass('focus');
	    evt._obj.todo.element.addClass('focus');
	    $.scrollTo( evt._obj.todo.element, 
			500,  { 
			    margin: 'true', 
				onAfter: function() {
				evt._obj.todo.element.fadeOut(300).fadeIn(300).
				    fadeOut(300).fadeIn(300);
			    } 
			});
	}

    }

    $('#right').bind('tabsshow', function(event, ui) {
	    if (ui.panel.id == "timeline") {
		timeline.layout();
	    }
	});
}

function init_tabs() {
    $("#right").tabs();
}

$(document).ready(function(){
	init_structure();
	init_todo();
	init_tickler();
	init_timeline_data();
	init_timeline();
	init_tabs();
 });

//Util functions

Date.prototype.toISO8601String = function (format, offset) {
    /* accepted values for the format [1-6]:
     1 Year:
       YYYY (eg 1997)
     2 Year and month:
       YYYY-MM (eg 1997-07)
     3 Complete date:
       YYYY-MM-DD (eg 1997-07-16)
     4 Complete date plus hours and minutes:
       YYYY-MM-DDThh:mmTZD (eg 1997-07-16T19:20+01:00)
     5 Complete date plus hours, minutes and seconds:
       YYYY-MM-DDThh:mm:ssTZD (eg 1997-07-16T19:20:30+01:00)
     6 Complete date plus hours, minutes, seconds and a decimal
       fraction of a second
       YYYY-MM-DDThh:mm:ss.sTZD (eg 1997-07-16T19:20:30.45+01:00)
    */
    if (!format) { var format = 6; }
    if (!offset) {
        var offset = 'Z';
        var date = this;
    } else {
        var d = offset.match(/([-+])([0-9]{2}):([0-9]{2})/);
        var offsetnum = (Number(d[2]) * 60) + Number(d[3]);
        offsetnum *= ((d[1] == '-') ? -1 : 1);
        var date = new Date(Number(Number(this) + (offsetnum * 60000)));
    }

    var zeropad = function (num) { return ((num < 10) ? '0' : '') + num; }

    var str = "";
    str += date.getUTCFullYear();
    if (format > 1) { str += "-" + zeropad(date.getUTCMonth() + 1); }
    if (format > 2) { str += "-" + zeropad(date.getUTCDate()); }
    if (format > 3) {
        str += "T" + zeropad(date.getUTCHours()) +
               ":" + zeropad(date.getUTCMinutes());
    }
    if (format > 5) {
        var secs = Number(date.getUTCSeconds() + "." +
                   ((date.getUTCMilliseconds() < 100) ? '0' : '') +
                   zeropad(date.getUTCMilliseconds()));
        str += ":" + zeropad(secs);
    } else if (format > 4) { str += ":" + zeropad(date.getUTCSeconds()); }

    if (format > 3) { str += offset; }
    return str;
}

Date.prototype.setISO8601 = function (string) {
    var regexp = "([0-9]{4})(-([0-9]{2})(-([0-9]{2})" +
        "(T([0-9]{2}):([0-9]{2})(:([0-9]{2})(\.([0-9]+))?)?" +
        "(Z|(([-+])([0-9]{2}):([0-9]{2})))?)?)?)?";
    var d = string.match(new RegExp(regexp));

    var offset = 0;
    var date = new Date(d[1], 0, 1);

    if (d[3]) { date.setMonth(d[3] - 1); }
    if (d[5]) { date.setDate(d[5]); }
    if (d[7]) { date.setHours(d[7]); }
    if (d[8]) { date.setMinutes(d[8]); }
    if (d[10]) { date.setSeconds(d[10]); }
    if (d[12]) { date.setMilliseconds(Number("0." + d[12]) * 1000); }
    if (d[14]) {
        offset = (Number(d[16]) * 60) + Number(d[17]);
        offset *= ((d[15] == '-') ? 1 : -1);
    }

    offset -= date.getTimezoneOffset();
    time = (Number(date) + (offset * 60 * 1000));
    this.setTime(Number(time));
}
