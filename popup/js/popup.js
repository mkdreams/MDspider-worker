layui.use(['element', 'layer', 'form'], function(){
	var element = layui.element;
	var form = layui.form;
	
	var bg = chrome.extension.getBackgroundPage();
	form.val('workerConfig', {
      "spiderSlaveFlag": bg.spiderSlaveFlag
    });
	//监听折叠
//	element.on('collapse(main)', function(data){
////		$('input[name="spiderSlaveFlag"]').val();
////		layer.msg('msg：'+ bg.spiderSlaveFlag);
//	});
});