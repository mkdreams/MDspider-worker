var ajaxRecordString = 'var OrgOpen = window.XMLHttpRequest.prototype.open;'
    +'var OrgSend = window.XMLHttpRequest.prototype.send;'
    +'window.ajaxRecordListRestult = [];'
    +'window.XMLHttpRequest.prototype.open = function() {'+
		'var method = arguments[0];'+
		'var url = arguments[1];'+
        'this.addEventListener("readystatechange", function(event) {'+
            'if(this.readyState == 4){'+
                'var self = this;'+
                'var response = {'+
                    'method: method,'+
                    'url: url,'+
                    'responseText: self.responseText'+
                '};'+
                'if(window.ajaxRecordListRestult.length > 50) return;'+
                'if(window.ajaxRecordListRestult[url] && window.ajaxRecordListRestult[url].length > 50) return;'+
                'if(!window.ajaxRecordListRestult[url]) {'+
                    'window.ajaxRecordListRestult[url] = [];'+
                '}'+
                'window.ajaxRecordListRestult[url].push(self.responseText);'+
                'console.log(response);'+
            '}'+
        '}, false);'+
        'OrgOpen.apply(this,[].slice.call(arguments));'+
    '};'+
    'window.XMLHttpRequest.prototype.send = function() {'+
        'OrgSend.call(this,[].slice.call(arguments));'+
    '};'+
    'console.log("ajax records loaded!");';

pageRunJs(ajaxRecordString);
var tempDom = $('#MDspider-help-dom-result');
if(tempDom.length > 0) {
	tempDom[0].remove();
}


