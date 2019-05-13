/** @module FormsBuilder.Modules */
/**
 * Modulo para el render de formularios que crea una caja de texto
 * 
 * (c) SAT 2013, Iván González
 */
/*global namespace:false, FormsBuilder:false, SAT: false, AppDeclaracionesSAT:false, ko:false, Base64:false */

"use strict";

(function() {
    namespace("FormsBuilder.Modules", CuadroDetalle, loadedUI);

    var CONTROL_LAYOUT = 'input';
    var LABEL_LAYOUT = 'etiqueta';

    function CuadroDetalle(control) {
        var ctrlBase = FormsBuilder.Modules.ControlBase();
        var db_id = FormsBuilder.Utils.getDbId2(control);

        var rowNewDiv = $('<div><div style="display: table; overflow: hidden;" class="sat-height-field"><div style="display: table-cell; vertical-align: bottom;"></div></div><input type="text" onpaste="return false;" class="form-control sat-height-dlg sat-textbox-dialog sat-detalle sat-height-field" style="width: 80%!important;" placeholder="" /><a data-idcontrol="{0}" data-toggle-dialogo="modal" class="btn btn-primary btn-red sat-button-dialog">Detalle</a><span class="ic-help"></span><div class="clear"></div></div>'.format(control.id));

        rowNewDiv.find(CONTROL_LAYOUT).attr('id', control.id);
        rowNewDiv.find(".sat-height-field").children().attr('data-titulo-control', control.id);

        var entidad = Enumerable.From(FormsBuilder.XMLForm.getEntidades()).Where("$.id == {0}".format(control.idEntidadPropiedad)).FirstOrDefault();
        var atributo = Enumerable.From(entidad.propiedades.propiedad).Where("$.id == '{0}'".format(control.idPropiedad)).FirstOrDefault();

        var title;
        if (SAT.Environment.settings('isDAS')) {
            if (control.atributos !== undefined) {
                title = Enumerable.From(control.atributos.atributo).Where("$.nombre == 'TituloCorto'").FirstOrDefault();
            }

            title = title !== undefined ? title : Enumerable.From(atributo.atributos.atributo).Where("$.nombre == 'TituloCorto'").FirstOrDefault();
        } else {
            title = Enumerable.From(atributo.atributos.atributo).Where("$.nombre == 'TituloCorto'").FirstOrDefault();
        }

        var titleLarge = Enumerable.From(atributo.atributos.atributo).Where("$.nombre == 'TituloLargo'").FirstOrDefault({ valor: "" });
        var helpText = ctrlBase.getHelpText.apply(this, [control]);

        var tituloDialogo;
        if (atributo.atributos.atributo !== undefined) {
            tituloDialogo = Enumerable.From(atributo.atributos.atributos).Where("$.nombre == 'TituloDialogo'").FirstOrDefault();
        }
        if (tituloDialogo !== undefined) {
            rowNewDiv.find('a').attr('TituloDialogo', tituloDialogo.valor);
        }

        rowNewDiv.find('div:first > div').html(title.valor);

        ctrlBase.formatCurrency.apply(this, [atributo, rowNewDiv, CONTROL_LAYOUT]);
        ctrlBase.validaLongitud.apply(this, [control, rowNewDiv, CONTROL_LAYOUT]);
        ctrlBase.alineacionHorizontal.apply(this, [control, rowNewDiv, CONTROL_LAYOUT]);

        rowNewDiv.find(CONTROL_LAYOUT).attr('cuadrodialogo', '');
        rowNewDiv.find(CONTROL_LAYOUT).attr('onkeydown', 'TabCuadroDetalle(event)');

        ctrlBase.ordenTabulador.apply(this, [control, rowNewDiv, CONTROL_LAYOUT]);

        var helpString = ctrlBase.helpString.apply(this, [titleLarge, helpText]);

        rowNewDiv.find(CONTROL_LAYOUT).attr('help-text', helpString);
        rowNewDiv.find(CONTROL_LAYOUT).attr('data-bind', 'valueUpdate: "blur", value: {0}'.format(db_id));
        rowNewDiv.find(CONTROL_LAYOUT).attr('view-model', db_id);
        rowNewDiv.find('a').attr('view-model', db_id);

        window[control.id] = control.controles.control;

        return rowNewDiv.html();
    }

    function loadedUI() {
        $('#htmlOutput a[data-toggle-dialogo]').on('click', function() {
            var idEntidadPropiedad;
            var db_id = $(this).attr('view-model');
            var idControl = $(this).attr('data-idcontrol');
            var dlg = $('[sat-dlg-dbid="{0}"] div:first'.format(db_id));

            if (dlg.length <= 0) {
                $(document.body).append($('<div><div sat-dlg-dbid="{0}"></div></div>'.format(db_id)).find('[sat-dlg-dbid]').html($('#templateCuadroDialogoModal').html()));
                dlg = $('[sat-dlg-dbid="{0}"] div:first'.format(db_id));
                dlg.find('.sat-view-model-row-id').val($(this).attr('view-model'));

                dlg.find('#lblTituloCuadroDialogo').text($(this).attr('titulo-dialogo'));

                var tableRows = window[idControl];
                dlg.find('.sat-table').addClass('align-texts');
                dlg.find('.sat-table').html('<tr class="active sat-table-titles"></tr>');
                dlg.find('.sat-table-titles').html('');

                $.each(tableRows, function(k, control) {
                    idEntidadPropiedad = control.idEntidadPropiedad;

                    if (control.tipoControl !== "ControlConsecutivo") {
                        var entidad = Enumerable.From(FormsBuilder.XMLForm.getEntidades()).Where("$.id == {0}".format(control.idEntidadPropiedad)).FirstOrDefault();
                        var atributo = Enumerable.From(entidad.propiedades.propiedad).Where("$.id == '{0}'".format(control.idPropiedad)).FirstOrDefault();
                        var titleTh = Enumerable.From(atributo.atributos.atributo).Where("$.nombre == 'TituloCorto'").FirstOrDefault();

                        dlg.find('.sat-table-titles').append('<td>{0}</td>'.format(titleTh.valor || ''));
                    }
                });
                dlg.find('.sat-table-titles').append('<td></td>');

                var htmlFileOnce = '';
                $.each(tableRows, function(k, control) {
                    if (control.tipoControl !== "ControlConsecutivo") {
                        var htmlDlg = FormsBuilder.HTMLBuilder.generate(control);
                        htmlFileOnce += '<th style="text-align: center;">{0}</th>'.format(htmlDlg);
                    }
                });
                htmlFileOnce += '<th style="text-align: center;"><a href="#" class="btn btn-sm btn-primary btn-red delete">Eliminar</a></th>';
                dlg.find('.sat-tmpl-row').val('<tr item="">{0}</tr>'.format(htmlFileOnce));

                dlg.find('#nuevaFila').off();
                dlg.find('#nuevaFila').on('click', function() {
                    var newRow = dlg.find('.sat-tmpl-row').val();

                    dlg.find('.sat-table').append(newRow);

                    dlg.find('span.ic-help').each(function(k, v) {
                        var that = $(v);
                        var sibling = that.prev();
                        var helpText = sibling.attr('help-text');
                        if (helpText === undefined) {
                            helpText = that.parent().parent().next().attr('help-text');
                        }

                        if (helpText === undefined) {
                            sibling = sibling.prev();
                            helpText = sibling.attr('help-text');
                        }

                        //Quita las ayudas que solo tienen el título largo y no texto de ayuda, de lo contrario agrega la funcionalidad del click
                        if (helpText !== undefined) {
                            var check = helpText.split('<span>');
                            if (check.length < 3) {
                                that.remove();
                            } else {
                                sibling.css('width', '82%');

                                that.popover({
                                    trigger: 'click',
                                    template: '<div class="popover pophelp" role="tooltip"><div class="arrow"></div><h3 class="popover-title"></h3><div class="popover-content"></div></div>',
                                    placement: "left",
                                    content: '<div><div style="clear: both"></div>{0}</div>'.format(helpText),
                                    html: "true"
                                });
                            }
                        }
                    });

                    dlg.find('input[type="text"]').css('text-align', 'right');

                    dlg.find('input[class*="currency"]:last').blur(formatCurrency).focus(toNumber);

                    dlg.find('.delete:last').on('click', function() {
                        $(this).parents().eq(1).remove();
                        setMontoEstimulo(dlg);
                    });
                });

                dlg.find('#acceptTable').off();
                dlg.find('#acceptTable').on('click', function() {
                    var that = this;
                    var noDuplicados = dlg.find('table select[sinduplicidad]');

                    var duplicate = false;
                    var seleccionarValor = false;
                    if (noDuplicados.length > 0) {
                        var valsSelects = [];
                        $.each(noDuplicados, function(k, select) {
                            if ($(select).val() === '0') {
                                seleccionarValor = true;
                            }
                            if ($.inArray($(select).val(), valsSelects) < 0) {
                                valsSelects.push($(select).val());
                            } else {
                                duplicate = true;
                            }
                        });
                    }

                    if (seleccionarValor) {
                        setTimeout(function() {
                            $(that).popover('hide');
                        }, 1000 * 3);

                        $(that).popover('destroy');
                        $(that).popover({
                            trigger: 'manual',
                            content: "El estímulo es obligatorio.",
                            placement: "bottom"
                        }).popover('show');

                        return;
                    }

                    if (duplicate) {
                        setTimeout(function() {
                            $(that).popover('hide');
                        }, 1000 * 3);

                        $(that).popover('destroy');
                        $(that).popover({
                            trigger: 'manual',
                            content: "Seleccionó un estímulo más de una vez. Favor de verificar",
                            placement: "bottom"
                        }).popover('show');

                        return;
                    }

                    var inputs = dlg.find('table input[type="text"]');
                    var valorVacio = [];
                    $.each(inputs, function(key, input) {
                        var valueInput = $(input).val();

                        if (IsNullOrEmptyWhite(valueInput)) {
                            valorVacio.push({ mensajeError: $(input).attr("MensajeValidacion") });
                            return false;
                        }
                        var valueParsed = parseInt(valueInput);
                        if (valueParsed == 0) {
                            valorVacio.push({ mensajeError: "El monto debe ser mayor a cero" });
                            return false;
                        }
                    });

                    if (valorVacio.length > 0) {
                        setTimeout(function() {
                            $(that).popover('hide');
                        }, 1000 * 3);

                        $(that).popover('destroy');
                        $(that).popover({
                            trigger: 'manual',
                            content: valorVacio[0].mensajeError,
                            placement: "bottom"
                        }).popover('show');

                        return;
                    }

                    var suma = 0;
                    var inputsAcumular = dlg.find('table input[type="text"][acumular]');
                    $.each(inputsAcumular, function(key, input) {
                        $(input).toNumber();
                        var value = $(input).val();
                        if (!IsNullOrEmptyWhite(value)) {
                            suma += parseInt(value);
                        }
                    });

                    var viewModelDetalle = FormsBuilder.ViewModel.getDetalle();
                    viewModelDetalle[idEntidadPropiedad] = [];

                    var items = dlg.find('table tr[item]');
                    $.each(items, function(key, item) {
                        var objItem = [];
                        $.each($(item).find('.form-control'), function(k, control) {
                            objItem.push({ propiedad: $(control).attr('view-model').substring($(control).attr('view-model').indexOf('P') + 1, $(control).attr('view-model').length), valor: $(control).val(), etiqueta: $(control).find(':selected').text() });
                        });
                        viewModelDetalle[idEntidadPropiedad].push(objItem);
                    });

                    var db_id = dlg.find('.sat-view-model-row-id').val();
                    FormsBuilder.ViewModel.getDetalleFK()[db_id] = idEntidadPropiedad;
                    var viewModelId = (db_id.split('P')[0]).replace('E', '');
                    if (suma > 0) {
                        FormsBuilder.ViewModel.get()[viewModelId][db_id](suma);
                    } else {
                        FormsBuilder.ViewModel.get()[viewModelId][db_id]('');
                    }

                    $("input[view-model={0}]".format(db_id)).trigger("blur");
                    $.each(inputsAcumular, function(key, input) {
                        var format = FormsBuilder.Utils.getFormatCurrency();
                        $(this).formatCurrency(format);
                    });

                    dlg.modal('hide');
                });

                dlg.find('#cancelTable').off();
                dlg.find('#cancelTable').on('click', function() {
                    var inputs = dlg.find('table input[type="text"][acumular]');
                    if (inputs.length > 0) {
                        $("#modalYesNo").find('.si').off();
                        $("#modalYesNo").find('.si').on("click", function(e) {
                            dlg.find('table tr[item]').remove();

                            var db_id = dlg.find('.sat-view-model-row-id').val();
                            var entidad = (db_id.split('P')[0]).replace('E', '');
                            var actualValue = FormsBuilder.ViewModel.get()[entidad][db_id]();

                            if (!IsNullOrEmptyWhite(actualValue)) {
                                FormsBuilder.ViewModel.get()[entidad][db_id]('');
                            }

                            $("#modalYesNo").modal('hide');
                            dlg.modal('hide');
                        });
                        $("#modalYesNo").find('.no').off();
                        $("#modalYesNo").find('.no').on("click", function(e) {
                            $("#modalYesNo").modal('hide');
                        });

                        $("#modalYesNo").modal({
                            show: true,
                            backdrop: "static"
                        });
                    } else {
                        dlg.modal('hide');
                        var db_id = dlg.find('.sat-view-model-row-id').val();
                        var actualValue = FormsBuilder.ViewModel.get()[(db_id.split('P')[0]).replace('E', '')][db_id]();
                        if (!IsNullOrEmptyWhite(actualValue)) {
                            FormsBuilder.ViewModel.get()[(db_id.split('P')[0]).replace('E', '')][db_id]('');
                        }
                    }
                });

                dlg.find('table input[type="text"][acumular]').live('change', function() {
                    setMontoEstimulo(dlg);
                });
            }

            if (SAT.Environment.settings('showdialogs')) {
                dlg.modal({
                    show: true,
                    backdrop: "static"
                });
                setMontoEstimulo(dlg);
            }
        });
    }

    function setMontoEstimulo(selector) {
        var montoEstimulo = 0;
        var formato = FormsBuilder.Utils.getFormatCurrency();
        var inputs = selector.find('table input[type="text"][acumular]');
        $.each(inputs, function(key, input) {
            $(input).toNumber();
            var value = $(input).val();
            if (!IsNullOrEmptyWhite(value)) {
                montoEstimulo += parseInt(value);
            }
            $(input).formatCurrency(formato);
        });


        selector.find('#lblMontoEstimulo').html(montoEstimulo);
        selector.find('#lblMontoEstimulo').formatCurrency(formato);
    }

    function formatCurrency() {
        $(this).formatCurrency(FormsBuilder.Utils.getFormatCurrency());
    }

    function toNumber() {
        $(this).toNumber();
    }
})();