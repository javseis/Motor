/* eslint-disable no-unused-vars */
/** @module FormsBuilder.Modules */
/**
 * Modulo para el render de formularios que crea un contenedor de CFDIs
 * 
 * (c) SAT 2017, Javier Cortés Cruz
 */
/*global namespace:false, FormsBuilder:false, SAT: false, ESTADO_CFDI: false, ORIGEN_CFDI: false, TIPO_ACCION_CFDI: false, moment: false, 
 * Service: false, Enumerable:false, fbUtils: false
 */

"use strict";

(function () {
    namespace("FormsBuilder.Modules", GridCfdi, loadedUIGridCfdi, renderGridCfdi);

    var TEMPLATE_ACCIONES = "<div class='acciones-concepto'><ul><li><a class='editar-registro' href='#' title='Editar'><i class='icon icon-pencil'></i></a></li>" +
        "<li><a class='ver-cfdi' href='#' title='Ver CFDI'><i class='icon icon-file'></i></a></li>" +
        "<li><a class='eliminar-registro' href='#' title='Eliminar'><i class='icon icon-trash'></i></a></li></ul></div>";

    var TEMPLATE_ACCIONES_GRUPO = "<div class='row text-right' style=' padding: 2px 20px; margin-bottom: 15px; '><button class='btn btn-primary reclasifica-grupo'" +
        "entidad='{0}'>Reclasificar grupo</button><button class='btn btn-danger eliminar-grupo' entidad='{0}'>Eliminar grupo</button></div>";

    var TIPO_CFDI = { "INGRESO": 0, "GASTO": 1, "PAGO": 2 };
    //    var TIPO_ACCION_CFDI = { "OBTENER": 0, "INSERTAR": 1, "ACTUALIZAR": 2, "ELIMINAR": 3, "MODIFICAR_GASTO": 4 };
    var MSJ_HAY_ERRORES = "Por favor corrija los errores del formulario.";
    var MSJ_CAMPOS_VACIOS = "No se capturó ningún dato.";
    var CATALOGO_METODO_PAGO = "187";
    var CATALOGO_TIPO_DEDUCCION = "47";
    var USO_EQUIPO_TRANSPORTE = "I03";
    var USO_ADQUISICION_MERCANCIAS = "G01";
    var USO_GASTO_GENERAL = "G03";
    var VALOR_SI = "Si";
    var VALOR_NO = "No";
    var mostrarEnGrid = {};
    var totales = {};
    var detalleGridTmp = {};

    function GridCfdi(control) {
        var controlesFormulario;
        var gridTotales;
        var mostrarTotales;
        var mostrarConsecutivo;
        var mostrarInstrucciones;
        var llavePrimaria;
        var soloLectura = false;
        var posicionBoton = undefined;
        var tituloModal = "";
        var ordenarPor = "";
        var tipoCfdi;
        var longitudMaximaCampos;
        var idGridCfdi = control.id;
        var camposGrid = FormsBuilder.ViewModel.getFieldsForExprsGrid();
        var modeloDatos = FormsBuilder.XMLForm.getEntidades();
        var controles = Enumerable.From(control.controles.control).Where("$.tipoControl == 'Columna'").ToArray();
        var template = $("<div><div class='sat-container-gridcfdi' id='{0}' entidad='{1}' data-tipocontenedor='grid'></div></div>".format(idGridCfdi, control.idEntidadPropiedad));
        var htmlControl = $('<div><div class="panel panel-default formgrid" style="visibility: hidden;"><div class="panel-body"></div></div></div>');
        var htmlModal = $("<div id='modal-{0}' class='modal fade'><div class='modal-lg' style='margin: 0 auto;'><div class='modal-content'>".format(control.id) +
            "<div class='modal-header'><h4 class='modal-title'></h4></div>" +
            "<div class='modal-body'><div class='row' style='padding: 15px;'></div></div><div class='modal-footer'><div class='notify'></div></div></div></div></div>");
        var divResponsive = $('<div class="table-responsive" style="overflow-y: scroll;"></div>');
        var grid = $('<table class="table table-no-bordered table-condensed table-hover" entidad="{0}" data-table-for="{1}" data-toggle="table" data-cache="false" '.format(control.idEntidadPropiedad, idGridCfdi) +
            'data-pagination="true" data-page-size="10" data-show-footer="false" ' +
            'data-locale="es-MX" data-classes="table table-condensed table-hover"></table>');
        var gridEncabezado = $("<thead><tr><th data-checkbox='true' data-align='center'></th></tr></thead>");
        var contenedorControles = htmlModal.find(".row");
        var contenedorBotones = htmlModal.find(".notify");
        var claveMapeoUuid = FormsBuilder.XMLForm.obtenerPropiedadMapeoPorClave(control.idEntidadPropiedad, SAT.Environment.settings("claveMapeoId"));

        if (control.atributos && control.atributos.atributo) {
            var mensajeDuplicados = Enumerable.From(control.atributos.atributo).Where("$.nombre == 'MensajeValidacion'").FirstOrDefault();
            var mensajesTipoComprobante = Enumerable.From(control.atributos.atributo).Where("$.nombre == 'MensajeInformativo'").FirstOrDefault();
            llavePrimaria = Enumerable.From(control.atributos.atributo).Where("$.nombre == 'SinDuplicidad'").FirstOrDefault();
            mostrarTotales = Enumerable.From(control.atributos.atributo).Where("$.nombre == 'MostrarTotales'").FirstOrDefault();
            mostrarConsecutivo = Enumerable.From(control.atributos.atributo).Any("$.nombre == 'MostrarConsecutivo'");
            mostrarInstrucciones = Enumerable.From(control.atributos.atributo).Where("$.nombre == 'MostrarInstrucciones'").FirstOrDefault();
            tituloModal = Enumerable.From(control.atributos.atributo).Where("$.nombre == 'TituloDialogo'").FirstOrDefault();
            soloLectura = Enumerable.From(control.atributos.atributo).Any("$.nombre == 'SoloLectura'");
            tipoCfdi = Enumerable.From(control.atributos.atributo).Where("$.nombre == 'TipoCfdi'").FirstOrDefault();
            ordenarPor = Enumerable.From(control.atributos.atributo).Where("$.nombre == 'OrdenarGridPor'").FirstOrDefault();
            posicionBoton = Enumerable.From(control.atributos.atributo).Where("$.nombre === 'PosicionBoton'").Select("$.valor").FirstOrDefault();
            longitudMaximaCampos = Enumerable.From(control.atributos.atributo).Where("$.nombre === 'LongitudMaximaCamposGrid'").FirstOrDefault();

            if (mensajeDuplicados) {
                template.find(".sat-container-gridcfdi").attr("data-mensajeduplicados", mensajeDuplicados.valor);
            }

            if (mensajesTipoComprobante) {
                var mensajes = mensajesTipoComprobante.valor.split("|");

                mensajes.forEach(function (mensaje) {
                    var tipoCfdiAplica = mensaje.split(",")[0].trim();
                    var texto = mensaje.split(",")[1].trim();

                    template.find(".sat-container-gridcfdi").attr("data-mensaje-tipo-{0}".format(tipoCfdiAplica), texto);
                });
            }

            if (ordenarPor) {
                var propiedadesOrdenar = ordenarPor.valor.split(",");
                var dbIdsOrdenar = [];

                propiedadesOrdenar.forEach(function (propiedadOrdenar) {
                    dbIdsOrdenar.push("E{0}P{1}".format(control.idEntidadPropiedad, propiedadOrdenar));
                });

                grid.attr("data-ordenar-por", dbIdsOrdenar.join(","));
            }

            if (longitudMaximaCampos) {
                grid.attr("data-longitud-maxima-campos", longitudMaximaCampos.valor);
            }
        }

        if (tipoCfdi) {
            template.find(".sat-container-gridcfdi").attr("data-tipo-cfdi", TIPO_CFDI[tipoCfdi.valor.toUpperCase()]);
        }

        if (llavePrimaria) {
            template.find(".sat-container-gridcfdi").attr("data-llaveprimaria", llavePrimaria.valor);
        }

        if (mostrarTotales && mostrarTotales.valor) {
            totales[control.id] = mostrarTotales.valor.replace(/\s/g, "").split(",");
            gridTotales = $("<tfoot style='display: none;'><tr></tr></tfoot>");
            template.find(".sat-container-gridcfdi").attr("data-totales", true);

            if (mostrarConsecutivo) {
                gridTotales.children("tr").append("<td></td>");
            }
        } else {
            template.find(".sat-container-gridcfdi").attr("data-totales", false);
        }

        if (soloLectura) {
            template.find(".sat-container-gridcfdi").attr("data-sololectura", true);
        }

        if (mostrarConsecutivo) {
            var consecutivo = $("<th data-formatter='FormsBuilder.Formatters.consecutivoFormatter' data-align='center'>Núm.</th>");
            gridEncabezado.find("tr").append(consecutivo);
        }

        if (tituloModal && !IsNullOrEmptyWhite(tituloModal.valor)) {
            htmlModal.find(".modal-title").text(tituloModal.valor);
        }

        if (mostrarInstrucciones) {
            var btnInstrucciones = '<input type="button" value="Instrucciones" atributo="{0}" class="instruccionesModal btn btn-default" style="float: right;bottom: 10px;position: relative;"/>'.format(mostrarInstrucciones.valor);
            htmlModal.find(".modal-title").append(btnInstrucciones);
        }

        if (claveMapeoUuid) {
            grid.attr("data-unique-id", "E{0}P{1}".format(control.idEntidadPropiedad, claveMapeoUuid.idPropiedad));
        }

        htmlControl.find(".panel-default").attr("entidad", control.idEntidadPropiedad);

        //SE AGREGA BOTON PARA RECLASIFICAR GRUPO
        htmlControl.append(TEMPLATE_ACCIONES_GRUPO.format(control.idEntidadPropiedad));

        htmlControl.append(htmlModal);
        FormsBuilder.Parser.columnsJsonParse(controles, contenedorControles);
        controlesFormulario = htmlControl.find('[view-model^="E{0}"]'.format(control.idEntidadPropiedad));

        mostrarEnGrid[idGridCfdi] = [];

        $.each(controlesFormulario, function (key, control) {
            var propiedadControl = fbUtils.getPropiedad($(control).attr("view-model"));
            var entidadControl = fbUtils.getEntidad($(control).attr("view-model"));
            var propiedadJson;
            var tipoDatos;
            var entidades = Enumerable.From(modeloDatos).Where("$.propiedades != null").ToArray();
            var entidadJson = Enumerable.From(entidades).Where("$.id == '{0}'".format(entidadControl)).FirstOrDefault();

            if (entidadJson) {
                propiedadJson = Enumerable.From(entidadJson.propiedades.propiedad).Where("$.id == '{0}'".format(propiedadControl)).FirstOrDefault();
            }

            if (propiedadJson && propiedadJson.tipoDatos) {
                tipoDatos = propiedadJson.tipoDatos;
            }

            camposGrid[fbUtils.propiedadWindow(propiedadControl)] = {
                entidad: entidadControl,
                propiedad: propiedadControl,
                tipoDatos: tipoDatos
            };

            $(control).attr("temp-model", $(control).attr("view-model"));

            if ($(control).attr("muestraEnGrid") !== undefined) {
                if (propiedadJson) {
                    var columna = {
                        "db_id": $(control).attr("view-model"),
                        "titulo": "",
                        "formato": $(control).attr("data-formato") || "",
                        "orden": $(control).attr("OrdenColumnaEnGrid") || "0",
                        "tipoDato": tipoDatos
                    };

                    if ($(control).attr("muestraEnGrid") !== "") {
                        columna.titulo = $(control).attr("muestraEnGrid");
                    } else {
                        columna.titulo = Enumerable.From(propiedadJson.atributos.atributo).Where("$.nombre == 'TituloCorto'").FirstOrDefault({ valor: "" }).valor;
                    }

                    mostrarEnGrid[idGridCfdi].push(columna);
                }
            }
        });

        mostrarEnGrid[idGridCfdi] = Enumerable.From(mostrarEnGrid[idGridCfdi]).OrderBy("parseInt($.orden)").ToArray();

        mostrarEnGrid[idGridCfdi].forEach(function (columna) {
            var idEntidad = fbUtils.getEntidad(columna.db_id);
            var idPropiedad = fbUtils.getPropiedad(columna.db_id);
            var gridColumna = $("<th data-field='{0}'>{1}</th>".format(columna.db_id, columna.titulo));

            if (!IsNullOrEmptyWhite(columna.formato)) {
                gridColumna.attr("data-formatter", "FormsBuilder.Formatters.{0}".format(columna.formato));
            }

            if (!IsNullOrEmptyWhite(columna.tipoDato)) {
                switch (columna.tipoDato) {
                    case "Numerico":
                        gridColumna.attr("data-align", "right");
                        break;
                    case "Fecha":
                        gridColumna.attr("data-align", "center");
                        break;
                }
            }

            gridEncabezado.find("tr").append(gridColumna);

            if (gridTotales && gridTotales.length > 0) {
                gridTotales.find("tr").append("<td class='text-right' columna='grid_{0}_${1}'></td>".format(idEntidad, idPropiedad));
            }
        });

        if (soloLectura) {
            gridEncabezado.find("tr").append($("<th data-formatter='FormsBuilder.Formatters.accionesSoloLecturaCfdi' data-align='center'></th>"));
        } else {
            gridEncabezado.find("tr").append($("<th data-formatter='FormsBuilder.Formatters.accionesRegistroCfdi' data-align='center'></th>"));
        }

        gridEncabezado.find("tr").append("<th data-formatter='FormsBuilder.Formatters.alertaInconsistenciasCfdi' data-field='alerta-inconsistencias' data-align='center' data-visible=false></th>");
        grid.append(gridEncabezado);

        if (gridTotales && gridTotales.length > 0) {
            gridTotales.find("tr").append("<td></td>");
            gridTotales.find("td:first").css({ "border-left": "1px solid #A3A3A3", "text-align": "left", "font-weight": "bold" }).html("Total");
            grid.append(gridTotales);
        }

        htmlControl.prepend("<div><br /><div/>");

        divResponsive.append(grid);
        htmlControl.append(divResponsive);

        if (!soloLectura) {
            if (posicionBoton != undefined) {
                var boton = '<button type="button" class="btn btn-primary btn-red btn-nuevo-registro" style="{0}" entidad="{1}">Agregar</button>'.format("{0}", control.idEntidadPropiedad);
                var estilo = "margin-right: 15px;";
                switch (posicionBoton) {
                    case "1":
                        htmlControl.prepend(boton.format(estilo));
                        break;
                    case "2":
                        estilo = "margin-right: 8px;float: right;";
                        htmlControl.prepend(boton.format(estilo));
                        break;
                    case "3":
                        htmlControl.append(boton.format(estilo));
                        break;
                    case "4":
                        estilo = "margin-right: 8px;float: right;";
                        htmlControl.append(boton.format(estilo));
                        break;
                    default:
                        htmlControl.prepend(boton.format(estilo));
                }
            }
            else {
                htmlControl.prepend('<button type="button" class="btn btn-primary btn-red btn-nuevo-registro" style="margin-right: 15px;" entidad="{0}">Agregar</button>'.format(control.idEntidadPropiedad));
            }

            contenedorBotones.append('<button type="button" class="btn btn-primary btn-red btn-cancelar-registro" style="margin-right: 15px; display: none;" entidad="{0}">Cerrar</button>'.format(control.idEntidadPropiedad));
            contenedorBotones.append('<button type="button" class="btn btn-primary btn-red btn-guardar-registro" style="margin-right: 15px; display: none;" entidad="{0}">Guardar</button>'.format(control.idEntidadPropiedad));
        }

        template.find(".sat-container-gridcfdi").append(htmlControl.html());

        return template.html();
    }

    function pintarFilasGrid(idEntidad, registros) {

        console.log(">>>> pintarFilasGrid()");

        var grids = $(".sat-container-gridcfdi[entidad='{0}']".format(idEntidad));

        grids.each(function () {
            var grid = $(this);
            var table = $("table[entidad={0}][data-table-for='{1}']".format(idEntidad, grid.attr("id")));

            table.find("tbody tr").remove();

            if (registros) {
                table.bootstrapTable("load", registros);

                if (SAT.Environment.settings("dejarsinefecto") === true || SAT.Environment.settings("actualizacionimporte") === true) {
                    table.find("a.mostrar-conceptos-cfdi, a.eliminar-registro, a.recuperar-cfdi").css("cursor", "not-allowed");
                    table.find("a.mostrar-conceptos-cfdi").removeAttr("data-toggle");
                }
            }
        });
    }

    function loadedUIGridCfdi() {
        var contadorClicksGuardar = 0;
        var grids = $(".sat-container-gridcfdi");
        var evtChangeCombosEdicion = function (event) {
            event.preventDefault();

            if (($("#forma-pago-cfdi").val() == "0" && $("#forma-pago-efectivo").css("display") == "none")
                || ($("#uso-cfdi").val() == "0" || $("#uso-cfdi").val() == "P01")) {

                $("#btn-guardar-cambios-cfdi").prop("disabled", true);
            } else {
                $("#btn-guardar-cambios-cfdi").prop("disabled", false);
            }

            if ($("#forma-pago-efectivo").css("display") != "none"
                && ($("#uso-cfdi").val() == USO_ADQUISICION_MERCANCIAS || $("#uso-cfdi").val() == USO_GASTO_GENERAL)) {

                $(".control-tipo-gasto").show();

                if ($("#uso-cfdi").prop("disabled") === false) {
                    $("#tipo-gasto").prop("disabled", false);
                } else {
                    $("#tipo-gasto").prop("disabled", true);
                }
            } else {
                $(".control-tipo-gasto").hide();
            }

            if ($("#uso-cfdi").val() == USO_EQUIPO_TRANSPORTE) {
                $(".control-tipo-inversion").show();

                if ($("#uso-cfdi").prop("disabled") === false) {
                    $("#tipo-inversion").prop("disabled", false);
                } else {
                    $("#tipo-inversion").prop("disabled", true);
                }
            } else {
                $(".control-tipo-inversion").hide();
            }
        };

        grids.find("table").bootstrapTable();

        grids.each(function () {
            var grid = $(this);

            if (!SAT.Environment.settings("dejarsinefecto")) {
                var tipoCfdi = parseInt(grid.attr("data-tipo-cfdi"));
                var idEntidad = grid.attr("entidad");

                if (!IsNullOrEmptyWhite(tipoCfdi) && !IsNullOrEmptyWhite(idEntidad)) {
                    Service.Test.obtenerConceptosCfdi(function invocaMapearCfdis(cfdis) {
                        mapearCfdisViewModel(idEntidad, cfdis);
                        renderGridCfdi(idEntidad);
                        FormsBuilder.Modules.actualizarContadores();
                    });
                }
            } else {
                grid.find("button.btn-nuevo-registro").prop("disabled", true);
            }
        });

        llenarCombosEdicion();

        $("button.btn-nuevo-registro").click(function (event) {
            event.preventDefault();
            if (!SAT.Environment.settings("dejarsinefecto")) {
                var idEntidad = $(this).attr("entidad");
                var grid = $(".sat-container-gridcfdi[entidad='{0}']".format(idEntidad));
                var gridHijo = grid.find(".sat-container-gridcfdi");
                var modal = grid.children(".modal");
                var obligatorios = grid.find("[data-obligatorio]");
                var tabs = grid.find("a[data-toggle='tab']").filter(function () { return $(this).parent().css("display") == undefined || $(this).parent().css("display") == "block"; });
                var btnGuardar = $("button.btn-guardar-registro[entidad='{0}']".format(idEntidad));

                if (gridHijo.length > 0) {
                    var idEntidadHijo = gridHijo.attr("entidad");
                    var detalleGridHijo = FormsBuilder.ViewModel.getDetalleGrid()[idEntidadHijo];

                    if (!detalleGridHijo) {
                        detalleGridHijo = [];
                    }

                    detalleGridTmp[idEntidadHijo] = JSON.parse(JSON.stringify(detalleGridHijo));
                }

                btnGuardar.removeAttr("data-editando");
                btnGuardar.removeAttr("data-id");

                obligatorios.addClass("sat-obligatorio");

                if (tabs.length > 0) {
                    tabs.first().click();
                }

                if (modal.length > 0) {
                    modal.modal({ backdrop: "static", keyboard: false });
                    $("button.btn-guardar-registro[entidad='{0}'], button.btn-cancelar-registro[entidad='{0}']".format(idEntidad)).show();
                } else {
                    $("div.formgrid[entidad='{0}'], button.btn-guardar-registro[entidad='{0}'], button.btn-cancelar-registro[entidad='{0}']".format(idEntidad)).show();
                    $(this).hide();
                }
            }
        });

        $("button.btn-guardar-registro").click(function (event) {
            event.preventDefault();
            var boton = $(this);

            contadorClicksGuardar++;

            if (contadorClicksGuardar === 1) {
                var errores;
                var idEntidad = boton.attr("entidad");
                var formularioGrid = $(".sat-container-gridcfdi[entidad='{0}']".format(idEntidad));
                var modal = formularioGrid.children(".modal");
                var llavePrimaria = formularioGrid.attr("data-llaveprimaria");

                boton.prop("disabled", true);
                validarCamposObligatorios(idEntidad);
                setTimeout(function () {
                    errores = formularioGrid.find("i.icon-warning-sign, i.icon-warning-signRadio").length;

                    if (errores === 0) {
                        var entidadViewModel = FormsBuilder.ViewModel.get()[idEntidad];
                        var hayControlesVacios = validarControlesVacios(idEntidad);
                        var esDuplicado = false;

                        if (llavePrimaria) {
                            esDuplicado = validarDuplicidad(llavePrimaria, idEntidad, entidadViewModel, true);
                        }

                        if (!hayControlesVacios && !esDuplicado) {
                            var viewModel = {};
                            var detalleGrid = FormsBuilder.ViewModel.getDetalleGrid();
                            var claveMapeoOrigen = FormsBuilder.XMLForm.obtenerPropiedadMapeoPorClave(idEntidad, SAT.Environment.settings("claveMapeoOrigen"));
                            var claveMapeoConsecutivo = FormsBuilder.XMLForm.obtenerPropiedadMapeoPorClave(idEntidad, SAT.Environment.settings("claveMapeoConsecutivo"));
                            var esEdicion = boton.attr("data-editando") === "true" && !IsNullOrEmptyWhite(boton.attr("data-id"));
                            var accion = TIPO_ACCION_CFDI.INSERTAR;
                            var concepto;
                            var data = {};

                            if (!detalleGrid[idEntidad]) {
                                detalleGrid[idEntidad] = [];
                            }

                            for (var key in entidadViewModel) {
                                var valorPropiedad = entidadViewModel[key]();
                                var regexFecha = /\d{2}[/]\d{2}[/]\d{4}/;

                                if (regexFecha.test(valorPropiedad)) {
                                    valorPropiedad = moment.utc(valorPropiedad, "DD/MM/YYYY").format("YYYY-MM-DD");
                                }

                                if (valorPropiedad === true) {
                                    valorPropiedad = VALOR_SI;
                                }

                                if (valorPropiedad === false) {
                                    valorPropiedad = VALOR_NO;
                                }

                                viewModel[key] = valorPropiedad;
                            }

                            if (esEdicion) {
                                accion = TIPO_ACCION_CFDI.ACTUALIZAR;
                                concepto = [mapearViewModelCfdi(idEntidad, viewModel)];
                            } else if (claveMapeoOrigen && claveMapeoConsecutivo) {
                                viewModel["E{0}P{1}".format(idEntidad, claveMapeoOrigen.idPropiedad)] = ORIGEN_CFDI.MANUAL;
                                viewModel["E{0}P{1}".format(idEntidad, claveMapeoConsecutivo.idPropiedad)] = 1;
                                concepto = mapearViewModelCfdi(idEntidad, viewModel);
                            }

                            data.concepto = concepto;
                            data.totales = FormsBuilder.ViewModel.getTotalesDeducciones();

                            Service.Test.ejecutarAccionCFDI(accion, data, function invocaRenderCfdi(cfdi) {
                                viewModel = mapearCfdiViewModel(idEntidad, cfdi);

                                if (esEdicion) {
                                    actualizarRegistros(idEntidad, cfdi);
                                } else {
                                    detalleGrid[idEntidad].push(viewModel);
                                    renderGridCfdi(idEntidad, true);
                                    FormsBuilder.Modules.actualizarContadores();
                                }
                            });
                        }

                        limpiarViewModel(idEntidad);
                        setTimeout(function () {
                            contadorClicksGuardar = 0;
                            quitarErrores(idEntidad);
                        }, 100);

                        modal.modal("hide");
                    } else {
                        fbUtils.mostrarMensajeError(MSJ_HAY_ERRORES);
                        contadorClicksGuardar = 0;
                    }

                    boton.prop("disabled", false);
                }, 100);
            }
        });

        $("button.btn-cancelar-registro").click(function (event) {
            event.preventDefault();
            var idEntidad = $(this).attr("entidad");
            contadorClicksGuardar = 0;
            cancelarEdicionGrid(idEntidad);
        });

        $(document).on("click", ".sat-container-gridcfdi .ver-cfdi", function (event) {
            event.preventDefault();

            var index = parseInt($(this).attr("data-index"));
            var idEntidad = $(this).parents(".sat-container-gridcfdi").attr("entidad");
            var detalleGrid = FormsBuilder.ViewModel.getDetalleGrid()[idEntidad];
            var claveMapeoUuid = FormsBuilder.XMLForm.obtenerPropiedadMapeoPorClave(idEntidad, SAT.Environment.settings("claveMapeoUuidCfdi"));

            if (detalleGrid[index] && claveMapeoUuid) {
                var idEntidadPropiedad = "E{0}P{1}".format(idEntidad, claveMapeoUuid.idPropiedad);
                var uuid = detalleGrid[index][idEntidadPropiedad];

                $("#detalle-cfdi .modal-body").html("<i class='icon-spinner icon-spin icon-large icon-6x'></i> Espera por favor mientras termina de cargar los datos.");
                Service.Test.obtenerDetalleCfdi(uuid);
            }
        });

        $(document).on("click", ".sat-container-gridcfdi .eliminar-registro", function (event) {
            event.preventDefault();

            if (SAT.Environment.settings("dejarsinefecto") === false && SAT.Environment.settings("actualizacionimporte") === false) {
                var idRegistro = $(this).attr("data-id");
                var grid = $(this).parents(".sat-container-gridcfdi");
                var idEntidad = grid.attr("entidad");

                $("#confirma-eliminar-concepto .modal-body").text("El registro se eliminará. ¿Deseas continuar?");

                $("#confirma-eliminar-concepto").attr({
                    "data-id": idRegistro,
                    "data-entidad": idEntidad,
                    "data-tipo-accion": TIPO_ACCION_CFDI.ELIMINAR
                }).modal("show");
            }
        });

        $("#confirma-eliminar-concepto button.aceptar").click(function (event) {
            event.preventDefault();

            var modal = $("#confirma-eliminar-concepto");
            var idEntidad = modal.attr("data-entidad");
            var tipoAccion = modal.attr("data-tipo-accion");

            $("#confirma-eliminar-concepto").modal("hide");

            if (tipoAccion == TIPO_ACCION_CFDI.ELIMINAR) {
                var idRegistro = modal.attr("data-id");

                eliminarIndividual(idEntidad, idRegistro);
            } else if (tipoAccion == TIPO_ACCION_CFDI.ELIMINAR_GRUPO) {
                eliminarGrupo(idEntidad);
            }

        });

        $(document).on("click", ".sat-container-gridcfdi .recuperar-cfdi", function (event) {
            event.preventDefault();

            if (SAT.Environment.settings("dejarsinefecto") === false && SAT.Environment.settings("actualizacionimporte") === false) {
                var index = parseInt($(this).attr("data-index"));
                var idEntidad = $(this).parents(".sat-container-gridcfdi").attr("entidad");
                var formularioGrid = $(".sat-container-gridcfdi[entidad='{0}']".format(idEntidad));
                var tipoCfdi = parseInt(formularioGrid.attr("data-tipo-cfdi"));
                var detalleGrid = FormsBuilder.ViewModel.getDetalleGrid()[idEntidad];
                var registroRecuperar = detalleGrid[index];

                cambiarEstadoCfdi(idEntidad, index, ESTADO_CFDI.ACTIVO);

                Service.Test.ejecutarAccionCFDI(tipoCfdi, TIPO_ACCION_CFDI.ACTUALIZAR, mapearViewModelCfdi(idEntidad, registroRecuperar), function invocaRenderCfdi() {
                    renderGridCfdi(idEntidad, true);
                });
            }
        });

        $(document).on("click", ".sat-container-gridcfdi .mostrar-conceptos-cfdi", function (event) {
            event.preventDefault();

            if (SAT.Environment.settings("dejarsinefecto") === false && SAT.Environment.settings("actualizacionimporte") === false) {
                var index = parseInt($(this).attr("data-index"));
                var idEntidad = $(this).parents(".sat-container-gridcfdi").attr("entidad");
                var detalleGrid = FormsBuilder.ViewModel.getDetalleGrid()[idEntidad];
                var claveMapeoUuid = FormsBuilder.XMLForm.obtenerPropiedadMapeoPorClave(idEntidad, SAT.Environment.settings("claveMapeoUuidCfdi"));

                if (detalleGrid[index] && claveMapeoUuid) {
                    var idEntidadPropiedad = "E{0}P{1}".format(idEntidad, claveMapeoUuid.idPropiedad);
                    var uuid = detalleGrid[index][idEntidadPropiedad];
                    var registro = mapearViewModelCfdi(idEntidad, detalleGrid[index]);
                    var metodoPago = $("catalogo[id='{0}']".format(CATALOGO_METODO_PAGO), FormsBuilder.XMLForm.getCatalogos())
                        .find("elemento[valor='{0}']".format(registro.MetodoPago)).attr("texto");

                    habilitarCombosEdicion(!registro.EsFormaPagoClasificada, !registro.EsUsoCfdiClasificado, registro.FormaPago, registro.UsoCfdi, registro.UsoTipoGasto, registro.UsoTipoInversion);

                    $("#valor-metodo-pago").text(metodoPago);

                    $("#btn-guardar-cambios-cfdi").attr(
                        {
                            "data-index": index,
                            "data-entidad": idEntidad
                        }
                    );

                    $("#contenedor-conceptos").html("<i class='icon-spinner icon-spin icon-large icon-6x'></i> Espera por favor mientras termina de cargar los datos.");
                    Service.Test.obtenerConceptosCfdi(uuid);
                }
            }
        });

        $(document).on("click", ".sat-container-gridcfdi a.info-cfdi", function (event) {
            event.preventDefault();

            var tipoMensaje = $(this).attr("data-mostrar-mensaje");

            if (!IsNullOrEmptyWhite(tipoMensaje)) {
                var mensaje = $(this).parents(".sat-container-gridcfdi").attr("data-mensaje-tipo-{0}".format(tipoMensaje));

                $("#info-cfdi").find(".modal-body").html(mensaje);
            }
        });

        $(document).on("click", ".sat-container-gridcfdi a.alerta-inconsistencias", function (event) {
            event.preventDefault();

            var mensaje = $(this).attr("data-mensaje");

            if (!IsNullOrEmptyWhite(mensaje)) {
                fbUtils.mostrarMensajeError(mensaje);
            }
        });

        $(document).on("click", ".sat-container-gridcfdi a.editar-registro", function (event) {
            event.preventDefault();

            var grid = $(this).parents(".sat-container-gridcfdi");
            var idEntidad = grid.attr("entidad");
            var viewModelEntidad = FormsBuilder.ViewModel.get()[idEntidad];
            var idRegistro = $(this).attr("data-id");
            var detalleGrid = FormsBuilder.ViewModel.getDetalleGrid()[idEntidad];
            var modal = grid.children(".modal");

            if (detalleGrid && idRegistro) {
                var claveMapeoId = FormsBuilder.XMLForm.obtenerPropiedadMapeoPorClave(idEntidad, SAT.Environment.settings("claveMapeoId"));
                var idEntidadPropiedadId = "E{0}P{1}".format(idEntidad, claveMapeoId.idPropiedad);
                var registro = Enumerable.From(detalleGrid).Where("$.{0} === '{1}'".format(idEntidadPropiedadId, idRegistro)).FirstOrDefault();

                if (registro) {
                    SAT.Environment.setSetting("runRulesGrid", false);

                    Object.keys(viewModelEntidad).forEach(function (idEntidadPropiedad) {
                        var nuevoValor = fbUtils.desSanitizarValor(registro[idEntidadPropiedad]);
                        var idPropiedad = fbUtils.getPropiedad(idEntidadPropiedad);
                        var infoPropiedad = FormsBuilder.ViewModel.getFieldsForExprs()["$" + idPropiedad];

                        if (!IsNullOrEmpty(nuevoValor) && infoPropiedad.tipoDatos === "Fecha") {
                            nuevoValor = moment.utc(nuevoValor).format("DD/MM/YYYY");
                        }

                        viewModelEntidad[idEntidadPropiedad](nuevoValor);

                        formatoMoneda($("[view-model='{0}']".format(idEntidadPropiedad)), idEntidad, idPropiedad);
                    });

                    SAT.Environment.setSetting("runRulesGrid", true);

                    grid.find(".btn-guardar-registro").attr(
                        {
                            "data-editando": true,
                            "data-id": idRegistro
                        }
                    );

                    if (modal.length > 0) {
                        modal.modal({ backdrop: "static", keyboard: false });
                        $("button.btn-guardar-registro[entidad='{0}'], button.btn-cancelar-registro[entidad='{0}']".format(idEntidad)).show();
                    } else {
                        $("div.formgrid[entidad='{0}'], button.btn-guardar-registro[entidad='{0}'], button.btn-cancelar-registro[entidad='{0}']".format(idEntidad)).show();
                        $(this).hide();
                    }
                }
            }
        });

        $("#btn-guardar-cambios-cfdi").click(function (event) {
            event.preventDefault();

            var idEntidad = $(this).attr("data-entidad");
            var index = parseInt($(this).attr("data-index"));
            var detalleGrid = FormsBuilder.ViewModel.getDetalleGrid()[idEntidad];

            if (detalleGrid && !isNaN(index)) {
                var registroModificar = detalleGrid[index];

                if (registroModificar) {
                    var cfdi = mapearViewModelCfdi(idEntidad, registroModificar);
                    cfdi.UsoCfdi = $("#uso-cfdi").val();

                    if ($("#forma-pago-cfdi").is(":visible")) {
                        cfdi.FormaPago = $("#forma-pago-cfdi").val();
                    }

                    if ($("#tipo-gasto").is(":visible")) {
                        cfdi.UsoTipoGasto = $("#tipo-gasto").val();
                    }

                    if ($("#tipo-inversion").is(":visible")) {
                        cfdi.UsoTipoInversion = $("#tipo-inversion").val();
                    }

                    Service.Test.ejecutarAccionCFDI(TIPO_CFDI.GASTO, TIPO_ACCION_CFDI.MODIFICAR_GASTO, cfdi, function invocaRenderCfdi(cfdi) {
                        detalleGrid[index] = mapearCfdiViewModel(idEntidad, cfdi);
                        renderGridCfdi(idEntidad, true);
                    });
                }
            }
        });

        $("#forma-pago-cfdi, #uso-cfdi").change(evtChangeCombosEdicion);

        $("button.reclasifica-grupo").click(function (event) {
            event.preventDefault();
            var idEntidad = $(this).attr("entidad");
            var grid = $("table[entidad={0}]".format(idEntidad));
            var cfdisReclasificar = grid.bootstrapTable("getSelections");

            if (cfdisReclasificar && cfdisReclasificar.length > 0) {
                $("#reclasifica-grupo button.aceptar").attr("entidad", idEntidad);
                $("#reclasifica-grupo").modal("show");
            } else {
                $("#modal-ayuda .modal-body").text("No ha seleccionado ningun registro.");
                $("#modal-ayuda").modal("show");
            }
        });

        $("button.eliminar-grupo").click(function (event) {
            event.preventDefault();
            var idEntidad = $(this).attr("entidad");
            var grid = $("table[entidad={0}]".format(idEntidad));
            var cfdisReclasificar = grid.bootstrapTable("getSelections");

            if (cfdisReclasificar && cfdisReclasificar.length > 0) {
                $("#confirma-eliminar-concepto .modal-body").text("Los registros seleccionados se eliminarán. ¿Deseas continuar?");

                $("#confirma-eliminar-concepto").attr({
                    "data-entidad": idEntidad,
                    "data-tipo-accion": TIPO_ACCION_CFDI.ELIMINAR_GRUPO
                }).modal("show");
            } else {
                $("#modal-ayuda .modal-body").text("No ha seleccionado ningun registro.");
                $("#modal-ayuda").modal("show");
            }
        });

        $("#reclasifica-grupo button.aceptar").click(function (event) {
            event.preventDefault();
            var idEntidad = $(this).attr("entidad");
            var grid = $("table[entidad={0}]".format(idEntidad));
            var registrosSeleccionados = grid.bootstrapTable("getSelections");
            var claveMapeoClasificacion = FormsBuilder.XMLForm.obtenerPropiedadMapeoPorClave(idEntidad, SAT.Environment.settings("claveMapeoTipoDeduccion"));
            var nuevaClasificacion = $("#clasificacion-grupo").val();
            var conceptosReclasificar = [];

            $("#reclasifica-grupo").modal("hide");

            if (claveMapeoClasificacion) {
                registrosSeleccionados.forEach(function (registro) {
                    registro["E{0}P{1}".format(idEntidad, claveMapeoClasificacion.idPropiedad)] = nuevaClasificacion;
                    var concepto = mapearViewModelCfdi(idEntidad, registro);

                    conceptosReclasificar.push(concepto);
                });

                Service.Test.ejecutarAccionCFDI(TIPO_ACCION_CFDI.ACTUALIZAR, conceptosReclasificar, function (conceptos) {
                    actualizarRegistros(idEntidad, conceptos);
                });
            }
        });

        $(".sat-container-gridcfdi").hover(null, function (event) {
            event.preventDefault();

            $(".acciones-concepto").remove();
        });

        $(document).on("mouseenter", ".sat-container-gridcfdi tbody>tr", function (event) {
            event.preventDefault();

            $(".acciones-concepto").remove();

            var fila = $(this);

            if (!fila.hasClass("no-records-found")) {
                var grid = fila.parents(".sat-container-gridcfdi");
                var idEntidad = grid.attr("entidad");
                var idRegistro = fila.attr("data-uniqueid");
                var topFila = (fila.offset().top - grid.offset().top) + 5;
                var contenedor = fila.parents(".fixed-table-container");
                var leftContenedor = contenedor[0].offsetWidth - 120;
                var pixelesAgregar = screen.width < 1000 ? 5 : 35;
                var acciones = $(TEMPLATE_ACCIONES);
                var origen = obtenerOrigenConcepto(idEntidad, idRegistro);

                acciones.css("top", topFila);
                acciones.css("left", leftContenedor + pixelesAgregar);
                acciones.find("a").attr("data-id", idRegistro);

                if (origen === ORIGEN_CFDI.MANUAL) {
                    acciones.find(".ver-cfdi").parent().remove();
                }

                grid.append(acciones);
            }
        });
    }

    function eliminarIndividual(idEntidad, idRegistro) {
        var detalleGrid = FormsBuilder.ViewModel.getDetalleGrid()[idEntidad];
        var claveMapeoId = FormsBuilder.XMLForm.obtenerPropiedadMapeoPorClave(idEntidad, SAT.Environment.settings("claveMapeoId"));
        var idEntidadPropiedadId = "E{0}P{1}".format(idEntidad, claveMapeoId.idPropiedad);
        var registroEliminar = Enumerable.From(detalleGrid).Where("$.{0} === '{1}'".format(idEntidadPropiedadId, idRegistro)).FirstOrDefault();
        var origen = obtenerOrigenConcepto(idEntidad, idRegistro);
        var concepto;

        if (registroEliminar && origen === ORIGEN_CFDI.MANUAL) {
            concepto = mapearViewModelCfdi(idEntidad, registroEliminar);
            Service.Test.ejecutarAccionCFDI(TIPO_ACCION_CFDI.ELIMINAR, [concepto.LlaveRegistro], function invocaRenderCfdi() {
                var detalleFiltrado = Enumerable.From(detalleGrid).Where("$.{0} !== '{1}'".format(idEntidadPropiedadId, idRegistro)).ToArray();

                if (detalleFiltrado && detalleFiltrado.length > 0) {
                    FormsBuilder.ViewModel.setDetalleGridEntidad(idEntidad, detalleFiltrado);
                    renderGridCfdi(idEntidad, true);
                    FormsBuilder.Modules.actualizarContadores();
                }
            });
        } else if (registroEliminar && origen === ORIGEN_CFDI.PRECARGA) {
            var claveMapeoClasificacion = FormsBuilder.XMLForm.obtenerPropiedadMapeoPorClave(idEntidad, SAT.Environment.settings("claveMapeoTipoDeduccion"));
            var idEntidadPropiedadClasificacion = "E{0}P{1}".format(idEntidad, claveMapeoClasificacion.idPropiedad);

            registroEliminar[idEntidadPropiedadClasificacion] = SAT.Environment.settings("noClasificado");
            concepto = mapearViewModelCfdi(idEntidad, registroEliminar);

            Service.Test.ejecutarAccionCFDI(TIPO_ACCION_CFDI.ACTUALIZAR, [concepto], function invocaRenderCfdi(conceptos) {
                actualizarRegistros(idEntidad, conceptos);
            });
        }
    }

    function eliminarGrupo(idEntidad) {
        var detalleGrid = FormsBuilder.ViewModel.getDetalleGrid()[idEntidad];
        var grid = $("table[entidad={0}]".format(idEntidad));
        var registrosSeleccionados = grid.bootstrapTable("getSelections");
        var claveMapeoId = FormsBuilder.XMLForm.obtenerPropiedadMapeoPorClave(idEntidad, SAT.Environment.settings("claveMapeoId"));
        var idEntidadPropiedadId = "E{0}P{1}".format(idEntidad, claveMapeoId.idPropiedad);
        var registrosEliminar = [];
        var registrosActualizar = [];

        registrosSeleccionados.forEach(function (registro, indice) {
            var idRegistro = registro[idEntidadPropiedadId];
            var origen = obtenerOrigenConcepto(idEntidad, idRegistro);
            var concepto;

            if (origen === ORIGEN_CFDI.MANUAL) {
                concepto = mapearViewModelCfdi(idEntidad, registro);
                registrosEliminar.push(concepto.LlaveRegistro);
            } else if (origen === ORIGEN_CFDI.PRECARGA) {
                var claveMapeoClasificacion = FormsBuilder.XMLForm.obtenerPropiedadMapeoPorClave(idEntidad, SAT.Environment.settings("claveMapeoTipoDeduccion"));
                var idEntidadPropiedadClasificacion = "E{0}P{1}".format(idEntidad, claveMapeoClasificacion.idPropiedad);
                registro[idEntidadPropiedadClasificacion] = SAT.Environment.settings("noClasificado");
                concepto = mapearViewModelCfdi(idEntidad, registro);

                registrosActualizar.push(concepto);
            }
        });

        Service.Test.ejecutarAccionCFDI(TIPO_ACCION_CFDI.ELIMINAR, registrosEliminar, function () {
            var detalleFiltrado = detalleGrid.filter(function (concepto) {
                return !Enumerable.From(registrosEliminar).Any("$ === '{0}'".format(concepto[idEntidadPropiedadId]));
            });

            if (detalleFiltrado) {
                FormsBuilder.ViewModel.setDetalleGridEntidad(idEntidad, detalleFiltrado);
                renderGridCfdi(idEntidad, true);
                FormsBuilder.Modules.actualizarContadores();
            }

            if (registrosActualizar.length > 0) {
                setTimeout(function () {
                    Service.Test.ejecutarAccionCFDI(TIPO_ACCION_CFDI.ACTUALIZAR, registrosActualizar, function (conceptos) {
                        actualizarRegistros(idEntidad, conceptos);
                    });
                }, 300);
            }
        });

    }

    function obtenerOrigenConcepto(idEntidad, idConcepto) {
        var detalleGrid = FormsBuilder.ViewModel.getDetalleGrid()[idEntidad];
        var claveMapeoId = FormsBuilder.XMLForm.obtenerPropiedadMapeoPorClave(idEntidad, SAT.Environment.settings("claveMapeoId"));
        var idEntidadPropiedadId = "E{0}P{1}".format(idEntidad, claveMapeoId.idPropiedad);
        var claveMapeoOrigen = FormsBuilder.XMLForm.obtenerPropiedadMapeoPorClave(idEntidad, SAT.Environment.settings("claveMapeoOrigen"));
        var idEntidadPropiedadOrigen = "E{0}P{1}".format(idEntidad, claveMapeoOrigen.idPropiedad);
        var origen = Enumerable.From(detalleGrid).Where("$.{0} === '{1}'".format(idEntidadPropiedadId, idConcepto)).Select("$.{0}".format(idEntidadPropiedadOrigen)).FirstOrDefault();

        return origen;
    }

    //RIF
    function llenarCombosEdicion() {
        var catalogos = FormsBuilder.XMLForm.getCatalogos();
        var tiposInversion = $("catalogo[id='{0}'] > elemento".format(CATALOGO_TIPO_DEDUCCION), catalogos);

        $("#clasificacion-grupo").empty();

        tiposInversion.each(function () {
            var elemento = $(this);
            $("#clasificacion-grupo").append("<option value='{0}'>{1}</option>".format(elemento.attr("valor"), elemento.attr("texto")));
        });
    }

    //RIF
    function habilitarCombosEdicion(habilitarComboFormaPago, habilitarComboUsoCfdi, formaPago, usoCfdi, tipoGasto, tipoInversion) {
        if (habilitarComboFormaPago === true) {
            $("#forma-pago-cfdi").show();
            $("#forma-pago-cfdi").prop("disabled", false);
            $("#forma-pago-efectivo").hide();

            if (!IsNullOrEmptyWhite(formaPago) && formaPago != "0"
                && $("#forma-pago-cfdi > option[value='{0}']".format(formaPago)).length > 0) {

                $("#forma-pago-cfdi").val(formaPago);
            } else {
                $("#forma-pago-cfdi > option:first").prop("selected", true);
                $("#btn-guardar-cambios-cfdi").prop("disabled", true);
            }
        } else if (!IsNullOrEmptyWhite(formaPago) && formaPago == "01") {
            $("#forma-pago-cfdi").hide();
            $("#forma-pago-efectivo").show();
        } else {
            $("#forma-pago-cfdi").show();
            $("#forma-pago-efectivo").hide();
            $("#forma-pago-cfdi").val(formaPago);
            $("#forma-pago-cfdi").prop("disabled", true);
        }

        if (habilitarComboUsoCfdi === true) {
            $("#uso-cfdi").prop("disabled", false);

            if (!IsNullOrEmptyWhite(usoCfdi) && usoCfdi != "0"
                && $("#uso-cfdi > option[value='{0}']".format(usoCfdi)).length > 0) {

                $("#uso-cfdi").val(usoCfdi).change();
            } else {
                $("#uso-cfdi > option:first").prop("selected", true);
                $("#btn-guardar-cambios-cfdi").prop("disabled", true);
            }
        } else {
            $("#uso-cfdi").prop("disabled", true);
            $("#uso-cfdi").val(usoCfdi).change();
        }

        if (!habilitarComboFormaPago && !habilitarComboUsoCfdi) {
            $("#btn-guardar-cambios-cfdi").hide();
        } else {
            $("#btn-guardar-cambios-cfdi").show();
        }

        if (!IsNullOrEmptyWhite(tipoGasto)) {
            $("#tipo-gasto").val(tipoGasto);
        } else {
            $("#tipo-gasto > option:first").prop("selected", true);
        }

        if (!IsNullOrEmptyWhite(tipoInversion)) {
            $("#tipo-inversion").val(tipoInversion);
        } else {
            $("#tipo-inversion > option:first").prop("selected", true);
        }
    }

    //RIF
    function cambiarEstadoCfdi(idEntidad, indice, estado) {
        var detalleGrid = FormsBuilder.ViewModel.getDetalleGrid()[idEntidad];
        var claveMapeoEstado = FormsBuilder.XMLForm.obtenerPropiedadMapeoPorClave(idEntidad, SAT.Environment.settings("claveMapeoEstadoCfdi"));

        if (claveMapeoEstado) {
            if (!isNaN(indice) && (detalleGrid && detalleGrid.length > 0)) {
                var cfdi = detalleGrid[indice];

                if (cfdi) {
                    cfdi["E{0}P{1}".format(idEntidad, claveMapeoEstado.idPropiedad)] = estado;
                }
            }
        }
    }

    function cancelarEdicionGrid(idEntidad) {
        var grid = $(".sat-container-gridcfdi[entidad='{0}']".format(idEntidad));
        var gridHijo = grid.find(".sat-container-gridcfdi");
        var modal = grid.children(".modal");
        var registroEditar = $("button.btn-guardar-registro[entidad='{0}']".format(idEntidad)).attr("editar");

        limpiarViewModel(idEntidad);
        setTimeout(function () {
            quitarErrores(idEntidad);
        }, 100);

        if (modal.length > 0) {
            modal.modal("hide");
        } else {
            $("div.formgrid[entidad='{0}'], button.btn-guardar-registro[entidad='{0}'], button.btn-cancelar-registro[entidad='{0}']".format(idEntidad)).hide();
            $("button.btn-nuevo-registro[entidad='{0}']".format(idEntidad)).show();
        }

        if (registroEditar) {
            var detalleGrid = FormsBuilder.ViewModel.getDetalleGrid()[idEntidad][registroEditar];

            delete detalleGrid.editando;
        }

        if (gridHijo.length > 0) {
            var idEntidadHijo = gridHijo.attr("entidad");
            var detalleGridHijo = JSON.parse(JSON.stringify(detalleGridTmp[idEntidadHijo]));
            revertirCambios(idEntidadHijo, detalleGridHijo);
            detalleGridTmp[idEntidadHijo] = null;
        }

        ejecutarReglasCalculoGrid(idEntidad);
    }

    function limpiarViewModel(idEntidad) {
        setTimeout(function () {
            var entidadViewModel = FormsBuilder.ViewModel.get()[idEntidad];

            SAT.Environment.setSetting("modifyingGridVm", true);
            SAT.Environment.setSetting("runRulesGrid", false);

            for (var key in entidadViewModel) {
                var control = $(".sat-container-gridcfdi[entidad='{0}'] [view-model='{1}']".format(idEntidad, key));

                if (control.length > 0) {
                    var propiedad = fbUtils.getPropiedad(key);
                    entidadViewModel[key]("");
                    window[fbUtils.propiedadWindow(propiedad)] = "";
                }
            }

            SAT.Environment.setSetting("runRulesGrid", true);
            SAT.Environment.setSetting("modifyingGridVm", false);
        }, 100);
    }

    function quitarErrores(idEntidad) {
        var grid = $(".sat-container-gridcfdi[entidad='{0}']".format(idEntidad));

        grid.find(".alert").removeClass("alert");
        grid.find(".sat-obligatorio-radioAlert").removeClass("sat-obligatorio-radioAlert");
        grid.find("i[vm].icon-warning-sign, i.icon-warning-signRadio").remove();

        FormsBuilder.ViewModel.setBadgeCount(grid);
    }

    function ejecutarReglasCalculoGrid(idEntidad) {
        var reglas = FormsBuilder.XMLForm.getReglasEjecutarPosterior();
        var camposGrid = FormsBuilder.ViewModel.getFieldsForExprsGrid();

        for (var i = 0; i < reglas.length; i++) {
            var regla = reglas[i];
            var propiedadesAsociadas = regla.idPropiedadAsociada.split(",");

            for (var j = 0; j < propiedadesAsociadas.length; j++) {
                var propiedadAsociada = propiedadesAsociadas[j].trim();
                var campoGrid = camposGrid[fbUtils.propiedadWindow(propiedadAsociada)];
                if (campoGrid) {
                    if (campoGrid.entidad === idEntidad) {
                        FormsBuilder.ViewModel.Calculo(regla);
                        break;
                    }
                }
            }
        }
    }

    function validarControlesVacios(idEntidad) {
        var grid = $(".sat-container-gridcfdi[entidad='{0}']".format(idEntidad));
        var controles = grid.find("input, select").not("input[type='file']");
        var hayControlesVacios = true;

        controles.each(function () {
            var control = $(this);
            var tag = control[0].tagName;
            var valor = control.val();

            if ((tag === "SELECT" && (!IsNullOrEmptyWhite(valor) && valor !== "0"))) {

                hayControlesVacios = false;
                return false;
            } else if (tag === "INPUT") {
                var tipoInput = control.attr("type");

                if (tipoInput === "ckeck" || tipoInput === "radio") {
                    var marcado = control.is(":checked");
                    if (marcado) {
                        hayControlesVacios = false;
                        return false;
                    }
                } else if (!IsNullOrEmptyWhite(valor)) {
                    hayControlesVacios = false;
                    return false;
                }
            }
        });

        if (hayControlesVacios) {
            fbUtils.mostrarMensajeError(MSJ_CAMPOS_VACIOS);
        }

        return hayControlesVacios;
    }

    function validarViewModelEntidad(viewModelEntidad) {
        var noEsNulo = false;
        for (var propiedad in viewModelEntidad) {
            var validar = viewModelEntidad[propiedad]();
            if (validar) {
                noEsNulo = true;
                break;
            }
        }

        return noEsNulo;
    }

    function validarCamposObligatorios(idEntidad) {
        var obligatorios = $(".sat-container-gridcfdi[entidad='{0}'] [data-obligatorio]".format(idEntidad));
        var reglas = FormsBuilder.XMLForm.getReglas()["reglas"]["regla"];

        obligatorios.each(function () {
            var obligatorio = $(this).hasClass("sat-obligatorio-radio") ? $(this).find("input[type='radio'][view-model]") : $(this);
            var db_id = obligatorio.attr("view-model");
            var propiedadObligatorio = fbUtils.getPropiedad(db_id);
            var reglasObligatorio = Enumerable.From(reglas).Where("$.idEntidad == '{0}' && $.idPropiedadAsociada == '{1}' && $.tipoRegla === 'Validacion'".format(idEntidad, propiedadObligatorio)).ToArray();

            if (reglasObligatorio.length > 0) {
                for (var i = 0; i < reglasObligatorio.length; i++) {
                    var regla = reglasObligatorio[i];
                    if (!regla.mensajeErrorEnDialogo || regla.mensajeErrorEnDialogo != 1) {
                        FormsBuilder.ViewModel.Validacion(db_id, regla);
                    }
                }
            }
        });

    }

    function validarDuplicidad(llavePrimaria, idEntidad, viewModel, mostrarMensaje) {
        var esDuplicado = true;
        var detalleGrid = Enumerable.From(FormsBuilder.ViewModel.getDetalleGrid()[idEntidad]).Where("$.editando === undefined").ToArray();

        if (detalleGrid.length > 0) {
            var propiedadesLlave = llavePrimaria.split(",");
            var expresion = "";

            for (var i = 0; i < propiedadesLlave.length; i++) {
                var propiedadLlave = propiedadesLlave[i].trim();
                var entidadPropiedad = "E{0}P{1}".format(idEntidad, propiedadLlave);

                expresion = expresion.concat("$.", entidadPropiedad, " == '", viewModel[entidadPropiedad]() || "", "'");

                if (i < (propiedadesLlave.length - 1)) {
                    expresion = expresion.concat(" && ");
                }
            }

            esDuplicado = Enumerable.From(detalleGrid).Any(expresion);
        } else {
            esDuplicado = false;
        }

        if (esDuplicado && mostrarMensaje === true) {
            var mensaje = $(".sat-container-gridcfdi[entidad='{0}']".format(idEntidad)).attr("data-mensajeduplicados");

            fbUtils.mostrarMensajeError(mensaje);
        }

        return esDuplicado;
    }

    function formatoMoneda(elemento, idEntidad, idPropiedad) {
        var entidadJson = Enumerable.From(FormsBuilder.XMLForm.getEntidades()).Where("$.id == '{0}'".format(idEntidad)).FirstOrDefault();
        var propiedadJson = Enumerable.From(entidadJson.propiedades.propiedad).Where("$.id == '{0}'".format(idPropiedad)).FirstOrDefault();
        var tipoDato = propiedadJson.tipoDatos;

        if (tipoDato === "Numerico") {
            var decimales = elemento.attr("mostrarDecimales");
            var formato = fbUtils.getFormatCurrency(decimales);
            elemento.formatCurrency(formato);
        }
    }

    function pintarTotales(idEntidad) {
        var grids = $(".sat-container-gridcfdi[entidad='{0}']".format(idEntidad));

        grids.each(function () {
            var registros;
            var grid = $(this);
            var filtrado = grid.attr("data-filtrado") === "true";

            if (filtrado) {
                registros = obtenerDetalleGrid(idEntidad, ORIGEN_DATOS_GRID.FILTRADO).length;
            } else {
                registros = obtenerDetalleGrid(idEntidad, ORIGEN_DATOS_GRID.NORMAL).length;
            }

            if (registros >= 2) {
                if (grid.attr("data-totales") && grid.attr("data-totales") === "true") {
                    var propiedadesTotal = totales[grid.attr("id")];
                    var tipoSuma = ORIGEN_DATOS_GRID.NORMAL;

                    if (filtrado) {
                        tipoSuma = ORIGEN_DATOS_GRID.FILTRADO;
                    }

                    if (propiedadesTotal && propiedadesTotal.length > 0) {
                        for (var i = 0; i < propiedadesTotal.length; i++) {
                            var propiedadTotal = propiedadesTotal[i];
                            var suma = sumaRegistrosGrid(tipoSuma, idEntidad, propiedadTotal);
                            var celda = grid.find("tfoot>tr>td[columna='grid_{0}_${1}']".format(idEntidad, propiedadTotal));

                            if (celda.length > 0) {
                                var decimales = $("[view-model='E{0}P{1}'][mostrarDecimales]".format(idEntidad, propiedadTotal)).attr("mostrarDecimales");
                                var format = FormsBuilder.Utils.getFormatCurrency(decimales);
                                celda.html(suma);
                                celda.formatCurrency(format);
                            }
                        }

                        grid.find("tfoot").show();
                    }
                }
            } else {
                grid.find("tfoot").hide();
            }
        });
    }


    /*  ACCIONES GRID HIJO  */

    function confirmarCambios(idEntidad, fk, fkValor) {
        var detalleGrid = FormsBuilder.ViewModel.getDetalleGrid()[idEntidad];

        if (detalleGrid && fk && fkValor) {
            for (var i = 0; i < detalleGrid.length; i++) {
                var detalle = detalleGrid[i];
                var db_id = "E{0}P{1}".format(idEntidad, fk);
                if (detalle[db_id] == fkValor) {
                    delete detalle.temporal;
                }
            }

            detalleGridTmp[idEntidad] = null;
        }
    }

    function revertirCambios(idEntidad, detalleAnterior) {
        if (idEntidad) {
            detalleAnterior = Enumerable.From(detalleAnterior).Where("$.temporal === undefined").ToArray();
            FormsBuilder.ViewModel.setDetalleGridEntidad(idEntidad, detalleAnterior);

            renderGridCfdi(idEntidad);
        }
    }

    function actualizarFk(idEntidad, propiedadFk, valorFkBuscar, valorNuevoFk) {
        if (idEntidad && propiedadFk && valorFkBuscar) {
            var detalleGridVm = FormsBuilder.ViewModel.getDetalleGrid()[idEntidad];
            var db_id_fk = "E{0}P{1}".format(idEntidad, propiedadFk);

            if (detalleGridVm && (!detalleGridTmp[idEntidad] || detalleGridTmp[idEntidad].length !== detalleGridVm.length)) {
                detalleGridTmp[idEntidad] = JSON.parse(JSON.stringify(detalleGridVm));
            }

            if (detalleGridTmp[idEntidad]) {
                var detalleGrid = JSON.parse(JSON.stringify(detalleGridTmp[idEntidad]));
                for (var i = 0; i < detalleGrid.length; i++) {
                    var detalle = detalleGrid[i];
                    if (detalle[db_id_fk] == valorFkBuscar) {
                        detalle[db_id_fk] = valorNuevoFk;
                    }
                }

                FormsBuilder.ViewModel.setDetalleGridEntidad(idEntidad, detalleGrid);
                renderGridCfdi(idEntidad);
            }
        }
    }

    function sumaRegistrosGrid(tipoSuma, idEntidad, idPropiedadSumar) {
        var suma = 0;

        if (tipoSuma && idEntidad && idPropiedadSumar) {
            var db_id = "E{0}P{1}".format(idEntidad, idPropiedadSumar);
            var datos = obtenerDetalleGrid(idEntidad, tipoSuma);
            var propiedadMapeoEstado = FormsBuilder.XMLForm.obtenerPropiedadMapeoPorClave(idEntidad, SAT.Environment.settings("claveMapeoEstadoCfdi"));
            var claveMapeoTipo = FormsBuilder.XMLForm.obtenerPropiedadMapeoPorClave(idEntidad, SAT.Environment.settings("claveMapeoTipoComprobante"));

            if (datos.length > 0 && propiedadMapeoEstado && claveMapeoTipo) {
                var idEntidadPropiedadEstado = "E{0}P{1}".format(idEntidad, propiedadMapeoEstado.idPropiedad);

                for (var i = 0; i < datos.length; i++) {
                    var detalleFila = datos[i];
                    if (!detalleFila["editando"] && detalleFila[db_id] && detalleFila[idEntidadPropiedadEstado] !== ESTADO_CFDI.ELIMINADO) {
                        var value = parseFloat(detalleFila[db_id]);
                        if (!isNaN(value)) {
                            var idEntidadPropiedadTipo = "E{0}P{1}".format(idEntidad, claveMapeoTipo.idPropiedad);
                            var tipoCfdi = detalleFila[idEntidadPropiedadTipo];

                            if (tipoCfdi == TIPO_CFDI.GASTO) {
                                suma -= value;
                            } else {
                                suma += value;
                            }
                        }
                    }
                }
            }
        }

        return (suma < 0) ? 0 : suma;
    }

    function renderGridCfdi(idEntidad, ejecutarReglasCalculo) {
        if (idEntidad) {
            var grid = $(".sat-container-gridcfdi[entidad='{0}']".format(idEntidad));
            var detalleGrid = FormsBuilder.ViewModel.getDetalleGrid()[idEntidad];

            if (detalleGrid) {
                var claveMapeoInconsistencias = FormsBuilder.XMLForm.obtenerPropiedadMapeoPorClave(idEntidad, SAT.Environment.settings("claveMapeoInconsistenciasCfdi"));
                var ordenarPor = grid.find("table[entidad='{0}']".format(idEntidad)).attr("data-ordenar-por");

                if (!IsNullOrEmptyWhite(ordenarPor)) {
                    var columnasOrdenar = ordenarPor.split(",");
                    var detalleOrdenado = [];

                    if (columnasOrdenar.length === 1) {
                        detalleOrdenado = Enumerable.From(detalleGrid).OrderBy("$.{0}".format(columnasOrdenar[0])).ToArray();
                    } else if (columnasOrdenar.length === 2) {
                        detalleOrdenado = Enumerable.From(detalleGrid).OrderByDescending("$.{0}".format(columnasOrdenar[0])).ThenBy("$.{0}".format(columnasOrdenar[1])).ToArray();
                    }

                    FormsBuilder.ViewModel.setDetalleGridEntidad(idEntidad, detalleOrdenado);

                    detalleGrid = Object.assign([], detalleOrdenado);
                }

                if (claveMapeoInconsistencias) {
                    var idEntidadPropiedad = "E{0}P{1}".format(idEntidad, claveMapeoInconsistencias.idPropiedad);
                    var hayInconsistencias = Enumerable.From(detalleGrid).Any("!IsNullOrEmptyWhite($.{0})".format(idEntidadPropiedad));

                    if (hayInconsistencias) {
                        grid.find("table").bootstrapTable("showColumn", "alerta-inconsistencias");
                    }
                } else {
                    console.warn(">>> GridCfdi.renderGridCfdi -> No se encontro la propiedad mapeo 'Inconsistencias'");
                }

                pintarFilasGrid(idEntidad, detalleGrid);
                pintarTotales(idEntidad);

                if (ejecutarReglasCalculo === true) {
                    ejecutarReglasCalculoGrid(idEntidad);
                }
            }
        }
    }

    function actualizarRegistros(idEntidad, conceptos) {
        if (idEntidad && conceptos && conceptos.length > 0) {
            var detalleGrid = FormsBuilder.ViewModel.getDetalleGrid()[idEntidad];
            var claveMapeoId = FormsBuilder.XMLForm.obtenerPropiedadMapeoPorClave(idEntidad, SAT.Environment.settings("claveMapeoId"));
            var idEntidadPropiedadId = "E{0}P{1}".format(idEntidad, claveMapeoId.idPropiedad);

            conceptos.forEach(function (concepto) {
                var conceptoAnterior = Enumerable.From(detalleGrid).Where("$.{0} === '{1}'".format(idEntidadPropiedadId, concepto.LlaveRegistro)).FirstOrDefault();
                var conceptoActualizado = mapearCfdiViewModel(idEntidad, concepto);

                Object.assign(conceptoAnterior, conceptoActualizado);
            });

            renderGridCfdi(idEntidad, true);
            $("a[data-tipo-deduccion].active").click();
            FormsBuilder.Modules.actualizarContadores();
        }
    }

    function obtenerDetalleGrid(idEntidad, origen) {
        var detalle;

        switch (origen) {
            case ORIGEN_DATOS_GRID.NORMAL:
                detalle = FormsBuilder.ViewModel.getDetalleGrid()[idEntidad];
                break;
            case ORIGEN_DATOS_GRID.FILTRADO:
                detalle = FormsBuilder.ViewModel.getDetalleGridFiltrado()[idEntidad];
                break;
            case ORIGEN_DATOS_GRID.PAGINADO:
                detalle = FormsBuilder.ViewModel.getDetalleGridPaginado()[idEntidad];
                break;
        }

        if (!detalle) {
            detalle = [];
        }

        return detalle;
    }

    function crearIndiceElementos(array) {
        if (array.length > 0) {
            array.forEach(function (elemento, indice) {
                if (typeof elemento === "object") {
                    elemento.index = indice;
                }
            });
        }
    }

    function mapearCfdiViewModel(idEntidad, cfdi) {
        var viewModel;

        if (!IsNullOrEmptyWhite(idEntidad) && cfdi) {
            var propiedadesMapeo = FormsBuilder.XMLForm.obtenerPropiedadesMapeo(idEntidad);
            viewModel = {};

            propiedadesMapeo.forEach(function (propiedadMapeo) {
                var idEntidadPropiedad = "E{0}P{1}".format(propiedadMapeo.idEntidad, propiedadMapeo.idPropiedad);
                viewModel[idEntidadPropiedad] = cfdi[propiedadMapeo.propiedadMapeo];
            });
        }

        return viewModel;
    }

    function mapearCfdisViewModel(idEntidad, cfdis) {
        if (!IsNullOrEmptyWhite(idEntidad) && cfdis) {
            var cfdisViewModel = [];
            var propiedadesMapeo = FormsBuilder.XMLForm.obtenerPropiedadesMapeo(idEntidad);

            cfdis.forEach(function (cfdi) {
                var cfdiViewModel = {};
                propiedadesMapeo.forEach(function (propiedadMapeo) {
                    var idEntidadPropiedad = "E{0}P{1}".format(propiedadMapeo.idEntidad, propiedadMapeo.idPropiedad);
                    cfdiViewModel[idEntidadPropiedad] = cfdi[propiedadMapeo.propiedadMapeo];
                });

                cfdisViewModel.push(cfdiViewModel);
            });

            FormsBuilder.ViewModel.setDetalleGridEntidad(idEntidad, cfdisViewModel);
        }
    }

    function mapearViewModelCfdi(idEntidad, viewModel) {
        var cfdi = {};

        if (!IsNullOrEmptyWhite(idEntidad) && viewModel) {
            var propiedadesMapeo = FormsBuilder.XMLForm.obtenerPropiedadesMapeo(idEntidad);

            propiedadesMapeo.forEach(function (propiedadMapeo) {
                var idEntidadPropiedad = "E{0}P{1}".format(propiedadMapeo.idEntidad, propiedadMapeo.idPropiedad);
                var infoPropiedad = FormsBuilder.ViewModel.getFieldsForExprs()["${0}".format(propiedadMapeo.idPropiedad)];

                if (infoPropiedad) {
                    var valor = viewModel[idEntidadPropiedad];

                    if (IsNullOrEmpty(valor)) {
                        switch (infoPropiedad.tipoDatos) {
                            case "Numerico":
                                valor = 0;
                                break;
                            case "Booleano":
                                valor = false;
                                break;
                        }
                    } else if (infoPropiedad.tipoDatos === "Booleano") {
                        valor = valor.ToBoolean();
                    }

                    cfdi[propiedadMapeo.propiedadMapeo] = valor;
                }
            });
        }

        return cfdi;
    }
})();