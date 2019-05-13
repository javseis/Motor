/** @module FormsBuilder.Modules */
/**
* Modulo para el render de formularios que crea una caja de texto
* 
* (c) SAT 2013, Iván González
*/
/*global namespace:false, FormsBuilder:false, SAT: false, AppDeclaracionesSAT:false, ko:false, Base64:false */

"use strict";

(function() {
	namespace("FormsBuilder.Modules", CuadroDetalleCompensaciones, loadedUICompensaciones);

	var CONTROL_LAYOUT = 'input';
	var LABEL_LAYOUT = 'etiqueta';

	function CuadroDetalleCompensaciones(control) {
		var ctrlBase = FormsBuilder.Modules.ControlBase();
		var db_id = FormsBuilder.Utils.getDbId2(control);

		var rowNewDiv;
		if (SAT.Environment.settings('isDAS')) {
			rowNewDiv = $('<div><div style="display: table; overflow: hidden;" class="sat-height-field"><div style="display: table-cell; vertical-align: bottom;"><span class="ic-help"></span></div></div><input type="text" onpaste="return false;" class="form-control sat-height-dlg sat-textbox-dialog sat-comp sat-height-field" style="width: 80% !important;" placeholder="" /><a idinput="{0}" data-toggle-compensaciones="modal" class="btn btn-primary btn-red sat-button-dialog">Detalle</a><div class="clear"></div></div>'.format($(control).attr('id')));
		} else {
			rowNewDiv = $('<div><div style="display: table; overflow: hidden;" class="sat-height-field"><div style="display: table-cell; vertical-align: bottom;"></div></div><input type="text" onpaste="return false;" class="form-control sat-height-dlg sat-textbox-dialog sat-comp sat-height-field" placeholder="" /><a idinput="{0}" data-toggle-compensaciones="modal" class="btn btn-primary btn-red sat-button-dialog">Detalle</a><span class="ic-help"></span><div class="clear"></div></div>'.format($(control).attr('id')));
		}

		rowNewDiv.find(CONTROL_LAYOUT).attr('id', control.id);
		rowNewDiv.find(".sat-height-field").children().attr('data-titulo-control', control.id);

		var entidad = Enumerable.From(FormsBuilder.XMLForm.getEntidades()).Where("$.id == {0}".format(control.idEntidadPropiedad)).FirstOrDefault();        
        var atributo = Enumerable.From(entidad.propiedades.propiedad).Where("$.id == '{0}'".format(control.idPropiedad)).FirstOrDefault();   
		
		var title;
		if (SAT.Environment.settings('isDAS')) {
			if(control.atributos!== undefined )
			{
				title =Enumerable.From(control.atributos.atributo).Where("$.nombre == 'TituloCorto'").FirstOrDefault();    
			}
			
			title = title!== undefined ? title : Enumerable.From(atributo.atributos.atributo).Where("$.nombre == 'TituloCorto'").FirstOrDefault();
		} else {
			title = Enumerable.From(atributo.atributos.atributo).Where("$.nombre == 'TituloCorto'").FirstOrDefault();
		}

		var titleLarge = Enumerable.From(atributo.atributos.atributo).Where("$.nombre == 'TituloLargo'").FirstOrDefault();

		var helpText = ctrlBase.getHelpText.apply(this, [control]);

		rowNewDiv.find('div:first > div').html(title.valor);

		if (atributo.tipoDatos === 'Numerico') {
			rowNewDiv.find(CONTROL_LAYOUT).addClass('currency');
		}

		ctrlBase.alineacionHorizontal.apply(this, [control, rowNewDiv, CONTROL_LAYOUT]);

		ctrlBase.validaLongitud.apply(this, [control, rowNewDiv, CONTROL_LAYOUT]);

		rowNewDiv.find(CONTROL_LAYOUT).attr('cuadrodialogo', '');
		rowNewDiv.find(CONTROL_LAYOUT).attr('onkeydown', 'TabCuadroDetalle(event)');

		ctrlBase.ordenTabulador.apply(this, [control, rowNewDiv, CONTROL_LAYOUT]);

	    //var claveImpuesto = $(control).find('atributo[nombre="ClaveImpuesto"]');
		var claveImpuesto = Enumerable.From(entidad.atributos.atributo).Where("$.nombre == 'ClaveImpuesto'").FirstOrDefault();

		if (claveImpuesto != undefined) {
		    rowNewDiv.find(CONTROL_LAYOUT).attr('claveimpuesto', claveImpuesto.valor || '');
		}
		
		var helpString = ctrlBase.helpString.apply(this, [titleLarge, helpText]);

		rowNewDiv.find(CONTROL_LAYOUT).attr('help-text', helpString);
		rowNewDiv.find(CONTROL_LAYOUT).attr('data-bind', 'valueUpdate: "blur", value: {0}'.format(db_id));
		rowNewDiv.find(CONTROL_LAYOUT).attr('view-model', db_id);
		rowNewDiv.find('a').attr('view-model', db_id);

		return rowNewDiv.html();
	}

	function loadedUICompensaciones() {
		$('#htmlOutput a[data-toggle-compensaciones]').on('click', function() {
			if (SAT.Environment.settings('isDAS') && 
				SAT.Environment.settings('isMobile') && 
				SAT.Environment.settings('isHydrate') === false) {
				$('#modalAvisoCompensaciones').modal('show');
				return;
			}
			
			var campoCompensacion = $(this).parent().find('input[id="{0}"]'.format($(this).attr('idinput')));
			var rfc = AppDeclaracionesSAT.getConfig("rfc");
			FormsBuilder.CompensacionesSAT.initUIModalCompensaciones(rfc, $(campoCompensacion).attr('claveimpuesto'), $(campoCompensacion).attr('view-model'));
		});
    }
})();
