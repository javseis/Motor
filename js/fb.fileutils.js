/** @module FormsBuilder.FileUtils */
/**
 * Modulo que manipula archivos.
 *
 * (c) SAT 2017, Javier Cortes Cruz
 */
/*global namespace:false, FormsBuilder:false, SAT: false, AppDeclaracionesSAT:false, ko:false, Base64:false */

"use strict";

(function() {
    namespace("FormsBuilder.FileUtils", leerArchivo);

    var MSJ_EXTENSION_INVALIDA = "Solo se permiten archivos de texto (.txt).";
    var MSJ_ARCHIVO_VACIO = "El archivo cargado no contiene datos, por favor intentelo de nuevo.";
    var MSJ_TAMANO_ARCHIVO = "El archivo supera el tamaño permitido (XMB).";
    var MSJ_ARCHIVO_NULO = "No se cargó ningún archivo.";

    var TAMANO_MAXIMO_KB = 512;
    var EXTENSIONES = /(\.txt)$/;

    function leerArchivo(archivo, callback) {
        if (validarArchivo(archivo)) {
            var reader = new FileReader();

            reader.onloadstart = function(event) {
                console.log(">>>>FileReader.loadStart()");
            };

            reader.onload = function (event) {
                console.log(">>>>FileReader.load()");
                if (callback && typeof callback === "function") {
                    callback(reader.result);
                }
            };

            reader.onerror = function(event) {
                console.error(event);
            };

            reader.readAsText(archivo);
        }
    }

    function validarArchivo(archivo) {
        var esArchivoValido = true;

        if (archivo) {
            if (!EXTENSIONES.test(archivo.name)) {
                esArchivoValido = false;
                $("#modalCargandoArchivo").modal("hide");
                fbUtils.mostrarMensajeError(MSJ_EXTENSION_INVALIDA);
            } else if ((archivo.size / 1024) > TAMANO_MAXIMO_KB) {
                esArchivoValido = false;
                $("#modalCargandoArchivo").modal("hide");
                fbUtils.mostrarMensajeError(MSJ_TAMANO_ARCHIVO);
            } else if (archivo.size === 0) {
                esArchivoValido = false;
                $("#modalCargandoArchivo").modal("hide");
                fbUtils.mostrarMensajeError(MSJ_ARCHIVO_VACIO);
            }
        } else {
            esArchivoValido = false;
            $("#modalCargandoArchivo").modal("hide");
            fbUtils.mostrarMensajeError(MSJ_ARCHIVO_NULO);
        }

        return esArchivoValido;
    }
})();