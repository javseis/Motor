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
    namespace("FormsBuilder.Modules", FormularioGridEdicion, loadedUIFormularioGridEdicion, getModeGrid, addRuleGridEdicion, runRulesCalc);
    var relacionesGrids = {};
    var filaSeleccionada = {};

    var counterRowsGrid = 0;
    var applyRulesFuncs = [];
    var rulesCalc = [];

    var jqModalErrorFilaFormularioGrid = $("#modalErrorFilaFormularioGrid");
    var jqModalErrorBotonAgregarFormularioGrid = $("#modalErrorBotonAgregarFormularioGrid");
    var jqModalEliminarGridEdicion = $("#modalEliminarGridEdicion");
    var showErrors = true;

    var modeGrid; // Debe crear una variable por entidad, esta solo es para deducciones personales
    var funcEliminarElemento = null;

    jqModalEliminarGridEdicion.find('.aceptar').on('click', function(){
        if (funcEliminarElemento !== null) {
            funcEliminarElemento();
        }
        jqModalEliminarGridEdicion.modal('hide');
    });
    jqModalEliminarGridEdicion.find('.cancelar').on('click', function(){
        funcEliminarElemento = null;
    });

    function FormularioGridEdicion(control) {
        var xmlCopy = FormsBuilder.XMLForm.getCopy();
        var modeloDatos = FormsBuilder.XMLForm.getEntidades();
        var panelNewDiv = $('<div><div class="panel panel-default"><div class="panel-body"></div></div></div>');

        var controles = Enumerable.From(control.controles.control).Where("$.tipoControl == 'Columna'").ToArray(); //$(control).children('controles').children('control[tipoControl="Columna"]');

        var hasChild = (control.atributos && control.atributos.atributo) ? Enumerable.From(control.atributos.atributo).Where("$.nombre == 'EntidadHijo'").FirstOrDefault() : null; //$(control).children('atributos').find('atributo[nombre="EntidadHijo"]');
        var hasParent = (control.atributos && control.atributos.atributo) ?Enumerable.From(control.atributos.atributo).Where("$.nombre == 'EntidadPadre'").FirstOrDefault() : null; //$(control).children('atributos').find('atributo[nombre="EntidadPadre"]');
        if (hasChild) {
            panelNewDiv.find('.panel-body').attr('formulariogridedicion', control.idEntidadPropiedad);
            panelNewDiv.find('.panel-body').attr('entidadHijo', hasChild.valor);
            relacionesGrids[control.idEntidadPropiedad] = {};
            filaSeleccionada[control.idEntidadPropiedad] = {};
        } else if (hasParent) {
            panelNewDiv.find('.panel-body').attr('entidadPadre', hasParent.valor);
        } else {
            panelNewDiv.find('.panel-body').attr('formulariogridedicion', control.idEntidadPropiedad);
        }

        var htmlRow = FormsBuilder.Parser.columnsJsonParse(controles, panelNewDiv);
        var controlesFormulario = htmlRow.find('[view-model]');
        controlesFormulario.removeAttr('data-bind');

        var grid = $('<table class="table table-hover tabla-formulariogridedicion" entidad="{0}"></table>'.format(control.idEntidadPropiedad));

        var filaHtml = '<tr class="danger">';
        var gridEncabezado = $('<thead><tr></tr></thead>');
        var gridCuerpo = $('<tbody></tbody>');

        $.each(controlesFormulario, function (key, control) {
            $(control).attr('temp-model', $(control).attr('view-model'));
            if ($(control).attr('muestraEnGrid') !== undefined) {
                var viewmodel = $(control).attr('view-model').substring($(control).attr('view-model').indexOf('P') + 1, $(control).attr('view-model').length).split('_')[0];
                var entidades = Enumerable.From(modeloDatos).Where("$.propiedades != null").ToArray();
                var propiedad = null;
                
                for(var i = 0; i < entidades.length; i++) {
                    var entidad = entidades[i];
                    var entidadBuscada = Enumerable.From(entidad.propiedades.propiedad).Where("$.id == '{0}'".format(viewmodel)).FirstOrDefault();
                    
                    if (entidadBuscada) {
                        propiedad = entidadBuscada;
                        break;
                    }
                }
                
                if (propiedad) {
                    var tituloCorto;
                    if ($(control).attr('muestraEnGrid') !== '') {
                        tituloCorto = $(control).attr('muestraEnGrid');
                    } else {
                        tituloCorto = Enumerable.From(propiedad.atributos.atributo).Where("$.nombre == 'TituloCorto'").FirstOrDefault().valor; //propiedad.find('atributo[nombre="TituloCorto"]').attr('valor');
                    }

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
        filaHtml += '<td style="width: 62px"><img class="btnEditFormularioGridEdicionRow" src="Engine/css/imgs/editar.png" /><img class="btnDeleteFormularioGridEdicionRow" src="Engine/css/imgs/borrar.png" /></td>';
        filaHtml += '<td style="width: 25px"></td>';

        grid.append(gridEncabezado);
        grid.append(gridCuerpo);
        grid.append('<input class="indexFormularioGrid" type="hidden" /><input class="modeFormularioGrid" type="hidden" />');
        
        filaHtml += '</tr>';

        var inputFilaHtml = $('<input class="tmplfrmgrid" type="hidden"/>');
        inputFilaHtml.val(filaHtml);

        htmlRow.append(inputFilaHtml);
        htmlRow.prepend('<div><br /><div/>');
        htmlRow.append('<a class="ancla-tabla" id="#">.</a>');
        htmlRow.append('<button type="button" class="btn btn-primary btn-red btnCancelFormularioGridEdicionRow" style="margin-right: 15px;" entidad="{0}">Cancelar</button>'.format(control.idEntidadPropiedad));
        htmlRow.append('<button type="button" class="btn btn-primary btn-red btnSaveFormularioGridEdicionRow" style="margin-right: 15px;" entidad="{0}">Agregar</button>'.format(control.idEntidadPropiedad));
        htmlRow.append('<button type="button" class="btn btn-primary btn-red btnAddFormularioGridEdicionRow hidden" entidad="{0}">Nuevo</button>'.format(control.idEntidadPropiedad));

        var divResponsive = $('<div class="table-responsive" style="overflow-y: scroll;"></div>');
        divResponsive.append(grid);
        htmlRow.append(divResponsive);

        return "<div class='sat-container-formgridedicion' entidad='{0}'>{1}</div>".format(control.idEntidadPropiedad, htmlRow.html());
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

            // if (SAT.Environment.settings('isHydrate') === false) {

            // }

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

            // removeErrors(tabla.find('tr:last'));

            var viewModels = $(this).parent().find('[view-model]').not('i');
            viewModels.off();

            var that = $(this);

            $.each(viewModels, function (key, ctrlViewModel) {
                $(ctrlViewModel).attr('view-model', $(ctrlViewModel).attr('temp-model') + '_' + counterRowsGrid);
                if ($(ctrlViewModel).is(':checkbox'))
                    $(ctrlViewModel).attr('data-bind', "checked: " + $(ctrlViewModel).attr('view-model'));
                else
                    $(ctrlViewModel).attr('data-bind', "value: " + $(ctrlViewModel).attr('view-model'));

                if ($(ctrlViewModel).attr('muestraEnGrid') !== undefined) {
                    // if (ctrlViewModel.tagName === 'SELECT') {
                    //     var vmmodel_tmp = $(ctrlViewModel).attr('temp-model');

                    //     var control = $(xmlCopy).find('modeloDatos').find('propiedad[id="{0}"]'.format(vmmodel_tmp.substring(vmmodel_tmp.indexOf('P') + 1, vmmodel_tmp.length)));
                    //     var catalogo = control.find('atributo[nombre="Catalogo"]');

                    //     tabla.find('tr:last > td:eq({0})'.format(keysCounter)).attr('data-bind', 'text: GetTexto({0}, {1})'.format($(ctrlViewModel).attr('view-model'), catalogo.attr('valor')));
                    // } else {
                    //     tabla.find('tr:last > td:eq({0})'.format(keysCounter)).attr('data-bind', "text: " + $(ctrlViewModel).attr('view-model'));
                    // }
                    // tabla.find('tr:last > td:eq({0})'.format(keysCounter)).attr('td-viewmodel', $(ctrlViewModel).attr('temp-model'));
                    // keysCounter++;
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

                $(panel).find('span.ic-help').each(AppDeclaracionesSAT.helpIconMobile);

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
                    // fbUtils.applyFormatCurrencyOnElement($(this), true);
                    window.lastElement = $(this);
                });
            }

            var inputsFecha = $(this).parent().find('.panel:first').find("input[mascara]");
            $.each(inputsFecha, function (keyInput, ctrlFecha) {
                $(ctrlFecha).mask($(ctrlFecha).attr('mascara'));
            });
            $(this).parents(".panel:first").find("[ayudaEnDialogo]").focus(AppDeclaracionesSAT.showHelpDialog);

            if (SAT.Environment.settings('dejarsinefecto') === true) {
                $('img.btnEditFormularioGridEdicionRow, img.btnDeleteFormularioGridEdicionRow').remove();
            }

            $('[CopiaElementoGrid]').each(function(k, v){ 
                var indice = $(v).attr('view-model').split('_')[1];
                if (indice !== undefined) {
                    OCULTARGRID('$'+$(v).attr('CopiaElementoGrid')+'_'+indice)();
                }
            });
        });

        $('button.btnSaveFormularioGridEdicionRow').on('click', function () {
            var self = this;
            var func = function() {
                var detalleGrid = FormsBuilder.ViewModel.getDetalleGrid();
                var entidad = $(self).attr('entidad');

                var tabla = $(self).parent().find('table[entidad="{0}"] tbody'.format(entidad));

                var indiceFila = $(self).parent().find('.indexFormularioGrid').val();
                if (SAT.Environment.settings('isHydrate') === false) {
                    var ctls = $(self).parent().find('.panel:first [view-model]:visible');
                    var vacios = true;
                    $.each(ctls, function (key, ctl) {
                        if (ctl.tagName === 'SELECT') {
                            if ($(ctl).val() !== '0' && !$(ctl).hasClass('NoValidarCampoVacio')) {
                                vacios = false;
                            }
                        } else if (ctl.tagName === 'INPUT') {
                            if ($(ctl).is(':checkbox') === true) {
                                if ($(ctl).is(':checked') === true)
                                    vacios = false;
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

                    var indiceBusqueda;
                    for (var i = 0; i < detalleGrid[entidad].length; i++) {
                        for (var elemento in detalleGrid[entidad][i]) {
                            if (elemento.split('_')[1] === indiceFila) {
                                indiceBusqueda = i;
                            }
                        }
                    }

                    $(self).parent().find('.panel').find('[copiaelementogrid]').each(function(key, value) {
                        var id = $(value).attr('view-model');
                        var entidad = fbUtils.getEntidad(id);
                        var idCopia = id.replace('GRID', '');

                        var valorOriginal = detalleGrid[entidad][indiceBusqueda][id]();
                        // if (!IsNullOrEmpty(valorOriginal)) {
                            detalleGrid[entidad][indiceBusqueda][idCopia](valorOriginal);
                        // }
                    });

                    setTimeout(function () {
                        SAT.Environment.setSetting('runRulesCalc', true);
                        runRulesCalc();
                        setTimeout(function () {
                            SAT.Environment.setSetting('runRulesCalc', false);

                            var panel = $(self).parent().find('.panel');
                            panel.find('.currency').each(function(key, value) {
                                setTimeout(function () {
                                    fbUtils.applyFormatCurrencyOnElement(tabla.find('td[td-viewmodel="{0}"]'.format($(value).attr('view-model').split('_')[0])), true);
                                }, 200);
                            });
                        }, 500);
                    }, 500);
                }

                var xmlCopy = FormsBuilder.XMLForm.getCopy();
                modeGrid = $(self).parent().find('.modeFormularioGrid').val();

                if (modeGrid === 'new') {
                    var filaHtml = $(self).parent().find('input[type="hidden"][class="tmplfrmgrid"]').val();
                    tabla.append('{0}'.format(filaHtml));
                    tabla.find('tr').removeClass('danger');
                    tabla.find('tr:last').attr('index', indiceFila);

                    tabla.find('tr:last img.btnEditFormularioGridEdicionRow').tooltip({ title: 'Editar', trigger: 'hover focus' });
                    tabla.find('tr:last img.btnDeleteFormularioGridEdicionRow').tooltip({ title: 'Eliminar', trigger: 'hover focus' });

                    // removeErrors(tabla.find('tr:last'));

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
                    var indiceBusqueda;
                    for (var i = 0; i < detalleGrid[entidad].length; i++) {
                        for (var elemento in detalleGrid[entidad][i]) {
                            if (elemento.split('_')[1] === indiceFila) {
                                indiceBusqueda = i;
                            }
                        }
                    }
                    
                    $(self).parents().eq(5).find('.panel').find('[copiaelementogrid]').each(function(key, value) {
                        var id = $(value).attr('view-model');
                        var entidad = fbUtils.getEntidad(id);
                        var idCopia = id.replace('GRID', '');

                        var valorOriginal = detalleGrid[entidad][indiceBusqueda][idCopia]();
                        detalleGrid[entidad][indiceBusqueda][id](valorOriginal);
                    });

                    var erroresGrid = $(self).parents().eq(5).find('.panel').find('i[vm]');
                    if (erroresGrid.length > 0) {
                        fbViewModel.setBadgeCount($(self), true);
                    //     $('#modalErrorFilaFormularioGridEdicion').modal('show');
                    //     return;
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
           
            var erroresGrid = $(this).parents().eq(5).find('.panel').find('i[vm]');
            if (erroresGrid.length > 0) {
                $('#modalErrorFilaFormularioGridEdicion').modal('show');
                return;
            }

            var detalleGrid = FormsBuilder.ViewModel.getDetalleGrid();
            
            var tabla = $(this).parents("table");
            var tr = $(this).parents().eq(1);
            var indiceFila = tr.attr('index');
            var idEntidad = tabla.attr('entidad');

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
            
            var panel = $(this).parents().eq(5).find('.panel')[0];
            ko.cleanNode(panel);

            $(panel).find('span.ic-help').each(AppDeclaracionesSAT.helpIconMobile);

            var viewModels = $(panel).find('[view-model]').not('i');
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

                // var detalleGrid = FormsBuilder.ViewModel.getDetalleGrid();
                $(this).parents().eq(5).find('.panel').find('[copiaelementogrid]').each(function(key, value) {
                    var id = $(value).attr('view-model');
                    var entidad = fbUtils.getEntidad(id);
                    var idCopia = id.replace('GRID', '');

                    // console.log(entidad, indiceBusqueda, idCopia, detalleGrid[entidad].length);
                    var valorOriginal = detalleGrid[entidad][indiceBusqueda][idCopia]();
                    detalleGrid[entidad][indiceBusqueda][id](valorOriginal);
                    // console.log(valorOriginal);
                });

                $.each($(panel).find('[view-model]'), function(k, controlViewModel) {
                    var vmAttr = $(controlViewModel).attr('view-model');
                    var idEntidadCtrl = vmAttr.substring(1,vmAttr.indexOf('P'));
                    if (idEntidad == idEntidadCtrl) {
                        ko.applyBindings(detalleGrid[idEntidad][indiceBusqueda], controlViewModel);
                    }
                });

                // ko.applyBindings(detalleGrid[idEntidad][indiceBusqueda], panel);
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

                        // case 'Calculo':
                        // case 'Condicion Excluyente':
                        //     if ($(regla).attr('ejecutarAlInicio') === '1' && SAT.Environment.settings('isHydrate') === false) {
                        //         FormsBuilder.ViewModel.CalculoGrid("E{0}P{1}".format(listReglas[key].entidad, listReglas[key].propiedad) + '_' + that.attr('index'), regla);
                        //     }
                        //     break;

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
                    fbUtils.applyFormatCurrencyOnElement(value);
                }, 200);
            });
        });

        $('img.btnDeleteFormularioGridEdicionRow').live('click', function () {
            
            var erroresGrid = $(this).parents().eq(5).find('.panel').find('i[vm]');
            if (erroresGrid.length > 0) {
                $('#modalErrorFilaFormularioGridEdicion').modal('show');
                return;
            }

            jqModalEliminarGridEdicion.modal('show');

            var self = this;

            funcEliminarElemento = function() {
                var detalleGrid = FormsBuilder.ViewModel.getDetalleGrid();

                var tabla = $(self).parents("table");
                var tbody = tabla.find("tbody");
                var tr = $(self).parents().eq(1);
                var indiceFila = tr.attr('index');

                $('#htmlOutput').find('.popover').remove();

                var idEntidad = tabla.attr('entidad');

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

                    removeErrors(tbody, true);

                    if (detalleGrid[idEntidad].length <= 0) {
                        launchRulesOnDelete(idEntidad, false, indiceFila, indiceBusqueda);
                        console.log('.length <= 0');
                    } else if(detalleGrid[idEntidad].length === 1) {
                        //launchRulesOnDelete(idEntidad, true, indiceFila, indiceBusqueda); Ya estaba comentado
                        var xmlCopy = FormsBuilder.XMLForm.getCopy();
                        var propiedades = $(xmlCopy).find('entidad[id="{0}"]'.format(idEntidad));
                        $.each(propiedades.find('propiedad'), function (key, propiedad) {
                            var reglas = $(xmlCopy).find('definicionReglas regla[idPropiedadAsociada="{0}"]'.format($(propiedad).attr('id')));
                            $.each(reglas, function (key, regla) {
                                // if ($(regla).attr('tipoRegla') === 'Calculo' && $(regla).attr('participaEnGrid') !== undefined) {
                                //     FormsBuilder.ViewModel.Calculo($(regla));
                                // }

                                if ($(regla).attr('tipoRegla') === 'Visual' && $(regla).attr('ejecutarEnGridVacio') !== undefined) {
                                    FormsBuilder.ViewModel.Visual($(regla));
                                }
                            });
                        });
                    }

                    tr.remove();

                    if (modeGrid === 'edit') {
                        $('.panel[identidadpropiedad="{0}"]'.format(idEntidad)).find('button.btnAddFormularioGridEdicionRow:first').click();
                    } else if (modeGrid === 'new') {
                        var detalles = detalleGrid[idEntidad][detalleGrid[idEntidad].length - 1];
                        for (var key in detalles) {
                            detalles[key]('');
                        }
                    }
                }
            }
        });

        AppDeclaracionesSAT.resetCursorInputCurrency();
    }

    function getModeGrid() {
        return modeGrid;
    }

    function launchRulesOnDelete(idEntidad, containsMoreRows, indiceFila, indiceBusqueda) {
        // console.log(idEntidad, containsMoreRows, indiceFila, indiceBusqueda);
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
                        // console.log(idEntidad, indiceBusqueda, viewModelId);
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
            ctl.css('width', '87%');
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

    function addRuleGridEdicion(db_id, newValue, callback, isFormGridEdicion) {
        rulesCalc.push({db_id: db_id, newValue: newValue, callback: callback, isFormGridEdicion: isFormGridEdicion});
    }

    function runRulesCalc() {
        for (var i = 0; i < rulesCalc.length; i++) {
            FormsBuilder.ViewModel.applyRuleGridAgregar(rulesCalc[i].db_id, rulesCalc[i].newValue, rulesCalc[i].callback, rulesCalc[i].isFormGridEdicion);
        }
        rulesCalc = [];
    }
})();
