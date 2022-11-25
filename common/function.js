//block to base64
function blobToBase64(blob, callback) {
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

//text to base64
function textToBase64(text, callback) {
    var blob = new Blob([text]);
    blobToBase64(blob,callback);
}

function getObjectLen(obj) {
    return Object.keys(obj).length;
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
        if(helpmateProxy === undefined) {
            xhr.open('POST', url)
            if(window.workCreateFlag !== undefined) {
                xhr.setRequestHeader('WORKCREATEFLAG',window.workCreateFlag);
            }
            xhr.setRequestHeader('SPIDERSLAVEFLAG',window.spiderSlaveFlag);
            xhr.responseType = responseType
            xhr.send(post instanceof Object?JSON.stringify(post):post)
        }else{
            xhr.open('POST', window.spiderSlaveHelpmateApi)
            proxPost = {
                id:4,
                method:"Robot.Proxy",
                params:[[url,post instanceof Object?JSON.stringify(post):post]]
            };
            if(window.workCreateFlag !== undefined) {
                xhr.setRequestHeader('WORKCREATEFLAG',window.workCreateFlag);
            }
            xhr.setRequestHeader('SPIDERSLAVEFLAG',window.spiderSlaveFlag);
            xhr.responseType = responseType
            xhr.send(JSON.stringify(proxPost))
        }


    });
}

function domCenter(dom) {
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
    window.scrollBy(scrollWidth,scrollHeight)

    return dom.getBoundingClientRect();
}

function getRandomPos(pos,baseInfo) {
    if(pos === false) {
        return false;
    }

    if(pos === 'topLeftPoint') {
        return [baseInfo['left']+10,baseInfo['top']+6];
    }

    return [
            parseInt(baseInfo['offsetLeft']+pos['left']+pos['width']/4+pos['width']/2*Math.random()),
            parseInt(baseInfo['offsetTop']+pos['top']+pos['height']/4+pos['height']/2*Math.random())
        ];
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