importScripts(
  "/common.js",
  "/config.js",
  "/common/spark-md5.min.js",
  "/common/pako.min.js",
  "/common/base64.min.js",
  "/common/function.js",
  "/common/cat_wampy.js",
  "/background/extension_action.js",
  "/background/background.js",
  "/eval.js",
  "/background/run_time_api.js",
  "/background/content.js"
);

//eval.js 发生改变直接reload
var evalLastModified = undefined;
setInterval(()=>{
  const url = chrome.runtime.getURL('eval.js') + '?t=' + Date.now();
  fetch(url,{
      method: 'HEAD',
  }).then((response)=>{
    return response.headers.get('last-modified')
  }).then(async (lastmodified)=>{
    if(evalLastModified === undefined) {
      evalLastModified = lastmodified;
      return ;
    }else if(evalLastModified != lastmodified) {
      await chrome.storage.local.set({'spiderSlaveUrls':window.spiderSlaveUrls});
		  await chrome.storage.local.set({'spiderSlaveTabInfos':window.spiderSlaveTabInfos});
      chrome.runtime.reload();
    }
  });
},500);

console.log('Service Worker 启动');
