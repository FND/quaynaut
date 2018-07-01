/* eslint-env browser */
import Prism from "./prism_shim";
import renderMarkdown from "./markdown";
import { find } from "uitil/dom";
import { html2dom as html } from "uitil/dom/create";

export default class Quaynaut extends HTMLElement {
	connectedCallback() {
		let { markdownSelector, slideTag } = this;
		let toggle = html`<a class="${this.toggleClass}"
				href="#${this.sid(1)}" data-alt="📽️">📃</a>`;

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
			slide.id = this.sid(id);

			// generate navigation links
			slide.appendChild(html`
<nav class="${this.navClass}">
	${i !== 0 && // eslint-disable-next-line indent
			`<a rel="prev" href="#${this.sid(id - 1)}">previous</a>`}
	<a rel="self" href="#${this.sid(id)}">slide ${id}</a>
	${i !== penultimate && // eslint-disable-next-line indent
			`<a rel="next" href="#${this.sid(id + 1)}">next</a>`}
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
		switch(ev.keyCode) {
		case 37: // left
			this.dispatch("CYCLE:prev");
			break;
		case 39: // right
			this.dispatch("CYCLE:next");
			break;
		case 80: // p
			this.togglePresentationMode();
			break;
		case 83: // s
			this.speakerView();
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
		} else if(msg.indexOf("SELECT:") === 0) {
			let id = msg.substr(7);
			this.select(id);
		}
	}

	dispatch(cmd) {
		let select = direction => {
			let id = this.cycle(direction);
			return `SELECT:${id}`;
		};
		switch(cmd) {
		case "CYCLE:prev":
			cmd = select("prev");
			break;
		case "CYCLE:next":
			cmd = select("next");
			break;
		default: // unknown command
			return;
		}

		let main = this.mainView;
		if(main) { // speaker view acts as remote control for main view
			main.postMessage(cmd, document.location.origin);
		}
	}

	speakerView() {
		let loc = document.location;
		let uri = loc.toString();
		if(uri.indexOf("file://") === 0) {
			alert("speaker view requires Quaynaut to be served via HTTP");
			return;
		}

		let win = window.open(uri);
		win.onload = () => {
			// ensure URI targets a slide -- XXX: hacky
			this.cycle("next");
			this.cycle("prev");

			win.postMessage(`INIT:${loc.hash}`, loc.origin);
		};
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

	cycle(direction) {
		let id = this.rel2abs(direction);
		this.select(id);
		return id;
	}

	// `direction` is either `"prev"` or `"next"`
	rel2abs(direction) {
		let current = this.querySelector(":target") || this.querySelector(this.slideTag);
		let link = current.querySelector(`.${this.navClass} a[rel=${direction}]`);

		let uri = link && link.hash;
		if(uri) {
			return uri.substr(1); // strip leading hash
		}

		let slides = find(this, this.slideTag);
		let i = direction === "prev" ? slides.length - 1 : 0;
		return slides[i].id;
	}

	select(id) {
		document.location = `#${id}`;
	}

	sid(index) { // NB: `index` is 1-based
		return "s" + index;
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
}
