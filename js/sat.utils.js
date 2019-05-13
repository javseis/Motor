/* eslint-disable no-unused-vars */
/* global module:false, require:false */

(function(root, factory) {
    "use strict";
    if (typeof exports === "object") //::: Node
        module.exports = factory(require("jquery"));
    else root.utils = factory(root.jQuery); //::: Browser
}(this, function($) {
    "use strict";

    //:: PLUGINS VALIDATION
    if (!$) throw new Error("Se requiere que JQuery sea cargado primero.");

    //:: PRIVATE FUNCTIONS
    function mergeJSON(thisObject, withObejct) {
        return $.extend(thisObject, withObejct);
    }

    //:: OPTIONS CONSTANTS
    var OPTIONS_QUERYSTRING = {
        isBase64: true
    };

    //:: PROTOTYPE FUNCTIONS
    var PROTO = {
        model: {
            findProppertyId: function(xml, property) {
                var obj = PROTO.xml.toJSON(xml);
                var property;
                obj.modeloDatos.entidad.filter(function(entidad) {
                    var exit = false;
                    if (entidad.hasOwnProperty("propiedad")) {
                        entidad.propiedad.filter(function(propiedad) {
                            if (propiedad.attributes.id === property) {
                                property = propiedad;
                                exit = true;
                            }
                            return propiedad.attributes.id === property;
                        })[0];
                    } else return;
                    if (exit) return;
                });
                return property;
            }
        },
        xml: {
            toJSON: function(xml) {
                if (typeof xml === "string") {
                    var parser = new DOMParser();
                    xml = parser.parseFromString(xml, "text/xml");
                }
                var obj = {};
                if (xml.nodeType == 1) {
                    if (xml.attributes.length > 0) {
                        obj["attributes"] = {};
                        for (var j = 0; j < xml.attributes.length; j++) {
                            var attribute = xml.attributes.item(j);
                            obj["attributes"][attribute.nodeName] = attribute.nodeValue;
                        }
                    }
                } else if (xml.nodeType == 3) {
                    obj = xml.nodeValue;
                }
                if (xml.hasChildNodes()) {
                    for (var i = 0; i < xml.childNodes.length; i++) {
                        var item = xml.childNodes.item(i);
                        var nodeName = item.nodeName === "#text" ? "text" : item.nodeName;
                        if (typeof(obj[nodeName]) == "undefined") {
                            obj[nodeName] = this.toJSON(item);
                        } else {
                            if (typeof(obj[nodeName].push) == "undefined") {
                                var old = obj[nodeName];
                                obj[nodeName] = [];
                                obj[nodeName].push(old);
                            }
                            obj[nodeName].push(this.toJSON(item));
                        }
                    }
                }
                return obj;
            }
        },
        queryString: {
            toJSON: function(opciones) {
                opciones = mergeJSON(OPTIONS_QUERYSTRING, opciones);
                var cadenaConsulta = opciones.isBase64 ? Base64.decode(document.location.search.substr(1)) : location.search.slice(1);
                var parametrosPares = cadenaConsulta.split("&");
                var objetoJSON = {};
                parametrosPares.forEach(function(parametroPar) {
                    parametroPar = parametroPar.split("=");
                    var valor = decodeURIComponent(parametroPar[1] || "");
                    objetoJSON[parametroPar[0]] = valor.toLowerCase() === "true" ? true : valor.toLowerCase() === "false" ? false : valor;
                });
                return JSON.parse(JSON.stringify(objetoJSON));
            },
            decode: function() {
                return Base64.decode(document.location.search.substr(1));
            },
            encode: function(string) {
                return Base64.encode(string);
            },
            fromJSON: function(jsonParamaters, opciones) {
                opciones = mergeJSON(OPTIONS_QUERYSTRING, opciones);
                return opciones.isBase64 ? Base64.encode($.param(jsonParamaters).replace(/\+/g, " ")) : $.param(jsonParamaters).replace(/\+/g, " ");
            },
            getUrlToFormulario: function() {
                return "/Declaracion/Formulario?" + PROTO.queryString.fromJSON(PROTO.json.mask(utils.queryString.toJSON(), "areaGeografica,ejercicio,fechaDeCausacion,periodo,periodoDesc,regimen,subRegimen,periodicidad,tipoComplementaria,tipoDeclaracion,tipoDeclaracionDesc,tipoPersona,tipoComplementariaDesc,guidTemporal,numeroOperacionVigente,guidDeclaracionVigente"));
            },
            get: function() {
                return document.location.search.substr(1);
            }
        },
        url: {
            getPageName: function(stepPath) {
                return window.location.pathname.split("/")[typeof stepPath === "undefined" ? 2 : stepPath];
            },
            currentPageIs: function(pageName) {
                return PROTO.url.getPageName().toLowerCase() == pageName.toLowerCase();
            }
        },
        number: {
            toCurrencyFormat: function(number, c, d, t) {
                var n = number,
                    c = isNaN(c = Math.abs(c)) ? 2 : c,
                    d = d == undefined ? "." : d,
                    t = t == undefined ? "," : t,
                    s = n < 0 ? "-" : "",
                    i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "",
                    j = (j = i.length) > 3 ? j % 3 : 0;
                return "$" + s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
            }
        },
        json: {
            mask: function(jsonObject, mask) {
                var objectResult = {};
                var masks = mask.split(",");
                masks.forEach(function(property) {
                    if (typeof jsonObject[property] !== "undefined") {
                        objectResult[property] = jsonObject[property];
                    }
                });
                return objectResult;
            }
        },
        bool: {
            parse: function(text) {
                var text = "" + text;
                return text.trim().toLowerCase() == "true" ? true : text.trim().toLowerCase() == "false" ? false : false;
            }
        }
    };

    return PROTO;
}));


/** @module SAT.Utils */
/**
 * Modulo que sobreescribe el prototipo de cadenas que agrega
 * funciones
 *
 * (c) SAT 2013, Iván González
 */
/*global namespace:false, FormsBuilder:false, AppDeclaracionesSAT:false, Base64:false */

"use strict";

var findByAction = function(action) {
    if (typeof action !== "function")
        return;

    var indexFinded;
    this.some(function(element, index) {
        if (action(element) === true) {
            indexFinded = index;
            return true;
        }
        return false;
    });

    return this[indexFinded];
};

var findByProperty = function(action) {
    if (typeof action !== "function")
        return;

    var indexFinded;
    var objProps = Object.getOwnPropertyNames(this);

    objProps.some(function(element) {
        if (action(element) === true) {
            indexFinded = element;
            return true;
        }
        return false;
    });

    return this[indexFinded];
};

//string format equals to c#
String.prototype.format = function() {

    var pattern = /\{\d+\}/g;
    var args = arguments;
    return this.replace(pattern, function(capture) { return args[capture.match(/\d+/)]; });

};

//- get bool from string true/false word
String.prototype.ToBoolean = function() {
    return (/^true|1$/i).test(this);
};

String.prototype.trim = function() {
    /// <summary>Elimina los espacios vacíos del String al inicio y al final del mismo</summary>
    return this.replace(/^\s*/, "").replace(/\s*$/, "");
};

String.prototype.trimAll = function() {
    /// <summary>Elimina los espacios vacíos del String al inicio y al final del mismo</summary>
    return this.replace(/\s/g, "");
};

// Function IsNullOrEmpty
// Regresa verdadero cuando el objeto es nulo o una cadena vacía.
function IsNullOrEmpty(object) {
    if (typeof(object) === "undefined" || object === null)
        return true;
    if (object === "")
        return true;
    return false;
}

// Function IsNullOrEmpty
// Regresa verdadero cuando el objeto es nulo o una cadena vacía.
function IsNullOrEmptyWhite(object) {
    if (typeof(object) === "undefined" || object === null)
        return true;
    if (object === "")
        return true;
    if (jQuery.trim(object) === "")
        return true;
    return false;
}

// Function IsNullOrEmptyOrZero
// Regresa verdadero cuando el objeto es nulo o una cadena vacía.
function IsNullOrEmptyOrZero(object) {
    if (object === undefined)
        return true;
    if (object === "")
        return true;
    if (object === "0")
        return true;
    if (object === 0)
        return true;
    return false;
}

//Hierarchy of prototypes
function extend(destination, source) {
    for (var k in source) {
        if (source.hasOwnProperty(k)) {
            destination[k] = source[k];
        }
    }
    return destination;
}

// Fix for IE
function preventDefaultEvent(event) {
    if (event.preventDefault) {
        event.preventDefault();
    } else {
        event.returnValue = false;
    }
}

function StringBuilder( /* str, str, str */ ) {
    /// <summary>Cadena mutable</summary>
    this._array = [];
    this._index = 0;

    this.Append = function( /* str, str, str, ... */ ) {
        /// <summary>Agrega un string a la cadena mutable</summary>
        /// <param type="String">Cadena que se concatena </param>

        for (var i = 0; i < arguments.length; i++) {
            this._array[this._index] = arguments[i];
            this._index++;
        }
    };

    this.Append.apply(this, arguments);

    this.toString = function() {
        /// <summary>Regresa el string que contiene la cadena mutable</summary>
        return this._array.join("");
    };

}

// Fix to Internet Explorer 9
window.console = window.console || (function() {
    var log = function() {};

    return { log: log };
})();

// requestAnimationFrame() shim by Paul Irish
window.requestAnimFrame = (function() {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function( /* function */ callback) {
            window.setTimeout(callback, 1000 / 60);
        };
})();

// Generate a UUID value
function S4() {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
}

function guid() {
    return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
}

function isValidDate(dateValue) {
    var pattern = new RegExp(/^(((0[1-9]|[12]\d|3[01])\/(0[13578]|1[02])\/((19|[2-9]\d)\d{2}))|((0[1-9]|[12]\d|30)\/(0[13456789]|1[012])\/((19|[2-9]\d)\d{2}))|((0[1-9]|1\d|2[0-8])\/02\/((19|[2-9]\d)\d{2}))|(29\/02\/((1[6-9]|[2-9]\d)(0[48]|[2468][048]|[13579][26])|((16|[2468][048]|[3579][26])00))))$/g);
    return pattern.test(dateValue) && !IsNullOrEmpty(dateValue);
}

var minDecimalPrecision = 5;

function toPrecision(value, decimalPrecision) {
    if (IsNullOrEmptyWhite(value) || typeof value !== "number") {
        console.error("No se especifico un valor valido. ToPrecision Method");
    }
    var precision;
    decimalPrecision = decimalPrecision || minDecimalPrecision;
    var result = value;
    var characters = value.toString();
    var indexPoint = characters.indexOf(".");
    var decimals = characters.substr(indexPoint + 1);
    var integer = characters.substr(0, indexPoint);
    if (decimals.length > 0) {
        if (decimals.length < decimalPrecision) {
            decimalPrecision = decimals.length;
        }
        var integerPrecision = integer.length;
        precision = integerPrecision + decimalPrecision;
        if (precision > 21) {
            //TODO: Do something cool
        }
        result = (value).toPrecision(precision);
    }
    return result;
}

function dateDiff(date1, date2) {
    var d = date1,
        now = date2;
    var years = now.getFullYear() - d.getFullYear();
    d.setFullYear(d.getFullYear() + years);
    if (d > now) {
        years--;
        d.setFullYear(d.getFullYear() - 1);
    }
    //var days = (now.getTime() - d.getTime()) / (3600 * 24 * 1000);
    // return years + days / (isLeapYear(now.getFullYear()) ? 366 : 365);
    return years;
}

function isLeapYear(year) {
    var d = new Date(year, 1, 28);
    d.setDate(d.getDate() + 1);
    return d.getMonth() == 1;
}

function validateRfc(rfc) {
    var _rfc_pattern_pm = "^(([A-ZÑ&]{3})([0-9]{2})([0][13578]|[1][02])(([0][1-9]|[12][\\d])|[3][01])([A-Z0-9]{3}))|(([A-ZÑ&]{3})([0-9]{2})([0][13456789]|[1][012])(([0][1-9]|[12][\\d])|[3][0])([A-Z0-9]{3}))|(([A-ZÑ&]{3})([02468][048]|[13579][26])[0][2]([0][1-9]|[12][\\d])([A-Z0-9]{3}))|(([A-ZÑ&]{3})([0-9]{2})[0][2]([0][1-9]|[1][0-9]|[2][0-8])([A-Z0-9]{3}))$",
        _rfc_pattern_pf = "^(([A-ZÑ&]{4})([0-9]{2})([0][13578]|[1][02])(([0][1-9]|[12][\\d])|[3][01])([A-Z0-9]{3}))|(([A-ZÑ&]{4})([0-9]{2})([0][13456789]|[1][012])(([0][1-9]|[12][\\d])|[3][0])([A-Z0-9]{3}))|(([A-ZÑ&]{4})([02468][048]|[13579][26])[0][2]([0][1-9]|[12][\\d])([A-Z0-9]{3}))|(([A-ZÑ&]{4})([0-9]{2})[0][2]([0][1-9]|[1][0-9]|[2][0-8])([A-Z0-9]{3}))$";
    return rfc.match(_rfc_pattern_pm) || rfc.match(_rfc_pattern_pf) ? !0 : !1;
}

String.prototype.endsWith = function(searchString, position) {
    var subjectString = this.toString();
    if (typeof position !== "number" || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
        position = subjectString.length;
    }
    position -= searchString.length;
    var lastIndex = subjectString.indexOf(searchString, position);
    return lastIndex !== -1 && lastIndex === position;
};

String.prototype.startsWith = function(searchString, position) {
    position = position || 0;
    return this.indexOf(searchString, position) === position;
};

String.prototype.replaceAll = function(searchString, replacement) {
    var target = this;
    return target.split(searchString).join(replacement);
};