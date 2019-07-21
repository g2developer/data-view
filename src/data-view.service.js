var http = new HttpService();

function HttpService(){
	this._timeout = 15000;
	this._isAsync = true;
	// json, html, xml, text
	this._resultType = "json";
}

HttpService.prototype.createXHR = function(){
	var req = new XMLHttpRequest();
	req.timeout = this._timeout;
	return req;
};


HttpService.prototype.addFunctions = function(req, sucfunc, errFunc){
	req.onreadystatechange = function(event){
		try {

			if(event.target.readyState === XMLHttpRequest.DONE){
				if(event.target.status == 200 || event.target.status == 0){
					var result = null;
					if(this._resultType == "json"){
						result = JSON.parse(event.target.response);
					} else if(this._resultType == "xml"){
						result = event.target.responseXML;
					} else {
						result = event.target.response;
					}
					if(sucfunc){
						sucfunc(result);
					}

				} else {
					console.error(event.target.message);
					if(errFunc)
						errFunc(event.target.message, event.target);
				}
			}
		} catch(e){
			console.error(e);
			if(errFunc)
				errFunc(e, req);
		}
	};

};


HttpService.prototype.get = function(url, successFunction, failFunction){
	var req = this.createXHR();
	this.addFunctions(req, successFunction, failFunction);
	req.open("GET", url, this._isAsync);
	req.send();
};

HttpService.prototype.post = function(url, data, successFunction, failFunction){
	var req = this.createXHR();
	this.addFunctions(req, successFunction, failFunction);
	req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	req.open("POST", url, this._isAsync);
	// encodeURIComponent(data)
	req.send(data);
};
