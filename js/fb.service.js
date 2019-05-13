/*global namespace: false, TIPO_ACCION_CFDI: false, Base64: false, AppDeclaracionesSAT: false, SAT: false */

"use strict";
(function () {
    namespace("Service.Test", ejecutarAccionCFDI, obtenerConceptosCfdi, obtenerDetalleCfdi);

    function ejecutarAccionCFDI(tipoAccion, datos, callback) {
        var url = "";
        var parametros = {};

        if (datos && !IsNullOrEmpty(tipoAccion)) {
            switch (tipoAccion) {
                case TIPO_ACCION_CFDI.INSERTAR:
                    url = SAT.Environment.settings("urlInsertarConcepto");
                    parametros = {
                        "data": Base64.encode(JSON.stringify(datos)),
                        "partition": obtenerDatosPartition()
                    };
                    break;
                case TIPO_ACCION_CFDI.ACTUALIZAR:
                    url = SAT.Environment.settings("urlActualizarConcepto");
                    parametros = {
                        "data": Base64.encode(JSON.stringify(datos))
                    };
                    break;
                case TIPO_ACCION_CFDI.ELIMINAR:
                    url = SAT.Environment.settings("urlEliminarConcepto");
                    parametros = {
                        "partition": obtenerDatosPartition(),
                        "idConceptos": datos
                    };
                    break;
            }

            $.post(url, parametros)
                .done(function (result) {
                    if (result && result.EsValido && typeof callback === "function") {
                        if (tipoAccion === TIPO_ACCION_CFDI.INSERTAR) {
                            callback(result.Concepto);
                        } else if (tipoAccion === TIPO_ACCION_CFDI.ACTUALIZAR) {
                            callback(result.Conceptos);
                        } else {
                            callback();
                        }
                    } else if (result && !IsNullOrEmpty(result.Mensaje)) {
                        fbUtils.mostrarMensajeError(result.Mensaje);
                    }
                })
                .fail(function(){
                    var mensaje = "Problemas con la conexión. Revise su conexión a Internet.";
                    console.error("Service.Test.ejecutarAccionCFDI -> {0}".format(mensaje));
                    fbUtils.mostrarMensajeError(mensaje);
                });
        } else {
            console.error("Service.Test.ejecutarAccionCFDI -> No se pudo ejecutar la accion");
        }
    }

    function obtenerConceptosCfdi(callback) {
        var url = SAT.Environment.settings("urlObtenerConceptos");
        var configuracion = AppDeclaracionesSAT.getConfig("configuracionDeclaracion");
        var parametros = {
            "data": JSON.stringify({
                "ejercicio": configuracion.ejercicio,
                "regimen": configuracion.regimen,
                "periodicidad": "Y",
                "periodo": configuracion.periodo
            })
        };

        $.post(url, parametros)
            .done(function (result) {
                if (result && result.EsValido && typeof callback === "function") {
                    callback(result.Conceptos);
                } else if (result && !IsNullOrEmpty(result.Mensaje)) {
                    console.error(result.Mensaje);
                }
            });
    }

    function obtenerDetalleCfdi(uuid) {
        if (!IsNullOrEmptyWhite(uuid)) {
            var url = SAT.Environment.settings("urlDetalleCfdi");
            $.post(url, { "uuid": uuid }, null, "html")
                .done(function (result) {
                    $("#detalle-cfdi .modal-body").html(result);
                });
        } else {
            console.error("Service.Test.obtenerDetalleCfdi -> UUID no valido");
        }
    }

    function obtenerDatosPartition() {
        var partition = "";
        var configuracion = AppDeclaracionesSAT.getConfig("configuracionDeclaracion");

        if (configuracion && configuracion.ejercicio && configuracion.regimen && configuracion.periodicidad && configuracion.periodo) {
            partition = "{0}.{1}.{2}.{3}".format(configuracion.ejercicio, configuracion.regimen, configuracion.periodicidad, configuracion.periodo);
        }

        return partition;
    }
})();