import Prism from "./prism_shim";
import renderMarkdown from "./markdown";
import { find } from "uitil/dom";
import { html2dom as html } from "uitil/dom/create";

let ROOT_SELECTOR = ".quaynaut";
let MARKDOWN_SELECTOR = "pre[data-markdown]";
let SLIDE_TAG = "article";
let NAV_CLASS = "quaynaut-nav";
let TOGGLE_CLASS = "quaynaut-toggle";

document.addEventListener("DOMContentLoaded", init);

document.addEventListener("keydown", ev => {
	switch(ev.keyCode) {
	case 37: // left
		cycle("prev");
		break;
	case 39: // right
		cycle("next");
		break;
	case 80: // p
		togglePresentationMode();
		break;
	}
});

function init() {
	let root = document.querySelector(ROOT_SELECTOR);
	if(!root) {
		console.warn("Querynaut could not be initialized due to missing root element");
		return;
	}

	// support for Markdown-only slide elements, for convenience
	find(root, MARKDOWN_SELECTOR).forEach(md => {
		if(md.closest(SLIDE_TAG)) { // XXX: inefficient
			return;
		}
		// add slide wrapper to ensure consistent markup
		let slide = document.createElement(SLIDE_TAG);
		md.parentNode.insertBefore(slide, md);
		slide.appendChild(md);
		// transfer attributes
		let attribs = [].slice.call(md.attributes);
		attribs.forEach(({ name, value }) => {
			if(name === "data-markdown") { // XXX: breaks encapsulation
				return;
			}
			slide.setAttribute(name, value);
			md.removeAttribute(name);
		});
	});

	let toggle = html`<a class="${TOGGLE_CLASS}" href="#s1" data-alt="📽️">📃</a>`;
	toggle.addEventListener("click", togglePresentationMode);

	// ensure a slide is selected
	if(!document.location.hash) {
		document.location = `${document.location}#s1`;
	}

	let slides = find(root, SLIDE_TAG);
	let penultimate = slides.length - 1;
	slides.forEach((slide, i) => {
		if(i === 0) {
			slide.appendChild(toggle);
		}

		// generate ID -- TODO: account for existing attributes (incl. prev/next)
		let id = i + 1;
		slide.id = `s${id}`;

		// generate navigation links
		slide.appendChild(html`
<nav class="${NAV_CLASS}">
	${i !== 0 && // eslint-disable-next-line indent
			`<a rel="prev" href="#s${id - 1}">previous</a>`}
	<a rel="self" href="#s${id}">slide ${id}</a>
	${i !== penultimate && // eslint-disable-next-line indent
			`<a rel="next" href="#s${id + 1}">next</a>`}
</nav>
		`);

		// render Markdown
		find(slide, MARKDOWN_SELECTOR).forEach(renderMarkdown);

		// syntax highlighting
		Prism.highlightAll();
	});
}

function togglePresentationMode() {
	let root = document.querySelector(ROOT_SELECTOR);
	let toggle = root.querySelector(`.${TOGGLE_CLASS}`);

	let alt = toggle.getAttribute("data-alt");
	toggle.setAttribute("data-alt", toggle.textContent);
	toggle.textContent = alt;

	root.classList.toggle("presentation");

	// ensure the correct slide is displayed
	document.location = document.location.toString();
}

// `direction` is either `"prev"` or `"next"`
function cycle(direction) {
	let slideSelector = `${ROOT_SELECTOR} ${SLIDE_TAG}`; // XXX: breaks encapsulation
	let currentSlide = document.querySelector(":target") ||
			document.querySelector(slideSelector);

	let link = currentSlide.querySelector(`.${NAV_CLASS} a[rel=${direction}]`);
	let uri = link && link.href;

	if(!uri) {
		let slides = find(document.body, slideSelector); // XXX: scope implies layout assumptions
		let i = direction === "prev" ? slides.length - 1 : 0;
		uri = `#${slides[i].id}`;
	}

	document.location = uri;
}
