layui.use(['element', 'layer', 'form', 'jquery'], function(){
	var element = layui.element;
	var form = layui.form;
	var $ = layui.$;
	
	var bg = chrome.extension.getBackgroundPage();
	form.val('workerConfig', {
      "spiderSlaveFlag": bg.spiderSlaveFlag
      ,"spiderSlaveApi": bg.spiderSlaveApi
      ,"spiderSlaveTabCount": bg.spiderSlaveTabCount
      ,"spiderSlaveOff": bg.spiderSlaveOff
      ,"spiderSlaveDebug": bg.spiderSlaveDebug
    });
	
	$('#worker_status').click(function() {
		if($(this).hasClass('layui-icon-pause')) {//now play
			$(this).removeClass('layui-icon-pause').addClass('layui-icon-play');
			bg.workPause();
		}else{//now pause
			$(this).removeClass('layui-icon-play').addClass('layui-icon-pause');
			bg.workPlay();
		}
	});
	
	//监听提交
	form.on('submit(workerConfig)', function(data){
		chrome.storage.local.set(data.field,function(){
			layer.msg('储存成功');
		});
		
		bg.loadConfig();
	    return false;
	});
	//监听折叠
//	element.on('collapse(main)', function(data){
////		$('input[name="spiderSlaveFlag"]').val();
////		layer.msg('msg：'+ bg.spiderSlaveFlag);
//	});
});