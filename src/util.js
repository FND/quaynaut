export function find(selector, root = document) {
	let nodes = root.querySelectorAll(selector);
	return [].slice.call(nodes); // XXX: not necessary for modern browsers
}

export function createElement(tag, attribs, text) {
	let node = document.createElement(tag);
	Object.keys(attribs).forEach(attr => {
		node.setAttribute(attr, attribs[attr]);
	});
	if(text) {
		node.textContent = text;
	}
	return node;
}
