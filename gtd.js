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

var events = [];

function init_todo() {
    $("#div-todo > p").each(function() {
	    var text = $(this).text();
	    var eventsymbol = /^\[(.)\]/.exec(text);
	    //Mark as todo item
	    if (eventsymbol) {
		if (eventsymbol.index != -1) {
		    $(this).addClass("event");
		}
		//kind of event
		var eventStatus;
		if (eventsymbol[1] == " ") {
		    eventStatus = "notstarted"
		} else if (eventsymbol[1] == "+") {
		    eventStatus = "completed";
		} else if (eventsymbol[1] == '-') {
		    eventStatus = "aborted";
		} else if (eventsymbol[1] == '>') {
		    eventStatus = "inprocess";
		} else if (eventsymbol[1] == '<') {
		    eventStatus = "halted";
		} else if (eventsymbol[1] == '!') {
		    eventStatus = "needsaction";
		} else if (eventsymbol[1] == '?') {
		    eventStatus = "unknown"
		} 
		if (eventStatus) {
		    $(this).addClass(eventStatus);
		}

		//Find dates
		var date = /([0-9]{4,4}-[0-9]{2,2}-[0-9]{2,2})/.exec(text);
		if (date && date.index != -1) {
		    var datestring = date[1];
		    var dateObj = new Date();
		    dateObj.setISO8601(datestring);

		    var event = new Object();
		    event.startDate = dateObj;
		    event.description = text;
		    event.status = eventStatus;
		    event.symbol = eventsymbol[1];
		    events.push(event);
		}
	    }
       	});
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
	div.id = "div-" + header.id;
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


//TODO: do something with resize event for the timeline

var timeline;
var timeline_data;
var timeline_data_old = {  // save as a global variable
    'dateTimeFormat': 'iso8601',
    'wikiURL': "http://simile.mit.edu/shelf/",
    'wikiSection': "Simile Cubism Timeline",   
    'events' : [
{'start': '2007',
 'title': 'Barfusserkirche',
 'description': 'by Lyonel Feininger, American/German Painter, 1871-1956'
}
		]
}

function init_timeline_data() {
    timeline_data = new Object();
    timeline_data['dateTimeFormat'] = 'iso8601';
    timeline_data['events'] = new Array();
    for (var i = 0; i < events.length; i++) {
	var event = events[i];
	var e = new Object();
	e['start'] = event.startDate.toISO8601String(3);
	e['title'] = event.eventStatus;
	e['description'] = event.description;
	timeline_data['events'].push(e);
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
    var timelineElement = $('body').prepend('<div id="timeline" style="height: 150px; border: 1px solid #aaa" ><noscript></noscript></div>');
    timeline = Timeline.create(document.getElementById('timeline'), bandInfos, Timeline.HORIZONTAL);
    
    var url = '.'; // The base url for image, icon and background image references in the data
    eventSource.loadJSON(timeline_data, url); // The data was stored into the timeline_data variable.
    timeline.layout(); // display the Timeline    
}

$(document).ready(function(){
	init_structure();
	init_todo();
	init_timeline_data();
	init_timeline();
 });
