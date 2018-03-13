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
 * @param params.refenceData - dataview의 item.data가 change할 때 제공된 데이터를 참조할지
 */
function DataView(params){

	// dataViewItem array
	this.dataViewItems = [];
	// 초기화 중 인지 아닌지
	this.initializing = false;
	// 초기화가 완료되었는지
	this.initialized = false;
	// dataview 적용/변경 중인지
	this.changing = false;
	// dataview item들을 전역변수로 생성할 것인지
	this.createGlobalItems = true;


	this.config(params);
}


/**
 * configuration dataview
 * @param params.attr - data-view tag attribute name default "data-view"
 * @param params.listAttr - data-list tag attribute name default "data-list"
 * @param params.noDataAttr - no-data-view tag attribute name default "no-data-view"
 * @param params.createGlobalItems - dataview item들을 전역변수로 생성할 것인지 default true
 * @param params.refenceData - dataview의 item.data가 change할 때 제공된 데이터를 참조할지
 */
DataView.prototype.config = function(params){
	if(!params) return this;

	// tag attribute 이름 변경
	if(params.attr) ATTR_DATA_VIEW = params.attr;
	if(params.listAttr) ATTR_DATA_LIST = params.listAttr;
	if(params.noDataAttr) ATTR_NO_DATA_VIEW = params.noDataAttr;

	// dataview item들을 전역변수로 생성할 것인지
	this.createGlobalItems = (params.hasOwnProperty("createGlobalItems") ? params.createGlobalItems : true);
	this.refenceData = (params.hasOwnProperty("refenceData") ? params.refenceData : false);

	return this;
};


/**
 * initialize
 * html에서 data-view 추출하고 저장, data-view를 숨김
 * @param element - dataview를 검색할 element 혹은 css selector
 */
DataView.prototype.initDataView = function(element){
	this.initializing = true;

	// 기존 항목 모두 삭제
	for(var i = this.dataViewItems.length - 1; i >= 0; i--){
		if(this.dataViewItems[i].scope == element){
			this.dataViewItems.pop();
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
	this.initializing = false;
	this.initialized = true;

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
	var targetList = jQuery("["+ATTR_DATA_VIEW+"], ["+ATTR_DATA_LIST+"]", html);
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
		dvType = jQuery(targetList[i]).attr(ATTR_DATA_VIEW) ? ATTR_DATA_VIEW : ATTR_DATA_LIST;

		if(!dvId) {
			console.error("[dataview] Not found data-view attribute value or tag id");
			continue;
		}

		var selector = null;
		if(jQuery(targetList[i]).attr(ATTR_DATA_VIEW)){
			selector = "["+ATTR_DATA_VIEW+"="+dvId+"]";
		}else if(jQuery(targetList[i]).attr(ATTR_DATA_LIST)){
			selector = "["+ATTR_DATA_LIST+"="+dvId+"]";
		}else  if(jQuery(targetList[i]).attr("id")){
			selector = "#"+dvId;
		}

		var noDvElement = jQuery("["+ATTR_NO_DATA_VIEW+"="+dvId+"]");
		var noDvElementHTML = noDvElement[0] ? noDvElement[0].outerHTML : "";

		dvItem = new DataViewItem({
			id : dvId,
			type : dvType,
			selector : selector,
			template : targetList[i].outerHTML,
			element : targetList[i],
			parent : jQuery(targetList[i]).parent(),
			noDataView : noDvElement,
			noDataViewHTML : noDvElementHTML,
			scope : scope
		});
		newArr.push(dvItem);

		if(this.createGlobalItems){
			// global변수로 생성
			try{
				// global 변수가 있는지 검사(에러시 없음)
				var v = eval(dvId);

				// 존재한다면..
				for(var k in dvItem){
					v[k] = vtemp[k];
				}

			}catch(e){
				eval(dvId + "=dvItem;");
			}
		}
	}
	if(newArr.length > 0){
		this.dataViewItems = this.dataViewItems.concat(newArr);
	}
	return newArr;
};


/**
 * html에서 attribute가 data-view거나 data-view가 있는 경우 id를 리턴한다.
 * @param el - dataview element
 * @return string - dataview 실별 id
 */
DataView.prototype.getDataViewId = function(el){
	return (jQuery(el).attr(ATTR_DATA_VIEW) ||
			jQuery(el).attr(ATTR_DATA_LIST) ||
			jQuery(el).attr("id"));
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
	for(var i = 0; i < this.dataViewItems.length; i++){
		if(this.dataViewItems[i].id == dataViewId){
			item = this.dataViewItems[i];
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
 * dataview css selector를 리턴한다.
 * @param dataViewId - dataview의 id
 * @return data view 의 css selector
 */
DataView.prototype.getDataViewSelector = function(dataViewId){
	return this.getDataViewItem(dataViewId).selector;
};


/**
 * dataview의 화면 내 실제 element를 리턴한다.
 * @param item - dataview item
 * @return jquery element - 화면에 적용되어있는 실제 dataview element
 */
DataView.prototype.getDataViewElement = function(item){
	var el = jQuery(item.selector, item.parent);
	if(!el || el.length == 0) {
		el = jQuery(item.selector);
		if(el || el.length > 0) {
			item.parent = el.parent();
		}
	}
	return el;
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
		tmp = '';
	}
	if(tmp == null || tmp == undefined || tmp == 'null' || tmp == 'undefined'){
		tmp = '';
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
 * 일반 변수를 html에 적용 {{변수}} 형식
 * @param html - dataview template html
 * @param data - 적용할 data
 * @return string - data가 적용된 html
 */
DataView.prototype.mergeNormalVar = function(html,data){
	// 리터럴,숫자 제거
	var tmp = html;
	// 문자열 제거
	tmp = tmp.replace(/\'[^\']*\'/g, '');
	tmp = tmp.replace(/\"[^\"]*\"/g, '');
	// 숫자, 소수제거
	tmp = tmp.replace(/^\w\d+\.?\d*/g, '');
	// 함수형식 제거
	tmp = tmp.replace(/\w+(\.\w+)* *\(/g, '');
	// 예약어 제거
	tmp = tmp.replace(/null/g, '');
	tmp = tmp.replace(/true/g, '');
	tmp = tmp.replace(/false/g, '');
	tmp = tmp.replace(/undefined/g, '');

	// object 검색 형식
	// \w+(\.*\w*)* -> item.obj.key
	var rg = /\w+(\.\w+)*/g;

	var match = tmp.match(rg);
	if(match == null) return html;
	for(var i = 0; i < match.length; i++){
		var value = this.getDataOfKey(data,match[i]);
		if(isNaN(value) && typeof value == 'string'){
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
	var rg = /@\w+(\.\w+)*/g;
	var match = html.match(rg);
	if(match == null) return html;
	for(var i = 0; i < match.length; i++){
		var gVar = match[i];
		var value = eval(gVar.substr(1));
		if(value && typeof value == 'string' && value != 'null' && value != 'undefined'){
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

		var result = '';

		// if문 중에서 true 인것을 골라 소스를 찾는다.
		for(var i = 0; i < logicMatch.length; i++){

			var logic = logicMatch[i].replace(/\{|\}/g, '');
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
		key = key.replace(/ /g, '');
		// key가 객체인 경우 (xxx.yyy.key 형식)
		if(key.split('.').length >= 2){
			var kArr = key.split('.');
			var tmp = data;
			try{
				for(var j = 0; j < kArr.length; j++){
					tmp = tmp[kArr[j]];
				}
			}catch(e){
				tmp = '';
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
	var result = '';

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
		if(!isNaN(arr[i]) || arr[i] == 'true' || arr[i] == 'false'){	//숫자면 제외
			arr.splice(i,1);
		}else if(['amp','lt','gt','typeof','instanceof'].indexOf(arr[i]) != -1){
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
	var noDvElement = jQuery("["+ATTR_NO_DATA_VIEW+"="+item.id+"]");

	// 데이터 없는 경우 no-data-view 출력
	if(!item.data || item.data.length == 0){

		if(noDvElement.html()){
			noDvElement.show();
		}else{
			if(item.noDataViewHTML){
				if(item.parent && item.parent.length > 0){
					jQuery(item.noDataViewHTML).appendTo(item.parent);
				}
			}
		}

	} else {
		if(noDvElement) noDvElement.hide();
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
	var el = this.getDataViewElement(item);
	var html = "";

	if(!this.refenceData){
		data = clone(data);
	}

	if(item.type == ATTR_DATA_LIST){
		if(data){
			item.data = Array.isArray(data) ? data : [data];
		}else{
			if(this.refenceData){
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

	this.changing = true;

	// element가 둘 이상인 경우 html을 변경할 마지막 하나만 남기고 모두 지움
	if(el.length > 1){
		for(var i = el.length-1; i > 0; i--){
			el.eq(i).remove();
		}
	}

	// !! parent로 찾으면 parent를 변경되는 ui 프레임워크에 의해 못찾을 수 있음
	if(html && html != ""){
		el.replaceWith(html);
	}else{
		el.hide();
		el.html("");
	}

	item.element = this.getDataViewElement(item);
	this.showNoDataView(item);
	this.changing = false;
};

/**
 * data로 data-view로 지정된 엘리먼트를 dataview 하단에 추가한다.
 * @param dataViewId - dataview 식별자
 * @param data - object or array
 */
DataView.prototype.append = function(dataViewId, data){
	if(!data) return;
	var item = this.getDataViewItem(dataViewId);
	var el = this.getDataViewElement(item);

	if(!item.data){
		item.data = this.refenceData ? data : clone(data);
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

	var html = "";
	if(Array.isArray(data)){
		//array
		html = this.getDataViewListHtml(dataViewId, data);
	}else{
		html = this.getDataViewHtml(dataViewId, data);
	}

	this.changing = true;
	el.last().after(html);

	// 첫번째가 템플릿이면 삭제
	var tmplt = el.first();
	if(!tmplt.is(':visible')){
		tmplt.remove();
	}

	item.element = this.getDataViewElement(item);
	this.showNoDataView(item);
	this.changing = false;
};


/**
 * data로 data-view로 지정된 엘리먼트를 dataview 상단에 추가한다.
 * @param dataViewId - dataview 식별자
 * @param data - object or array
 */
DataView.prototype.prepend = function(dataViewId, data){
	if(!data) return;
	var item = this.getDataViewItem(dataViewId);
	var el = this.getDataViewElement(item);

	if(!item.data){
		item.data = this.refenceData ? data : clone(data);
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

	var html = "";
	if(Array.isArray(data)){
		//array
		html = this.getDataViewListHtml(dataViewId, data);
	}else{
		html = this.getDataViewHtml(dataViewId, data);
	}

	this.changing = true;
	el.first().before(html);

	// 마지막이 템플릿이면 삭제
	var tmplt = el.last();
	if(!tmplt.is(':visible')){
		tmplt.remove();
	}

	item.element = this.getDataViewElement(item);
	this.showNoDataView(item);
	this.changing = false;
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
	var el = this.getDataViewElement(item).eq(idx);
	if(!el.is(':visible')) return;

	item.data[idx] = data;
	var html = this.getDataViewHtml(dataViewId, data);

	this.changing = true;
	el.replaceWith(html);
	item.element = this.getDataViewElement(item);
	this.changing = false;
};


/**
 * list의 idx번째 항목을 삭제한다.
 * @param dataViewId - dataview 식별자
 * @param idx - number 삭제할 위치
 */
DataView.prototype.remove = function(dataViewId, idx){
	var item = this.getDataViewItem(dataViewId);
	if(!item.data || item.data.length < idx) return;

	var el = this.getDataViewElement(item).eq(idx);
	if(!el.is(':visible')) return;

	item.data.splice(idx,1);

	this.changing = true;
	if(this.getDataViewElement(item).length > 1){
		el.remove();
	}else{
		el.hide();
		el.html("");
	}
	item.element = this.getDataViewElement(item);
	this.showNoDataView(item);
	this.changing = false;
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
 * 새로운 html 파일을 로드한 후 querySelector에 대한 tag를 load한 html 변경 혹은 삽입
 * @param url - 로드할 html의 url
 * @param querySelector - 로드한 html을 추가할 query selector
 * @param isOverride - bool 오버라이드 할 것인지
 */
DataView.prototype.loadAnd = function(url, querySelector, isOverride){
	jQuery.get(url, function(html){
		html = dataview.newDataViewHtml(html);
		if(querySelector){
			this.changing = true;
			var el = jQuery(querySelector);
			if(isOverride){
				var p = el.parent();
				var idx = el.index();
				el.replaceWith(html);
				el = p.children().eq(idx);
			}else{
				el.html(html);
			}
			var targetList = this.findDataViewList(el);
			dataview.refindParent(targetList);
			this.changing = false;
		}
	});
};


/**
 * 새로운 html 파일을 로드한 후 querySelector에 대한 tag를 load한 html 변경
 * @param url - 로드할 html의 url
 * @param querySelector - 로드한 html을 추가할 query selector
 */
DataView.prototype.loadAndOverrideHtml = function(url, querySelector){
	this.loadAnd(url, querySelector, true);
};


/**
 * 새로운 html 파일을 로드한 후 querySelector에 대한 tag를 load한 html 삽입
 * @param url - 로드할 html의 url
 * @param querySelector - 로드한 html을 추가할 query selector
 */
DataView.prototype.loadAndChangeHtml = function(url, querySelector){
	this.loadAnd(url, querySelector, false);
};


/**
 * 새로운 html 파일을 로드한 후 dataview item에 추가한다.
 * @param url - 로드된 html string
 * @return string - load한 html에 dataview를 적용한 html
 */
DataView.prototype.newDataViewHtml = function(html){
	var targetList = this.findDataViewList(html);

	if(!targetList || targetList.length == 0 ) return html;

	this.addDataViewList(targetList);
	return this.mergeHtmlData(html, {});
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

		for(var j = 0; j < this.dataViewItems.length; j++){
			// 존재하면 부모를 바꿈
			if(this.dataViewItems[j].id == dvId){
				this.dataViewItems[j].parent = jQuery(targetList[i]).parent();
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
			if(!valArr && typeof obj[k] == 'string'){
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
			if(!valArr && typeof obj[k] == 'string'){
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
			list[i].value = '#000000';
		}else if(list[i].type == "select-one"){
			list[i].selectedIndex = 0;
		}else{
			list[i].value = '';
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


/**
 * data로 뷰를 변경한다.
 * @param data - 변경할 데이터
 */
DataViewItem.prototype.change = function(data){
	dataview.change(this.id, data);
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
	return str.replace(/&lt;/g, '<')
	.replace(/&gt;/g, '>')
	.replace(/&amp;/g, '&');
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

	if(document.body && !dataview.initializing && !dataview.initialized){

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


//dataview 생성
var dataview = new DataView();
