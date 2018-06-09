import { find, createElement } from "./util";

init(".quaynaut");

function init(root) {
	root = document.querySelector(root);
	if(!root) {
		console.warn("Querynaut could not be initialized due to missing root element");
		return;
	}

	let slides = find("article", root);
	let penultimate = slides.length - 1;
	slides.forEach((slide, i) => {
		// generate ID -- TODO: account for existing attributes (incl. prev/next)
		let id = i + 1;
		slide.id = `s${id}`;

		// generate navigation links
		let nav = createElement("nav", { class: "quaynaut-nav" });
		if(i !== 0) {
			let link = createElement("a", { rel: "prev", href: `#s${id - 1}` }, "previous");
			nav.appendChild(link);
		}
		let current = createElement("a", { rel: "self", href: `#s${id}` }, `slide ${id}`);
		nav.appendChild(current);
		if(i !== penultimate) {
			let link = createElement("a", { rel: "next", href: `#s${id + 1}` }, "next");
			nav.appendChild(link);
		}
		slide.appendChild(nav);
	});
}
