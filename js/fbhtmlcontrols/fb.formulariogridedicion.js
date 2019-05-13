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
    namespace("FormsBuilder.Modules", FormularioGridEdicion, loadedUIFormularioGridEdicion, getModeGrid);
    var relacionesGrids = {};
    var filaSeleccionada = {};

    var counterRowsGrid = 0;
    var applyRulesFuncs = [];

    var jqModalErrorFilaFormularioGrid = $("#modalErrorFilaFormularioGrid");
    var jqModalErrorBotonAgregarFormularioGrid = $("#modalErrorBotonAgregarFormularioGrid");
    var showErrors = true;

    var modeGrid; // Debe crear una variable por entidad, esta solo es para deducciones personales

    function FormularioGridEdicion(control) {
        var xmlCopy = FormsBuilder.XMLForm.getCopy();
        var panelNewDiv = $('<div><div class="panel panel-default"><div class="panel-body"></div></div></div>');

        var controles = $(control).children('controles').children('control[tipoControl="Columna"]');

        var hasChild = $(control).children('atributos').find('atributo[nombre="EntidadHijo"]');
        var hasParent = $(control).children('atributos').find('atributo[nombre="EntidadPadre"]');
        if (hasChild.length > 0) {
            panelNewDiv.find('.panel-body').attr('formulariogridedicion', $(control).attr('idEntidadPropiedad'));
            panelNewDiv.find('.panel-body').attr('entidadHijo', hasChild.attr('valor'));
            relacionesGrids[$(control).attr('idEntidadPropiedad')] = {};
            filaSeleccionada[$(control).attr('idEntidadPropiedad')] = {};
        } else if (hasParent.length > 0) {
            panelNewDiv.find('.panel-body').attr('entidadPadre', hasParent.attr('valor'));
        } else {
            panelNewDiv.find('.panel-body').attr('formulariogridedicion', $(control).attr('idEntidadPropiedad'));
        }

        var htmlRow = FormsBuilder.Parser.columnsParse($(controles), panelNewDiv);
        var controlesFormulario = htmlRow.find('[view-model]');
        controlesFormulario.removeAttr('data-bind');

        var grid = $('<table class="table table-hover tabla-formulariogridedicion" entidad="{0}"></table>'.format($(control).attr('idEntidadPropiedad')));

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

        gridEncabezado.find('tr').append($('<th></th><th style="width: 25px"><i class="icon-info-sign sat-info-grid" data-original-title="" title=""></i></th>'));
        filaHtml += '<td style="width: 62px"><img class="btnEditFormularioGridEdicionRow" src="../../css/imgs/editar.png" /><img class="btnDeleteFormularioGridEdicionRow" src="../../css/imgs/borrar.png" /></td>';
        filaHtml += '<td style="width: 25px"></td>';

        grid.append(gridEncabezado);
        grid.append(gridCuerpo);
        grid.append('<input class="indexFormularioGrid" type="hidden" /><input class="modeFormularioGrid" type="hidden" />');
        
        filaHtml += '</tr>';

        var inputFilaHtml = $('<input class="tmplfrmgrid" type="hidden"/>');
        inputFilaHtml.val(filaHtml);

        htmlRow.append(inputFilaHtml);
        htmlRow.prepend('<div><br /><div/>');
        htmlRow.append('<button type="button" class="btn btn-primary btn-red btnCancelFormularioGridEdicionRow" style="margin-right: 15px;" entidad="{0}">Cancelar</button>'.format($(control).attr('idEntidadPropiedad')));
        htmlRow.append('<button type="button" class="btn btn-primary btn-red btnSaveFormularioGridEdicionRow" style="margin-right: 15px;" entidad="{0}">Agregar</button>'.format($(control).attr('idEntidadPropiedad')));
        htmlRow.append('<button type="button" class="btn btn-primary btn-red btnAddFormularioGridEdicionRow hidden" entidad="{0}">Nuevo</button>'.format($(control).attr('idEntidadPropiedad')));

        htmlRow.append(grid);

        return "<div class='sat-container-formgridedicion' entidad='{0}'>{1}</div>".format($(control).attr('idEntidadPropiedad'), htmlRow.html());
    }

    function loadedUIFormularioGridEdicion() {
        var panelesFormularioGrid = $('.sat-container-formgridedicion');
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

        $('button.btnAddFormularioGridEdicionRow').on('click', function () {
            var xmlCopy = FormsBuilder.XMLForm.getCopy();
            var detalleGrid = FormsBuilder.ViewModel.getDetalleGrid();

            var filaHtml = $(this).parent().find('input[type="hidden"][class="tmplfrmgrid"]').val();
            var tabla = $(this).parent().find('table[entidad="{0}"] tbody'.format($(this).attr('entidad')));

            if (tabla.find('tr').length <= 0) {
                var controlesFormulario = $(this).parent().find('.panel:first').find('[view-model]');
                $.each(controlesFormulario, function (key, control) {
                    if ($(control).attr('isdisabled') === undefined) {
                        $(control).prop('disabled', false);
                    }
                });
            }

            $(this).parent().find('.indexFormularioGrid').val(counterRowsGrid);
            modeGrid = 'new';
            $(this).parent().find('.modeFormularioGrid').val(modeGrid);

            var viewModels = $(this).parent().find('[view-model]').not('i');
            viewModels.off();

            var that = $(this);

            $.each(viewModels, function (key, ctrlViewModel) {
                $(ctrlViewModel).attr('view-model', $(ctrlViewModel).attr('temp-model') + '_' + counterRowsGrid);
                if ($(ctrlViewModel).is(':checkbox'))
                    $(ctrlViewModel).attr('data-bind', "checked: " + $(ctrlViewModel).attr('view-model'));
                else
                    $(ctrlViewModel).attr('data-bind', "value: " + $(ctrlViewModel).attr('view-model'));

                // if ($(ctrlViewModel).attr('muestraEnGrid') !== undefined) {

                // }
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
                        
                        var aplicarRegla = SAT.Environment.settings('applyrules');
                        var isDejarSinEfecto = SAT.Environment.settings('dejarsinefecto');
                        if (aplicarRegla && !isDejarSinEfecto) {
                            var applyRuleFunc = function () {
                                FormsBuilder.ViewModel.applyRuleGrid(db_id, newValue, function () {
                                    setTimeout(function () {
                                        var formGridDiv = $('#htmlOutput').find('.sat-container-formgridedicion[entidad="{0}"] .panel:first'.format(db_id.split('P')[0].replace('E', '')));

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
                                }, true);
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
                counterRowsGrid++;

                var panel = $(this).parent().find('.panel');
                ko.cleanNode(panel[0]);
                ko.applyBindings(detalleGrid[entidad][detalleGrid[entidad].length - 1], panel[0]);

                if (SAT.Environment.settings('isDAS')) {
                    $(panel).find('span.ic-help').each(AppDeclaracionesSAT.helpIconMobile);
                } else {
                    $(panel).find('span.ic-help ').each(AppDeclaracionesSAT.helpIcon);
                    $(panel).find('span.ic-help').on('show.bs.popover', AppDeclaracionesSAT.helpIconPopover);
                }

                $(this).parent().find('[view-model]').focus(function () {
                    var that = this;
                    setTimeout(function () {
                        fbUtils.setDecimalsElement();
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
            }

            var inputsFecha = $(this).parent().find('.panel:first').find("input[mascara]");
            $.each(inputsFecha, function (keyInput, ctrlFecha) {
                $(ctrlFecha).mask($(ctrlFecha).attr('mascara'));
            });
            $(this).parents(".panel:first").find("[ayudaEnDialogo]").focus(AppDeclaracionesSAT.showHelpDialog);

            if (SAT.Environment.settings('dejarsinefecto') === true || SAT.Environment.settings('actualizacionimporte') === true) {
                $('img.btnEditFormularioGridEdicionRow, img.btnDeleteFormularioGridEdicionRow').remove();
            }

            $(this).parent().find('.panel[paneldinamico]').hide();
        });

        $('button.btnSaveFormularioGridEdicionRow').on('click', function () {
            var self = this;
            var func = function() {
                if (SAT.Environment.settings('isHydrate') === false) {
                    var ctls = $(self).parent().find('.panel:first [view-model]:visible');
                    var vacios = true;
                    $.each(ctls, function (key, ctl) {
                        if (ctl.tagName === 'SELECT') {
                            if ($(ctl).val() !== '0')
                                vacios = false;
                        } else if (ctl.tagName === 'INPUT') {
                            if ($(ctl).is(':checkbox') === true) {
                                if ($(ctl).is(':checked') === true && !$(ctl).hasClass('NoValidarCampoVacio')) {
                                    vacios = false;
                                }
                            } else {
                                if (!IsNullOrEmptyWhite($(ctl).val()) === true)
                                    vacios = false;
                            }
                        }
                    });

                    if (vacios === true) return;

                    var erroresGrid = $(self).parent().find('i[vm]');
                    if (erroresGrid.length > 0) {
                        $('#modalErrorFilaFormularioGridEdicion').modal('show');
                        return;
                    }
                }

                var xmlCopy = FormsBuilder.XMLForm.getCopy();
                var entidad = $(self).attr('entidad');
                var detalleGrid = FormsBuilder.ViewModel.getDetalleGrid();

                var indiceFila = $(self).parent().find('.indexFormularioGrid').val();
                modeGrid = $(self).parent().find('.modeFormularioGrid').val();
                var tabla = $(self).parent().find('table[entidad="{0}"] tbody'.format(entidad));

                if (modeGrid === 'new') {
                    var filaHtml = $(self).parent().find('input[type="hidden"][class="tmplfrmgrid"]').val();
                    tabla.append('{0}'.format(filaHtml));
                    tabla.find('tr').removeClass('danger');
                    tabla.find('tr:last').attr('index', indiceFila);

                    tabla.find('tr:last img.btnEditFormularioGridEdicionRow').tooltip({ title: 'Editar', trigger: 'hover focus' });
                    tabla.find('tr:last img.btnDeleteFormularioGridEdicionRow').tooltip({ title: 'Eliminar', trigger: 'hover focus' });

                    var viewModels = $(self).parent().find('[view-model]').not('i');
                    viewModels.off();

                    var keysCounter = 0;
                    $.each(viewModels, function (key, ctrlViewModel) {
                        if ($(ctrlViewModel).attr('muestraEnGrid') !== undefined) {
                            if (ctrlViewModel.tagName === 'SELECT') {
                                var vmmodel_tmp = $(ctrlViewModel).attr('temp-model');
                                var propiedad = vmmodel_tmp.substring(vmmodel_tmp.indexOf('P') + 1, vmmodel_tmp.length);

                                var modelo = $(xmlCopy).find('modeloDatos').find('propiedad[id="{0}"]'.format(propiedad));
                                var control = $(xmlCopy).find('formulario').find('control[idPropiedad="{0}"]'.format(propiedad));
                                
                                var catalogo = modelo.find('atributo[nombre="Catalogo"]');
                                var noMostrarEnVacio = control.find('atributo[nombre="SinSeleccionEnGrid"]').length > 0;
                                
                                tabla.find('tr:last > td:eq({0})'.format(keysCounter)).attr('data-bind', 'text: GetTexto({0}, {1}, {2})'.format($(ctrlViewModel).attr('view-model'), catalogo.attr('valor'), noMostrarEnVacio));
                            } else {
                                tabla.find('tr:last > td:eq({0})'.format(keysCounter)).attr('data-bind', "text: " + $(ctrlViewModel).attr('view-model'));
                            }
                            tabla.find('tr:last > td:eq({0})'.format(keysCounter)).attr('td-viewmodel', $(ctrlViewModel).attr('temp-model'));
                            keysCounter++;
                        }
                    });

                    var filaActiva = $(self).parent().find('tr:last');

                    ko.applyBindings(detalleGrid[entidad][detalleGrid[entidad].length - 1], filaActiva[0]);
                } else if (modeGrid === 'edit') {
                    //TODO: Hacer algo aqui?
                }
                
                var panel = $(self).parent().find('.panel');
                panel.find('.currency').each(function(key, value) {
                    setTimeout(function () {
                        fbUtils.applyFormatCurrencyOnElement(tabla.find('td[td-viewmodel="{0}"]'.format($(value).attr('view-model').split('_')[0])), true);
                    }, 200);
                });
                
                if (SAT.Environment.settings('isHydrate') === false) {
                    $('.panel[identidadpropiedad="{0}"]'.format(entidad)).find('button.btnAddFormularioGridEdicionRow:first').click();
                }
            
                $(self).parent().find('.panel[paneldinamico]').hide();
            };

            if (SAT.Environment.settings('isHydrate') === true) {
                func();
            } else {
                setTimeout(func, 1000);
            }
        });

        $('button.btnCancelFormularioGridEdicionRow').on('click', function () {
            var self = this;
            var func = function() {
                var indiceFila = $(self).parent().find('.indexFormularioGrid').val();
                modeGrid = $(self).parent().find('.modeFormularioGrid').val();
                var detalleGrid = FormsBuilder.ViewModel.getDetalleGrid();
                var entidad = $(self).attr('entidad');

                var tabla = $(self).parent().find('table[entidad="{0}"] tbody'.format(entidad));

                if (modeGrid === 'new') {
                    var detalles = detalleGrid[entidad][detalleGrid[entidad].length - 1];
                    for (var key in detalles) {
                        detalles[key]('');
                    }
                } else if (modeGrid === 'edit') {
                    var erroresGrid = $(self).parents().eq(4).find('.panel').find('i[vm]');
                    if (erroresGrid.length > 0) {
                        $('#modalErrorFilaFormularioGridEdicion').modal('show');
                        return;
                    }

                    $('.panel[identidadpropiedad="{0}"]'.format(entidad)).find('button.btnAddFormularioGridEdicionRow:first').click();
                }
                removeErrors(tabla, false);
            };

            if (SAT.Environment.settings('isHydrate') === true) {
                func();
            } else {
                setTimeout(func, 1000);
            }
        });

        $('img.btnEditFormularioGridEdicionRow').live('click', function () {
            var erroresGrid = $(this).parents().eq(4).find('.panel').find('i[vm]');
            if (erroresGrid.length > 0) {
                $('#modalErrorFilaFormularioGridEdicion').modal('show');
                return;
            }

            var detalleGrid = FormsBuilder.ViewModel.getDetalleGrid();
            
            var tr = $(this).parents().eq(1);
            var indiceFila = tr.attr('index');
            var idEntidad = tr.attr('tr-entidad');

            removeErrors(tr.parents().eq(1), false);

            var indiceFilaEliminar = $(this).parents().eq(4).find('.indexFormularioGrid').val();
            modeGrid = $(this).parents().eq(4).find('.modeFormularioGrid').val();

            if (modeGrid === 'new') {
                if (detalleGrid[idEntidad] !== undefined) {
                    var indiceBusqueda;
                    for (var i = 0; i < detalleGrid[idEntidad].length; i++) {
                        for (var elemento in detalleGrid[idEntidad][i]) {
                            if (elemento.split('_')[1] === indiceFilaEliminar) {
                                indiceBusqueda = i;
                            }
                        }
                    }

                    detalleGrid[idEntidad].splice(indiceBusqueda, 1);
                }
            } else if (modeGrid === 'edit') {

            }

            $(this).parents().eq(4).find('.indexFormularioGrid').val(indiceFila);
            modeGrid = 'edit';
            $(this).parents().eq(4).find('.modeFormularioGrid').val(modeGrid);
            
            var panel = $(this).parents().eq(4).find('.panel')[0];
            ko.cleanNode(panel);

            if (SAT.Environment.settings('isDAS')) {
                $(panel).find('span.ic-help').each(AppDeclaracionesSAT.helpIconMobile);
            } else {
                $(panel).find('span.ic-help').each(AppDeclaracionesSAT.helpIcon);
                $(panel).find('span.ic-help').on('show.bs.popover', AppDeclaracionesSAT.helpIconPopover);
            }

            var viewModels = $(this).parents().eq(4).find('[view-model]').not('i');
            viewModels.off();

            $.each(viewModels, function (key, ctrlViewModel) {
                $(ctrlViewModel).attr('view-model', $(ctrlViewModel).attr('temp-model') + '_' + indiceFila);
                if ($(ctrlViewModel).is(':checkbox'))
                    $(ctrlViewModel).attr('data-bind', "checked: " + $(ctrlViewModel).attr('view-model'));
                else
                    $(ctrlViewModel).attr('data-bind', "value: " + $(ctrlViewModel).attr('view-model'));
            });

            if (detalleGrid[idEntidad] !== undefined) {
                var indiceBusqueda;
                for (var i = 0; i < detalleGrid[idEntidad].length; i++) {
                    for (var elemento in detalleGrid[idEntidad][i]) {
                        if (elemento.split('_')[1] === indiceFila) {
                            indiceBusqueda = i;
                        }
                    }
                }

                ko.applyBindings(detalleGrid[idEntidad][indiceBusqueda], panel);
            }

            var xmlCopy = FormsBuilder.XMLForm.getCopy();
            var propiedadesReglas = $(xmlCopy).find('definicionReglas > propiedades > propiedad[idEntidadPropiedad="{0}"]'.format(idEntidad));
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

            if (SAT.Environment.settings('dejarsinefecto') === false) {
                for (var key in listReglas) {
                    var regla = $(xmlCopy).find('definicionReglas > reglas > regla[id="{0}"]'.format(listReglas[key].idRegla));
                    switch ($(regla).attr('tipoRegla')) {
                        case 'Validacion':
                            if (SAT.Environment.settings('isHydrate') === false && $(regla).attr('mensajeErrorEnDialogo') !== '1') {
                                var validacionGrid = FormsBuilder.ViewModel.ValidacionGrid("E{0}P{1}".format(listReglas[key].entidad, listReglas[key].propiedad) + '_' + indiceFila, regla);
                                if (validacionGrid !== undefined) {
                                    var formGridDiv = $('#htmlOutput').find('.sat-container-formgridedicion[entidad="{0}"] .panel:first'.format(listReglas[key].entidad));
                                    var erroresGrid = formGridDiv.find('i[vm]');
                                    var tabla = formGridDiv.parents().eq(1).find('table');

                                    if (erroresGrid.length > 0) {
                                        var columna = tabla.find('tr[index="{0}"]'.format(indiceFila)).find('td:last');
                                        columna.html('<i class="icon-warning-fa sat-icon"></i>');
                                    } else {
                                        var columna = tabla.find('tr[index="{0}"]'.format(indiceFila)).find('td:last');
                                        columna.html('');
                                    }
                                }
                            }
                            break;

                        case 'Visual':
                            FormsBuilder.ViewModel.VisualGrid("E{0}P{1}".format(listReglas[key].entidad, listReglas[key].propiedad) + '_' + indiceFila, regla);
                            break;
                    }
                }
            }

            $(panel).find('.currency').focus(function () {
                var that = this;
                setTimeout(function () {
                    fbUtils.setDecimalsElement();
                    if (window.lastElement) {
                        if (window.lastElement.attr('view-model') !== $(document.activeElement).attr('view-model')) {
                            $(that).toNumber();
                        }
                    }
                }, fbUtils.getMs());
            });

            $(panel).find('.currency').blur(function () {
                window.lastElement = $(this);
            });

            $(panel).find('.currency').each(function(key, value) {
                setTimeout(function () {
                    fbUtils.applyFormatCurrencyOnElement(value, true);
                }, 200);
            });
        });

        $('img.btnDeleteFormularioGridEdicionRow').live('click', function () {
            var erroresGrid = $(this).parents().eq(4).find('.panel').find('i[vm]');
            if (erroresGrid.length > 0) {
                $('#modalErrorFilaFormularioGridEdicion').modal('show');
                return;
            }

            var detalleGrid = FormsBuilder.ViewModel.getDetalleGrid();

            var tabla = $(this).parents().eq(4).find('table tbody');
            var tr = $(this).parents().eq(1);
            var indiceFila = tr.attr('index');

            $('#htmlOutput').find('.popover').remove();

            var idEntidad = tr.attr('tr-entidad');

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

                removeErrors(tabla, true);

                if (detalleGrid[idEntidad].length <= 0) {
                    launchRulesOnDelete(idEntidad, false, indiceFila, indiceBusqueda);
                    console.log('.length <= 0');
                } else if(detalleGrid[idEntidad].length === 1) {
                    var xmlCopy = FormsBuilder.XMLForm.getCopy();
                    var propiedades = $(xmlCopy).find('entidad[id="{0}"]'.format(idEntidad));
                    $.each(propiedades.find('propiedad'), function (key, propiedad) {
                        var reglas = $(xmlCopy).find('definicionReglas regla[idPropiedadAsociada="{0}"]'.format($(propiedad).attr('id')));
                        $.each(reglas, function (key, regla) {
                            if ($(regla).attr('tipoRegla') === 'Visual' && $(regla).attr('ejecutarEnGridVacio') !== undefined) {
                                FormsBuilder.ViewModel.Visual($(regla));
                            }
                        });
                    });
                }

                tr.remove();

                if (modeGrid === 'edit') {
                    $('.panel[identidadpropiedad="{0}"]'.format(idEntidad)).find('button.btnAddFormularioGridEdicionRow:first').click();
                }
            }
        });

        AppDeclaracionesSAT.resetCursorInputCurrency();
    }

    function getModeGrid() {
        return modeGrid;
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
                        try {
                            detalleGrid[idEntidad][indiceBusqueda][viewModelId]('');
                            FormsBuilder.ViewModel.CalculoGrid(viewModelId, $(regla));
                        } catch(err) {

                        }
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
            if (objCtrl.hasClass('sat-container-formgridedicion') === true) {
                search = false;
            } else {
                objCtrl = objCtrl.parent();
            }
        }
        var icons = objCtrl.find('i[vm]');
        $.each(icons, function (key, icon) {
            var ctl = $(icon).parent().find('[view-model="{0}"]'.format($(icon).attr('vm')));
            ctl.css('display', 'block');
            if (!$(ctl).is(':checkbox')) {
                ctl.css('width', '87%');
            }
            ctl.css('margin-right', '0px');
            ctl.removeClass('sat-val-error');
            ctl.removeClass('sat-obligatorio');
        });

        objCtrl.find('.alert').removeClass('alert');

        icons.popover('destroy');
        icons.remove();
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
