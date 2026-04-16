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

/**
 * 优化后的模糊匹配函数
 * 使用 Pigeonhole Principle (鸽巢原理) 结合 Levenshtein 距离
 * 大幅减少不必要的 DP 计算，特别是在处理长文本时
 */
// 全局缓存用于加速模糊匹配
var _fuzzyCache = {
  subText: null,
  pattern: null,
  k: 0,
  uniqueChars: null,
  patternCounts: null,
  dpBuffer: new Int32Array(4096)
};

/**
 * 高性能模糊匹配函数
 * 针对大误差 (k > 50) 和长文本进行了深度优化
 */
function fuzzyIndexOf(textContent, subText) {
  // 1. 检查并更新模式缓存
  if (_fuzzyCache.subText !== subText) {
    var pattern = subText;
    var k = 0;
    var diffMatch = subText.match(/(.+?)~(\d+)$/);
    if (diffMatch) {
      pattern = diffMatch[1];
      k = parseInt(diffMatch[2], 10);
    }

    var uniqueChars = new Map();
    var charId = 0;
    for (var i = 0; i < pattern.length; i++) {
      var c = pattern[i];
      if (!uniqueChars.has(c)) uniqueChars.set(c, charId++);
    }

    var patternCounts = new Int32Array(charId);
    for (var i = 0; i < pattern.length; i++) {
      patternCounts[uniqueChars.get(pattern[i])]++;
    }

    _fuzzyCache.subText = subText;
    _fuzzyCache.pattern = pattern;
    _fuzzyCache.k = k;
    _fuzzyCache.uniqueChars = uniqueChars;
    _fuzzyCache.patternCounts = patternCounts;

    if (_fuzzyCache.dpBuffer.length < pattern.length + k + 1) {
      _fuzzyCache.dpBuffer = new Int32Array(pattern.length + k + 1024);
    }
  }

  var pattern = _fuzzyCache.pattern;
  var k = _fuzzyCache.k;
  var n = textContent.length;
  var m = pattern.length;

  // 基础边界过滤
  if (pattern === "") return 0;
  if (k === 0) return textContent.indexOf(pattern);
  if (m - k > n) return -1;

  var numParts = k + 1;
  var partLen = Math.floor(m / numParts);

  // 场景 A: 误差较小，使用 Pigeonhole 原理结合 indexOf 快速定位
  if (partLen >= 2) {
    var checkedStarts = new Set();
    for (var i = 0; i < numParts; i++) {
      var startIdx = i * partLen;
      var endIdx = i === numParts - 1 ? m : (i + 1) * partLen;
      var part = pattern.substring(startIdx, endIdx);

      var pos = -1;
      while ((pos = textContent.indexOf(part, pos + 1)) !== -1) {
        var cStartMin = Math.max(0, pos - startIdx - k);
        var cStartMax = Math.min(n - (m - k), pos - startIdx + k);

        for (var s = cStartMin; s <= cStartMax; s++) {
          if (checkedStarts.has(s)) continue;
          checkedStarts.add(s);
          if (verifyMatchBanded(textContent, pattern, s, k, _fuzzyCache.dpBuffer))
            return s;
        }
      }
    }
    return -1;
  }

  // 场景 B: 误差极大 (k 很大)，Pigeonhole 失效，使用 Bag Filter (Counting Filter) 滑动窗口
  // 这种方法只需 $O(n)$ 时间即可过滤掉 90% 以上的不可能匹配的位置
  var uniqueChars = _fuzzyCache.uniqueChars;
  var patternCounts = _fuzzyCache.patternCounts;
  var charId = patternCounts.length;
  var windowCounts = new Int32Array(charId);
  var currentBagDist = m; // 初始差异为模式长度

  // 初始化第一个窗口 (大小为 m)
  var initialLen = Math.min(m, n);
  for (var i = 0; i < initialLen; i++) {
    var id = uniqueChars.get(textContent[i]);
    if (id !== undefined) {
      var oldDiff = Math.abs(patternCounts[id] - windowCounts[id]);
      windowCounts[id]++;
      currentBagDist += Math.abs(patternCounts[id] - windowCounts[id]) - oldDiff;
    } else {
      currentBagDist++;
    }
  }

  // 检查初始位置
  if (currentBagDist <= 2 * k && verifyMatchBanded(textContent, pattern, 0, k, _fuzzyCache.dpBuffer))
    return 0;

  // 滑动窗口
  for (var s = 1; s <= n - (m - k); s++) {
    // 移除左侧字符
    var cOut = textContent[s - 1];
    var idOut = uniqueChars.get(cOut);
    if (idOut !== undefined) {
      var oldDiff = Math.abs(patternCounts[idOut] - windowCounts[idOut]);
      windowCounts[idOut]--;
      currentBagDist += Math.abs(patternCounts[idOut] - windowCounts[idOut]) - oldDiff;
    } else {
      currentBagDist--;
    }

    // 移入右侧字符 (维持窗口大小约为 m)
    if (s + m - 1 < n) {
      var cIn = textContent[s + m - 1];
      var idIn = uniqueChars.get(cIn);
      if (idIn !== undefined) {
        var oldDiff = Math.abs(patternCounts[idIn] - windowCounts[idIn]);
        windowCounts[idIn]++;
        currentBagDist += Math.abs(patternCounts[idIn] - windowCounts[idIn]) - oldDiff;
      } else {
        currentBagDist++;
      }
    }

    // 只有当字符组成足够接近时，才执行昂贵的 Levenshtein 验证
    if (currentBagDist <= 2 * k) {
      if (verifyMatchBanded(textContent, pattern, s, k, _fuzzyCache.dpBuffer))
        return s;
    }
  }

  return -1;
}

/**
 * 验证在特定位置是否存在模糊匹配
 * 使用空间优化的 Levenshtein 算法 + 早期剪枝
 */
function verifyMatchBanded(text, pattern, start, k, dp) {
  var m = pattern.length;
  var n = text.length;
  // 匹配长度范围在 [m-k, m+k]
  var maxI = Math.min(m + k, n - start);

  // 初始化第一行
  for (var j = 0; j <= m; j++) dp[j] = j;

  for (var i = 1; i <= maxI; i++) {
    var prev = dp[0];
    dp[0] = i;
    var charCode = text.charCodeAt(start + i - 1);
    var minInRow = i;

    for (var j = 1; j <= m; j++) {
      var temp = dp[j];
      var cost = charCode === pattern.charCodeAt(j - 1) ? 0 : 1;
      var val = Math.min(
        prev + cost,   // 替换
        temp + 1,      // 删除
        dp[j - 1] + 1  // 插入
      );
      dp[j] = val;
      prev = temp;
      if (val < minInRow) minInRow = val;
    }

    // 找到满足误差的匹配结束位置
    if (i >= m - k && dp[m] <= k) return true;

    // 早期剪枝：如果当前行最小值已经超过 k，且长度已超过模式，不可能匹配
    if (minInRow > k && i >= m) return false;
  }

  return dp[m] <= k;
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