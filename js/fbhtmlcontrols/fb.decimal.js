/** @module FormsBuilder.Modules */
/**
* Modulo para el render de formularios que crea una caja de texto
* 
* (c) SAT 2013, Iván González
*/
/*global namespace:false, FormsBuilder:false, SAT: false, AppDeclaracionesSAT:false, ko:false, Base64:false */

"use strict";

(function() {
	namespace("FormsBuilder.Modules", ControlDecimal);

	var CONTROL_LAYOUT = 'input';
	var LABEL_LAYOUT = 'etiqueta';

	function ControlDecimal(control) {
		var ctrlBase = FormsBuilder.Modules.ControlBase();
		var db_id = FormsBuilder.Utils.getDbId2(control);

		var rowNewDiv;
		if (SAT.Environment.settings('isDAS')) {
			rowNewDiv = $('<div><div style="display: table; overflow: hidden;" class="sat-height-field"><div style="display: table-cell; vertical-align: bottom;"><span class="ic-help"></span></div></div><input onpaste="return false;" ondragover="allowDrop(event)" ondragstart="blanktext(event.dataTransfer)" type="text" class="form-control sat-height-field" placeholder=""><div class="clear"></div></div>');
		} else {
			rowNewDiv = $('<div><div style="display: table; overflow: hidden;" class="sat-height-field"><div style="display: table-cell; vertical-align: bottom;"></div></div><input onpaste="return false;" ondragover="allowDrop(event)" ondragstart="blanktext(event.dataTransfer)" type="text" class="form-control sat-height-field" placeholder=""><span class="ic-help"></span><div class="clear"></div></div>');
		}

		rowNewDiv.find(CONTROL_LAYOUT).attr('id', control.id);
		rowNewDiv.find(".sat-height-field").children().attr('data-titulo-control', control.id);

		var entidad = Enumerable.From(FormsBuilder.XMLForm.getEntidades()).Where("$.id == {0}".format(control.idEntidadPropiedad)).FirstOrDefault();        
        var atributo = Enumerable.From(entidad.propiedades.propiedad).Where("$.id == '{0}'".format(control.idPropiedad)).FirstOrDefault();

		var title;
		if (SAT.Environment.settings('isDAS')) {
			if(control.atributos !== undefined )
			{
				title =Enumerable.From(control.atributos.atributo).Where("$.nombre == 'TituloCorto'").FirstOrDefault();    
			}
			
			title = title !== undefined ? title : Enumerable.From(atributo.atributos.atributo).Where("$.nombre == 'TituloCorto'").FirstOrDefault();
		} else {
			title = Enumerable.From(atributo.atributos.atributo).Where("$.nombre == 'TituloCorto'").FirstOrDefault();
		}

		var titleLarge = Enumerable.From(atributo.atributos.atributo).Where("$.nombre == 'TituloLargo'").FirstOrDefault();
		var helpText = ctrlBase.getHelpText.apply(this, [control]);
		
		ctrlBase.muestraEnGrid.apply(this, [control, rowNewDiv, CONTROL_LAYOUT]);
		
		ctrlBase.sinEtiqueta.apply(this, [control, rowNewDiv, title]);

		ctrlBase.alineacionHorizontal.apply(this, [control, rowNewDiv, CONTROL_LAYOUT]);

		ctrlBase.ordenTabulador.apply(this, [control, rowNewDiv, CONTROL_LAYOUT]);

		ctrlBase.validaLongitud.apply(this, [control, rowNewDiv, CONTROL_LAYOUT]);

		ctrlBase.autoCompletarEnteros.apply(this, [control, rowNewDiv, CONTROL_LAYOUT]);
	    
		ctrlBase.mostrarDecimales.apply(this, [control, rowNewDiv, CONTROL_LAYOUT]);

		rowNewDiv.find(CONTROL_LAYOUT).attr('onkeydown', 'SoloNumerosDecimales(event)');
		
		ctrlBase.obligatorio.apply(this, [control, rowNewDiv, CONTROL_LAYOUT]);

		ctrlBase.sinTitulo.apply(this, [control, rowNewDiv]);

		ctrlBase.forzarModoEdicion.apply(this, [control, rowNewDiv, CONTROL_LAYOUT]);
		
		ctrlBase.alineacionTexto.apply(this, [control, rowNewDiv, CONTROL_LAYOUT]);
		
		ctrlBase.copiaElementoGrid.apply(this, [control, rowNewDiv, CONTROL_LAYOUT]);
		
		var helpString = ctrlBase.helpString.apply(this, [titleLarge, helpText]);

		rowNewDiv.find(CONTROL_LAYOUT).attr('help-text', helpString);
		rowNewDiv.find(CONTROL_LAYOUT).attr('data-bind', 'valueUpdate: "blur", value: {0}'.format(db_id));
		rowNewDiv.find(CONTROL_LAYOUT).attr('view-model', db_id);

		return rowNewDiv.html();
	}
})();
