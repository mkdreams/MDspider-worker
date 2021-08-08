function restoreData(bg, form) {
	form.val('workerStatus', {
		"spiderSlaveOn": bg.spiderSlaveOn
	});

	form.val('workerConfig', {
		"spiderSlaveFlag": bg.spiderSlaveFlag
		, "spiderSlaveApi": bg.spiderSlaveApi
		, "spiderSlaveApiActionList": bg.spiderSlaveApiActionList
		, "spiderSlaveApiCb": bg.spiderSlaveApiCb
		, "spiderSlaveWinCount": bg.spiderSlaveWinCount
		, "spiderSlavePerWinTabCount": bg.spiderSlavePerWinTabCount
		, "spiderSlaveGetUrlsDelay": bg.spiderSlaveGetUrlsDelay
		, "spiderSlaveDelay": bg.spiderSlaveDelay
		, "spiderSlaveOn": bg.spiderSlaveOn
	});

	form.val('proxyConfig', {
		"spiderProxyOn": bg.spiderProxyOn
		, "spiderProxyChangePerReqCount": bg.spiderProxyChangePerReqCount
		, "spiderProxyFetchApi": bg.spiderProxyFetchApi
	});

	form.val('debugConfig', {
		"debugType": bg.debugType
		, "debugActions": bg.debugActions
	});
}

layui.use(['element', 'layer', 'form', 'jquery'], function () {
	var form = layui.form;
	var $ = layui.$;

	var bg = chrome.extension.getBackgroundPage();
	restoreData(bg, form);


	$('#worker_status').click(function () {
		if ($(this).hasClass('layui-icon-pause')) {//now play
			$(this).removeClass('layui-icon-pause').addClass('layui-icon-play');
			bg.workPause();
		} else {//now pause
			$(this).removeClass('layui-icon-play').addClass('layui-icon-pause');
			bg.workPlay();
		}
	});

	form.on('switch(spiderSlaveOn)', function (data) {
		chrome.storage.local.set({ 'spiderSlaveOn': data.elem.checked }, function () {
			bg.loadConfig();
			if (data.elem.checked) {
				bg.workPlay();
			} else {
				bg.workPause();
			}
		});

	});

	$('#spiderSlaveApiTips').click(function () {
		layer.tips(
			'1、“拉取动作URL”和“上传结果URL”的请求，都是在“主页URL”页面下进行POST传输。<br/>' +
			'2、“主页URL”、拉取动作URL和上传结果URL必须同一域名下，防止出现跨域问题。<br/>'
			, '#spiderSlaveApiTips', {
			tips: [1, '#3595CC'],
			maxWidth: 400,
			shade: [0.2, '#393D49'],
			shadeClose: true,
			time: 30000
		});
	});

	$('#spiderSlaveApiActionListTips').click(function () {
		var text = '{"code":0,"data":[{"id":1,"url":"https://gitee.com/colin_86/MDword","type":1,"code":1}]}';
		var jsonPretty = JSON.stringify(JSON.parse(text), null, 4);
		layer.tips(
			'<h2 style="line-height: 35px;">响应的JOSN格式:</h2>' +
			'<pre style="background-color:white;color:black;padding:5px;">' + jsonPretty + '</pre>'
			, '#spiderSlaveApiActionListTips', {
			tips: [1, '#3595CC'],
			maxWidth: 400,
			shade: [0.2, '#393D49'],
			shadeClose: true,
			time: 30000
		});
	});

	$('#spiderSlaveApiCbTips').click(function () {
		layer.tips(
			'<h2 style="line-height: 35px;">提交的POST数据:</h2>' +
			'<pre style="background-color:white;color:black;padding:5px;">id=1&sResponse=PGhlYWQ%2BCgk8bWV0YS..HTML BASE64..BjaGFyc2V0PSJ1dGYt</pre>'
			, '#spiderSlaveApiCbTips', {
			tips: [1, '#3595CC'],
			maxWidth: 400,
			shade: [0.2, '#393D49'],
			shadeClose: true,
			time: 30000
		});
	});

	//监听提交
	form.on('submit(proxyConfig)', function (data) {
		if (data.field['spiderProxyOn']) {
			data.field['spiderProxyOn'] = true;
		} else {
			data.field['spiderProxyOn'] = false;
		}

		chrome.storage.local.set(data.field, function () {
			layer.msg('储存成功');
		});

		bg.loadConfig();
		return false;
	});

	//监听提交
	form.on('submit(workerConfig)', function (data) {
		chrome.storage.local.set(data.field, function () {
			layer.msg('储存成功');
		});

		bg.loadConfig();
		return false;
	});


	var actionsTplF = {
		"code": 0,
		"data": "--data--"
	};

	var actionsTpl_default = [
		{
			"id": "debug",
			"url": "https://www.farseerbi.com/home/index/homepage.html",
			"type": 1,
			"code": 1
		}
	];

	var actionsTpl_1 = [
		{
			"id": "debug",
			"url": "https://gitee.com/colin_86/MDword",
			"type": 1,
			"code": 1
		}
	];

	var actionsTpl_100 = [
		{
			"id": "debug",
			"url": 'var more = document.evaluate(\'//div[text()="查看更多"]\', document, null, XPathResult.ANY_TYPE, null);var node = more.iterateNext();while(node) {node.click();node = more .iterateNext();}',
			"type": 100,
			"code": 1
		}
	];

	var actionsTpl_103 = [
		{
			"id": "1",
			"url": "https://www.farseerbi.com/home/member/login.html",
			"type": 1,
			"code": 1
		},
		{
			"id": "2",
			"url": "https://www.farseerbi.com/home/member/mi.html",
			"type": 103,
			"code": 1
		},
	];

	var actionsTpl_501 = [
		{
			"id": "1",
			"url": "https://www.facebook.com/?sk=favorites",
			"type": 1,
			"param": {
				'scrollMaxCount':1
				,'clientHeight':400
				,'delay':3000
				,'lockTab':1
				,sub:[
					{
						"id": "2",
						"url": "https://www.facebook.com/%E6%9D%B1%E6%96%B9%E6%97%A5%E5%A0%B1-638924839545704/",
						"type": 1,
						"code": 1
					},
					{
						"id": "3",
						"url": "https://www.facebook.com/%E6%9D%B1%E6%96%B9%E6%97%A5%E5%A0%B1-638924839545704/",
						"type": 102,
						"param": {
							'scrollMaxCount':20
							,'clientHeight':400
							,'delay':3000
						},
						"code": 1
					},
					{
						"id": "4",
						"url": "var more = document.evaluate('//div[text()=\"查看更多\"]', document, null, XPathResult.ANY_TYPE, null);var node = more.iterateNext();while(node) {node.click();node = more .iterateNext();}",
						"type": 100,
						"param": {
							'delay':1000
						},
						"code": 1
					},
				]
			},
			"code": 1
		},
		{
			"id": "5",
			"url": "https://www.facebook.com/?sk=favorites",
			"type": 1,
			"param": {
				'scrollMaxCount':3
				,'clientHeight':400
				,'delay':3000
				,sub:[
					{
						"id": "6",
						"url": "https://www.facebook.com/mingpaoinews/",
						"type": 1,
						"code": 1
					},
					{
						"id": "7",
						"url": "var more = document.evaluate('//div[text()=\"查看更多\"]', document, null, XPathResult.ANY_TYPE, null);var node = more.iterateNext();while(node) {node.click();node = more .iterateNext();}",
						"type": 100,
						"param": {
							'delay':1000
						},
						"code": 1
					},
					{
						"id": "8",
						"url": "https://www.facebook.com/%E6%9D%B1%E6%96%B9%E6%97%A5%E5%A0%B1-638924839545704/",
						"type": 1,
						"code": 1
					},
					{
						"id": "9",
						"url": "https://www.facebook.com/%E6%9D%B1%E6%96%B9%E6%97%A5%E5%A0%B1-638924839545704/",
						"type": 102,
						"param": {
							'scrollMaxCount':30
							,'clientHeight':800
							,'delay':3000
						},
						"code": 1
					},
					{
						"id": "10",
						"url": 'var more = document.evaluate(\'//div[text()="查看更多"]\', document, null, XPathResult.ANY_TYPE, null);var node = more .iterateNext();while(node) {node.click();node = more .iterateNext();}',
						"type": 100,
						"param": {
							'delay':1000
						},
						"code": 1
					}
				]
			},
			"code": 1
		},
	];
	var actionsTpl_502 = [
		{
			"id": "1",
			"url": "https://www.farseerbi.com/home/index/product.html",
			"type": 1,
			"param": {'scrollMaxCount':200},
			"code": 1
		},
	];

	var actionsTpl_503 = [
		{
			"id": "random",
			"url": "https://www.farseerbi.com/home/index/homepage.html",
			"type": 1,
			"param": {'lockTab':1},
			"code": 1
		},
		{
			"id": "random",
			"url": "https://www.farseerbi.com/home/index/product.html",
			"type": 1,
			"param": {'lockTab':1},
			"code": 1
		},
		{
			"id": "random",
			"url": "https://www.farseerbi.com/home/index/casestudy.html",
			"type": 1,
			"param": {'lockTab':1},
			"code": 1
		},
		{
			"id": "random",
			"url": "https://stackoverflow.com/",
			"type": 1,
			"param": {'lockTab':0},
			"code": 1
		},
		{
			"id": "random",
			"url": "https://stackoverflow.com/questions",
			"type": 1,
			"param": {'lockTab':0},
			"code": 1
		},
		{
			"id": "random",
			"url": "https://www.farseerbi.com/home/index/contact.html",
			"type": 1,
			"param": {'lockTab':1},
			"code": 1
		},
		{
			"id": "random",
			"url": "https://stackoverflow.com/tags",
			"type": 1,
			"param": {'lockTab':0,'lockTabFlag':'https://stackoverflow.com'},
			"code": 1
		},
		{
			"id": "random",
			"url": "https://www.farseerbi.com/home/index/downloads.html",
			"type": 1,
			"param": {'lockTab':1},
			"code": 1
		},
		{
			"id": "random",
			"url": "https://www.farseerbi.com/home/member/login.html",
			"type": 1,
			"param": {'lockTab':1},
			"code": 1
		},
	];

	form.on('select(debugType)', function(data){
		if(eval('typeof(actionsTpl_'+data.value+') != "undefined"')) {
			var actions = eval('actionsTpl_'+data.value);
		}else{
			actionsTpl_default[0]['type'] = parseInt(data.value);
			var actions = actionsTpl_default;
		}

		var actionsString = '';
		var index = 0;
		actions.forEach(v => {
			v.id = 'RANDOM'+index;
			actionsString += "        "+JSON.stringify(v);
			if(actions.length !== index+1) {
				actionsString += ",\r";
			}
			index++;
		});
		
		form.val('debugConfig',
			{
				'debugActions':JSON.stringify(actionsTplF,null,4).replace('"--data--"',["[\r"+actionsString+"\r    ]"])
			}
		);
	});

	// $("select[name=debugType]").siblings("div.layui-form-select").find('dl dd[lay-value=1]').click();
	form.on('submit(debugConfig)', function (data) {
		chrome.storage.local.set(data.field, function () {
			layer.msg('正在执行');
			bg.loadConfig();

			console.log(data.field['debugActions']);
			bg.debugRun(JSON.parse(data.field['debugActions']));
		});
		return false;
	});

	form.on('submit(debugConfigReset)', function (data) {
		chrome.storage.local.set(data.field, function () {
			layer.msg('已重置');
			bg.loadConfig();

			bg.debugRunReset(JSON.parse(data.field['debugActions']));
		});
		return false;
	});
});