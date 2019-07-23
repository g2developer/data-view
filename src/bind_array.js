
function test(arr, prop){

	Object.defineProperty(arr, prop, {

		set : function(d){
			arr["_"] = [];
			arr["_"][prop] = d;
			console.log("setttt");
		},
		get : function(){
			return arr["_"][prop];
		}
	});

}

function bindList(arr, bindArr, listener){

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
		dataview.searchAndBind(arr[i], arr.bindArr);
		arr[i].modelChangeListeners = [arr];
	}

	// add last
	arr.push = function(){
		var result = Array.prototype.push.apply(this, arguments);
		var item = arguments[0];
		if(isObj(item)){
			dataview.searchAndBind(item, this.bindArr);
			item.modelChangeListeners = [this];
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
			dataview.searchAndBind(item, this.bindArr);
			item.modelChangeListeners = [this];
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

}

function isObj(obj){
	return typeof(obj) == "object";
}
