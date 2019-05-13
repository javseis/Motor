/** @module FormsBuilder.Catalogs */
/**
 * Modulo que carga los catalogos del XML
 *
 * (c) SAT 2013, Iv�n Gonz�lez
 */
/*global namespace:false, FormsBuilder:false, SAT: false, AppDeclaracionesSAT:false, ko:false, Base64:false */

"use strict";

(function() {
    namespace("FormsBuilder.Catalogs", init, getAll, getCatalog, getCatalogById, getTextByValue);
    window.fbCatalogos = FormsBuilder.Catalogs;

    var catalogs;

    function init(xmlDoc) {
        catalogs = $(xmlDoc);

        FormsBuilder.Utils.cargarCatalogoFuncionesReglas();
    }

    function getAll() {
        return catalogs;
    }

    function getCatalog(catalog) {
        return catalogs.find('[nombre="{0}"]'.format(catalog));
    }

    function getCatalogById(idCatalog) {
        return catalogs.find('[id="{0}"]'.format(idCatalog));
    }

    function getTextByValue(idCatalog, value) {
        var texto = catalogs.find("[id='{0}']".format(idCatalog)).find("[valor='{0}']".format(value)).attr("texto");

        return texto;
    }

})();