function getElementSelector(element) {
  if (!(element instanceof Element)) return;
  var path = [];

  let node = element;
  while (node instanceof Element) {
    element = node;
    let selector = element.nodeName.toLowerCase();
    if (element.id) {
      selector = `#${standartName(element.id)}`;
      path.unshift(selector);
      break;
    } else {
      var matchNodes = element.parentNode.querySelectorAll(
        ":scope > " + selector
      );
      var selectorTag = selector;
      if (matchNodes.length > 1) {
        if (element.className && typeof element.className === 'string') {
          var classes = element.className.trim().split(/\s+/);
          for (var i = 0; i < classes.length; i++) {
            if (classes[i]) {
              selector += "." + standartName(classes[i]);
            }
          }
        }

        matchNodes = element.parentNode.querySelectorAll(
          ":scope > " + selector
        );
      }

      if (matchNodes.length > 1) {
        var sib = element;
        var nth = 1;
        while ((sib = sib.previousElementSibling)) {
          if (sib.nodeName.toLowerCase() === selectorTag) nth++;
        }
        selector = selectorTag+":nth-child(" + nth + ")";
      }
    }
    path.unshift(selector);
    node = element.parentNode;
  }
  return path.join(" > ");
}

function standartName(name){
  var firstCharCode = name.charCodeAt(0);
  if(firstCharCode >= 48 && firstCharCode <= 57) {
    return `\\31 `+name.substr(1);
  }else{
    return name;
  }
}

function checkContentIncludeText(textContents, texts) {
  if(typeof texts === 'string') {
    texts = [texts];
  }
  
  var allMatch = false;
  var subMatchIndex = [];
  var subMatchAttrNameScores = {};
  Object.keys(textContents).forEach(attrName => {
    var keyOne = 0;

    var subAllMatch = true;
    var matchTextStr = '';
    var textContent = textContents[attrName].toLowerCase();
    var score = 0;
    texts.forEach(text => {
      var textOrg = text;
      var include = true;
      if(isObject(textOrg)) {
        if(textOrg['type'] && textOrg['type'] === '|') {
          include = false;
        }
  
        if(textOrg['type'] && textOrg['type'] === 'maxlength') {
          if(textContent.length > textOrg['text']) {
            allMatch = false;
          }
          return ;
        }
        text = textOrg['text'];
      }
  
      if(typeof text === 'string') {
        text = [text];
      }
  
      var subMatch = false;
      var keyTwo = 0;
      text.forEach((subTextOrg) => {
        subText = subTextOrg.toLowerCase();
        var idx = textContent.indexOf(subText);
        if (idx > -1) {
          subMatch = true;
          matchTextStr += subTextOrg;
          subMatchIndex.push({
            text: subTextOrg,
            keys: [keyOne, keyTwo],
            index: idx,
            nodeText:
              "..." +
              textContent.substr(
                idx - 20 < 0 ? 0 : idx - 20,
                subTextOrg.length + 40
              ) +
              "...",
          });
        }

        keyTwo++;
      });


      if(subMatch) {
        score++;
      }
  
      if(include === true && subMatch === false) {
        subAllMatch = false;
      }
  
      keyOne++;
    });

    if(subAllMatch === true) {
      subMatchAttrNameScores[attrName] = matchTextStr.replace(/\s+/g, "").length/textContent.replace(/\s+/g, "").length*score;
      allMatch = true;
    }
  });
  
  return [allMatch,subMatchIndex,subMatchAttrNameScores];
}

function isArray(value) {
    return Object.prototype.toString.call(value) === '[object Array]';
}

function isObject(value) {
  return value !== null && typeof value === 'object' && Object.prototype.toString.call(value) === '[object Object]';
}

function getElementByText(text) {
  var allMatches = Array.from(document.querySelectorAll("*")).filter((el) => {
    var checkInfo = checkContentIncludeText(getElementContent(el), text);
    if (checkInfo[0]) {
      el.checkInfo = checkInfo;
    }
    return checkInfo[0];
  });

  var deepestMatches = allMatches.filter((el) => {
    var hasMatchingChild = Array.from(el.querySelectorAll("*")).some(
      (child) => {
        var checkInfo = checkContentIncludeText(getElementContent(child), text);
        if (checkInfo[0]) {
          child.checkInfo = checkInfo;
        }

        return checkInfo[0];
      }
    );
    return !hasMatchingChild;
  });

  deepestMatches.forEach((el) => {
    el.style["background-color"] = "lightgreen";
  });

  return deepestMatches;
}

function getElementContent(el,attrNames) {
  var blankAttrs = [
    // 'href',
    // 'src'
  ];
  var contents = { textContent: el.textContent };

  if (el.attributes && el.attributes.length > 0) {
    for (var i = 0; i < el.attributes.length; i++) {
      var attr = el.attributes[i];
      if(blankAttrs.indexOf(attr.nodeName) > -1) {
        continue;
      }
      if(attrNames === undefined || attrNames[attr.nodeName] !== undefined) {
        contents[attr.nodeName] = attr.textContent;
      }
    }
  }

  return contents;
}

function getElementPosition(element) {
  const rect = element.getBoundingClientRect();

  var documentWidth = Math.max(
    document.body.scrollWidth,
    document.documentElement.scrollWidth,
    document.body.offsetWidth,
    document.documentElement.offsetWidth,
    document.body.clientWidth,
    document.documentElement.clientWidth
  );

  var documentHeight = Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight,
    document.body.offsetHeight,
    document.documentElement.offsetHeight,
    document.body.clientHeight,
    document.documentElement.clientHeight
  );

  var scrollX = window.scrollX;
  var scrollY = window.scrollY;

  return {
    leftTop: [parseInt(rect.left + scrollX), parseInt(rect.top + scrollY)],
    rightBottom: [
      parseInt(rect.left + scrollX + rect.width),
      parseInt(rect.top + scrollY + rect.width),
    ],
    documentWidth,
    documentHeight,
  };
}

function getBetchSelectorByTexts(texts,limit) {
  if(limit === undefined) {
    limit = 5;
  }
  var r = {};

  for(var field in texts) {
    var targetText = texts[field];
    var deepestMatches = getElementByText(targetText);
    var selectors = [];
    deepestMatches.forEach(deepestMatche => {
      var findSelector = getElementSelector(deepestMatche);
      selectors.push([getElementContent(deepestMatche,deepestMatche.checkInfo[2]),findSelector,deepestMatche.checkInfo[1],deepestMatche.checkInfo[2],getElementPosition(deepestMatche)]);
    });
    r[field] = selectorsSort(selectors);
    console.log(field,"=>",r[field]);
    r[field] = r[field].slice(0, limit);
  }

  return r;
}

function selectorsSort(selectors) {
  return selectors.sort((a, b) => Math.max(...Object.values(b[3])) - Math.max(...Object.values(a[3])));;
}

//test
/* 
setTimeout(() => {

  //选择器测试
  var selectorTemps = [
    "#main-container > div > div > div.main-list_container > div.title_all > span.folder-title-style > span.mode_icon.list_mode.list_mode_checked",
    "#group_list_box > li:nth-child(3) > ul > li.chart_5.list-operate-li > a:nth-child(1) > i",
    "#group_list_box > li:nth-child(3) > ul > li.chart_4 > a",
  ];
  selectorTemps.forEach(selectorTemp => {
    var findSelector = getElementSelector($(selectorTemp)[0]);
    if(selectorTemp === findSelector) {
      console.log("pass",selectorTemp);
    }else{
      console.warn("faild")
      console.warn(selectorTemp)
      console.warn(findSelector)
    }

  });

  //内容匹配
  var targetText = "共有 787 个关键词";
  var deepestMatches = getElementByText(targetText);
  deepestMatches.forEach(deepestMatche => {
    var findSelector = getElementSelector(deepestMatche);
    console.log(targetText,'=>',getElementPosition(deepestMatche),findSelector,deepestMatche);
  }); 
  

  //https://www.oschina.net/news/375428
  var texts = {
    title: "宇树被诉侵害发明专利权一案一审宣判：不构成侵权",
    // date: "2025-09-30 14:04:26",
    date: [
      { type: "|", text: ["2025", "25"] },
      { type: "&", text: ["09", "9"] },
      { type: "&", text: ["30"] },
      { type: "maxlength", text: 100 },
    ],
    author: "白开水不加糖",
    content: [
      "宇树科技被杭州露韦美日化有限公司诉侵害发明专利权一案，已于本月 26 日宣判，宇树科技不构成侵权。原告败诉，法院已驳回原告全部诉讼请求。",
      "法院判决书中提到，露韦美公司主张被诉产品构成侵权，理由不能成立。鉴于露韦美公司主张的侵权行为不能成立，对其他争议焦点，本院不再予以评述。",
    ],
  };

  console.log(getBetchSelectorByTexts(texts))
}, 5000);  
*/

// setTimeout(() => {
//   //https://www.oschina.net/news/375428
//   var texts = {
//     title: "宇树被诉侵害发明专利权一案一审宣判：不构成侵权",
//     // date: "2025-09-30 14:04:26",
//     date: [
//       { type: "|", text: ["2025", "25"] },
//       { type: "&", text: ["09", "9"] },
//       { type: "&", text: ["30"] },
//       { type: "maxlength", text: 100 },
//     ],
//     author: "白开水不加糖",
//     content: [
//       "宇树科技被杭州露韦美日化有限公司诉侵害发明专利权一案，已于本月 26 日宣判，宇树科技不构成侵权。原告败诉，法院已驳回原告全部诉讼请求。",
//       "法院判决书中提到，露韦美公司主张被诉产品构成侵权，理由不能成立。鉴于露韦美公司主张的侵权行为不能成立，对其他争议焦点，本院不再予以评述。",
//     ],
//   };

//   console.log(getBetchSelectorByTexts(texts));
// }, 5000);  
