/** @module FormsBuilder.HTMLBuilder */
/**
* Modulo principal del render de Javascript para la applicacion
* de declaraciones del sat (Declara SAT)
*
* (c) SAT 2013, Iván González
*/
/*global namespace:false, FormsBuilder:false, SAT: false, AppDeclaracionesSAT:false, ko:false, Base64:false */

"use strict";

(function() {
	namespace("FormsBuilder.HTMLBuilder", generate);
	window.fbHtmlBuilder = FormsBuilder.HTMLBuilder;

	var CONTROL_TYPE = "tipoControl";

	function generate(control) {
		var html = '';

		if (FormsBuilder.Modules.hasOwnProperty(control.tipoControl)) {
			var widget = FormsBuilder.Modules[control.tipoControl];
			console.log(control.tipoControl);
			html = widget.call(widget, control);
		}

		return html;
	}
})();
