new (function(){
	this.aaaa = "sdfsdf";
	console.log("test");
	console.log(this);

	function ttt(){
		var ss = "sdfsdf";
		console.log(this);
	}
	ttt();
	return this;
})();


// function Ttttt(){
// 	this.aaa = "sdf";
// 	console.log(this);
// }
//
// var tt = new Ttttt();
// console.log(tt.aaa);
