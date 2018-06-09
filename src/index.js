import { find, html2dom as html } from "./util";

let ROOT_SELECTOR = ".quaynaut";
let SLIDE_TAG = "article";
let NAV_CLASS = "quaynaut-nav";
let TOGGLE_CLASS = "quaynaut-toggle";

init();

function init() {
	let root = document.querySelector(ROOT_SELECTOR);
	if(!root) {
		console.warn("Querynaut could not be initialized due to missing root element");
		return;
	}

	let toggle = html`<a class="${TOGGLE_CLASS}" href="#s1" data-alt="📽️">📃</a>`;
	toggle.addEventListener("click", togglePresentationMode);

	// ensure a slide is selected
	if(!document.location.hash) {
		document.location = `${document.location}#s1`;
	}

	let slides = find(SLIDE_TAG, root);
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
