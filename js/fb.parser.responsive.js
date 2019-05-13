/** @module FormsBuilder.Parser */
/**
* Modulo que realiza la lectura de los nodos del XML y llama
* a los plugins necesarios para generar el HTML
*
* (c) SAT 2013, Iván González
*/
/*global namespace:false, FormsBuilder:false, SAT: false, AppDeclaracionesSAT:false, ko:false, Base64:false */

"use strict";

(function () {
	namespace("FormsBuilder.Parser", parse, groupsParse, columnsParse, controlsParse, getDataProp, getSeccionesUI);
	window.fbParser = FormsBuilder.Parser;

	// Constants
	var GROUP_LAYOUT = 'control[tipoControl="Grupo"]';
	var COLUMN_LAYOUT = 'control[tipoControl="Columna"]';
	var CONTROLS_LAYOUT = 'control';

	var LABEL_GROUP = 'etiqueta';
	var FORM_LAYOUT = 'formulario > controles';
	var FORM_ROOT_LAYOUT = 'formulario';

	var PANEL_LAYOUT = 'panel-default';
	var PANEL_HEADING_LAYOUT = 'panel-heading > h4 > a';

	var LIST_SECTIONS_LAYOUT = 'lt-sections';

	// Variables
	var idPanel = 1; //Initial number for panels
	var idSubmenu = 1;
	var data_prop = [];
	var seccionesUI = {};

	function getDataProp() {
		return data_prop;
	}

	function getSeccionesUI(key) {
		return seccionesUI[key];
	}

	function parse(xmlDoc, callback) {
		var domGen = '';

		$('.panel-sections .panel-title').html($(xmlDoc).find('formulario').attr('nombre'));

		FormsBuilder.Catalogs.init(xmlDoc);
		FormsBuilder.XMLForm.init(xmlDoc);

		var groups = $(xmlDoc).find(FORM_LAYOUT).children(GROUP_LAYOUT);
		domGen += groupsParse(groups);

		setTimeout(function() { // Remove
			var secciones = fbXmlForm.getCopy().find('navegacion seccion');
			$.each(secciones, function(k, v) {
				var id = $(v).attr('idControlFormulario');
				var ocultar = $(v).attr('ocultar');
				var idEntidad = fbXmlForm.getCopy().find('diagramacion > formulario').find('control[id="{0}"]'.format(id)).attr('idEntidadPropiedad');

				if (ocultar !== "1") {
					$('#htmlOutput').children('div[idEntidadPropiedad="{0}"]'.format(idEntidad)).show();
				}
				
				var inhabilitarEnSelector = $(v).attr('inhabilitarEnSelector');
				if (inhabilitarEnSelector === "1") {
					$('#htmlOutput').children('div[idEntidadPropiedad="{0}"]'.format(idEntidad)).attr('inhabilitarEnSelector','inhabilitarEnSelector');
				}
			});
		}, 150);

		navigationGroupMenuParse(xmlDoc);

		callback(domGen);
	}

	function navigationGroupMenuParse(xmlDoc) {
		var FORM_LAYOUT_NAV = 'navegacion > agrupador';
		var groups_nav = $(xmlDoc).find(FORM_LAYOUT_NAV);

		$.each(groups_nav, function (key, group_nav) {
			var idEntidadPropiedad = $(group_nav).attr('idEntidadPropiedad');
			var idPropiedad = $(group_nav).attr('idPropiedad');

			var db_id;
			if (idPropiedad !== undefined) {
				db_id = "E{0}P{1}".format(idEntidadPropiedad, idPropiedad);
				data_prop.push(db_id);
			}
		});
	}

	function groupsParse(groups) {
		var domGenerated = '';
		$.each(groups, function (key, group) {
			var panelNewDiv;
			if ($(group).parents().eq(1)[0].nodeName === FORM_ROOT_LAYOUT) {
				panelNewDiv = $('<div><div class="panel panel-default ficha-collapse"><div class="panel-heading" role="tab"><h4 class="panel-title"><a role="button" data-toggle="collapse" data-parent="#accordion" href="#collapseOne" aria-expanded="true" aria-controls="collapseOne">Datos generales</a></h4></div><div id="collapseOne" class="panel-collapse collapsing" role="tabpanel" aria-labelledby="headingOne"><div class="panel-body"></div></div></div></div>'.format(PANEL_LAYOUT));
			} else {
				var tituloLargoGroup = $(group).children('atributos').children('atributo[nombre="TituloLargo"]').attr('valor');
				var styleTituloGrupo = '';
				var styleH5 = '';
				if (tituloLargoGroup !== undefined) {
					styleTituloGrupo = 'border-left: solid 1px lightgray; border-top: solid 1px lightgray; border-right: solid 1px lightgray; margin-bottom: 2px;';
					styleH5 = 'background-color: lightgray; padding: 5px;';
				}

				panelNewDiv = $('<div><div style="{0}" class="panel-body"><h5 style="{1}" tituloGrupo="">{2}</h5></div></div>'.format(styleTituloGrupo, styleH5, tituloLargoGroup || ''));
			}

			if ($(group).children('atributos').children('atributo[nombre="ocultar"]').attr('valor') === "1") {
				panelNewDiv.find('.' + PANEL_LAYOUT).hide();
			}

			if ($(group).parents().eq(1)[0].nodeName === FORM_ROOT_LAYOUT) {
				var identifier = "A{0}".format($(group).attr('id'));
				panelNewDiv.find('.' + PANEL_LAYOUT).attr("id", identifier);
				panelNewDiv.find('.' + PANEL_LAYOUT).attr("idEntidadPropiedad", $(group).attr('idEntidadPropiedad'));
				panelNewDiv.find('.' + PANEL_LAYOUT).hide();
				panelNewDiv.find('.' + PANEL_HEADING_LAYOUT).attr('href', '#collapse' + identifier);
				panelNewDiv.find('#collapseOne').attr('id', 'collapse' + identifier);
				seccionesUI[$(group).attr('idEntidadPropiedad')] = identifier;

				FormsBuilder.ViewModel.getFlujoSecciones()[$(group).attr('idEntidadPropiedad')] = {};
				FormsBuilder.ViewModel.getFlujoSecciones()[$(group).attr('idEntidadPropiedad')]['EntroSeccion'] = false;
			}

			var title = $(group).children('atributos').find('atributo[nombre="TituloLargo"]');
			if (title.length > 0) {
				if ($(group).parents().eq(1)[0].nodeName === FORM_ROOT_LAYOUT) {
					var tempBotones = '';
					var botonesExtras = '';

					panelNewDiv.find('.' + PANEL_HEADING_LAYOUT).html('{0}'.format(title.attr('valor')));
					panelNewDiv.find('.panel-heading > h4').append('{0}'.format(tempBotones + botonesExtras));
				} else {
					panelNewDiv.find('.' + PANEL_HEADING_LAYOUT).html(title.attr('valor'));
				}
			}

			var columns = $(group).children('controles').children(COLUMN_LAYOUT);
			panelNewDiv = columnsParse(columns, panelNewDiv);

			domGenerated += panelNewDiv.html();
		});

		return domGenerated;
	}

	function columnsParse(columns, panelNewDiv) {
		$.each(columns, function (key, column) {
			var childGroups = $(column).children('controles').children(GROUP_LAYOUT);

			var containerDiv = $('<div><div class="bd"></div></div>');
			if ($(column).attr('width') !== undefined) {
				containerDiv.find('.bd').addClass('col-sm-12');
			} else {
				if (columns.length === 1) {
					containerDiv.find('.bd').addClass('col-sm-12');
				} else {
					var number = 12 / columns.length;
					containerDiv.find('.bd').addClass('col-sm-'+number);
				}
			}

			if (childGroups.length <= 0) {
				var controlHtml = controlsParse(column);

				containerDiv.find('.bd:first').append(controlHtml);
			} else {
				var childRecursiveNodes = groupsParse(childGroups);
				containerDiv.find('.bd:first').append(childRecursiveNodes);
			}
			panelNewDiv.find('.panel-body:first').append(containerDiv.html());
		});

		return panelNewDiv;
	}

	function controlsParse(column) {
		var controls = $(column).children('controles').children(CONTROLS_LAYOUT);
		var controlHtml = '';
		$.each(controls, function (key, control) {
			controlHtml += FormsBuilder.HTMLBuilder.generate(control);
		});

		return controlHtml;
	}
})();
