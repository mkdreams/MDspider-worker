layui.use(['element', 'layer', 'form', 'jquery'], function(){
	var element = layui.element;
	var form = layui.form;
	var $ = layui.$;
	
	var bg = chrome.extension.getBackgroundPage();
	form.val('workerConfig', {
      "spiderSlaveFlag": bg.spiderSlaveFlag
    });
	
	$('#worker_status').click(function() {
		if($(this).hasClass('layui-icon-pause')) {//now play
			$(this).removeClass('layui-icon-pause').addClass('layui-icon-play');
			chrome.extension.workPause();
		}else{//now pause
			$(this).removeClass('layui-icon-play').addClass('layui-icon-pause');
			chrome.extension.workPlay();
		}
	});
	
	$('#worker_refresh').click(function() {
		
	});
	//监听折叠
//	element.on('collapse(main)', function(data){
////		$('input[name="spiderSlaveFlag"]').val();
////		layer.msg('msg：'+ bg.spiderSlaveFlag);
//	});
});