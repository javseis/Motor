/** @module Helper.Test */
/**
 * Modulo de prueba que permite cargar un xml de disco duro
 * y pasarlo al modulo inicial del parser
 *
 * (c) SAT 2013, Iv�n Gonz�lez
 */
/*global namespace:false, FormsBuilder:false, SAT: false, AppDeclaracionesSAT:false, ko:false, Base64:false */

"use strict";

(function() {
    namespace("Helper.Test", readXml, readJson, readPlantilla, readCatalogos, readDeclaracion, readPrecarga, readSubregimenes, readAreaGeografica);

    function readJson(fileName, callback) {
        if (SAT.Environment.settings('debug') && SAT.Environment.settings('typeapp') === 'web') {
            $.ajax({
                type: "GET",
                url: "json/{0}.json".format(fileName),
                dataType: "json",
                cache: false,
                success: callback,
                error: function(data, status, err) {
                    window.console.log(err);
                }
            });
        } else if (SAT.Environment.settings('debug') && SAT.Environment.settings('typeapp') === 'desktop') {
            var fs = require('fs');
            var path = require('path');
            var pJson = path.join(path.dirname(process.execPath), '{0}.json'.format(fileName));
            fs.readFile(pJson, 'utf8', function(err, data) {
                if (err) throw err;

                callback(data);
            });
        }
    }

    function readXml(fileName, callback) {
        if (SAT.Environment.settings('debug') && SAT.Environment.settings('typeapp') === 'web') {
            $.ajax({
                type: "GET",
                url: "xml/{0}.xml".format(fileName),
                dataType: "xml",
                cache: false,
                success: callback,
                error: function(data, status, err) {
                    window.console.log(err);
                }
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
        // readXml('formulario', callback);

        var xmlPlantilla = {};
        var Q = new QueuePromise();

        Q.append(function() {
            var self = this;
            readXml('Plantilla_Ayudas', function(data) {
                xmlPlantilla.ayudas = data;
                self.resolve();
            });
        });
        Q.append(function() {
            var self = this;
            readXml('Plantilla_Catalogos', function(data) {
                xmlPlantilla.catalogos = data;
                self.resolve();
            });
        });
        Q.append(function() {
            var self = this;
            readXml('Plantilla_Diagramacion', function(data) {
                xmlPlantilla.diagramacion = data;
                self.resolve();
            });
        });
        Q.append(function() {
            var self = this;
            readXml('Plantilla_ModeloDatos', function(data) {
                xmlPlantilla.modeloDatos = data;
                self.resolve();
            });
        });
        Q.append(function() {
            var self = this;
            readXml('Plantilla_Navegacion', function(data) {
                xmlPlantilla.navegacion = data;
                self.resolve();
            });
        });
        Q.append(function() {
            var self = this;
            readXml('Plantilla_Reglas', function(data) {
                xmlPlantilla.reglas = data;
                self.resolve();

                var xml = $($.parseXML('<?xml version="1.0" encoding="utf-8" ?><definicionFormulario></definicionFormulario>')).find('definicionFormulario');
                xml.append(xmlPlantilla.modeloDatos.childNodes);
                xml.append(xmlPlantilla.diagramacion.childNodes);
                xml.append(xmlPlantilla.navegacion.childNodes);
                xml.append(xmlPlantilla.reglas.childNodes);
                xml.append(xmlPlantilla.catalogos.childNodes);
                xml.append(xmlPlantilla.ayudas.childNodes);

                window.x = xml;
                callback(xml);
            });
        });
    }

    function readDeclaracion(callback) {
        readXml('declaracion', callback);
    }

    function readCatalogos(callback) {
        readXml('Plantilla_Catalogos', callback);
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