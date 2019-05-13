/** @module AppDeclaracionesSAT */
/**
 * Modulo que inicia la UI principal
 *
 * (c) SAT 2013, Iv�n Gonz�lez
 */
/*global namespace:false */

"use strict";

(function() {
    namespace("AppDeclaracionesSAT", getConfig, setConfig, getConst);

    window.ORIGEN_DATOS_GRID = { "NORMAL": 1, "FILTRADO": 2, "PAGINADO": 3 };
    window.ORIGEN_CFDI = { "PRECARGA": 0, "MANUAL": 1 };
    window.TIPO_ACCION_CFDI = { "OBTENER": 0, "INSERTAR": 1, "ACTUALIZAR": 2, "ELIMINAR": 3, "ACTUALIZAR_GRUPO": 4, "ELIMINAR_GRUPO": 5 };

    var constants = {};

    constants.TipoDeclaracionNormal = "001";
    constants.TipoDeclaracionNormalCorrecionFiscal = "003";
    constants.TipoDeclaracionComplementaria = "002";
    constants.TipoDeclaracionComplementariaCorrecionFiscal = "004";
    constants.TipoDeclaracionComplementariaDictamen = "005";
    constants.TipoDeclaracionComplementariaDesconsolidacion = "009";
    constants.TipoDeclaracionComplementariaDesincorporacion = "010";

    constants.TipoComplementariaDejarSinEfecto = "002";
    constants.TipoComplementariaModificacionObligaciones = "003";
    constants.TipoComplementariaNoPresentada = "004";
    constants.TipoComplementariaActualizacionDeImporte = "005";
    constants.TipoComplementariaEsquemaAnterior = "006";

    constants.TotalAPagarViewModelId = "E1024P24007";

    var config = {};
    config.rfc = "";
    config.nombre = "";
    config.tipodeclaracion = "";
    config.tipopersona = "";
    config.tipocomplementaria = "";
    config.origen = "";
    config.ejercicio = 0;
    config.debug = false;
    config.esSelector = false;
    config.ejercicioperfil = 2015;
    config.urlSelector = "";
    config.infoIDC = true;
    config.configuracionDeclaracion = { "regimen": 6, "ejercicio": 2018, "periodo": "01", "periodicidad": "Y" };
    config.limiteRegistrosGrid = 20;
    config.limiteRegistrosCargaMasiva = 1201;
    config.limitePaginasPaginador = 10;

    function getConfig(key) {
        return config[key];
    }

    function setConfig(key, value) {
        config[key] = value;
    }

    function getConst(key) {
        return constants[key];
    }

})();