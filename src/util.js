export function find(selector, root = document) {
	let nodes = root.querySelectorAll(selector);
	return [].slice.call(nodes); // XXX: not necessary for modern browsers
}

// NB: discards blank values (`undefined`, `null`, `false`) to allow for
//     conditionals with boolean operators (`condition && value`)
export function html2dom(parts, ...values) {
	let html = parts.reduce((memo, part, i) => {
		let val = values[i];
		let blank = val === undefined || val === null || val === false;
		return memo.concat(blank ? [part] : [part, val]);
	}, []).join("");

	let tmp = document.createElement("div");
	tmp.innerHTML = html.trim();
	return tmp.childNodes[0];
}
