/** @module FormsBuilder.Modules */
/**
* Modulo para el render de formularios que crea una caja de texto
* 
* (c) SAT 2013, Iván González
*/
/*global namespace:false, FormsBuilder:false, SAT: false, AppDeclaracionesSAT:false, ko:false, Base64:false */

"use strict";

(function() {
	namespace("FormsBuilder.Modules", CuadroVerificacionLista);

	var CONTROL_LAYOUT = 'div:last';
	var LABEL_LAYOUT = 'texto';

	function CuadroVerificacionLista(control) {

		var ctrlBase = FormsBuilder.Modules.ControlBase();
		var db_id = FormsBuilder.Utils.getDbId2(control);

		var detalleCheckbox = FormsBuilder.ViewModel.getDetalleCheckbox();
		detalleCheckbox[db_id] = {};

		var rowNewDiv = $('<div><div style="display: table; overflow: hidden;" class="sat-height-field"><div style="display: table-cell; vertical-align: bottom;"></div></div><div></div></div>');

		rowNewDiv.find('input').attr('id', control.id);

		var entidad = Enumerable.From(FormsBuilder.XMLForm.getEntidades()).Where("$.id == {0}".format(control.idEntidadPropiedad)).FirstOrDefault();        
        var atributo = Enumerable.From(entidad.propiedades.propiedad).Where("$.id == '{0}'".format(control.idPropiedad)).FirstOrDefault();

		var catalogo;
		var catalogoValorInicial;
		var titleLarge;
		if(atributo.atributos.atributo !== undefined)
		{
			catalogo = Enumerable.From(atributo.atributos.atributo).Where("$.nombre == 'Catalogo'").FirstOrDefault();
			catalogoValorInicial = Enumerable.From(atributo.atributos.atributo).Where("$.nombre == 'ValorInicial'").FirstOrDefault();
			titleLarge =Enumerable.From(atributo.atributos.atributo).Where("$.nombre == 'TituloLargo'").FirstOrDefault(); 
		}
		
		var helpText = ctrlBase.getHelpText.apply(this, [control]);

		var elementAdding = '';
		if(catalogo != undefined)
		{
			$.each(FormsBuilder.Catalogs.getAll().find('[id="{0}"]'.format(catalogo.attr('valor'))).find("elemento"), function(k, v) {
				elementAdding += '<span class="chlist"><input class="chckbx" onclick="changevalue(this, {0})" vmvalue="{1}" type="checkbox"> <label class="lbl-chckbx">{2}</label></span>'.format(($(v).attr('valor') === '' ? 0 : $(v).attr('valor')), db_id, $(v).attr(LABEL_LAYOUT));
			});
		}

		rowNewDiv.find(CONTROL_LAYOUT).append(elementAdding);
		rowNewDiv.find(CONTROL_LAYOUT).attr('id', control.id);
		
		var title;
		if (SAT.Environment.settings('isDAS'))
		{
			if(control.atributos!== undefined )
			{
				title = Enumerable.From(control.atributos.atributo).Where("$.nombre == 'TituloCorto'").FirstOrDefault();    
			}
			
			title = title !== undefined ? title : Enumerable.From(atributo.atributos.atributo).Where("$.nombre == 'TituloCorto'").FirstOrDefault();
		} else {
			title = Enumerable.From(atributo.atributos.atributo).Where("$.nombre == 'TituloCorto'").FirstOrDefault();
		}
		
		var sinEtiqueta;

		if(control)
		sinEtiqueta = Enumerable.From(control.atributos.atributo).Where("$.nombre == 'SinEtiqueta'").FirstOrDefault();

		if(control.atributos !== undefined)
		{
			var negrita = Enumerable.From(control.atributos.atributo).Where("$.nombre == 'Negritas'").FirstOrDefault();

			if(negrita !== undefined)
			{
				rowNewDiv.find('div:first').html("<b>{0}</b>".format(title.valor));
			} 
			else 
			{
				rowNewDiv.find('div:first').html(title.valor);
			}
		}

		var paneldinamico;
		if(atributo.atributos.atributo !== undefined)
		{
			paneldinamico = Enumerable.From(atributo.atributos.atributo).Where("$.nombre == 'TituloLargo'").FirstOrDefault();
		}

		if(paneldinamico !== undefined)
		{
			rowNewDiv.find(CONTROL_LAYOUT).attr('PanelDinamico', paneldinamico.valor);
		}

		ctrlBase.ordenTabulador.apply(this, [control, rowNewDiv, CONTROL_LAYOUT]);

		ctrlBase.sinTitulo.apply(this, [control, rowNewDiv]);
		var helpString = ctrlBase.helpString.apply(this, [titleLarge, helpText]);

		rowNewDiv.find(CONTROL_LAYOUT).attr('help-text', helpString);
		rowNewDiv.find('input').attr('view-model', db_id);

		return rowNewDiv.html();
	}
}) ();
