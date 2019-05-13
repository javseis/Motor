/** @module FormsBuilder.Modules */
/**
* Modulo para el render de formularios que crea un contenedor con
* controles que se repiten en forma de grid.
*
* (c) SAT 2013, Iván González
*/
/*global namespace:false, FormsBuilder:false, SAT: false, AppDeclaracionesSAT:false, ko:false, Base64:false */

"use strict";

(function () {
    namespace("FormsBuilder.Modules", FormularioGrid, loadedUIFormularioGrid, getRelacionesGrid, formularioGridOnClickLastRow, getFgLenQueueRules);
    var relacionesGrids = {};
    var filaSeleccionada = {};

    var counterRowsGrid = 0;
    var applyRulesFuncs = [];

    var jqModalErrorFilaFormularioGrid = $("#modalErrorFilaFormularioGrid");
    var jqModalErrorBotonAgregarFormularioGrid = $("#modalErrorBotonAgregarFormularioGrid");
    var showErrors = true;

    function FormularioGrid(control) {
        var xmlCopy = FormsBuilder.XMLForm.getCopy();
        var panelNewDiv = $('<div><div class="panel panel-default"><div class="panel-body"></div></div></div>');

        var controles = $(control).children('controles').children('control[tipoControl="Columna"]');

        var hasChild = $(control).children('atributos').find('atributo[nombre="EntidadHijo"]');
        var hasParent = $(control).children('atributos').find('atributo[nombre="EntidadPadre"]');
        if (hasChild.length > 0) {
            panelNewDiv.find('.panel-body').attr('formulariogrid', $(control).attr('idEntidadPropiedad'));
            panelNewDiv.find('.panel-body').attr('entidadHijo', hasChild.attr('valor'));
            relacionesGrids[$(control).attr('idEntidadPropiedad')] = {};
            filaSeleccionada[$(control).attr('idEntidadPropiedad')] = {};
        } else if (hasParent.length > 0) {
            panelNewDiv.find('.panel-body').attr('entidadPadre', hasParent.attr('valor'));
        } else {
            panelNewDiv.find('.panel-body').attr('formulariogrid', $(control).attr('idEntidadPropiedad'));
        }

        var htmlRow = FormsBuilder.Parser.columnsParse($(controles), panelNewDiv);
        var controlesFormulario = htmlRow.find('[view-model]');
        controlesFormulario.removeAttr('data-bind');

        var grid = $('<table class="table table-hover tabla-formulariogrid" entidad="{0}"></table>'.format($(control).attr('idEntidadPropiedad')));

        var filaHtml = '<tr class="danger">';
        var gridEncabezado = $('<thead><tr></tr></thead>');
        var gridCuerpo = $('<tbody></tbody>');

        $.each(controlesFormulario, function (key, control) {
            $(control).attr('temp-model', $(control).attr('view-model'));
            if ($(control).attr('muestraEnGrid') !== undefined) {
                var viewmodel = $(control).attr('view-model').substring($(control).attr('view-model').indexOf('P') + 1, $(control).attr('view-model').length).split('_')[0];
                var propiedad = $(xmlCopy).find('modeloDatos propiedad[id="{0}"]'.format(viewmodel));

                if (propiedad.length > 0) {
                    var tituloCorto = propiedad.find('atributo[nombre="TituloCorto"]').attr('valor');

                    var gridColumna = $('<th>{0}</th>'.format(tituloCorto));
                    gridEncabezado.find('tr').append(gridColumna);

                    if ($(control).attr('alineacionTexto') === 'izquierda') {
                        filaHtml += '<td style="text-align: left !important;"></td>';
                    } else {
                        filaHtml += '<td></td>';
                    }
                }
            }
        });

        gridEncabezado.find('tr').append($('<th style="width: 25px"><i class="icon-info-sign sat-info-grid"></i></th>'));
        filaHtml += '<td style="width: 25px"></td>';

        grid.append(gridEncabezado);
        grid.append(gridCuerpo);
        filaHtml += '</tr>';

        var inputFilaHtml = $('<input class="tmplfrmgrid" type="hidden"/>');
        inputFilaHtml.val(filaHtml);

        htmlRow.append(inputFilaHtml);
        htmlRow.prepend('<div style="clear: both;"><br /><div/>');
        htmlRow.prepend('<button type="button" class="btn btn-primary btn-red btnDelFormularioGridRow" style="margin-right: 15px;" entidad="{0}">Eliminar</button>'.format($(control).attr('idEntidadPropiedad')));
        htmlRow.prepend('<button type="button" class="btn btn-primary btn-red btnAddFormularioGridRow" style="margin-right: 15px;" entidad="{0}">Agregar</button>'.format($(control).attr('idEntidadPropiedad')));

        htmlRow.append(grid);

        return "<div class='sat-container-formgrid' entidad='{0}'>{1}</div>".format($(control).attr('idEntidadPropiedad'), htmlRow.html());
    }

    function loadedUIFormularioGrid() {
        var panelesFormularioGrid = $('.sat-container-formgrid');
        $.each(panelesFormularioGrid, function (keyPnl, panel) {
            var controlesFormulario = $(panel).find('.panel:first').find('[view-model]').not('i');
            $.each(controlesFormulario, function (key, control) {
                if ($(control).prop('disabled') === true) {
                    $(control).attr('isdisabled', 'isdisabled');
                } else {
                    $(control).prop('disabled', true);
                }
            });
        });

        jqModalErrorFilaFormularioGrid.find(".notify button").click(function myfunction() {
            jqModalErrorFilaFormularioGrid.modal("hide");
        });

        jqModalErrorBotonAgregarFormularioGrid.find(".notify button").click(function myfunction() {
            jqModalErrorBotonAgregarFormularioGrid.modal("hide");
        });

        $('.tabla-formulariogrid tbody tr').live('click', function () {
            var detalleGrid = FormsBuilder.ViewModel.getDetalleGrid();
            var tabla = $(this).parents().eq(1);

            if (SAT.Environment.settings('isHydrate') === false) {
                var indexPadre = 0, indexPadreToCompare = 0,
                    contextErrors = [], otherErrors = [];

                var entidadPadre = $('#htmlOutput').find('div.sat-container-formgrid[entidad="{0}"]'.format($(this).attr('tr-entidad')))
                                                   .find('div[entidadpadre]').attr('entidadpadre');

                var entidadHija = $("#htmlOutput").find('div.sat-container-formgrid[entidad="{0}"]'.format($(this).attr('tr-entidad')))
                                                  .find('div[entidadhijo]').attr('entidadhijo');

                var contexto = $(this).attr('tr-entidad');
                contextErrors = $('#htmlOutput').find('div[entidad="{0}"]'.format(contexto))
                                                .find('i[excluirengrid=false].icon-warning-sign');

                if (entidadPadre !== undefined) {
                    otherErrors = $('#htmlOutput').find('div[entidad="{0}"]'.format(entidadPadre))
                                                  .find('i[excluirengrid=false].icon-warning-sign');
                }
                else {
                    otherErrors = $('#htmlOutput').find('div[entidad="{0}"]'.format(entidadHija))
                                                  .find('i[excluirengrid=false].icon-warning-sign');
                }

                if (contextErrors.length > 0 || otherErrors.length > 0) {
                    if (SAT.Environment.settings('isRowClicked') === true) {
                        jqModalErrorFilaFormularioGrid.modal('show');
                    }
                    return;
                }
            }

            tabla.find('tr').removeClass('danger');
            $(this).addClass('danger');
            removeErrors(this);

            var viewModels = $(this).parents().eq(2).find('[view-model]').not('i');
            viewModels.off();

            var that = $(this);
            filaSeleccionada[$(this).attr('tr-entidad')] = parseInt(that.attr('index'));

            $.each(viewModels, function (key, ctrlViewModel) {
                $(ctrlViewModel).attr('view-model', $(ctrlViewModel).attr('temp-model') + '_' + that.attr('index'));
                if ($(ctrlViewModel).is(':checkbox'))
                    $(ctrlViewModel).attr('data-bind', "checked: " + $(ctrlViewModel).attr('view-model'));
                else
                    $(ctrlViewModel).attr('data-bind', "value: " + $(ctrlViewModel).attr('view-model'));
            });

            var panel = $(this).parents().eq(2).find('.panel')[0];

            ko.cleanNode(panel);
            ko.applyBindings(detalleGrid[$(this).attr('tr-entidad')][$(this).index()], panel);

            if (SAT.Environment.settings('isDAS')) {
                $(panel).find('span.ic-help').each(AppDeclaracionesSAT.helpIconMobile);
            } else {
                $(panel).find('span.ic-help').each(AppDeclaracionesSAT.helpIcon);
                $(panel).find('span.ic-help').on('show.bs.popover', AppDeclaracionesSAT.helpIconPopover);
            }

            $(panel).find('.datepicker-control-div').datepicker({ format: 'dd/mm/yyyy' });

            $(this).parents().eq(2).find('[view-model]').focus(function () {
                var that = this;
                fbUtils.setDecimalsElement();
                setTimeout(function () {
                    if ($(that).hasClass('currency')) {
                        if (window.lastElement) {
                            if (window.lastElement.attr('view-model') !== $(document.activeElement).attr('view-model')) {
                                $(that).toNumber();
                            }
                        }
                    }
                }, fbUtils.getMs());
            });

            $(this).parents().eq(2).find('.currency').blur(function () {
                window.lastElement = $(this);
            });
            fbUtils.applyFormatCurrencyOnElement($(this).parents().eq(2), true);

            var inputsFecha = $(this).parents(".panel:first").find("input[mascara]");
            $.each(inputsFecha, function (keyInput, ctrlFecha) {
                $(ctrlFecha).mask($(ctrlFecha).attr('mascara'));
            });
            $(this).parents(".panel:first").find("[ayudaEnDialogo]").focus(AppDeclaracionesSAT.showHelpDialog);

            var tablaHija = $('#htmlOutput').find('div[entidadpadre="{0}"]'.format($(this).attr('tr-entidad'))).parents().eq(1).find('table');
            if (tablaHija.length > 0) {
                tablaHija.find('tbody tr').removeClass('danger');
                tablaHija.find('tbody tr').hide();
                var filasActivas = tablaHija.find('tbody tr[indicePadre="{0}"]'.format(parseInt(that.attr('index'))));
                if (filasActivas.length > 0) {
                    filasActivas.show();
                    filasActivas.last().addClass('danger');
                    filasActivas.last().click();
                } else {
                    tablaHija.parent().find('[view-model]').val('');
                    removeErrors(tablaHija, true);
                }
            }

            var xmlCopy = FormsBuilder.XMLForm.getCopy();
            var propiedadesReglas = $(xmlCopy).find('definicionReglas > propiedades > propiedad[idEntidadPropiedad="{0}"]'.format($(this).attr('tr-entidad')));
            var listReglas = {};
            $.each(propiedadesReglas, function (index, regla) {
                if (listReglas[$(regla).attr('idRegla')] === undefined) {
                    listReglas[$(regla).attr('idRegla')] = {
                        idRegla: $(regla).attr('idRegla'),
                        entidad: $(regla).attr('idEntidadPropiedad'),
                        propiedad: $(regla).attr('idPropiedad')
                    };
                }
            });

            var search = true;
            var objCtrl = $(that).parent();
            while (search) {
                if (objCtrl.hasClass('sat-container-formgrid') === true) {
                    search = false;
                } else {
                    objCtrl = objCtrl.parent();
                }
            }

            var controlesFormulario = objCtrl.find('.panel:first').find('[view-model]');
            if (controlesFormulario.length > 0) {
                $.each(controlesFormulario, function (key, control) {
                    if ($(control).attr('isdisabled') === undefined) {
                        $(control).prop('disabled', false);
                    }
                });
            }

            if (!(SAT.Environment.settings('dejarsinefecto'))) {
                for (var key in listReglas) {
                    var regla = $(xmlCopy).find('definicionReglas > reglas > regla[id="{0}"]'.format(listReglas[key].idRegla));
                    switch ($(regla).attr('tipoRegla')) {
                        case 'Validacion':
                            if (SAT.Environment.settings('isHydrate') === false) {
                                var validacionGrid = FormsBuilder.ViewModel.ValidacionGrid("E{0}P{1}".format(listReglas[key].entidad, listReglas[key].propiedad) + '_' + that.attr('index'), regla);
                                if (validacionGrid !== undefined) {
                                    var formGridDiv = $('#htmlOutput').find('.sat-container-formgrid[entidad="{0}"] .panel:first'.format(listReglas[key].entidad));
                                    var erroresGrid = formGridDiv.find('i[vm]');
                                    var tabla = formGridDiv.parents().eq(1).find('table');
                                    var filaGrid = that.attr('index');

                                    if (erroresGrid.length > 0) {
                                        var columna = tabla.find('tr[index="{0}"]'.format(filaGrid)).find('td:last');
                                        columna.html('<i class="icon-warning-fa sat-icon"></i>');
                                    } else {
                                        var columna = tabla.find('tr[index="{0}"]'.format(filaGrid)).find('td:last');
                                        columna.html('');
                                    }
                                }
                            }
                            break;
                        case 'Calculo':
                        case 'Condicion Excluyente':
                            if ($(regla).attr('ejecutarAlInicio') === '1' && SAT.Environment.settings('isHydrate') === false) {
                                FormsBuilder.ViewModel.CalculoGrid("E{0}P{1}".format(listReglas[key].entidad, listReglas[key].propiedad) + '_' + that.attr('index'), regla);
                            }
                            break;
                        case 'Visual':
                            FormsBuilder.ViewModel.VisualGrid("E{0}P{1}".format(listReglas[key].entidad, listReglas[key].propiedad) + '_' + that.attr('index'), regla);
                            break;
                    }
                }
            }
        });

        $('button.btnAddFormularioGridRow').on('click', function () {
            var xmlCopy = FormsBuilder.XMLForm.getCopy();
            var detalleGrid = FormsBuilder.ViewModel.getDetalleGrid();

            var $modalMessage = $('#message-inmuebles-enajenacion');

            $modalMessage.find(".notify button").click(function () {
                $modalMessage.modal('hide');
            });

            var entidadPadre = $(this).parent().find('.panel-body').attr('entidadPadre');
            var entidadHijo = $(this).parent().find('.panel-body').attr('entidadhijo');

            if (entidadPadre !== undefined) {
                if (detalleGrid[entidadPadre] === undefined) {
                    $(this).parent().find('[view-model]').val('');
                    $modalMessage.modal('show');
                    return;
                }
                if (detalleGrid[entidadPadre].length <= 0) {
                    $(this).parent().find('[view-model]').val('');
                    $modalMessage.modal('show');
                    return;
                }
            }

            var filaHtml = $(this).parent().find('input[type="hidden"][class="tmplfrmgrid"]').val();
            var tabla = $(this).parent().find('table[entidad="{0}"] tbody'.format($(this).attr('entidad')));

            if (SAT.Environment.settings('isHydrate') === false) {
                var indexPadre = 0, indexPadreToCompare = 0,
                    contextErrors = [], otherErrors = [];

                var contexto = $(this).attr('entidad');
                contextErrors = $('#htmlOutput').find('div[entidad="{0}"]'.format(contexto))
                                                .find('i[excluirengrid=false].icon-warning-sign');

                if (entidadPadre !== undefined) {
                    otherErrors = $('#htmlOutput').find('div[entidad="{0}"]'.format(entidadPadre))
                                                  .find('i[excluirengrid=false].icon-warning-sign');
                }
                else {
                    otherErrors = $('#htmlOutput').find('div[entidad="{0}"]'.format(entidadHijo))
                                                  .find('i[excluirengrid=false].icon-warning-sign');
                }

                if (contextErrors.length > 0 || otherErrors.length > 0) {
                    jqModalErrorBotonAgregarFormularioGrid.modal('show');
                    return;
                }
            }

            if (tabla.find('tr').length <= 0) {
                var controlesFormulario = $(this).parent().find('.panel:first').find('[view-model]');
                $.each(controlesFormulario, function (key, control) {
                    if ($(control).attr('isdisabled') === undefined) {
                        $(control).prop('disabled', false);
                    }
                });
            }

            tabla.append('{0}'.format(filaHtml));
            tabla.find('tr').removeClass('danger');
            tabla.find('tr:last').addClass('danger');
            tabla.find('tr:last').attr('index', counterRowsGrid);

            removeErrors(tabla.find('tr:last'));

            var viewModels = $(this).parent().find('[view-model]').not('i');
            viewModels.off();

            var that = $(this);

            var keysCounter = 0;
            $.each(viewModels, function (key, ctrlViewModel) {
                $(ctrlViewModel).attr('view-model', $(ctrlViewModel).attr('temp-model') + '_' + counterRowsGrid);
                if ($(ctrlViewModel).is(':checkbox'))
                    $(ctrlViewModel).attr('data-bind', "checked: " + $(ctrlViewModel).attr('view-model'));
                else
                    $(ctrlViewModel).attr('data-bind', "value: " + $(ctrlViewModel).attr('view-model'));

                if ($(ctrlViewModel).attr('muestraEnGrid') !== undefined) {
                    if (ctrlViewModel.tagName === 'SELECT') {
                        var vmmodel_tmp = $(ctrlViewModel).attr('temp-model');

                        var control = $(xmlCopy).find('modeloDatos').find('propiedad[id="{0}"]'.format(vmmodel_tmp.substring(vmmodel_tmp.indexOf('P') + 1, vmmodel_tmp.length)));
                        var catalogo = control.find('atributo[nombre="Catalogo"]');

                        tabla.find('tr:last > td:eq({0})'.format(keysCounter)).attr('data-bind', 'text: GetTexto({0}, {1})'.format($(ctrlViewModel).attr('view-model'), catalogo.attr('valor')));
                    } else {
                        tabla.find('tr:last > td:eq({0})'.format(keysCounter)).attr('data-bind', "text: " + $(ctrlViewModel).attr('view-model'));
                    }
                    tabla.find('tr:last > td:eq({0})'.format(keysCounter)).attr('td-viewmodel', $(ctrlViewModel).attr('temp-model'));
                    keysCounter++;
                }
            });

            var entidad;
            if (viewModels.length > 0) {
                entidad = ($(viewModels[0]).attr('view-model').split('P')[0]).replace('E', '');
                tabla.find('tr').attr('tr-entidad', entidad);

                if (detalleGrid[entidad] !== undefined) {
                } else {
                    detalleGrid[entidad] = [];
                }

                var fieldsForExprs = FormsBuilder.ViewModel.getFieldsForExprsGrid();
                var objItem = {};
                $.each(viewModels, function (key, ctrlViewModel) {
                    var db_id = $(ctrlViewModel).attr('view-model');
                    objItem[db_id] = ko.observable('');
                    objItem[db_id].subscribe(function (newValue) {
                        if (isDateEmpty(newValue)) {
                            return;
                        }

                        SAT.Environment.setSetting('isModified', true);

                        var ctlCurrency = that.parent().find('[view-model="{0}"]'.format(db_id));
                        if (ctlCurrency.hasClass('currency')) {
                            setTimeout(function () {
                                // fbUtils.applyFormatCurrencyOnElement(ctlCurrency, true);
                                fbUtils.applyFormatCurrencyOnElement(tabla.find('td[td-viewmodel="{0}"]'.format(db_id.split('_')[0])), true);
                            }, 200);
                        }

                        var rangoBusqueda = 10;
                        var entidadHijo = $('#htmlOutput').find('[view-model="{0}"]'.format(db_id)).parents().eq(2).find('.panel-body').attr('entidadHijo');
                        if (entidadHijo === undefined)
                            entidadHijo = $('#htmlOutput').find('[view-model="{0}"]'.format(db_id)).parents().eq(8).find('.panel-body').attr('entidadHijo');

                        if (entidadHijo !== undefined) {
                            var clonados = {};
                            var controlEntidad = $('#htmlOutput').find('.panel-body [entidadPadre="{0}"]'.format(db_id.split('P')[0].replace('E', '')));
                            if (controlEntidad.length > 0) {
                                var clonadosCtls = controlEntidad.find('[copiadodesde]');
                                $.each(clonadosCtls, function (keyClonadoCtl, clonadoCtl) {
                                    clonados[$(clonadoCtl).attr('copiadodesde')] = $(clonadoCtl).attr('temp-model');
                                });
                            }

                            var detalleGrid = FormsBuilder.ViewModel.getDetalleGrid();
                            if (detalleGrid[entidadHijo] !== undefined) {
                                for (var keyDetalle in detalleGrid[entidadHijo]) {
                                    for (var keyDetalle2 in detalleGrid[entidadHijo][keyDetalle]) {
                                        for (var keyClonado in clonados) {
                                            if (db_id.substring(db_id.indexOf('P') + 1, db_id.length).split('_')[0] === keyClonado.split('|')[1]) {
                                                if (clonados[keyClonado] === keyDetalle2.split('_')[0]) {
                                                    var idPadre = db_id.split('P')[0].replace('E', '');

                                                    var tablaHijo = $('#htmlOutput').find('table[entidad="{0}"]'.format(entidadHijo));
                                                    var filasHijas = tablaHijo.find('tr[indicePadre="{0}"]'.format(filaSeleccionada[idPadre]));
                                                    $.each(filasHijas, function (keyFilaHija, filaHija) {
                                                        if ($(filaHija).attr('index') === keyDetalle2.split('_')[1]) {
                                                            detalleGrid[entidadHijo][keyDetalle][keyDetalle2](newValue);
                                                        }
                                                    });
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        var aplicarRegla = SAT.Environment.settings('applyrules');
                        var isDejarSinEfecto = SAT.Environment.settings('dejarsinefecto');
                        if (aplicarRegla && !isDejarSinEfecto && SAT.Environment.settings('isHydrate') === false) {
                            var applyRuleFunc = function () {
                                FormsBuilder.ViewModel.applyRuleGrid(db_id, newValue, function () {
                                    setTimeout(function () {

                                        var formGridDiv = $('#htmlOutput').find('.sat-container-formgrid[entidad="{0}"] .panel:first'.format(db_id.split('P')[0].replace('E', '')));

                                        var erroresGrid = formGridDiv.find('i[vm]');
                                        var tabla = formGridDiv.parents().eq(1).find('table');

                                        if (erroresGrid.length > 0) {
                                            var filaGrid = db_id.split('_')[1];
                                            var columna = tabla.find('tr[index="{0}"]'.format(filaGrid)).find('td:last');
                                            columna.html('<i class="icon-warning-fa sat-icon"></i>');
                                        } else {
                                            var filaGrid = db_id.split('_')[1];
                                            var columna = tabla.find('tr[index="{0}"]'.format(filaGrid)).find('td:last');
                                            columna.html('');
                                        }
                                    }, 50);
                                });
                            };
                            applyRulesFuncs.push(applyRuleFunc);

                            setTimeout(function () {
                                if (applyRulesFuncs.length) {
                                    applyRulesFuncs.shift().call();
                                }
                            }, 1);
                        }
                    });
                    var valuePropiedad = $(xmlCopy).find('modeloDatos').find('propiedad[id="{0}"]'.format(db_id.substring(db_id.indexOf('P') + 1, db_id.length).split('_')[0]));
                    fieldsForExprs['$' + db_id.substring(db_id.indexOf('P') + 1, db_id.length)] = {
                        entidad: entidad,
                        propiedad: db_id.substring(db_id.indexOf('P') + 1, db_id.length),
                        tipoDatos: $(valuePropiedad).attr("tipoDatos")
                    };
                });

                detalleGrid[entidad].push(objItem);

                var entidadHijo = $(this).parent().find('.panel-body').attr('entidadHijo');
                if (entidadHijo !== undefined) {
                    if (FormsBuilder.ViewModel.getFlujoSecciones()[entidadHijo] === undefined) {
                        FormsBuilder.ViewModel.getFlujoSecciones()[entidadHijo] = {};
                        FormsBuilder.ViewModel.getFlujoSecciones()[entidadHijo]['EntroSeccion'] = true;
                    }
                    if (relacionesGrids[entidad][entidadHijo] === undefined)
                        relacionesGrids[entidad][entidadHijo] = [];

                    relacionesGrids[entidad][entidadHijo].push({ padre: counterRowsGrid });

                    if (filaSeleccionada[entidad] === undefined)
                        filaSeleccionada[entidad] = {};

                    filaSeleccionada[entidad] = counterRowsGrid;

                    var tabHijo = $('#htmlOutput').find('table[entidad="{0}"]'.format(entidadHijo));
                    if (tabHijo.length > 0) {
                        removeErrors(tabHijo, true);
                    }
                }

                var entidadPadre = $(this).parent().find('.panel-body').attr('entidadPadre');
                if (entidadPadre !== undefined) {
                    if (relacionesGrids[entidadPadre][entidad] !== undefined) {
                        var filaSeleccionadaIndice = filaSeleccionada[entidadPadre];

                        for (var relacionIndice in relacionesGrids[entidadPadre][entidad]) {
                            var relacion = relacionesGrids[entidadPadre][entidad][relacionIndice];

                            if (relacion.padre === filaSeleccionadaIndice) {
                                if (relacion.hijos === undefined)
                                    relacion.hijos = [];

                                relacion.hijos.push({
                                    hijo: counterRowsGrid
                                });

                                var copiadosDesde = $(this).parent().find('[copiadoDesde]');
                                if (copiadosDesde.length > 0) {
                                    $.each(copiadosDesde, function (key, copiado) {
                                        var datos = $(copiado).attr('copiadoDesde').split('|');
                                        for (var indiceElemento in objItem) {
                                            var dbid_tmp = ($(copiado).attr('view-model').split('_')[0]);
                                            var indiceHasta = dbid_tmp.substring(dbid_tmp.indexOf('P') + 1, dbid_tmp.length);

                                            if (indiceElemento.indexOf(indiceHasta) !== -1) {

                                                var datosPadre = detalleGrid[entidadPadre];
                                                for (var indicePadre in datosPadre) {
                                                    var datosPadreHijos = datosPadre[indicePadre];
                                                    for (var indicePadreHijo in datosPadreHijos) {
                                                        if (indicePadreHijo.indexOf(datos[1]) !== -1) {
                                                            if (parseInt(indicePadreHijo.split('_')[1]) === filaSeleccionadaIndice) {

                                                                objItem[indiceElemento](datosPadreHijos[indicePadreHijo]());
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    });
                                }

                                tabla.find('tr:last').attr('indicePadre', filaSeleccionadaIndice);

                                tabla.find('tr').hide();
                                tabla.find('tr[indicePadre="{0}"]'.format(filaSeleccionadaIndice)).show();
                            }
                        }
                    }
                }

                counterRowsGrid++;

                var panel = $(this).parent().find('.panel')[0];
                var filaActiva = $(this).parent().find('tr.danger');

                ko.applyBindings(detalleGrid[entidad][detalleGrid[entidad].length - 1], filaActiva[0]);

                $(this).parent().find('[view-model]').focus(function () {
                    var that = this;
                    fbUtils.setDecimalsElement();
                    setTimeout(function () {
                        if ($(that).hasClass('currency')) {
                            if (window.lastElement) {
                                if (window.lastElement.attr('view-model') !== $(document.activeElement).attr('view-model')) {
                                    $(that).toNumber();
                                }
                            }
                        }
                    }, fbUtils.getMs());
                });

                $(this).parent().find('.currency').blur(function () {
                    window.lastElement = $(this);
                });

                filaActiva.click();
            }

            var inputsFecha = $(this).parent().find('.panel:first').find("input[mascara]");
            $.each(inputsFecha, function (keyInput, ctrlFecha) {
                $(ctrlFecha).mask($(ctrlFecha).attr('mascara'));
            });
            $(this).parents(".panel:first").find("[ayudaEnDialogo]").focus(AppDeclaracionesSAT.showHelpDialog);
        });

        $('button.btnDelFormularioGridRow').on('click', function () {
            var detalleGrid = FormsBuilder.ViewModel.getDetalleGrid();
            var tabla = $(this).parent().find('table tbody');
            var indiceFila = tabla.find('tr.danger').attr('index');
            var indicePadre = tabla.find('tr.danger').attr('indicePadre');
            $('#htmlOutput').find('.popover').remove();

            var iconErrors = tabla.find('tr.danger').find('i');
            var idEntidad = tabla.find('tr.danger').attr('tr-entidad');
            var entidadHijo = $(this).parent().find('.panel-body').attr('entidadhijo');
            var iconErrorsChild = [];

            var iconErrorsPanel = $(this).parent().find('.panel i[vm]');

            if (entidadHijo !== undefined) {
                iconErrorsChild = $('#htmlOutput').find('div[entidad="{0}"]'.format(entidadHijo))
                                                  .find('i[excluirengrid=false].icon-warning-sign');
            }

            if (iconErrorsPanel.length > 0) {
                $.each(iconErrorsPanel, function (key, iconError) {
                    var rules = JSON.parse($(iconError).attr('rules'));
                    rules.forEach(function (el) {
                        $('.panelalert').find('i[rule="{0}"][dbid="{1}"]'.format(el, $(iconError).attr('vm'))).remove();
                    });
                    $('.number').html($('.panelalert i').length);
                    if ($('.panelalert').find("i[entidad='{0}']".format(idEntidad)).length === 0) {
                        $('.panelalert').find("div[entidad='{0}']".format(idEntidad)).remove();
                    }
                });
            }

            if (iconErrors.length > 0 || iconErrorsChild.length > 0) {
                var entidad = null;
                entidad = $(this).parent().find('.panel-body').attr('entidadPadre');
                if (entidad === undefined) {
                    entidad = idEntidad
                }
            }

            var entidadHijo = $(this).parent().find('.panel-body').attr('entidadHijo');
            if (entidadHijo !== undefined) {
                var tablaHijo = $('#htmlOutput').find('table[entidad="{0}"]'.format(entidadHijo));
                var filasHijas = tablaHijo.find('tr[indicePadre="{0}"]'.format(indiceFila));

                var indices = [];
                $.each(filasHijas, function (keyFilaHija, filaHija) {
                    indices.push($(filaHija).attr('index'));
                    $(filaHija).remove();
                });

                var indicesEliminar = [];
                for (var keyDetalleGrid in detalleGrid[entidadHijo]) {
                    for (var keyDetalle in detalleGrid[entidadHijo][keyDetalleGrid]) {
                        if ($.inArray(keyDetalle.split('_')[1], indices) > -1) {
                            indicesEliminar.push(keyDetalleGrid);
                            break;
                        }
                    }
                }
                indicesEliminar.sort(function (a, b) {
                    if (a === b) return 0;
                    return a < b ? 1 : -1;
                });

                for (var indice in indicesEliminar) {
                    detalleGrid[entidadHijo].splice(indicesEliminar[indice], 1);

                    var relaciones = relacionesGrids[idEntidad][entidadHijo];
                    var indiceBusquedaRelacion;
                    for (var kRelacion in relaciones) {
                        if (parseInt(relaciones[kRelacion].padre) === parseInt(indicePadre)) {
                            indiceBusquedaRelacion = kRelacion;
                        }
                    }
                    relaciones.splice(indiceBusquedaRelacion, 1);
                }

                var tabHijo = $('#htmlOutput').find('table[entidad="{0}"]'.format(entidadHijo));
                if (tabHijo.length > 0) {
                    if (tabHijo.find('tbody tr[indicePadre="{0}"]'.format(indiceFila)).length <= 0) {
                        tabHijo.parent().find('[view-model]').val('');
                        removeErrors(tabHijo, true);
                    }
                }
            }

            var entidadPadre = $(this).parent().find('.panel-body').attr('entidadPadre');
            if (entidadPadre !== undefined) {
                if (tabla.find('tr[indicePadre="{0}"]'.format(indicePadre)).length <= 0) {
                    removeErrors(tabla, true);
                    return;
                }
            }

            if (detalleGrid[idEntidad] !== undefined) {
                var indiceBusqueda;
                for (var i = 0; i < detalleGrid[idEntidad].length; i++) {
                    for (var elemento in detalleGrid[idEntidad][i]) {
                        if (elemento.split('_')[1] === indiceFila) {
                            indiceBusqueda = i;
                        }
                    }
                }

                launchRulesOnDelete(idEntidad, true, indiceFila, indiceBusqueda);

                detalleGrid[idEntidad].splice(indiceBusqueda, 1);

                if (entidadPadre !== undefined) {
                    var indiceBusquedaRelacion;
                    var relaciones = relacionesGrids[entidadPadre][idEntidad];
                    for (var kRelacion in relaciones) {
                        if (parseInt(relaciones[kRelacion].padre) === parseInt(indicePadre)) {
                            for (var kHijo in relaciones[kRelacion].hijos) {
                                if (parseInt(indiceFila) === parseInt(relaciones[kRelacion].hijos[kHijo].hijo)) {
                                    indiceBusquedaRelacion = kHijo;
                                }
                            }
                            relaciones[kRelacion].hijos.splice(indiceBusquedaRelacion, 1);
                            indiceBusquedaRelacion = undefined;
                        }
                    }
                }

                if (detalleGrid[idEntidad].length <= 0) {
                    removeErrors(tabla, true);
                    launchRulesOnDelete(idEntidad, false, indiceFila, indiceBusqueda);
                } else {
                    //launchRulesOnDelete(idEntidad, true, indiceFila, indiceBusqueda);
                }

                tabla.find('tr.danger').remove();
            }

            filaSeleccionada[idEntidad] = undefined;

            var that = tabla.find('tr:last');
            if (that.length > 0) {
                removeErrors(that);
                tabla.find('tr').removeClass('danger');

                var viewModels = that.parents().eq(2).find('[view-model]');

                $.each(viewModels, function (key, ctrlViewModel) {
                    $(ctrlViewModel).attr('view-model', $(ctrlViewModel).attr('temp-model') + '_' + that.attr('index'));
                    if ($(ctrlViewModel).is(':checkbox'))
                        $(ctrlViewModel).attr('data-bind', "checked: " + $(ctrlViewModel).attr('view-model'));
                    else
                        $(ctrlViewModel).attr('data-bind', "value: " + $(ctrlViewModel).attr('view-model'));
                });

                var panel = that.parents().eq(2).find('.panel')[0];

                ko.cleanNode(tabla);
                ko.cleanNode(panel);

                ko.applyBindings(detalleGrid[that.attr('tr-entidad')][that.index()], panel);

                var entidadPadre = $(this).parent().find('.panel-body').attr('entidadPadre');
                if (entidadPadre !== undefined) {
                    if (tabla.find('tr[indicePadre="{0}"]'.format(indicePadre)).length > 0) {
                        that.click();
                    } else {
                        removeErrors(that, true);
                        $(this).parent().find('[view-model]').val('');
                    }
                } else {
                    that.click();
                }
            } else {
                $(this).parent().find('[view-model]').val('');
            }
        });

        AppDeclaracionesSAT.resetCursorInputCurrency();
    }

    function launchRulesOnDelete(idEntidad, containsMoreRows, indiceFila, indiceBusqueda) {
        var detalleGrid = FormsBuilder.ViewModel.getDetalleGrid();

        if (!SAT.Environment.settings('dejarsinefecto')) {
            var xmlCopy = FormsBuilder.XMLForm.getCopy();
            var propiedades = xmlCopy.find('entidad[id="{0}"] propiedad'.format(idEntidad));
            $.each(propiedades, function (index, propiedad) {
                var idPropiedad = $(propiedad).attr('id');
                var reglas = xmlCopy.find('definicionReglas regla[idPropiedadAsociada="{0}"]'.format(idPropiedad));
                $.each(reglas, function (innerIndex, regla) {
                    if ($(regla).attr('tipoRegla') !== 'Calculo') {
                        return;
                    }

                    if (!containsMoreRows) {
                        if ($(regla).attr('participaEnGrid') !== undefined) {
                            FormsBuilder.ViewModel.Calculo($(regla));
                        }
                    } else {
                        var viewModelId = "E{0}P{1}_{2}".format(idEntidad, $(propiedad).attr('id'), indiceFila);
                        detalleGrid[idEntidad][indiceBusqueda][viewModelId]('');
                        FormsBuilder.ViewModel.CalculoGrid(viewModelId, $(regla));
                    }
                });
            });
        }
    }

    function removeErrors(that, disabled) {
        if (SAT.Environment.settings('isHydrate') === true) return;

        var search = true;
        var objCtrl = $(that).parent();
        while (search) {
            if (objCtrl.hasClass('sat-container-formgrid') === true) {
                search = false;
            } else {
                objCtrl = objCtrl.parent();
            }
        }
        var icons = objCtrl.find('i[vm]');
        $.each(icons, function (key, icon) {
            var ctl = $(icon).parent().find('[view-model="{0}"]'.format($(icon).attr('vm')));
            ctl.css('display', 'block');
            ctl.css('width', '87%');
            ctl.css('margin-right', '0px');
            ctl.removeClass('alert');
            ctl.removeClass('sat-obligatorio');
        });

        objCtrl.find('.alert').removeClass('alert');

        icons.popover('destroy');
        icons.remove();

        if (disabled !== undefined) {
            var controlesFormulario = objCtrl.find('.panel:first').find('[view-model]').not('i');
            $.each(controlesFormulario, function (key, control) {
                if ($(control).prop('disabled') === true) {
                } else {
                    $(control).prop('disabled', true);
                }
            });
        }
    }

    function getRelacionesGrid() {
        return relacionesGrids;
    }

    function formularioGridOnClickLastRow(selector) {
        $(selector).click();
    }

    function getFgLenQueueRules() {
        return applyRulesFuncs.length;
    }

})();
