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
    namespace("FormsBuilder.Modules", ControlesGrid, loadedUIControlesGrid, getCgLenQueueRules);

    var counterRowsGrid = 0;
    var applyRulesFuncs = [];

    function ControlesGrid(control) {
        var rowNewDiv = $('<div><input type="hidden"><div class="ctrlsGrid"></div><button type="button" class="btn btn-primary btn-red btnAddCtrlGridRow">Agregar</button></div>');
        var panelNewDiv = $('<div><div class="panel"><div class="panel-body"></div></div></div>');

        var controles = $(control).children('controles').children('control[tipoControl="Grupo"]');
        var htmlRow;

        if (controles.length >= 1) {
            var htmlPanel = $('<div><div class="panel"></div></div>');
            htmlPanel.find('div:last').append(FormsBuilder.Parser.groupsParse(controles, panelNewDiv));
            htmlRow = $(htmlPanel.html());
        } else {
            controles = $(control).children('controles').children('control[tipoControl="Columna"]');
            htmlRow = FormsBuilder.Parser.columnsParse(controles, panelNewDiv);
        }

        htmlRow.children('.panel').addClass('panel-pag').prepend('<div class="panel-heading">1 de 1</div>');
        htmlRow.children('.panel').children('.panel-body:last').append('<div style="clear: both;"><button type="button" class="btn btn-primary btn-red btnDelCtrlGridRow" style="float: right;margin-top: 10px;margin-right: 52px;">Eliminar</button>');

        rowNewDiv.find('.ctrlsGrid').append('<b class="leyenda" style="display: none;">Para capturar información de este régimen de clic al botón <i>"Agregar"</i></b>');

        rowNewDiv.find('input[type="hidden"]').val(htmlRow.html());
        return rowNewDiv.html();
    }

    function loadedUIControlesGrid() {
        $('button.btnAddCtrlGridRow').on('click', function (event) {
            event = event || window.event;
            if (!isValidGrid(event)) return;

            if (SAT.Environment.settings('isHydrate') === false) {
                if ($(this).parent().find('.panel-pag').length > 0) {
                    var ctls = $(this).parent().find('.panel-pag:last [view-model]:visible');
                    var vacios = true;
                    $.each(ctls, function (key, ctl) {
                        if (ctl.tagName === 'SELECT') {
                            if ($(ctl).val() !== '0')
                                vacios = false;
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
                }
            }

            var xmlCopy = FormsBuilder.XMLForm.getCopy();
            var panelColapsable = false;
            var tmpl = $($(this).parent().find('input[type="hidden"]').val());

            var panelsCollapse = tmpl.find('.panel-group');
            if (panelsCollapse.length > 0) {
                panelColapsable = true;
                $.each(panelsCollapse, function (key, panelCollapse) {
                    var uuid = guid().substring(0, 8);
                    var ancla = $(panelCollapse).find('a[data-toggle="collapse"]');
                    $(ancla).attr('href', '#Key{0}'.format(uuid));
                    var panelbody = $(panelCollapse).find('.panel-collapse');
                    $(panelbody).attr('id', 'Key{0}'.format(uuid));
                });
            }
            $(this).parent().find('.ctrlsGrid').append(tmpl);

            if (SAT.Environment.settings('isDAS')) {
                $(this).parent().find('span.ic-help').each(AppDeclaracionesSAT.helpIconMobile);
            } else {
                $(this).parent().find('span.ic-help').each(AppDeclaracionesSAT.helpIcon);
                $(this).parent().find('span.ic-help').on('show.bs.popover', AppDeclaracionesSAT.helpIconPopover);
            }

            $(this).parent().find('.ctrlsGrid').children('.panel:last').find('[view-model]:first').focus();

            AppDeclaracionesSAT.resetCursorInputCurrency($(this).parent().find('.ctrlsGrid').children('.panel:last'));

            var panels = $(this).parent().find('.ctrlsGrid').children('.panel');
            var ctrls = $(this).parent().find('.ctrlsGrid').children('.panel:last').find('[view-model]');
            var lastOrderTab = $(this).parent().find('.ctrlsGrid .panel:first [view-model]:last');
            var ordenTab = (panels.length * ctrls.length) + lastOrderTab.attr('tabindex');

            var $mainContainer = $(this).parents(".bd:first");
            if (panels.length > 0) {
                $mainContainer.find("button.btnAddCtrlGridRow:last").removeClass('hidden');
            }
            $mainContainer.find("[ayudaEnDialogo]").focus(AppDeclaracionesSAT.showHelpDialog);

            $.each(ctrls, function (k, ctrl) {
                $(ctrl).attr('tabindex', ordenTab++);
            });

            $.each(panels, function (k, panel) {
                $(panel).children('.panel-heading').html('{0} de {1}'.format(k + 1, panels.length));
            });

            var viewModels = $(this).parent().find('.ctrlsGrid').children('.panel:last').find('[view-model]');

            $.each(viewModels, function (key, ctrlViewModel) {
                $(ctrlViewModel).attr('view-model', $(ctrlViewModel).attr('view-model') + '_' + counterRowsGrid);
                if ($(ctrlViewModel).attr('data-bind') !== undefined) {
                    $(ctrlViewModel).attr('data-bind', $(ctrlViewModel).attr('data-bind') + '_' + counterRowsGrid);
                }
            });

            var entidad;
            var detalleGrid = FormsBuilder.ViewModel.getDetalleGrid();
            if (viewModels.length > 0) {
                entidad = ($(viewModels[0]).attr('view-model').split('P')[0]).replace('E', '');
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

                        setTimeout(function () {
                            var verifyCheckbox = $('#htmlOutput').find('[view-model="{0}"]'.format(db_id));
                            if (verifyCheckbox.attr('paneldinamico') !== undefined) {
                                var controlPanel = verifyCheckbox.parents().eq(3).find('.panel-group[paneldinamico="{0}"]'.format(verifyCheckbox.attr('paneldinamico')));
                                verifyCheckbox.is(':checked') ? controlPanel.show() : controlPanel.hide();
                            }
                        }, 150);

                        var isDejarSinEfecto = SAT.Environment.settings('dejarsinefecto');
                        var aplicarRegla = SAT.Environment.settings('applyrules');
                        if (aplicarRegla && !isDejarSinEfecto) {

                            if ((SAT.Environment.settings('loadedPrecargarAnexo') === false &&
                                $.inArray(db_id.split('_')[0], SAT.Environment.settings("thisPropertiesNotExecuteRules")) < 0) ||
                                (SAT.Environment.settings('loadedPrecargarAnexo') === true)) {

                                var applyRuleFunc = function () {
                                    FormsBuilder.ViewModel.applyRuleGrid(db_id, newValue);
                                };
                                applyRulesFuncs.push(applyRuleFunc);

                                setTimeout(function () {
                                    if (applyRulesFuncs.length) {
                                        var func = applyRulesFuncs.shift();
                                        func.call();
                                    }
                                }, 1);
                            }
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

                var panel = $(this).parent().find('.ctrlsGrid').children('.panel:last')[0];

                ko.applyBindings(detalleGrid[entidad][detalleGrid[entidad].length - 1], panel);
            }

            if ($(this).parent().find('input[paneldinamico]').length > 0) {
                FormsBuilder.Modules.loadedUIPanelDinamico();
            }

            $(this).parent().find('.ctrlsGrid').children('.panel:last').find('[view-model]').focus(function () {
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
            $(this).parent().find('.ctrlsGrid').children('.panel:last').find('.currency').blur(function () {
                window.lastElement = $(this);
            });

            if (SAT.Environment.settings('applyrulesvalidation') === true) {
                ejecutarReglasIniciales(entidad, counterRowsGrid, false);
            }

            var height = $(this).parent().find('.ctrlsGrid').children('.panel:first').height();
            if (panels.length <= 1) {
                $('#htmlOutput').parent().scrollTop(130)
            } else {
                var offset = 0;
                if (panels.length > 1)
                    offset = (panels.length - 1) * 15;

                $('#htmlOutput').parent().scrollTop(((height * (panels.length - 1)) + 155) + offset);
            }

            $mainContainer.find(".leyenda").hide();
        });

        function ejecutarReglasIniciales(entidad, counterRowsGrid, esDejarSinEfecto) {
            var xmlCopy = FormsBuilder.XMLForm.getCopy();
            var propiedadesReglas = $(xmlCopy).find('definicionReglas > propiedades > propiedad[idEntidadPropiedad="{0}"]'.format(entidad));
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

            if (esDejarSinEfecto === true) {
                for (var key in listReglas) {
                    var regla = $(xmlCopy).find('definicionReglas > reglas > regla[id="{0}"]'.format(listReglas[key].idRegla));
                    if (regla.attr('ejecutarAlInicio') === '1') {
                        switch (regla.attr('tipoRegla')) {
                            case 'Visual':
                                FormsBuilder.ViewModel.VisualGrid("E{0}P{1}".format(listReglas[key].entidad, listReglas[key].propiedad) + '_' + (counterRowsGrid - 1), regla);
                                break;
                        }
                    }
                }
            } else {
                for (var key in listReglas) {
                    var regla = $(xmlCopy).find('definicionFormulario > definicionReglas > reglas > regla[id="{0}"]'.format(listReglas[key].idRegla));
                    if (regla.attr('ejecutarAlInicio') === '1') {
                        switch (regla.attr('tipoRegla')) {
                            case 'Validacion':
                                FormsBuilder.ViewModel.ValidacionGrid("E{0}P{1}".format(listReglas[key].entidad, listReglas[key].propiedad) + '_' + (counterRowsGrid - 1), regla);
                                break;

                            case 'Visual':
                                FormsBuilder.ViewModel.VisualGrid("E{0}P{1}".format(listReglas[key].entidad, listReglas[key].propiedad) + '_' + (counterRowsGrid - 1), regla);
                                break;

                            case 'Calculo':
                                // case 'Condicional Excluyente':
                                var definicion = FormsBuilder.ViewModel.DeshabilitarCalculoGrid("E{0}P{1}".format(listReglas[key].entidad, listReglas[key].propiedad), regla);
                                var exprs = definicion.split("=");
                                if (exprs.length > 0) {
                                    if (exprs[0] !== "") {
                                        var fieldExpr = FormsBuilder.ViewModel.getFieldsForExprsGrid()[exprs[0]];
                                        if (fieldExpr !== undefined) {
                                            var db_id = "E{0}P{1}".format(fieldExpr.entidad, fieldExpr.propiedad);
                                            $('#htmlOutput [view-model="{0}"]'.format(db_id)).attr('disabled', true);
                                        }
                                    }
                                }
                                if (SAT.Environment.settings('isHydrate') === false) {
                                    FormsBuilder.ViewModel.CalculoGrid("E{0}P{1}".format(listReglas[key].entidad, listReglas[key].propiedad) + '_' + (counterRowsGrid - 1), regla);
                                }
                                break;
                        }
                    }
                }
            }
        }

        $('button.btnDelCtrlGridRow').live('click', function () {
            var ctrlsGrid = $(this).parents().eq(4).find('.ctrlsGrid');

            var actualPanel = $(this).parents().eq(2);
            var viewModel = actualPanel.find('[view-model]:first').attr('view-model');
            var entidad = (viewModel.split('P')[0]).replace('E', '');

            var iconErrors = actualPanel.find('i[vm]');
            if (iconErrors.length > 0) {
                $.each(iconErrors, function (key, iconError) {
                    var rules = JSON.parse($(iconError).attr('rules'));
                    rules.forEach(function (el) {
                        $('.panelalert').find('i[rule="{0}"][dbid="{1}"]'.format(el, $(iconError).attr('vm'))).remove();
                    });
                    $('.number').html($('.panelalert i').length);
                    if ($('.panelalert').find("i[entidad='{0}']".format(entidad)).length === 0) {
                        $('.panelalert').find("div[entidad='{0}']".format(entidad)).remove();
                    }
                });
            }
            var mainContainer = actualPanel.parents(".bd:first");
            actualPanel.remove();

            var panels = ctrlsGrid.children('.panel');
            var ctrls = ctrlsGrid.find('.panel:last [view-model]');
            var lastOrderTab = ctrlsGrid.find('.panel:first [view-model]:last');
            var ordenTab = (panels.length * ctrls.length) + lastOrderTab.attr('tabindex');

            $.each(ctrls, function (index, ctrl) {
                $(ctrl).attr('tabindex', ordenTab++);
            });

            $.each(panels, function (index, panel) {
                $(panel).children('.panel-heading').html('{0} de {1}'.format(index + 1, panels.length));
            });

            var detalleGrid = FormsBuilder.ViewModel.getDetalleGrid();
            for (var detalle in detalleGrid[entidad]) {
                for (var detalleItem in detalleGrid[entidad][detalle]) {
                    if (detalleItem === viewModel) {
                        detalleGrid[entidad].splice(detalle, 1);

                        if (detalleGrid[entidad].length > 0) {
                            var xmlCopy = FormsBuilder.XMLForm.getCopy();
                            var propiedades = $(xmlCopy).find('entidad[id="{0}"]'.format(entidad));
                            $.each(propiedades.find('propiedad'), function (key, propiedad) {
                                var reglas = $(xmlCopy).find('definicionReglas regla[idPropiedadAsociada="{0}"]'.format($(propiedad).attr('id')));
                                $.each(reglas, function (key, regla) {
                                    if ($(regla).attr('tipoRegla') === 'Calculo') {
                                        FormsBuilder.ViewModel.CalculoGrid("E{0}P{1}".format(entidad, $(propiedad).attr('id')), $(regla));
                                    }
                                });
                            });
                        }
                        break;
                    }
                }
            }

            if (detalleGrid[entidad].length > 0) {
                var xmlCopy = FormsBuilder.XMLForm.getCopy();
                var propiedades = $(xmlCopy).find('entidad[id="{0}"]'.format(entidad));
                $.each(propiedades.find('propiedad'), function (key, propiedad) {
                    var reglas = $(xmlCopy).find('definicionReglas regla[idPropiedadAsociada="{0}"]'.format($(propiedad).attr('id')));
                    $.each(reglas, function (key, regla) {
                        if ($(regla).attr('tipoRegla') === 'Validacion') {
                            for (var detalle in detalleGrid[entidad]) {
                                var props = Object.getOwnPropertyNames(detalleGrid[entidad][detalle]);
                                FormsBuilder.ViewModel.ValidacionGrid("E{0}P{1}".format(entidad, $(propiedad).attr('id')) + '_' + props[0].split('_')[1], $(regla));
                            }
                        }
                        if ($(regla).attr('tipoRegla') === 'Calculo' && $(regla).attr('definicion').match(/SUMA/igm) !== null) {
                            for (var detalle in detalleGrid[entidad]) {
                                var props = Object.getOwnPropertyNames(detalleGrid[entidad][detalle]);
                                FormsBuilder.ViewModel.CalculoGrid("E{0}P{1}".format(entidad, $(propiedad).attr('id')) + '_' + props[0].split('_')[1], $(regla));
                            }
                        }
                    });
                });
            }

            if (panels.length === 0) {
                mainContainer.find(".leyenda").show();

                var xmlCopy = FormsBuilder.XMLForm.getCopy();
                var propiedades = $(xmlCopy).find('entidad[id="{0}"]'.format(entidad));
                $.each(propiedades.find('propiedad'), function (key, propiedad) {
                    var reglas = $(xmlCopy).find('definicionReglas regla[idPropiedadAsociada="{0}"]'.format($(propiedad).attr('id')));
                    $.each(reglas, function (key, regla) {
                        if ($(regla).attr('tipoRegla') === 'Calculo' && $(regla).attr('participaEnGrid') !== undefined) {
                            FormsBuilder.ViewModel.Calculo($(regla));
                        }

                        if ($(regla).attr('tipoRegla') === 'Visual' && $(regla).attr('ejecutarEnGridVacio') !== undefined) {
                            FormsBuilder.ViewModel.Visual($(regla));
                        }
                    });
                });
            }
        });
    }

    function isValidGrid(event) {
        var result = false;
        if (event) {
            var $mainContainer = $(event.target).parents('.panel:first');
            result = $mainContainer.find(".ctrlsGrid input.sat-val-error").length <= 0;
        }
        return result;
    }

    function getCgLenQueueRules() {
        return applyRulesFuncs.length;
    }
})();
