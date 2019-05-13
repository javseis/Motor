/** @module FormsBuilder.Modules */
/**
* Modulo para el render de formularios que crea una lista
* 
* (c) SAT 2013, Iván González
*/
/*global namespace:false, FormsBuilder:false, SAT: false, AppDeclaracionesSAT:false, ko:false, Base64:false */

"use strict";

(function() {
	namespace("FormsBuilder.Modules", ControlConsecutivo);

	function ControlConsecutivo(control) {
		var rowNewDiv = $('<div><span></span></div>');

		rowNewDiv.find('span').append('1');

		return rowNewDiv.html();
	}
})();
