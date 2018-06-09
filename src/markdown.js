import commonmark from "commonmark/dist/commonmark.min";

// replaces a DOM node containing Markdown with corresponding rendered nodes
export default function render(node) {
	let tmp = document.createElement("div");
	tmp.innerHTML = markdown(node.textContent.trim());

	let container = node.parentNode;
	tmp.childNodes.forEach(el => {
		container.insertBefore(el, node);
	});
	container.removeChild(node);
}

export function markdown(txt, { safe = true, smart = true } = {}) {
	let reader = new commonmark.Parser({ smart });
	let parsed = reader.parse(txt);

	let writer = new commonmark.HtmlRenderer({ safe });
	return writer.render(parsed);
}
