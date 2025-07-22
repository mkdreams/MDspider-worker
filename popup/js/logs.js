layui.use(['element', 'layer', 'form', 'jquery'], function () {
	var element = layui.element;
	var form = layui.form;
	var $ = layui.$;

	element.on('tab(logs)', async function(){
		var html = '';
		if(await getWindowValue('MDspiderLogs') != null && await getWindowValue('MDspiderLogs',['POST DATA'])) {
			await getWindowValue('MDspiderLogs',['POST DATA']).forEach(v => {
				html = '<div style="padding:5px;">['+v.time.toLocaleString()+'] '+v.title+'  '+v.message+'</div>'+html;
			});
		}
		$('#tab-content-0').html(html);

		var html = '';
		if(await getWindowValue('MDspiderLogs') != null && await getWindowValue('MDspiderLogs',['ACTIONS LOG'])) {
			await getWindowValue('MDspiderLogs',['ACTIONS LOG']).forEach(v => {
				html = '<div style="padding:5px;">['+v.time.toLocaleString()+'] '+v.title+'  '+v.message+'</div>'+html;
			});
		}
		$('#tab-content-1').html(html);
	});
	element.tabChange('logs', 0);
});