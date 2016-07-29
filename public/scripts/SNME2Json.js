var WHITE_SPECIFIER = [' ', '\t', '\r', '\n'];
var OBJECT_SPECIFIER = ['[', ']', '{', '}'];

var SPECIFIER = WHITE_SPECIFIER.concat(OBJECT_SPECIFIER);

var isWhiteSpecifier = function(character) {
  for (i=0; i<WHITE_SPECIFIER.length; i++) {
    if (WHITE_SPECIFIER[i] === character)
      return true;
  }
  return false;
};

var isObjectSpecifier = function(character) {
  for (i=0; i<OBJECT_SPECIFIER.length; i++) {
    if (OBJECT_SPECIFIER[i] === character)
      return true;
  }
  return false;
};

var isSpecifier = function(character) {
  return isWhiteSpecifier(character) || isObjectSpecifier(character);
};

var OBJECT_SPECIFIER_PAIRS = {
  '{': '}',
  '[': ']',
};

var isObjectSpecifierPairsKey = function(character) {
  for (var key in OBJECT_SPECIFIER_PAIRS) {
    if (character === key)
      return true;
  }
  return false;
};

var isObjectSpecifierPair = function(c1, c2) {
  if (OBJECT_SPECIFIER_PAIRS[c1] == c2 || OBJECT_SPECIFIER_PAIRS[c2] == c1) {
    return true;
  }
  return false;
};

var isObjectSpecifierPairsValue = function(character) {
  for (var key in OBJECT_SPECIFIER_PAIRS) {
    if (character === OBJECT_SPECIFIER_PAIRS[key])
      return true;
  }
  return false;
};

var getObjectSpecifierPair = function (character) {
  for (var key in OBJECT_SPECIFIER_PAIRS) {
    if (character === key) {
      return OBJECT_SPECIFIER_PAIRS[key];
    } else if(OBJECT_SPECIFIER_PAIRS[key] == character) {
      return key;
    }
  }
};


var parseSpecifierPairs = function(snmeStr) {
  var i = 0;
  var specifier_stack = [];
  var topSpecifier = undefined;
  var specifier_pos_pair = {};

  for (i = 0; i<snmeStr.length; i++) {
    if (isObjectSpecifier(snmeStr[i])) {
      if ( topSpecifier === undefined) {
        if (isObjectSpecifierPairsValue(snmeStr[i])) {
          throw new Error("unexpected specifier " + snmeStr[i] + ", in pos: " + i);
        } else if (isObjectSpecifierPairsKey(snmeStr[i])) {
            specifier_stack.push({'specifier': snmeStr[i], 'beginPos': i});
            topSpecifier = specifier_stack[specifier_stack.length - 1];
        }
      } else {
        if (isObjectSpecifierPairsKey(snmeStr[i])) {
          specifier_stack.push({specifier: snmeStr[i], beginPos: i});
          topSpecifier = specifier_stack[specifier_stack.length - 1];
        } else if (isObjectSpecifierPair(topSpecifier.specifier, snmeStr[i])) {
          specifier_pos_pair[topSpecifier["beginPos"]] = i;
          specifier_stack.pop();
          if (specifier_stack.length > 0) {
            topSpecifier = specifier_stack[specifier_stack.length - 1];
          } else {
            topSpecifier = undefined;
          }
        } else {
          throw new Error("unexpected specifier " + snmeStr[i] + ", in pos: " + i);
        }
      }
    }
  }
  return specifier_pos_pair;
};

var parseSNME = function(snmeStr) {
  var SNMEType = undefined;
  var tmpSNMEType = undefined;
  var snmeObj = undefined;
  var specifierPosPairs = parseSpecifierPairs(snmeStr);

  for (var i = 0; i<snmeStr.length; i++) {
    var c = snmeStr[i];
    if (!SNMEType) {
      if (!SNMEType && !isWhiteSpecifier(c)) {
        if (!tmpSNMEType) {
          tmpSNMEType = c;
        } else {
          tmpSNMEType += c;
        }
      }
      if (isWhiteSpecifier(c) && tmpSNMEType) {
        SNMEType = tmpSNMEType;
      }
    }
    else {
      if (!isWhiteSpecifier(c) && c !== '{') {
        throw new Error("unexpected specifier " + c + ", in pos: " + i);
      } else if (c === '{') {
        snmeObj = parseObject(snmeStr, i, specifierPosPairs[i], specifierPosPairs);
        snmeObj['__type'] = SNMEType;
        i = specifierPosPairs[i];
      }
    }
  }
  return snmeObj;
};

var parseObject = function(snmeStr, beginPos, endPos, specifierPosPairs) {
  var key = undefined;
  var value = undefined;

  var tmpKey = undefined;
  var tmpValue = undefined;

  var obj = {};

  for (var i = beginPos+1; i<endPos-1; i++) {
    if (!isWhiteSpecifier(snmeStr[i])) {
      if (snmeStr[i] === '{') {
        if (key && value) {
          obj[key] = parseObject(snmeStr, i, specifierPosPairs[i], specifierPosPairs);
          obj[key]['__type'] = value;
          i = specifierPosPairs[i];
          key = value = undefined;
        } else {
          throw new Error("unexpected specifier " + snmeStr[i] + ", in pos: " + i);
        }
      } else if (snmeStr[i] === '[') {
        if (key && !value) {
          obj[key] = parseArray(snmeStr, i, specifierPosPairs[i], specifierPosPairs);
          i = specifierPosPairs[i];
          key = undefined;
        } else {
          throw new Error("unexpected specifier " + snmeStr[i] + ", in pos: " + i);
        }
      } else {
        if (!key) {
          if (!tmpKey) {
            tmpKey = snmeStr[i];
          } else {
            tmpKey += snmeStr[i];
          }
        } else if (!value){
          if (!tmpValue) {
            tmpValue = snmeStr[i];
          } else {
            tmpValue += snmeStr[i];
          }
        } else {
          obj[key] = value;
          key = value = undefined;
          i--;
        }
      }
    } else {
        if (!key && tmpKey) {
          key = tmpKey;
          tmpKey = undefined;
        } else if (!value && tmpValue) {
          value = tmpValue;
          tmpValue = undefined;
        }
    }
  }
  if (key && value) {
    obj[key] = value;
  }
  return obj;
};

var parseArray = function(snmeStr, beginPos, endPos, specifierPosPairs) {
  var array = [];

  var firstWord = undefined;
  var tmpFirstWord = undefined;

  for (var i=beginPos+1; i<endPos-1; i++) {
    var c = snmeStr[i];
    if (!isWhiteSpecifier(c)) {
      if (c === ',') {
        if (tmpFirstWord && !firstWord) {
          firstWord = tmpFirstWord;
          tmpFirstWord = undefined;
        } else if (array.length === 0) {
          throw new Error("unexpected specifier " + c + ", in pos: " + i);
        } else {
          continue;
        }
      }
      if (!firstWord) {
        if (!tmpFirstWord) {
          tmpFirstWord = c;
        } else {
          tmpFirstWord += c;
        }
      } else if (c === '{') {
        var obj = parseObject(snmeStr, i, specifierPosPairs[i], specifierPosPairs);
        obj['__type'] = firstWord;
        i = specifierPosPairs[i];
        array.push(obj);
        firstWord = undefined;
      } else if (c === ',') {
        array.push(firstWord);
        firstWord = undefined;
      } else if (c === '[') {
      } else {
        throw new Error("unexpected specifier " + c + ", in pos: " + i);
      }
    } else if (tmpFirstWord && !firstWord) {
      firstWord = tmpFirstWord;
      tmpFirstWord = undefined;
    }
  }

  return array;
};

var parseNME = function(nme) {
  var nmeArray = nme.split(",");
  var nmeObj = {};
  for (var i=0; i<nmeArray.length; i++) {
    if (nmeArray[i].trim().length === 0) {
      continue;
    }
    var keyValuePairs = nmeArray[i].split("=");
    if (keyValuePairs.length < 2) {
      console.log("----------------------nme:%s", nme);
      throw new Error("It's not a correct nme str!");
    } else {
      nmeObj[keyValuePairs[0].trim()] = keyValuePairs[1].trim();
    }
  }
  return nmeObj;
};
/*
console.log(isObjectSpecifierPairsKey('['));
console.log(isObjectSpecifierPairsValue('['));
console.log(isObjectSpecifierPairsValue(']'));

console.log(parseSpecifierPairs(snme));
console.dir(parseSNME(snme), {depth:null, colors:true});
*/

//var json = parseSNME(snme);

var json2TreeViewObj = function(name, json, option) {
  if (name && !json) {
    json = name;
    name = undefined;
  }

  var treeViewObj;
  if (name) {

    if (typeof json === 'object') {
      treeViewObj = {text: name};
      treeViewObj['nodes'] = [];

      for (var key in json) {
        if (option.skipType) {
          if (key === '__type') {
            continue;
          }
        }
        treeViewObj["nodes"].push(json2TreeViewObj(key, json[key], option));
      }
    } else {
      treeViewObj = {text: name + ": " + json};
      //treeViewObj['nodes'].push({text:json});
    }
  } else {
    treeViewObj = [];
    if (typeof json === 'object') {
      for (var key in json) {
        if (option.skipType) {
          if (key === '__type') {
            continue;
          }
        }
        treeViewObj.push(json2TreeViewObj(key, json[key], option));
      }
    } else {
      treeViewObj.push({text:json});
    }
  }

  return treeViewObj;
};

var parseMessage = function(rawMessage) {
  var trimMessage = rawMessage.trim();
  var messageHeader, tmpMessageHeader, nme, snme;

  if (trimMessage.length === 0 || trimMessage[0] !== '[' || trimMessage.indexOf(']') === -1) {
    return rawMessage;
  }
  var nmeStart = trimMessage.indexOf(']') +1;
  messageHeader = trimMessage.substr(1, nmeStart-2);
  var leftMessage = trimMessage.substr(nmeStart).trim();
  var commaArray = leftMessage.split(',');

  if (commaArray.length === 0 || commaArray[1].indexOf("=") === -1) {
    return rawMessage;
  }


  for (var i=0; i<commaArray.length; i++) {
    var validateStr = commaArray[i];
    if (validateStr.indexOf("=") !== -1 && validateStr.indexOf("{") === -1 && validateStr.indexOf("[") === -1) {
      continue;
    } else {
      break;
    }
  }
  var seperatorPos = leftMessage.indexOf(commaArray[i]);
  var newLinePos = leftMessage.indexOf('\n', seperatorPos);

  if (newLinePos !== -1) {
    seperatorPos = newLinePos;
  }

  var nmeStr = leftMessage.substr(0, seperatorPos);
  var snmeStr = leftMessage.substr(seperatorPos);

  nme = json2TreeViewObj("NME", parseNME(nmeStr), {skipType:true});
  snme = json2TreeViewObj("SNME", parseSNME(snmeStr), {skipType:true});
  if (!Array.isArray(nme)) {
    var tmpArray = [];
    tmpArray.push(nme);
    nme = tmpArray;
  }

  if (!Array.isArray(snme)) {
    var tmpArray = [];
    tmpArray.push(snme);
    snme = tmpArray;
  }

  return {
    messageHeader: messageHeader,
    nme: nme,
    snme: snme
  };
};
