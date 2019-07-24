/**
 * data-view (#date#)
 * create by g2
 *
 * ISC License
 *
 * Copyright (c) 2018, data-view (http://dataview.tistory.com)
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

var ATTR_DATA_VIEW = "data-view";
var ATTR_DATA_LIST = "data-list";
var ATTR_NO_DATA_VIEW = "no-data-view";


/**
 * constructor DataView
 * @param params.attr - data-view tag attribute name default "data-view"
 * @param params.listAttr - data-list tag attribute name default "data-list"
 * @param params.noDataAttr - no-data-view tag attribute name default "no-data-view"
 * @param params.createGlobalItems - dataview item들을 전역변수로 생성할 것인지 default true
 * @param params.referenceData - dataview의 item.data가 change할 때 제공된 데이터를 참조할지
 */
function DataView(params){

	// dataViewItem array
	this.items = [];
	// 초기화 중 인지 아닌지
	this._initializing = false;
	// dataview 적용/변경 중인지
	this._changing = false;
	// 초기화가 완료되었는지
	this.initialized = false;
	// dataview item들을 전역변수로 생성할 것인지
	this.createGlobalItems = true;
	// change한 데이터를 dataview data로 참조할 것인지
	this.referenceData = false;
	// custom tag urls
	this.customTagUrls = [];

	this.config(params);
}


/**
 * configuration dataview
 * @param params.attr - data-view tag attribute name default "data-view"
 * @param params.listAttr - data-list tag attribute name default "data-list"
 * @param params.noDataAttr - no-data-view tag attribute name default "no-data-view"
 * @param params.createGlobalItems - dataview item들을 전역변수로 생성할 것인지 default true
 * @param params.referenceData - dataview의 item.data가 change할 때 제공된 데이터를 참조할지
 */
DataView.prototype.config = function(params){
	if(!params) return this;

	// tag attribute 이름 변경
	if(params.attr) ATTR_DATA_VIEW = params.attr;
	if(params.listAttr) ATTR_DATA_LIST = params.listAttr;
	if(params.noDataAttr) ATTR_NO_DATA_VIEW = params.noDataAttr;

	// dataview item들을 전역변수로 생성할 것인지
	this.createGlobalItems = (params.hasOwnProperty("createGlobalItems") ? params.createGlobalItems : true);
	this.referenceData = (params.hasOwnProperty("referenceData") ? params.referenceData : false);

	return this;
};


/**
 * initialize
 * html에서 data-view 추출하고 저장, data-view를 숨김
 * @param element - dataview를 검색할 element 혹은 css selector
 */
DataView.prototype.initDataView = function(element){
	this._initializing = true;

	// 기존 항목 모두 삭제
	for(var i = this.items.length - 1; i >= 0; i--){
		if(this.items[i].scope == element){
			this.items.pop();
		}
	}

	var targetList = this.findDataViewList(element);
	var newArr = this.addDataViewList(targetList, element);
	for(var i = 0; i < newArr.length; i++){
		if(newArr[i].type == ATTR_DATA_VIEW){
			this.change(newArr[i].id, {});	//blank
		}else{
			this.change(newArr[i].id, []);	//clear
		}
	}

	this._initializing = false;
	this.initialized = true;

};


/**
 * url로 html을 가져와 custom tag에 입히고, dataview를 등록한다.
 * @param arr ex) [ {tagName:"customTagName", url:"html url", data: init data object} ]
 */
DataView.prototype.initCustomTags = function(arr){
	this.customTagUrls = arr;
	if(this.customTagUrls.length > 0){
		var item = null;
		for(var i = 0; i < this.customTagUrls.length; i++){
			item = this.customTagUrls[i];
			this.addDataViewByUrl(item.url, item.tagName, item.data);
		}
	}
};

/**
 * data-view 혹은 data-list를 찾는다.
 * @param html - 검색할 html 혹은 element 혹은 css selector
 * @return 찾은 리스트
 */
DataView.prototype.findDataViewList = function(html){
	if(!html){
		html = document;
	}
	var targetList = el("["+ATTR_DATA_VIEW+"], ["+ATTR_DATA_LIST+"]", html);
	return targetList;
};


/**
 * 추출된 dataview를 처리
 * @param targetList - 추출된 dataview의 목록
 * @param scope - dataview의 범위
 * @return Array - 새로 추가된 DataViewItem list
 */
DataView.prototype.addDataViewList = function(targetList, scope){
	if(!targetList) return;

	var dvId,dvType,dvItem = null;
	var newArr = [];

	for(var i = 0; i < targetList.length; i++){
		dvId = this.getDataViewId(targetList[i]);
		dvType = targetList[i].getAttribute(ATTR_DATA_VIEW) ? ATTR_DATA_VIEW : ATTR_DATA_LIST;

		if(!dvId) {
			console.error("[dataview] Not found data-view attribute value or tag id");
			continue;
		}

		var selector = null;
		if(targetList[i].getAttribute(ATTR_DATA_VIEW)){
			selector = "["+ATTR_DATA_VIEW+"="+dvId+"]";
		}else if(targetList[i].getAttribute(ATTR_DATA_LIST)){
			selector = "["+ATTR_DATA_LIST+"="+dvId+"]";
		}else if(targetList[i].getAttribute("id")){
			selector = "#"+dvId;
		}

		var noDvElement = el("["+ATTR_NO_DATA_VIEW+"="+dvId+"]");
		var noDvElementHTML = noDvElement[0] ? noDvElement[0].outerHTML : "";

		dvItem = new DataViewItem({
			id : dvId,
			type : dvType,
			selector : selector,
			template : targetList[i].outerHTML,
			elements : targetList[i],
			parent : targetList[i].parentNode,
			noDataView : noDvElement,
			noDataViewHTML : noDvElementHTML,
			scope : scope,
			isBind : false
		});

		dvItem.normalVarKeys = this.getNormalVarKeysOnly(dvItem.template);

		for(var j = 0; j < this.items.length; j++){
			if(this.items[j].id == dvItem.id){
				this.items[j] = dvItem;
			}
		}
		newArr.push(dvItem);

		if(!this[dvId]){
			this[dvId] = dvItem;
		}

		if(this.createGlobalItems){

			// 같은 이름의 기존 변수가 존재한면..
			if(window[dvId] && window[dvId].constructor != DataViewItem){

				console.warn("DataViewItem name \'"+dvId+"\' is already defined variable or tag id attribute.");

				/*var v = window[dvId];
				if(typeof(v) === 'object' && !Array.isArray(v)){
					for(var k in dvItem){
						if(!v[k]){
							v[k] = dvItem[k];
						}
					}
				}*/
			} else {
				eval(dvId + "=dvItem;");
			}

			this[dvId] = dvItem;
		}
	}
	if(newArr.length > 0){
		// 추가 중복 방지
		for(var i = 0; i < newArr.length; i++){
			if(this.items.indexOf(newArr[i]) == -1){
				this.items.push(newArr[i]);
			}
		}
		// this.items = this.items.concat(newArr);
	}
	return newArr;
};


/**
 * html에서 attribute가 data-view거나 data-view가 있는 경우 id를 리턴한다.
 * @param el - dataview element
 * @return string - dataview 실별 id
 */
DataView.prototype.getDataViewId = function(el){
	return (el.getAttribute(ATTR_DATA_VIEW) ||
			el.getAttribute(ATTR_DATA_LIST) ||
			el.getAttribute("id"));
};


/**
 * dataViewId로 저장되있는 dataview item을 리턴
 * @param dataViewId - dataview의 식별자
 * @return object - dataview object item
 */
DataView.prototype.getDataViewItem = function(dataViewId){
	if(!dataViewId){
		console.error("[dataview] dataViewId is required parameter getDataViewItem function : " +dataViewId);
		return;
	}
	var item = null;
	for(var i = 0; i < this.items.length; i++){
		if(this.items[i].id == dataViewId){
			item = this.items[i];
			item.elements = this.getDataViewElements(item);
			item.parent = item.elements[0].parentNode;

		var noDvElement = el("["+ATTR_NO_DATA_VIEW+"="+item.id+"]");
		var noDvElementHTML = noDvElement[0] ? noDvElement[0].outerHTML : "";
			item.noDataView = noDvElement;
			item.noDataViewHTML = noDvElementHTML;

			break;
		}
	}
	if(!item){
		console.error("[dataview] not found dataview item : " +dataViewId);
		return;
	}
	return item;
};


/**
 * dataViewId로 저장되있는 dataview item을 리턴
 * @param dataViewId - dataview id
 * @return object - dataview object item
 */
DataView.prototype.get = function(dataViewId){
	return this.getDataViewItem(dataViewId);
};


/**
 * dataview css selector를 리턴한다.
 * @param dataViewId - dataview의 id
 * @return data view 의 css selector
 */
DataView.prototype.getDataViewSelector = function(dataViewId){
	return this.getDataViewItem(dataViewId).selector;
};


/**
 * dataview의 화면 내 실제 elements를 리턴한다.
 * @param item - dataview item
 * @return NodeList - 화면에 적용되어있는 실제 dataview element
 */
DataView.prototype.getDataViewElements = function(item){
	var e = el(item.selector, item.parent);
	if(!e || e.length == 0) {
		e = el(item.selector);
		if(e || e.length > 0) {
			item.parent = e.parentNode;
		}
	}
	return e;
};


/**
 * dataViewId로 dataViewItem을 찾고, data를 적용한 dataview html을 리턴한다.
 * @param dataViewId - dataview 식별자
 * @param data - data
 * @return string - data로 생성된 html
 */
DataView.prototype.getDataViewHtml = function(dataViewId, data){
	var item = this.getDataViewItem(dataViewId);
	if(!item) return "";
	var html = item.template;
	return this.mergeHtmlData(html, data);
};


/**
 * dataViewId로 dataViewItem을 찾고, data를 적용한 dataview html을 리턴한다.
 * @param dataViewId - dataview 식별자
 * @param list - array data
 * @return string - data로 생성된 list html
 */
DataView.prototype.getDataViewListHtml = function(dataViewId, list){
	var item = this.getDataViewItem(dataViewId);
	if(!item || !list) return "";
	var origin = item.template;
	var html = "";
	for(var i = 0 ; i < list.length; i++){
		html += this.mergeHtmlData(origin, list[i]);
	}
	return html;
};


/**
 * html에 data를 섞는다.
 * @param html - dataview template html
 * @param data - data
 * @return string - data merged html
 */
DataView.prototype.mergeHtmlData = function (html, data){
	if(!data || !html) return "";

	var synList = this.getSyntaxList(html) || [];
	var tmp = "";
	for(var i = 0; i < synList.length; i++){
		tmp = this.mergeData(synList[i], data);
		html = html.replace(synList[i], tmp);
	}

	html = this.mergeIfStateHtmlData(html, data);

	return html;
};


/**
 * html에 data를 섞는다.
 * @param html - dataview template html
 * @param data - data
 * @return string - data merged html
 */
DataView.prototype.mergeData = function (tmp, data){
	var o = tmp;

	// escape문자 변경
	tmp = escapeToNormalChar(tmp);
	// 전역변수 변경
	tmp = this.mergeGlobal(tmp);
	// 일반변수 변경
	tmp = this.mergeNormalVar(tmp, data);

	try{
		tmp = eval(tmp);
	}catch(e){
//		o = escapeToNormalChar(o);
//		console.error("syntax error " + o + " \n-> " + tmp);
		tmp = "";
	}
	if(tmp == null || tmp == undefined || tmp == "null" || tmp == "undefined"){
		tmp = "";
	}
	return tmp;
};


/**
 * dataview {{ xxx }} 구문 찾기
 * @param html - 찾아볼 html
 * @return array - {{ xxx }} 구문 목록
 */
DataView.prototype.getSyntaxList = function(html){
	var rg = /\{\{[^\{\{\}\}]*\}\}/g;
	return html.match(rg);
};


/**
 * template html에서 normal var로 등록된 key들을 리턴한다.
 * @param html dataview template html
 */
DataView.prototype.getNormalVarKey = function(html){
	// 리터럴,숫자 제거
	var tmp = html;
	// 문자열 제거
	tmp = tmp.replace(/\'[^\']*\'/g, "");
	tmp = tmp.replace(/\"[^\"]*\"/g, "");
	// 숫자, 소수제거
	tmp = tmp.replace(/^\w\d*\.?\d*/g, "");
	tmp = tmp.replace(/^-\w\d*\.?\d*/g, "");
	// 함수형식 제거
	tmp = tmp.replace(/\w+(\.\w+)* *\(/g, "");
	// 예약어 제거
	tmp = tmp.replace(/null/g, "");
	tmp = tmp.replace(/true/g, "");
	tmp = tmp.replace(/false/g, "");
	tmp = tmp.replace(/undefined/g, "");

	// object 검색 형식
	// \w+(\.*\w*)* -> item.obj.key
	var rg = /[A-z]\w*(\.\w+)*/g;

	var match = tmp.match(rg);
	return match;
};


/**
 * template html에서 오직 일반 변수의 key만을 중복없이 리턴한다.
 * 글로벌 var 제외
 * @param html dataview template html
 */
DataView.prototype.getNormalVarKeysOnly = function(html){
	var tmp = (this.getSyntaxList(html) || []).join();
	tmp = tmp.replace(/@[A-z]\w*(\.\w+)*/g, "");
	var match = this.getNormalVarKey(tmp);
	if(!match || match.length == 0){
		return [];
	}
	var noOverlap = [];
	for(var i = 0; i < match.length; i++){
		if(noOverlap.indexOf(match[i]) == -1){
			noOverlap.push(match[i]);
		}
	}
	return noOverlap;
};


/**
 * 일반 변수를 html에 적용 {{변수}} 형식
 * @param html - dataview template html
 * @param data - 적용할 data
 * @return string - data가 적용된 html
 */
DataView.prototype.mergeNormalVar = function(html,data){

	var match = this.getNormalVarKey(html);
	if(match == null) return html;
	for(var i = 0; i < match.length; i++){
		var value = this.getDataOfKey(data,match[i]);
		if(isNaN(value) && typeof value == "string"){
			value = "'"+value+"'";
		}
		html = html.replace(match[i], value);
	}

	return html;
};


/**
 * 전역변수를 html에 적용 {{@변수}} 형식
 * @param html - dataview template html
 * @param data - 적용할 data
 * @return string - data가 적용된 html
 */
DataView.prototype.mergeGlobal = function(html){
	// {{@변수이름 }} 형식 (리터럴x)
	var rg = /@[A-z]\w*(\.\w+)*/g;
	var match = html.match(rg);
	if(match == null) return html;
	for(var i = 0; i < match.length; i++){
		var gVar = match[i];
		var value = eval(gVar.substr(1));
		if(value && typeof value == "string" && value != "null" && value != "undefined"){
			value = "'"+value+"'";
		}
		html = html.replace(new RegExp(gVar,"g"), value);
	}
	return html;
};


/**
 * if문 형식의 dataview 적용
 * @param html - dataview template html
 * @param data - 적용할 data
 * @return string - data가 적용된 html
 */
DataView.prototype.mergeIfStateHtmlData = function(html, data){
	var rg = /\{\s*(\s*\(.+\)\s*\{\s*([^\}]*\s*)*\}\s*)+(.*\{\s*([^\}]*\s*)*\}\s*)*\}/g;
	while(rg.test(html)){
		var match = html.match(rg);
		var tmp = match[0];
		var srcArr = tmp.match(/\{\s*[^\{\}]+\s*\}/g);

		var logicRg = /\{\s*\([^\(\)]*\)\s*\{|\}\s*\([^\(\)]*\)\s*\{/g;
		var logicMatch = tmp.match(logicRg);

		var result = "";

		// if문 중에서 true 인것을 골라 소스를 찾는다.
		for(var i = 0; i < logicMatch.length; i++){

			var logic = logicMatch[i].replace(/\{|\}/g, "");
			var t = this.mergeData(logic, data);
			if(t){
				result = srcArr[i];
				break;
			}
		}
		// 없다면 마지막 else...
		if(!result && srcArr.length > logicMatch.length){
			result = srcArr[srcArr.length-1];
		}
		if(result){
			result = result.substring(1, result.length-2);
		}

		html = html.replace(tmp, result);
	}
	return html;
};


/**
 * data object 내에 key로 값을 찾는다.
 * key 자체가 key가 아니라 리터럴값이나 경우 해당 값을 리턴한다.
 * @param data - data
 * @param key - 데이터를 찾을 key index
 * @return * - key값에 대한 data의 value 혹은 리터럴 값
 */
DataView.prototype.getDataOfKey = function(data, key){
	var result = this.getLiteral(key);

	if(result == null || result == undefined){
		key = key.replace(/ /g, "");
		// key가 객체인 경우 (xxx.yyy.key 형식)
		if(key.split(".").length >= 2){
			var kArr = key.split(".");
			var tmp = data;
			try{
				for(var j = 0; j < kArr.length; j++){
					tmp = tmp[kArr[j]];
				}
			}catch(e){
				tmp = "";
			}
			result = tmp;
		}else{
			result = data[key];
		}
	}
	return result;
};


/**
 * 리터럴값이면 리터럴을 리턴하고 아니면 null을 리턴하다.
 * @param key - 검사할 string
 * @return string - key가 리터럴인 경우 리터럴값을 리턴하고, 아닌 경우 null을 리턴한다
 */
DataView.prototype.getLiteral = function(key){
	if(!key) return key;
	var litTest1 = / *\'.*\' */;
	var litTest2 = / *\".*\" */;
	var result = "";

	if(litTest1.test(key) ){
		result = key.substring(key.indexOf("'")+1, key.lastIndexOf("'"));
	}else if(litTest2.test(key)){
		result = key.substring(key.indexOf('"')+1, key.lastIndexOf('"'));
	}else{
		if(!isNaN(key) || key == true || key == false){	//숫자인 경우
			result = key;
		}else{
			return null;
		}
	}
	return result;
};


/**
 * string에서 리터럴이 아닌 key의 배열을 리턴한다.
 * @param txt - 검사할 string
 * @return array - 리터럴이 아닌 key의 배열을 리턴한다.
 */
DataView.prototype.getNotLiteralArr = function(txt){
	var tmp = txt.replace(/\'[^\']*\'/g, ' ').replace(/\"[^\"]*\"/g, ' ');
	var arr = tmp.match(/\w+(\.\w+)*/g) || [];

	for(var i = arr.length; i >= 0; i--){
		if(!isNaN(arr[i]) || arr[i] == "true" || arr[i] == "false"){	//숫자면 제외
			arr.splice(i,1);
		}else if(["amp","lt","gt","typeof","instanceof"].indexOf(arr[i]) != -1){
			// 예약어 제거
			arr.splice(i,1);
		}
	}

	return arr;
};


/**
 * dataview item에 data가 없는 경우 no-data-view로 지정된 엘리먼트를 보여준다.
 * @param item - dataview item
 */
DataView.prototype.showNoDataView = function(item){
	var noDvElement = el("["+ATTR_NO_DATA_VIEW+"="+item.id+"]");

	if(!noDvElement || noDvElement.length == 0)
		return;

	noDvElement = noDvElement[0];

	// 데이터 없는 경우 no-data-view 출력
	if(!item.data || item.data.length == 0){

		if(noDvElement.outerHTML){
			noDvElement.style.display = "block";
		}else{
			if(item.noDataViewHTML){
				if(item.parent && item.parent.length > 0){
					item.parent.appendChilde(this._createElements(item.noDataViewHTML));
				}
			}
		}

	} else {
		if(noDvElement) noDvElement.style.display = "none";
	}
};


/**
 * data로 data-view로 지정된 엘리먼트를 변경한다.
 * @param dataViewId - dataview 식별자
 * @param data - object or array
 */
DataView.prototype.change = function(dataViewId, data){
	//if(!data) return;
	var item = this.getDataViewItem(dataViewId);
	var ele = item.elements;
	var html = "";

	if(!item.isBind){

		if(!this.referenceData){
			data = clone(data);
		}

		if(item.type == ATTR_DATA_LIST){
			if(data){
				item.data = Array.isArray(data) ? data : [data];
			}else{
				if(this.referenceData){
					for(var i = item.data.length - 1; i >= 0; i--){
						item.data.pop();
					}
				}else{
					item.data = data;
				}
			}
			html = this.getDataViewListHtml(dataViewId, data);
		}else{
			item.data = data;
			html = this.getDataViewHtml(dataViewId, data);
		}
	}

	this._changing = true;

	// element가 둘 이상인 경우 html을 변경할 마지막 하나만 남기고 모두 지움
	if(ele.length > 1){
		for(var i = ele.length-1; i > 0; i--){
			ele[i].outerHTML = "";
		}
	}

	// !! parent로 찾으면 parent를 변경되는 ui 프레임워크에 의해 못찾을 수 있음
	if(html && html != ""){
		ele[0].outerHTML = html;
	}else{
		item.hide();
		ele[0].innerHTML = "";
	}


	item.elements = this.getDataViewElements(item);
	this.showNoDataView(item);
	this._changing = false;
};


/**
 * data로 data-view로 지정된 엘리먼트를 변경한다.
 * @param dataViewId - dataview 식별자
 * @param data - object or array
 */
DataView.prototype.refresh = function(dataViewId, refreshData){
	//if(!data) return;
	var item = this.getDataViewItem(dataViewId);
	var ele = item.elements;
	var html = "";

	if(item.type == ATTR_DATA_LIST){
		html = this.getDataViewListHtml(dataViewId, item.data);
	}else{
		html = this.getDataViewHtml(dataViewId, item.data);
	}

	this._changing = true;

	// element가 둘 이상인 경우 html을 변경할 마지막 하나만 남기고 모두 지움
	if(ele.length > 1){
		for(var i = ele.length-1; i > 0; i--){
			ele[i].outerHTML = "";
		}
	}

	// !! parent로 찾으면 parent를 변경되는 ui 프레임워크에 의해 못찾을 수 있음
	if(html && html != ""){
		ele[0].outerHTML = html;
	}else{
		item.hide();
		ele[0].innerHTML = "";
	}


	item.elements = this.getDataViewElements(item);
	this.showNoDataView(item);
	this._changing = false;
};


/**
 * data로 data-view로 지정된 엘리먼트를 dataview 하단에 추가한다.
 * @param dataViewId - dataview 식별자
 * @param data - object or array
 */
DataView.prototype.append = function(dataViewId, data){
	if(!data) return;
	var item = this.getDataViewItem(dataViewId);
	var ele = item.elements;

	if(!item.isBind){
		if(!item.data){
			item.data = this.referenceData ? data : clone(data);
		}else{
			if(Array.isArray(item.data)){
				if(Array.isArray(data)){
					for(var i = 0; i < data.length; i++){
						item.data.push(data[i]);
					}
				}else{
					item.data.push(data);
				}
			}else{
				if(Array.isArray(data)){
					var c = clone(data);
					c.unshift(item.data);
					item.data = c;
				}else{
					item.data = [item.data, data];
				}
			}
		}
	}

	var html = "";
	if(Array.isArray(data)){
		//array
		html = this.getDataViewListHtml(dataViewId, data);
	}else{
		html = this.getDataViewHtml(dataViewId, data);
	}

	this._changing = true;
	var node = ele[ele.length-1];
	var newNodes = this._createElements(html);
	node.parentNode.insertBefore(newNodes, node.nextSibling);

	// 첫번째가 템플릿이면 삭제
	var tmplt = ele[0];
	if(tmplt.style.display == "none"){
		tmplt.outerHTML = "";
	}

	item.elements = this.getDataViewElements(item);
	this.showNoDataView(item);
	this._changing = false;
};


/**
 * data로 data-view로 지정된 엘리먼트를 dataview 상단에 추가한다.
 * @param dataViewId - dataview 식별자
 * @param data - object or array
 */
DataView.prototype.prepend = function(dataViewId, data){
	if(!data) return;
	var item = this.getDataViewItem(dataViewId);
	var ele = item.elements;

	if(!item.isBind){
		if(!item.data){
			item.data = this.referenceData ? data : clone(data);
		}else{
			if(Array.isArray(item.data)){
				if(Array.isArray(data)){
					for(var i = 0; i < data.length; i++){
						item.data.unshift(data[i]);
					}
				}else{
					item.data.unshift(data);
				}
			}else{
				if(Array.isArray(data)){
					var c = clone(data);
					c.push(item.data);
					item.data = c;
				}else{
					item.data = [data, item.data];
				}
			}
		}
	}

	var html = "";
	if(Array.isArray(data)){
		//array
		html = this.getDataViewListHtml(dataViewId, data);
	}else{
		html = this.getDataViewHtml(dataViewId, data);
	}

	this._changing = true;

	var node = ele[0];
	var newNode = this._createElements(html);
	node.parentNode.insertBefore(newNode, node);

	// 마지막이 템플릿이면 삭제
	var tmplt = ele[ele.length-1];
	if(tmplt.style.display == "none"){
		tmplt.outerHTML = "";
	}

	item.elements = this.getDataViewElements(item);
	this.showNoDataView(item);
	this._changing = false;
};


/**
 * data로 html을 만들어 data-view로 지정된 엘리먼트의 idx를 찾아 변경한다.
 * @param dataViewId - dataview 식별자
 * @param idx - number 변경할 위치
 * @param data - 변경할 object
 */
DataView.prototype.update = function(dataViewId, idx, data){
	var item = this.getDataViewItem(dataViewId);
	if(!item.data || item.data.length < idx) return;
	var ele = this.getDataViewElements(item)[idx];
	if(ele.style.display == "none") return;

	if(!item.isBind){
		item.data[idx] = data;
	}
	var html = this.getDataViewHtml(dataViewId, data);

	this._changing = true;
	ele.outerHTML = html;
	item.elements = this.getDataViewElements(item);
	this._changing = false;
};


/**
 * list의 idx번째 항목을 삭제한다.
 * @param dataViewId - dataview 식별자
 * @param idx - number 삭제할 위치
 */
DataView.prototype.remove = function(dataViewId, idx){
	var item = this.getDataViewItem(dataViewId);
	if(!item.data || item.data.length < idx) return;

	var ele = item.elements[idx];
	if(!ele || ele.style.display == "none") return;

	if(!item.isBind){
		item.data.splice(idx,1);
	}

	this._changing = true;
	if(this.getDataViewElements(item).length > 1){
		ele.outerHTML = "";
	}else{
		ele.style.display = "none";
		ele.innerHTML = "";
	}
	item.elements = this.getDataViewElements(item);
	this.showNoDataView(item);
	this._changing = false;
};


/**
 * dataview의 데이터를 빈데이터로 채웁니다.
 * @param dataViewId - dataview id
 */
DataView.prototype.blank = function(dataViewId){
	var item = this.getDataViewItem(dataViewId);
	var blnkData = {};
	if(item.type == ATTR_DATA_LIST || Array.isArray(item.data)){
		if(item.data){
			for(var i = 0; i < item.data.length; i++){
				item.data[i] = {};
			}
			blnkData = item.data;
		}
	}
	this.change(dataViewId, blnkData);
};


/**
 * dataview의 데이터를 null로 적용합니다.
 * @param dataViewId - dataview id
 */
DataView.prototype.clear = function(dataViewId){
	this.change(dataViewId, null);
};

/**
 * url로 element를 가져와서 해당 tag를 변경한 후 dataview에 등록한다.
 * @param url element를 불러올 url
 * @param tagNam
 * @param initData
 */
DataView.prototype.addDataViewByUrl = function(url, tagName, initData){
	http.get(url, function(res){
		this._changing = true;
		// console.log(r);
		var elist = el(tagName);
		for(var i = 0; i < elist.length; i++){
			elist[i].innerHTML = res;
		}

		var newArr = dataview.addDataViewList(elist);

		for(var i = 0; i < newArr.length; i++){
			if(newArr[i].type == ATTR_DATA_VIEW){
				dataview.change(newArr[i].id, initData || {});	//blank
			}else{
				dataview.change(newArr[i].id, initData || []);	//clear
			}
		}

		this._changing = false;
	});
};


/**
 * dataview의 parent를 다시 찾아서 등록한다.
 * dataview가 화면에 로드되기 전 dataview의 parent의 경우 화면의 객체가 아니기 때문에..
 * @param targetList - dataview item array
 */
DataView.prototype.refindParent = function(targetList){

	for(var i = 0; i < targetList.length; i++){
		var dvId = this.getDataViewId(targetList[i]);
		if(!dvId) continue;

		for(var j = 0; j < this.items.length; j++){
			// 존재하면 부모를 바꿈
			if(this.items[j].id == dvId){
				this.items[j].parent = el(targetList[i]).parentNode;
			}
		}
	}
};


/**
 * dataview 안에 있는 form element에 데이터를 채운다.
 * @param dataViewId - dataview 식별자
 * @param obj - data object
 */
DataView.prototype.objToForm = function(dataViewId, obj){
	var sel = this.getDataViewSelector(dataViewId);
	var el = document.querySelector(sel);
	var inpt = null;
	for(var k in obj){
		if(!obj[k]) continue;

		inpt = el.querySelector("[name="+k+"]");
		if(!inpt) continue;

		if(inpt.type == "radio"){
			try{
			el.querySelector("[name="+k+"][value="+obj[k]+"]").checked = true;
			}catch(e){}
		}else if(inpt.type == "checkbox"){

			var valArr = Array.isArray(obj[k]) ? obj[k] : null;
			if(!valArr && typeof obj[k] == "string"){
				valArr = obj[k].split(",");
			}

			for(var i = 0 ; i < valArr.length; i++){
				try{
				inpt = el.querySelector("[name="+k+"][value="+valArr[i]+"]");
				if(inpt){
					inpt.checked = true;
				}
				}catch(e){}
			}

		}else if(inpt.type == "select-multiple"){

			var valArr = Array.isArray(obj[k]) ? obj[k] : null;
			if(!valArr && typeof obj[k] == "string"){
				valArr = obj[k].split(",");
			}
			for(var i = 0; i < inpt.options.length; i++){
				try{
				var v = inpt.options[i].value || inpt.options[j].text;
				if(valArr.indexOf(v) != -1){
					inpt.options[i].selected = true;
				}
				}catch(e){}
			}

		}else{
			try{
			inpt.value = obj[k];
			}catch(e){}
		}
	}
};


/**
 * dataview 안에 있는 form element의 value들을 하나의 object로 변경해 리턴한다.
 * @param dataViewId - dataview 식별자
 * @return form values object
 */
DataView.prototype.formToObj = function(dataViewId){
	var sel = this.getDataViewSelector(dataViewId);
	var el = document.querySelector(sel);
	var list = el.querySelectorAll("input:enabled:not([type=button]):not([type=submit]):not([type=image]),select:enabled,textarea:enabled");
	var _obj = {};

	for(var i = 0; i < list.length; i++){
		if(!list[i].name) continue;

		var k = list[i].name;
		var v = list[i].value;

		if(list[i].type == "radio"){
			if(list[i].checked ){
				_obj[k] = v;
			}
		}else if(list[i].type == "checkbox"){

			if(list[i].checked){
				if(!_obj[k]) {
					if(el.querySelectorAll("input[name="+list[i].name+"]").length > 1){
						_obj[k] = [v];
					}else{
						_obj[k] = v;
					}
				}else{
					if(Array.isArray(_obj[list[i].name])){
						_obj[k].push(v);
					}else{
						_obj[k] = [_obj[k],v];
					}
				}
			}

		}else if(list[i].type == "select-multiple"){
			_obj[k] = [];
			for(var j = 0; j < list[i].options.length; j++){
				if(list[i].options[j].selected){
					v = list[i].options[j].value || list[i].options[j].text;
					_obj[k].push(v);
				}
			}
		}else{
			_obj[k] = v;
		}
	}
	return _obj;
};


/**
 * dataview 안에 있는 form element에 데이터를 지운다.
 * @param dataViewId - dataview 식별자
 */
DataView.prototype.clearForm = function(dataViewId){
	var sel = this.getDataViewSelector(dataViewId);
	var el = document.querySelector(sel);
	var list = el.querySelectorAll("input:enabled:not([type=button]):not([type=submit]):not([type=image]),select:enabled,textarea:enabled");

	for(var i = 0; i < list.length; i++){
		if(!list[i].name) continue;

		if(list[i].type == "radio" || list[i].type == "checkbox"){
			list[i].checked = false;
		}else if(list[i].type == "color"){
			list[i].value = "#000000";
		}else if(list[i].type == "select-one"){
			list[i].selectedIndex = 0;
		}else{
			list[i].value = "";
		}
	}
};


/**
 * data 존재 여부에 따라서
 * data가 있는 경우
 * dataview 안에 있는 form element에 데이터를 채운다.
 * data가 없는 경우
 * dataview 안에 있는 form element의 value들을 하나의 object로 변경해 리턴한다.
 * @param dataViewId - dataview 식별자
 * @return form values object
 */
DataView.prototype.form = function(dataViewId, data){
	if(data){
		this.objToForm(dataViewId, data);
		return ;
	}else{
		return this.formToObj(dataViewId);
	}
};


/**
 * singleton DOMParser를 리턴
 * @return 브라우저에서 생성된 DOMParser
 */
DataView.prototype._getDOMParser = function(){
	if(!this._domParser){
		this._domParser = new DOMParser();
	}
	return this._domParser;
};

/**
 * String 타입의 html을 Node로 변경하여 리턴
 * @param markup html markup
 * @return NodeList
 */
DataView.prototype._createElements = function(markup){
	/*console.log(markup);
	var newNodes = this._getDOMParser().parseFromString(markup, "text/html").body.childNodes;
	console.log(newNodes, newNodes.length);
	return newNodes;*/
	return document.createRange().createContextualFragment(markup);
};



/**
 * binding key 배열로 object를 바인딩할 수 있게 변경한다.
 * @param obj 변경할 object
 * @param bindArr binding keys
 * @param listener model change listener
 */
DataView.prototype.bind = function(obj, bindArr, listener){
	if(!obj) return;
	// TODO 배열인 경우 bindList로?
	// if(Array.isArray(obj)){
	// 	this.bindList(obj, bindArr, listener);
	// 	return;
	// }
	var k = null;
	for(var i = 0; i < bindArr.length; i++){
		k = bindArr[i];

		var kArr = k.split(".");
		var tmp = obj;

		for(var j = 0; j < kArr.length; j++){

			this.createSetAndGet(tmp, kArr[j]);

			// 마지막이 아니고 세팅하려는 객체가 없으면
			// if(j != kArr.length-1 && !tmp[kArr[j]]){
			// 	tmp["_" + kArr[j]] = {};
			// }
			if(!tmp){
				break;
			}
			var p = tmp;
			tmp = tmp[kArr[j]];
			if(tmp && typeof(tmp) == "object"){
				tmp.__p__ = p;	// object parent
				tmp.__k__ = kArr[j];
			}
		}
	}

	obj.bindArr = bindArr;

	/**
	 * 등록된 bindkey중 key 하위의 key들을 찾아 리턴한다.
	 * @param key string search key
	 * @return sub keys Array
	 */
	obj.findSubBindkeyArr = function(key){
		var arr = this.bindArr.filter(function(str){
			return str != key && str.startsWith(key);
		});

		for(var i = 0; i < arr.length; i++){
			arr[i] = arr[i].replace(key + ".", "");
		}
		return arr;
	};

	obj.modelChangeListeners = [];
	if(listener && obj.modelChangeListeners.indexOf(listener) == -1){
		obj.modelChangeListeners.push(listener);
	}

	obj.dispatch = function(key){
		for(var i = 0; i < this.modelChangeListeners.length; i++){
			this.modelChangeListeners[i].refresh({
				type: "update",
				data: this,
				key: key
			});
		}
	};
};


/**
* 하나의 프로퍼티에 대한 setter and getter를 등록합니다.
* @param obj create target
* @param prop setter and getter key
*/
DataView.prototype.createSetAndGet = function(obj, prop){

	if(!obj ||
		(Object.getOwnPropertyDescriptor(obj, prop) &&
		Object.getOwnPropertyDescriptor(obj, prop).set) ) {
		return;
	}

	// console.log("[[[[ bind to ",obj," ]]]", prop);

	obj["_"+prop] = obj[prop] || null;

	obj.__c__ = obj.__c__ || [];	// binding childen keys
	if(obj.__c__.indexOf(prop) == -1 ){
		obj.__c__.push(prop);
	}

	Object.defineProperty(obj, prop, {
		set : function(d){

			obj["_"+prop] = d;

			var parent = null;
			var bindKey = null;
			var bindChildArr = null;
			if(obj["_"+prop] && typeof(obj["_"+prop]) == "object"){
				obj["_"+prop].__p__ = obj;
				obj["_"+prop].__k__ = prop;
				bindKey = this.getBindKey(obj, prop);
				bindChildArr = this.getRoot().findSubBindkeyArr(bindKey);
			} else {
				bindKey = this.getBindKey(obj, prop);
			}

			// 다시 바인딩 시킬럿인지 프로퍼티만 복사할 것인지??? 생각해봐야함
			if(typeof(obj["_"+prop]) == "object" && bindChildArr && bindChildArr.length > 0){
				dataview.bind(obj["_"+prop], bindChildArr, obj);
			}

			this.getRoot().dispatch(bindKey);
		},
		get : function(){
			return obj["_"+prop];
		}
	});

	obj.getRoot = function(){
		if(!this.__p__){
			return this;
		} else {
			return this.__p__.getRoot();
		}
	};

	/**
	 * 현재 object부터 상위로 key를 찾아 xxx.xxx.xxx같은 형식으로 리턴한다.
	 * @param obj key를 찾을 obj
	 * @return binding key string
	 */
	obj.getBindKey = function(obj, key){
		var k = obj.__k__ || "";
		k = k && key ? k + "." + key : key;
		while(obj.__p__){
			obj = obj.__p__;
			if(obj.__k__){
				k = obj.__k__ + "." + k;
			}
		}
		return k;
	};

	// console.log("[[[[ bind end ",obj," ]]]", prop);

};


DataView.prototype.bindList = function(arr, bindArr, listener){

	arr.bindArr = bindArr;
	arr.modelChangeListeners = [];
	if(arr.modelChangeListeners.indexOf(listener) == -1){
		arr.modelChangeListeners.push(listener);
	}

	arr.dispatch = function(event){
		for(var i = 0; i < this.modelChangeListeners.length; i++){
			this.modelChangeListeners[i].refresh(event);
		}
	};

	arr.refresh = function(event){
		event.index = this.indexOf(event.data);
		this.dispatch(event);
	};

	for(var i = 0; i < arr.length; i++){
		dataview.bind(arr[i], arr.bindArr, arr);
		// arr[i].modelChangeListeners = [arr];
	}

	// add last
	arr.push = function(){
		var result = Array.prototype.push.apply(this, arguments);
		var item = arguments[0];
		if(isObj(item)){
			dataview.bind(item, this.bindArr, this);
			// item.modelChangeListeners = [this];
		}
		var index = this.indexOf(item);

		this.dispatch({
			type: "push",
			data: item,
			index: index
		});
		return result;
	};


	// remove last
	arr.pop = function(){
		if(this.length == 0) return;
		var index = this.length - 1;
		var item = this[index];
		this.dispatch({
			type: "pop",
			data: item,
			index: index
		});
		item.modelChangeListeners = null;
		var result = Array.prototype.pop.apply(this);
		return result;
	};


	// remove first
	arr.shift = function(){
		if(this.length == 0) return;
		var index = 0;
		var item = this[index];
		this.dispatch({
			type: "shift",
			data: item,
			index: index
		});
		item.modelChangeListeners = null;
		var result = Array.prototype.shift.apply(this, arguments);
		return result;
	};


	// add first
	arr.unshift = function(){
		var result = Array.prototype.unshift.apply(this, arguments);
		var item = arguments[0];
		if(isObj(item)){
			dataview.bind(item, this.bindArr, this);
			// item.modelChangeListeners = [this];
		}
		var index = this.indexOf(item);

		this.dispatch({
			type: "unshift",
			data: item,
			index: index
		});
		return result;
	};


	// remove arguments[0] ~ arguments[1]
	arr.splice = function(){
		var result = Array.prototype.splice.apply(this, arguments);
		if(this.length == 0 || result.length == 0) return;
		var index = arguments[0];
		var size = arguments[1];
		this.dispatch({
			type: "splice",
			data: result,
			index: index,
			size: size
		});
		result.forEach(function(obj){
			obj.modelChangeListeners = null;
		});
		return result;
	};


	// remove at index
	arr.removeAt = function(index){
		var result = Array.prototype.splice.apply(this, [index,1]);
		if(this.length == 0 || result.length == 0) return;
		this.dispatch({
			type: "removeAt",
			data: result,
			index: index
		});
		result.forEach(function(obj){
			obj.modelChangeListeners = null;
		});
		return result;
	};


	if(Proxy){
		var parr = new Proxy(arr, {
			set (target, index, value, receiver){
				var result = Reflect.set(target, index, value, receiver);
				if(typeof(value) == "object" && !isNaN(index)){
					dataview.bind(value, target.bindArr, target);
					target.dispatch({
						type: "update",
						data: value,
						index: index
					});
				}
				return result;
			}
			// get: function(target, index, receiver){
			// 	return Reflect.get(target, index, receiver);
			// }
		});

		for(var k in window){
			if(["webkitStorageInfo"].indexOf(k) == -1 && Array.isArray(window[k]) && window[k] == arr){
				eval(k + " = parr;");
				break;
			}
		}
	}
};


/**
 * constructor DataView Item
 * @param params - dataview item parameters
 */
function DataViewItem(params){
	/*
	this.id = params.id;
	this.type = params.type;
	this.selector = params.selector;
	this.template = params.template;
	this.element = params.element;
	this.parent = params.parent;
	this.noDataView = params.noDataView;
	this.noDataViewHTML = params.noDataViewHTML;
	this.scope = params.scope;
	*/
	for(var k in params){
		this[k] = params[k];
	}
}


DataViewItem.prototype = {
	_data : null,
	set data(obj){
		if(this.isBind){

			if(this.type == ATTR_DATA_VIEW){

				dataview.bind(obj, this.normalVarKeys, this);
				this._data = obj;
				// if(this._data && this._data.modelChangeListeners.indexOf(this) == -1){
				// 	this._data.modelChangeListeners.push(this);
				// }

			} else if(this.type == ATTR_DATA_LIST){
				dataview.bindList(obj, this.normalVarKeys, this);
				this._data = obj;
			}
			this.refresh();
		} else {
			this._data = obj;
		}
	},
	get data(){
		// console.log(this.id + " getter");
		return this._data;
	}
};


/**
 * data로 뷰를 변경한다.
 * @param data - 변경할 데이터
 */
DataViewItem.prototype.change = function(data){
	if( data === undefined ){
		data = {};
	}
	dataview.change(this.id, data);
};


/**
 * item에 저장되 있는 data로 뷰를 변경한다.
 */
DataViewItem.prototype.refresh = function(refreshData){
	if(!refreshData || this.type == ATTR_DATA_VIEW){
		dataview.refresh(this.id, refreshData);
		return;
	}

	switch (refreshData.type) {
		case "update"	: this.update(refreshData.index, refreshData.data); break;
		case "push"		: this.append(refreshData.data); break;
		case "unshift"	: this.prepend(refreshData.data); break;
		case "pop"		:
		case "shift"	:
		case "removeAt"	: this.remove(refreshData.index); break;
		case "splice"	:
			var last = refreshData.index + refreshData.size - 1;
			for(var i = last; i >= refreshData.index; i--){
				this.remove(i);
			}
			break;
		default:
			dataview.refresh(this.id, refreshData);
	}
};


/**
 * data로 뷰를 뒤 쪽에 추가한다.
 * @param data - 추가할 data
 */
DataViewItem.prototype.append = function(data){
	dataview.append(this.id, data);
};


/**
 * data로 뷰를 앞 쪽에 추가한다.
 * @param data - 추가할 data
 */
DataViewItem.prototype.prepend = function(data){
	dataview.prepend(this.id, data);
};


/**
 * data로 idx에 해당하는 view를 변경한다.
 * @param idx - 변경할 index
 * @param data - 변경할 data
 */
DataViewItem.prototype.update = function(idx, data){
	dataview.update(this.id, idx, data);
};


/**
 * idx에 해당하는 view를 삭제한다.
 * @param idx - 삭제할 index
 */
DataViewItem.prototype.remove = function(idx){
	dataview.remove(this.id, idx);
};


/**
 * dataview를 clear한다.
 */
DataViewItem.prototype.clear = function(){
	dataview.clear(this.id);
};


/**
 * dataview를 빈 데이터로 채운다.
 */
DataViewItem.prototype.blank = function(){
	dataview.blank(this.id);
};

/**
 * dataview를 화면에 보인다
 */
DataViewItem.prototype.show = function(){
	for(var i = 0; i < this.elements.length; i++){
		this.elements[i].style.display = this._preStyleDisplay || "block";
	}
};

/**
 * dataview를 화면에서 가린다.
 */
DataViewItem.prototype.hide = function(){
	for(var i = 0; i < this.elements.length; i++){
		this._preStyleDisplay = this.elements[i].style.display
		this.elements[i].style.display = "none";
	}
};

/**
 * dataview 안에 있는 form element에 데이터를 채운다.
 * @param data - object
 */
DataViewItem.prototype.objToForm = function(obj){
	dataview.objToForm(this.id, obj);
};


/**
 * dataview 안에 있는 form element의 value들을 하나의 object로 변경해 리턴한다.
 * @return form values object
 */
DataViewItem.prototype.formToObj = function(){
	return dataview.formToObj(this.id);
};


/**
 * dataview 안에 있는 form element에 데이터를 지운다.
 */
DataViewItem.prototype.clearForm = function(){
	dataview.clearForm(this.id);
};


/**
 * data 존재 여부에 따라서
 * data가 있는 경우
 * dataview 안에 있는 form element에 데이터를 채운다.
 * data가 없는 경우
 * dataview 안에 있는 form element의 value들을 하나의 object로 변경해 리턴한다.
 * @return form values object
 */
DataViewItem.prototype.form = function(data){
	return dataview.form(this.id, data);
};


/**
 * escape문자를 일반문자로 변경
 * &amp; -> &
 * &gt; -> >
 * &lt; -> <
 * @param str
 * @returns
 */
function escapeToNormalChar(str){
	return str.replace(/&lt;/g, "<")
	.replace(/&gt;/g, ">")
	.replace(/&amp;/g, "&");
}


/**
 * array clone
 * @param obj
 * @returns
 */
function clone(obj){
	if(!obj) return obj;
	if(Array.isArray(obj)){
		var n = [];
		for(var i = 0; i < obj.length; i++){
			n[i] = obj[i];
		}
		return n;
	}else{
		return obj;
	}
}

document.addEventListener("DOMContentLoaded", _dvinit, false);
document.addEventListener("DOMNodeInserted", _dvinit, false);

function _dvinit(e){

	if(document.body && !dataview._initializing && !dataview.initialized){

		var dataviewSrc = document.querySelector("script[src*='data-view']").getAttribute("src");

		// 로딩과 동시에 초기화 할지 여부(src주소 파라메터에 "no-init"이 존재하면 초기화 하지 않는다.
		var initOnLoad = (dataviewSrc.indexOf("no-init") == -1);

		var params = {};

		// script태그의 src주소 파라메터 분석 및 초기화
		// ex) dataview.js?attr=data-v&listAttr=list-v
		// -> attr을 "data-v"로 설정, listAttr을 "list-v"로 설정해서 초기화 한다.
		if(dataviewSrc.indexOf("?") != -1){
			var strLocParams = dataviewSrc.substring(dataviewSrc.indexOf("?")+1);
			if(strLocParams.length > 0){

				params = {};
				var arr = strLocParams.split("&");
				var arr2 = null;

				for(var i = 0; i < arr.length; i++){
					arr2 = arr[i].split("=");
					if(arr2.length == 2){
						params[arr2[0]] = arr2[1];
					}
				}
			}
		}

		dataview.config(params);
		dataview.initDataView();
		document.removeEventListener("DOMNodeInserted", _dvinit);
		document.removeEventListener("DOMContentLoaded", _dvinit);
	}
}


/**
 * get elements
 * @return NodeList
 */
function el(){
	if(!arguments || arguments.length === 0 || !arguments[0]){
		throw new Error("function el() arguments is required");
	}
	var args = Array.prototype.slice.call(arguments);
	var query = args[0];

	if(args.length === 1){
		if(query.querySelectorAll){
			return query;
		}
		return document.querySelectorAll(query);
	}

	var scope = args[args.length-1];
	query = args.slice(0, args.length-1).join(",");

	// 마지막 파라메터가 elemnt인 경우
	if(scope.querySelectorAll){
		return scope.querySelectorAll(query);
	}

	// html인 경우
	if(scope.indexOf("<") != -1){
		var parser = new DOMParser();
		scope = parser.parseFromString(scope, "text/html");
		return scope.querySelectorAll(query);
	}

	query = args.join(",");
	return document.querySelectorAll(query);
}

/**
 * is object ?
 * @param anything
 * @return boolean
 */
function isObj(obj){
	return typeof(obj) == "object";
}



//dataview 생성
var dataview = new DataView();
