/* eslint-env browser */
import Prism from "./prism_shim";
import renderMarkdown from "./markdown";
import { find } from "uitil/dom";
import { html2dom as html } from "uitil/dom/create";

export default class Quaynaut extends HTMLElement {
	connectedCallback() {
		let { markdownSelector, slideTag } = this;
		let toggle = html`<a class="${this.toggleClass}"
				href="#${this.idPrefix}1" data-alt="📽️">📃</a>`;

		// transform Markdown-only slide elements
		find(this, markdownSelector).forEach(md => {
			if(md.closest(slideTag)) { // XXX: inefficient
				return;
			}
			// add slide wrapper to ensure consistent markup
			let slide = document.createElement(slideTag);
			md.parentNode.insertBefore(slide, md);
			slide.appendChild(md);
			// transfer attributes
			let attribs = [].slice.call(md.attributes);
			attribs.forEach(({ name, value }) => {
				if(name === "data-markdown") { // XXX: breaks selector encapsulation
					return;
				}
				slide.setAttribute(name, value);
				md.removeAttribute(name);
			});
		});

		let slides = find(this, slideTag);
		let penultimate = slides.length - 1;
		slides.forEach((slide, i) => {
			if(i === 0) {
				slide.appendChild(toggle);
			}

			// generate ID -- TODO: account for existing IDs (incl. prev/next below)
			let id = i + 1;
			slide.id = this.idPrefix + id;

			// generate navigation links
			slide.appendChild(html`
<nav class="${this.navClass}">
	${i !== 0 && // eslint-disable-next-line indent
			`<a rel="prev" href="#${this.idPrefix}${id - 1}">previous</a>`}
	<a rel="self" href="#${this.idPrefix}${id}">slide ${id}</a>
	${i !== penultimate && // eslint-disable-next-line indent
			`<a rel="next" href="#${this.idPrefix}${id + 1}">next</a>`}
</nav>
			`);

			// render Markdown
			find(slide, markdownSelector).forEach(renderMarkdown);

			// syntax highlighting
			Prism.highlightAll();
		});

		this.onKeypress = this.onKeypress.bind(this);
		document.addEventListener("keydown", this.onKeypress);
		toggle.addEventListener("click", ev => this.togglePresentationMode(true));
	}

	disconnectedCallback() {
		document.removeEventListener("keydown", this.onKeypress);
	}

	onKeypress(ev) {
		switch(ev.keyCode) {
		case 37: // left
			this.cycle("prev");
			break;
		case 39: // right
			this.cycle("next");
			break;
		case 80: // p
			this.togglePresentationMode();
			break;
		}
	}

	togglePresentationMode(link) {
		// swap label
		let toggle = this.querySelector(`.${this.toggleClass}`);
		let alt = toggle.getAttribute("data-alt");
		toggle.setAttribute("data-alt", toggle.textContent);
		toggle.textContent = alt;

		this.classList.toggle("presentation");

		// ensure the correct slide is displayed
		if(!link) { // function doubles as link's event handler
			let uri = document.location.toString();
			document.location = uri.indexOf("#") === 0 ? uri : `#${this.idPrefix}1`;
		}
	}

	// `direction` is either `"prev"` or `"next"`
	cycle(direction) {
		let current = this.querySelector(":target") || this.querySelector(this.slideTag);
		let link = current.querySelector(`.${this.navClass} a[rel=${direction}]`);
		let uri = link && link.href;
		if(uri) {
			this.select(null, uri);
		} else {
			let slides = find(this, this.slideTag);
			let i = direction === "prev" ? slides.length - 1 : 0;
			this.select(slides[i].id);
		}
	}

	select(id, uri) {
		document.location = uri || `#${id}`;
	}

	get markdownSelector() {
		return "pre[data-markdown]";
	}

	get toggleClass() {
		return "quaynaut-toggle";
	}

	get navClass() {
		return "quaynaut-nav";
	}

	get slideTag() {
		return "article";
	}

	get idPrefix() {
		return "s";
	}
}
