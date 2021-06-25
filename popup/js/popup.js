layui.use(['element', 'layer', 'form', 'jquery'], function () {
	var element = layui.element;
	var form = layui.form;
	var $ = layui.$;

	var bg = chrome.extension.getBackgroundPage();
	form.val('workerConfig', {
		"spiderSlaveFlag": bg.spiderSlaveFlag
		, "spiderSlaveApi": bg.spiderSlaveApi
		, "spiderSlaveApiActionList": bg.spiderSlaveApiActionList
		, "spiderSlaveApiCb": bg.spiderSlaveApiCb
		, "spiderSlaveTabCount": bg.spiderSlaveTabCount
		, "spiderSlaveGetUrlsDelay": bg.spiderSlaveGetUrlsDelay
		, "spiderSlaveDelay": bg.spiderSlaveDelay
		, "spiderSlaveOn": bg.spiderSlaveOn
	});
	form.val('proxyConfig', {
		"spiderProxyOn": bg.spiderProxyOn
		, "spiderProxyChangePerReqCount": bg.spiderProxyChangePerReqCount
		, "spiderProxyFetchApi": bg.spiderProxyFetchApi
	});

	$('#worker_status').click(function () {
		if ($(this).hasClass('layui-icon-pause')) {//now play
			$(this).removeClass('layui-icon-pause').addClass('layui-icon-play');
			bg.workPause();
		} else {//now pause
			$(this).removeClass('layui-icon-play').addClass('layui-icon-pause');
			bg.workPlay();
		}
	});

	$('#spiderSlaveApiTips').click(function() {
		layer.tips(
			'1、“拉取动作URL”和“上传结果URL”的请求，都是在“主页URL”页面下进行POST传输。<br/>'+
			'2、“主页URL”、拉取动作URL和上传结果URL必须同一域名下，防止出现跨域问题。<br/>'
			, '#spiderSlaveApiTips', {
			tips: [1, '#3595CC'],
			maxWidth: 400,
			shade: [0.2, '#393D49'],
			shadeClose:true,
			time: 30000
		});
	});

	$('#spiderSlaveApiActionListTips').click(function() {
		var text = '{"code":0,"msg":"获取成功","data":[{"id":1,"url":"https://gitee.com/colin_86/MDword","type":1,"code":1}],"redirect":"","wait":3}';
		var jsonPretty = JSON.stringify(JSON.parse(text),null,4);
		layer.tips(
			'<h2 style="line-height: 35px;">响应的JOSN格式:</h2>'+
			'<pre style="background-color:white;color:black;padding:5px;">'+jsonPretty+'</pre>'
			, '#spiderSlaveApiActionListTips', {
			tips: [1, '#3595CC'],
			maxWidth: 400,
			shade: [0.2, '#393D49'],
			shadeClose:true,
			time: 30000
		});
	});

	$('#spiderSlaveApiCbTips').click(function() {
		layer.tips(
			'<h2 style="line-height: 35px;">提交的POST数据:</h2>'+
			'<pre style="background-color:white;color:black;padding:5px;">id=1&sResponse=PGhlYWQ%2BCgk8bWV0YS..HTML BASE64..BjaGFyc2V0PSJ1dGYt</pre>'
			, '#spiderSlaveApiCbTips', {
			tips: [1, '#3595CC'],
			maxWidth: 400,
			shade: [0.2, '#393D49'],
			shadeClose:true,
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
		if (data.field['spiderSlaveOn']) {
			data.field['spiderSlaveOn'] = true;
		} else {
			data.field['spiderSlaveOn'] = false;
		}

		chrome.storage.local.set(data.field, function () {
			layer.msg('储存成功');
		});

		bg.loadConfig();
		return false;
	});

	$('.test-run').click(function () {
		var type = parseInt($(this).parents(".layui-form-item").find("select").val());
		var url = $(this).parents(".layui-form-item").find("input").val();
		bg.debugRun(type,url);
		// if ($(this).hasClass('layui-icon-pause')) {//now play
		// 	$(this).removeClass('layui-icon-pause').addClass('layui-icon-play');
		// 	bg.workPause();
		// } else {//now pause
		// 	$(this).removeClass('layui-icon-play').addClass('layui-icon-pause');
		// 	bg.workPlay();
		// }
	});
});