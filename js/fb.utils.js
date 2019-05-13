/** @module FormsBuilder.Utils */
/**
 * Modulo de ayuda que genera una cadena a partir de las propiedades
 *
 * (c) SAT 2013, Iv�n Gonz�lez
 */
/*global namespace:false, FormsBuilder:false, SAT: false, AppDeclaracionesSAT:false, ko:false, Base64:false */

"use strict";

(function() {
    namespace("FormsBuilder.Utils",
        getDbId, getDbId2, getFormatCurrency, getEntidad, getPropiedad,
        getPropiedadComplete, applyFormatCurrencyOnElement, convertValue, getDateMin,
        setDecimalsElement, getMs, hasAllQueueRules, getQueryString, jump, buscarCadena,
        obtenerParametros, extraerFunciones, extraerFuncion, cargarCatalogoFuncionesReglas,
        obtenerCatalogoFuncionesReglas, obtenerNombreFunciones, mostrarMensajeError,
        sanitizarValor, desSanitizarValor, procesarMensajeError, obtenerMensajeError);

    window.fbUtils = FormsBuilder.Utils;

    var PARENTESIS_ABRE = "(";
    var PARENTESIS_CIERRA = ")";
    var catalogoFuncionesReglas = [];
    var DateMin = new Date(-6847783200000);
    
    var ESC_MAP = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        "/": '&#x2F;',
    };

    function getFormatCurrency(maxDecimalsBeforeRound) {
        maxDecimalsBeforeRound = maxDecimalsBeforeRound || 0;
        return { roundToDecimalPlace: maxDecimalsBeforeRound, region: 'es-MX' };
    }

    function getDateMin() {
        return DateMin;
    }

    function convertValue(value, dataType) {
        var result = value === "null" || isDateEmpty(value) ? '' : value;
        if (IsNullOrEmpty(dataType)) {
            console.log("No se proporciono un tipo de dato");
        }
        try {
            if (!IsNullOrEmpty(value)) {
                switch (dataType) {
                    case "Booleano":
                        if (typeof value == "string") {
                            result = value.ToBoolean();
                        }
                        break;
                    case "FechaHora":
                        break;
                    case "Fecha":
                        var dateParsed = FECHA(value);
                        var isInvalidDate = dateParsed == getDateMin();
                        if (!isInvalidDate) {
                            result = dateParsed.toString("dd/MM/yyyy");
                        }
                        break;
                    case "Numerico":
                    case "Alfanumerico":
                    default:
                        if (value === "true" || value === "false") {
                            result = value.ToBoolean();
                        }
                        break;
                }
            }


        } catch (err) {
            console.log("Problema al convertir {0} al tipo {1}".format(value, dataType));
        }
        return result;
    }

    function applyFormatCurrencyOnElement(nodeElement, forceApply) {
        if (!nodeElement) {
            return;
        }
        var $nodeElement = $(nodeElement);
        forceApply = forceApply || false;
        var formatSoloNode = function($input) {
            var numTotalDecimales;
            if (forceApply) {
                numTotalDecimales = $input.attr("mostrarDecimales") || 0;
                $input.formatCurrency(getFormatCurrency(numTotalDecimales));
            } else {
                var infoPropiedad = undefined;
                try {
                    var idPropiedad = getPropiedad($input.attr("view-model"));
                    var searchSymbol = "${0}".format(idPropiedad);
                    infoPropiedad = FormsBuilder.ViewModel.getFieldsForExprs()[searchSymbol];
                } catch (err) {
                    //console.log("Element don't have viewModelId");
                }
                if ((infoPropiedad && infoPropiedad['tipoDatos'] === 'Numerico') || $nodeElement.hasClass('currency')) {
                    if (!$input.is(":focus")) {
                        $input.each(function() {
                            var control = $(this);
                            numTotalDecimales = control.attr("mostrarDecimales") || 0;

                            if (control.find("span[data-bind]").length > 0) {
                                control.find("span[data-bind]").formatCurrency(getFormatCurrency(numTotalDecimales));
                            } else {
                                control.formatCurrency(getFormatCurrency(numTotalDecimales));
                            }
                        });
                    }
                }
            }

        };
        var isSoloNode = $nodeElement.children().not("span").length == 0;
        if (isSoloNode) {
            formatSoloNode($nodeElement);
        } else {
            var $inputs = $nodeElement.find(".currency");
            $inputs.each(function(index, node) {
                var $node = $(node);
                formatSoloNode($node, true);
            });
        }
    }

    function getDbId(element) {
        var idEntidad = element.idEntidad;
        var idPropiedad = element.idPropiedad;

        return "E{0}P{1}".format(idEntidad, idPropiedad);
    }

    function getDbId2(element) {
        var idEntidad = element.idEntidadPropiedad;
        var idPropiedad = element.idPropiedad;

        return "E{0}P{1}".format(idEntidad, idPropiedad);
    }

    function getEntidad(value) {
        var idEntidad = undefined;
        if (value) {
            idEntidad = (value.split('P')[0]).replace('E', '');
        }
        return idEntidad;
    }

    function getPropiedad(value) {
        var idPropiedad = undefined;
        if (value) {
            var tempString = value.substring(value.indexOf('P') + 1, value.length);
            idPropiedad = (tempString.split('_').length > 1 ? tempString.split('_')[0] : tempString);
        }
        return idPropiedad;
    }

    function getPropiedadComplete(value) {
        var idPropiedad = undefined;
        if (value) {
            var tempString = value.substring(value.indexOf('P') + 1, value.length);
            idPropiedad = tempString;
        }
        return idPropiedad;
    }

    function setDecimalsElement() {
        if (window.lastElement) {
            if (window.lastElement.hasClass('currency') &&
                window.lastElement.attr('view-model') !== $(document.activeElement).attr('view-model')) {
                if (window.lastElement.val() !== '') {
                    fbUtils.applyFormatCurrencyOnElement(window.lastElement, true);
                }
            }
        }
    }

    function getMs() {
        return navigator.userAgent.indexOf("MSIE") > -1 ? 150 : 300;
    }

    function hasAllQueueRules() {
        var rethasRules = false;

        if (!SAT.Environment.settings('isDAS')) {
            if (FormsBuilder.ViewModel.getLenQueueRules() > 0 ||
                FormsBuilder.Modules.getCgLenQueueRules() > 0) {
                rethasRules = true;
            }
        } else {
            if (FormsBuilder.ViewModel.getLenQueueRules() > 0) {
                rethasRules = true;
            }
        }

        return rethasRules;
    }

    function getQueryString() {
        var queries = {};
        var querystring = document.location.search.substr(1);
        var parameters = Base64.decode(querystring);

        if (parameters.indexOf('&') > -1) {
            $.each(parameters.split('&'), function(c, q) {
                var i = q.split('=');
                queries[i[0].toString()] = i[1].toString();
            });
        }

        return queries;
    }

    function jump(h) {
        var top = h.offsetTop;
        window.scrollTo(0, top);
    }

    function cargarCatalogoFuncionesReglas() {
        $.getJSON("json/fb.rulesfunctions.json").done(function(json) {
            catalogoFuncionesReglas = json.functions;
        });
    }

    function obtenerCatalogoFuncionesReglas() {
        return catalogoFuncionesReglas;
    }

    function buscarCadena(buscar, cadena) {
        var indices = [];
        var indice = 0;
        var longitud = 0;

        while (indice > -1) {
            indice = cadena.indexOf(buscar, indice + longitud);

            if (indice > -1) {
                indices.push(indice);
                longitud = buscar.length;
            }
        }

        return indices;
    }

    function obtenerParametros(nombreFuncion, cadena) {
        var parametros = [];
        var indices = buscarCadena(nombreFuncion, cadena);

        for (var i = 0; i < indices.length; i++) {
            var indice = indices[i];
            var inicioParametros = cadena.indexOf("(", indice) + 1;
            var finParametros = cadena.indexOf(")", indice);
            var parametrosStr = cadena.substring(inicioParametros, finParametros);

            parametros.push(parametrosStr.replace(" ", "").split(","));
        }

        return parametros;
    }

    function obtenerNombreFunciones(expresion) {
        var catalogo = obtenerCatalogoFuncionesReglas();
        var nombres = [];
        var expresion2 = expresion.replace(/(==)/g, "-EQ-").replace(/(!=)/g, "-DI-").replace(/(<=)/g, "-MEI-").replace(/(>=)/g, "-MAI-");
        var limpiar = expresion2.indexOf("=") >= 0 ? expresion2.split("=")[1].split(PARENTESIS_ABRE) : expresion2.split(PARENTESIS_ABRE);
        var matchSome = function(elemento, index) {
            return elemento == this.parametro;
        };
        var matchOperadores = function(nombre) {
            var parametros = [];

            if (nombre.match(/[<]/)) {
                parametros = nombre.split("<");
            } else if (nombre.match(/[>]/)) {
                parametros = nombre.split(">");
            } else if (nombre.match(/(-MEI-)/)) {
                parametros = nombre.split("-MEI-");
            } else if (nombre.match(/(-MAI-)/)) {
                parametros = nombre.split("-MAI-");
            } else if (nombre.match(/(-DI-)/)) {
                parametros = nombre.split("-DI-");
            } else if (nombre.match(/(-EQ-)/)) {
                parametros = nombre.split("-EQ-");
            } else if (nombre.match(/[+]/)) {
                parametros = nombre.split("+");
            } else if (nombre.match(/[-]/)) {
                parametros = nombre.split("-");
            } else if (nombre.match(/[*]/)) {
                parametros = nombre.split("*");
            } else if (nombre.match(/[/]/)) {
                parametros = nombre.split("/");
            }

            for (var i = 0; i < parametros.length; i++) {
                var parametro = parametros[i];
                nombre = "";
                var existeEnCatalogo = catalogo.some(matchSome, { "parametro": parametro });

                if (existeEnCatalogo) {
                    nombre = parametro;
                    break;
                }
            }

            return nombre;
        };


        for (var i = 0; i < limpiar.length; i++) {
            var nombre = limpiar[i];
            var existeEnCatalogo = catalogo.some(matchSome, { "parametro": nombre });
            if (nombre.match(/[,]/)) {
                var parametros = nombre.split(",");

                var parametro = parametros[parametros.length - 1];

                if (parametro.match(/[<]/) || parametro.match(/[>]/) ||
                    parametro.match(/(-MEI-)/) || parametro.match(/(-MAI-)/) ||
                    parametro.match(/(-DI-)/) || parametro.match(/(-EQ-)/) ||
                    parametro.match(/[+-/*]/)) {
                    nombre = matchOperadores(parametro);
                } else {
                    existeEnCatalogo = catalogo.some(matchSome, { "parametro": parametro });

                    if (existeEnCatalogo) {
                        nombre = parametro;
                    } else {
                        nombre = "";
                    }
                }
            } else if (nombre.match(/[<]/) || nombre.match(/[>]/) ||
                nombre.match(/(-MEI-)/) || nombre.match(/(-MAI-)/) ||
                nombre.match(/(-DI-)/) || nombre.match(/(-EQ-)/) ||
                nombre.match(/[\+\-\*\/]/)) {
                nombre = matchOperadores(nombre);
            } else if (nombre.match(/[!$+*=;\/]/) || !existeEnCatalogo) {
                nombre = "";
            }

            nombres.push(nombre);
        }

        return nombres;
    }

    function extraerFunciones(expresion) {
        var funciones = [];
        var nombreFunciones = obtenerNombreFunciones(expresion);
        var expresion2 = expresion.replace(/(==)/g, "-EQ-").replace(/(!=)/g, "-DI-").replace(/(<=)/g, "-MEI-").replace(/(>=)/g, "-MAI-");

        if (expresion2.indexOf("=") >= 0) {
            expresion2 = expresion2.split("=")[1];
        }

        var signosAbre = buscarCadena(PARENTESIS_ABRE, expresion2);
        var signosCierra = buscarCadena(PARENTESIS_CIERRA, expresion2);

        if (signosAbre.length > 0) {
            for (var i = (signosAbre.length - 1); i >= 0; i--) {
                var signoAbre = signosAbre[i];
                var nuevaExpresion = expresion2.substring(signoAbre);
                var signoCierra = nuevaExpresion.indexOf(PARENTESIS_CIERRA);
                var nombre = nombreFunciones[i];
                var funcion = nombre + nuevaExpresion.substring(0, signoCierra + 1);
                var ultimaCoincidencia = expresion2.lastIndexOf(funcion);

                funciones.push(funcion.replace(/[\]]/g, ")").replace(/(-EQ-)/g, "==").replace(/(-DI-)/g, "!=").replace(/(-MEI-)/g, "<=").replace(/(-MAI-)/g, ">="));
                expresion2 = expresion2.substr(0, ultimaCoincidencia) + funcion.substr(0, funcion.length - 1) + "]" + expresion2.substr(ultimaCoincidencia + funcion.length);
            }
        } else {
            funciones.push(expresion);
        }

        return funciones;
    }

    function extraerFuncion(nombreFuncion, cadena) {
        var funciones = extraerFunciones(cadena);

        var funcion = funciones.filter(function(fn) {
            return fn.indexOf(nombreFuncion + PARENTESIS_ABRE) === 0;
        });

        return funcion;
    }

    function mostrarMensajeError(mensaje) {
        var modalError = $("#modal-error");

        if (mensaje) {
            modalError.find(".modal-body").html(mensaje);
            modalError.modal("show");
        }
    }

    function sanitizarValor(valor) {
        if (typeof valor === "string") {
            valor = valor.replace(/[<>/]/g, function (c) {
                return ESC_MAP[c];
            });
        }

        return valor;
    }

    function desSanitizarValor(valor) {
        if (typeof valor === "string") {
            valor = $("<div>").html(valor).text();
        }

        return valor;
    }

    function obtenerMensajeError(idRegla) {
        var mensaje = "";
        var reglas = FormsBuilder.XMLForm.getReglas();

        if (!IsNullOrEmpty(idRegla) && reglas && reglas.reglas && reglas.reglas.regla) {
            mensaje = procesarMensajeError(Enumerable.From(reglas.reglas.regla).Where("$.id === '{0}'".format(idRegla)).Select("$.mensajeError").FirstOrDefault(""));
        }

        return mensaje;
    }

    function procesarMensajeError(mensaje) {
        //var xmlCopy = FormsBuilder.XMLForm.getCopy();
        var entidadesJson = FormsBuilder.XMLForm.getEntidades();
        var exprs = mensaje.match(/\B#\w+[0-9|A-Z^_]+/igm);
        if (exprs !== null) {
            $.each(exprs, function (k, expr) {
                var propiedad = Enumerable.From(entidadesJson).SelectMany("$.propiedades.propiedad").Where("$.id == '{0}'".format(expr.substring(1, expr.length))).FirstOrDefault();
                //$(xmlCopy).find('modeloDatos propiedad[id="{0}"]'.format(expr.substring(1, expr.length)));
                if (propiedad) {
                    var tituloCorto = Enumerable.From(propiedad.atributos.atributo).Where("$.nombre='TituloCorto'").Select("$.valor").FirstOrDefault();
                    //propiedad.find('atributo[nombre="TituloCorto"]').attr('valor');
                    mensaje = mensaje.replace(expr, "<b>{0}</b>".format(tituloCorto || ""));
                }
            });
        }

        exprs = mensaje.match(/\{([^{}]+)\}/igm);
        var corchetes = false;
        if (exprs === null) {
            exprs = mensaje.match(/\[.*]/igm);
            corchetes = true;
        }

        if (exprs !== null) {
            var objDictionary = {};
            var exprCalculoTemporal;
            var exprCalculo;
            $.each(exprs, function (k, expr) {
                exprCalculoTemporal = expr;
                exprCalculo = (corchetes === true) ? expr : expr.replace(/\[|]/igm, "");

                var searchSymbols = expr.match(/[$](\w+|[0-9^_]+)/igm);
                if (searchSymbols !== null) {
                    $.each(searchSymbols, function (k, searchSymbol) {
                        var matchSymbol = new RegExp("\\" + searchSymbol + "(?![A-Z]|[0-9])", "igm");
                        objDictionary[searchSymbol] = searchSymbol;
                    });
                }

                var result = FormsBuilder.Runtime.evaluate(exprCalculo.replace(/\{|\}/igm, ''));

                var notNumber = mensaje.substr(mensaje.indexOf(exprCalculoTemporal) - 1, 1) === '!';
                if (notNumber) exprCalculoTemporal = '!' + exprCalculoTemporal;

                if (ESNUMERO(result) && !notNumber) {
                    var fieldCurrency = $("<span class='currency' mostrarDecimales='2'>{0}</span>".format(result));
                    fbUtils.applyFormatCurrencyOnElement(fieldCurrency, true);
                    result = fieldCurrency.html();
                }
                mensaje = mensaje.replace(exprCalculoTemporal, result);
            });
        }

        return mensaje;
    }
})();