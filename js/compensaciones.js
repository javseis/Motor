/** @module FormsBuilder.CompensacionesSAT */
/**
* Modulo de Compensaciones, Inicia Funciones y Eventos para Modal
*
* (c) SAT 2013, Jorge Luiz Gómez
*/
/*global namespace:false, FormsBuilder:false, SAT: false, AppDeclaracionesSAT:false, ko:false, Base64:false */

"use strict";

(function () {
    namespace("FormsBuilder.CompensacionesSAT", initUIModalCompensaciones, getCompesacionesPeriodicidad);
    window.fbCompensaciones = FormsBuilder.CompensacionesSAT;

    var cantidadCompensacion;

    var CATALOGO_TIPO_SALDO = 14;
    var CATALOGO_COMPENSACIONES = 16;
    var CATALOGO_COMPENSACIONES_PERIODICIDAD = 17;
    var CATALOGO_COMPENSACIONES_VIGENCIA = 18;
    var CATALOGO_OBLIGACION = 19;
    var CATALOGO_PERIODICIDAD = 20;
    var CATALOGO_PERIODO = 21;
    var CATALOGO_TIPO_DECLARACION = 24;

    var RFC = '';
    var OBLIGACION_DESTINO = '';

    var MENSAJE_ERROR = 'El campo no puede quedar vacío';
    var MENSAJE_ERROR_ZERO = 'El monto debe ser mayor a cero';

    var ENTIDAD = null;
    var idEntidadPropiedad = 1;
    //var CONTROL_MODELO = '';

    var TIPO_PERSONA = '';

    function setMonto(selector, montoCompesacion) {
        selector.find('#lblMonto').html(montoCompesacion);
        var formato = FormsBuilder.Utils.getFormatCurrency();
        selector.find('#lblMonto').formatCurrency(formato);
    }

    function initUIModalCompensaciones(pRfc, pObligacionDestino, controlModelo) {
        RFC = pRfc;
        OBLIGACION_DESTINO = pObligacionDestino;
        //db_id = controlModelo;
        TIPO_PERSONA = SAT.Environment.settings('tipopersona');
        var tipoEntidad = "SAT_COMPENSACIONES";

        var CONTAINER_ID = 0;
        //var cuadrosDetalle = jsonPath.eval(FormsBuilder.XMLForm.getControles(),"$..[?(@.tipoControl == 'CuadroDetalleCompensaciones')]");
        //FormsBuilder.XMLForm.getCopy().find('control[tipoControl="{0}"]'.format('CuadroDetalleCompensaciones')).find('atributos').find('atributo[valor={0}]'.format(OBLIGACION_DESTINO)).parents().eq(1);
        var entidadesJson = FormsBuilder.XMLForm.getEntidades();
        var entidadesPagos = Enumerable.From(entidadesJson).Where(function (item) { return Enumerable.From(item.atributos.atributo).Any("$.valor == '{0}'".format(pObligacionDestino)) }).ToArray();
        var $entidadCompensaciones = Enumerable.From(entidadesPagos).Where(function (item) { return Enumerable.From(item.atributos.atributo).Any("$.valor == '{0}'".format(tipoEntidad)) }).FirstOrDefault();
        //var entidadCompensaciones = Enumerable.From(entidadesPagos).Where("$.atributos.atributo.valor == '{0}'".format("SAT_COMPENSACIONES")).ToArray();
        idEntidadPropiedad = $entidadCompensaciones.id;

        //idEntidadPropiedad = ENTIDAD.find('controles').find('control').first().attr('idEntidadPropiedad');
        //console.log(controlModelo);
        var db_id = controlModelo;
        // Se crea el contenedor para los dialogos tipo estimulos
        var dlg = $('[sat-dlg-compensaciones-dbid="{0}"] div:first'.format(db_id));
        //console.log(dlg.length, db_id);
        if (dlg.length <= 0) {
            var promise = $.when($(document.body).append($('<div><div class="dlgCompensanciones" sat-dlg-compensaciones-dbid="{0}"></div></div>'.format(db_id)).find('[sat-dlg-compensaciones-dbid]').html($('#templateDlgCompensanciones').html())));
            promise.done(function () {
                dlg = $('[sat-dlg-compensaciones-dbid="{0}"] div:first'.format(db_id));
                dlg.find('.sat-view-model-row-id').val($(this).attr('view-model'));
                dlg.find('#lblMonto').html('0');
                $('#btnTerminar').popover('destroy');

                //Evento para Agregar nueva Fila de Compensaciones
                dlg.find('#addItem').on('click', function () {
                    $('#btnTerminar').popover('destroy');

                    var container = dlg.find('.modal-body');
                    var sumaCompensaciones = 0;

                    $(container).find('input[id*="{0}"]'.format('txtSaldoAplicar')).each(function () {
                        $(this).toNumber();
                        if (!(IsNullOrEmpty($(this).val()))) {
                            sumaCompensaciones += parseInt($(this).val());
                            setMonto(dlg, sumaCompensaciones);
                        }
                        var format = FormsBuilder.Utils.getFormatCurrency();
                        $(this).formatCurrency(format);
                    });

                    var containerRows = $('<div/>');
                    var newRow = containerRows.append($($('#templateRowCompensaciones').html()));
                    newRow.find('div:first').attr('id', "container_{0}".format(CONTAINER_ID));

                    container.append(newRow);
                    container.find(".sat-row-compensaciones:last #tipoSelect").focus();

                    container.find("#container_{0} input.currency".format(CONTAINER_ID)).blur(function (e) {
                        var format = FormsBuilder.Utils.getFormatCurrency();
                        $(this).formatCurrency(format);
                    });

                    container.find("#container_{0} input.currency".format(CONTAINER_ID)).focus(function (e) {
                        $(this).toNumber();
                    });

                    var select = container.find('#tipoSelect:last');
                    LlenaCombo(select, CATALOGO_TIPO_SALDO, 'valor', 'texto');

                    container.find('#txtFechaCausacion:last').mask('99/99/9999');
                    container.find('#txtFechaDeclaracion:last').mask('99/99/9999');

                    container.find('#txtNumeroOperacion:last, #txtNumeroOperacion1:last').keyup(function (e) {

                        if (new RegExp(/[^a-zA-Z0-9\ñ\Ñ]/g).test($(this).val())) {
                            console.log($(this).val());
                            e.preventDefault();
                        }
                    });

                    CONTAINER_ID++;
                });

                //Funcionalidad del Botón Eliminar
                dlg.find('#btnEliminar').live("click", function (e) {
                    $('#btnTerminar').popover('destroy');
                    var totalCompesanciones = parseInt(dlg.find('#lblMonto').toNumber().html());

                    if (totalCompesanciones > 0) {
                        var cantidadRestar = $(e.target).parent().find('input[id*="{0}"]'.format('txtSaldoAplicar')).toNumber().val();
                        if (!(IsNullOrEmpty(cantidadRestar))) {
                            totalCompesanciones -= cantidadRestar;
                            setMonto(dlg, totalCompesanciones);
                        }
                    }
                    $(e.target).parents().eq(2).remove();
                    var format = FormsBuilder.Utils.getFormatCurrency();
                    dlg.find('#lblMonto').formatCurrency(format);
                });

                //Funcionalidad del Botón Cancelar
                dlg.find('#btnCancelar').off();
                //var db_id_copy = db_id;
                dlg.find('#btnCancelar').on("click", function (e) {
                    var rows = dlg.find('.sat-row-compensaciones').length;

                    var events = $('#dlgCancelar #btnAceptar').data('events');
                    //if (IsNullOrEmpty(events) || !$.isArray(events.click) || events.click.length == 0) {
                    //Funcionalidad del Botón Aceptar
                    $('#btnAceptar').off();
                    $('#btnAceptar').on("click", function (e) {
                        //console.log('Dialogo -', db_id);
                        dlg = $('[sat-dlg-compensaciones-dbid="{0}"] div:first'.format(db_id));
                        if (rows > 0) {
                            dlg.find('.modal-body').children().remove();
                        }
                        $('#dlgCompensanciones').parent().find('input[view-model="{0}"]'.format(db_id)).val('');
                        FormsBuilder.ViewModel.get()[(db_id.split('P')[0]).replace('E', '')][db_id]('');
                        $('#dlgCancelar').modal('hide');
                        dlg.modal('hide');
                        dlg.find('#lblMonto').html("0");
                    });
                    $('#dlgCancelar').off();
                    $('#dlgCancelar').on('click', function (e) {
                        $('#dlgCancelar').modal('hide');
                    });
                    //}

                    var total = calculateTotal(db_id);
                    FormsBuilder.ViewModel.get()[(db_id.split('P')[0]).replace('E', '')][db_id](total);

                    $('#btnTerminar').popover('destroy');

                    if (rows > 0) {
                        $('#dlgCancelar').modal('show');
                    }
                    else {
                        dlg.modal('hide');
                        FormsBuilder.ViewModel.get()[(db_id.split('P')[0]).replace('E', '')][db_id]('');
                    }
                });

                //Funcionalidad del Botón Terminar
                dlg.find('#btnTerminar').on("click", function () {
                    var container = dlg.find('.modal-body');

                    container.find('#txtFechaDeclaracion').each(function () {
                        clearDatePickerError($(this));
                        var value = $(this).val();
                        var fechaCausacion = $(this).parents().eq(8).find('input[id="txtFechaCausacion"]').val();
                        var idperiodo = $(this).parents().eq(8).find('select[id="periodoSelect"]').find('option:selected').val();
                        if (IsNullOrEmpty(value)) {
                            setDatePickerError($(this), MENSAJE_ERROR);
                        } else {
                            var isDate = /[0-9]{2}\/[0-9]{2}\/[0-9]{4}/igm.test(value);
                            if (isDate) {
                                var dateValue = Date.parseExact(value, ["dd/MM/yyyy"]);
                                //var AnioSeleccionado = new Date(dateValue).getFullYear();
                                // var fechaDeclaracion = FECHA(FormsBuilder.ViewModel.get()["1002"]["E1002P38"]());
                                if (dateValue == null) {
                                    setDatePickerError($(this), "La fecha es inválida");
                                }
                                var anioActualregistro = $(this).parents().eq(8).find('select[id="ejercicioSelect"]').find('option:selected').val();
                                var mesinicio = FormsBuilder.Catalogs.getAll().find("catalogo[id='{0}']".format(CATALOGO_PERIODO)).find('elemento[valor="{0}"]'.format(idperiodo)).attr('mesIni');
                                mesinicio = mesinicio.length < 2 ? '0' + mesinicio : mesinicio;
                                var fechacompuesta = '01/{0}/{1}'.format(mesinicio, anioActualregistro);
                                var fechaminima = fechaCausacion != '' ? Date.parseExact(fechaCausacion, ["dd/MM/yyyy"]) : Date.parseExact(fechacompuesta, ["dd/MM/yyyy"]);

                                if (dateValue < fechaminima || fechaminima === null) {
                                    setDatePickerError($(this), "La fecha no puede ser menor al ejercicio del que se compensa.");
                                }
                                // if (dateValue > fechaDeclaracion) {
                                //     setDatePickerError($(this), "La fecha no puede ser mayor a la fecha de la presentación de la declaración anual.");
                                // }
                            }
                        }
                    });

                    container.find('#txtSaldoAplicar, #selectTipoDeclaracion, #txtSaldoFavor, #txtNumeroOperacion1, #txtRemanenteHistorico, #txtRemanenteActualizado').each(function () {
                        clearError($(this));
                        var value = $(this).val();
                        if ($(this).is('#txtSaldoAplicar')) {
                            if (IsNullOrEmpty(value)) {
                                setError($(this), MENSAJE_ERROR);
                            } else if (parseFloat(value) <= 0) {
                                setError($(this), MENSAJE_ERROR_ZERO);
                            }
                        } else if ($(this).is(':input[type="text"]')) {
                            if (IsNullOrEmpty(value)) {
                                setError($(this), MENSAJE_ERROR);
                            }
                        } else {
                            var dontHaveSelection = IsNullOrEmpty(value) || value === '0';
                            if (dontHaveSelection)
                                setError($(this), MENSAJE_ERROR);
                        }
                    });

                    if (container.find('.icon-warning-sign').length > 0) {
                        var that = this;
                        setTimeout(function () {
                            $(that).popover('hide');
                        }, 1000 * 3);
                        $(that).popover('destroy');
                        $(that).popover({
                            trigger: 'manual',
                            content: "Existen compensaciones con errores.",
                            placement: "bottom"
                        }).popover('show');
                        return false;
                    }

                    var MontoCompensaciones = 0;

                    var camposCurrency = $(dlg).find(".currency, #lblMonto");
                    $.each(camposCurrency, function () {
                        $(this).toNumber();
                    });
                    var Errores_Saldo = false;
                    $(container).find('input[id*="{0}"]'.format('txtSaldoAplicar')).each(function () {

                        if (IsNullOrEmpty($(this).val()) || parseFloat($(this).val()) <= 0) {
                            $('#btnTerminar').popover('destroy');
                            $('#btnTerminar').popover({ 'content': "Hay Elementos sin Registrar." });
                            $('#btnTerminar').popover('show');
                            //Errores_Saldo=true;
                            return false;
                        }
                        MontoCompensaciones += parseInt($(this).val());
                    });

                    //if(Errores_Saldo){return false;}

                    var viewModelDetalle = FormsBuilder.ViewModel.getDetalle();
                    viewModelDetalle[idEntidadPropiedad] = [];
                    //var entidadesJson = FormsBuilder.XMLForm.getEntidades();
                    var propiedades = Enumerable.From(entidadesJson).Where("$.id == '{0}'".format(idEntidadPropiedad)).Select("$.propiedades.propiedad").ToArray();
                    //FormsBuilder.XMLForm.getCopy().find('entidad[id="{0}"]'.format(idEntidadPropiedad)).find('propiedades');

                    var getViewModelDetalle = function (propiedades) {
                        var result = [];
                        var rows = dlg.find('.sat-row-compensaciones');
                        $.each(rows, function (index, row) {
                            var row = rows[index];
                            var fila = [];
                            var campos = $(row).find(".form-control");
                            $.each(campos, function (index, campo) {
                                var claveInformativa = $(campo).attr('claveInformativa');
                                if (claveInformativa) {
                                    var value = $(campo).val() || '';
                                    //var $propiedad = Enumerable.From(propiedades).Where("$.claveInformativa == '{0}'".format(claveInformativa)).FirstOrDefault();
                                    var entidadComp = Enumerable.From(entidadesJson).Where("$.id == '{0}'".format(idEntidadPropiedad)).FirstOrDefault();
                                    var $propiedad = Enumerable.From(entidadComp.propiedades.propiedad).Where("$.claveInformativa=='{0}'".format(claveInformativa)).FirstOrDefault();
                                    //var $propiedad = Enumerable.From(entidadComp).Where("$.claveInformativa == '{0}'".format(claveInformativa)).FirstOrDefault();

                                    //propiedades.find("[claveInformativa='{0}']".format(claveInformativa));
                                    if ($propiedad && $propiedad.tipoDatos == "Fecha" && !IsNullOrEmpty(value)) {
                                        try {
                                            value = FECHA($(campo).val()).toString("dd/MM/yyyy");
                                        } catch (err) {
                                            console.log("Error al convertir la fecha. Compensaciones");
                                        }
                                    }
                                    fila.push(
                                        {
                                            claveinformativa: claveInformativa,
                                            propiedad: $propiedad.id,
                                            valor: value,
                                            etiqueta: $(campo).find(':selected').text()
                                        });
                                }
                            });
                            result.push(fila);
                        });
                        return result;
                    };

                    var internalModel = getViewModelDetalle(propiedades);
                    viewModelDetalle[idEntidadPropiedad] = internalModel;
                    setMonto(dlg, MontoCompensaciones);
                    if (MontoCompensaciones == 0) {
                        FormsBuilder.ViewModel.get()[(db_id.split('P')[0]).replace('E', '')][db_id]('');
                    } else {
                        FormsBuilder.ViewModel.get()[(db_id.split('P')[0]).replace('E', '')][db_id](MontoCompensaciones);
                    }
                    FormsBuilder.ViewModel.getDetalleFK()[db_id] = idEntidadPropiedad;

                    $.each(camposCurrency, function () {
                        var format = FormsBuilder.Utils.getFormatCurrency();
                        $(this).formatCurrency(format);
                    });
                    $("input[view-model={0}]".format(db_id)).trigger("blur");

                    dlg.modal('hide');
                });

                //Funcionalidad de Botón Validar.
                dlg.find('#btnValidar').live("click", function (e) {
                    var selectTipoDeclaracion = $(e.target).parents().eq(2).find('#selectTipoDeclaracion');

                    LlenaCombo(selectTipoDeclaracion, CATALOGO_TIPO_DECLARACION, 'valor', 'texto');
                    dlg.find('.modal-body').find('#datepicker').datepicker();
                    $(e.target).parents().eq(2).find('#selectTipoDeclaracion, #txtSaldoFavor, #txtNumeroOperacion1, #txtRemanenteHistorico, #txtRemanenteActualizado, #txtFechaDeclaracion').prop("disabled", false);
                    $(e.target).parents().eq(2).find('#txtFechaDeclaracion').parent().find('.add-on').show();
                });

                //Evento blur para Input de Control Datepicker.Fecha Causacion
                dlg.find('#datepicker').live("blur", function (e) {
                    var $fechaCausacionNode = $(e.target);

                    if ($fechaCausacionNode.attr('id') === 'txtFechaCausacion') {
                        var $rowContainer = $(e.target).parents().eq(4);

                        if (!IsNullOrEmpty($fechaCausacionNode.val())) {

                            if (!IsNullOrEmpty($rowContainer.find('#txtNumeroOperacion').val())) {
                                $rowContainer.find("#txtSaldoAplicar").prop('disabled', true).val('');
                                LimpiaCamposComplementarios($(e.target));

                                var $selectConcepto = $rowContainer.find('#selectConcepto');

                                var fechaCausacion = FECHA($fechaCausacionNode.val());
                                if (fechaCausacion !== fbUtils.getDateMin()) {
                                    LlenaComboConcepto($selectConcepto, fechaCausacion.toString("MM/dd/yyyy"));
                                }
                                if ($selectConcepto.find('option').length > 1) {
                                    $selectConcepto.prop("disabled", false);
                                } else {
                                    $selectConcepto.prop("disabled", true).val('');
                                }

                            }
                            $rowContainer.find('#txtNumeroOperacion').prop('disabled', false);
                        }

                    }
                    else {
                        if (!IsNullOrEmpty($($fechaCausacionNode).val()))
                            clearDatePickerError($($fechaCausacionNode));
                    }
                });

                dlg.find('#datepicker').live("hide", function (e) {
                    var fechaCausacionNode = $(e.target).children()[0];

                    if ($(fechaCausacionNode).attr('id') === 'txtFechaCausacion') {
                        var $mainContainer = $(fechaCausacionNode).parents().eq(3);

                        if (!IsNullOrEmpty($(fechaCausacionNode).val())) {
                            if (!IsNullOrEmpty($mainContainer.find('#txtNumeroOperacion').val())) {
                                var $selectConcepto = $(e.target).parents().eq(3).find('#selectConcepto');

                                var fechaCausacion = FECHA($(fechaCausacionNode).val());
                                if (fechaCausacion !== fbUtils.getDateMin()) {
                                    LlenaComboConcepto($selectConcepto, fechaCausacion.toString("MM/dd/yyyy"));

                                    if ($selectConcepto.find('option').length > 1)
                                        $selectConcepto.prop("disabled", false);
                                }
                            } else {
                                $mainContainer.find('#txtNumeroOperacion').prop('disabled', false);
                            }
                        }

                    }
                    else {
                        if (!IsNullOrEmpty($($(fechaCausacionNode)).val()))
                            clearDatePickerError($($(fechaCausacionNode)));
                    }
                });

                //Evento para Llenar combo de Perioricidad
                dlg.find('#tipoSelect').live("change", function (e) {
                    var value = $(e.target).val();

                    $(e.target).parents().eq(1).find('#periodicidadSelect, #periodoSelect, #ejercicioSelect').empty().prop("disabled", true);
                    $(e.target).parents().eq(2).find('#txtNumeroOperacion, #txtFechaCausacion').prop('disabled', true).val('');
                    $(e.target).parents().eq(2).find('#txtFechaCausacion').parent().find('.add-on').hide();
                    $(e.target).parents().eq(2).find('#selectConcepto, #txtSaldoAplicar').empty().prop("disabled", true).val('');
                    LimpiaCamposComplementarios($(e.target));

                    if (value == "0") {
                        calculateTotal(db_id);
                        return;
                    }

                    var selectPerioricidad = $(e.target).parents().eq(1).find('#periodicidadSelect');
                    LlenaCombo(selectPerioricidad, CATALOGO_PERIODICIDAD, 'valor', 'texto');
                    $(selectPerioricidad).prop("disabled", false);

                    calculateTotal(db_id);
                });

                //Evento para Llenar combo de Periodo
                dlg.find('#periodicidadSelect').live("change", function (e) {
                    var value = $(e.target).val();

                    $(e.target).parents().eq(1).find('#periodoSelect, #ejercicioSelect').empty().prop("disabled", true);
                    $(e.target).parents().eq(2).find('#txtNumeroOperacion, #txtFechaCausacion').prop('disabled', true).val('');
                    $(e.target).parents().eq(2).find('#txtFechaCausacion').parent().find('.add-on').hide();
                    $(e.target).parents().eq(2).find('#selectConcepto, #txtSaldoAplicar').empty().prop('disabled', true).val('');
                    LimpiaCamposComplementarios($(e.target));

                    if (value == "0") {
                        calculateTotal(db_id);
                        return;
                    }

                    if (value == "N") {
                        $(e.target).parents().eq(2).find('#txtFechaCausacion').prop('disabled', false);
                        $(e.target).parents().eq(2).find('#txtFechaCausacion').parent().find('.add-on').show();
                        dlg.find('.modal-body').find('#datepicker').datepicker();
                        var selectPeriodo = $(e.target).parents().eq(1).find('#periodoSelect');
                        LlenaComboParam(selectPeriodo, CATALOGO_PERIODO, 'idperiodicidad', value, 'valor', 'texto');
                        selectPeriodo.find("option[value=0]:first").remove();

                        return;
                    }

                    var selectPeriodo = $(e.target).parents().eq(1).find('#periodoSelect');
                    LlenaComboParam(selectPeriodo, CATALOGO_PERIODO, 'idperiodicidad', value, 'valor', 'texto');
                    $(selectPeriodo).prop("disabled", false);



                    calculateTotal(db_id);
                });

                //Evento para Llenar combo de Ejercicio
                dlg.find('#periodoSelect').live("change", function (e) {
                    var value = $(e.target).val();

                    $(e.target).parents().eq(1).find('#ejercicioSelect').empty().prop("disabled", true);
                    $(e.target).parents().eq(2).find('#selectConcepto, #txtSaldoAplicar').empty().prop('disabled', true).val('');
                    LimpiaCamposComplementarios($(e.target));

                    if (value == "0") {
                        calculateTotal(db_id);
                        return;
                    }

                    var selectEjercicio = $(e.target).parents().eq(1).find('#ejercicioSelect');
                    getEjercicio(selectEjercicio);
                    $(selectEjercicio).prop("disabled", false);

                    calculateTotal(db_id);
                });

                //Evento para Llenado de Concepto
                dlg.find('#ejercicioSelect').live("change", function (e) {
                    var value = $(e.target).val();

                    //$(e.target).parent().find('#txtSaldoAplicar').prop('disabled', true).val('');
                    var selectConcepto = $(e.target).parents().eq(3).find('#selectConcepto');

                    $(selectConcepto).empty().prop("disabled", true);
                    LimpiaCamposComplementarios($(e.target));

                    if (value == "0") {
                        calculateTotal(db_id);
                        return;
                    }

                    LlenaComboConcepto(selectConcepto, '');

                    if ($(selectConcepto).find('option').length > 1)
                        $(selectConcepto).prop("disabled", false);

                    calculateTotal(db_id);
                });

                //Evento para Select de Concepto
                dlg.find('#selectConcepto').live("change", function (e) {
                    LimpiaCamposComplementarios($(e.target));
                    var $mainContainer = $(e.target).parents(".sat-row-compensaciones:first");
                    if ($(e.target).val() == "0") {
                        $mainContainer.find('#txtSaldoAplicar').prop("disabled", true).val('');
                    } else {
                        $mainContainer.find('#txtSaldoAplicar').prop("disabled", false).val('');
                    }
                    LimpiaCamposComplementarios($mainContainer.find('#txtSaldoAplicar'));
                });

                dlg.find('#txtNumeroOperacion').live("blur", function (e) {
                    var fechaCausacionElement = $(e.target).parents().eq(2).find('#txtFechaCausacion');
                    var $rowContainer = $(e.target).parents(".sat-row-compensaciones");
                    var selectConcepto = $rowContainer.find('#selectConcepto');
                    if (!IsNullOrEmpty($(this).val())) {
                        if (!IsNullOrEmpty($(fechaCausacionElement.val()))) {
                            //                    $(e.target).parents().eq(1).find('#selectConcepto').prop("disabled", false);
                            var fechaCausacion = FECHA(fechaCausacionElement.val());

                            if (fechaCausacion !== fbUtils.getDateMin()) {
                                LlenaComboConcepto(selectConcepto, fechaCausacion.toString("MM/dd/yyyy"));
                            }
                            if ($(selectConcepto).find('option').length > 1) {
                                $(selectConcepto).prop("disabled", false);
                            } else {
                                $(selectConcepto).prop("disabled", true);
                            }
                            $rowContainer.find("#txtSaldoAplicar").prop('disabled', true).val('');
                            LimpiaCamposComplementarios($(e.target));
                        }
                    } else {
                        $(selectConcepto).prop("disabled", true).val('').html('');
                        LimpiaCamposComplementarios($(e.target));
                    }
                });

                dlg.find('#txtSaldoAplicar').live("keyup", function (e) {
                    e = e || window.event;

                    var target = $(e.target);
                    var totalCompesanciones;
                    var valueTarget = target.val();

                    if (!IsNullOrEmpty($(e.target).val()) && parseInt(valueTarget) > 0) {
                        clearError($(e.target));
                        $(e.target).parents().eq(5).find('#btnValidar').attr("disabled", false);

                        var container = dlg.find('.modal-body');
                        var sumaCompensaciones = 0;


                        $(container).find('input[id*="{0}"]'.format('txtSaldoAplicar')).each(function () {
                            $(this).toNumber();
                            var value = $(this).val();

                            if (!(IsNullOrEmpty($(this).val()))) {
                                sumaCompensaciones += parseInt(value);
                            }

                            if (value != valueTarget) {
                                var format = FormsBuilder.Utils.getFormatCurrency();
                                $(this).formatCurrency(format);
                            }
                        });

                        totalCompesanciones = parseInt(dlg.find('#lblMonto').toNumber().html());

                        totalCompesanciones += (sumaCompensaciones - parseInt($(this).val())) + (parseInt($(this).val()) - totalCompesanciones);
                    }
                    else
                        $(e.target).parents().eq(5).find('#btnValidar').attr("disabled", true);

                    setMonto(dlg, totalCompesanciones);

                });

                dlg.find('#txtSaldoAplicar').live("keydown", function (e) {
                    if (e.keyCode == 8) {
                        if ($(this).val().length == 1) {
                            var container = dlg.find('.modal-body');
                            var sumaCompensaciones = 0;

                            $(container).find('input[id*="{0}"]'.format('txtSaldoAplicar')).each(function (e) {
                                $(this).toNumber();
                                if (!(IsNullOrEmpty($(this).val()))) {
                                    sumaCompensaciones += parseInt($(this).val());
                                }
                            });

                            var totalCompesanciones = parseInt(dlg.find('#lblMonto').toNumber().html());
                            totalCompesanciones = sumaCompensaciones - parseInt($(this).val());
                            setMonto(dlg, totalCompesanciones);

                        }
                    }
                });

                dlg.find('#txtSaldoAplicar').live("blur", function (e) {
                    calculateTotal(db_id);
                });

                dlg.find('#selectTipoDeclaracion, #txtSaldoFavor, #txtNumeroOperacion1, #txtRemanenteHistorico, #txtRemanenteActualizado').live('blur', function () {
                    if (!IsNullOrEmpty($(this).val()))
                        clearError($(this));
                });
            });
        }

        var idEntidad = db_id.split('P')[0].replace('E', '');
        var resultadoActual = FormsBuilder.ViewModel.get()[idEntidad][db_id]() || 0;
        dlg.find('#lblMonto').text(resultadoActual);
        if (SAT.Environment.settings('showdialogs')) {
            dlg.modal('show');
        }
        var format = FormsBuilder.Utils.getFormatCurrency();
        dlg.find(".currency, #lblMonto").formatCurrency(format);
    }

    function setDatePickerError(ctl, msg) {
        $(ctl).addClass('sat-val-error');

        if (!ctl.parents().eq(3).find("td:last").find("i").hasClass("icon-warning-sign sat-icon")) {
            ctl.parents().eq(3).find("td:last").append('<i class="icon-warning-sign sat-icon"></i>');
            ctl.css('display', 'inline-block');
            ctl.css('margin-right', '5px');
            ctl.css('width', '50%');

            ctl.parents().eq(3).find("td:last").find(".icon-warning-sign").popover({
                trigger: 'click',
                placement: "left",
                content: '<div><div style="clear: both"></div>{0}</div>'.format(msg), //v.mensajeError,
                html: "true"
            });
        }
    }

    function setError(ctl, msg) {
        $(ctl).addClass('sat-val-error');
        if ($(ctl).is('#txtSaldoAplicar')) {
            if ($(ctl).parent().find("i").length <= 0) {
                $(ctl).parent().append('<i class="icon-warning-sign sat-icon"></i>');
                ctl.css('display', 'inline-block');
                ctl.css('margin-right', '5px');
                ctl.css('width', '50% !important');

                $(ctl).parent().find("i").popover({
                    trigger: 'click',
                    placement: "left",
                    content: '<div><div style="clear: both"></div>{0}</div>'.format(msg), //v.mensajeError,
                    html: "true"
                });
            }
        }
        else {
            if ($(ctl).parents().eq(2).find("td:last").find("i").length <= 0) {
                $(ctl).parents().eq(2).find("td:last").append('<i class="icon-warning-sign sat-icon"></i>');
                ctl.css('display', 'inline-block');
                ctl.css('margin-right', '5px');
                ctl.css('width', '50% !important');

                $(ctl).parents().eq(2).find("td:last").find("i").popover({
                    trigger: 'click',
                    placement: "left",
                    content: '<div><div style="clear: both"></div>{0}</div>'.format(msg), //v.mensajeError,
                    html: "true"
                });
            }
        }
    }

    function clearDatePickerError(ctl) {
        ctl.parents().eq(3).find("td:last").find("i").popover('destroy');
        ctl.parents().eq(3).find("td:last").find(".icon-warning-sign").remove();

        ctl.css('display', 'block');
        ctl.css('width', '85%');
        ctl.css('margin-right', '0px');
        ctl.removeClass('sat-val-error');
    }

    function clearError(ctl) {
        // if ($(ctl).parents().eq(2).find("td:last").find("i").length > 0) {
        //     $(ctl).parents().eq(2).find("td:last").find("i").remove();
        // }
        if ($(ctl).is('#txtSaldoAplicar')) {
            ctl.parent().find("i").popover('destroy');
            ctl.parent().find(".icon-warning-sign").remove();
        }
        else {
            ctl.parents().eq(2).find("td:last").find("i").popover('destroy');
            ctl.parents().eq(2).find("td:last").find(".icon-warning-sign").remove();
        }

        ctl.css('display', 'block');
        ctl.css('width', '99%');
        ctl.css('margin-right', '0px');
        ctl.removeClass('sat-val-error');
    }

    function LimpiaCamposComplementarios(sender) {
        var container = $(sender).parents('.sat-row-compensaciones');
        $(container).find('#btnValidar').prop("disabled", true);
        $(container).find('#selectTipoDeclaracion, #txtSaldoFavor, #txtFechaDeclaracion, #txtFechaDeclaracion, #txtNumeroOperacion1, #txtRemanenteHistorico, #txtRemanenteActualizado').prop("disabled", true).empty().val('');
        $(container).find('#txtFechaDeclaracion').parent().find('.add-on').hide();
    }

    function LlenaCombo(select, idCatalogo, pValue, pText) {
        $(select).empty();

        var elementos = [];

        if (idCatalogo === CATALOGO_PERIODICIDAD || idCatalogo === CATALOGO_TIPO_DECLARACION) {
            elementos = FormsBuilder.Catalogs.getAll().find("catalogo[id='{0}']".format(idCatalogo)).find('elemento').filter(function () {
                return $(this).attr('idtipopersona') === TIPO_PERSONA || $(this).attr('idtipopersona') === 'A';
            });
        }
        else {
            elementos = FormsBuilder.Catalogs.getAll().find("catalogo[id='{0}']".format(idCatalogo)).find('elemento');
        }

        elementos.each(function () {
            var valor = $(this).attr(pValue);
            var caption = $(this).attr(pText);

            select.append("<option value=" + valor + ">" + caption + "</option>");
        });

        select.prepend("<option value='0'>-Seleccione-</option>");

        $(select).find(':first').attr('selected', 'selected');
    }

    function LlenaComboParam(select, idCatalogo, columnaBuscar, idBuscar, pValue, pText) {
        $(select).empty();
        var elementos = [];

        if (idCatalogo === CATALOGO_PERIODO) {
            elementos = FormsBuilder.Catalogs.getAll().find("catalogo[id='{0}']".format(idCatalogo)).find("elemento[{0}='{1}']".format(columnaBuscar, idBuscar)).filter(function () {
                return $(this).attr('idtipopersona') === TIPO_PERSONA || $(this).attr('idtipopersona') === 'A';
            });
        }
        else {
            elementos = FormsBuilder.Catalogs.getAll().find("catalogo[id='{0}']".format(idCatalogo)).find("elemento[{0}='{1}']".format(columnaBuscar, idBuscar));
        }

        elementos.each(function () {
            var valor = $(this).attr(pValue);
            var caption = $(this).attr(pText);

            select.append("<option value=" + valor + ">" + caption + "</option>");
        });

        select.prepend("<option value='0'>-Seleccione-</option>");

        $(select).find(':first').attr('selected', 'selected');
    }

    function LlenaComboConcepto(select, pfechaCausacion) {
        $(select).empty();

        var obligacionesToSelect = [];

        var v2SendTipoSaldo = $(select).parents().eq(2).find("#tipoSelect").val();
        var v2SendidPeriodicidad = $(select).parents().eq(2).find("#periodicidadSelect").val();
        var v2SendidPeriodo = $(select).parents().eq(2).find("#periodoSelect").val();
        var v2SendEjercicio = $(select).parents().eq(2).find("#ejercicioSelect").val();

        obligacionesToSelect = getCompesacionesPeriodicidad(RFC, OBLIGACION_DESTINO, v2SendTipoSaldo, v2SendidPeriodicidad, v2SendidPeriodo, v2SendEjercicio, pfechaCausacion);

        if (obligacionesToSelect.length > 0) {
            $.grep(obligacionesToSelect, function (element) {
                select.append("<option value=" + element.valor + ">" + element.concepto + "</option>");
            });

            select.prepend("<option value='0'>-Seleccione-</option>");
        }
        else {
            select.prepend("<option value='0'>No existen conceptos a compensar en el periodo seleccionado.</option>");
            $('#modalConceptosCompensaciones').modal('show');
        }

        $(select).find(':first').attr('selected', 'selected');
    }

    function getEjercicio(select) {
        $(select).empty();

        var anioActual = getYearExercise();
        var n = parseInt(anioActual);

        while (n >= 2002) {
            select.append("<option value=" + n + ">" + n + "</option>");
            n--;
        }

        select.prepend("<option value='0'>-Seleccione-</option>");

        $(select).find(':first').attr('selected', 'selected');
    }

    function getYearExercise() {
        return (new Date().getFullYear());
        // var result;
        // if (IsNullOrEmptyOrZero($30)) {
        //     result = $(FormsBuilder.XMLForm.getCopyDeclaracion()).find("propiedad[id=30]").text();
        //     if (IsNullOrEmpty(result)) {
        //         result = $(FormsBuilder.XMLForm.getCopyPrecarga()).find("Ejercicio").text();
        //     }
        // }
        // else {
        //     result = $30;
        // }
        // return result;
    }

    function getCompesaciones(obligacionOrigenArray, pidTipoSaldo, pidobligaciondestino, pidPeriodicidad) {
        var compensacionesArray = [];

        var vaplicadelejercicio = "0";

        if (pidPeriodicidad == 'Y')
            vaplicadelejercicio = "1";

        FormsBuilder.Catalogs.getAll().find("catalogo[id='{0}']".format(CATALOGO_COMPENSACIONES)).find("elemento[idtiposaldo='{0}'][idobligaciondestino='{1}'][aplicadelejercicio='{2}']".format(pidTipoSaldo, pidobligaciondestino, vaplicadelejercicio)).each(function () {
            var idObligacionOrigen = $(this).attr('idobligacionorigen');

            $.grep(obligacionOrigenArray, function (element) {
                if (idObligacionOrigen == element)
                { compensacionesArray.push(idObligacionOrigen); }
            });
        });

        return compensacionesArray;
    }

    function getObligaciones(pobligacionesOrigenArray) {
        var obligacionArray = [];

        FormsBuilder.Catalogs.getAll().find("catalogo[id='{0}']".format(CATALOGO_OBLIGACION)).find("elemento").each(function () {
            var valor = $(this).attr('valor');
            var texto = $(this).attr('texto');

            $.grep(pobligacionesOrigenArray, function (element) {
                if (valor == element)
                { obligacionArray.push({ "valor": valor, "concepto": texto }); }
            });
        });

        return obligacionArray;
    }

    function getObligacionesOrigen(pvigenciasArray, pidPeriodicidad, pTipoPersona) {
        var obligacionesOrigenArray = [];

        FormsBuilder.Catalogs.getAll().find("catalogo[id='{0}']".format(CATALOGO_COMPENSACIONES_PERIODICIDAD)).find("elemento[idtipopersona='{0}'][idperiodicidad='{1}']".format(pTipoPersona, pidPeriodicidad)).each(function () {

            var idVigenciaElement = $(this).attr('idvigencia');
            var idObligacionOrigen = $(this).attr('idobligacionorigen');

            $.grep(pvigenciasArray, function (element) {
                if (idVigenciaElement == element)
                { obligacionesOrigenArray.push(idObligacionOrigen); }
            });
        });

        return obligacionesOrigenArray;
    }

    function getCompesacionesPeriodicidad(pRFC, pObligacionDestino, ptipoSaldo, pidPeriodicidad, pidPeriodo, pEjercicio, pfechaCausacion) {
        var obligacionesArray = [];
        var vTipoPersona = 'F';
        var vigencias = [];
        var obligacionOrigen = [];
        var compensaciones = [];
        var obligaciones = [];
        var fechaIni = '';
        var fechaFin = '';

        //if (pRFC.length == 12)
        //    vTipoPersona = 'M';

        vTipoPersona = TIPO_PERSONA;

        if (pfechaCausacion === null || pfechaCausacion === '') {
            fechaIni = new Date(pEjercicio, getMesInicioPeriodo(pidPeriodo) - 1);
        } else { fechaIni = new Date(pfechaCausacion); }
        if (pfechaCausacion === null || pfechaCausacion === '') {
            fechaFin = new Date(pEjercicio, getMesFinPeriodo(pidPeriodo), 0);
        } else { fechaFin = new Date(pfechaCausacion); }

        vigencias = getPeriodicidadVigencia(fechaIni, fechaFin);
        obligacionOrigen = getObligacionesOrigen(vigencias, pidPeriodicidad, vTipoPersona);
        compensaciones = getCompesaciones(obligacionOrigen, ptipoSaldo, pObligacionDestino, pidPeriodicidad);
        obligacionesArray = getObligaciones(compensaciones);

        return obligacionesArray;
    }

    function getMesInicioPeriodo(periodo) {
        return FormsBuilder.Catalogs.getAll().find("catalogo[id='{0}']".format(CATALOGO_PERIODO)).find("elemento[valor='{0}']".format(periodo)).attr('mesinicio');
    }

    function getMesFinPeriodo(periodo) {
        return FormsBuilder.Catalogs.getAll().find("catalogo[id='{0}']".format(CATALOGO_PERIODO)).find("elemento[valor='{0}']".format(periodo)).attr('mesFin');
    }

    function calculateTotal(db_id) {
        var dlg = $('[sat-dlg-compensaciones-dbid="{0}"] div:first'.format(db_id));
        var container = dlg.find('.modal-body');
        var sumaCompensaciones = 0;

        $(container).find('input[id*="{0}"]'.format('txtSaldoAplicar')).each(function (e) {
            $(this).toNumber();
            if (!(IsNullOrEmpty($(this).val()))) {
                sumaCompensaciones += parseInt($(this).val());
            }
            var format = FormsBuilder.Utils.getFormatCurrency();
            $(this).formatCurrency(format);
        });

        setMonto(dlg, sumaCompensaciones);
    }

    function getPeriodicidadVigencia(fechaInicioVigencia, fechaFinVigencia) {
        var vigencias = [];
        var fechaInicioVigenciaCatalogo;
        var fechaFinVigenciaCatalogo;
        FormsBuilder.Catalogs.getAll().find("catalogo[id='" + CATALOGO_COMPENSACIONES_VIGENCIA + "']").find("elemento").each(function () {
            fechaInicioVigenciaCatalogo = Date.parseExact($(this).attr('FechaVigenciaInicio'), ["yyyy-M-d"]);
            fechaFinVigenciaCatalogo = Date.parseExact($(this).attr('FechaVigenciaFin'), ["yyyy-M-d"]);
            if (((fechaInicioVigenciaCatalogo <= fechaInicioVigencia) && (fechaInicioVigenciaCatalogo <= fechaFinVigencia)) || ((fechaInicioVigencia <= fechaInicioVigenciaCatalogo) && (fechaInicioVigenciaCatalogo <= fechaFinVigencia))) {
                if ((((fechaFinVigenciaCatalogo <= fechaFinVigencia) && (fechaInicioVigencia <= fechaFinVigenciaCatalogo)) || ((fechaFinVigencia <= fechaFinVigenciaCatalogo) && (fechaInicioVigencia <= fechaFinVigenciaCatalogo))) || (fechaFinVigenciaCatalogo.getFullYear() === 2099)) {
                    vigencias.push($(this).attr('valor'));
                }
            }
        });

        return vigencias;
    }
})();

function OnDeleteDate(event) {
    event = event || window.event;
    if (event.keyCode == 8) {
        var target = $(event.target);

        var datepicker = target.parent().data("datepicker");

        datepicker.update("");
        return;

    }
    if ($.inArray(event.keyCode, [46, 9, 27, 13]) !== -1 || // Delete, Backspace, Tab, Esc, Enter
        (event.keyCode == 65 && event.ctrlKey === true) ||
        (event.keyCode >= 35 && event.keyCode <= 39)) {
        return;
    }
    else {
        preventDefaultEvent(event);
    }

}
