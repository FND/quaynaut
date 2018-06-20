/* eslint-env browser */
import Quaynaut from "./deck";

document.addEventListener("DOMContentLoaded", () => {
	if(!window.customElements) {
		console.warn("Querynaut could not be initialized due to missing browser support");
		return;
	}

	customElements.define("quay-naut", Quaynaut);
});
