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

		this.onMessage = this.onMessage.bind(this);
		this.onKeypress = this.onKeypress.bind(this);
		window.addEventListener("message", this.onMessage);
		document.addEventListener("keydown", this.onKeypress);
		toggle.addEventListener("click", ev => this.togglePresentationMode(true));
	}

	disconnectedCallback() {
		window.removeEventListener("message", this.onMessage);
		document.removeEventListener("keydown", this.onKeypress);
	}

	onKeypress(ev) {
		let key = ev.keyCode;
		let main = this.mainView;
		if(main) { // speaker view acts as remote control for main view
			// FIXME: when not using keyboard controls within speaker view, both
			//        views might get out of sync - this could be fixed by
			//        sending absolute slide IDs instead of relative commands
			let cmd = { // XXX: DRY
				37: "CYCLE:prev",
				39: "CYCLE:next"
			}[key];
			if(!cmd) {
				return;
			}
			main.postMessage(cmd, document.location.origin);
		}

		switch(key) {
		case 37: // left
			this.cycle("prev");
			break;
		case 39: // right
			this.cycle("next");
			break;
		case 80: // p
			this.togglePresentationMode();
			break;
		case 83: // s
			let loc = document.location;
			let uri = loc.toString();
			if(uri.indexOf("file://") === 0) {
				alert("speaker view requires Quaynaut to be served via HTTP");
				break;
			}

			let speakerView = window.open(uri);
			speakerView.onload = () => {
				// ensure URI targets a slide -- XXX: hacky
				this.cycle("next");
				this.cycle("prev");
				speakerView.postMessage(`INIT:${loc.hash}`, loc.origin);
			};
			break;
		}
	}

	onMessage(ev) {
		if(ev.origin !== document.location.origin) { // ignore unsolicited messages
			return;
		}

		let msg = ev.data;
		if(msg.indexOf("INIT:") === 0) { // initialize speaker view
			let uri = msg.substr(5);
			if(uri.indexOf("#") !== 0) {
				throw new Error(`unexpected initialization parameter: \`${msg}\``);
			}
			document.location.hash = uri;
			this.classList.add("speaker-view");
			this.mainView = ev.source;
			return;
		}
		switch(msg) {
		case "CYCLE:prev":
			this.cycle("prev");
			break;
		case "CYCLE:next":
			this.cycle("next");
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
			// XXX: hacky
			this.cycle("next");
			this.cycle("prev");
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
