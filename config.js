window.spiderSlaveFlag = 'worker1';
window.spiderSlaveApi = "http://test.blog.com/";
window.spiderSlaveDelay = 5000;
window.spiderSlaveGetUrlsDelay = 5000;
window.spiderSlaveTabCount = 2;
window.spiderSlaveOff = false;
window.spiderSlaveDebug = false;

window.baseInfo = {};
initDeviceInfo(function(){
	//init and create api tab
	createTab(window.spiderSlaveApi,function(tab) {
		window.spiderSlaveTabInfos['api'] = tab;
		if(window.spiderSlaveOff == false) {
			workPlay();
		}
	},true);
	
	if(window.spiderSlaveDebug) {
		createTab('chrome://extensions/',function(tab) {});
		createTab('chrome://extensions/',function(tab) {});
		createTab('chrome://extensions/',function(tab) {});
		createTab('chrome://extensions/',function(tab) {});
		createTab('https://developer.chrome.com/docs/extensions/reference/windows/',function(tab) {});
	}
});

function initDeviceInfo(cb) {
	loadConfig(function() {
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