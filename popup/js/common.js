function getWindowValue(name,data) {
  return new Promise((resolve, reject) => {
		var rData = {};
		rData['type'] = 4;
		rData['name'] = name;
		if(data !== undefined) {
			rData['data'] = JSON.stringify(data);
      console.log("end JSON.stringify",data);
		}else{
			rData['data'] = JSON.stringify([]);
    }
    chrome.runtime.sendMessage(rData, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response);
      }
    });
  });
}