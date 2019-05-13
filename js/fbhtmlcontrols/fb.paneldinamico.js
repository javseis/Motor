/** @module FormsBuilder.Modules */
/**
* Modulo para el render de formularios que crea un contenedor con
* controles que se repiten en forma de grid.
* 
* (c) SAT 2013, Iván González
*/
/*global namespace:false, FormsBuilder:false, SAT: false, AppDeclaracionesSAT:false, ko:false, Base64:false */

"use strict";

(function() {
	namespace("FormsBuilder.Modules", PanelDinamico, loadedUIPanelDinamico);

	function PanelDinamico(control) {
		var panelNewDiv = $('<div><div class="panel panel-default"><div class="panel-body"></div></div></div>');
		
		var controles = $(control).children('controles').children('control[tipoControl="Grupo"]');
		var htmlRow;

		if (controles.length >= 1) {
			var htmlPanel = $('<div><div class="panel panel-default"></div></div>');
			htmlPanel.find('div:last').append(FormsBuilder.Parser.groupsParse(controles, panelNewDiv));
			htmlRow = $(htmlPanel.html());
		} else {
			controles = $(control).children('controles').children('control[tipoControl="Columna"]');
			htmlRow = FormsBuilder.Parser.columnsParse($(controles), panelNewDiv);
		}

		var htmlRow1 = $('<div><div class="panel panel-default"><div class="panel-body"></div><div class="panels"></div></div></div>');
		var pnls = htmlRow.find('.panel-body:first').find('.panel');

		$.each(pnls, function (key, pnl) {
			if (key === 0) {
				htmlRow1.children('.panel').children('.panel-body').prepend($(pnl).find('.panel-body').html());
			} else {
				var uuid = guid().substring(0, 8);
				var attrTitulo = $(control).find('control[tipoControl="Grupo"]').find('atributo[nombre="Panel"][valor="{0}"]'.format($(pnl).attr('PanelDinamico')));
				var tituloPanel = attrTitulo.parent().find('atributo[nombre="TituloCorto"]').attr('valor');

				var accordion = $('<div class="panel-group" id="accordion" paneldinamico="{0}"></div>'.format($(pnl).attr('PanelDinamico')));
				var panel1 = $('<div class="panel panel-default"><div class="panel-heading"><h4 class="panel-title"><a data-toggle="collapse" data-toggle="true" href="#Key{0}">{1}</a></h4></div>'.format(uuid, tituloPanel));
				accordion.append(panel1);
				var panel2 = $('<div id="Key{0}" class="panel-collapse collapse in"><div class="panel-body"></div></div>'.format(uuid));
				accordion.append(panel2);
				accordion.find('.panel-body').html($(pnl).find('.panel-body').html());

				htmlRow1.children('.panel').find('.panels').append(accordion);
			}
		});

		htmlRow1.children('.panel').addClass('panel-pag').prepend('<div class="panel-heading"><button type="button" class="btn btn-danger btncollapse" data-toggle="collapse" style="float: right;"><i class="icon-arrow-up"></i></button><div style="clear: both;"></div></div>');
		htmlRow1.find('.panel[paneldinamico]').hide();
		return htmlRow1.html();
	}

	function loadedUIPanelDinamico () {
		$('button.btncollapse').on('click', function () {
			var panels = $(this).parents().eq(1).find('.panel-group > .panel-collapse');
			panels.collapse('hide');
		});

		$('input[paneldinamico]').on('change', function () {
			var control = $(this).parents().eq(3).find('.panel-group[paneldinamico="{0}"]'.format($(this).attr('paneldinamico')));

			if (this.checked === false) {
				var controles = control.find('[view-model]');
				var db_id = controles.attr('view-model');
				var entidad = db_id.split('P')[0].replace('E', '');

				if (db_id.indexOf('_') > 0) {
					var numeroFila = db_id.split('_')[1];

					var detalleGrid = FormsBuilder.ViewModel.getDetalleGrid()[entidad];
					detalleGrid.find = findByAction;

					var findFunc = function (element) {
						var objProps = Object.getOwnPropertyNames(element);
						return objProps[0].split('_')[1] === numeroFila;
					};

					var fila = detalleGrid.find(findFunc);
					fila.findByProperty = findByProperty;

					$.each(controles, function(key, ctrl) {
						var findFuncObj = function (element) {
							return element === $(ctrl).attr('view-model');
						};
						fila.findByProperty(findFuncObj)('');
					});
				} else {
					FormsBuilder.ViewModel.get()[entidad][db_id]('');
				}
			}

			this.checked ? control.show() : control.hide();
		});
	}
})();
