function getElementSelector(element, onlyTag = false) {
  if (!(element.nodeType === 1)) return;
  var path = [];

  var node = element;
  while (node.nodeType === 1) {
    element = node;
    var selector = element.nodeName.toLowerCase();
    if (element.id && onlyTag === false) {
      selector = `#${standartName(element.id)}`;
      path.unshift(selector);
      break;
    } else {
      var selectorTag = selector;

      if (selectorTag === "meta") {
        if (element.name) {
          selector += "[name=" + standartName(element.name) + "]";
        } else if (element.attributes["property"]) {
          console.log("property", element.attributes["property"]);
          selector +=
            "[property=" +
            standartName(element.attributes["property"].value) +
            "]";
        }
      }

      var matchNodes = element.parentNode.querySelectorAll(
        ":scope > " + selector
      );

      if (matchNodes.length > 1 && onlyTag === false) {
        if (element.className && typeof element.className === "string") {
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
          nth++;
        }
        selector = selectorTag + ":nth-child(" + nth + ")";
      }
    }
    path.unshift(selector);
    node = element.parentNode;
  }
  return path.join(" > ");
}

function standartName(name) {
  var firstCharCode = name.charCodeAt(0);
  if (firstCharCode >= 48 && firstCharCode <= 57) {
    name = `\\31 ` + name.substr(1);
  }

  return name.replace(/[\[\]\:\%\+\!\(\)\.\#\|]/g, (match) => `\\${match}`);
}

function checkContentIncludeText(textContents, texts) {
  if (typeof texts === "string") {
    texts = [texts];
  }

  var allMatch = false;
  var subMatchIndex = [];
  var subMatchAttrNameScores = {};
  Object.keys(textContents).forEach((attrName) => {
    var keyOne = 0;

    var subAllMatch = true;
    var matchTextStr = "";
    var textContent = (textContentOrg = standardText(textContents[attrName]));
    var score = 0;
    texts.forEach((text) => {
      var textOrg = text;
      var include = true;
      if (isObject(textOrg)) {
        if (textOrg["type"] && textOrg["type"] === "|") {
          include = false;
        }

        if (textOrg["type"] && textOrg["type"] === "maxlength") {
          if (textContent.length > textOrg["text"]) {
            allMatch = false;
          }
          return;
        }
        text = textOrg["text"];
      }

      if (typeof text === "string") {
        text = [text];
      }

      var subMatch = false;
      var keyTwo = 0;
      for (var textIdx = 0; textIdx < text.length; textIdx++) {
        var subTextOrg = text[textIdx];
        subText = standardText(subTextOrg);
        // var idx = textContent.indexOf(subText);
        var idx = fuzzyIndexOf(textContent,subText);
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

          textContent =
            textContent.substr(0, idx) +
            textContent.substr(idx + subText.length);
          break;
        }

        keyTwo++;
      }

      if (subMatch) {
        score++;
      }

      if (include === true && subMatch === false) {
        subAllMatch = false;
      }

      keyOne++;
    });

    if (subAllMatch === true) {
      subMatchAttrNameScores[attrName] =
        (matchTextStr.replace(/\s+/g, "").length /
          textContentOrg.replace(/\s+/g, "").length) *
          0.5 +
        0.5 * score;
      allMatch = true;
    }
  });

  return [allMatch, subMatchIndex, subMatchAttrNameScores];
}

function fuzzyIndexOf(textContent, subText) {
  // 解析 subText
  var pattern = subText;
  var maxDiff = 0;

  const diffMatch = subText.match(/(.+?)~(\d+)$/);
  if (diffMatch) {
    pattern = diffMatch[1];
    maxDiff = parseInt(diffMatch[2], 10);
  }

  // 如果 pattern 为空字符串，返回 0（与 indexOf 行为一致）
  if (pattern === '') {
    return 0;
  }

  if (maxDiff === 0) {
    return textContent.indexOf(pattern);
  }

  const textLen = textContent.length;
  const patternLen = pattern.length;

  // 如果 pattern 比 text 还长，且差异数不足以覆盖长度差
  if (patternLen - maxDiff > textLen) {
    return -1;
  }

  // 使用二维数组记录编辑距离
  const dp = Array(2);
  for (var i = 0; i < 2; i++) {
    dp[i] = new Array(patternLen + 1).fill(0);
  }

  // 滑动窗口遍历所有可能的起始位置
  for (var start = 0; start <= textLen; start++) {
    // 重新初始化dp的第一行
    for (var j = 0; j <= patternLen; j++) {
      dp[0][j] = j;
    }

    // 比较从start位置开始的子串
    // 最多比较到pattern长度+最大差异数
    for (var i = 1; i <= textLen - start && i <= patternLen + maxDiff; i++) {
      dp[i % 2][0] = i;

      for (var j = 1; j <= patternLen; j++) {
        if (start + i - 1 < textLen && 
            textContent[start + i - 1] === pattern[j - 1]) {
          dp[i % 2][j] = dp[(i - 1) % 2][j - 1];
        } else {
          dp[i % 2][j] = Math.min(
            dp[(i - 1) % 2][j - 1] + 1,  // 替换
            dp[(i - 1) % 2][j] + 1,      // 删除
            dp[i % 2][j - 1] + 1         // 插入
          );
        }
      }

      // 如果已经匹配到足够长度，检查编辑距离
      if (i >= patternLen - maxDiff && i <= patternLen + maxDiff) {
        if (dp[i % 2][patternLen] <= maxDiff) {
          return start;  // 返回匹配的起始位置
        }
      }
    }
  }

  return -1;  // 没有找到匹配
}

function standardText(text) {
  return text.replace(/\s+/g, " ").toLowerCase();
}

function isArray(value) {
  return Object.prototype.toString.call(value) === "[object Array]";
}

function isObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    Object.prototype.toString.call(value) === "[object Object]"
  );
}

function getElementByText(text) {
  var allMatches = Array.from(
    window.parseHtmlDocument.querySelectorAll("*")
  ).filter((el) => {
    try {
      var checkInfo = checkContentIncludeText(getElementContent(el), text);
    } catch (error) {
      console.warn(error);
      return false;
    }
    if (checkInfo[0]) {
      el.checkInfo = checkInfo;
    }
    return checkInfo[0];
  });

  var deepestMatches = allMatches.filter((el) => {
    var hasMatchingChild = Array.from(el.querySelectorAll("*")).some(
      (child) => {
        try {
          var checkInfo = checkContentIncludeText(
            getElementContent(child),
            text
          );
        } catch (error) {
          console.warn(error);
          return false;
        }
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

function getElementContent(el, attrNames) {
  var blankAttrs = [
    // 'href',
    // 'src'
  ];
  var contents = { textContent: el.textContent };

  if (el.attributes && el.attributes.length > 0) {
    for (var i = 0; i < el.attributes.length; i++) {
      var attr = el.attributes[i];
      if (blankAttrs.indexOf(attr.nodeName) > -1) {
        continue;
      }
      if (attrNames === undefined || attrNames[attr.nodeName] !== undefined) {
        contents[attr.nodeName] = attr.textContent;
      }
    }
  }

  return contents;
}

function getElementPosition(element) {
  const rect = element.getBoundingClientRect();

  var documentWidth = Math.max(
    window.parseHtmlDocument.body.scrollWidth,
    window.parseHtmlDocument.documentElement.scrollWidth,
    window.parseHtmlDocument.body.offsetWidth,
    window.parseHtmlDocument.documentElement.offsetWidth,
    window.parseHtmlDocument.body.clientWidth,
    window.parseHtmlDocument.documentElement.clientWidth
  );

  var documentHeight = Math.max(
    window.parseHtmlDocument.body.scrollHeight,
    window.parseHtmlDocument.documentElement.scrollHeight,
    window.parseHtmlDocument.body.offsetHeight,
    window.parseHtmlDocument.documentElement.offsetHeight,
    window.parseHtmlDocument.body.clientHeight,
    window.parseHtmlDocument.documentElement.clientHeight
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

function getBetchSelectorByTexts(texts, limit, iFrameIdx) {
  if (window.parseHtmlDocument === undefined) {
    window.parseHtmlDocument = document;
  }
  if (limit === undefined) {
    limit = 15;
  }
  if (iFrameIdx === undefined) {
    iFrameIdx = 0;
  }
  var r = {};

  for (var field in texts) {
    var targetText = texts[field];
    var deepestMatches = getElementByText(targetText);
    var selectors = [];
    deepestMatches.forEach((deepestMatche) => {
      try {
        var rTemp = [
          getElementContent(deepestMatche, deepestMatche.checkInfo[2]),
          getElementSelector(deepestMatche),
          deepestMatche.checkInfo[1],
          deepestMatche.checkInfo[2],
          getElementPosition(deepestMatche),
          getElementSelector(deepestMatche, true),
          deepestMatche,
          iFrameIdx
        ];
        caclCenterOffset(rTemp);
        selectors.push(rTemp);
      } catch (error) {
        console.warn(error);
        return false;
      }
    });
    r[field] = selectorsSort(selectors);
    console.log(field, "=>", r[field]);
    r[field] = r[field].slice(0, limit);
    if(iFrameIdx === 0 && r[field].length === 0) {
      r[field] = getBetchSelectorByTextsForEachIframe(field,targetText,limit)
    }

    if (r[field].length > 0) {
      r[field][0][6].style["outline"] = "2px solid #ff9800";
    }
  }

  return r;
}

function getBetchSelectorByTextsForEachIframe(field, text, limit) {
  var r = [];
  var iframes = document.getElementsByTagName('iframe');
  Array.from(iframes).forEach((iframe, index) => {
    if(r.length > 0) {
      return ;
    }
    try {
      console.log(field+': ','try iframe' + index);
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      if (iframeDoc) {
        window.parseHtmlDocument = iframeDoc;
        var texts = {};
        texts[field] = text;
        var rTemp = getBetchSelectorByTexts(texts,limit,index+1)
        r = rTemp[field]?rTemp[field]:[];
      }
    } catch (error) {
      console.log(`Error accessing iframe document: ${error.message}`);
    }
  });
  

  return r;
}

function caclCenterOffset(a) {
  var c = a[4]["documentWidth"] / 2;
  if (!c) {
    a[4]["score"] = Math.max(...Object.values(a[3]));
    return;
  }
  var ac = (a[4]["leftTop"][0] + a[4]["rightBottom"][0]) / 2;
  var aNodeOffset = Math.abs(c - ac) / c;
  if (aNodeOffset > 1) {
    aNodeOffset = 1;
  }
  aNodeOffset = 1 - aNodeOffset;
  a[4]["score"] = Math.max(...Object.values(a[3])) * 0.7 + 0.3 * aNodeOffset;
}

function selectorsSort(selectors) {
  return selectors.sort((a, b) => {
    return b[4]["score"] - a[4]["score"];
  });
}

function DOMParserHtml(html) {
  var parser = new DOMParser();
  window.parseHtmlDocument = parser.parseFromString(html, "text/html");
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
//   //https://www.oschina.net/news/396495
//   var texts = {
//     title: "摩尔线程联合智源研究院在 S5000 千123集群上完o全流程训练~4",
//     fulltitle: "摩尔线程联合智源研究院在 S5000 千卡集群上完成全流程训练",
//   };

//   console.log(getBetchSelectorByTexts(texts));
// }, 3000);

// setTimeout(() => {
//   //https://www.sanspo.com/article/20251007-CQMNJPZTSFEP5HSAMTB5MX6NQQ/?outputType=theme_fight
//   var texts = {
//     title: "梅野源治、動画撮影スタッフの小原氏にブチ切れ「お前わかってんの？ お前なんだあれ？」"
//   };

//   console.log(getBetchSelectorByTexts(texts));
// }, 5000);


// setTimeout(() => {
//   //https://sztqb.sznews.com/PC/layout/202510/08/node_A04.html?link=content_3388741.html ifram test
//   var texts = { 
//     "title": "向外走！中国户外经济热潮涌动",
//     "publish": [{ "type": "|", "text": ["2025", "25"] }, { "type": "&", "text": ["10", "Oct", "October"] }, { "type": "&", "text": ["8", "Wed", "08", "Wednesday"] }, { "type": "maxlength", "text": 100 }],
//     "content": ["的徒步路线到海滨城市的露营营地，从山林间的亲子野趣到池塘边的休闲垂钓，户外活动从“小众爱好”走向“大众生活”，激活消费市场、催生产业新赛道。越来", "将假期献给大自然", "国庆中秋假期，徒步、露营、骑行等成为很多消费者的旅行新选择。"] 
//   };

//   console.log(getBetchSelectorByTexts(texts));
// }, 5000);