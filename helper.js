const fs = require('fs');

/*
 * Copy the enumerable properties of `p` to `o`, and return `o`.
 * If `o` and `p` have a property by the same name, `o`'s property is left alone.
 * 中文：将p的可枚举属性添加到o上，如果o本身已经含有同名的属性，则保留o同名的属性
*/

function merge(o,p){
	for(var prop in p){
		if(o.hasOwnProperty(prop)){//hasOwnProperty() 方法用来判断某个对象是否含有指定的自身属性(即非继承属性)
			continue;//continue 语句结束当前（或标签）的循环语句的本次迭代，并继续执行循环的下一次迭代。
		}
		o[prop] = p[prop];
	}
	return o;
}

///大致同merge，但返回的是一个新对象temp，o不变。
function merge2(o,p) {
	var temp = {};
	for(var k in o) {
		temp[k] = o[k];
	}
	for(var prop in p) {
		if(temp.hasOwnProperty(prop)){
			continue;
		}
		temp[prop] = p[prop];
	}
	return temp;
}

///将p的属性添加到o上，不管o有没有跟p同名的属性，即如果有同名属性，则用p的属性值覆盖o的同名属性。
function extend(o,p) {
	for(var prop in p){
		o[prop] = p[prop];
	}
	return o;
}

///大致同extend，但返回的是一个新对象temp，o不变。
function extend2(o,p) {
	var temp = {};
	for (var k in o) {
		temp[k] = o[k]
	}
	for (var prop in p) {
		temp[prop] = p[prop];
	} 
	return temp;
}


///读取文件filename(是个json文件)的数据,然后返回解析为对象的数据
function readJSON(filename) {
	return new Promise(
		function(resolve,reject) {
			fs.readFile(filename,'utf8',function(err,data){
				if(err) {
					console.log('Cannot find file: ' + filename);
					reject(err);
				} else {
					resolve(JSON.parse(data));
				}
			});
		}
	);
}

///读取文件filename的数据，然后返回原数据
function readFile(filename) {
	return new Promise(
		function(resolve,reject){
			fs.readFile(filename,'utf8',function(err,data){
				if(err){
					console.log('Cannot find file: ' + filename);
					reject(err);
				} else {
					resolve(data);
				}
			});
		}
	);
}

module.exports = {
	merge: merge,
	extend: extend,
	readJSON: readJSON,
	readFile: readFile
};