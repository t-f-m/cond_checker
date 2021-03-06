var div = document.createElement('div');
div.style.whiteSpace = 'pre-wrap';
div.style.position = 'absolute';
div.style.top = '7em';
div.style.left = '50%';
div.style.marginLeft = '402px';
document.body.appendChild(div);

chrome.runtime.onMessage.addListener(function (req) {
	if (req instanceof Array) {
		div.textContent = req.join('\n');
	} else if (typeof req === 'object') {
		var msg = '\n';
		for(key in req){
			msg += '\n' + key + ' ' + req[key].toString(10);
		}
		div.textContent += msg;
	} else {
		div.textContent += '\n\nnext enemy\n' + req.toString(10);
	}
});

