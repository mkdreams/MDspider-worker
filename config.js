window.spiderSlaveOn = true;
window.spiderSlaveFlag = 'worker1';
window.spiderSlaveApiActionList = "http://cwoods.online/blog/tool/requestdetails.html";
window.spiderSlaveApiCb = "http://cwoods.online/blog/tool/requestdetails.html";

var spiderSlaveApiInfo = window.spiderSlaveApiActionList.match(/^(http|https)\:\/\/[^\/$]+?(?=[\/|$])/g);
window.spiderSlaveApi = spiderSlaveApiInfo[0];

window.spiderSlaveGetUrlsDelay = 5000;
window.spiderSlaveWinCount = 2;
window.spiderSlavePerWinTabCount = 3;
window.spiderSlaveLockTabTimeout = 180000;

window.spiderProxyOn = false;
window.spiderProxyChangePerReqCount = 5;
window.spiderProxyFetchApi = "http.tiqu.alibabaapi.com/getip3?num=2&type=2&pack=62956&port=1&lb=1&pb=4&gm=4&regions=";

window.spiderSlaveHumanBehavior = true;
window.spiderSlaveHumanBehaviorApi = 'http://127.0.0.1:8686';

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
	autoCreateTab(window.spiderSlaveApi,function(tab) {
		window.spiderSlaveTabInfos['api'] = tab;
		if(window.spiderSlaveOn === true) {
			setTimeout(function() {
				workPlay();
			},2000);
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
				
				window.spiderSlaveWinCount = parseInt(window.spiderSlaveWinCount);
				window.baseInfo['xCount'] = Math.ceil(Math.sqrt(window.spiderSlaveWinCount+1));
				if(window.baseInfo['xCount'] < 3) {
					window.baseInfo['xCount'] = window.spiderSlaveWinCount+1;
					window.baseInfo['yCount'] = 1;
				}else{
					window.baseInfo['yCount'] = Math.ceil((window.spiderSlaveWinCount+1)/window.baseInfo['xCount']);
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

		if(!window['workCreateFlag']) {
			window['workCreateFlag'] = Number(Math.random().toString().substr(3,5) + Date.now()).toString(36);
			chrome.storage.local.set({'workCreateFlag':window['workCreateFlag']});
		}
		
		cb && cb();
	});
}