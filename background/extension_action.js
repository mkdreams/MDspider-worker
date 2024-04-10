// get cookies
function getCookies(tab, info, cb) {
	chrome.cookies.getAll({'url':info.url},function(cookies) {
		textToBase64(JSON.stringify(cookies),function(base64){
			cb(base64);
		});
	});
}

//delete cookies
function clearCookies(tab, info, cb) {
	chrome.cookies.getAll({'url':info.url},function(cookies) {
		cookies.forEach(function(cookie) {
			chrome.cookies.remove({
				'url':info.url,
				'name':cookie.name
			});
		});
		cb();
	});
}

// set cookies
function setCookies(tab, info, cb) {
	if (!info.param.cookies){
		textToBase64("info.param.cookies is empty: " + JSON.stringify(info.param),function(base64){
			cb(base64);
		});
	}
	let cookies = JSON.parse(info.param.cookies)
	cookies.forEach(function(cookie) {
		chrome.cookies.set({
			'name': cookie.name??'',
			'value': cookie.value??'',
			'expirationDate': cookie.expirationDate??'',
			'path': cookie.path??'/',
			'secure': cookie.secure??false,
			'httpOnly': cookie.httpOnly??false,
			
			'domain': cookie.domain??'',
			'sameSite': cookie.sameSite??'',
			'storeId': cookie.storeId??'0',
			'url': cookie.url??'',
		});
	})
}

function screenshot(tab, info, cb) {
	chrome.windows.update(tab.windowId, { focused: true }, function () {
		chrome.tabs.update(tab.id, { active: true }, function () {
			if (chrome.runtime.lastError) {
				console.error(chrome.runtime.lastError);
			}
			chrome.tabs.captureVisibleTab(null, {
				format: 'png'
			}, function (data) {
				cb(data);
			});
		})
	})
}

function updateConfig(tab, info, cb) {
	configs = eval("("+info.url+")");
	for(var configName in configs) {
		window[configName] = configs[configName];
	}

	textToBase64("true",function(base64){
		cb(base64);
	});
}

function pingUser(tab, info, cb) {
	chrome.windows.getCurrent(function(win) {
		xhrPost(window.spiderSlaveHelpmateApi,{
			id:4,
			method:"Robot.PingBrowserUser",
			params:[[window.workCreateFlag,window.userDataPath,win.width,win.height,win.left,win.top]]
		},undefined,'json').then(function(data) {
			if(cb) {
				textToBase64(JSON.stringify(data),function(base64){
					cb(base64);
				});
			}
		},'json');
	})
}

function ReplaceNowUser(tab, info, cb) {
	xhrPost(window.spiderSlaveHelpmateApi,{
		id:4,
		method:"Robot.ReplaceNowUser",
		params:[[window.workCreateFlag,window.userDataPath,window.spiderSlaveApiCb+'?isDelete=1&sFlag='+window.spiderSlaveFlag+'&workCreateFlag='+window.workCreateFlag+'&info='+encodeURIComponent(JSON.stringify(info))]]
	},undefined,'json').then(function(data) {
		if(cb) {
			textToBase64(JSON.stringify(data),function(base64){
				cb(base64);
			});
		}
	},'json');
}

function PauseNowUser(tab, info, cb) {
	xhrPost(window.spiderSlaveHelpmateApi,{
		id:4,
		method:"Robot.PauseNowUser",
		params:[[window.workCreateFlag,window.userDataPath,window.spiderSlaveApiCb+'?isDelete=1&sFlag='+window.spiderSlaveFlag+'&workCreateFlag='+window.workCreateFlag+'&info='+encodeURIComponent(JSON.stringify(info)),info['pauseMs']]]
	},undefined,'json').then(function(data) {
		if(cb) {
			textToBase64(JSON.stringify(data),function(base64){
				cb(base64);
			});
		}
	},'json');
}

function moveKeepLiveUser(tab, info, cb) {
	xhrPost(window.spiderSlaveHelpmateApi,{
		id:4,
		method:"Robot.MoveKeepLiveBrowserUser",
		params:[[window.workCreateFlag,window.userDataPath,window.spiderSlaveApiCb+'?isDelete=1&sFlag='+window.spiderSlaveFlag+'&workCreateFlag='+window.workCreateFlag+'&info='+encodeURIComponent(JSON.stringify(info))]]
	},undefined,'json').then(function(data) {
		if(cb) {
			textToBase64(JSON.stringify(data),function(base64){
				cb(base64);
			});
		}
	},'json');
}

function createUser(tab, info, cb) {
	xhrPost(window.spiderSlaveHelpmateApi,{
		id:4,
		method:"Robot.CreatBrowserUser",
		params:[[randomStr()]]
	},undefined,'json').then(function(data) {
		if(info.param && info.param.saveas) {
			info[info.param.saveas] = data;
		}
		
		if(cb) {
			textToBase64(JSON.stringify(data),function(base64){
				cb(base64);
			});
		}
	},'json');
}

function deleteUser(tab, info, cb) {
	xhrPost(window.spiderSlaveHelpmateApi,{
		id:4,
		method:"Robot.DeleteBrowserUser",
		params:[[info.url]]
	},undefined,'json').then(function(data) {
		if(cb) {
			textToBase64(JSON.stringify(data),function(base64){
				cb(base64);
			});
		}
	});
}

function closeAllWind(tab, info) {
	xhrPost(window.spiderSlaveHelpmateApi,{
		id:4,
		method:"Robot.CloseBrowserUser",
		params:[[info.url]]
	},undefined,'json').then(function(data) {
		if(cb) {
			textToBase64('true',function(base64){
				cb(base64);
			});
		}
	});
}
