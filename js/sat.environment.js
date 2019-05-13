/** @module SAT.Environment */
/**
 * Modulo que inicia una variable de entorno
 *
 * (c) SAT 2013, Iv�n Gonz�lez
 */
/*global namespace:false */

"use strict";

(function() {
    namespace("SAT.Environment", settings, setSetting, addtoArraySetting, removeArraySetting);

    var ObjSettings = {};
    ObjSettings["isHydrate"] = false;
    ObjSettings["isModified"] = false;
    ObjSettings["applyrulesvalidation"] = true;
    ObjSettings["showdialogs"] = true;
    ObjSettings["dejarsinefecto"] = false;
    ObjSettings["esquemaanterior"] = false;
    ObjSettings["actualizacionimporte"] = false;
    ObjSettings["applyrules"] = true;
    ObjSettings["appversion"] = "3.1.13"; // Version mayor, Version menor, Compilacion
    ObjSettings["isRowClicked"] = false;
    ObjSettings["isMacOSX"] = false;
    ObjSettings["loadedPrecargarAnexo"] = false;
    ObjSettings["thisPropertiesNotExecuteRules"] = [];
    ObjSettings["entidadReteneciones"] = ["1098", "1012", "1041"];
    ObjSettings["online"] = true;
    ObjSettings["performClosing"] = false;
    ObjSettings["performClosingObject"] = undefined;
    ObjSettings["isMobile"] = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    ObjSettings["isDAS"] = false;
    ObjSettings["runRulesCalc"] = false;
    ObjSettings["isSelector"] = false;
    ObjSettings["isSelectorPropuesta"] = false;
    ObjSettings["numeroRetenedoresPermitidos"] = 1;
    ObjSettings["isSimulador"] = false;
    ObjSettings["AuxMassive"] = true;
    ObjSettings["massives"] = [];
    ObjSettings["firmadoSilverlight"] = true;
    ObjSettings["jsFirmado"] = "";
    ObjSettings["isProposal"] = false;
    ObjSettings["acceptProposal"] = false;
    ObjSettings["runRulesGrid"] = true;
    ObjSettings["loadingTemporal"] = false;
    ObjSettings["initialKoBinding"] = false;
    ObjSettings["executingRule"] = false;
    ObjSettings["modifyingGridVm"] = false;
    ObjSettings["ViewCfdiPDF"] = true;
    ObjSettings["ContribuyenteListaNegra"] = false;
    ObjSettings["urlManualCargaMasivaRetenciones"] = "";
    ObjSettings["regimenSimulador"] = 6;
    ObjSettings["ejercicioSimulador"] = 2018;
    ObjSettings["periodoSimulador"] = "035";
    ObjSettings["periodoDescSimulador"] = "Del Ejercicio";
    ObjSettings["tipoDeclaracionSimulador"] = "001";
    ObjSettings["tipoDeclaracionDescSimulador"] = "Normal";
    ObjSettings["fechaModalAvisoSimulador"] = "01/01/2018";
    ObjSettings["claveMapeoTipoDeduccion"] = "Clasificacion";
    ObjSettings["claveMapeoConsecutivo"] = "Consecutivo";
    ObjSettings["claveMapeoOrigen"] = "Origen";
    ObjSettings["claveMapeoId"] = "LlaveRegistro";
    ObjSettings["claveMapeoEjercicio"] = "Ejercicio";
    ObjSettings["noClasificado"] = "L";
    ObjSettings["urlObtenerConceptos"] = "https://localhost/NuevoPortal/Conceptos/ObtenerConceptos";
    ObjSettings["urlInsertarConcepto"] = "https://localhost/NuevoPortal/Conceptos/Agregar";
    ObjSettings["urlActualizarConcepto"] = "https://localhost/NuevoPortal/Conceptos/Editar";
    ObjSettings["urlEliminarConcepto"] = "https://localhost/NuevoPortal/Conceptos/Eliminar";

    function settings(key) {
        ObjSettings["loadXMLTemplate"] = false;
        ObjSettings["debug"] = true;
        ObjSettings["environment"] = "dev";
        ObjSettings["typeapp"] = "web"; //web || desktop

        return ObjSettings[key];
    }

    function setSetting(key, value) {
        ObjSettings[key] = value;
    }

    function addtoArraySetting(key, value) {
        ObjSettings[key].push(value);
    }

    function removeArraySetting(key, value) {
        var index = ObjSettings[key].indexOf(value);
        if (index != -1) {
            ObjSettings[key].splice(index, 1);
        }
    }

})();