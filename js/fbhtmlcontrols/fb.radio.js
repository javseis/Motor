/** @module FormsBuilder.Modules */
/**
* Modulo para el render de formularios que crear un radio
* 
* (c) SAT 2013, Iván González
*/
/*global namespace:false, FormsBuilder:false, SAT: false, AppDeclaracionesSAT:false, ko:false, Base64:false */

"use strict";

(function() {
	namespace("FormsBuilder.Modules", radio);

	function radio(control) {
		var rowNewDiv = $('<div><input type="radio" class="form-control" id=""><span class="ic-help"></span><div class="clear"></div></div>');

		rowNewDiv.find('input').attr('id', control.id);

		return rowNewDiv.html();
	}
})();
