
function DataViewItem (){

}


var obj1 = {
aaa:{aaa01:{}}
};

var registedBindKeys = [
"aaa",
"aaa.aaa01",
  // "aaa",
  "aaa.aaa02",

"aaa.aaa01.aaa10"
//   "bbb",
//   "ccc"
];

DataView.prototype.searchAndBind = function(obj, bindArr){

  console.log("searchObj", obj, bindArr);

  var k = null;
  for(var i = 0; i < bindArr.length; i++){
    k = bindArr[i];

    var kArr = k.split(".");
    var tmp = obj;

    for(var j = 0; j < kArr.length; j++){

      createSetAndGet(tmp, kArr[j]);

      // 마지막이 아니고 세팅하려는 객체가 없으면
      if(j != kArr.length-1 && !tmp[kArr[j]]){
        tmp["_" + kArr[j]] = {};
      }

      var p = tmp;
      tmp = tmp[kArr[j]];
      if(tmp && typeof(tmp) == "object"){
        tmp.__p__ = p;  // object parent
        tmp.__n__ = kArr[j];
      }
    }
  }
};

/**
 * create setter and getter
 * @param obj create target
 * @param prop setter and getter key
 */
function createSetAndGet(obj, prop){

  if(Object.getOwnPropertyDescriptor(obj, prop) &&
      Object.getOwnPropertyDescriptor(obj, prop).set
    ) {
    return;
  }

  console.log("[[[[ bind to ",obj," ]]]", prop);

  if(!obj){
    obj = {};
  }

  obj["_"+prop] = obj[prop] || null;

  obj.__c__ = obj.__c__ || [];  // binding childen keys
  if(obj.__c__.indexOf(prop) == -1 ){
    obj.__c__.push(prop);
  }

  Object.defineProperty(obj, prop, {

    set : function(d){
      console.log('set ' + prop , d);

      var childKeyArr = null;
      var parent = null;
      var bindKey = null;
      var bindChildArr = null;
      if(obj["_"+prop] && typeof(obj["_"+prop]) == "object"){
        childKeyArr = obj["_"+prop].__c__;
        parent = obj["_"+prop].__p__;
        bindKey = getBindKeyFromBindedObj(obj["_" + prop]);
        bindChildArr = findSubBindkeyArr(bindKey);
      }

      obj["_"+prop] = d;
      // TODO 이벤트 발생시키기

      // 다시 바인딩 시킬럿인지 프로퍼티만 복사할 것인지??? 생각해봐야함
      if(typeof(obj["_"+prop]) == "object" && bindChildArr && bindChildArr.length > 0){
        searchAndBind(obj["_"+prop], bindChildArr);
      }

    },
    get : function(){
      return obj["_"+prop];
    }
  });

  console.log("[[[[ bind end ",obj," ]]]", prop);

}

/**
 * 현재 object부터 상위로 key를 찾아 xxx.xxx.xxx같은 형식으로 리턴한다.
 */
function getBindKeyFromBindedObj(obj){
  var k = obj.__n__;
  while(obj.__p__){
    obj = obj.__p__;
    if(obj.__n__){
      k = obj.__n__ + "." + k;
    }
  }
  return k;
}

/**
 * 등록된 bindkey중 key 하위의 key들을 찾아 리턴한다.
 * @param key string search key
 * @return sub keys Array
 */
function findSubBindkeyArr(key){
  var arr = registedBindKeys.filter(function(str){
    return str != key && str.startsWith(key);
  });
  for(var i = 0; i < arr.length; i++){
    arr[i] = arr[i].replace(key + ".", "");
  }
  return arr;
}
