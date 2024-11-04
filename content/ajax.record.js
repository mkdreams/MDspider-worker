var ajaxRecordString = `
    function randomStr() {
        return Number(Math.random().toString().substr(3,5) + Date.now()).toString(36);
    }
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
            var newRestultsParam = [];
            for(var contentIdx in window.ajaxRecordListRestult[url]) {
                var pass = false;
                if(contentRules.length === 0) {
                    pass = true;
                }else{
                    for(var contentRulsIdx in contentRules) {
                        if(typeof window.ajaxRecordListRestult[url][contentIdx] == "string" && window.ajaxRecordListRestult[url][contentIdx].indexOf(contentRules[contentRulsIdx]) > -1) {
                            pass = true;
                        }
                    }
                }

                if(pass === true) {
                    newRestults.push(window.ajaxRecordListRestult[url][contentIdx]);
                    newRestultsParam.push(window.ajaxRecordListRestultParam[url][contentIdx]);
                }
            }

            if(newRestults.length === 0) {
                delete window.ajaxRecordListRestult[url];
                delete window.ajaxRecordListRestultParam[url];
            }else{
                window.ajaxRecordListRestult[url] = newRestults;
                window.ajaxRecordListRestultParam[url] = newRestultsParam;
            }
        }
    };
    window.XMLHttpRequest.prototype.OrgOpen = window.XMLHttpRequest.prototype.open;
    window.XMLHttpRequest.prototype.OrgSend = window.XMLHttpRequest.prototype.send;
    window.ajaxRecordListRestult = {};
    window.ajaxRecordListRestultParam = {};
    window.ajaxRecordListRestultMap = {};
    window.XMLHttpRequest.prototype.open = function() {
        this.method = arguments[0];
		this.url = arguments[1];
        this.mdUUID = randomStr();
        if(window.requestHeaderFilter) {
            var pass = false;
            for(var filterIndex in window.requestHeaderFilter) {
                if(arguments[1].indexOf(window.requestHeaderFilter[filterIndex]) > -1) {
                    pass = true;
                }
            }

            if(pass) {
                if(arguments[1].indexOf('?') > -1) {
                    arguments[1] += '&UUID='+this.mdUUID;
                }else{
                    arguments[1] += '?UUID='+this.mdUUID;
                }
            }
        }
        this.OrgOpen(...arguments);
    };

    window.XMLHttpRequest.prototype.send = function() {
        var method = this.method;
        var url = this.url;
        var mdUUID = this.mdUUID;
        
        var requestPostData = arguments[0];
        if(requestPostData == null) {
            requestPostData = '';
        }
        
        window.ajaxRecordListRestultMap[mdUUID] = [];
        var doneFunc = function() {
            var self = this;
            var responseHeaders = self.getAllResponseHeaders().trim().split('\\\\r\\\\n');
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
                    window.ajaxRecordListRestultParam[url] = {requestHeaders:[],requestParams:[],responseHeaders:[],responseDatas:window.ajaxRecordListRestult[url]};
                }

                window.ajaxRecordListRestult[url].push(response.responseText);
                window.ajaxRecordListRestultParam[url].requestHeaders.push(window.ajaxRecordListRestultMap[mdUUID]);
                window.ajaxRecordListRestultParam[url].requestParams.push(requestPostData);
                window.ajaxRecordListRestultParam[url].responseHeaders.push(responseHeaders);

                if(window.ajaxRecordListRestult[url].length > 100) {
                    if(window.ajaxRecordDebug) {
                        console.error("lost ajax record!",url,window.ajaxRecordListRestult[url][0]);
                    }
                    window.ajaxRecordListRestult[url].slice(-100);
                    window.ajaxRecordListRestultParam[url]['requestHeaders'].slice(-100);
                    window.ajaxRecordListRestultParam[url]['requestParams'].slice(-100);
                    window.ajaxRecordListRestultParam[url]['responseHeaders'].slice(-100);
                }

                if(window.ajaxRecordDebug) {
                    console.log(response);
                }
            });
        }.bind(this);

        var reqSetTimeoutMaxRunTime = undefined;
        var reqSetTimeout = setInterval(function(){
            if(this.readyState == 4){
                clearTimeout(reqSetTimeoutMaxRunTime);
                clearTimeout(reqSetTimeout);
                doneFunc();
            }
        }.bind(this),50);

        var reqSetTimeoutMaxRunTime = setTimeout(function(){
            clearTimeout(reqSetTimeout);
        },30000);

        this.addEventListener("readystatechange", function(event) {
            if(this.readyState == 4){
                clearTimeout(reqSetTimeoutMaxRunTime);
                clearTimeout(reqSetTimeout);
                doneFunc();
            }
        }, false);

        this.OrgSend(...arguments);
    };
    window.oldFetch = fetch;
    window.fetch = (input, init) => {
        return window.oldFetch(input, init).then(response => {
            var mdUUID = randomStr();

            window.ajaxRecordListRestultMap[mdUUID] = [];
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
                            window.ajaxRecordListRestultParam[responseClone.url] = {requestHeaders:[],requestParams:[],responseHeaders:[],responseDatas:window.ajaxRecordListRestult[responseClone.url]};
                        }
                        window.ajaxRecordListRestult[responseClone.url].push(content);
                        window.ajaxRecordListRestultParam[responseClone.url].requestHeaders.push(window.ajaxRecordListRestultMap[mdUUID]);
                        window.ajaxRecordListRestultParam[responseClone.url].requestParams.push('');
                        window.ajaxRecordListRestultParam[responseClone.url].responseHeaders.push([]);
                        if(window.ajaxRecordListRestult[responseClone.url].length > 100) {
                            if(window.ajaxRecordDebug) {
                                console.error("lost ajax record!",url,window.ajaxRecordListRestult[responseClone.url][0]);
                            }
                            window.ajaxRecordListRestult[responseClone.url].slice(-100);
                            window.ajaxRecordListRestultParam[responseClone.url]['requestHeaders'].slice(-100);
                            window.ajaxRecordListRestultParam[responseClone.url]['requestParams'].slice(-100);
                            window.ajaxRecordListRestultParam[responseClone.url]['responseHeaders'].slice(-100);
                        }
                    }

                    resolve(response);
                });
            });
        });
    };


    function blobToBase64(blob, callback) {
        var reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onload = function (e) {
            callback(e.target.result);
        }
     };

     function isPromise(obj) {
        return !!obj && (typeof obj === &quot;object&quot; || typeof obj === &quot;function&quot;) && typeof obj.then === &quot;function&quot;;
     };

     var textToBase64 = function(text, callback) {
        var blob = new Blob([text]);
        blobToBase64(blob,callback);
    };

    document.addEventListener('DOMContentLoaded',function(){
        var MDdiv = document.createElement('MDtopRunjsListion');
        MDdiv.domid = '0';
        MDdiv.id = 'MDtopRunjsListion';
        document.body.appendChild(MDdiv);
        var config = { attributes: true};
        var observer = new MutationObserver(function(mutationsList, observer) {
            for(let mutation of mutationsList) {
                if (mutation.type === 'attributes') {
                    if(mutation.attributeName === 'domid') {
                        var domid = mutation.target.getAttribute('domid');
                        var element = document.getElementById(domid);
                        if (element) {
                            var funcTemp = function(){
                                try {
                                    eval(element.getAttribute('onclick'));
                                } catch (e) {
                                    setTimeout(function(){
                                        if(window.domRandomId !== domid) {
                                            console.error(e);
                                            var r = 'ERROR: \r\n'+JSON.stringify(e.stack)+'\r\n\r\nRUN JS: \r\n'+element.getAttribute('onclick');
                                            textToBase64(r,function(base64){
                                                this.innerHTML = base64;
                                                this.setAttribute('isdone',1);
                                            }.bind(this));
                                        }
                                    }.bind(this),200);
                                }
                            }.bind(element);
                            funcTemp();
                        }
                    }
                }
            }
        });
        observer.observe(MDdiv, config);

        console.log("run top js is ready!");
    });

    console.log("ajax records loaded!");
`;

pageRunJs(ajaxRecordString);


