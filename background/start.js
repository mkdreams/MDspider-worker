importScripts(
  "/common.js",
  "/config.js",
  "/background/autoreload.js",
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
listenFilesChange(['eval.js'],async ()=>{
  await chrome.storage.local.set({'spiderSlaveUrls':window.spiderSlaveUrls});
  await chrome.storage.local.set({'spiderSlaveTabInfos':window.spiderSlaveTabInfos});
  chrome.runtime.reload();
});

console.log('Service Worker 启动');
