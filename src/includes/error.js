/*#inport 'types.js'*/

function stringify(src) {
	var strValue = src;
	if(src) {
		if(isFunction(src)) { strValue = src.toString(); } 
		else if( !isString(src) ) { strValue = JSON.stringify(src); }
	}
	return '' + strValue;
}

function fError(module, ErrorConstructor) {
	ErrorConstructor = ErrorConstructor || Error;
	return function ferror(type, template) {
		var subs = arguments;

		template = template.replace(/\{(\d+)\}/g, function(holder, index) {
			return stringify(subs[parseInt(index) + 2]);
		});

		return new ErrorConstructor(module + ' <' + type + '> : ' + template);
	}
}