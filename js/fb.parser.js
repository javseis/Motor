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
	var PANEL_HEADING_LAYOUT = 'panel-heading';

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

		navigationGroupMenuParse(xmlDoc);

		callback(domGen);
	}

	function navigationGroupMenuParse(xmlDoc) {
		var FORM_LAYOUT_NAV = 'navegacion > agrupador';
		var GROUP_LAYOUT_NAV = 'seccion';
		var groups_nav = $(xmlDoc).find(FORM_LAYOUT_NAV);

		groups_nav = groups_nav.toArray().sort(function (a, b) {
			return parseInt($(a).attr('Orden')) - parseInt($(b).attr('Orden'))
		});

		$.each(groups_nav, function (key, group_nav) {
			var title = $(group_nav).attr('titulo');
			var id = $(group_nav).attr('id');
			var idEntidadPropiedad = $(group_nav).attr('idEntidadPropiedad');
			var idPropiedad = $(group_nav).attr('idPropiedad');

			var db_id;
			if (idPropiedad !== undefined) {
				db_id = "E{0}P{1}".format(idEntidadPropiedad, idPropiedad);
				data_prop.push(db_id);
				$('.panelmoney').append('<div class="col-lg-12 line-D-gray"><span>{0}</span><span field-bind="{1}"></span></div>'.format(title, db_id));
			}

			var idTipoAgrupador = $(group_nav).attr('idTipoAgrupador');
			var lenAgrupadores = $(group_nav).parent().find('[idTipoAgrupador="{0}"]'.format(idTipoAgrupador)).length;

			var classText = lenAgrupadores > 4 ? 'hidden' : '';
			var icono = $(group_nav).attr('icono') !== undefined ? "/Content/imgs/{0}.png".format($(group_nav).attr('icono')) : '';

			$('.tabsmenu[idTab="{0}"]'.format(idTipoAgrupador)).append('<li class=""><a idSubmenu="{0}" href="#"><img src="{1}" /><span class="{2}">{3}</span></a></li>'.format(idSubmenu, icono, classText, title));
			$('.container-submenus').append('<div class="submenu hide" idSubmenu="{0}"><nav><ul></ul></nav></div>'.format(idSubmenu));

			if (lenAgrupadores > 4) {
				$('.tabsmenu[idTab="{0}"] > li:last'.format(idTipoAgrupador)).tooltip({ title: title, placement: 'auto', trigger: 'hover focus' });
			}

			var list = $('.container-submenus .submenu:last ul:first');
			var sections = $(group_nav).find(GROUP_LAYOUT_NAV);
			$.each(sections, function (key, section) {
				var isOculto = $(section).attr("ocultar");
				var sectionTitle = $(section).attr('tituloSeccion');
				list.append('<li class="{0}"><a idPanel="{1}" class="">{2}<span></span></a></li>'.format(isOculto ? "hidden" : "", 'A' + $(section).attr('idControlFormulario'), sectionTitle || '--- Sin titulo ---'));
			});
			if (list.find('li').not('.hidden').length === 0) {
				$('.containerTabs a[idsubmenu="{0}"]'.format(list.parents().eq(1).attr('idsubmenu'))).parent().hide();
			}
			idSubmenu++;
		});
	}

	function groupsParse(groups) {
		var domGenerated = '';
		$.each(groups, function (key, group) {
			var panelNewDiv = $('<div><div class="panel {0}"><div class="panel-body"></div></div></div>'.format(PANEL_LAYOUT));

			if ($(group).children('atributos').children('atributo[nombre="ocultar"]').attr('valor') === "1") {
				panelNewDiv.find('.' + PANEL_LAYOUT).hide();
			}

			if ($(group).parents().eq(1)[0].nodeName === FORM_ROOT_LAYOUT) {
				panelNewDiv.find('.' + PANEL_LAYOUT).attr("id", "A{0}".format($(group).attr('id')));
				panelNewDiv.find('.' + PANEL_LAYOUT).attr("idEntidadPropiedad", $(group).attr('idEntidadPropiedad'));
				panelNewDiv.find('.' + PANEL_LAYOUT).hide();
				seccionesUI[$(group).attr('idEntidadPropiedad')] = "A{0}".format($(group).attr('id'));

				FormsBuilder.ViewModel.getFlujoSecciones()[$(group).attr('idEntidadPropiedad')] = {};
				FormsBuilder.ViewModel.getFlujoSecciones()[$(group).attr('idEntidadPropiedad')]['EntroSeccion'] = false;
			}

			var paneldinamico = $(group).children('atributos').children('atributo[nombre="Panel"]');
			if (paneldinamico.length > 0) {
				panelNewDiv.find('.' + PANEL_LAYOUT).attr('PanelDinamico', paneldinamico.attr('valor') || '');
			}

			var columnasFixed = $(group).children('atributos').children('atributo[nombre="ColumnasFixed"]');
			if (columnasFixed.length > 0) {
				panelNewDiv.find('.' + PANEL_LAYOUT).attr('ColumnasFixed', '');
			}

			var title = $(group).children('atributos').find('atributo[nombre="TituloLargo"]');
			if (title.length > 0) {
				panelNewDiv.find('.' + PANEL_LAYOUT).prepend('<div class="{0}"></div>'.format(PANEL_HEADING_LAYOUT));
				if ($(group).parents().eq(1)[0].nodeName === FORM_ROOT_LAYOUT) {

					var puedeSaltar = $(group).children('atributos').find('atributo[nombre="PuedeSaltar"]');
					var botonGuardar = '<a style="float: right;" class="guardardeclaracion btn btn-large btn-red" href="#">Guardar</a>';
					var tempBotones = '';
					if (puedeSaltar.length > 0) {
						tempBotones += '<a style="float: right; margin-right: 10px;" class="saltarseccion btn btn-large btn-red" href="#">No Aplica</a>';
					}

					var botonCalculoInversion = $(group).children('atributos').find('atributo[nombre="CalculoInversion"]');
					if (botonCalculoInversion.length > 0) {
						tempBotones += '<a style="float: right; margin-right: 10px;" campos="{0}" class="calculoinversion btn btn-large btn-red" href="#">Deducción de inversiones</a>'.format(botonCalculoInversion.attr('valor'));
					}

					var botonCalculoAmortizacion = $(group).children('atributos').find('atributo[nombre="CalculoAmortizacion"]');
					if (botonCalculoAmortizacion.length > 0) {
						var helpText = "<span>Este módulo de Amortización de pérdidas fiscales es de uso optativo. " +
							"Los resultados que en él se generen, aún cuando hayan sido transferidos, podrán ser modificados en el momento que desee.<span>";
						tempBotones += '<a help-text="{1}" style="float: right; margin-right: 10px;" campos="{0}" class="calculoAmortizacion btn btn-large btn-red" href="#">Amortización de pérdidas fiscales</a>'.format(botonCalculoAmortizacion.attr('valor'), helpText);
					}

					var botonCalculoExentos = $(group).children('atributos').find('atributo[nombre="CalculoExentos"]');
					if (botonCalculoExentos.length > 0) {
						tempBotones += '<a style="float: right; margin-right: 10px;" class="calculoexentos btn btn-large btn-red" href="#">Cálculo ingresos exentos</a>';
					}

					var botonCargaMasiva = $(group).children('atributos').find('atributo[nombre="CargaMasivaRetenciones"]');
					if (botonCargaMasiva.length > 0) {
						tempBotones += '<a style="float: right; margin-right: 10px;" identificador="{0}" entidad={1} class="cargaMasivaRetenciones carga btn btn-large btn-red" href="#">Carga masiva</a>'.format(botonCargaMasiva.attr('valor'), $(group).attr('idEntidadPropiedad'));
						tempBotones += '<a style="float: right; margin-right: 10px;" identificador="{0}" entidad={1} class="cargaMasivaRetenciones borrar btn btn-large btn-red" disabled="disabled" href="#">Borrar</a>'.format(botonCargaMasiva.attr('valor'), $(group).attr('idEntidadPropiedad'));
					}

					var botonesExtras = '';
					if (SAT.Environment.settings('dejarsinefecto') === true || SAT.Environment.settings('actualizacionimporte') === true) {
						$(tempBotones).each(function (index, value) {
							botonesExtras += $(value).attr("disabled", true).prop('outerHTML');
						});
					} else {
						botonesExtras = tempBotones;
					}
					botonesExtras += '<div style="clear: both;"></div>';


					panelNewDiv.find('.' + PANEL_HEADING_LAYOUT).html('{0} {1}'.format(title.attr('valor'), botonGuardar + botonesExtras));
				} else {
					panelNewDiv.find('.' + PANEL_HEADING_LAYOUT).html(title.attr('valor'));
				}
			}

			var columns = $(group).children('controles').children(COLUMN_LAYOUT);
			panelNewDiv = columnsParse(columns, panelNewDiv);

			domGenerated += panelNewDiv.html();

			if ($(group).parents().eq(1)[0].nodeName === FORM_ROOT_LAYOUT) {
				$('.' + LIST_SECTIONS_LAYOUT).append('<li class="list-group-item"><i class=""></i><a idPanel="{0}" href="#">{1}</a> <i class="icon-chevron-right"></i></li>'.format('A' + idPanel++, title.attr('valor') || '--- Sin titulo ---'));
			}
		});

		return domGenerated;
	}

	function columnsParse(columns, panelNewDiv) {
		$.each(columns, function (key, column) {
			var childGroups = $(column).children('controles').children(GROUP_LAYOUT);

			var containerDiv = $('<div><div class="title-column"></div><div class="bd"></div></div>');
			if ($(column).attr('width') !== undefined) {
				containerDiv.find('.bd').css({ 'width': $(column).attr('width') });
			} else {
				if (columns.length === 1) {
					containerDiv.find('.bd').css({ 'width': '100%' });
				} else {
					containerDiv.find('.bd').css({ 'width': ((98 / columns.length)) + '%' });
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
