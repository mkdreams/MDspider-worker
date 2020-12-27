chrome.runtime.onMessage.addListener(
	function (request, sender, sendResponse) {
		//api request
		if(request.admintype) {
			switch(request.admintype) {
				case 1:
				case 2:
					$.ajax({
						type: 'POST',
						url: request.url,
						data: request.data,
						success: function(data){
							if(request.admintype === 1) {
								chrome.runtime.sendMessage({'type':2,'tab':request.tab,'data':data});
							}
						},
					});
					break;
				case 3://console log from background
					console.log('background',request.obj);
					break;
				default:
					break;
			}
		}else if(request.actiontype) {
			switch(request.actiontype) {
				//get html
				case 1:
					var data = {'html':document.getElementsByTagName('html')[0].innerHTML};
					console.log('data',data);
					sendResponse(data);
					return ;
					break;
				case 2:
					if(request.info.sParameters) {
						window.location.href=request.info.sParameters.url;
					}
					break;
				default:
					break;
			}
		}
		
		sendResponse('content: got it!');
	}
);