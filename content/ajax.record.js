var ajaxRecordString = `
    function waitDomAddChildByText(dom,pattern,maxWaitTime) {
        var p = new Promise(function(resolve,reject) {
            var setTimeoutObj = undefined;

            var callback = function(mutationsList, observer) {
                for(let mutation of mutationsList) {
                    if(mutation['addedNodes'].length > 0) {
                        for(var addNodeIdx in mutation['addedNodes']) {
                            if(pattern.test(mutation['addedNodes'][addNodeIdx].textContent)) {
                                if(setTimeoutObj !== undefined) {
                                    clearTimeout(setTimeoutObj);
                                    setTimeoutObj = undefined;
                                }
                                console.log('MutationObserver matched',pattern);
                                observer.disconnect();
                                resolve(1);
                                return;
                            }
                        }
                    }
                }
            };

            console.log('MutationObserver start');

            var observer = new MutationObserver(callback);
            observer.observe(dom, { childList: true, subtree: true });

            if(maxWaitTime && maxWaitTime > 0) {
                setTimeoutObj = setTimeout(function() {
                    console.log('MutationObserver timeout',maxWaitTime);
                    observer.disconnect();
                    resolve(0);
                },maxWaitTime);
            }
        });

        return p;
    }
    
    window.ajaxRecordFilter = [[],[]];
    window.setAjaxRecordFilterRule = function(urlRules,contentRules) {
        window.ajaxRecordFilter = [urlRules,contentRules];
        for(var url in window.ajaxRecordListRestult) {
            var pass = false;
            if(urlRules.length === 0) {
                pass = true;
            }else{
                for(var urlRuleIdx in urlRules) {
                    if(url.indexOf(urlRules[urlRuleIdx]) > -1) {
                        pass = true;
                    }
                }
            }

            if(pass === false) {
                delete window.ajaxRecordListRestult[url];
                continue;
            }

            var newRestults = [];
            for(var contentIdx in window.ajaxRecordListRestult[url]) {
                var pass = false;
                if(contentRules.length === 0) {
                    pass = true;
                }else{
                    for(var contentRulsIdx in contentRules) {
                        if(window.ajaxRecordListRestult[url][contentIdx].indexOf(contentRules[contentRulsIdx]) > -1) {
                            pass = true;
                        }
                    }
                }

                if(pass === true) {
                    newRestults.push(window.ajaxRecordListRestult[url][contentIdx]);
                }
            }

            if(newRestults.length === 0) {
                delete window.ajaxRecordListRestult[url];
            }else{
                window.ajaxRecordListRestult[url] = newRestults;
            }
        }
    };
    window.XMLHttpRequest.prototype.OrgOpen = window.XMLHttpRequest.prototype.open;
    window.XMLHttpRequest.prototype.OrgSend = window.XMLHttpRequest.prototype.send;
    window.ajaxRecordListRestult = [];
    window.XMLHttpRequest.prototype.open = function() {
		var method = arguments[0];
		var url = arguments[1];
        this.addEventListener("readystatechange", function(event) {
            if(this.readyState == 4){
                var self = this;

                if((self.responseType == '' || self.responseType == 'text')) {
                    var p = new Promise(function(resolve,reject) {
                        resolve(self.responseText);
                    });
                }else if(self.responseType == 'blob') {
                    var p = new Promise(function(resolve,reject) {
                        var utf8decoder = new TextDecoder();
                        var fr = new FileReader();
                        fr.readAsArrayBuffer(self.response);
                        fr.onload = function() {
                            var buffer = fr.result;
                            var text = utf8decoder.decode(buffer);
                            resolve(text);
                        }
                    });
                }else{
                    var p = new Promise(function(resolve,reject) {
                        resolve('');
                    });
                }
                
                p.then(function(responseText){
                    var response = {
                        method: method,
                        url: url,
                        responseText: responseText
                    };
    
                    var urlRules = window.ajaxRecordFilter[0];
                    var contentRules = window.ajaxRecordFilter[1];
    
                    var pass = false;
                    if(urlRules.length === 0) {
                        pass = true;
                    }else{
                        for(var urlRuleIdx in urlRules) {
                            if(url.indexOf(urlRules[urlRuleIdx]) > -1) {
                                pass = true;
                            }
                        }
                    }
        
                    var passContent = false;
                    if(contentRules.length === 0) {
                        passContent = true;
                    }else{
                        for(var contentRulsIdx in contentRules) {
                            if(response.responseText.indexOf(contentRules[contentRulsIdx]) > -1) {
                                passContent = true;
                            }
                        }
                    }
    
                    if(pass === false || passContent === false) {
                        if(window.ajaxRecordDebug) {
                            console.error("not match ajax record!",url,response.responseText);
                        }
                        return;
                    }
    
                    if(window.ajaxRecordListRestult.length > 50 && window.ajaxRecordListRestult[url] === undefined) {
                        if(window.ajaxRecordDebug) {
                            console.error("lost ajax record!!",url,response.responseText);
                        }
                        return;
                    }
                    if(!window.ajaxRecordListRestult[url]) {
                        window.ajaxRecordListRestult[url] = [];
                    }
                    window.ajaxRecordListRestult[url].push(response.responseText);
                    if(window.ajaxRecordListRestult[url].length > 100) {
                        if(window.ajaxRecordDebug) {
                            console.error("lost ajax record!",url,window.ajaxRecordListRestult[url][0]);
                        }
                        window.ajaxRecordListRestult[url].slice(-100)
                    }
    
                    if(window.ajaxRecordDebug) {
                        console.log(response);
                    }
                });
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
                    if(window.ajaxRecordDebug) {
                        console.log(responseObj);
                    }

                    var urlRules = window.ajaxRecordFilter[0];
                    var contentRules = window.ajaxRecordFilter[1];

                    var pass = false;
                    if(urlRules.length === 0) {
                        pass = true;
                    }else{
                        for(var urlRuleIdx in urlRules) {
                            if(responseClone.url.indexOf(urlRules[urlRuleIdx]) > -1) {
                                pass = true;
                            }
                        }
                    }
        
                    var passContent = false;
                    if(contentRules.length === 0) {
                        passContent = true;
                    }else{
                        for(var contentRulsIdx in contentRules) {
                            if(content.indexOf(contentRules[contentRulsIdx]) > -1) {
                                passContent = true;
                            }
                        }
                    }

                    if(pass === false || passContent === false) {
                        if(window.ajaxRecordDebug) {
                            console.error("not match ajax record!",responseClone.url,content);
                        }
                    }else{
                        if(!window.ajaxRecordListRestult[responseClone.url]) {
                            window.ajaxRecordListRestult[responseClone.url] = [];
                        }
                        window.ajaxRecordListRestult[responseClone.url].push(content);
                        if(window.ajaxRecordListRestult[responseClone.url].length > 100) {
                            if(window.ajaxRecordDebug) {
                                console.error("lost ajax record!",url,window.ajaxRecordListRestult[responseClone.url][0]);
                            }
                            window.ajaxRecordListRestult[responseClone.url].slice(-100)
                        }
                    }

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


