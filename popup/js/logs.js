layui.use(['element', 'layer', 'form', 'jquery'], function () {
	var element = layui.element;
	var form = layui.form;
	var $ = layui.$;

	var bg = chrome.extension.getBackgroundPage();

	element.on('tab(logs)', function(){
		var html = '';
		if(bg.MDspiderLogs && bg.MDspiderLogs['POST DATA']) {
			bg.MDspiderLogs['POST DATA'].forEach(v => {
				html = '<div style="padding:5px;">['+v.time.toLocaleString()+'] '+v.title+'  '+v.message+'</div>'+html;
			});
		}
		$('#tab-content-0').html(html);

		var html = '';
		if(bg.MDspiderLogs && bg.MDspiderLogs['ACTIONS LOG']) {
			bg.MDspiderLogs['ACTIONS LOG'].forEach(v => {
				html = '<div style="padding:5px;">['+v.time.toLocaleString()+'] '+v.title+'  '+v.message+'</div>'+html;
			});
		}
		$('#tab-content-1').html(html);
	});
	element.tabChange('logs', 0);
});