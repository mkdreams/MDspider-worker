function getCookies(tab, info, cb) {
	chrome.cookies.getAll({'url':info.url},function(cookies) {
		textToBase64(JSON.stringify(cookies),function(base64){
			cb(base64);
		});
	});
}

function createUser(tab, info, cb) {
	xhrPost(window.spiderSlaveHumanBehaviorApi,{
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
	xhrPost(window.spiderSlaveHumanBehaviorApi,{
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
	xhrPost(window.spiderSlaveHumanBehaviorApi,{
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
