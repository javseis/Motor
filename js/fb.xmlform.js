/** @module FormsBuilder.XMLForm */
/**
 * Modulo para el render de formularios que crear una caja de texto
 *
 * (c) SAT 2013, Iván González
 */
/*global namespace:false, FormsBuilder:false */

"use strict";

(function() {
    namespace("FormsBuilder.XMLForm", init, getCopy, copyPlantillas, reconstructXml, copyDeclaracion, getAyudas,
        getCopyDeclaracion, copyPrecarga, getCopyPrecarga, initJson, getEntidades, getReglas, getControles,
        getNavegacion, getCatalogos, buscarEntidadPorIdPropiedad, getReglasEjecutarPosterior, getReglasEjecutarSiempre,
        obtenerEntidadPorId, obtenerPropiedadPorId, obtenerReglasPorIdPropiedad, obtenerPropiedadMapeoPorClave,
        obtenerPropiedadesMapeo);
    window.fbXmlForm = FormsBuilder.XMLForm;

    var xmlForm;
    var xmlFormDeclaracion;
    var xmlFormPrecarga;
    var xmlPlantilla;

    var ayudasJson;
    var entidadesJson;
    var reglasJson;
    var controlesJson;
    var navegacionJson;
    var catalogosXml;

    function initJson(jsonDoc) {
        entidadesJson = jsonDoc.modeloDatos;
        reglasJson = jsonDoc.reglas;
        controlesJson = jsonDoc.diagramacion;
        navegacionJson = jsonDoc.navegacion;
        ayudasJson = jsonDoc.ayudas;
        catalogosXml = jsonDoc.catalogos;

        limpiarDefinicionReglas();
    }

    function limpiarDefinicionReglas() {
        if (reglasJson) {
            for (var i = 0; i < reglasJson.length; i++) {
                reglasJson[i].definicion = reglasJson[i].definicion.trim();
            }
        }
    }

    function getAyudas() {
        return ayudasJson;
    }

    function getControles() {
        return controlesJson;
    }

    function getNavegacion() {
        return navegacionJson;
    }

    function getEntidades() {
        return entidadesJson;
    }

    function getReglas() {
        return reglasJson;
    }

    function getCatalogos() {
        return $(catalogosXml);
    }

    function getReglasEjecutarPosterior() {
        var REGLA_TIPO = ["Calculo", "Condicional Excluyente"];
        var reglasRetardadas = Enumerable.From(reglasJson.reglas.regla).Where(function(regla) {
            return (REGLA_TIPO.indexOf(regla.tipoRegla) >= 0 && regla.participaEnGrid === true);
        }).ToArray();

        return reglasRetardadas;
    }

    function getReglasEjecutarSiempre() {
        var REGLA_TIPO = ["Calculo", "Condicional Excluyente"];
        var reglasEjecutarSiempre = Enumerable.From(reglasJson.reglas.regla).Where(function(regla) {
            return !(REGLA_TIPO.indexOf(regla.tipoRegla) >= 0 && regla.participaEnGrid === true);
        }).ToArray();

        return reglasEjecutarSiempre;
    }

    function init(xmlDoc) {
        xmlForm = xmlDoc;
    }

    function copyDeclaracion(xmlDoc) {
        xmlFormDeclaracion = xmlDoc;
    }

    function copyPlantillas(data) {
        xmlPlantilla = data;
    }

    function reconstructXml() {
        var xml = $($.parseXML('<?xml version="1.0" encoding="utf-8" ?><definicionFormulario></definicionFormulario>')).find("definicionFormulario");
        xml.append($.parseXML(xmlPlantilla.modeloDatos).childNodes);
        xml.append($.parseXML(xmlPlantilla.diagramacion).childNodes);
        xml.append($.parseXML(xmlPlantilla.navegacion).childNodes);
        xml.append($.parseXML(xmlPlantilla.reglas).childNodes);
        xml.append($.parseXML(xmlPlantilla.catalogos).childNodes);
        xml.append($.parseXML(xmlPlantilla.ayudas).childNodes);

        return xml;
    }

    function getCopy() {
        return $(xmlForm);
    }

    function getCopyDeclaracion() {
        return $(xmlFormDeclaracion);
    }

    function copyPrecarga(xmlDoc) {
        xmlFormPrecarga = xmlDoc;
    }

    function getCopyPrecarga() {
        return (xmlFormPrecarga !== undefined ? $(xmlFormPrecarga) : xmlFormPrecarga);
    }

    function buscarEntidadPorIdPropiedad(idPropiedad) {
        var entidadBuscada;

        if (idPropiedad) {
            for (var i = 0; i < entidadesJson.length; i++) {
                var entidad = entidadesJson[i];

                if (entidad.propiedades) {
                    var existePropiedad = Enumerable.From(entidad.propiedades.propiedad).Any("$.id == '{0}'".format(idPropiedad));

                    if (existePropiedad) {
                        entidadBuscada = entidad;
                        break;
                    }
                }
            }
        }

        return entidadBuscada;
    }

    function obtenerEntidadPorId(idEntidad) {
        var entidad = Enumerable.From(entidadesJson).Where("$.id == '{0}'".format(idEntidad)).FirstOrDefault();

        return entidad;
    }

    function obtenerPropiedadPorId(idEntidad, idPropiedad) {
        var propiedad;
        if (idEntidad) {
            var entidad = obtenerEntidadPorId(idEntidad);

            if (entidad) {
                propiedad = Enumerable.From(entidad.propiedades.propiedad).Where("$.id == '{0}'".format(idPropiedad)).FirstOrDefault();
            }
        } else {
            var propiedades = Enumerable.From(entidadesJson).SelectMany("$.propiedades.propiedad").ToArray();
            propiedad = Enumerable.From(propiedades).Where("$.id == '{0}'".format(idPropiedad)).FirstOrDefault();
        }

        return propiedad;
    }

    function obtenerReglasPorIdPropiedad(idPropiedad, tipo) {
        var reglasPopiedad = [];
        if (idPropiedad) {
            var idReglasPopiedad = Enumerable.From(reglasJson.propiedades.propiedad).Where("$.idPropiedad == '{0}' && $.ejecutarRegla == '1'".format(idPropiedad)).Select("$.idRegla").ToArray();

            reglasPopiedad = Enumerable.From(reglasJson.reglas.regla).Where(function(regla) {
                return Enumerable.From(idReglasPopiedad).Any("$ == '{0}'".format(regla.id));
            }).ToArray();
        }

        if (reglasPopiedad.length > 0 && tipo) {
            reglasPopiedad = Enumerable.From(reglasPopiedad).Where("$.tipoRegla == '{0}'".format(tipo)).ToArray();
        }

        return reglasPopiedad;
    }

    function obtenerPropiedadesMapeo(idEntidad) {
        var propiedadesMapeo = [];
        var propiedadesEntidad = Enumerable.From(entidadesJson).Where("$.id == '{0}'".format(idEntidad)).Select("$.propiedades.propiedad").FirstOrDefault();

        if (propiedadesEntidad && propiedadesEntidad.length > 0) {
            propiedadesEntidad.forEach(function (propiedad) {
                var propiedadMapeo = Enumerable.From(propiedad.atributos.atributo).Where("$.nombre === 'PropiedadMapeo'").FirstOrDefault();

                if (propiedadMapeo && !IsNullOrEmptyWhite(propiedadMapeo.valor)) {
                    propiedadesMapeo.push(
                        {
                            "idEntidad": idEntidad,
                            "idPropiedad": propiedad.id,
                            "propiedadMapeo": propiedadMapeo.valor
                        }
                    );
                }
            });
        }

        return propiedadesMapeo;
    }

    function obtenerPropiedadMapeoPorClave(idEntidad, claveMapeo) {
        var propiedadMapeo;

        if (!IsNullOrEmptyWhite(idEntidad) && !IsNullOrEmptyWhite(claveMapeo)) {
            var propiedadesMapeo = obtenerPropiedadesMapeo(idEntidad);

            propiedadMapeo = Enumerable.From(propiedadesMapeo).Where("$.propiedadMapeo == '{0}'".format(claveMapeo)).FirstOrDefault();
        }

        return propiedadMapeo;
    }
})();