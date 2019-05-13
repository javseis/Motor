/** @module FormsBuilder.Modules */
/**
* Modulo para el render de formularios que crea una caja de texto
* 
* (c) SAT 2013, Iván González
*/
/*global namespace:false, FormsBuilder:false, SAT: false, AppDeclaracionesSAT:false, ko:false, Base64:false */

"use strict";

(function() {
	namespace("FormsBuilder.Modules", ControlVacio);
	
	function ControlVacio(control) {
		var ctrlBase = FormsBuilder.Modules.ControlBase();
		var rowNewDiv = $('<div><div style="display: table; overflow: hidden;" class="sat-height-field"><div style="display: table-cell; vertical-align: bottom;"></div></div><div class="sat-height-field ctlvacio"></div></div>');

		ctrlBase.sinTitulo.apply(this, [control, rowNewDiv]);
		return rowNewDiv.html();
	}
})();
