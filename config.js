window.spiderSlaveFlag = 'worker1';
window.spiderSlaveApi = "http://test.blog.com/";
window.spiderSlaveApiActionList = "http://test.blog.com/data/getLinksCache";
window.spiderSlaveApiCb = "http://test.blog.com/data/recordLinkCacheIsDone";
window.spiderSlaveDelay = 2000;
window.spiderSlaveGetUrlsDelay = 5000;
window.spiderSlaveTabCount = 2;
window.spiderSlaveOn = true;
window.spiderProxyOn = false;
window.spiderProxyChangePerReqCount = 5;
window.spiderProxyFetchApi = "http.tiqu.alibabaapi.com/getip3?num=2&type=2&pack=62956&port=1&lb=1&pb=4&gm=4&regions=";

//var config = {
//  mode: "pac_script",
//  pacScript: {
////	  data: "function FindProxyForURL(url, host) {\n" +
////			  "  alert(url);\n" +
////	          "  if (host == 'www.baidu.com')\n" +
////	          "    return 'PROXY 127.0.0.1:1080';\n" +
////	          "  return 'DIRECT';\n" +
////	          "}"
//	  url:"http://127.0.0.1/think5.1-layui-blog/pac.php"
//	  ,mandatory: true
//  }
//};


window.baseInfo = {};
initDeviceInfo(function(){
	//init and create api tab
	createTab(window.spiderSlaveApi,function(tab) {
		window.spiderSlaveTabInfos['api'] = tab;
		if(window.spiderSlaveOn === true) {
			workPlay();
		}
	},true);
});

function initDeviceInfo(cb) {
	loadConfig(function() {
		if(window.spiderProxyOn) {
			enabledProxy();
		}else {
			disabledProxy();
		}
		
		chrome.system.display.getInfo(function(info) {
			chrome.windows.getCurrent(function(win) {
				window.baseInfo['windowId'] = win.id;
				window.baseInfo['height'] = info[0].bounds.height;
				window.baseInfo['width'] = info[0].bounds.width;
				
				window.spiderSlaveTabCount = parseInt(window.spiderSlaveTabCount);
				window.baseInfo['xCount'] = Math.ceil(Math.sqrt(window.spiderSlaveTabCount+1));
				if(window.baseInfo['xCount'] < 3) {
					window.baseInfo['xCount'] = window.spiderSlaveTabCount+1;
					window.baseInfo['yCount'] = 1;
				}else{
					window.baseInfo['yCount'] = Math.ceil((window.spiderSlaveTabCount+1)/window.baseInfo['xCount']);
				}
				window.baseInfo['perHeight'] = parseInt(window.baseInfo['height']/window.baseInfo['yCount']);
				window.baseInfo['perWidth'] = parseInt(window.baseInfo['width']/window.baseInfo['xCount']);
				
				if(window.spiderSlaveOn === false) {
					cb && cb();
					return ;
				}

				chrome.windows.update(window.baseInfo['windowId'],{state:'normal',top:0,left:0,height:window.baseInfo['perHeight'],width:window.baseInfo['perWidth']},function(newWin) {
					cb && cb();
				});
			});
		});
	});
}

function loadConfig(cb) {
	chrome.storage.local.get(null, function(result) {
		for(var key in result) {
			window[key] = result[key];
		}
		
		cb && cb();
	});
}