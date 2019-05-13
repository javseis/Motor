/** @module Helper.Test */
/**
 * Modulo de prueba que permite cargar un xml de disco duro
 * y pasarlo al modulo inicial del parser
 *
 * (c) SAT 2013, Iván González
 */
/*global namespace:false, FormsBuilder:false, SAT: false, AppDeclaracionesSAT:false, ko:false, Base64:false */

"use strict";

(function() {
    namespace("Helper.Test", readXml, readPlantilla, readDeclaracion, readPrecarga, readSubregimenes, readAreaGeografica);

    function readXml(fileName, callback) {
        if (SAT.Environment.settings('debug') && SAT.Environment.settings('typeapp') === 'web') {
            $.ajax({
                type: "GET",
                url: "xml/{0}.xml".format(fileName),
                dataType: "xml",
                cache: false,
                success: callback
            });
        } else if (SAT.Environment.settings('debug') && SAT.Environment.settings('typeapp') === 'desktop') {
            var fs = require('fs');
            var path = require('path');
            var pXml = path.join(path.dirname(process.execPath), '{0}.xml'.format(fileName));
            fs.readFile(pXml, 'utf8', function(err, data) {
                if (err) throw err;

                var xmlDoc = $.parseXML(data);
                callback(xmlDoc);
            });
        }
    }

    function readPlantilla(callback) {
        readXml('plantillaDAS', callback);
    }

    function readDeclaracion(callback) {
        readXml('declaracion', callback);
    }

    function readPrecarga(callback) {
        readXml('precarga', callback);
    }

    function readSubregimenes(callback) {
        readXml('Catalogo_SubRegimen', callback);
    }

    function readAreaGeografica(callback) {
        readXml('Catalogo_AreaGeografica', callback);
    }
})();
