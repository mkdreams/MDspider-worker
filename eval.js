async function myEval(jsStr,args,obj_this) {
  var funcName = "_"+SparkMD5.hash(jsStr);
  // var funcName = 'demoTemp';

  if(Eval[funcName] === undefined) {
    
    if(window.spiderSlaveHelpmate !== true) {
      console.warn("spiderSlaveHelpmate不为true，执行失败",jsStr);
      return ;
    }

    console.log("myEval creatFunc",funcName);

    await wsPost({
			id:4,
			method:"Robot.BuildFuncByJs",
			params:[window.spiderSlaveFlag,funcName,jsStr]
		},undefined,'json');
    
    await chrome.storage.local.set({'spiderSlaveUrls':window.spiderSlaveUrls});
    await chrome.storage.local.set({'spiderSlaveTabInfos':window.spiderSlaveTabInfos});
    chrome.runtime.reload();
    return;
  }else{
    Eval[funcName].bind(obj_this);
    return Eval[funcName](args);
  }
}
var Eval = {};

//temp functions
Eval.demoTemp = function(args) {
  return ((console.log('data',args.data,args.response)) || true) && args.response.indexOf('html') > 0;
}

Eval._82ea83497bf40ccc5b338769e9f36f0c = function(args){return ((console.log('data',args.data,args.response)) || true) && args.response.indexOf('html') > 0};

Eval._77d5f8c84a024df58be77a0afefbb198 = function(args){return ((console.log('data',args.data)) || true) && args.response.indexOf('html') > 0};

Eval._2f05c946c8b906f400b9e47c19d89c3a = function(args){return console.log("timeOutCb");};

Eval._4d02ddb1767883b6982af449bde3904c = function(args){return args.response.indexOf('html') > 0};
