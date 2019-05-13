/** @module FormsBuilder.CargaMasiva */
/**
 * Modulo para el flujo de cargas masivas.
 *
 * (c) SAT 2017, Javier Cortes Cruz
 */
/*global namespace:false, FormsBuilder:false, SAT: false, AppDeclaracionesSAT:false, ko:false, Base64:false */

"use strict";

var TIPO_REGLA = {
    "CALCULO": "Calculo",
    "VALIDACION": "Validacion",
    "VISUAL": "Visual",
    "CONDICIONAL": "Condicional Excluyente"
};

(function () {
    namespace("FormsBuilder.CargaMasiva", cargarArchivo, configurarCargaMasiva);

    var LIMITE_REGISTROS;

    var DELIMITADOR_LINEA = "\r";
    var DELIMITADOR_VALOR = "|";
    var MSJ_LIMITE_REGISTROS = "El archivo contiene más registros de los permitidos.";
    var MSJ_SIN_REGISTROS = "El archivo no contiene datos.";
    var MSJ_REGISTRO_DUPLICADO = "Registro duplicado.";
    var MSJ_REGISTRO_VACIO = "Registro vacio.";
    var MSJ_ERROR = "Línea: {0} -> ERROR: {1}";

    function configurarCargaMasiva() {
        LIMITE_REGISTROS = AppDeclaracionesSAT.getConfig("limiteRegistrosCargaMasiva");
    }

    function cargarArchivo(idEntidad, archivo, llavePrimaria) {
        var MSJ_FALTAN_VALORES = "Faltan valores en esta línea.";
        var resultadoCarga = { "lineasCorrectas": 0, "lineasConError": [] };

        if (idEntidad && archivo) {
            var viewModel = FormsBuilder.ViewModel.get()[idEntidad];

            if (viewModel) {
                var callback = function (contenido) {
                    var clavesViewModel = Object.keys(viewModel);
                    var propiedadesExcluir = obtenerPropiedadesExcluir(idEntidad);
                    var numeroPropiedades = clavesViewModel.length - propiedadesExcluir.length;
                    var lineas = contenido.trim().split(DELIMITADOR_LINEA);

                    if (lineas.length > 0 && lineas.length <= LIMITE_REGISTROS) {
                        var lineaEncabezados = lineas.shift();
                        var encabezados = lineaEncabezados.trim().split(DELIMITADOR_VALOR);
                        var detalleGrid = FormsBuilder.ViewModel.getDetalleGrid()[idEntidad];

                        if (!detalleGrid) {
                            FormsBuilder.ViewModel.setDetalleGridEntidad(idEntidad, []);
                            detalleGrid = FormsBuilder.ViewModel.getDetalleGrid()[idEntidad];
                        }

                        lineas.forEach(function (linea, indice) {

                            console.log(">>>>cargarArchivo.linea {0}".format(indice));

                            var validacion;
                            var esDuplicado = false;
                            var valores = linea.trim().split(DELIMITADOR_VALOR);
                            var esLineaValida = validarLinea(valores);

                            if (valores.length !== numeroPropiedades) {
                                resultadoCarga.lineasConError.push(MSJ_ERROR.format(indice + 2, MSJ_FALTAN_VALORES));
                            } else if (esLineaValida === false) {
                                resultadoCarga.lineasConError.push(MSJ_ERROR.format(indice + 2, MSJ_REGISTRO_VACIO));
                            } else {
                                var restaIndice = 0;

                                SAT.Environment.setSetting('applyrules', false);

                                clavesViewModel.forEach(function (key, indice) {
                                    var excluirPropiedad = Enumerable.From(propiedadesExcluir).Any("$ == '{0}'".format(key));

                                    if (!excluirPropiedad) {
                                        var nuevoValor = valores[indice - restaIndice];

                                        if (isNaN(nuevoValor)) {
                                            nuevoValor = nuevoValor.toUpperCase();
                                        } else if (!IsNullOrEmptyWhite(nuevoValor)) {
                                            nuevoValor = REDONDEARSAT(nuevoValor);
                                        }

                                        viewModel[key](nuevoValor);
                                    } else {
                                        restaIndice++;
                                    }
                                });

                                SAT.Environment.setSetting('applyrules', true);

                                validacion = FormsBuilder.ViewModel.validarViewModel(viewModel);

                                if (llavePrimaria) {
                                    esDuplicado = FormsBuilder.Modules.validarDuplicidad(llavePrimaria, idEntidad, viewModel, false);
                                }

                                if (validacion.esViewModelCorrecto === true && !esDuplicado) {
                                    detalleGrid.push(FormsBuilder.ViewModel.obtenerObjetoPlano(viewModel));
                                    resultadoCarga.lineasCorrectas++;
                                } else if (esDuplicado === true) {
                                    resultadoCarga.lineasConError.push(MSJ_ERROR.format(indice + 2, MSJ_REGISTRO_DUPLICADO));
                                } else {
                                    resultadoCarga.lineasConError.push(MSJ_ERROR.format(indice + 2, validacion.mensajeError));
                                }
                            }
                        });

                        FormsBuilder.Modules.renderFormularioGrid(idEntidad, null, true);
                        FormsBuilder.Modules.limpiarViewModel(idEntidad);

                        $("#modalCargandoArchivo").modal("hide");
                        mostrarDetalleCarga(resultadoCarga);
                    } else if (!lineas || lineas.length === 0) {
                        $("#modalCargandoArchivo").modal("hide");
                        fbUtils.mostrarMensajeError(MSJ_LIMITE_REGISTROS);
                    } else if (lineas.length > LIMITE_REGISTROS) {
                        $("#modalCargandoArchivo").modal("hide");
                        fbUtils.mostrarMensajeError(MSJ_LIMITE_REGISTROS);
                    }
                };

                FormsBuilder.FileUtils.leerArchivo(archivo, callback);
            }
        }

        return resultadoCarga;
    }

    function obtenerPropiedadesExcluir(idEntidad) {
        var propiedadesExcluir = [];

        if (!IsNullOrEmptyWhite(idEntidad)) {
            var entidadJson = Enumerable.From(FormsBuilder.XMLForm.getEntidades()).Where("$.id == '{0}'".format(idEntidad)).FirstOrDefault();

            if (entidadJson) {
                propiedadesExcluir = Enumerable.From(entidadJson.propiedades.propiedad).Where(function (propiedad) {
                    return Enumerable.From(propiedad.atributos.atributo).Any("$.nombre == 'ExcluirEnCargaMasiva'");
                }).Select(function (propiedadExcluir) {
                    return "E{0}P{1}".format(idEntidad, propiedadExcluir.id)
                }).ToArray();
            }
        }

        return propiedadesExcluir;
    }

    function validarLinea(valores) {
        var esLineaValida = false;

        for (var i = 0; i < valores.length; i++) {
            var valor = valores[i];
            if (!IsNullOrEmptyWhite(valor)) {
                esLineaValida = true;
                break;
            }
        }

        return esLineaValida;
    }

    function mostrarDetalleCarga(resultadoCarga) {
        if (resultadoCarga && (resultadoCarga.lineasCorrectas > 0 || resultadoCarga.lineasConError.length > 0)) {
            var lineasCorrectas = $("<strong>Se agregaron {0} registros.</strong>".format(resultadoCarga.lineasCorrectas));
            var lineasConError = $("<strong>Se detectaron {0} errores.</strong>".format(resultadoCarga.lineasConError.length));
            var verDetalleErrores = $("<br><a href='#detalleErroresCargaMasiva' data-toggle='collapse'>Ver detalle</a>");
            var detalleErrores = $("<div id='detalleErroresCargaMasiva' class='collapse'><ul></ul></div>");

            if (resultadoCarga.lineasConError.length > 0) {
                resultadoCarga.lineasConError.forEach(function (linea) {
                    detalleErrores.find("ul").append("<li>{0}</li>".format(linea));
                });
            }

            $("#modalDetalleCargaMasiva").find(".alert-success").html(lineasCorrectas);
            $("#modalDetalleCargaMasiva").find(".alert-danger").html(lineasConError);
            $("#modalDetalleCargaMasiva").find(".alert-danger").append(verDetalleErrores);
            $("#modalDetalleCargaMasiva").find(".alert-danger").append(detalleErrores);

            $("#modalDetalleCargaMasiva").modal("show");
        }
    }
})();
