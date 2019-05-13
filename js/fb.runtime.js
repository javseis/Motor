/* eslint-disable no-unused-vars */
/** @module FormsBuilder.Runtime */
/**
 * Modulo que realiza las evaluaciones de expresiones
 *
 * (c) SAT 2013, Iván González
 */
/*global namespace:false, FormsBuilder:false, SAT: false, AppDeclaracionesSAT:false */

"use strict";

(function () {
    namespace("FormsBuilder.Runtime", init, runInitRules, runSubregimenesRules, initFormulario, getRules, evaluate, evaluateGrid);
    window.fbRuntime = FormsBuilder.Runtime;

    var rules = {};

    function getRules() {
        return rules;
    }

    function init(rulesJson, cb) {
        //var launchers = $(xmlDoc).find('definicionReglas').find(LAUNCHER_RULE);

        console.log(">>>> Inicia 'Runtime.init'");

        if (rulesJson) {
            if (rulesJson.propiedades && rulesJson.propiedades.propiedad) {
                $.each(rulesJson.propiedades.propiedad, function (key, value) {
                    if (value.ejecutarRegla && value.ejecutarRegla == 1) {
                        var db_id = FormsBuilder.Utils.getDbId(value);
                        if (rules[db_id] === undefined) {
                            rules[db_id] = [];
                        }
                        rules[db_id].push({
                            idRegla: value.idRegla
                        });
                    }
                });
            }

            if (cb && typeof cb === "function") {
                cb();
            }
        }
    }

    function runInitRules() {
        var reglas = FormsBuilder.XMLForm.getReglas();

        console.log(">>>> Inicia 'runInitRules'");

        var fieldExpr;

        $.each(reglas.reglas.regla, function (key, regla) {
            try {
                //regla = $(reglaItem);
                var isInitRule = regla.ejecutarAlInicio === "1" || regla.ejecutarEnSubregimenes == "1";
                switch (regla.tipoRegla) {
                    case "Validacion":
                        if ((AppDeclaracionesSAT.getConfig("forma") === "tmp" && regla.ejecutarSiempre == "1") ||
                            (SAT.Environment.settings("acceptProposal") === true && regla.ejecutarAceptaPropuesta == "1")) {
                            FormsBuilder.ViewModel.Validacion("", regla);
                        }
                        break;

                    case "Visual":
                        if ((isInitRule && SAT.Environment.settings("dejarsinefecto") === false) ||
                            (SAT.Environment.settings("acceptProposal") === true && regla.ejecutarAceptaPropuesta == "1")) {
                            FormsBuilder.ViewModel.Visual(regla);
                        }
                        break;

                    case "Calculo":
                        var exprs = regla.definicion.trimAll().split("=");
                        if (exprs.length > 0) {
                            if (exprs[0] !== "") {
                                fieldExpr = FormsBuilder.ViewModel.getFieldsForExprs()[exprs[0]];

                                if (fieldExpr) {
                                    var db_id = "E{0}P{1}".format(fieldExpr.entidad, fieldExpr.propiedad);
                                    htmlOutput.find('[view-model="{0}"]'.format(db_id)).attr("disabled", true);
                                }
                            }
                        }

                        if (AppDeclaracionesSAT.getConfig("forma") !== "tmp") {
                            if (isInitRule) {
                                FormsBuilder.ViewModel.Calculo(regla);
                            }
                        }
                        break;

                    case "Condicional Excluyente":
                        if (AppDeclaracionesSAT.getConfig("forma") !== "tmp") {
                            if (isInitRule) {
                                FormsBuilder.ViewModel.Calculo(regla);
                            }
                        }
                        break;
                }

                // if (regla.validaSeccionAlEntrar === "1") {
                //     var propiedad = xmlDoc.find('definicionReglas').find('propiedad[idRegla={0}]'.format(regla.attr('id')));

                //     if (propiedad.length > 0) {
                //         var entidad = $(propiedad[0]).attr("idEntidadPropiedad");
                //         $('.panel[identidadpropiedad={0}]'.format(entidad)).attr('reglasSeccionAlEntrar', regla.attr('id'));
                //     }
                // }

                // if (regla.validaSeccion === "1") {
                //     var propiedad = xmlDoc.find("definicionReglas").find("propiedad[idRegla={0}]".format(regla.attr("id")));

                //     if (propiedad.length > 0) {
                //         var entidad = $(propiedad[0]).attr("idEntidadPropiedad");
                //         $(".panel[identidadpropiedad={0}]".format(entidad)).attr("reglasSeccion", regla.attr("id"));
                //     }
                // }
            } catch (err) {
                console.error("Error: {0} -:- Regla: {1}".format(err.message, $(regla).attr("definicion").trimAll()));
            }
        });
    }

    function runSubregimenesRules() {
        var reglas = FormsBuilder.XMLForm.getReglas();
        var reglasSubregimen = Enumerable.From(reglas.reglas.regla).Where("$.ejecutarEnSubRegimenes").ToArray();
        //FormsBuilder.XMLForm.getCopy().find('definicionReglas').find('regla[ejecutarEnSubregimenes]');

        console.log(">>>> Inicia 'runSubregimenesRules'");

        var fieldExpr;
        //var regla;

        $.each(reglasSubregimen, function (key, reglaItem) {
            try {
                //regla = $(reglaItem);

                switch (reglaItem.tipoRegla) {
                    case "Validacion":
                        FormsBuilder.ViewModel.Validacion("", reglaItem);
                        break;

                    case "Visual":
                        FormsBuilder.ViewModel.Visual(reglaItem);
                        break;

                    case "Calculo":
                        var exprs = reglaItem.definicion.trimAll().split("=");
                        if (exprs.length > 0) {
                            if (exprs[0] !== "") {
                                fieldExpr = FormsBuilder.ViewModel.getFieldsForExprs()[exprs[0]];
                                var db_id = "E{0}P{1}".format(fieldExpr.entidad, fieldExpr.propiedad);

                                htmlOutput.find('[view-model="{0}"]'.format(db_id)).attr("disabled", true);
                            }
                        }

                        FormsBuilder.ViewModel.Calculo(reglaItem);
                        break;

                    case "Condicional Excluyente":
                        FormsBuilder.ViewModel.Calculo(reglaItem);
                        break;
                }
            } catch (err) {
                // console.error("Error: {0} -:- Regla: {1}".format(err.message, $(regla).attr('definicion').trimAll()));
            }
        });
    }

    function initFormulario() {

        console.log(">>>> Inicia 'initFormulario'");

        //var xmlCopy = FormsBuilder.XMLForm.getCopy();
        var reglas = FormsBuilder.XMLForm.getReglas();
        //xmlCopy.find('definicionReglas').find(RULES_RULE);
        //var regla;

        $.each(reglas, function (key, reglaItem) {
            try {
                //regla = $(reglaItem);
                switch (reglaItem.tipoRegla) {
                    case "Formulario":
                        if (reglaItem.ejecutarAlInicio === "1") {
                            FormsBuilder.ViewModel.Visual(reglaItem);
                        }
                        break;
                }
            } catch (err) {
                // console.error("Error: {0} -:- Regla: {1}".format(err.message, $(regla).attr('definicion').trimAll()));
            }
        });
    }

    function evaluate(expression) {
        var $expression = expression.replace(/<>/ig, "!=").replace("=>", ">=").replace("> =", ">=");
        symToVal($expression);
        return new Function("return " + $expression).call();
    }

    function evaluateGrid(expression, indice) {
        var $expression = expression.replace(/<>/ig, "!=").replace("=>", ">=").replace("> =", ">=");
        symToValGrid($expression, indice);
        return new Function("return " + $expression).call();
    }
})();

var CONST_ACCION_MIN = 0;
var CONST_ACCION_MAX = 1;

var htmlOutput = $("#htmlOutput");

/**
module:FormsBuilder.Runtime~VALIDARLONGITUD
Permite validar la longitud de una cadena
*/
function VALIDARLONGITUD() {
    var len = arguments[0].toString().length;

    if (len > arguments[2] || len < arguments[1]) {
        return false;
    }

    return true;
}

function VALORANTERIOR(campo) {
    var valor = "";

    var rl = FormsBuilder.ViewModel.getFieldsForExprsGrid()[campo];
    if (rl !== undefined) {
        var db_id = "E{0}P{1}".format(rl.entidad, rl.propiedad);

        var getValueByProperty = function (obj, property) {
            var indexFinded;
            var objProps = Object.getOwnPropertyNames(obj);
            objProps.some(function (prop) {
                if (prop.split("_")[0] === property.split("_")[0]) {
                    indexFinded = prop;
                    return true;
                }
                return false;
            });

            if (indexFinded !== undefined)
                return obj[indexFinded]();
        };

        var verifyIndex = function (obj, value) {
            var objProps = Object.getOwnPropertyNames(obj);
            return objProps[0].split("_")[1] === value.split("_")[1];
        };

        var getIndex = function (prop, index) {
            if (verifyIndex(prop, db_id) && index > 0) {
                var filaDetalle = detalleGrid[index - 1];
                valor = getValueByProperty(filaDetalle, db_id);

                return true;
            }

            return false;
        };

        var detalleGrid = FormsBuilder.ViewModel.getDetalleGrid()[rl.entidad];
        if (detalleGrid.length > 1) {
            detalleGrid.some(getIndex);
        }
    }

    return valor;
}

function BLOQUEARSECCION(accion, entidad) {
    var that = function () {
        switch (accion) {
            case 1:
                var seccion = $('.panel-default[idEntidadPropiedad="{0}"]'.format(entidad));

                seccion.find(".btnAddCtrlGridRow:first").attr("disabled", true);
                seccion.find(".btnAddFormularioGridRow:first").attr("disabled", true);

                seccion.find(".btnCancelFormularioGridEdicionRow:first").attr("disabled", true);
                seccion.find(".btnSaveFormularioGridEdicionRow:first").attr("disabled", true);

                seccion.find(".cargaMasivaRetenciones.carga:first").attr("disabled", true);

                if (SAT.Environment.settings("isHydrate") === true &&
                    AppDeclaracionesSAT.getConfig("forma") === "new") {

                    var btnsEliminar = seccion.find(".btnDelCtrlGridRow");
                    $.each(btnsEliminar, function (key, btnEliminar) {
                        setTimeout(function () {
                            btnEliminar.click();
                        }, 250);
                    });
                    var btnsFormEliminar = seccion.find(".btnDelFormularioGridRow");
                    $.each(btnsFormEliminar, function (key, btnEliminar) {
                        setTimeout(function () {
                            btnEliminar.click();
                        }, 250);
                    });
                    var btnsFormGridEliminar = seccion.find(".btnDeleteFormularioGridEdicionRow");
                    $.each(btnsFormGridEliminar, function (key, btnEliminar) {
                        setTimeout(function () {
                            btnEliminar.click();
                        }, 250);
                    });

                    return;
                } else if (SAT.Environment.settings("isHydrate") === true) {
                    return;
                }

                var btnsEliminar = seccion.find(".btnDelCtrlGridRow");
                $.each(btnsEliminar, function (key, btnEliminar) {
                    setTimeout(function () {
                        btnEliminar.click();
                    }, 250);
                });
                var btnsFormEliminar = seccion.find(".btnDelFormularioGridRow");
                $.each(btnsFormEliminar, function (key, btnEliminar) {
                    setTimeout(function () {
                        btnEliminar.click();
                    }, 250);
                });
                var btnsFormGridEliminar = seccion.find(".btnDeleteFormularioGridEdicionRow");
                $.each(btnsFormGridEliminar, function (key, btnEliminar) {
                    setTimeout(function () {
                        btnEliminar.click();
                    }, 250);
                });
                break;

            case 2:
                if (SAT.Environment.settings("isHydrate") === true) return;

                var seccion = $('.panel-default[idEntidadPropiedad="{0}"]'.format(entidad));

                var btnAgregar = seccion.find(".btnAddCtrlGridRow:first");
                btnAgregar.attr("disabled", false);
                btnAgregar.click();

                seccion.find(".btnAddFormularioGridRow:first").attr("disabled", false);


                seccion.find(".btnCancelFormularioGridEdicionRow:first").attr("disabled", false);
                seccion.find(".btnSaveFormularioGridEdicionRow:first").attr("disabled", false);

                seccion.find(".cargaMasivaRetenciones.carga:first").attr("disabled", false);
                break;
        }
    };

    return that;
}

function blanktext(element) {
    element.clearData();
}

function SUMAGRID() {
    var suma = 0;

    for (var i = 0; i < arguments.length; i++) {
        var argumento = arguments[i];
        var idEntidad = argumento.split("_")[1];
        var gridEntidad = $("table[entidad={0}]".format(idEntidad));
        var columnas = gridEntidad.find("td[columna='{0}']".format(argumento));

        columnas.each(function () {
            var valorCelda = $(this).text();
            if (!isNaN(valorCelda)) {
                suma = suma + parseFloat(valorCelda);
            }
        });
    }

    return suma;
}

function SUMACONDICIONALCLASIFICADOR() {

    arguments[0] = arguments[0].toString().replace(/,/g, "|");
    var exprs = arguments[0].toString().split("|");

    var total = 0;
    var listDbid = [];
    var condicion;

    for (var i = 0; i < exprs.length; i++) {
        if (exprs[i].indexOf("=") < 0) {
            var rl = FormsBuilder.ViewModel.getFieldsForExprsGrid()[exprs[i]];
            var db_id = "E{0}P{1}".format(rl.entidad, rl.propiedad);

            listDbid.push({ rl: rl, db_id: db_id });
        } else {
            var rl = FormsBuilder.ViewModel.getFieldsForExprsGrid()[exprs[i].substring(0, exprs[i].indexOf("=")).replace("\"", "").replace("'", "")];
            var db_id = "E{0}P{1}".format(rl.entidad, rl.propiedad);

            var right = exprs[i].substring(exprs[i].indexOf("=") + 2).replace("\"", "").replace("'", "");

            condicion = { argument: exprs[i], rl: rl, db_id: db_id, left: rl.propiedad, right: right };
        }
    }

    var detalleGrid = FormsBuilder.ViewModel.getDetalleGrid()[listDbid[0].rl.entidad];

    var result = Enumerable.From(detalleGrid).Where(function (item) {

        var result = false;

        if (condicion.argument.indexOf("!") < 0) {
            result = item["{0}".format(condicion.db_id)] == condicion.right;
        } else {
            result = item["{0}".format(condicion.db_id)] != condicion.right;
        }

        return result;
    }).ToArray();

    if (listDbid.length == 2) { //contains group by
        var grouped = Enumerable.From(result).GroupBy("$.{0}".format(listDbid[1].db_id)).ToArray();

        var keyValue = FormsBuilder.ViewModel.get()[listDbid[1].rl.entidad][listDbid[1].db_id]();

        for (var g = 0; g < grouped.length; g++) {
            var group = grouped[g];

            if (!IsNullOrEmpty(keyValue) && group.Key() == keyValue) {
                for (var i = 0; i < group.source.length; i++) {
                    if (!group.source[i]["editando"]) {
                        total += group.source[i][listDbid[0].db_id];
                    }
                }
                //total += Enumerable.From(group.source).Sum("$.{0}".format(listDbid[0].db_id));
            }
        }
    } else {
        total = Enumerable.From(result).Sum("$.{0}".format(listDbid[0].db_id));
    }

    return total;
}

function SUMACONDICIONAL() {
    var total = 0;
    var listDbid = [];
    var listValues = [];
    var condicion;

    for (var key in arguments) {
        if (arguments[key].indexOf("=") < 0) {
            var rl = FormsBuilder.ViewModel.getFieldsForExprsGrid()[arguments[key]];
            var db_id = "E{0}P{1}".format(rl.entidad, rl.propiedad);

            listDbid.push({ rl: rl, db_id: db_id });
        } else {
            condicion = arguments[key];
        }
    }

    var detalleGrid = FormsBuilder.ViewModel.getDetalleGrid()[listDbid[0].rl.entidad];

    for (var j = 0; j < listDbid.length; j++) {
        for (var i = 0; i < detalleGrid.length; i++) {
            var item = detalleGrid[i][listDbid[j].db_id];
            if (item !== undefined) {
                listValues.push(item());
            }
        }
    }

    for (var i = 0; i < detalleGrid.length; i++) {
        var values = [];

        var indexFinded;
        var objProps = Object.getOwnPropertyNames(detalleGrid[i]);

        for (var j = 0; j < listDbid.length; j++) {
            objProps.some(function (prop) {
                if (prop.split("_")[0] === listDbid[j].db_id.split("_")[0]) {
                    indexFinded = prop;
                    return true;
                }
                return false;
            });
            values.push(detalleGrid[i][indexFinded]());
        }

        var indexActual = indexFinded.split("_")[1];

        condicion = condicion.replace(/[$](\w+|[0-9^_]+)/igm, function (match) {
            var index = match.indexOf("_");
            return match.substr(0, index + 1) + indexActual;
        });

        var resultEval = FormsBuilder.Runtime.evaluateGrid(condicion);

        var result;
        for (var z = 1; z < values.length; z++) {
            result = (listValues[z] === values[z]);

            if (!result)
                break;
        }

        if (result && resultEval) {
            if (!IsNullOrEmptyWhite(values[0])) {
                var value = parseInt(values[0]);
                total += value;
            }
        }
    }

    return total;
}

function SUMA() {
    arguments[0] = arguments[0].toString().replace(/[,](?!.*[,])/, "|");
    var exprs = arguments[0].toString().split("|");

    if (exprs.length == 2) {
        try {
            var detalleGrid = FormsBuilder.ViewModel.getDetalleGrid();
            var symbol = exprs[1];
            var suma = 0;

            var rl = FormsBuilder.ViewModel.getFieldsForExprsGrid()[symbol];
            if (rl !== undefined) {
                var db_id = "E{0}P{1}".format(rl.entidad, rl.propiedad);

                if (exprs[0].split("_").length === 2) {
                    exprs[0] = exprs[0].replace(/_[0-9]+/igm, "");
                }

                if (detalleGrid[rl.entidad] !== undefined) {
                    var detalleEntidad = detalleGrid[rl.entidad];
                    for (var i = 0; i < detalleEntidad.length; i++) {
                        var detalleFila = detalleEntidad[i];
                        if (!detalleFila["editando"] && detalleFila[db_id]) {
                            var definicion = exprs[0];
                            var resultEval = FormsBuilder.Runtime.evaluateGrid(definicion, i);
                            if (resultEval === true) {
                                if (detalleFila[db_id] && !isNaN(detalleFila[db_id])) {
                                    var valor = parseFloat(detalleFila[db_id]);
                                    suma += valor;
                                }
                            }
                        }
                    }
                }
            }
        } catch (err) {
            console.log(err.message + "\n" + err.stack);
        } finally {
            symToVal(exprs[0]);
        }

        return suma;
    } else {
        var detalleGrid = FormsBuilder.ViewModel.getDetalleGrid();
        var symbol = arguments[0];
        var suma = 0;

        var rl = FormsBuilder.ViewModel.getFieldsForExprs()[symbol];
        if (rl !== undefined) {
            var db_id = "E{0}P{1}".format(rl.entidad, rl.propiedad);

            if (detalleGrid[rl.entidad] !== undefined) {
                var detalleEntidad = detalleGrid[rl.entidad];
                for (var i = 0; i < detalleEntidad.length; i++) {
                    var detalleFila = detalleEntidad[i];
                    if (detalleFila[db_id]) {
                        var value = parseFloat(detalleFila[db_id]);
                        if (!isNaN(value)) {
                            suma += value;
                        }
                    }
                }
            }
        }

        return suma;
    }
}

function SUMAFILTRADO() {
    arguments[0] = arguments[0].toString().replace(/[,](?!.*[,])/, "|");

    var detalleGrid = FormsBuilder.ViewModel.getDetalleGridFiltrado();
    var symbol = arguments[0];
    var suma = 0;

    var rl = FormsBuilder.ViewModel.getFieldsForExprs()[symbol];
    if (rl !== undefined) {
        var db_id = "E{0}P{1}".format(rl.entidad, rl.propiedad);

        if (detalleGrid[rl.entidad]) {
            var detalleEntidad = detalleGrid[rl.entidad];
            for (var i = 0; i < detalleEntidad.length; i++) {
                var detalleFila = detalleEntidad[i];
                if (!detalleFila["editando"] && detalleFila[db_id]) {
                    var value = parseFloat(detalleFila[db_id]);
                    if (!isNaN(value)) {
                        suma += value;
                    }
                }
            }
        }
    }

    return suma;
}

function DECIMALES(value, decimals) {
    try {
        return parseFloat(value).toFixed(decimals);
    } catch (err) {
        console.log(err.message);
    }
}

function DUPLICADO() {
    var duplicates = [];
    var listDbid = [];

    for (var key in arguments) {
        var rl = FormsBuilder.ViewModel.getFieldsForExprsGrid()[arguments[key]];
        var db_id = "E{0}P{1}".format(rl.entidad, rl.propiedad);

        listDbid.push({ rl: rl, db_id: db_id });
    }

    listDbid.forEach(function (element) {
        var detalleGrid = FormsBuilder.ViewModel.getDetalleGrid()[element.rl.entidad];
        var values = [];

        var getValueByProperty = function (obj, property) {
            var indexFinded;
            var objProps = Object.getOwnPropertyNames(obj);
            objProps.some(function (prop) {
                if (prop.split("_")[0] === property.db_id.split("_")[0]) {
                    indexFinded = prop;
                    return true;
                }
                return false;
            });

            return obj[indexFinded]();
        };

        var search = function (prop) {
            var value = getValueByProperty(prop, element);

            if (IsNullOrEmptyWhite(value))
                return false;

            if ($.inArray(value, values) > -1) {
                return true;
            }

            values.push(value);
            return false;
        };

        duplicates.push(detalleGrid.some(search));
    });

    return Y.apply(null, duplicates);
}


function CONTARDIAS() {
    var fecha1 = arguments[0];
    var fecha2 = arguments[1];
    var days = NaN;
    if ((!fecha1) ||
        (!fecha2)) {
        return false;
    }
    try {
        var timeFecha1 = FECHA(fecha1).getTime();
        var timeFecha2 = FECHA(fecha2).getTime();

        var maximus = Math.max(timeFecha1, timeFecha2);
        var minimus = Math.min(timeFecha1, timeFecha2);

        var timeElapsed = maximus - minimus;

        var seconds = Math.floor(timeElapsed / 1000);
        var minutes = Math.floor(seconds / 60);
        var hours = Math.floor(minutes / 60);
        days = Math.floor(hours / 24);
    } catch (err) {
        // console.error(err);
    }
    return days + 1;

}

function OBTENERANIOSFECHAS() {
    var fecha1 = arguments[0];
    var fecha2 = arguments[1];

    if ((!fecha1) ||
        (!fecha2)) {
        // console.error("Una de las fechas es invalida");
        return false;
    }
    var years = 0;
    try {
        var timeFecha1 = FECHA(fecha1);
        var timeFecha2 = FECHA(fecha2);

        var d = timeFecha2,
            now = timeFecha1;
        years = now.getFullYear() - d.getFullYear();
        d.setFullYear(d.getFullYear() + years);
        if (d > now) {
            years--;
            d.setFullYear(d.getFullYear() - 1);
        }
    } catch (err) {
        // console.log("Ocurrio un problema al manejar las fechas Error:{0}".format(err));
    }

    return years;
}

function DIFERENCIAANIOSFECHAS() {
    var fecha1 = arguments[0];
    var fecha2 = arguments[1];
    var diferencia = arguments[2];

    if ((!fecha1) ||
        (!fecha2)) {
        // console.error("Una de las fechas es invalida, diferencia no efectuada");
        return false;
    }

    var yearsElapsed = OBTENERANIOSFECHAS(fecha1, fecha2);

    return yearsElapsed >= diferencia ? true : false;

}

function CONTADORCONDICIONAL() {
    var condicion = arguments[0];

    var detalleGrid = FormsBuilder.ViewModel.getDetalleGrid();
    var suma = 0;

    var exprs = condicion.match(/[$](\w+|[0-9^_]+)/igm);

    if (exprs !== null) {
        var rl = FormsBuilder.ViewModel.getFieldsForExprsGrid()[exprs[0]];

        if (condicion.split("_").length === 2) {
            condicion = condicion.replace(/_[0-9]+/igm, "");
        }

        if (detalleGrid[rl.entidad] !== undefined) {
            for (var detalleFila in detalleGrid[rl.entidad]) {
                for (var detalle in detalleGrid[rl.entidad][detalleFila]) {
                    var propiedad = detalle.split("_")[0].substring(detalle.split("_")[0].indexOf("P") + 1, detalle.split("_")[0].length);

                    if (exprs[0].split("_")[0].replace("$", "") === propiedad) {

                        var definicion = condicion;
                        var matches = condicion.match(/[$](\w+|[0-9^_]+)/igm);
                        if (matches !== null) {
                            $.each(matches, function (k, match) {
                                definicion = definicion.replace(match, match + "_" + detalle.split("_")[1]);
                            });
                        }
                        var resultEval = FormsBuilder.Runtime.evaluateGrid(definicion);
                        if (resultEval === true) {
                            suma++;
                        }
                    }
                }
            }
        }
    }

    return suma;
}

function REDONDEARMENOS() {
    var val = arguments[0];
    return Math.floor(val);
}

function REDONDEARMENOR() {
    var val = arguments[0];
    return Math.floor(val);
}

function REDONDEARMAS() {
    var val = arguments[0];
    return Math.ceil(val);
}

function ABS() {
    var val = arguments[0];
    return Math.abs(val);
}

function REDONDEARSAT() {
    if (arguments[0] !== undefined && !isNaN(arguments[0])) {
        var value = arguments[0].toString();

        if (value.match(/[.]/igm) !== null) {
            var decimales = value.substring(value.indexOf("."), value.length);
            if (parseFloat(decimales) >= parseFloat(0.51)) {
                value = Math.ceil(value);
            } else {
                value = Math.floor(value);
            }
        }
        return parseFloat(value);
    }
}

function PaddingZerosRight(value, numberZeros) {
    var result = value;
    var areValidArguments = (!IsNullOrEmpty(value) && !isNaN(value)) && (typeof (numberZeros) == "number" && numberZeros > 0);
    if (areValidArguments) {
        var stringValue = value.toString();
        var pointIndex = stringValue.indexOf(".");
        var zeros = [];
        for (var index = 0; index < numberZeros; index++) {
            zeros.push("0");
        }
        zeros = zeros.join("");

        var existPointIndex = pointIndex != -1;

        if (existPointIndex) {
            var decimal = stringValue.substr(pointIndex + 1);
            var integer = stringValue.substr(0, pointIndex);
            var zerosToAdd = zeros.slice(decimal.length);
            decimal = decimal + zerosToAdd;
            result = "{0}.{1}".format(integer, decimal);
        }
    }
    return result;
}

function TRUNCAR() {
    var value = arguments[0];
    var result = value;
    var truncateString = arguments[1].toString();

    if (value && !IsNullOrEmpty(truncateString)) {
        var truncatePositions = parseInt(truncateString);

        var stringValue = value.toString();
        var pointIndex = stringValue.indexOf(".");

        if (stringValue.indexOf("e-") != -1) {
            var power = parseInt(stringValue.toString().split("e-")[1]);
            if (power) {
                stringValue *= Math.pow(10, power - 1);
                stringValue = "0." + (new Array(power)).join("0") + stringValue.toString().substring(2);
            }
        }

        if (pointIndex != -1) {
            var decimals = stringValue.substr(pointIndex + 1, truncatePositions);

            var integer = stringValue.substr(0, pointIndex);

            var truncateValue = integer.concat(".{0}".format(decimals));
            result = parseFloat(truncateValue);
        }
    }

    return result;
}

function SI() {
    if (arguments[0]) {
        if (typeof arguments[1] === "function") {
            arguments[1]();
        } else return arguments[1];
    } else {
        if (arguments.length > 2) {
            if (typeof arguments[2] === "function") {
                arguments[2]();
            } else return arguments[2];
        }
    }
}

function NO() {
    return !arguments[0];
}

function EXPRESIONREGULAR() {
    var pattern = new RegExp(arguments[1]);
    return pattern.test(arguments[0].toString());
}

function MOSTRAR(id) {
    var symbol = id;
    var that = function () {
        var rl = FormsBuilder.ViewModel.getFieldsForExprs()[symbol];
        if (rl !== undefined) {
            var db_id = "E{0}P{1}".format(rl.entidad, rl.propiedad);
            var control = htmlOutput.find('[view-model="{0}"]'.format(db_id)).not("a");
            var botonDetalle = htmlOutput.find("a[vm='{0}'], a[view-model='{0}']".format(db_id));

            htmlOutput.find('i[vm="{0}"]'.format(db_id)).show();

            if (botonDetalle.length > 0 && !botonDetalle.attr("data-ocultar-btndetalle")) {
                botonDetalle.show();
            }

            if (control.parent().prev().children("div.sat-height-field").length > 0) {
                control.parent().prev().show();
            } else if (control.parents().eq(1).prev().children("div.sat-height-field").length > 0) {
                control.parents().eq(1).prev().first().show();
            } else if (control.parents().eq(2).prev().children("div.sat-height-field").length === 1) {
                control.parents().eq(2).prev().children("div.sat-height-field").show();
            } else if (control.parents().eq(1).prev().hasClass("sat-height-field")) {
                control.parents().eq(1).prev().show();
            } else if (control.parent().hasClass("datepicker-control-div")) {
                control.parents().eq(1).prev().show();
            }

            control.prev().not("a.list-group-item").show();
            control.show();
            control.nextAll(".ic-help").first().show();
        }
    };

    return that;
}

function OCULTAR(id) {
    var symbol = id;
    var that = function () {
        var rl = FormsBuilder.ViewModel.getFieldsForExprs()[symbol];
        if (rl !== undefined) {
            var db_id = "E{0}P{1}".format(rl.entidad, rl.propiedad);
            var control = htmlOutput.find('[view-model="{0}"]'.format(db_id));

            htmlOutput.find('i[vm="{0}"]'.format(db_id)).hide();
            htmlOutput.find('.btn-detalle[vm="{0}"]'.format(db_id)).hide();

            if (control.parent().prev().children("div.sat-height-field").length === 1) {
                control.parent().prev().first().hide();
            } else if (control.parents().eq(1).prev().children("div.sat-height-field").length === 1) {
                control.parents().eq(1).prev().first().hide();
            } else if (control.parents().eq(2).prev().children("div.sat-height-field").length === 1) {
                control.parents().eq(2).prev().children("div.sat-height-field").hide();
            } else if (control.parents().eq(1).prev().hasClass("sat-height-field")) {
                control.parents().eq(1).prev().hide();
            } else if (control.parent().hasClass("datepicker-control-div")) {
                control.parent().prev().hide();
            }

            control.prev().not("a.list-group-item").hide();
            control.hide();
            control.nextAll(".ic-help").first().hide();
        }
    };

    return that;
}

function toggleContenedor(parametros, mostrar) {
    parametros = parametros[0].toString().replace(/\s/g, "").split(",");
    var id = parametros[0];
    var tipoContenedor = parametros[1].replace(/'/g, "");
    var nivel = parametros[2];
    var datos = FormsBuilder.ViewModel.getFieldsForExprs()[id];
    var restarContenedoresOcultos = function () {
        var controlHijo = $(this);

        if (controlHijo.attr("data-contenedor-oculto")) {
            var contenedoresOcultos = parseInt(controlHijo.attr("data-contenedor-oculto"));

            contenedoresOcultos--;

            if (contenedoresOcultos < 1) {
                controlHijo.removeAttr("data-contenedor-oculto");
            } else {
                controlHijo.attr("data-contenedor-oculto", contenedoresOcultos);
            }
        }
    };
    var sumarContenedoresOcultos = function () {
        var controlHijo = $(this);
        var contenedoresOcultos = controlHijo.attr("data-contenedor-oculto") ? parseInt(controlHijo.attr("data-contenedor-oculto")) : 0;

        contenedoresOcultos++;
        controlHijo.attr("data-contenedor-oculto", contenedoresOcultos);
    };
    var toggleTabs = function (tab, tabBody) {
        var contenedorTabs = tab.parents("ul.nav-tabs");
        var menu = tab.parents(".dropdown");

        if (mostrar === true) {
            tab.parent().show();
            tabBody.find("[view-model]").each(restarContenedoresOcultos);

            if (tab.parent().hasClass("active")) {
                tabBody.addClass("active");
                tabBody.addClass("in");
            }

            if (menu.length > 0) {
                menu.show();
            }
        } else {
            tab.parent().hide();
            tabBody.removeClass("active in");
            tabBody.find("[view-model]").each(sumarContenedoresOcultos);

            if (menu.length > 0) {
                var elementosVisibles = AppDeclaracionesSAT.obtenerElementosVisibles(menu.find("li").not("li.dropdown"));
                if (elementosVisibles.length === 0) {
                    menu.hide();
                }
            }
        }

        AppDeclaracionesSAT.ajustarAnchoTabs(contenedorTabs);
    };
    var accion = function () {
        if (tipoContenedor && datos) {
            var db_id = "E{0}P{1}".format(datos.entidad, datos.propiedad);
            var control = $("[view-model='{0}']".format(db_id));

            tipoContenedor = tipoContenedor.toLowerCase();
            nivel = nivel || 0;

            if (control.length > 0) {
                if (tipoContenedor === "menu") {
                    var contenedor = control.parents("[idtab]");
                    var idTab = contenedor.attr("idtab");
                    var menu = $("a[data-titulo-menu='{0}']".format(idTab));
                    var menuBody = $(menu.attr("href"));

                    toggleTabs(menu, menuBody);
                } else if (tipoContenedor === "tab") {
                    var tabBody = control.parents("[data-tipocontenedor='tab']");
                    var idTab = tabBody.attr("id");
                    var tab = $("a[href='#{0}']".format(idTab));

                    toggleTabs(tab, tabBody);
                } else {
                    var contenedor = control.parents("[data-tipocontenedor='{0}']".format(tipoContenedor)).eq(nivel);

                    if (contenedor.length > 0 && mostrar === true) {
                        contenedor.show();
                        contenedor.find("[view-model]").each(restarContenedoresOcultos);
                    } else if (contenedor.length > 0 && mostrar === false) {
                        contenedor.hide();
                        contenedor.find("[view-model]").each(sumarContenedoresOcultos);
                    }
                }
            }
        }
    };

    return accion;
}

function OCULTARCONTENEDOR() {
    return toggleContenedor(arguments, false);
}

function MOSTRARCONTENEDOR() {
    return toggleContenedor(arguments, true);
}

function toggleBtnDetalle(idPropiedad, mostrar) {
    var accion = function () {
        if (!IsNullOrEmptyWhite(idPropiedad)) {
            var datosPropiedad = FormsBuilder.ViewModel.getFieldsForExprs()[idPropiedad];

            if (datosPropiedad) {
                var idEntidadPropiedad = "E{0}P{1}".format(datosPropiedad.entidad, datosPropiedad.propiedad);
                var btnDetalle = $("a[vm='{0}'], a[view-model='{0}']".format(idEntidadPropiedad));

                if (mostrar === true) {
                    btnDetalle.show();
                    btnDetalle.removeAttr("data-ocultar-btndetalle");
                } else if (mostrar === false) {
                    btnDetalle.hide();
                    btnDetalle.attr("data-ocultar-btndetalle", true);
                }
            }
        }
    };

    return accion;
}

function OCULTARBTNDETALLE() {
    return toggleBtnDetalle(arguments[0], false);
}

function MOSTRARBTNDETALLE() {
    return toggleBtnDetalle(arguments[0], true);
}

function MOSTRARGRID(id) {
    var symbol = id;
    var that = function () {
        var rl = FormsBuilder.ViewModel.getFieldsForExprsGrid()[symbol];
        if (rl !== undefined) {
            var db_id = "E{0}P{1}".format(rl.entidad, rl.propiedad);

            htmlOutput.find('i[vm="{0}"]'.format(db_id)).show();
            var ctl = htmlOutput.find('[view-model="{0}"]'.format(db_id));
            ctl.prev().show();
            ctl.show();
            ctl.nextAll(".ic-help").first().show();

            var elementos = ctl.parents().eq(2).find("[view-model]");
            var todosInvibles = true;
            $.each(elementos, function (key, elemento) {
                if ($(elemento).css("display") !== "none") {
                    todosInvibles = false;
                }
            });
            if (ctl.parents().eq(2).attr("identidadpropiedad") === undefined) {
                if (todosInvibles === true) {
                    ctl.parents().eq(2).hide();
                    if (ctl.parents().eq(5).attr("paneldinamico") !== undefined) {
                        ctl.parents().eq(5).hide();
                    }
                } else {
                    ctl.parents().eq(2).show();
                    if (ctl.parents().eq(5).attr("paneldinamico") !== undefined) {
                        ctl.parents().eq(5).show();
                    }
                }

                if (ctl.parent().prev().prop("tagName") === "H5") {
                    if (!IsNullOrEmpty(ctl.parent().prev().html())) {
                        ctl.parents().eq(1).show();
                    }
                }
            }
        }
    };

    return that;
}

function OCULTARGRID(id) {
    var symbol = id;
    var that = function () {
        var rl = FormsBuilder.ViewModel.getFieldsForExprsGrid()[symbol];
        if (rl !== undefined) {
            var db_id = "E{0}P{1}".format(rl.entidad, rl.propiedad);

            htmlOutput.find('i[vm="{0}"]'.format(db_id)).hide();
            var ctl = htmlOutput.find('[view-model="{0}"]'.format(db_id));

            ctl.prev().hide();
            ctl.hide();
            ctl.nextAll(".ic-help").first().hide();

            var elementos = ctl.parents().eq(2).find('[view-model][type!="hidden"]');
            var todosInvibles = true;
            $.each(elementos, function (key, elemento) {
                if ($(elemento).css("display") !== "none") {
                    todosInvibles = false;
                }
            });
            if (ctl.parents().eq(2).attr("identidadpropiedad") === undefined) {
                if (todosInvibles === true) {
                    ctl.parents().eq(2).hide();
                    if (ctl.parents().eq(5).attr("paneldinamico") !== undefined && ctl.parents().eq(3).length > 0 && !ctl.parents().eq(3).children().eq(0).is(":visible")) {
                        ctl.parents().eq(5).hide();
                    }
                } else {
                    ctl.parents().eq(2).show();
                    if (ctl.parents().eq(5).attr("paneldinamico") !== undefined) {
                        ctl.parents().eq(5).show();
                    }
                }

                if (ctl.parent().prev().prop("tagName") === "H5") {
                    if (!IsNullOrEmpty(ctl.parent().prev().html())) {
                        ctl.parents().eq(1).hide();
                    }
                }
            }
        }
    };

    return that;
}

function HABILITAR(id) {
    var symbol = id;
    var that = function () {
        var rl = FormsBuilder.ViewModel.getFieldsForExprs()[symbol];
        if (rl !== undefined) {
            var db_id = "E{0}P{1}".format(rl.entidad, rl.propiedad);

            if ((htmlOutput.find('[view-model="{0}"]'.format(db_id)).hasClass("sat-comp") ||
                htmlOutput.find('[view-model="{0}"]'.format(db_id)).hasClass("sat-detalle")) &&
                SAT.Environment.settings("isDAS")) {
                htmlOutput.find('[view-model="{0}"]'.format(db_id)).not("a").attr("disabled", true);
            } else {
                htmlOutput.find('[view-model="{0}"]'.format(db_id)).attr("disabled", false);
            }
        }
    };

    return that;
}

function LIMPIARCHECK(id) {
    var symbol = id;
    var that = function () {
        var rl = FormsBuilder.ViewModel.getFieldsForExprs()[symbol];
        if (rl !== undefined) {
            var db_id = "E{0}P{1}".format(rl.entidad, rl.propiedad);

            htmlOutput.find('[view-model="{0}"]'.format(db_id)).attr("checked", false);
        }
    };

    return that;
}

function HABILITADO(id) {
    var symbol = id;
    var that = function () {
        var rl = FormsBuilder.ViewModel.getFieldsForExprs()[symbol];
        if (rl !== undefined) {
            var db_id = "E{0}P{1}".format(rl.entidad, rl.propiedad);

            htmlOutput.find('[view-model="{0}"]'.format(db_id)).attr("disabled", false);
        }
    };

    return that;
}

function DESHABILITAR(id) {
    var symbol = id;
    var that = function () {
        var rl = FormsBuilder.ViewModel.getFieldsForExprs()[symbol];
        if (rl !== undefined) {
            var db_id = "E{0}P{1}".format(rl.entidad, rl.propiedad);

            htmlOutput.find('[view-model="{0}"]'.format(db_id)).attr("disabled", true);
        }
    };

    return that;
}

function INHABILITAR(id) {
    var symbol = id;
    var that = function () {
        var rl = FormsBuilder.ViewModel.getFieldsForExprs()[symbol];
        if (rl !== undefined) {
            var db_id = "E{0}P{1}".format(rl.entidad, rl.propiedad);

            if (SAT.Environment.settings("isDAS")) {
                htmlOutput.find('[view-model="{0}"]'.format(db_id)).not("a").attr("disabled", true);
            } else {
                htmlOutput.find('[view-model="{0}"]'.format(db_id)).attr("disabled", true);
            }
        }
    };

    return that;
}

function HABILITARGRID(id) {
    var symbol = id;
    var that = function () {
        var rl = FormsBuilder.ViewModel.getFieldsForExprsGrid()[symbol];
        if (rl !== undefined) {
            var db_id = "E{0}P{1}".format(rl.entidad, rl.propiedad);

            htmlOutput.find('[view-model="{0}"]'.format(db_id)).attr("disabled", false);
        }
    };

    return that;
}

function INHABILITARGRID(id) {
    var symbol = id;
    var that = function () {
        var rl = FormsBuilder.ViewModel.getFieldsForExprsGrid()[symbol];
        if (rl !== undefined) {
            var db_id = "E{0}P{1}".format(rl.entidad, rl.propiedad);

            htmlOutput.find('[view-model="{0}"]'.format(db_id)).attr("disabled", true);
        }
    };

    return that;
}

function MOSTRARMENUSECCION(entidad) {
    var symbol = entidad;
    var that = function () {
        var idPanel = htmlOutput.find('.panel-default[identidadpropiedad="{0}"]'.format(symbol)).attr("id");
        var ancla = $('.container-submenus li a[idPanel="{0}"]'.format(idPanel));
        var seccion = htmlOutput.find('.panel[id="{0}"]'.format(idPanel));
        var seccionPadre = ancla.attr("idSeccion");
        ancla.parent().show();

        if (SAT.Environment.settings("isDAS")) {
            var seccionDas = $('div.ficha-collapse[identidadpropiedad="{0}"]'.format(symbol));
            seccionDas.show();
        }

        $('div[id="{0}"]'.format(seccionPadre)).show();

        if (FormsBuilder.ViewModel.getFlujoSecciones()[entidad] !== undefined) {
            FormsBuilder.ViewModel.getFlujoSecciones()[entidad].OcultarMenuSeccion = false;
            if (!SAT.Environment.settings("isDAS")) {
                FormsBuilder.ViewModel.getFlujoSecciones()[entidad]["NoAplica"] = false;
            }
        }
        seccion.attr("saltado", "");
    };

    return that;
}

function OCULTARMENUSECCION(entidad, omitirNoAplica) {
    var symbol = entidad;
    var that = function () {
        var idPanel = htmlOutput.find('.panel-default[identidadpropiedad="{0}"]'.format(symbol)).attr("id");
        var ancla = $('.container-submenus li a[idPanel="{0}"]'.format(idPanel));
        var seccionPadre = ancla.attr("idSeccion");
        ancla.parent().hide();

        if (SAT.Environment.settings("isDAS")) {
            var seccionDas = $('div.ficha-collapse[identidadpropiedad="{0}"]'.format(symbol));
            seccionDas.hide();
        }

        var secciones = $(".panel-sections").find('a[idSeccion="{0}"]'.format(seccionPadre)).map(function (cv, i) { if ($(i).parent().is(":visible")) { return i; } });
        if (secciones.length == 0) {
            $('div[id="{0}"]'.format(seccionPadre)).hide();
        }


        if (FormsBuilder.ViewModel.getFlujoSecciones()[entidad] !== undefined) {
            FormsBuilder.ViewModel.getFlujoSecciones()[entidad].OcultarMenuSeccion = true;
            if (!SAT.Environment.settings("isDAS")) {
                if (!(omitirNoAplica === true || omitirNoAplica === 1)) {
                    FormsBuilder.ViewModel.getFlujoSecciones()[entidad]["NoAplica"] = true;
                }
            }
        }

        var seccion = htmlOutput.find('.panel[id="{0}"]'.format(idPanel));
        if (SAT.Environment.settings("isHydrate") === false) {
            var btnsEliminar = seccion.find("button.btnDelCtrlGridRow");
            if (btnsEliminar.length > 0) {
                btnsEliminar.each(function (k, v) {
                    $(v).click();
                });
            } else {
                if (!SAT.Environment.settings("isDAS")) {
                    //var xmlCopy = FormsBuilder.XMLForm.getCopy();
                    var entidades = FormsBuilder.XMLForm.getEntidades();
                    var inputspago;
                    var inputs = seccion.find('input[type="text"]');
                    $.each(inputs, function (k, input) {
                        var db_id = $(input).attr("view-model");
                        inputspago = Enumerable.From(entidades).SelectMany("$.propiedades.propiedad").Where("$.id == '{0}'".format(db_id.split("P")[0])).Select("$.claveInformativa").FirstOrDefault();
                        //$(xmlCopy).find('Propiedad[id="{0}"]'.format(db_id.split('P')[0])).attr('claveInformativa');
                        switch (inputspago) {
                            case "C5":
                            case "C20":
                            case "UC26":
                                break;
                            default:
                                FormsBuilder.ViewModel.get()[(db_id.split("P")[0]).replace("E", "")][db_id]("");
                                break;
                        }
                    });

                    var combos = seccion.find("select");
                    $.each(combos, function (k, combo) {
                        var db_id = $(combo).attr("view-model");
                        FormsBuilder.ViewModel.get()[(db_id.split("P")[0]).replace("E", "")][db_id]("");
                    });
                }
            }
        }

        seccion.attr("saltado", "true");
    };

    return that;
}

function OBLIGATORIO(id) {
    var symbol = id;
    var that = function () {
        var rl = FormsBuilder.ViewModel.getFieldsForExprs()[symbol];
        if (rl !== undefined) {
            var db_id = "E{0}P{1}".format(rl.entidad, rl.propiedad);

            htmlOutput.find('[view-model="{0}"]'.format(db_id)).addClass("sat-obligatorio");
        }
    };

    return that;
}

function NOOBLIGATORIO(id) {
    var symbol = id;
    var that = function () {
        var rl = FormsBuilder.ViewModel.getFieldsForExprs()[symbol];
        if (rl !== undefined) {
            var db_id = "E{0}P{1}".format(rl.entidad, rl.propiedad);

            htmlOutput.find('[view-model="{0}"]'.format(db_id)).removeClass("sat-obligatorio");
        }
    };

    return that;
}

function LONGITUG() {
    if (arguments[0] !== undefined) {
        return arguments[0].toString().length;
    }

    return 0;
}

var DERECHA = "";

function ESBLANCO() {
    return IsNullOrEmpty(arguments[0]);
}

function ESNUMERO() {
    var value = arguments[0];
    return !isNaN(parseInt(value, 10)) && (parseFloat(value, 10) == parseInt(value, 10));
}

function Y() {
    for (var i = 0; i < arguments.length; i++) {
        if (!arguments[i]) {
            return false;
        }
    }
    return true;
}

function O() {
    for (var i = 0; i < arguments.length; i++) {
        if (arguments[i]) {
            return true;
        }
    }
    return false;
}

function ESENTEROPOSITIVO() {
    var rule = FormsBuilder.ViewModel.getFieldsForExprs()[arguments[0]];
    if (rule !== undefined) {
        var db_id = "E{0}P{1}".format(rule.entidad, rule.propiedad);
        var value = FormsBuilder.ViewModel.get()[(db_id.split("P")[0]).replace("E", "")][db_id]();

        return /^(0|[0-9]\d*(\.\d+)?|\d*(\.\d+)?)$/.test(value);
    }
    return true;
}

function ALFANUMERICOS() {
    var value = arguments[0];
    return value.length === 0 ? true : /^[a-z0-9À-ÿ\s\ñ\Ñ\&\'\.\-]+$/i.test(value);
}

function ALFANUMERICOSESPECIALES() {
    var value = arguments[0];
    return value.length === 0 ? true : /^[a-z0-9À-ÿ\s\ñ\Ñ\&\'\.\-\,\/\@\#\%\!\¡\$\+\"]+$/i.test(value);
}

function ESENTEROPOSITIVOGRID() {

    var result = true;
    var rule = FormsBuilder.ViewModel.getFieldsForExprsGrid()[arguments[0]];
    if (rule !== undefined) {
        var db_id = "E{0}P{1}".format(rule.entidad, rule.propiedad);
        var value;
        var detalleGrid = FormsBuilder.ViewModel.getDetalleGrid()[(db_id.split("P")[0]).replace("E", "")];
        for (var indexDetalle in detalleGrid) {
            if (detalleGrid[indexDetalle][db_id] !== undefined) {
                value = detalleGrid[indexDetalle][db_id]();
            }
        }
        result = /^(0|[0-9]\d*(\.\d+)?|\d*(\.\d+)?)$/.test(value);
    }
    return result;
}

function ESENTERONEGATIVO() {
    if (ESNULO(arguments[1])) {
        return true;
    }

    var value = parseFloat(arguments[0]);
    if (!isNaN(value)) {
        if (value < 0) {
            return true;
        }
    }

    return false;
}

function VALIDARRANGO() {
    if (!IsNullOrEmptyOrZero(arguments[0])) {
        var value = parseFloat(arguments[0]);
        if (!isNaN(value)) {
            if (value >= arguments[1] && value <= arguments[2]) {
                return true;
            } else {
                return false;
            }
        }
    }

    return true;
}

function ESENTERO() {
    var value = parseFloat(arguments[0]);
    if (!isNaN(value)) {
        return true;
    }

    return false;
}

function ELEMENTOSGRID() {
    var numeroElementos = -1;
    var field = arguments[0];
    var index;

    var rule = FormsBuilder.ViewModel.getFieldsForExprsGrid()[field];
    if (rule !== undefined) {
        var db_id = "E{0}P{1}".format(rule.entidad, rule.propiedad);
        var detalleGrid = FormsBuilder.ViewModel.getDetalleGrid()[(db_id.split("P")[0]).replace("E", "")];
        numeroElementos = detalleGrid.length;
        if (numeroElementos > 0) {
            numeroElementos = 0;
            for (var detalleFila in detalleGrid) {
                for (var detalle in detalleGrid[detalleFila]) {
                    if (db_id.split("_")[0] === detalle.split("_")[0] &&
                        detalleGrid[detalleFila][detalle] != undefined &&
                        detalleGrid[detalleFila][detalle]()) {
                        numeroElementos++;
                    }
                }
            }
        }
    } else {
        Object.getOwnPropertyNames(FormsBuilder.ViewModel.getFieldsForExprsGrid()).forEach(function (element) {
            if (element.split("_")[0] === field) {
                index = element.split("_")[1];
                rule = FormsBuilder.ViewModel.getFieldsForExprsGrid()[field + "_" + index];
                if (rule !== undefined) {
                    var db_id = "E{0}P{1}".format(rule.entidad, rule.propiedad);
                    var detalleGrid = FormsBuilder.ViewModel.getDetalleGrid()[(db_id.split("P")[0]).replace("E", "")];
                    numeroElementos = detalleGrid.length;
                    if (numeroElementos > 0) {
                        numeroElementos = 0;
                        for (var detalleFila in detalleGrid) {
                            for (var detalle in detalleGrid[detalleFila]) {
                                if (db_id.split("_")[0] === detalle.split("_")[0] &&
                                    detalleGrid[detalleFila][detalle] != undefined &&
                                    detalleGrid[detalleFila][detalle]()) {
                                    numeroElementos++;
                                }
                            }
                        }
                    }
                }
            }
        });
    }

    return numeroElementos;
}

function ELEMENTOSCOMBO(id) {
    var numeroElementos = -1;

    var rl = FormsBuilder.ViewModel.getFieldsForExprs()[id];
    if (rl !== undefined) {
        var db_id = "E{0}P{1}".format(rl.entidad, rl.propiedad);

        numeroElementos = htmlOutput.find('[view-model="{0}"] option'.format(db_id)).length;
    }

    return numeroElementos;
}

var cacheBuscarRango = [];

function BUSCARRANGO(id, columnasBusqueda, valor, columnaRegreso) {
    var llaveCacheRango = "{0}.{1}.{2}.{3}".format(id, columnasBusqueda, valor, columnaRegreso);
    if (cacheBuscarRango[llaveCacheRango] != undefined) {
        return cacheBuscarRango[llaveCacheRango];
    }
    var tasa = 0;
    var elementos = FormsBuilder.Catalogs.getAll().find('catalogo[id="{0}"]'.format(id)).find("elemento");
    $.each(elementos, function (key, elemento) {
        var minimo = $(elemento).attr(columnasBusqueda[0]);
        var maximo = $(elemento).attr(columnasBusqueda[1]);

        if (!IsNullOrEmptyOrZero(valor)) {
            var value = parseFloat(valor);
            if (!isNaN(value)) {
                if (value >= minimo && value <= maximo) {
                    tasa = parseFloat($(elemento).attr(columnaRegreso));
                    return false;
                }
            }
        }
    });
    cacheBuscarRango[llaveCacheRango] = tasa;
    return tasa;
}

function groupBy(items, column) {
    var result = {};
    if ($(items).length < 0 || IsNullOrEmpty(column)) {
        return null;
    }
    items.map(function (index) {
        var item = $.isArray(items) ? index : items[index];
        var val = $(item).attr(column);
        if (!$.isArray(result[val])) {
            result[val] = [];
        }
        result[val].push(item);
    });
    return result;
}

function addExtensionMethods(array) {
    array.getNext = function () {
        var result;
        for (var index in this) {
            if (!this[index].checked && typeof (this[index]) != "function") {
                result = this[index];
                break;
            }
        }
        return result;
    };
    array.hasNext = function () {
        var result = false;
        for (var index in this) {
            if (this[index].hasOwnProperty("checked") && !this[index].checked) {
                result = true;
                break;
            }
        }
        return result;
    };
}

function groupByRecursive(items, columns, inCycle) {
    var result = {};
    var column = columns.getNext();
    if (!column) {
        return result;
    }
    var isGroup = items.length === undefined;
    if (!isGroup) {
        result = groupBy(items, column.nameColumn);
        if (inCycle) {
            return result;
        }
    } else {
        for (var index in items) {
            var nextLevel = items[index];
            items[index] = groupByRecursive(nextLevel, columns, true);
        }
        result = items;
    }
    if (columns.hasNext() && !inCycle) {
        column.checked = true;
        groupByRecursive(result, columns);
    }
    return result;
}

function getArray(items) {
    var result = [];
    var isGroup = items.length === undefined;
    if (isGroup) {
        for (var index in items) {
            result = result.concat(getArray(items[index]));
        }
    } else {
        for (var index in items) {
            var item = items[index];
            if (typeof item != "function")
                result.push(item);
        }
    }
    return result;
}

function groupByMany(items, columns) {
    for (var level in columns) {
        columns[level] = {
            nameColumn: columns[level],
            checked: false
        };
    }
    addExtensionMethods(columns);
    var result = groupByRecursive(items, columns);
    result.getLastItem = function () {
        var array = getArray(this);
        var lastIndex = array.length - 1;
        return array[lastIndex];
    };
    return result;
}

function EXISTEENCATALOGO(id, valor, campo) {
    campo = campo || "texto";
    var elementos = FormsBuilder.Catalogs.getAll().find('catalogo[id="{0}"]'.format(id)).find("elemento").filter(function () {
        return $(this).attr(campo).toLowerCase() == valor.toLowerCase();
    });
    return elementos.length > 0;
}
var busquedaCacheCatalogo = [];

function BUSCAR(id, columnPosition, value2return, columnValues, orderColumns) {
    var llaveCacheBusqueda = "{0}.{1}.{2}.{3}.{4}".format(id, columnPosition, value2return, columnValues, orderColumns);
    if (busquedaCacheCatalogo[llaveCacheBusqueda] != undefined) {
        return busquedaCacheCatalogo[llaveCacheBusqueda];
    }

    var value = null;
    var cumpleCondicion = false;

    var elementos = FormsBuilder.Catalogs.getAll().find('catalogo[id="{0}"]'.format(id)).find("elemento");

    if (!($.isArray(columnPosition)) && !($.isArray(columnValues))) {
        $.each(elementos, function (index, element) {
            if ($(element).attr(columnPosition) == columnValues)
                cumpleCondicion = true;
            else {
                cumpleCondicion = false;
                return;
            }

            if (cumpleCondicion) {
                value = $(element).attr(value2return);
                return;
            }
        });
    } else {
        $.each(elementos, function (eIndex, eElement) {
            $.each(columnPosition, function (cIndex, cValue) {
                if ($(eElement).attr(cValue) == columnValues[cIndex]) {
                    cumpleCondicion = true;
                } else {
                    cumpleCondicion = false;
                    return false;
                }
            });
            if (cumpleCondicion) {
                value = $(eElement).attr(value2return);
                return false;
            }
        });
    }

    if (IsNullOrEmpty(value) && $.isArray(orderColumns) && orderColumns.length > 0) {
        var itemsOrdered = groupByMany(elementos, orderColumns);
        var lastItem = itemsOrdered.getLastItem();
        value = $(lastItem).attr(value2return) || null;
    }
    busquedaCacheCatalogo[llaveCacheBusqueda] = value;
    return value;
}

function TabCuadroDetalle(event) {
    if ($.inArray(event.keyCode, [9, 13]) !== -1) {
        return;
    }
    event.preventDefault();
}

var DERECHA = "derecha";
var IZQUIERDA = "izquierda";

function AUTOCOMPLETAR(event, lenEnteros, lenDecimales) {
    RemoveZeros(event, false);
    var result = event.target.value;
    if (result.trim().length > 0) {
        var guiones = event.target.value.match(/[.]\d+/igm);
        if (guiones !== null) {
            if ((guiones[0].length - 1) < lenDecimales) {
                var diff = lenDecimales - (guiones[0].length - 1);
                var cadena = "";
                for (var i = 0; i < diff; i++) {
                    cadena += "0";
                }

                result += cadena;
            } else if ((guiones[0].length - 1) > lenDecimales) {
                var diff = (guiones[0].length - 1) - lenDecimales;
                for (var i = 0; i < diff; i++) {
                    result = result.slice(0, result.length - 1);
                }
            }

            if (new RegExp(/^[.]\d+/igm).test(result) === true) {
                result = "0" + result;
            }
        } else {
            var cadena = "";
            if (event.target.value.match(/[.]/igm) === null) {
                cadena = ".";
            }
            for (var i = 0; i < lenDecimales; i++) {
                cadena += "0";
            }

            result += cadena;
        }

        guiones = result.match(/\d+[.]/igm);
        if (guiones !== null) {
            if ((guiones[0].length - 1) > lenEnteros) {
                var diff = (guiones[0].length - 1) - lenEnteros;
                var temp = guiones[0];

                for (var i = 0; i <= diff; i++) {
                    temp = temp.slice(0, temp.length - 1);
                }

                result = temp + result.match(/[.]\d+/igm)[0];
            }
        }
    }
    event.target.value = result;
}

function AUTOCOMPLETARVALOR(valor, lenDecimales) {
    var result = valor;
    var guiones = valor.toString().match(/[.]\d+/igm);
    if (guiones !== null) {
        if ((guiones[0].length - 1) < lenDecimales) {
            var diff = lenDecimales - (guiones[0].length - 1);
            var cadena = "";
            for (var i = 0; i < diff; i++) {
                cadena += "0";
            }

            result += cadena;
        } else if ((guiones[0].length - 1) > lenDecimales) {
            var diff = (guiones[0].length - 1) - lenDecimales;
            for (var i = 0; i < diff; i++) {
                result = result.slice(0, result.length - 1);
            }
        }
    } else {
        var cadena = "";
        if (valor.toString().match(/[.]/igm) === null) {
            cadena = ".";
        }
        for (var i = 0; i < lenDecimales; i++) {
            cadena += "0";
        }

        result += cadena;
    }

    return result;
}

var regexDate = /^(((0[1-9]|[12]\d|3[01])\/(0[13578]|1[02])\/((19|[2-9]\d)\d{2}))|((0[1-9]|[12]\d|30)\/(0[13456789]|1[012])\/((19|[2-9]\d)\d{2}))|((0[1-9]|1\d|2[0-8])\/02\/((19|[2-9]\d)\d{2}))|(29\/02\/((1[6-9]|[2-9]\d)(0[48]|[2468][048]|[13579][26])|((16|[2468][048]|[3579][26])00))))$/g;
var regexDateFlat = /^((\d{2}((0[13578]|1[02])(0[1-9]|[12]\d|3[01])|(0[13456789]|1[012])(0[1-9]|[12]\d|30)|02(0[1-9]|1\d|2[0-8])))|([02468][048]|[13579][26])0229)$/g;

function VALIDARFECHA() {
    var stringDate = arguments[0];
    var pattern = new RegExp(regexDate);
    if (!pattern.test(stringDate) && !IsNullOrEmpty(stringDate)) {
        return false;
    }
    return true;
}

function Is_RfcDate() {
    var stringDate = arguments[0];
    var pattern = new RegExp(regexDateFlat);
    if (!pattern.test(stringDate) && !IsNullOrEmpty(stringDate)) {
        return false;
    }
    return true;
}

function ValidarFechaRFC(rfc) { //Solo fisicas
    var isRfc = RFCFISICASCOMPLETO(rfc) || RFCMORALES(rfc);
    var ret = 0;

    if (isRfc) {
        ret = 1;
        if (Is_RfcDate(rfc.substr(4, 6))) {
            ret = 2;
        }
        return ret;
    }
    return ret;
}

function ValidarFecha(event) {
    var cadena = event.target.value;

    var pattern = new RegExp(regexDate);
    if (!pattern.test(cadena) && !IsNullOrEmpty(cadena)) {
        $(event.target).addClass("sat-val-error");

        setTimeout(function () {
            $(event.target).popover("hide");
        }, 1000 * 6);

        $(event.target).popover({
            trigger: "manual",
            content: "La fecha no es válida",
            placement: "bottom"
        }).popover("show");
    } else {
        $(event.target).removeClass("sat-val-error");
    }
}

// function ValidarRFC(event) {
//     var cadena = event.target.value;

//     var pattern = new RegExp("^(([A-ZÑ&]{3})([0-9]{2})([0][13578]|[1][02])(([0][1-9]|[12][\\d])|[3][01])([A-Z0-9]{3}))|(([A-ZÑ&]{3})([0-9]{2})([0][13456789]|[1][012])(([0][1-9]|[12][\\d])|[3][0])([A-Z0-9]{3}))|(([A-ZÑ&]{3})([02468][048]|[13579][26])[0][2]([0][1-9]|[12][\\d])([A-Z0-9]{3}))|(([A-ZÑ&]{3})([0-9]{2})[0][2]([0][1-9]|[1][0-9]|[2][0-8])([A-Z0-9]{3}))$");
//     if (!pattern.test(cadena)) { }
// }

function CURP(cadena) {
    var pattern = new RegExp("^(([A-Z][A,E,I,O,U,X][A-Z]{2})([0-9]{2})([0][13578]|[1][02])(([0][1-9]|[12][\\d])|[3][01])([M,H][A-Z]{2}[B,C,D,F,G,H,J,K,L,M,N,Ñ,P,Q,R,S,T,V,W,X,Y,Z]{3}[0-9,A-Z][0-9]))|(([A-Z][A,E,I,O,U,X][A-Z]{2})([0-9]{2})([0][13456789]|[1][012])(([0][1-9]|[12][\\d])|[3][0])([M,H][A-Z]{2}[B,C,D,F,G,H,J,K,L,M,N,Ñ,P,Q,R,S,T,V,W,X,Y,Z]{3}[0-9,A-Z][0-9]))|(([A-Z][A,E,I,O,U,X][A-Z]{2})([02468][048]|[13579][26])[0][2]([0][1-9]|[12][\\d])([M,H][A-Z]{2}[B,C,D,F,G,H,J,K,L,M,N,Ñ,P,Q,R,S,T,V,W,X,Y,Z]{3}[0-9,A-Z][0-9]))|(([A-Z][A,E,I,O,U,X][A-Z]{2})([0-9]{2})[0][2]([0][1-9]|[1][0-9]|[2][0-8])([M,H][A-Z]{2}[B,C,D,F,G,H,J,K,L,M,N,Ñ,P,Q,R,S,T,V,W,X,Y,Z]{3}[0-9,A-Z][0-9]))$");
    if (!pattern.test(cadena)) {
        return false;
    } else {
        return true;
    }
}

function SoloMayusculas2(event) {
    event.target.value = event.target.value.toUpperCase();

    var cadena = event.target.value;

    var pattern = new RegExp("^(([A-ZÑ&]{3})([0-9]{2})([0][13578]|[1][02])(([0][1-9]|[12][\\d])|[3][01])([A-Z0-9]{3}))|(([A-ZÑ&]{3})([0-9]{2})([0][13456789]|[1][012])(([0][1-9]|[12][\\d])|[3][0])([A-Z0-9]{3}))|(([A-ZÑ&]{3})([02468][048]|[13579][26])[0][2]([0][1-9]|[12][\\d])([A-Z0-9]{3}))|(([A-ZÑ&]{3})([0-9]{2})[0][2]([0][1-9]|[1][0-9]|[2][0-8])([A-Z0-9]{3}))$");
    if (!pattern.test(cadena)) {
        $(event.target).addClass("sat-obligatorio");

        setTimeout(function () {
            $(event.target).popover("hide");
        }, 1000 * 6);

        $(event.target).popover({
            trigger: "manual",
            content: "No es un RFC válido",
            placement: "bottom"
        }).popover("show");

        event.target.value = "";
    } else {
        $(event.target).removeClass("sat-obligatorio");
    }

    event.target.value = event.target.value.replace(/^0+/g, "");
}

function SoloMayusculas(event) {
    event.target.value = event.target.value.toUpperCase();
    event.target.value = event.target.value.replace(/^0+/g, "");
}

function BloqueaEmoticons(event) {
    // console.log(event.keyCode);
    // if (isDeleteOrEscOrTabOrBackspaceOrEnterKey(event) || // Delete, Backspace, Tab, Esc, Enter
    //     isCtrl_ACombinationKeys(event) || // Ctrl - a combination Keys
    //     isFunctionOrDirectionKey(event)//Function Keys, Directions Keys
    //         ) {
    //     return;
    // } 
    // else {
    if ((event.keyCode >= 48 && event.keyCode <= 90)) // Is 0-9 Numeric Pad
    {
        event.preventDefault();
    }
    // }
}

function SoloMayusculasCompensaciones(event) {
    event.target.value = event.target.value.toUpperCase();
}

//Encargada de convertir una cadena desde diversos formatos a tipo Date.
//Siempre retorna una fecha, en caso de ser invalida la cadena de entrada regresa la fecha minima
function FECHA(fecha) {
    if (IsNullOrEmptyWhite(fecha)) {
        return fbUtils.getDateMin();
    }
    var date;
    try {
        var formatISO = "yyyy-MM-ddTHH:mm:ssZ";
        var formatISOWithouTimeZone = "yyyy-MM-ddTHH:mm:ss";
        var formatDateOnly = "d/M/yyyy";
        date = Date.parseExact(fecha, [formatISO, formatDateOnly, formatISOWithouTimeZone]);
        if (fecha.split(".")[1] !== undefined && date === null) {
            fecha = fecha.split(".")[0];
            date = Date.parseExact(fecha, [formatISOWithouTimeZone]);
        }

        if (date === null || isNaN(date.getDate())) {
            return fbUtils.getDateMin();
        } else {
            return date;
        }
    } catch (err) {
        return fbUtils.getDateMin();
    }
}

function RFCMORALES(rfc) {
    var pattern = new RegExp("^(([A-ZÑ&]{3})([0-9]{2})([0][13578]|[1][02])(([0][1-9]|[12][\\d])|[3][01])([A-Z0-9]{3}))|(([A-ZÑ&]{3})([0-9]{2})([0][13456789]|[1][012])(([0][1-9]|[12][\\d])|[3][0])([A-Z0-9]{3}))|(([A-ZÑ&]{3})([02468][048]|[13579][26])[0][2]([0][1-9]|[12][\\d])([A-Z0-9]{3}))|(([A-ZÑ&]{3})([0-9]{2})[0][2]([0][1-9]|[1][0-9]|[2][0-8])([A-Z0-9]{3}))$");
    if (!pattern.test(rfc)) {
        return false;
    } else {
        return true;
    }
}

function RFCFISICASCOMPLETO(rfc) {
    var pattern = new RegExp("^(([A-ZÑ&]{4})([0-9]{2})([0][13578]|[1][02])(([0][1-9]|[12][\\d])|[3][01])([A-Z0-9]{3}))|(([A-ZÑ&]{4})([0-9]{2})([0][13456789]|[1][012])(([0][1-9]|[12][\\d])|[3][0])([A-Z0-9]{3}))|(([A-ZÑ&]{4})([02468][048]|[13579][26])[0][2]([0][1-9]|[12][\\d])([A-Z0-9]{3}))|(([A-ZÑ&]{4})([0-9]{2})[0][2]([0][1-9]|[1][0-9]|[2][0-8])([A-Z0-9]{3}))$");
    if (!pattern.test(rfc)) {
        return false;
    } else {
        return true;
    }
}

function RFCFISICASSINHOMOCLAVE(rfc) {
    var pattern = new RegExp("^[A-Za-z]{4}[0-9]{6}");
    if (!pattern.test(rfc)) {
        return false;
    } else {
        return true;
    }
}

function RFCVALIDOACLAVEUSUARIOINICIA(rfc) {
    var rfClaveUsuarioInicia = "";

    symToVal("$39");
    rfClaveUsuarioInicia = $39;

    if (rfc !== rfClaveUsuarioInicia) {
        return true;
    } else {
        return false;
    }
}

function RemoveZeros(event, numerosNegativos) {
    if ($(event.target).attr("capturaDecimales") === undefined) {
        if (event.target.value.length > 1) {
            var zerosSearch = event.target.value.match(/^0+/g);
            if (zerosSearch !== null) {
                if (event.target.value.length === zerosSearch[0].length) {
                    event.target.value = "0";
                } else {
                    // Modificacion para Morales
                    event.target.value = event.target.value.replace(/^0+/g, "0");
                }
            }
        }

        var numerosNegativosSearch = event.target.value.match(/[-]/);
        if (numerosNegativosSearch !== null) {
            if (numerosNegativosSearch.length > 0) {
                if (event.target.value.indexOf("-") !== 0) {
                    event.target.value = event.target.value.replace(/[-]/, "");
                }
            }
        }
    } else {
        var numerosNegativosSearch = event.target.value.match(/[-]/);
        if (numerosNegativosSearch !== null) {
            if (numerosNegativosSearch.length > 0) {
                if (event.target.value.indexOf("-") !== 0) {
                    event.target.value = event.target.value.replace(/[-]/, "");
                }
            }
        }

        if (event.target.value.length > 1) {
            var zerosSearch = event.target.value.match(/^0+/g);
            if (zerosSearch !== null) {
                if (event.target.value.length === zerosSearch[0].length) {
                    event.target.value = "0";
                } else {
                    // Modificacion para Morales
                    event.target.value = event.target.value.replace(/^0+/g, "0");
                }
            }
        }
        if (event.target.value.match(/[.]/igm) !== null) {
            var decimales = event.target.value.substring(event.target.value.indexOf(".") + 1, event.target.value.length);
            var comparador = decimales.length === 2 ? 51 : 6;

            var numeroNegativo = parseFloat(event.target.value) < 0;

            if (parseInt(decimales) >= comparador) {
                event.target.value = numeroNegativo ? Math.floor(event.target.value) : Math.ceil(event.target.value);
            } else {
                event.target.value = numeroNegativo ? Math.ceil(event.target.value) : Math.floor(event.target.value);
            }
        }

        if (isNaN(event.target.value)) {
            event.target.value = "";
        }
    }
}

var isDeleteOrEscOrTabOrBackspaceOrEnterKey = function (event) {
    return $.inArray(event.keyCode, [46, 8, 9, 27, 13]) !== -1;
};
var isFunctionOrDirectionKey = function (event) {
    return (event.keyCode >= 35 && event.keyCode <= 39);
};
var isNotNumberKey = function (event) {
    return (event.keyCode < 48 || event.keyCode > 57);
};
var isNotNumericPadKey = function (event) {
    return (event.keyCode < 96 || event.keyCode > 105);
};
var isDecimalPointKey = function (event) {
    return (event.keyCode == 110);
};
var isPointKey = function (event) {
    return (!event.shiftKey && event.keyCode == 190);
};
var isSuprKey = function (event) {
    return event.keyCode === 46;
};
var isMinusKey = function (event) {
    return (event.keyCode == 109);
};
var isDashKey = function (event) {
    return (event.keyCode == 189);
};
var isSemiColonKey = function (event) {
    return event.keyCode == 186;
};
var isCtrl_ACombinationKeys = function (event) {
    return (event.keyCode == 65 && event.ctrlKey === true);
};
var isAlt_CombinationKeys = function (event) {
    return (event.keyCode == 96);
};
var isEnterKey = function (event) {
    return event.keyCode == 45;
};
var MaxDecimales = 2;

function SoloNumerosDecimales(event) {
    var cadena = (event.target.value || "") + (isPointKey(event) || isDecimalPointKey(event) ? "." : isSuprKey(event) ? "" : String.fromCharCode(event.keyCode));
    var points = cadena.match(/[.]/igm);
    if (points !== null) {
        if (points.length > 1) {
            preventDefaultEvent(event);
        }
    }

    if (isDeleteOrEscOrTabOrBackspaceOrEnterKey(event) ||
        isDecimalPointKey(event) ||
        isPointKey(event) ||
        isCtrl_ACombinationKeys(event) ||
        isFunctionOrDirectionKey(event)) {
        return;
    } else {
        if (event.shiftKey || isNotNumberKey(event) && isNotNumericPadKey(event)) {
            preventDefaultEvent(event);
        }
    }
}

function DeshabilitarCero(event) {
    event = event || window.event;
    var character = (event.target.value || "") + (String.fromCharCode(event.keyCode));
    var value = parseFloat(character);
    if (value == 0) {
        event.target.value = "";
        $(event.target).change();
    }
}

function SoloNumerosPositivos(event) {
    event = event || window.event;
    var noCapturaDecimales = $(event.target).attr("capturaDecimales") === undefined;

    if (noCapturaDecimales) {
        if (isSemiColonKey(event)) {
            preventDefaultEvent(event);
        }

        if (isDeleteOrEscOrTabOrBackspaceOrEnterKey(event) || // Delete, Backspace, Tab, Esc, Enter
            isCtrl_ACombinationKeys(event) || // Ctrl - a combination Keys
            isFunctionOrDirectionKey(event) //Function Keys, Directions Keys
        ) {
            return;
        } else {
            if (event.shiftKey ||
                isNotNumberKey(event) && // Is 0-9
                isNotNumericPadKey(event)) // Is 0-9 Numeric Pad
            {
                preventDefaultEvent(event);
            }
        }
    } else {
        var character = (event.target.value || "") + (isPointKey(event) || isDecimalPointKey(event) ? "." : String.fromCharCode(event.keyCode));
        var guiones = character.match(/[.]/igm);
        if (guiones !== null) {
            if (guiones.length > 1) {
                preventDefaultEvent(event);
            }

            var decimales = character.substring(character.indexOf(".") + 1, character.length);
            if (decimales.toString().length > MaxDecimales) {
                if (isDeleteOrEscOrTabOrBackspaceOrEnterKey(event) || // Delete, Backspace, Tab, Esc, Enter keys
                    isDecimalPointKey(event) || // Decimal Point Key
                    isPointKey(event) || // Point Key
                    isCtrl_ACombinationKeys(event) || // Ctrl - a combination keys
                    isFunctionOrDirectionKey(event)) { //Function Keys, Directions Keys
                    return;
                }
                preventDefaultEvent(event);
            }
        }

        if (isDeleteOrEscOrTabOrBackspaceOrEnterKey(event) ||
            isDecimalPointKey(event) ||
            isPointKey(event) ||
            isCtrl_ACombinationKeys(event) ||
            isFunctionOrDirectionKey(event)) {
            return;
        } else {
            if (event.shiftKey || isNotNumberKey(event) && isNotNumericPadKey(event)) {
                preventDefaultEvent(event);
            }
        }
    }
}

function SoloNumerosNegativos(event) {
    event = event || window.event;
    var noCapturaDecimales = $(event.target).attr("capturaDecimales") === undefined;
    var character, guiones, points;
    if (noCapturaDecimales) {
        character = (event.target.value || "") + (isDashKey(event) || isMinusKey(event) ? "-" : String.fromCharCode(event.keyCode));
        guiones = character.match(/[-]/igm);
        if (guiones !== null) {
            if (guiones.length === 1 && character.indexOf("-") !== 0) {
                preventDefaultEvent(event);
            }
            if (guiones.length > 1) {
                if (!character.match(/^-\d+$/)) {
                    preventDefaultEvent(event);
                }
            }
        }
        if (isDeleteOrEscOrTabOrBackspaceOrEnterKey(event) || // Delete, Backspace, Tab, Esc, Enter Keys
            isMinusKey(event) || // Minus Key
            isDashKey(event) || // Dash Key
            isCtrl_ACombinationKeys(event) ||
            isFunctionOrDirectionKey(event)) // Function Keys and Direction
        {
            return;
        } else {
            if (event.shiftKey ||
                isNotNumberKey(event) && // 0-9
                isNotNumericPadKey(event)) // 0-9 Numeric Pad
            {
                preventDefaultEvent(event);
            }
        }
    } else {
        character = (event.target.value || "");
        if (isPointKey(event) || isDecimalPointKey(event)) {
            character += ".";
        }
        if (isMinusKey(event) || isDashKey(event)) {
            character += "-";
        } else {
            character += String.fromCharCode(event.keyCode);
        }
        points = character.match(/[.]/igm);
        guiones = character.match(/[-]/igm);
        if (guiones !== null) {
            if (guiones.length > 1) {
                if (!character.match(/^-\d+$/)) {
                    preventDefaultEvent(event);
                }
            }
        }
        if (points !== null) {
            if (points.length > 1) {
                preventDefaultEvent(event);
            }

            var decimales = character.substring(character.indexOf(".") + 1, character.length);
            if (decimales.toString().length > MaxDecimales) {

                if (isDeleteOrEscOrTabOrBackspaceOrEnterKey(event) || // Delete, Backspace, Tab, Esc, Enter keys
                    isDecimalPointKey(event) || // Decimal Point Key
                    isPointKey(event) || // Point Key
                    isMinusKey(event) || // Minus Key
                    isDashKey(event) || // Dash Key
                    isCtrl_ACombinationKeys(event) || // Ctrl - a combination keys
                    isFunctionOrDirectionKey(event)) { //Function Keys, Directions Keys
                    return;
                }
                preventDefaultEvent(event);
            }
        }
        if (isDeleteOrEscOrTabOrBackspaceOrEnterKey(event) ||
            isDecimalPointKey(event) ||
            isPointKey(event) ||
            isMinusKey(event) ||
            isDashKey(event) ||
            isCtrl_ACombinationKeys(event) ||
            isFunctionOrDirectionKey(event)) {
            return;
        } else {
            if (event.shiftKey ||
                isNotNumberKey(event) &&
                isNotNumericPadKey(event)) {
                preventDefaultEvent(event);
            }
        }
    }
}

function isDateEmpty(value) {
    if ("__/__/____" === value) {
        return true;
    }
    return false;
}

function OmitirSimulateKeys(event) {
    event = event || window.event;
    if (event.keyCode == 186) {
        preventDefaultEvent(event);
    }

    if (isDeleteOrEscOrTabOrBackspaceOrEnterKey(event) || // Delete, Backspace, Tab, Esc, Enter
        isCtrl_ACombinationKeys(event) ||
        isEnterKey(event) ||
        (isFunctionOrDirectionKey(event) && // Function Keys, Directions Keys
            !IsNullOrEmpty(event.keyIdentifier))
    ) {
        return;
    } else {
        if (isAlt_CombinationKeys(event) ||
            event.shiftKey ||
            isNotNumberKey(event) && // Is 0-9
            (isNotNumericPadKey(event) || IsNullOrEmpty(event.keyIdentifier)) // Is 0-9 Numeric Pad
        ) {
            preventDefaultEvent(event);
        }
    }
}

var VERDADERO = true;
var FALSO = false;

function MAX() {
    return Math.max.apply(null, arguments);
}

function MIN() {
    return Math.min.apply(null, arguments);
}

function MAXCONDICIONADO() {
    return minMaxCondicionado(arguments, CONST_ACCION_MAX);
}

function MINCONDICIONADO() {
    return minMaxCondicionado(arguments, CONST_ACCION_MIN);
}

function minMaxCondicionado(parametros, accion) {
    parametros[0] = parametros[0].toString().replace(/[,](?!.*[,])/, "|");
    var exprs = parametros[0].toString().split("|");
    var valores = [];
    var maxMin = 0;

    if (exprs.length == 2) {
        try {
            var detalleGrid = FormsBuilder.ViewModel.getDetalleGrid();
            var symbol = exprs[1];

            var rl = FormsBuilder.ViewModel.getFieldsForExprsGrid()[symbol];
            if (rl !== undefined) {
                var db_id = "E{0}P{1}".format(rl.entidad, rl.propiedad);

                if (exprs[0].split("_").length === 2) {
                    exprs[0] = exprs[0].replace(/_[0-9]+/igm, "");
                }

                if (detalleGrid[rl.entidad] !== undefined) {
                    var detalleEntidad = detalleGrid[rl.entidad];
                    for (var i = 0; i < detalleEntidad.length; i++) {
                        var detalleFila = detalleEntidad[i];
                        if (!detalleFila["editando"] && detalleFila[db_id]) {
                            var definicion = exprs[0];
                            var resultEval = FormsBuilder.Runtime.evaluateGrid(definicion, i);
                            if (resultEval === true) {
                                if (detalleFila[db_id] && !isNaN(detalleFila[db_id])) {
                                    var valor = parseFloat(detalleFila[db_id]);
                                    if (!isNaN(valor)) {
                                        valores.push(valor);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } catch (err) {
            console.log(err.message + "\n" + err.stack);
        }
    } else {
        var detalleGrid = FormsBuilder.ViewModel.getDetalleGrid();
        var symbol = parametros[0];

        var rl = FormsBuilder.ViewModel.getFieldsForExprs()[symbol];
        if (rl !== undefined) {
            var db_id = "E{0}P{1}".format(rl.entidad, rl.propiedad);

            if (detalleGrid[rl.entidad] !== undefined) {
                var detalleEntidad = detalleGrid[rl.entidad];
                for (var i = 0; i < detalleEntidad.length; i++) {
                    var detalleFila = detalleEntidad[i];
                    if (!detalleFila["editando"] && detalleFila[db_id]) {
                        var valor = parseFloat(detalleFila[db_id]);
                        if (!isNaN(valor)) {
                            valores.push(valor);
                        }
                    }
                }
            }
        }
    }

    if (valores.length > 0) {
        if (accion === CONST_ACCION_MIN) {
            maxMin = Enumerable.From(valores).Min();
        } else if (accion === CONST_ACCION_MAX) {
            maxMin = Enumerable.From(valores).Max();
        }

        symToVal(exprs[0]);
    }

    return maxMin;
}

function OBTENERANIO() {
    var value = arguments[0];
    try {
        var date = FECHA(value);
        if (date) {
            return date.getFullYear();
        } else {
            return undefined;
        }
    } catch (err) {
        console.error("No se pudo recuperar el año");
    }
}

function OBTENERMES() {
    var value = arguments[0];
    try {
        var date = FECHA(value);
        if (date) {

            return date.getMonth() + 1;
        } else {
            return undefined;
        }
    } catch (err) {
        console.log("No se pudo recuperar el mes");
    }
}

function OBTENERDIA() {
    var value = arguments[0];
    try {
        var date = FECHA(value);
        if (date) {

            return date.getDay() + 1;
        } else {
            return undefined;
        }
    } catch (err) {
        console.log("No se pudo recuperar el dia");
    }
}

function ESNULO() {
    var rule = FormsBuilder.ViewModel.getFieldsForExprs()[arguments[0]];

    if (rule !== undefined) {
        var db_id = "E{0}P{1}".format(rule.entidad, rule.propiedad);
        var value = FormsBuilder.ViewModel.get()[(db_id.split("P")[0]).replace("E", "")][db_id]();

        if (isDateEmpty(value)) {
            return true;
        }

        return IsNullOrEmpty(value);
    }

    return true;
}

function ESNULOGRID() {
    var result = true;

    var rule = FormsBuilder.ViewModel.getFieldsForExprsGrid()[arguments[0]];
    if (rule !== undefined) {
        var db_id = "E{0}P{1}".format(rule.entidad, rule.propiedad);
        var value;
        var detalleGrid = FormsBuilder.ViewModel.getDetalleGrid()[(db_id.split("P")[0]).replace("E", "")];
        for (var indexDetalle in detalleGrid) {
            if (detalleGrid[indexDetalle][db_id] !== undefined) {
                value = detalleGrid[indexDetalle][db_id]();
            }
        }
        result = IsNullOrEmpty(value);
    }


    return result;
}

function PARTEACTUALIZADA(lanzadorRegla) {
    if (lanzadorRegla <= 0) return 0;

    var rule = FormsBuilder.ViewModel.getFieldsForExprs()["$28"];
    var db_id = "E{0}P{1}".format(rule.entidad, rule.propiedad);

    var fo = FECHA(FormsBuilder.ViewModel.get()[fbUtils.getEntidad(db_id)][db_id]().trim());

    rule = FormsBuilder.ViewModel.getFieldsForExprs()["$38"];
    db_id = "E{0}P{1}".format(rule.entidad, rule.propiedad);

    var fc = FECHA(FormsBuilder.ViewModel.get()[fbUtils.getEntidad(db_id)][db_id]().trim());

    if (fo > fc) {
        return 0;
    }

    var inpco = ObtenerINPC(fo);
    var inpcc = ObtenerINPC(fc);
    var ic = lanzadorRegla;

    var fa = 0;
    if (!((inpcc / inpco) < 1)) {
        fa = (inpcc / inpco) - 1;
    }

    var faStr = String(fa);
    if (faStr.indexOf(".") !== -1) {
        if (faStr.substring(faStr.indexOf(".") + 1, faStr.length).length > 4) {
            fa = parseFloat(faStr.substring(0, faStr.indexOf(".")) + "." + faStr.substring(faStr.indexOf(".") + 1, faStr.length).substring(0, 4));
        }
    }

    var ia = ic * fa;
    ia = REDONDEARSAT(ia);

    return ia;
}

function RECARGOS(lanzadorRegla) {
    if (lanzadorRegla <= 0) return 0;

    var rule = FormsBuilder.ViewModel.getFieldsForExprs()["$28"];
    var db_id = "E{0}P{1}".format(rule.entidad, rule.propiedad);

    var fo = FECHA(FormsBuilder.ViewModel.get()[(db_id.split("P")[0]).replace("E", "")][db_id]().trim());

    rule = FormsBuilder.ViewModel.getFieldsForExprs()["$38"];
    db_id = "E{0}P{1}".format(rule.entidad, rule.propiedad);

    var fc = FECHA(FormsBuilder.ViewModel.get()[(db_id.split("P")[0]).replace("E", "")][db_id]().trim());
    //fc = new Date(fc.getFullYear(), fc.getMonth(), fc.getDate()); // se quita ya que se manda sin horas desde el servidor
    if (fo >= fc) {
        return 0;
    }

    var ia = PARTEACTUALIZADA(lanzadorRegla);
    var ic = lanzadorRegla;

    var foAnio = fo.getFullYear();
    var fcAnio = fc.getFullYear();

    var foDia = fo.getDate();
    var fcDia = fc.getDate();
    var tasas = [];

    if (fcDia <= foDia) {
        if (foAnio === fcAnio) {
            var meses = FormsBuilder.Catalogs.getCatalog("TasaRecargos").find('elemento[anio="{0}"]'.format(foAnio)).sort(function (a, b) {
                var a1 = parseInt($(a).attr("mes"));
                var b1 = parseInt($(b).attr("mes"));

                if (a1 === b1) return 0;
                return a1 > b1 ? 1 : -1;
            });

            if (meses.length > 0) {
                var mesInicial = fo.getMonth();
                var mesFinal = fc.getMonth();

                var x = mesFinal;
                while (x-- && x >= mesInicial) {
                    if ($(meses[x]) !== undefined && $(meses[x]).attr("tasa") !== undefined) {
                        tasas.push(parseFloat($(meses[x]).attr("tasa")));
                    }
                }
            }
        } else if (fcAnio > foAnio) {
            var mesInicial = fo.getMonth();
            var mesFinal = fc.getMonth();

            var anio = fcAnio + 1;
            while (anio-- && anio >= foAnio) {
                var meses = FormsBuilder.Catalogs.getCatalog("TasaRecargos").find('elemento[anio="{0}"]'.format(anio)).sort(function (a, b) {
                    var a1 = parseInt($(a).attr("mes"));
                    var b1 = parseInt($(b).attr("mes"));

                    if (a1 === b1) return 0;
                    return a1 > b1 ? 1 : -1;
                });

                var x = meses.length;
                if (x > 0) {
                    while (x--) {
                        if (anio === (fcAnio)) {
                            if (x < mesFinal) {
                                if ($(meses[x]) !== undefined) {
                                    if (tasas.length < 60)
                                        tasas.push(parseFloat($(meses[x]).attr("tasa")));
                                }
                            }
                        } else if (anio === foAnio) {
                            if (x >= mesInicial) {
                                if ($(meses[x]) !== undefined) {
                                    if (tasas.length < 60)
                                        tasas.push(parseFloat($(meses[x]).attr("tasa")));
                                }
                            }
                        } else {
                            if ($(meses[x]) !== undefined) {
                                if (tasas.length < 60)
                                    tasas.push(parseFloat($(meses[x]).attr("tasa")));
                            }
                        }
                    }
                }
            }
        }
    } else if (fcDia > foDia) {
        if (foAnio === fcAnio) {
            var meses = FormsBuilder.Catalogs.getCatalog("TasaRecargos").find('elemento[anio="{0}"]'.format(foAnio)).sort(function (a, b) {
                var a1 = parseInt($(a).attr("mes"));
                var b1 = parseInt($(b).attr("mes"));

                if (a1 === b1) return 0;
                return a1 > b1 ? 1 : -1;
            });

            if (meses.length > 0) {
                var mesInicial = fo.getMonth();
                var mesFinal = fc.getMonth() + 1;

                var x = mesFinal;
                while (x-- && x >= mesInicial) {
                    if ($(meses[x]) !== undefined && $(meses[x]).attr("tasa") !== undefined) {
                        tasas.push(parseFloat($(meses[x]).attr("tasa")));
                    }
                }
            }
        } else if (fcAnio > foAnio) {
            var mesInicial = fo.getMonth();
            var mesFinal = fc.getMonth() + 1;

            var anio = fcAnio + 1;
            while (anio-- && anio >= foAnio) {
                var meses = FormsBuilder.Catalogs.getCatalog("TasaRecargos").find('elemento[anio="{0}"]'.format(anio)).sort(function (a, b) {
                    var a1 = parseInt($(a).attr("mes"));
                    var b1 = parseInt($(b).attr("mes"));

                    if (a1 === b1) return 0;
                    return a1 > b1 ? 1 : -1;
                });

                var x = meses.length;
                if (x > 0) {
                    while (x--) {
                        if (anio === (fcAnio)) {
                            if (x < mesFinal) {
                                if ($(meses[x]) !== undefined) {
                                    if (tasas.length < 60)
                                        tasas.push(parseFloat($(meses[x]).attr("tasa")));
                                }
                            }
                        } else if (anio === foAnio) {
                            if (x >= mesInicial) {
                                if ($(meses[x]) !== undefined) {
                                    if (tasas.length < 60)
                                        tasas.push(parseFloat($(meses[x]).attr("tasa")));
                                }
                            }
                        } else {
                            if ($(meses[x]) !== undefined) {
                                if (tasas.length < 60)
                                    tasas.push(parseFloat($(meses[x]).attr("tasa")));
                            }
                        }
                    }
                }
            }
        }
    }

    var ixs = 0;
    if (tasas.length === 0) {
        var ultimaTasa = FormsBuilder.Catalogs.getCatalog("TasaRecargos").find("elemento:last");
        ixs = parseFloat(ultimaTasa.attr("tasa"));
    }
    $.each(tasas, function (key, tasa) {
        ixs += tasa;
    });

    var ir = (ic + ia) * (ixs);
    ir = REDONDEARSAT(ir);

    return ir;
}

var cacheExisteSubRegimen = [];

function EXISTESUBREGIMEN(regimenId) {
    if (cacheExisteSubRegimen[regimenId] != undefined) {
        return cacheExisteSubRegimen[regimenId];
    }
    var regimen = null,
        catalogSubRegimenes = null;
    var existe = false;
    try {
        if (!IsNullOrEmpty(FormsBuilder.XMLForm.getCopyPrecarga())) {
            catalogSubRegimenes = FormsBuilder.XMLForm.getCopyPrecarga();
        } else {
            catalogSubRegimenes = FormsBuilder.XMLForm.getCopyDeclaracion();
        }
        regimen = catalogSubRegimenes.find("SubRegimenes Catalogo").filter(function () {
            return $("IdCatalogo", this).text() === regimenId;
        }).find("Descripcion").text();
        existe = !IsNullOrEmpty(regimen);
        cacheExisteSubRegimen[regimenId] = existe;
        return existe;
    } catch (e) {
        console.log("Catalogos de subregimenes not found!!");
    }
}

function CONTARSUBREGIMENES() {
    var subregimenes = 0,
        catalogSubRegimenes = null;
    try {
        if (!IsNullOrEmpty(FormsBuilder.XMLForm.getCopyPrecarga())) {
            catalogSubRegimenes = FormsBuilder.XMLForm.getCopyPrecarga();
        } else {
            catalogSubRegimenes = FormsBuilder.XMLForm.getCopyDeclaracion();
        }

        if (catalogSubRegimenes) {
            subregimenes = catalogSubRegimenes.find("SubRegimenes Catalogo").length;
        }
    } catch (e) {
        console.log("Catalogos de subregimenes not found!!");
    }

    return subregimenes;
}

function DIGITOVERIFICADOR(RFC) {
    if (RFC.length === 12)
        RFC = " " + RFC;

    var base = 13;
    var dv = 0;
    for (var index = 0; index < RFC.length - 1; index++) {
        var numAscii = RFC.charCodeAt(index);

        if (numAscii >= 65 && numAscii <= 78) // De la A a la N
        {
            numAscii = numAscii - 55;
        } else if (numAscii >= 79 && numAscii <= 90) //De la O a la Z
        {
            numAscii = numAscii - 54;
        } else if (numAscii >= 48 && numAscii <= 57) //Del 0 al 9
        {
            numAscii = numAscii - 48;
        } else if (numAscii == 38) //& == Ñ
        {
            numAscii = 24;
        } else if (numAscii == 32) //ESPACIO
        {
            numAscii = 37;
        } else if (RFC[index] == "Ñ") {
            numAscii = 38;
        } else {
            numAscii = 0;
        }

        dv = dv + (numAscii * (base - index)); //Empieza en 13,12,11,10,9,...,2
    }

    dv = dv % 11;

    if (dv > 0) {
        if (dv == 1) {
            return "A";
        } else {
            return String.fromCharCode((11 - dv) + 48);
        }
    } else {
        return "0";
    }
}

var Tipo = "F"; // TODO: Modificar para que sea dinamico F o M
var i_RfcError = -1;
var Val10 = true;

function Verf_rfc_FM(event, tipo) {
    event.target.value = event.target.value.toUpperCase();
    event.target.value = event.target.value.replace(/^0+/g, "");

    Tipo = tipo;

    var s_TrimedRfc = event.target.value;

    // Tipo puede ser F o M
    var msg;
    var Verf_rfc_FM_Result = Verf_rfc_FM0(s_TrimedRfc);
    console.log(i_RfcError);

    if (i_RfcError === 6 || i_RfcError === 13) // se quito la validacion 13 ya que esta nueva version no permite ingresar espacios
        Verf_rfc_FM_Result = true;

    if (Verf_rfc_FM_Result)
        return Verf_rfc_FM_Result;

    switch (i_RfcError) {
        case 1:
            msg = "El RFC está incompleto";
            break;

        case 3:
            msg = "La fecha del RFC no es válida, verificar el formato de fecha. (aammdd)";
            break;

        case 5:
            msg = "Homoclave incompleta, verificar";
            break;

        case 7:
            msg = "Falta la homoclave del RFC";
            break;

        case 10:
            msg = "Los cuatro primeros caracteres deben ser letras";
            break;

        case 11:
            msg = "El primer caracter es incorrecto";
            break;

        case 12:
            msg = "El primer caracter es incorrecto";
            break;

        case 13:
            msg = "El primer caracter debe ser un espacio";
            break;

        case 14:
            msg = "Hay un error en la parte alfabética";
            break;

        case 15:
            msg = "Hay un error en la parte alfabética";
            break;
    }

    $("#modalSeccion .modal-body").html(msg);
    setTimeout(function () {
        $("#modalSeccion").modal("show");
    }, 1000);

    return Verf_rfc_FM_Result;
}

function Verf_rfc_FM0(s_TrimedRfc) {
    // Tipo puede ser F o M
    var rfc_FechaNac; // Cadena que contiene la fecha de nacimiento
    //var s_criterio; // Criterio de busqueda en la tabla tContribuyentes
    var i;
    //var Ya;
    // Verf_rfc_FM0 = false;
    i_RfcError = 0;
    //Ya = 0;
    // Verifica que se haya introducido el patrón ???######

    if (s_TrimedRfc.trim().length === 0) {
        i_RfcError = 6;
        return;
    }

    if (Tipo === "A") {
        if (s_TrimedRfc.trim().length < 12) {
            i_RfcError = 1;
            return;
        }

        if (s_TrimedRfc.trim().length === 12) {
            var esFisica = true;
            for (i = 0; i < 4; i++) {
                if (s_TrimedRfc.substr(i, 1).match(/[A-ZÑ& ]/) === null) {
                    esFisica = false;
                }
            }
            console.log(esFisica);
            if (esFisica) {
                i_RfcError = 1;
                return;
            }
            Tipo = "M";
        }

        if (s_TrimedRfc.trim().length === 13) {
            Tipo = "F";
        }
    }

    for (i = 0; i < 4; i++) {
        if (i === 0) {
            if (Tipo === "A") {
                // Para AMBOS
                if (s_TrimedRfc.substr(i, 1).match(/[A-ZÑ& ]/) === null) {
                    if (s_TrimedRfc.substr(0, 4) === "9999") {
                        i_RfcError = 10;
                        return;
                    }
                    i_RfcError = 11;
                    return;
                }
            } else if (Tipo === "F") {
                // Para P.Fisicas
                if (s_TrimedRfc.substr(i, 1).match(/[A-ZÑ&]/) === null) {
                    i_RfcError = 12;
                    return;
                }
            } else if (Tipo === "M") {
                // Para P.Morales
                // if (s_TrimedRfc.substr(i, 1).match(/[ ]/) === null) {
                //     i_RfcError = 13;
                //     return;
                // }
            }
        } else if (i > 0 && i < 4) {
            if (Tipo === "F" || (Tipo === "A" && s_TrimedRfc.substr(0, 1) !== " ")) {
                if (s_TrimedRfc.substr(i, 1).match(/[A-ZÑ&]/) === null) {
                    i_RfcError = 14;
                    return;
                }
            } else if ((Tipo === "M" || (Tipo === "A" && s_TrimedRfc.substr(0, 1) !== " ")) && i < 3) {
                if (s_TrimedRfc.substr(i, 1).match(/[A-ZÑ&]/) === null) {
                    i_RfcError = 15;
                    return;
                }
            }
        }
    }

    // Verifica que se haya introducido un rfc completo
    if (Tipo === "F" || (Tipo === "A") && s_TrimedRfc.substr(0, 1) !== " ") {
        if (s_TrimedRfc.length > 10 && s_TrimedRfc.length < 13) {
            i_RfcError = 5;
            return;
        } else if (Val10 && s_TrimedRfc.length === 10) {
            i_RfcError = 7;
            return;
        } else if (s_TrimedRfc.length < 10) {
            i_RfcError = 1;
            return;
        }
    } else if (Tipo === "M" || (Tipo === "A") && s_TrimedRfc.substr(0, 1) !== " ") {
        // if (s_TrimedRfc.length !== 13) {
        //     i_RfcError = 1;
        //     return;
        // }
    }

    // Verifica que los 6 digitos despúes de los primeros 4 caracteres correspondan a una fecha
    if (Tipo === "F") {
        rfc_FechaNac = s_TrimedRfc.substr(4, 6);
        if (!Is_RfcDate(rfc_FechaNac)) {
            i_RfcError = 3;
            return i_RfcError;
        }
    } else if (Tipo === "M") {
        rfc_FechaNac = s_TrimedRfc.substr(3, 6);
        if (!Is_RfcDate(rfc_FechaNac)) {
            i_RfcError = 3;
            return i_RfcError;
        }
    }

    // SARR 21/1/2005 valida el dígito verificador
    if (s_TrimedRfc.length !== 10) {
        var dig;
        var digReal;

        var anteriorRFC;

        dig = DIGITOVERIFICADOR(s_TrimedRfc);
        digReal = s_TrimedRfc.substr(12, 1);

        if (dig !== digReal) {
            if (anteriorRFC !== s_TrimedRfc) {
                //var resDialog = true; // Preguntar de donde se inserta anteriorRFC
                // console.log("El verificador (último caracter) del RFC '" + s_TrimedRfc + "' parece erróneo, dice " + digReal + " y debería decir " + dig + "¿Proseguir con ese RFC pese a esta discrepancia?");
                // if (resDialog) {
                //     anteriorRFC = s_TrimedRfc
                // } else {
                //     i_RfcError = 20;
                //     return;
                // }
            }
        }
    }

    return true;
}

function VALIDARDIGITOVERIFICADOR(rfc) {
    var dig;
    var digReal;

    dig = DIGITOVERIFICADOR(rfc);
    digReal = rfc.substr(rfc.length - 1, 1);

    return dig === digReal;
}

function ESCLABE(clabeStr) {
    var rl = FormsBuilder.ViewModel.getFieldsForExprs()[clabeStr];
    var db_id = "E{0}P{1}".format(rl.entidad, rl.propiedad);

    var clabe = FormsBuilder.ViewModel.get()[rl.entidad][db_id]();

    var codigoVerificador = 0,
        diez = 10;

    for (var i = 0; i < clabe.length - 1; i = i + 3) {
        var charCode = parseInt(clabe[i]);
        codigoVerificador = codigoVerificador + ((charCode * 3) % 10);

        charCode = parseInt(clabe[i + 1]);
        codigoVerificador = codigoVerificador + ((charCode * 7) % 10);

        if (i < 15) {
            charCode = parseInt(clabe[i + 2]);
            codigoVerificador = codigoVerificador + charCode;
        }
    }

    codigoVerificador = codigoVerificador % 10;
    codigoVerificador = diez - codigoVerificador;
    codigoVerificador = (codigoVerificador === diez) ? 0 : codigoVerificador;

    if (parseInt(clabe[clabe.length - 1]) !== codigoVerificador) return false;

    var plazaId = "{0}{1}{2}".format(clabe[3], clabe[4], clabe[5]);
    var plaza = FormsBuilder.Catalogs.getCatalog("Plazas bancarias").find('elemento[valor="{0}"]'.format(plazaId));

    return plaza.length > 0;
}

function ESCLABEDIGITOVERIFICADOR(clabeStr) {
    var rl = FormsBuilder.ViewModel.getFieldsForExprs()[clabeStr];
    var db_id = "E{0}P{1}".format(rl.entidad, rl.propiedad);

    var clabe = FormsBuilder.ViewModel.get()[rl.entidad][db_id]();

    var codigoVerificador = 0,
        diez = 10;

    for (var i = 0; i < clabe.length - 1; i = i + 3) {
        var charCode = parseInt(clabe[i]);
        codigoVerificador = codigoVerificador + ((charCode * 3) % 10);

        charCode = parseInt(clabe[i + 1]);
        codigoVerificador = codigoVerificador + ((charCode * 7) % 10);

        if (i < 15) {
            charCode = parseInt(clabe[i + 2]);
            codigoVerificador = codigoVerificador + charCode;
        }
    }

    codigoVerificador = codigoVerificador % 10;
    codigoVerificador = diez - codigoVerificador;
    codigoVerificador = (codigoVerificador === diez) ? 0 : codigoVerificador;

    if (parseInt(clabe[clabe.length - 1]) !== codigoVerificador) return false;

    return true;
}

function ESCLABEPLAZABANCARIA(clabeStr) {
    var rl = FormsBuilder.ViewModel.getFieldsForExprs()[clabeStr];
    var db_id = "E{0}P{1}".format(rl.entidad, rl.propiedad);

    var clabe = FormsBuilder.ViewModel.get()[rl.entidad][db_id]();

    var plazaId = "{0}{1}{2}".format(clabe[3], clabe[4], clabe[5]);
    var plaza = FormsBuilder.Catalogs.getCatalog("Plazas bancarias").find('elemento[valor="{0}"]'.format(plazaId));

    return plaza.length > 0;
}

function ESALFANUMERICO(event) {
    event = event || window.event;
    var pattern = /[^a-zA-Z0-9ñÑ]/g;
    event.target.value = event.target.value.replace(pattern, "");
    event.target.value = event.target.value.toUpperCase();
}

function ObtenerINPC(fecha) {
    if (isNaN(fecha.getDate())) return 0;

    var inpcc = 0;

    var foAnio = fecha.getFullYear();
    var foMes = fecha.getMonth();
    var inpcc1 = FormsBuilder.Catalogs.getCatalog("INPC").find('elemento[anio="{0}"]'.format(foAnio));
    var inpcc2 = inpcc1.find('[mes="{0}"]'.format(foMes));
    if (inpcc2.length > 0) {
        inpcc = inpcc2.attr("indice");
    } else {
        var x = inpcc1.length;
        var encontroEsteAnio = false;

        inpcc1.sort(function (a, b) {
            var a1 = parseInt($(a).attr("mes"));
            var b1 = parseInt($(b).attr("mes"));

            if (a1 === b1) return 0;
            return a1 > b1 ? 1 : -1;
        });
        while (x--) {
            if (parseInt($(inpcc1[x]).attr("mes")) <= foMes) {
                inpcc = $(inpcc1[x]).attr("indice");
                encontroEsteAnio = true;
                break;
            }
        }

        if (!encontroEsteAnio) {
            foAnio -= 1;
            inpcc1 = FormsBuilder.Catalogs.getCatalog("INPC").find('elemento[anio="{0}"]'.format(foAnio));

            inpcc1.sort(function (a, b) {
                var a1 = parseInt($(a).attr("mes"));
                var b1 = parseInt($(b).attr("mes"));

                if (a1 === b1) return 0;
                return a1 > b1 ? 1 : -1;
            });
            x = inpcc1.length;
            while (x--) {
                inpcc = $(inpcc1[x]).attr("indice");
                encontroEsteAnio = true;
                break;
            }
        }
    }

    return inpcc;
}

function GetTexto(funValue, catalogoId, noMostrarEnVacio) {
    //var xmlCopy = FormsBuilder.XMLForm.getCopy();
    var catalogo = FormsBuilder.XMLForm.getCatalogos().find('catalogo[id="{0}"]'.format(catalogoId));

    var texto = catalogo.find('elemento[valor="{0}"]'.format(funValue())).attr("texto");

    if (parseInt(funValue()) === 0 && noMostrarEnVacio === true) return "";

    return texto;
}

function changevalue(sender, value) {
    var detalleCheckbox = FormsBuilder.ViewModel.getDetalleCheckbox();
    detalleCheckbox[$(sender).attr("vmvalue")][value] = sender.checked;
}

var precargaVars = ["$1", "$2", "$3", "$4", "$5", "$6", "$7", "$8", "$9", "$10", "$11", "$12", "$13", "$14", "$15", "$16", "$17", "$18", "$20", "$21", "$22", "$23", "$24", "$25", "$26", "$27", "$28", "$29", "$30", "$31", "$32", "$33", "$34", "$35", "$36", "$37", "$37", "$38", "$39", "$41", "$42", "$43", "$45", "$46", "$47"];

function symToVal(expr) {
    var symbols = expr.match(/[$](\w+|[0-9^_]+)/igm);

    if (IsNullOrEmpty(symbols))
        return;

    $.each(symbols, function (k, v) {
        var precision = 4;
        var isDecimalPattern = /^[-+]?[0-9]+\.[0-9]+$/;
        var rule = FormsBuilder.ViewModel.getFieldsForExprs()[v];

        if (rule !== undefined) {
            var db_id = "E{0}P{1}".format(rule.entidad, rule.propiedad);
            var value = FormsBuilder.ViewModel.get()[(db_id.split("P")[0]).replace("E", "")][db_id]();

            if ($.inArray(v, precargaVars) >= 0) {
                window[v] = value;
                return;
            }

            switch (rule.tipoDatos) {
                case "FechaHora":
                case "Fecha":
                    if (isDateEmpty(value)) {
                        value = "";
                    }
                    window[v] = value;
                    break;

                case "Alfanumerico":
                    window[v] = value;
                    break;

                default:
                    if (!IsNullOrEmpty(value)) {
                        if (typeof (value) === "string") {
                            value = value.replace(new RegExp(",", "g"), "");
                        }
                        var numberValue = parseFloat(value);
                        if (isNaN(numberValue)) {
                            window[v] = value;
                        } else {
                            window[v] = numberValue;
                            if (isDecimalPattern.test(numberValue)) {
                                window[v] = typeof (numberValue) == "number" ? parseFloat(numberValue.toFixed(precision)) : window[v];
                            }
                        }
                    } else {
                        if (rule.tipoDatos === "Numerico") {
                            window[v] = 0;
                        } else {
                            window[v] = "";
                        }
                    }
                    break;
            }
        }
    });
}

function symToValGrid(expr, indice) {
    var foreignKeys = expr.match(/FK[(].*[)]/);
    var symbols = expr.match(/[$](\w+|[0-9^_]+)/igm);
    var precision = 4;
    var isDecimalPattern = /^[-+]?[0-9]+\.[0-9]+$/;

    if (IsNullOrEmpty(symbols))
        return;

    if (foreignKeys) {
        for (var i = 0; i < foreignKeys.length; i++) {
            var fk = foreignKeys[i].match(/[$](\w+|[0-9^_]+)/igm);
            symbols = symbols.filter(function (symbol) {
                return symbol !== fk[0];
            });
        }
    }

    $.each(symbols, function (k, v) {
        var rule = FormsBuilder.ViewModel.getFieldsForExprsGrid()[v];
        if (rule !== undefined) {
            var db_id = "E{0}P{1}".format(rule.entidad, rule.propiedad);
            var entidad = fbUtils.getEntidad(db_id);
            var detalleGrid = FormsBuilder.ViewModel.getDetalleGrid()[entidad];

            if (detalleGrid && detalleGrid.length > 0) {
                var value = detalleGrid[indice][db_id];

                if ($.inArray(v, precargaVars) >= 0) {
                    window[v] = value;
                    return;
                }

                switch (rule.tipoDatos) {
                    case "FechaHora":
                    case "Fecha":
                        if (isDateEmpty(value)) {
                            value = "";
                        }
                        window[v] = value;
                        break;

                    case "Alfanumerico":
                        window[v] = value;
                        break;

                    default:
                        if (!IsNullOrEmpty(value)) {
                            if (typeof (value) === "string") {
                                value = value.replace(new RegExp(",", "g"), "");
                            }
                            var numberValue = parseFloat(value);
                            if (isNaN(numberValue)) {
                                window[v] = value;
                            } else {
                                window[v] = numberValue;
                                if (isDecimalPattern.test(numberValue)) {
                                    window[v] = typeof (numberValue) == "number" ? parseFloat(numberValue.toFixed(precision)) : window[v];
                                }
                            }
                        } else {
                            if (rule.tipoDatos === "Numerico") {
                                window[v] = 0;
                            } else {
                                window[v] = "";
                            }
                        }
                        break;
                }
            } else {
                symToVal(v);
            }
        } else {
            symToVal(v);
        }
    });
}

function LLAMADAAJAX() {
    var resultado;
    try {

        var parametros = arguments[2].split(",");
        var modelo = {};
        for (var i = 0; i < parametros.length; i++) {
            modelo[parametros[i].replace("$", "")] = eval(parametros[i]);
        }
        parametros = arguments[3].split(",");
        var variables = {};
        for (var i = 0; i < parametros.length; i++) {
            var contantes = parametros[i].split(":");
            variables[contantes[0]] = contantes[1];
        }
        variables["data"] = JSON.stringify(modelo);
        $.ajax({
            url: arguments[0],
            type: arguments[1],
            crossDomain: true,
            data: variables,
            async: false,
            cache: false,
            success: function (result) {
                resultado = result;
            },
            error: function (xhr) {
                console.log(xhr.responseText);
            }

        });
    } catch (err) {
        console.log(err);
    }
    return resultado;
}

function FILTRARGRID() {
    arguments[0] = arguments[0].toString().replace(/[,](?!.*[,])/, "|");
    var exprs = arguments[0].toString().split("|");

    if (exprs.length === 2) {
        try {
            var symbol = exprs[1];
            var entidadPropiedad = FormsBuilder.ViewModel.getFieldsForExprsGrid()[symbol];
            var filtro = FormsBuilder.ViewModel.getDetalleGridFiltrado();

            if (entidadPropiedad) {
                var entidad = entidadPropiedad.entidad;
                var detalleEntidad = FormsBuilder.ViewModel.getDetalleGrid()[entidad];
                if (detalleEntidad) {
                    filtro[entidad] = [];
                    for (var i = 0; i < detalleEntidad.length; i++) {
                        var detalleFila = detalleEntidad[i];
                        if (!detalleFila["editando"]) {
                            var definicion = exprs[0];
                            var resultEval = FormsBuilder.Runtime.evaluateGrid(definicion, i);
                            if (resultEval === true) {
                                filtro[entidad].push(detalleFila);
                            }
                        }
                    }
                } else {
                    filtro[entidad] = null;
                }

                FormsBuilder.Modules.renderFormularioGrid(entidad, ORIGEN_DATOS_GRID.FILTRADO);
            }
        } catch (err) {
            console.log(err.message + "\n" + err.stack);
        }
    }
}

function FK() {
    return arguments[0];
}

function CONTARREGISTROS() {
    var detalleGrid = FormsBuilder.ViewModel.getDetalleGrid();
    var propiedad = arguments[0];
    var entidadPropiedad = FormsBuilder.ViewModel.getFieldsForExprs()[propiedad];
    var registros = 0;

    if (entidadPropiedad && detalleGrid[entidadPropiedad.entidad]) {
        registros = detalleGrid[entidadPropiedad.entidad].length;
    }

    return registros;
}

function RECALCULARCOLUMNA() {
    arguments[0] = arguments[0].toString().replace(/[,](?!.*[,])/, "|");
    var exprs = arguments[0].toString().split("|");

    if (exprs.length === 2) {
        try {
            var symbol = exprs[1];
            var entidadPropiedad = FormsBuilder.ViewModel.getFieldsForExprsGrid()[symbol];

            if (entidadPropiedad) {
                var db_id = "E{0}P{1}".format(entidadPropiedad.entidad, entidadPropiedad.propiedad);
                var entidad = entidadPropiedad.entidad;
                var detalleEntidad = FormsBuilder.ViewModel.getDetalleGrid()[entidad];
                if (detalleEntidad) {
                    for (var i = 0; i < detalleEntidad.length; i++) {
                        var detalleFila = detalleEntidad[i];
                        if (!detalleFila["editando"]) {
                            var definicion = exprs[0];
                            var calculo = FormsBuilder.Runtime.evaluateGrid(definicion, i);
                            if (!isNaN(calculo)) {
                                detalleFila[db_id] = calculo;
                            }
                        }
                    }
                }

                FormsBuilder.Modules.renderFormularioGrid(entidad, ORIGEN_DATOS_GRID.NORMAL, true);
            }
        } catch (err) {
            console.log(err.message + "\n" + err.stack);
        }
    }
}

function RECALCULARCOLUMNAS() {
    var operaciones = arguments[0].toString().split("|");

    if (operaciones && operaciones.length > 0) {
        for (var i = 0; i < operaciones.length; i++) {
            var operacion = operaciones[i];
            RECALCULARCOLUMNA(operacion);
        }
    }
}

function ELIMINARREGISTROGRID() {
    arguments[0] = arguments[0].toString().replace(/[,](?!.*[,])/, "|");
    var exprs = arguments[0].toString().split("|");
    var that = function () {
        if (exprs.length === 2) {
            try {
                var symbol = exprs[1];
                var entidadPropiedad = FormsBuilder.ViewModel.getFieldsForExprsGrid()[symbol];

                if (entidadPropiedad) {
                    var entidad = entidadPropiedad.entidad;
                    var detalleEntidad = FormsBuilder.ViewModel.getDetalleGrid()[entidad];
                    if (detalleEntidad) {
                        for (var i = 0; i < detalleEntidad.length; i++) {
                            var detalleFila = detalleEntidad[i];
                            if (!detalleFila["editando"]) {
                                var definicion = exprs[0];
                                var resultEval = FormsBuilder.Runtime.evaluateGrid(definicion, i);
                                if (resultEval === true) {
                                    FormsBuilder.Modules.eliminarElementoGrid(entidad, i);
                                    i--;
                                }
                            }
                        }
                    }
                }
            } catch (err) {
                console.log(err.message + "\n" + err.stack);
            }
        }
    };

    return that;
}

function CAMBIARTITULO() {
    var parametros = arguments[0].toString().split(",");

    var accion = function () {
        var propiedad = parametros[0].trim().replace(/'/g, "");
        var nuevoTitulo = parametros[1].trim().replace(/_/g, " ").replace(/'/g, "");
        var entidadPropiedad = FormsBuilder.ViewModel.getFieldsForExprs()[propiedad];

        if (entidadPropiedad) {
            if (parametros.length > 2) {
                var tipo = parametros[2].trim().replace(/'/g, "");

                if (tipo === "Fila") {
                    var tituloContenedor = $("[data-tipocontenedor='fila'][identidadpropiedad='{0}']".format(entidadPropiedad.entidad)).find(".panel-heading > b");
                    tituloContenedor.text(nuevoTitulo);
                }
            } else {
                var db_id = "E{0}P{1}".format(entidadPropiedad.entidad, entidadPropiedad.propiedad);
                var control = $("[view-model='{0}']".format(db_id));
                var tituloHtml = $("[data-titulo-control='{0}']".format(control.attr("id")));

                if (tituloHtml.length > 0) {
                    tituloHtml.html(nuevoTitulo);
                }
            }
        }
    };

    return accion;
}

function CANCELAREDICIONGRID() {
    var exprs = arguments[0].toString().split(",");
    var accion = function () {
        if (exprs.length === 1) {
            var symbol = exprs[0];
            var entidadPropiedad = FormsBuilder.ViewModel.getFieldsForExprsGrid()[symbol];

            if (entidadPropiedad) {
                var entidad = entidadPropiedad.entidad;
                FormsBuilder.Modules.cancelarEdicionGrid(entidad);
            }
        }
    };

    return accion;
}

function toggleTabMenu(propiedad, agregar, tabSeleccionar) {
    var entidadPropiedad = FormsBuilder.ViewModel.getFieldsForExprs()[propiedad];
    var accion = function () {
        if (entidadPropiedad) {
            var db_id = "E{0}P{1}".format(entidadPropiedad.entidad, entidadPropiedad.propiedad);
            var control = $("[view-model='{0}']".format(db_id));
            var tabBody = control.parents("[data-tipocontenedor='tab']");
            var idTab = tabBody.attr("id");
            var tab = $("a[href='#{0}']".format(idTab));

            if (tab.length > 0) {
                var contenedorTabs = tab.parents("ul.nav-tabs");
                var menu = contenedorTabs.find("li.dropdown ul.dropdown-menu");

                if (agregar === true) {
                    if (menu.length === 0) {
                        var liOtrosTabs = $("<li class='dropdown'><a href='#' class='dropdown-toggle' data-toggle='dropdown'>M&aacute;s<span class='caret' style='margin-left: 10px;'></span></a></li>");
                        menu = $("<ul class='dropdown-menu' data-otros-tabs></ul>");

                        menu.append(tab.parent());
                        liOtrosTabs.append(menu);
                        contenedorTabs.append(liOtrosTabs);
                    } else if (menu.length === 1) {
                        menu.append(tab.parent());
                    }

                    if (!IsNullOrEmptyWhite(tabSeleccionar)) {
                        seleccionarTab(tabSeleccionar);
                    }

                    tab.click(AppDeclaracionesSAT.tabMenuClick);
                    tab.parent().css("width", "auto").removeClass("active");
                } else if (agregar === false) {
                    if (menu.length === 1 && $.contains(tab, menu)) {
                        contenedorTabs.append(tab.parent());

                        if (menu.children().length === 0) {
                            menu.parent().remove();
                        } else {
                            contenedorTabs.append(menu.parent());
                        }
                    }
                }

                AppDeclaracionesSAT.ajustarAnchoTabs(tab.parents("ul.nav-tabs"));
            }
        }
    };

    return accion;
}

function seleccionarTab(propiedad) {
    var entidadPropiedad = FormsBuilder.ViewModel.getFieldsForExprs()[propiedad];

    if (entidadPropiedad) {
        var db_id = "E{0}P{1}".format(entidadPropiedad.entidad, entidadPropiedad.propiedad);
        var control = $("[view-model='{0}']".format(db_id));
        var tabBody = control.parents("[data-tipocontenedor='tab']");
        var idTab = tabBody.attr("id");
        var tab = $("a[href='#{0}']".format(idTab));

        tab.click();
    }
}

function MOVERTABAMENU() {
    var parametros = arguments[0].toString().split(",");
    var propiedad = parametros[0];
    var propiedadTabSeleccionar = parametros.length > 1 ? parametros[1] : null;
    return toggleTabMenu(propiedad, true, propiedadTabSeleccionar);
}

function QUITARTABDEMENU(propiedad) {
    return toggleTabMenu(propiedad, false);
}

function MOSTRARMENSAJEENMODAL() {
    var parametros = arguments[0].toString().split("|");
    var titulo = parametros[0];
    var idCatalogo = parametros[1];
    var idElemento = parametros[2];

    var accion = function () {
        AppDeclaracionesSAT.mostrarMensajeModal(titulo.replaceAll("_", " "), idCatalogo, idElemento);
    };

    return accion;
}

function EXISTEROLIDC(rolId) {
    var rol, listaRoles;

    if (!IsNullOrEmpty(FormsBuilder.XMLForm.getCopyPrecarga())) {
        listaRoles = FormsBuilder.XMLForm.getCopyPrecarga();
    }
    else {
        listaRoles = FormsBuilder.XMLForm.getCopyDeclaracion();
    }

    rol = listaRoles.find("Roles Catalogo").filter(function () {
        return $("IdCatalogo", this).text() === rolId;
    });

    return rol.length > 0;
}

function EXCLUIROPCIONESCOMBO() {
    var parametros = arguments[0].split(",");
    var accion = function () {
        if (parametros.length === 2) {
            var propiedad = parametros[0];
            var datosPropiedad = FormsBuilder.ViewModel.getFieldsForExprs()[propiedad];

            if (datosPropiedad) {
                var opcionesExcluir = parametros[1].split("|");
                var opcionesCombo = $("select[view-model='E{0}P{1}'] > option".format(datosPropiedad.entidad, datosPropiedad.propiedad));

                opcionesCombo.filter(function(){
                    return Enumerable.From(opcionesExcluir).Any("$ === '{0}'".format($(this).val()));
                }).remove();
            }
        }
    };

    return accion;
}