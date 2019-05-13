/** @module FormsBuilder.Modules */
/**
* Modulo para el render de formularios que crea un control oculto
* 
* (c) SAT 2013, Iván González
*/
/*global namespace:false, FormsBuilder:false, SAT: false, AppDeclaracionesSAT:false, ko:false, Base64:false */

"use strict";

(function() {
	namespace("FormsBuilder.Modules", Oculto);

	var CONTROL_LAYOUT = 'input';

	function Oculto(control) {
		var ctrlBase = FormsBuilder.Modules.ControlBase();
		var db_id = FormsBuilder.Utils.getDbId2(control);

		var rowNewDiv = $('<div><input type="hidden" class="form-control" id=""></div>');

		var entidad = Enumerable.From(FormsBuilder.XMLForm.getEntidades()).Where("$.id == {0}".format(control.idEntidadPropiedad)).FirstOrDefault();
		var atributo = Enumerable.From(entidad.propiedades.propiedad).Where("$.id == '{0}'".format(control.idPropiedad)).FirstOrDefault();

		var copiadoDesde;
		if(control.atributos !== undefined)
		{
			copiadoDesde = Enumerable.From(control.atributos.atributo).Where("$.nombre == 'CopiadoDesde'").FirstOrDefault();
		}
		
		if (copiadoDesde !== undefined) {
			rowNewDiv.find(CONTROL_LAYOUT).attr('copiadoDesde', copiadoDesde.valor);
		}

		if (atributo.tipoDatos === 'Numerico') {
			rowNewDiv.find(CONTROL_LAYOUT).addClass('currency');
		}

		ctrlBase.muestraEnGrid.apply(this, [control, rowNewDiv, CONTROL_LAYOUT]);
		
		ctrlBase.copiaElementoGrid.apply(this, [control, rowNewDiv, CONTROL_LAYOUT]);

		rowNewDiv.find(CONTROL_LAYOUT).attr('id', control.id);

		rowNewDiv.find(CONTROL_LAYOUT).attr('data-bind', 'value: {0}'.format(db_id));
		rowNewDiv.find(CONTROL_LAYOUT).attr('view-model', db_id);
		return rowNewDiv.html();
	}
})();
