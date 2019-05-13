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
    namespace("Helper.Test", readJson, readJsonPlantilla);

    function readJson(fileName, callback) {
        if (SAT.Environment.settings('debug') && SAT.Environment.settings('typeapp') === 'web') {
            $.ajax({
                type: "GET",
                url: "json/{0}.json".format(fileName),
                dataType: "json",
                cache: false,
                success: callback,
                error: function(data, status, err) {
                    console.log(err);
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
                    console.log(err);
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

    function readJsonPlantilla(callback) {
        // readXml('formulario', callback);

        var jsonPlantilla = {};
        var Q = new QueuePromise();

        Q.append(function() {
            var self = this;
            readJson('Plantilla_Ayudas', function(data) {
                jsonPlantilla.ayudas = data;
                self.resolve();
            });
        });
        Q.append(function() {
            var self = this;
            readXml('Plantilla_Catalogos', function(data) {
                jsonPlantilla.catalogos = data;
                self.resolve();
            });
        });
        Q.append(function() {
            var self = this;
            readJson('Plantilla_Diagramacion', function(data) {
                jsonPlantilla.diagramacion = data;
                self.resolve();
            });
        });
        Q.append(function() {
            var self = this;
            readJson('Plantilla_ModeloDatos', function(data) {
                jsonPlantilla.modeloDatos = data;
                self.resolve();
            });
        });
        Q.append(function() {
            var self = this;
            readJson('Plantilla_Reglas', function(data) {
                jsonPlantilla.reglas = data;
                self.resolve();
            });
        });
        Q.append(function() {
            var self = this;
            readJson('Plantilla_Navegacion', function(data) {
                jsonPlantilla.navegacion = data;
                self.resolve();

                window.x = jsonPlantilla;
                callback(jsonPlantilla);
            });
        });
        /*
        Q.append(function() {
            var self = this;
            readJson('Plantilla_Reglas', function(data) {
                jsonPlantilla.reglas = data;
                self.resolve();
             
                window.x = xml;
                callback(jsonPlantilla);
            });
        });
        */
    }

})();