window.notify_tips = false;
window.spiderSlaveOn = true;
window.spiderSlaveFlag = 'slave3';
window.spiderSlaveApiActionList = "ws://127.0.0.1:8080/getLinksCache";
window.spiderSlaveApiCb = "http://127.0.0.1:8080/recordLinkCacheIsDone";

var spiderSlaveApiInfo = window.spiderSlaveApiActionList.match(/^(http|https|ws)\:\/\/[^\/$]+?(?=[\/|$])/g);
window.spiderSlaveApi = spiderSlaveApiInfo[0];

window.spiderSlaveGetUrlsDelay = 5000;
window.spiderSlaveWinCount = 1;
window.spiderSlavePerWinTabCount = 5;
window.spiderSlaveLockTabTimeout = 180000;

window.spiderProxyOn = false;
window.spiderProxyChangePerReqCount = 5;
window.spiderProxyFetchApi = "http.tiqu.alibabaapi.com/getip3?num=2&type=2&pack=62956&port=1&lb=1&pb=4&gm=4&regions=";

window.spiderSlaveHumanBehavior = true;
window.spiderSlaveHumanBehaviorApi = 'http://127.0.0.1:1234/rpc';

window.spiderSlaveHealthCheck = true;

window.baseInfo = {};
initDeviceInfo(function(){
	//init and create api tab
	if(window.spiderSlaveOn === true) {
		setTimeout(function() {
			workPlay();
		},2000);
	}
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
				window.spiderSlaveTabInfos['wins'][win.id] = win;
				window.spiderSlaveTabInfos['wins'][win.id]['useTabs'] = {};

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
				window.baseInfo['perHeight'] = parseInt(window.baseInfo['height']/window.baseInfo['yCount'])-150;
				window.baseInfo['perWidth'] = parseInt(window.baseInfo['width']/window.baseInfo['xCount']);
				

				chrome.tabs.query({windowId:win.id},function(tabs) {
					autoCreateTab(window['userDataPath']?'chrome://extensions/':'chrome://version/',function() {
						if(window['spiderSlaveHealthCheck'] && !window['userDataPath']) {
							xhrPost(window.spiderSlaveHumanBehaviorApi,{
								id:4,
								method:"Robot.Copy",
								params:[[window.workCreateFlag]]
							},undefined,'json').then(function(data) {
								var match = data.result.Msg.match(new RegExp("User Data\\\\([ \\w]+)"))
								if(match && match[1]) {
									window['userDataPath'] = match[1];
									chrome.storage.local.set({'userDataPath':window['userDataPath']});
									pingUser()
								}
								cb & cb();
							},'json');
						}else{
							cb & cb();
						}
						
						tabs.forEach(tab => {
							chrome.tabs.remove(tab.id,function() {
							});
						});
					},true);
					
				})
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
			if(window.workCreateFlagDefault && window.workCreateFlagDefault !== '--workCreateFlagDefault--') {
				window['workCreateFlag'] = window.workCreateFlagDefault;
			}else{
				window['workCreateFlag'] = Number(Math.random().toString().substr(3,5) + Date.now()).toString(36);
			}
			chrome.storage.local.set({'workCreateFlag':window['workCreateFlag']});
		}
		
		cb && cb();
	});
}