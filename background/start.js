importScripts(
  "/common.js",
  "/config.js",
  "/common/spark-md5.min.js",
  "/eval.js",
  "/common/pako.min.js",
  "/common/base64.min.js",
  "/common/function.js",
  "/common/cat_wampy.js",
  "/background/extension_action.js",
  "/background/background.js",
  "/background/run_time_api.js",
  "/background/content.js"
);

// setTimeout(()=>{
//   chrome.runtime.reload();
// },10000);

console.log('Service Worker 启动');