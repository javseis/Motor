/** @module FormsBuilder.Modules */
/**
* Modulo para el render de formularios que crea una caja de texto
* 
* (c) SAT 2013, Iván González
*/
/*global namespace:false, FormsBuilder:false, SAT: false, AppDeclaracionesSAT:false, ko:false, Base64:false */

"use strict";

(function() {
	namespace("FormsBuilder.Modules", CuadroVerificacion);

	var CONTROL_LAYOUT = 'input';
	var LABEL_LAYOUT = 'texto';

	function CuadroVerificacion(control) {
		var ctrlBase = FormsBuilder.Modules.ControlBase();
		var db_id = FormsBuilder.Utils.getDbId2(control);

		var rowNewDiv = $('<div><div style="display: table; overflow: hidden;" class="sat-height-field"><div style="display: table-cell; vertical-align: bottom;"></div></div><input class="form-control sat-height-field" type="checkbox"><span class="ic-help"></span><div class="clear"></div></div>');

		var entidad = Enumerable.From(FormsBuilder.XMLForm.getEntidades()).Where("$.id == {0}".format(control.idEntidadPropiedad)).FirstOrDefault();
		var atributo = Enumerable.From(entidad.propiedades.propiedad).Where("$.id == '{0}'".format(control.idPropiedad)).FirstOrDefault();

		var titleLarge = Enumerable.From(atributo.atributos.atributo).Where("$.nombre == 'TituloLargo'").FirstOrDefault();
		var helpText = ctrlBase.getHelpText.apply(this, [control]);

		rowNewDiv.find(CONTROL_LAYOUT).attr('id', control.id);
		rowNewDiv.find(".sat-height-field").children().attr('data-titulo-control', control.id);
		
		var title;
		if (SAT.Environment.settings('isDAS')) {
			if(control.atributos !== undefined )
			{
				title = Enumerable.From(control.atributos.atributo).Where("$.nombre == 'TituloCorto'").FirstOrDefault();    
			}
			
			title = title !== undefined ? title : Enumerable.From(atributo.atributos.atributo).Where("$.nombre == 'TituloCorto'").FirstOrDefault();
		} else {
			title = Enumerable.From(atributo.atributos.atributo).Where("$.nombre == 'TituloCorto'").FirstOrDefault();
		}
		ctrlBase.sinEtiqueta.apply(this, [control, rowNewDiv, title]);

		var paneldinamico;
		if(atributo.atributos.atributo !== undefined)
		{
			paneldinamico = Enumerable.From(atributo.atributos.atributo).Where("$.nombre == 'TituloLargo'").FirstOrDefault();
		}

		if(paneldinamico !== undefined)
		{
			rowNewDiv.find(CONTROL_LAYOUT).attr('PanelDinamico', paneldinamico.valor);
		}

		ctrlBase.noValidarCampoVacio.apply(this, [control, rowNewDiv, CONTROL_LAYOUT]);

		ctrlBase.ordenTabulador.apply(this, [control, rowNewDiv, CONTROL_LAYOUT]);

		ctrlBase.sinTitulo.apply(this, [control, rowNewDiv]);

		var helpString = ctrlBase.helpString.apply(this, [titleLarge, helpText]);

		rowNewDiv.find(CONTROL_LAYOUT).attr('help-text', helpString);
		rowNewDiv.find(CONTROL_LAYOUT).attr('data-bind', 'checked: {0}'.format(db_id));
		rowNewDiv.find(CONTROL_LAYOUT).attr('view-model', db_id);
		return rowNewDiv.html();
	}
})();