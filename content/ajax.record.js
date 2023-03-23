var ajaxRecordString = `
    window.XMLHttpRequest.prototype.OrgOpen = window.XMLHttpRequest.prototype.open;
    window.XMLHttpRequest.prototype.OrgSend = window.XMLHttpRequest.prototype.send;
    window.ajaxRecordListRestult = [];
    window.XMLHttpRequest.prototype.open = function() {
		var method = arguments[0];
		var url = arguments[1];
        this.addEventListener("readystatechange", function(event) {
            if(this.readyState == 4){
                var self = this;
                var response = {
                    method: method,
                    url: url,
                    responseText: self.responseText
                };
                if(window.ajaxRecordListRestult.length > 50 && window.ajaxRecordListRestult[url] === undefined) return;
                if(!window.ajaxRecordListRestult[url]) {
                    window.ajaxRecordListRestult[url] = [];
                }
                window.ajaxRecordListRestult[url].push(self.responseText);
                if(window.ajaxRecordListRestult[url].length > 100) {
                    window.ajaxRecordListRestult[url].slice(-100)
                }
                console.log(response);
            }
        }, false);
        this.OrgOpen(...arguments);
    };
    window.XMLHttpRequest.prototype.send = function() {
        this.OrgSend(...arguments);
    };
    window.oldFetch = fetch;
    window.fetch = (input, init) => {
        return window.oldFetch(input, init).then(response => {
            return new Promise((resolve) => {
                var responseClone = response.clone();
                responseClone.text().then(content => {
                    var responseObj = {
                        method: "fetch",
                        url: responseClone.url,
                        responseText: content
                    };
                    console.log(responseObj);
                    window.ajaxRecordListRestult[responseClone.url] = content;
                    resolve(response);
                });
            });
        });
    };
    console.log("ajax records loaded!");
`;

pageRunJs(ajaxRecordString);
var tempDom = $('#MDspider-help-dom-result');
if(tempDom.length > 0) {
	tempDom[0].remove();
}


