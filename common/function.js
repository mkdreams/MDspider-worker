//block to base64
function blobToBase64(blob, callback) {
    if(!isBlob(blob)) {
        blob = new Blob([JSON.stringify(blob)]);
    }

    var reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onload = function (e) {
        callback(e.target.result);
    }
}

function deleteBase64Pre(base64) {
    if (base64 instanceof Array) {
        var res = [];
        base64.forEach(function(v) {
            res.push(v.replace(/data\:[\s\S]+?;base64,/,''));
        });
        return res;
    }else{
        return base64.replace(/data\:[\s\S]+?;base64,/,'');
    }
}

function base64ToString(base64) {
    if (base64 instanceof Array) {
        var res = [];
        base64.forEach(function(v) {
            res.push(Base64.decode(deleteBase64Pre(v)));
        });
        return res;
    }else{
        return Base64.decode(deleteBase64Pre(base64));
    }
}

function isBlob(val) {
    return toString.call(val) === '[object Blob]';
}

function uint8ArrayToBlob(uint8Array){
    return new Blob([uint8Array], { type: 'application/octet-binary' });
  }
  

//text to base64
function textToBase64(text, callback) {
    var blob = new Blob([text]);
    blobToBase64(blob,callback);
}

function getObjectLen(obj) {
    return Object.keys(obj).length;
}

function wsPost(post,cb,responseType,heades) {
    websocketKeep("localrpcws");

    return new Promise(function(resolve,reject) {
        if (heades == undefined) {
            heades = {};
        }
        if(window.MDspiderRandom !== undefined) {
            heades['MDSPIDERRANDOM'] = window.MDspiderRandom;
        }
        if(window.workCreateFlag !== undefined) {
            heades['WORKCREATEFLAG'] = window.workCreateFlag;
        }
        if(window.spiderSlaveActiveLastTime !== undefined) {
            heades['SPIDERSLAVEACTIVELASTTIME'] = window.spiderSlaveActiveLastTime[1];
        }
        heades['SPIDERSLAVEFLAG'] = window.spiderSlaveFlag;

        window.localrpcws.call("MDspiderRPC.xhrPost",[post,heades],{"timeout":120000}).then((details)=>{
            if(cb) {
                cb(resolve,reject,details.argsDict);
            }else{
                resolve(details.argsDict);
            }
        },(r)=>{
            console.error(r);
            resolve(false);
        });
    });
}

function wsPostForWork(post,cb,responseType) {
    return new Promise(function(resolve,reject) {
        var heades = {};
        if(window.MDspiderRandom !== undefined) {
            heades['MDSPIDERRANDOM'] = window.MDspiderRandom;
        }
        if(window.workCreateFlag !== undefined) {
            heades['WORKCREATEFLAG'] = window.workCreateFlag;
        }
        if(window.spiderSlaveActiveLastTime !== undefined) {
            heades['SPIDERSLAVEACTIVELASTTIME'] = window.spiderSlaveActiveLastTime[1];
        }
        heades['SPIDERSLAVEFLAG'] = window.spiderSlaveFlag;

        chrome.runtime.sendMessage(chrome.runtime.id,{"type":3,"post":post,"heades":heades},{"includeTlsChannelId":false},function(details) {
            if(cb) {
                cb(resolve,reject,details.argsDict);
            }else{
                resolve(details.argsDict);
            }
        });
    });
}

function timeoutPromise(time) {
    return new Promise(function(resolve,reject) {
        setTimeout(function() {
            resolve(true);
        },time)
    });
}

function xhrPost(url,post,cb,responseType,helpmateProxy) {
    if(responseType === undefined) {
        responseType = 'blob';
    }
    return new Promise(function(resolve,reject) {
        //window.workCreateFlag
        var xhr = new XMLHttpRequest()
        xhr.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                if(cb) {
                    cb(resolve,reject,this.response);
                }else{
                    resolve(this.response);
                }
            }
        }
        xhr.timeout = 120000;
        xhr.ontimeout = function () { 
            resolve(false);
        };
        if(helpmateProxy === undefined) {
            if(post === undefined) {
                xhr.open('GET', url)
            }else{
                xhr.open('POST', url)
            }
            if(window.MDspiderRandom !== undefined) {
                xhr.setRequestHeader('MDSPIDERRANDOM',window.MDspiderRandom);
            }
            if(window.workCreateFlag !== undefined) {
                xhr.setRequestHeader('WORKCREATEFLAG',window.workCreateFlag);
            }
            if(window.spiderSlaveActiveLastTime !== undefined) {
                xhr.setRequestHeader('SPIDERSLAVEACTIVELASTTIME',window.spiderSlaveActiveLastTime[1]);
            }
            xhr.setRequestHeader('SPIDERSLAVEFLAG',window.spiderSlaveFlag);
            xhr.responseType = responseType
            if(post=== undefined) {
                xhr.send()
            }else{
                if(post instanceof Object) {
                    post = JSON.stringify(post);
                }else if(post instanceof FormData) {
                    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
                }
                xhr.send(post)
            }
        }else{
            if(post instanceof Object) {
                if(window.MDspiderRandom !== undefined) {
                    post['MDSPIDERRANDOM'] = window.MDspiderRandom;
                }
                if(window.workCreateFlag !== undefined) {
                    post['WORKCREATEFLAG'] = window.workCreateFlag;
                }
                post['SPIDERSLAVEFLAG'] = window.spiderSlaveFlag;
                if(window.spiderSlaveActiveLastTime !== undefined) {
                    post['SPIDERSLAVEACTIVELASTTIME'] = window.spiderSlaveActiveLastTime[1];
                }
                var postString = JSON.stringify(post);
            }else{
                var postString = post;
            }
            proxPost = {
                id:4,
                method:"Robot.Proxy",
                params:[url,postString]
            };
            wsPost(proxPost,cb,responseType)
        }


    });
}

function domCenter(dom,behavior,container) {
    if(dom === 'topLeftPoint') {
        return 'topLeftPoint';
    }
    if(dom === undefined) {
        return false;
    }
    var width = window.innerWidth;
    var height = window.innerHeight;
    var rect = dom.getBoundingClientRect();
    var scrollWidth = rect.left-width*4/10;
    var scrollHeight = rect.top-height*4/10;
    if(container === undefined) {
        container = window;
    }
    if(behavior) {
        container.scrollBy({top: scrollHeight, left: scrollWidth, behavior: 'smooth'})
    }else{
        container.scrollBy(scrollWidth,scrollHeight)
    }

    return dom.getBoundingClientRect();
}

function getRandomPos(pos,baseInfo,offset) {
    if(pos === false) {
        return false;
    }
    
    if(pos === 'topLeftPoint') {
        return [baseInfo['left']+10,baseInfo['top']+6];
    }

    var posTemp = {left: pos['left'], top: pos['top'], width: pos['width'], height: pos['height'], };
    if(offset !== undefined) {
        if (offset['left']) posTemp['left'] += offset['left'];
        if (offset['top']) posTemp['top'] += offset['top'];
        if (offset['width']) posTemp['width'] = offset['width'];
        if (offset['height']) posTemp['height'] = offset['height'];
    }

    var offsetLeft = (baseInfo['width']-window.innerWidth)/2+baseInfo['left'];
    var offsetTop = baseInfo['top']+baseInfo['height']-window.innerHeight;

    var r = [
        parseInt(offsetLeft+posTemp['left']+posTemp['width']/4+posTemp['width']/4*Math.random()),
        parseInt(offsetTop+posTemp['top']+posTemp['height']*3/8+posTemp['height']/8*Math.random())
    ];
    console.log("post",baseInfo,posTemp,offset,r);
    
    return r;
}

var Position = {};
(function () {
    Position.getAbsolute = function (reference, target) {
        //因为我们会将目标元素的边框纳入递归公式中，这里先减去对应的值
        var result = {
            left: -target.clientLeft,
            top: -target.clientTop
        }
        var node = target;
        while(node != reference && node != document){
            if(node.style.position === 'fixed') {
                result.left = result.left + node.style.left;
                result.top = result.top + node.style.top;
                break;
            }
            
            result.left = result.left + node.offsetLeft + node.clientLeft;
            result.top = result.top + node.offsetTop + node.clientTop;
            node = node.parentNode;
        }
        if(isNaN(reference.scrollLeft)){
            result.right = document.documentElement.scrollWidth - result.left;
            result.bottom = document.documentElement.scrollHeight - result.top;
        }else {
            result.right = reference.scrollWidth - result.left;
            result.bottom = reference.scrollHeight - result.top;
        }
        return result;
    }

    Position.getViewport = function (target) {
        var scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
        var scrollLeft = window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft;
        var windowHeight = window.innerHeight || document.documentElement.offsetHeight;
        var windowWidth = window.innerWidth || document.documentElement.offsetWidth;
        var absolutePosi = this.getAbsolute(document, target);
        var Viewport = {
            left: absolutePosi.left - scrollLeft,
            top: absolutePosi.top - scrollTop,
            right: windowWidth - (absolutePosi.left - scrollLeft),
            bottom: windowHeight - (absolutePosi.top - scrollTop)
        }
        return Viewport;
    }

    Position.isViewport = function (target) {
        var position = this.getViewport(target);
        //这里需要加上元素自身的宽高，因为定位点是元素的左上角
        if(position.left + target.offsetWidth < 0 || position.top + target.offsetHeight < 0){
            return false;
        }
        if(position.bottom < 0 || position.right < 0){
            return false;
        }
        return true;
    }
})();

function randomStr() {
    return Number(Math.random().toString().substr(3,5) + Date.now()).toString(36);
}


function strtotime(sString) {
	var Time = parseInt((new Date(sString.replace(new RegExp("-", "g"), "/")).getTime())/1000);
	return Time;
}

function changeTwo(str) {  
	var temp_str = str.toString();
	if(temp_str.length == 1) {
		return '0'+temp_str;
	}else{
		return temp_str;
	}
}

function formatDate(style,now) {   
    var d = new Date(parseFloat(now));
    var   year=d.getFullYear();  
    var   month=d.getMonth()+1;     
    var   date=d.getDate();     
    var   hour=d.getHours();     
    var   minute=d.getMinutes();     
    var   second=d.getSeconds();

    style = style.replace(/Y/,year);
    style = style.replace(/m/,changeTwo(month));
    style = style.replace(/d/,changeTwo(date));

    if(hour == 0 && minute == 0 && second == 0) {
        style = style.replace(/H.*?$/,'');
    }else{
        style = style.replace(/H/,changeTwo(hour));
        style = style.replace(/i/,changeTwo(minute));
        style = style.replace(/s/,changeTwo(second));
    }

    return style;     
} 


function isPromise(obj) {
    return !!obj && (typeof obj === "object" || typeof obj === "function") && typeof obj.then === "function";
}

function getQueryString(url,name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
    var r = url.match(reg);
    if (r != null) return unescape(r[2]); return undefined;
} 


function websocketKeep(key) {
	if(window.spiderSlaveHelpmate === true && window[key] === undefined) {
		(async()=>{
			try {
                var wsInfo = window.spiderSlaveApiActionListWSS[key];
				window[key] = new Wampy(wsInfo[0], { 
                    realm: 'MDspiderRPC',
                    authid: "default",
                    authmethods: ['ticket'],
                    onChallenge: (method, info) => {
                        return 'ticket1234';
                    }
                });
				//retry
				window[key].setOptions(
					{
						maxRetries: 0,
						onClose: function () {
							console.log('ws',"Connection onClose.");
							window[key] = undefined;
							//Try to reconnect once every five seconds
							if(window[key+"ReconnectSetInterval"] !== undefined) {
								clearInterval(window[key+"ReconnectSetInterval"]);
								window[key+"ReconnectSetInterval"] = undefined;
							}
							window[key+"ReconnectSetInterval"] = setInterval(function(){
								websocketKeep(key);
							},5000);
						},
						onError: function () {
							console.log('ws',"Connection onError.");
							window[key] = undefined;
							//Try to reconnect once every five seconds
							if(window[key+"ReconnectSetInterval"] !== undefined) {
								clearInterval(window[key+"ReconnectSetInterval"]);
								window[key+"ReconnectSetInterval"] = undefined;
							}
							window[key+"ReconnectSetInterval"] = setInterval(function(){
								websocketKeep(key);
							},5000);
						},
						onReconnect: function () {
							console.log('ws Reached onReconnect');
						},
						onReconnectSuccess: function () {
							console.log('ws Reached onReconnectSuccess');
						},
					}
				);
				await window[key].connect();
				console.log('ws',"Connection open ...",wsInfo[0]);

                if (wsInfo[1]) {
                    var topic = wsInfo[1]+"."+window.spiderSlaveFlag
                    window[key].subscribe(topic,
                        async function(event) {
                            info = JSON.parse(event['argsDict']['action']);
                            var p = eval(wsInfo[2]+"(event['argsDict']['action'])");
                            p.then((data)=>{
                                textToBase64(data[1],function(base64){
                                    window[key].call("MDspiderRPC.action.callback",{"topic":topic, "user":window.workCreateFlag, "sessionId": event['argsDict']['sessionId'],"sessionIds":event['argsDict']['sessionIds'],"id": info['id'],"data": deleteBase64Pre(base64)}, {"timeout":120000}).then((details)=>{
                                    },(r)=>{
                                        console.error(r);
                                    });
                                }.bind(this));
                            });
                        }
                    )
                }

			} catch (error) {
                console.error(error);
			} 
		})();
	}
}

console.image = function (url) {
    const image = new Image();
    image.onload = function () {
        var isChromium = navigator.userAgent.match(/chrome|chromium|crios/i) && !!window.chrome;
        var style = [
            'font-size: 0px;',
            !isChromium ? `line-height: ${this.height}px;` : '',
            `padding: ${this.height / 2}px ${this.width / 2}px;`,
            `background: url(${url}) center center no-repeat;`,
            'background-size: contain;'
        ].join(' ');
        console.log('%c ', style);
    }
    image.src = url;
}
