/** @module FormsBuilder.ViewModel */
/**
 *
 * Modulo que carga el modelo de datos desde el XML
 *
 * (c) SAT 2013, Iv�n Gonz�lez
 */
/*global namespace:false, FormsBuilder:false, SAT: false, AppDeclaracionesSAT:false, ko:false */

"use strict";

(function () {
    namespace("FormsBuilder.ViewModel", get, getDetalleCheckbox, getDetalle, getDetalleGrid, getDetalleFK, init,
        applyDataBindings, createXml, getFieldsForExprs, getFieldsForExprsGrid, getFlujoSecciones, applyRule, setViewModel,
        Validacion, Calculo, Visual, getConfiguracionFisicas, applyRulesDejarSinEfecto, getTotalesDeducciones,
        setDetalleGridEntidad, getLenQueueRules, getEntitiesXml, applyRuleGridAgregar, setBadgeCount, setViewModelsPropuesta,
        getDetalleGridFiltrado, setDetalleGridFiltrado, applyValueSettingByProp, applyDetailsRules, getDetalleGridPaginado,
        setDetalleGridPaginado, validarViewModel, obtenerObjetoPlano, parametrosString);
    window.fbViewModel = FormsBuilder.ViewModel;

    var PREFIJO_GRID = "grid";
    var FN_SUMAGRID = "SUMAGRID";
    var MODO_AL_AGREGAR = 1;
    var CONST_IDPROPIEDAD_ESPROPUESTA = 69;
    var CONST_IDPROPIEDAD_RECHAZAPROPUESTA = 70;

    var viewModel = {};
    var viewModelGrid = {};
    var viewModelGridFiltrado = {};
    var viewModelGridPaginado = {};
    var viewModelDetalle = {};

    var viewModelCheckboxList = {};
    var viewModelDetalleForeignKeys = {};

    var configuracionFisicas = {
        subRegimenes: "",
        areaGeografica: ""
    };

    var flujoSecciones = {};
    var fieldsForExprs = {};
    var fieldsForExprsGrid = {};

    var applyRulesFuncs = [];

    var rulesCacheGrid = [];
    var rulesCache = [];

    var prefixFieldExpr = "$";


    function get() {
        return viewModel;
    }

    function getValorViewModelPorIdPropiedad(idPropiedad) {
        var valorVm = null;
        var datosPropiedad = getFieldsForExprs()["${0}".format(idPropiedad)];

        if (datosPropiedad) {
            var idEntidadPropiedad = "E{0}P{1}".format(datosPropiedad.entidad, idPropiedad);
            valorVm = viewModel[datosPropiedad.entidad][idEntidadPropiedad]();
        }

        return valorVm;
    }

    function setViewModel(idEntidad, idEntidadPropiedad, valor) {
        var viewModelEntidad = viewModel[idEntidad];

        if (viewModelEntidad) {
            var propiedadObservable = viewModelEntidad[idEntidadPropiedad];

            if (propiedadObservable) {
                propiedadObservable(valor);
            } else {
                console.log("No existe la propiedad {0}".format(idEntidadPropiedad));
            }
        } else {
            console.log("No existe la entidad {0}".format(idEntidad));
        }
    }

    function getDetalle() {
        return viewModelDetalle;
    }

    function getDetalleGrid() {
        return viewModelGrid;
    }

    function setDetalleGridEntidad(idEntidad, detalle) {
        viewModelGrid[idEntidad] = JSON.parse(JSON.stringify(detalle));
    }

    function getDetalleGridFiltrado() {
        return viewModelGridFiltrado;
    }

    function setDetalleGridFiltrado(idEntidad, detalle) {
        viewModelGridFiltrado[idEntidad] = JSON.parse(JSON.stringify(detalle));
    }

    function getDetalleGridPaginado() {
        return viewModelGridPaginado;
    }

    function setDetalleGridPaginado(idEntidad, detalle) {
        viewModelGridPaginado[idEntidad] = JSON.parse(JSON.stringify(detalle));
    }

    function getDetalleCheckbox() {
        return viewModelCheckboxList;
    }

    function getDetalleFK() {
        return viewModelDetalleForeignKeys;
    }

    function getFieldsForExprs() {
        return fieldsForExprs;
    }

    function getFieldsForExprsGrid() {
        return fieldsForExprsGrid;
    }

    function getFlujoSecciones() {
        return flujoSecciones;
    }

    function getConfiguracionFisicas() {
        return configuracionFisicas;
    }

    function getLenQueueRules() {
        return applyRulesFuncs.length;
    }

    function getViewModelsPropuesta(keys) {
        var viewModels = [];

        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            var entidad = fbUtils.getEntidad(key);
            var modelo = viewModel[entidad][key];
            viewModels.push(modelo);
        }

        return viewModels;
    }

    function getViewModelEsPropuesta() {
        var keysEsPropuesta = Enumerable.From(viewModel).SelectMany("Object.keys($.Value)").Where("$.endsWith('P{0}')".format(CONST_IDPROPIEDAD_ESPROPUESTA)).ToArray();
        return getViewModelsPropuesta(keysEsPropuesta);
    }

    function getViewModelRechazaPropuesta() {
        var keysRechazaPropuesta = Enumerable.From(viewModel).SelectMany("Object.keys($.Value)").Where("$.endsWith('P{0}')".format(CONST_IDPROPIEDAD_RECHAZAPROPUESTA)).ToArray();
        return getViewModelsPropuesta(keysRechazaPropuesta);
    }

    function setViewModelsPropuesta(esPropuesta, rechazaPropuesta) {
        var viewModelsEsPropuesta = getViewModelEsPropuesta();
        var viewModelsRechazaPropuesta = getViewModelRechazaPropuesta();
        var setValor = function (viewModels, valor) {
            for (var i = 0; i < viewModels.length; i++) {
                var viewModel = viewModels[i];
                viewModel(valor);
            }
        };

        console.log("setViewModelsPropuesta.EsPropuesta -> {0}".format(esPropuesta));
        setValor(viewModelsEsPropuesta, esPropuesta);

        console.log("setViewModelsPropuesta.RechazaPropuesta -> {0}".format(rechazaPropuesta));
        setValor(viewModelsRechazaPropuesta, rechazaPropuesta);
    }

    function getTotalesDeducciones() {
        var totales = {
            "IngresoAnual": getValorViewModelPorIdPropiedad("IngresoAnual") || 0,
            "IngresoAcumulableAnterior": getValorViewModelPorIdPropiedad("111810A") || 0,
            "IngresoAcumulable": getValorViewModelPorIdPropiedad("11202001") || 0,
            "MontoPorDeducir": getValorViewModelPorIdPropiedad("MontoPorDeducir") || 0,
            "TotalGastoRecuperado": getValorViewModelPorIdPropiedad("TotalGastoRecuperado") || 0,
            "TotalMontoDeducible": getValorViewModelPorIdPropiedad("TotalMontoDeducible") || 0,
            "TotalMontoAplicable": getValorViewModelPorIdPropiedad("TotalMontoAplicable") || 0
        };

        return totales;
    }

    function validaEdicionPrecarga(idPropiedad) {
        var entidadPropiedad = fieldsForExprs["${0}".format(idPropiedad)];

        if (entidadPropiedad) {
            var propiedadJson = FormsBuilder.XMLForm.obtenerPropiedadPorId(entidadPropiedad.entidad, entidadPropiedad.propiedad);

            if (propiedadJson) {
                var propiedadEdicionPrecarga = Enumerable.From(propiedadJson.atributos.atributo).Where("$.nombre === 'EdicionPrecarga'").Select("$.valor").FirstOrDefault();

                if (!IsNullOrEmptyWhite(propiedadEdicionPrecarga)) {
                    var entidadPropiedadEdicion = fieldsForExprs["${0}".format(propiedadEdicionPrecarga)];

                    if (entidadPropiedadEdicion) {
                        var db_id = "E{0}P{1}".format(entidadPropiedadEdicion.entidad, entidadPropiedadEdicion.propiedad);
                        setViewModel(entidadPropiedadEdicion.entidad, db_id, 1);
                    }
                }
            }
        }
    }

    function init(entidadesModel, cb) {
        //reglas = $(FormsBuilder.XMLForm.getCopy()).find('reglas');
        //var entidades = $(xmlDoc).find('modeloDatos > entidades > entidad');

        console.log(">>>> Inicia 'ViewModel.init'");

        $.each(entidadesModel, function (keyEntidad, valueEntidad) {
            //var propiedades = $(valueEntidad).children('propiedades').children('propiedad');

            viewModel[valueEntidad.id] = {};
            if (valueEntidad.propiedades != null && valueEntidad.propiedades.propiedad != undefined) {
                $.each(valueEntidad.propiedades.propiedad, function (keyPropiedad, valuePropiedad) {

                    var idEntidad = valueEntidad.id;
                    var idPropiedad = valuePropiedad.id;
                    var claveInformativa = valuePropiedad.claveInformativa;

                    fieldsForExprs[prefixFieldExpr + idPropiedad] = {
                        entidad: idEntidad,
                        propiedad: idPropiedad,
                        tipoDatos: valuePropiedad.tipoDatos
                    };
                    window[prefixFieldExpr + idPropiedad] = 0;

                    var db_id = "E{0}P{1}".format(idEntidad, idPropiedad);
                    if (!viewModel[idEntidad].hasOwnProperty(db_id)) {
                        viewModel[idEntidad][db_id] = ko.observable("");

                        viewModel[valueEntidad.id][db_id].subscribe(function (newValue) {
                            var entidadControl = fbUtils.getEntidad(db_id);
                            var propiedadControl = fbUtils.getPropiedad(db_id);

                            if (isDateEmpty(newValue)) {
                                return;
                            }

                            SAT.Environment.setSetting("isModified", true);

                            if (SAT.Environment.settings("loadingTemporal") === false &&
                                SAT.Environment.settings("isHydrate") === false &&
                                SAT.Environment.settings("initialKoBinding") === false &&
                                SAT.Environment.settings("modifyingGridVm") === false &&
                                SAT.Environment.settings("executingRule") === false) {

                                validaEdicionPrecarga(propiedadControl);
                            }

                            var aplicaRegla = true;
                            if (SAT.Environment.settings("applyrules")) {

                                if (FormsBuilder.ViewModel.getFlujoSecciones()[entidadControl] !== undefined) {
                                    if (FormsBuilder.ViewModel.getFlujoSecciones()[entidadControl]["NoAplica"] !== undefined) {
                                        if (FormsBuilder.ViewModel.getFlujoSecciones()[entidadControl]["NoAplica"] === "true") {
                                            aplicaRegla = false;
                                        }
                                    }
                                }

                                var propiedadesReglas = FormsBuilder.XMLForm.getReglas();
                                if (propiedadesReglas.propiedades && propiedadesReglas.propiedades.propiedad) {
                                    //var propiedadControl = fbUtils.getPropiedad(db_id);
                                    aplicaRegla = Enumerable.From(propiedadesReglas.propiedades.propiedad).Any("$.ejecutarRegla == '1' && $.idPropiedad == '{0}'".format(propiedadControl));
                                }

                                // if (!SAT.Environment.settings('runRulesGrid')) {
                                //     aplicaRegla = false;
                                // }

                                if (aplicaRegla) {
                                    var applyRuleFunc;
                                    if (SAT.Environment.settings("dejarsinefecto") === false) {
                                        var ejecutarValidacionCalculo = SAT.Environment.settings("runRulesGrid");
                                        applyRuleFunc = function () {
                                            applyRule(db_id, ejecutarValidacionCalculo);
                                            applyValueSettingByProp(db_id, newValue);
                                            applyDetailsRules(db_id, newValue);
                                        };
                                    } else {
                                        applyRuleFunc = function () {
                                            applyRulesDejarSinEfecto(db_id, claveInformativa, true);
                                        };
                                    }

                                    if (applyRuleFunc) {
                                        applyRulesFuncs.push(applyRuleFunc);
                                    }

                                    setTimeout(function () {
                                        if (applyRulesFuncs.length) {
                                            var func = applyRulesFuncs.shift();
                                            func.call();
                                        }
                                    }, 1);
                                }
                            }
                        });
                    }
                });
            }
        });

        console.log("Modelo Cargado");

        if (cb && typeof cb === "function") {
            cb();
        }
    }

    function applyDetailsRules(db_id, newValue) {
        if (viewModelDetalleForeignKeys[db_id] !== undefined) {
            if (newValue === 0 || newValue === "") {
                var dlg = $('[sat-dlg-dbid="{0}"] div:first'.format(db_id));
                var trItem = dlg.find("table tr[item]");
                if (trItem.length > 0) {
                    trItem.remove();
                }

                var rowCompensaciones = $('[sat-dlg-compensaciones-dbid="{0}"] div:first'.format(db_id)).find(".sat-row-compensaciones");
                if (rowCompensaciones.length > 0) {
                    rowCompensaciones.remove();
                }
                viewModelDetalle[viewModelDetalleForeignKeys[db_id]] = [];
            }
        }
    }

    function applyValueSettingByProp(db_id, newValue) {
        var total = 0;

        if (FormsBuilder.Parser.getDataProp() !== undefined) {
            var needsToApplySetting = $.inArray(db_id, FormsBuilder.Parser.getDataProp());
            if (needsToApplySetting >= 0) {
                FormsBuilder.Parser.getDataProp()[db_id] = newValue;

                $.each(FormsBuilder.Parser.getDataProp(), function (k, v) {
                    var val = FormsBuilder.Parser.getDataProp()[v];
                    if (!IsNullOrEmpty(val)) {
                        var value = parseInt(val);

                        if (!isNaN(value)) {
                            total += value;
                        }
                    }
                });

                var control = $('[field-bind="{0}"]'.format(db_id));
                if (!IsNullOrEmptyWhite(newValue)) {
                    control.html("$" + newValue);
                    fbUtils.applyFormatCurrencyOnElement(control, true);
                    var controlValue = "${0}".format(control.text());
                    control.html(controlValue);
                } else {
                    control.html("");
                }

                var totalPay = $(".topay > span:last");
                totalPay.html("${0}".format(total));
                fbUtils.applyFormatCurrencyOnElement(totalPay, true);
                var totalPayValue = "${0}".format(totalPay.text());
                totalPay.html(totalPayValue);

                //TODO: Poner $24007 en un archivo o setting configuracion
                var infoField = FormsBuilder.ViewModel.getFieldsForExprs()["$24007"];
                var db_id2 = "E{0}P{1}".format(infoField.entidad, infoField.propiedad);
                viewModel[infoField.entidad][db_id2](total);
            }
        }
    }

    // function containGroupOperation(reglaEntidad) {
    //     var exprs = reglaEntidad.definicion.match(/SUMA[(](.*?)[)]/igm) ||
    //         reglaEntidad.definicion.match(/DUPLICADO[(][$](\w+|[0-9^_]+)[)]/igm);
    //     if ($.isArray(exprs)) {
    //         return exprs.length > 0;
    //     }
    //     return false;
    // }

    // function getInfoOperations(operations) {
    //     var result = [];
    //     if ($.isArray(operations)) {
    //         $(operations).each(function (index, value) {
    //             var operationEntidad = {};
    //             var nombreOperation = value.match(/^(.*?)(?=[(])/igm);
    //             if (nombreOperation && nombreOperation.length > 0) {
    //                 operationEntidad.nombre = nombreOperation[0];
    //             }
    //             value = value.replace(/(.*?)[(]/igm, "");
    //             value = value.replace(/[)]$/igm, "");
    //             var parameters = value.split(",");
    //             operationEntidad.parametros = [];
    //             if (parameters && parameters.length > 0) {
    //                 operationEntidad.parametros = parameters;
    //             }

    //             if (operationEntidad.hasOwnProperty("nombre")) {
    //                 result.push(operationEntidad);
    //             }
    //         });
    //     }
    //     return result;
    // }

    // function getGroupOperations(definicion) {
    //     var groupOperations = definicion.match(/SUMA[(](.*?)[)]/igm) ||
    //         definicion.match(/DUPLICADO[(][$](\w+|[0-9^_]+)[)]/igm);

    //     return getInfoOperations(groupOperations);
    // }

    // function getImplicitRules(reglaEntidad, dbId) {
    //     var result = [];
    //     var reglas = FormsBuilder.XMLForm.getReglas();
    //     var regla = Enumerable.From(reglas.reglas.regla).Where("$.id === '{0}'".format(reglaEntidad.idRegla)).FirstOrDefault();
    //     //$(reglas).find('regla[id="{0}"]'.format(reglaEntidad.idRegla));
    //     var operations = getGroupOperations(reglaEntidad.definicion);
    //     var idPropiedad = fbUtils.getPropiedad(dbId);
    //     var idEntidad = fbUtils.getEntidad(dbId);
    //     var detalleGrid = FormsBuilder.ViewModel.getDetalleGrid();

    //     for (var index in operations) {
    //         var operation = operations[index];
    //         var hasParameters = operation.parametros.length > 0;
    //         if (hasParameters) {
    //             //TODO: Para lanzar validaciones de los hermanos en controlesgrid
    //             // if (lastParameter === "${0}".format(idPropiedad)) {
    //             var grid = detalleGrid[idEntidad];
    //             for (var indexRow in grid) {
    //                 nextRow: for (var viewModelId in grid[indexRow]) {
    //                     var counter = viewModelId.split("_")[1];
    //                     var newDbId = "E{0}P{1}_{2}".format(idEntidad, idPropiedad, counter);
    //                     if (newDbId !== dbId) {
    //                         result.push({
    //                             regla: regla,
    //                             dbId: newDbId
    //                         });
    //                     }
    //                     break nextRow;
    //                 }

    //             }
    //             // }
    //         }

    //     }
    //     return result;
    // }

    // function applyRuleGrid(db_id, newValue, callback, isFormGridEdicion) {

    //     console.log(">>>> Inicia 'ViewModel.applyRuleGrid'");

    //     var idEntidad = fbUtils.getEntidad(db_id);
    //     var detalleGrid = FormsBuilder.ViewModel.getDetalleGrid();
    //     var reglas = FormsBuilder.XMLForm.getReglas();

    //     if (detalleGrid[idEntidad] !== undefined) {
    //         var db_id_grid = db_id.split("_")[0];
    //         var reglasEntidadGrid = FormsBuilder.Runtime.getRules()[db_id_grid];
    //         if (reglasEntidadGrid === undefined)
    //             return;

    //         $.each(reglasEntidadGrid, function (k, reglaEntidad) {
    //             var regla;

    //             if (rulesCacheGrid[reglaEntidad.idRegla] === undefined) {
    //                 regla = Enumerable.From(reglas.reglas.regla).Where("$.id == '{0}'".format(reglaEntidad.idRegla)).FirstOrDefault();
    //                 //$(reglas).find('regla[id="{0}"]'.format(reglaEntidad.idRegla));
    //                 rulesCacheGrid[reglaEntidad.idRegla] = regla;
    //             } else {
    //                 regla = rulesCacheGrid[reglaEntidad.idRegla];
    //             }

    //             if (regla.definicion !== undefined) {
    //                 var isNotRunRule = (regla.tipoRegla === "Calculo" ||
    //                     regla.tipoRegla === "Condicional Excluyente" ||
    //                     regla.tipoRegla === "Validacion") &&
    //                     isFormGridEdicion &&
    //                     SAT.Environment.settings("isHydrate") === true;

    //                 if (SAT.Environment.settings("isDAS")) {
    //                     var isRunRuleDAS = (regla.tipoRegla === "Calculo" ||
    //                         regla.tipoRegla === "Condicional Excluyente") &&
    //                         isFormGridEdicion &&
    //                         AppDeclaracionesSAT.getConfig("forma") === "new";
    //                 } else {
    //                     var isRunRuleFisicas = (regla.tipoRegla === "Calculo" ||
    //                         regla.tipoRegla === "Condicional Excluyente") &&
    //                         isFormGridEdicion &&
    //                         AppDeclaracionesSAT.getConfig("forma") === "new";
    //                 }

    //                 if (typeof isRunRuleDAS !== "undefined") {
    //                     if (isNotRunRule && !isRunRuleDAS) return;
    //                 } else {
    //                     if (isNotRunRule && !isRunRuleFisicas) return;
    //                 }

    //                 if (SAT.Environment.settings("isDAS")) {
    //                     if (isFormGridEdicion && regla.tipoRegla === "Calculo" && regla.ejecutarEnGridEdicion !== "1") {
    //                         if (SAT.Environment.settings("runRulesCalc") == false && SAT.Environment.settings("isHydrate") === false) {
    //                             FormsBuilder.Modules.addRuleGridEdicion(db_id, newValue, callback, isFormGridEdicion);
    //                             return;
    //                         }
    //                     }
    //                 }

    //                 if (SAT.Environment.settings("actualizacionimporte") === true) {
    //                     if (regla.tipoRegla === "Visual" &&
    //                         regla.definicion.trimAll().match(/[^IN]HABILITAR[(][$](\w+|[0-9^_]+)[)]/igm)) {
    //                         return;
    //                     }
    //                 }

    //                 reglaEntidad.definicion = regla.definicion.trimAll();
    //                 reglaEntidad.mensajeError = regla.mensajeError;
    //                 reglaEntidad.idPropiedadAsociada = regla.idPropiedadAsociada;

    //                 var rules = [];
    //                 rules.push({
    //                     regla: regla,
    //                     dbId: db_id
    //                 });
    //                 if (containGroupOperation(reglaEntidad)) {
    //                     var siblingRules = getImplicitRules(reglaEntidad, db_id);

    //                     var sumaFind = reglaEntidad.definicion.match(/SUMA[(](.*?)[)]/igm);
    //                     if (sumaFind && sumaFind[0].indexOf(",") === -1) {
    //                         rules = rules.concat(siblingRules);
    //                     } else if (reglaEntidad.definicion.match(/DUPLICADO/)) {
    //                         rules = rules.concat(siblingRules);
    //                     }
    //                 }

    //                 $.each(rules, function (index, item) {
    //                     switch (item.regla.tipoRegla) {
    //                         case "Validacion":
    //                             if (SAT.Environment.settings("applyrulesvalidation") === true) {
    //                                 ValidacionGrid(item.dbId, item.regla);
    //                             }
    //                             break;
    //                         case "Calculo":
    //                         case "Condicional Excluyente":
    //                             if ((SAT.Environment.settings("isHydrate") === true &&
    //                                 regla.ejecutarSiempre !== "1") && AppDeclaracionesSAT.getConfig("forma") !== "new")
    //                                 break;

    //                             CalculoGrid(item.dbId, item.regla);
    //                             break;
    //                         case "Visual":
    //                             VisualGrid(item.dbId, item.regla);
    //                             break;
    //                     }
    //                 });
    //             } else {
    //                 // console.log('Se detecto un launcher sin regla con el ID {0}'.format(reglaEntidad.idRegla));
    //             }
    //         });
    //     }

    //     if (callback !== undefined) {
    //         callback();
    //     }
    // }

    function applyRuleGridAgregar(db_id) {
        var idEntidad = fbUtils.getEntidad(db_id);
        var detalleGrid = FormsBuilder.ViewModel.getDetalleGrid()[idEntidad];
        var reglas = FormsBuilder.XMLForm.getReglas();

        if (detalleGrid) {
            var reglasAlAgregar = Enumerable.From(reglas.reglas.regla).Where("$.modoejecucion == '{0}'".format(MODO_AL_AGREGAR)).ToArray();
            if (reglasAlAgregar) {
                $.each(reglasAlAgregar, function (k, reglaEntidad) {
                    if (!rulesCacheGrid[reglaEntidad.idRegla]) {
                        rulesCacheGrid[reglaEntidad.idRegla] = reglaEntidad;
                    }
                });
            }
        }
    }

    // function VisualGrid(db_id, regla) {

    //     var idEntidad = fbUtils.getEntidad(db_id);
    //     var detalleGrid = FormsBuilder.ViewModel.getDetalleGrid();
    //     var counter;
    //     var reglaEntidad = {};

    //     reglaEntidad.definicion = regla.definicion;
    //     reglaEntidad.definicion = reglaEntidad.definicion.trimAll();
    //     reglaEntidad.mensajeError = regla.mensajeError;
    //     reglaEntidad.idPropiedadAsociada = regla.idPropiedadAsociada;
    //     reglaEntidad.idRegla = regla.attrid;
    //     //var xmlCopy = FormsBuilder.XMLForm.getCopy();
    //     var propiedadesReglas = FormsBuilder.XMLForm.getReglas()["propiedades"];
    //     //var symbolsXml = xmlCopy.find('definicionReglas > propiedades > propiedad[idRegla="{0}"]'.format(regla.id));
    //     var symbols = Enumerable.From(propiedadesReglas.propiedad).Where("$.idRegla == '{0}'".format(regla.id)).Select("$.idPropiedad").ToArray();
    //     // $.each(symbolsXml, function (k, sym) {
    //     //     symbols.push('$' + sym.idPropiedad);
    //     // });
    //     symbols.push(reglaEntidad.definicion.split("=")[0]);

    //     for (var symbol in symbols) {
    //         for (var i = 0; i < detalleGrid[idEntidad].length; i++) {
    //             for (var detalleItem in detalleGrid[idEntidad][i]) {
    //                 var id = detalleItem.substring(detalleItem.indexOf("P") + 1, detalleItem.length);

    //                 var symbolDetalle = "$" + id;
    //                 counter = id.split("_")[1];

    //                 if (counter === db_id.split("_")[1]) {
    //                     if (symbolDetalle === symbols[symbol] + "_" + counter) {
    //                         var searchSymbols = reglaEntidad.definicion.match("[$]{0}".format(id.split("_")[0]));
    //                         if (searchSymbols !== null) {
    //                             $.each(searchSymbols, function (k, searchSymbol) {
    //                                 var matchSymbol = new RegExp("\\" + searchSymbol + "(?!([A-Z\\d]|(_[0-9]*))+)|" + "\\" + searchSymbol + "((_[0-9]*)+)", "igm");
    //                                 reglaEntidad.definicion = reglaEntidad.definicion.replace(matchSymbol, function () {
    //                                     return searchSymbol + "_" + counter;
    //                                 });
    //                                 return false;
    //                             });
    //                         }
    //                     }
    //                 }
    //             }
    //         }
    //     }

    //     try {
    //         var exprs = reglaEntidad.definicion.match(/ESNULO[(][$](\w+|[0-9^_]+)[)]/igm);
    //         modifiyExprsGrid(exprs, reglaEntidad);

    //         if (reglaEntidad.definicion.match(/CONTADORCONDICIONAL[(](.*)[)]/igm) === null) {
    //             exprs = reglaEntidad.definicion.match(/ELEMENTOSGRID[(][$](\w+|[0-9^_]+)[)]/igm);
    //             modifiyExprs(exprs, reglaEntidad);
    //         }

    //         exprs = reglaEntidad.definicion.match(/INHABILITAR[(][$](\w+|[0-9^_]+)[)]/igm);
    //         modifiyExprsGrid(exprs, reglaEntidad);

    //         exprs = reglaEntidad.definicion.match(/OCULTAR[(][$](\w+|[0-9^_]+)[)]/igm);
    //         modifiyExprsGrid(exprs, reglaEntidad);

    //         exprs = reglaEntidad.definicion.match(/MOSTRAR[(][$](\w+|[0-9^_]+)[)]/igm);
    //         modifiyExprsGrid(exprs, reglaEntidad);

    //         exprs = reglaEntidad.definicion.match(/[^IN]HABILITAR[(][$](\w+|[0-9^_]+)[)]/igm);
    //         modifiyExprsGrid(exprs, reglaEntidad);

    //         exprs = reglaEntidad.definicion.match(/ESENTEROPOSITIVO[(][$](\w+|[0-9^_]+)[)]/igm);
    //         modifiyExprsGrid(exprs, reglaEntidad);

    //         FormsBuilder.Runtime.evaluateGrid(reglaEntidad.definicion);
    //         if (AppDeclaracionesSAT.getConfig("view-rules")) {
    //             console.log("Resultado N/A -:- Tipo [VisualGrid] -:- RuleId {0}-:- Regla {1}".format(reglaEntidad.idRegla, reglaEntidad.definicion));
    //         }
    //     } catch (err) {
    //         if (AppDeclaracionesSAT.getConfig("debug")) {
    //             console.log("Mensaje de error {0} -:- Regla {1}".format(err.message, reglaEntidad.definicion));
    //         }
    //     }
    // }

    // function modifiyExprsGrid(exprs, reglaEntidad) {
    //     if (exprs !== null) {
    //         $.each(exprs, function (k, expr) {
    //             reglaEntidad.definicion = reglaEntidad.definicion.replace(expr, expr.replace("(", 'GRID("').replace(")", '")'));
    //         });
    //     }
    // }

    // function ValidacionGrid(db_id, regla) {

    //     var propiedades = FormsBuilder.XMLForm.getReglas()["propiedades"];
    //     var idEntidad = fbUtils.getEntidad(db_id);
    //     var detalleGrid = FormsBuilder.ViewModel.getDetalleGrid();
    //     var result;
    //     var counter;
    //     var counterSearch;
    //     var reglaEntidad = {};
    //     reglaEntidad.definicion = regla.definicion;
    //     reglaEntidad.definicion = reglaEntidad.definicion.trimAll();
    //     reglaEntidad.mensajeError = regla.mensajeError;
    //     reglaEntidad.idPropiedadAsociada = regla.idPropiedadAsociada;
    //     reglaEntidad.idRegla = regla.id;
    //     //var xmlCopy = FormsBuilder.XMLForm.getCopy();

    //     if (SAT.Environment.settings("applyrulesvalidation")) {
    //         //var symbolsXml = Enumerable.From(propiedades.propiedad).Where("$.idRegla == '{0}'".format(regla.id)).ToArray();
    //         //xmlCopy.find('definicionReglas > propiedades > propiedad[idRegla="{0}"]'.format(regla.id));

    //         var symbols = Enumerable.From(propiedades.propiedad).Where("$.idRegla == '{0}'".format(regla.id)).Select("$.idPropiedad").ToArray();
    //         // $.each(symbolsXml, function (k, sym) {
    //         //     symbols.push('$' + $(sym).attr('idPropiedad'));
    //         // });

    //         for (var symbol in symbols) {
    //             for (var i = 0; i < detalleGrid[idEntidad].length; i++) {
    //                 for (var detalleItem in detalleGrid[idEntidad][i]) {
    //                     var id = detalleItem.substring(detalleItem.indexOf("P") + 1, detalleItem.length);
    //                     var symbolDetalle = "$" + id;
    //                     counter = id.split("_")[1];

    //                     if (counter === db_id.split("_")[1]) {
    //                         counterSearch = counter;
    //                         if (symbolDetalle === symbols[symbol] + "_" + counter) {
    //                             var searchSymbols = reglaEntidad.definicion.match("[$]{0}".format(id.split("_")[0]));
    //                             if (searchSymbols !== null) {
    //                                 $.each(searchSymbols, function (k, searchSymbol) {
    //                                     var matchSymbol = new RegExp("\\" + searchSymbol + "(?!([A-Z\\d]|(_[0-9]*))+)|" + "\\" + searchSymbol + "((_[0-9]*)+)", "igm");
    //                                     reglaEntidad.definicion = reglaEntidad.definicion.replace(matchSymbol, function () {
    //                                         return searchSymbol + "_" + counter;
    //                                     });
    //                                     return false;
    //                                 });
    //                             }
    //                         }
    //                     }
    //                 }
    //             }
    //         }

    //         try {
    //             var exprs;
    //             if (reglaEntidad.definicion.match(/CONTADORCONDICIONAL[(](.*)[)]/igm) === null) {
    //                 exprs = reglaEntidad.definicion.match(/ESNULOGRID[(][$](\w+|[0-9^_]+)[)]/igm);
    //                 modifiyExprs(exprs, reglaEntidad);

    //                 exprs = reglaEntidad.definicion.match(/ELEMENTOSGRID[(][$](\w+|[0-9^_]+)[)]/igm);
    //                 modifiyExprs(exprs, reglaEntidad);

    //                 exprs = reglaEntidad.definicion.match(/VALORANTERIOR[(][$](\w+|[0-9^_]+)[)]/igm);
    //                 modifiyExprs(exprs, reglaEntidad);
    //             }

    //             exprs = reglaEntidad.definicion.match(/ESNULO[(][$](\w+|[0-9^_]+)[)]/igm);
    //             modifiyExprs(exprs, reglaEntidad);

    //             exprs = reglaEntidad.definicion.match(/DUPLICADO[(][$](\w+|[0-9^_]+)[)]/igm);
    //             modifiyExprs(exprs, reglaEntidad);

    //             exprs = reglaEntidad.definicion.match(/SUMACONDICIONAL[(](.*?)[)]/igm);
    //             modifiyExprsMultiple(exprs, reglaEntidad);

    //             exprs = reglaEntidad.definicion.match(/ESENTEROPOSITIVO[(][$](\w+|[0-9^_]+)[)]/igm);
    //             modifiyExprsGrid(exprs, reglaEntidad);

    //             exprs = reglaEntidad.definicion.match(/SUMA[(](.*?)[)]/igm);
    //             if (exprs !== null) {
    //                 $.each(exprs, function (k, expr) {
    //                     if (expr.indexOf(",") === -1) {
    //                         var exprsSuma = expr.match(/[_][0-9]+/);
    //                         if (exprsSuma !== null) {
    //                             $.each(exprsSuma, function (k, exprSuma) {
    //                                 reglaEntidad.definicion = reglaEntidad.definicion.replace(expr, expr.replace(exprSuma, ""));
    //                                 expr = expr.replace(exprSuma, "");
    //                             });
    //                         }
    //                     }
    //                     reglaEntidad.definicion = reglaEntidad.definicion.replace(expr, expr.replace("(", '("').replace(")", '")'));
    //                 });
    //             }

    //             exprs = reglaEntidad.definicion.match(/SUMACONDICIONALCLASIFICADOR[(](.*?)[)]/igm);
    //             if (exprs !== null) {
    //                 $.each(exprs, function (k, expr) {
    //                     if (expr.indexOf(",") === -1) {
    //                         var exprsSuma = expr.match(/[_][0-9]+/);
    //                         if (exprsSuma !== null) {
    //                             $.each(exprsSuma, function (k, exprSuma) {
    //                                 reglaEntidad.definicion = reglaEntidad.definicion.replace(expr, expr.replace(exprSuma, ""));
    //                                 expr = expr.replace(exprSuma, "");
    //                             });
    //                         }
    //                     }
    //                     reglaEntidad.definicion = reglaEntidad.definicion.replace(expr, expr.replace("(", '("').replace(")", '")'));
    //                 });
    //             }

    //             exprs = reglaEntidad.definicion.match(/SUMAGRID[(](.*?)[)]/igm);
    //             modifiyExprs(exprs, reglaEntidad);

    //             reglaEntidad.mensajeError = procesarMensajeErrorGrid(reglaEntidad.mensajeError, db_id.split("_")[1]);

    //             result = FormsBuilder.Runtime.evaluateGrid(reglaEntidad.definicion);

    //             if (AppDeclaracionesSAT.getConfig("view-rules")) {
    //                 console.log("Resultado {0} -:- Tipo [ValidacionGrid] -:- RuleId {1}-:- Regla {2}".format(result, reglaEntidad.idRegla, reglaEntidad.definicion));
    //             }

    //             var rl = FormsBuilder.ViewModel.getFieldsForExprsGrid()["$" + reglaEntidad.idPropiedadAsociada + "_" + counterSearch];
    //             var db_id2 = "E{0}P{1}".format(rl.entidad, rl.propiedad);

    //             var ctl = $('#htmlOutput [view-model="{0}"]'.format(db_id2)).not("a").not("button");
    //             if (ctl.length <= 0) {
    //                 ctl = $('#htmlOutput [view-model="{0}"]'.format(db_id)).not("a").not("button");
    //             }

    //             var ctlParent = ctl.parent();
    //             ctl.removeClass("sat-obligatorio");

    //             modificarUIValidacion(result, regla, reglaEntidad, db_id, db_id2, ctl, ctlParent, rl);
    //         } catch (err) {
    //             if (AppDeclaracionesSAT.getConfig("debug")) {
    //                 console.log("Mensaje de error {0} -:- Regla {1}".format(err.message, reglaEntidad.definicion));
    //             }
    //         }
    //     }

    //     return result;
    // }

    // function modifiyExprs(exprs, reglaEntidad) {
    //     if (exprs !== null) {
    //         exprs = Enumerable.From(exprs).Distinct().ToArray();
    //         $.each(exprs, function (k, expr) {
    //             var parentesisAbre = fbUtils.buscarCadena("(", expr);
    //             var parentesisCierra = fbUtils.buscarCadena(")", expr);
    //             var ultimoCierra = parentesisCierra[parentesisCierra.length - 1];
    //             if (parentesisAbre.length === 1 && parentesisCierra.length === 1) {
    //                 reglaEntidad.definicion = reglaEntidad.definicion.replaceAll(expr, expr.replace("(", '("').replace(")", '")'));
    //             } else if (parentesisAbre.length > 1 && parentesisCierra.length > 1) {
    //                 var parametros = expr.substring(parentesisAbre[0] + 1, ultimoCierra);
    //                 var reemplazar = expr.replace(parametros, '"' + parametros + '"');
    //                 reglaEntidad.definicion = reglaEntidad.definicion.replaceAll(expr, reemplazar);
    //             }
    //         });
    //     }
    // }

    // function modifiyExprsMultiple(exprs, reglaEntidad) {
    //     if (exprs !== null) {
    //         $.each(exprs, function (k, expr) {
    //             var argsExprs = expr.match(/[$](\w+|[0-9^_]+)/igm);
    //             var tmp = expr;
    //             $.each(argsExprs, function (k, argsExpr) {
    //                 expr = expr.replace(new RegExp("\\" + argsExpr, "igm"), function (match, offset, str) {
    //                     if (str.substr(offset - 1, 1) !== "'" && str.substr(offset + match.length, 1) !== "'") {
    //                         if (str.substr(offset + match.length, 2) === "==")
    //                             return match;
    //                         else
    //                             return "'{0}'".format(match);
    //                     }
    //                     return match;
    //                 });
    //             });

    //             reglaEntidad.definicion = reglaEntidad.definicion.replace(tmp, expr);
    //         });
    //     }
    // }

    // function DeshabilitarCalculoGrid(db_id, regla) {
    //     var idEntidad = fbUtils.getEntidad(db_id);
    //     var definicion = $(regla).attr("definicion");
    //     var detalleGrid = FormsBuilder.ViewModel.getDetalleGrid();
    //     //var xmlCopy = FormsBuilder.XMLForm.getCopy();

    //     //var symbolsXml = Enumerable.From(reglas.propiedades.propiedad).Where("$.idRegla === '{0}'".format(regla.id)).ToArray(); 
    //     //xmlCopy.find('definicionReglas > propiedades > propiedad[idRegla="{0}"]'.format($(regla).attr('id')));
    //     var symbols = Enumerable.From(propiedades.propiedad).Where("$.idRegla == '{0}'".format(regla.id)).Select("$.idPropiedad").ToArray();
    //     // $.each(symbolsXml, function (k, sym) {
    //     //     symbols.push('$' + sym.idPropiedad);
    //     // });
    //     symbols.push(definicion.split("=")[0]);

    //     for (var symbol in symbols) {
    //         for (var i = 0; i < detalleGrid[idEntidad].length; i++) {
    //             for (var detalleItem in detalleGrid[idEntidad][i]) {
    //                 var id = detalleItem.substring(detalleItem.indexOf("P") + 1, detalleItem.length);

    //                 var symbolDetalle = "$" + id;
    //                 var counter = id.split("_")[1];

    //                 if (counter === id.split("_")[1]) {
    //                     if (symbolDetalle === symbols[symbol] + "_" + counter) {
    //                         var searchSymbols = definicion.match("[$]{0}".format(id.split("_")[0]));
    //                         if (searchSymbols !== null) {
    //                             $.each(searchSymbols, function (k, searchSymbol) {
    //                                 var matchSymbol = new RegExp("\\" + searchSymbol + "(?!([A-Z\\d]|(_[0-9]*))+)|" + "\\" + searchSymbol + "((_[0-9]*)+)", "igm");

    //                                 definicion = definicion.replace(matchSymbol, function () {
    //                                     return searchSymbol + "_" + counter;
    //                                 });
    //                                 return false;
    //                             });
    //                         }
    //                     }
    //                 }
    //             }
    //         }
    //     }

    //     return definicion;
    // }

    // function CalculoGrid(db_id, regla) {


    //     var idEntidad = fbUtils.getEntidad(db_id);
    //     var detalleGrid = FormsBuilder.ViewModel.getDetalleGrid();
    //     var result;
    //     var counter;
    //     var reglaEntidad = {};

    //     reglaEntidad.definicion = regla.definicion.trimAll();
    //     reglaEntidad.mensajeError = regla.mensajeError;
    //     reglaEntidad.idPropiedadAsociada = regla.idPropiedadAsociada;
    //     reglaEntidad.idRegla = regla.id;
    //     reglaEntidad.tipo = regla.tipoRegla;

    //     //var xmlCopy = FormsBuilder.XMLForm.getCopy();

    //     //var symbolsXml = xmlCopy.find('definicionReglas > propiedades > propiedad[idRegla="{0}"]'.format(regla.id));
    //     var symbols = Enumerable.From(propiedades.propiedad).Where("$.idRegla == '{0}'".format(regla.id)).Select("$.idPropiedad").ToArray();
    //     // $.each(symbolsXml, function (k, sym) {
    //     //     symbols.push('$' + $(sym).attr('idPropiedad'));
    //     // });
    //     symbols.push(reglaEntidad.definicion.split("=")[0]);

    //     for (var symbol in symbols) {
    //         for (var i = 0; i < detalleGrid[idEntidad].length; i++) {
    //             for (var detalleItem in detalleGrid[idEntidad][i]) {
    //                 var id = detalleItem.substring(detalleItem.indexOf("P") + 1, detalleItem.length);

    //                 var symbolDetalle = "$" + id;
    //                 counter = id.split("_")[1];

    //                 if (counter === db_id.split("_")[1]) {
    //                     if (symbolDetalle === symbols[symbol] + "_" + counter) {
    //                         var searchSymbols = reglaEntidad.definicion.match("[$]{0}".format(id.split("_")[0]));
    //                         if (searchSymbols !== null) {
    //                             $.each(searchSymbols, function (k, searchSymbol) {
    //                                 var matchSymbol = new RegExp("\\" + searchSymbol + "(?!([A-Z\\d]|(_[0-9]*))+)|" + "\\" + searchSymbol + "((_[0-9]*)+)", "igm");

    //                                 reglaEntidad.definicion = reglaEntidad.definicion.replace(matchSymbol, function () {
    //                                     return searchSymbol + "_" + counter;
    //                                 });
    //                                 return false;
    //                             });
    //                         }
    //                     }
    //                 }
    //             }
    //         }
    //     }

    //     try {
    //         var exprs;
    //         if (reglaEntidad.definicion.match(/CONTADORCONDICIONAL[(](.*)[)]/igm) === null) {
    //             exprs = reglaEntidad.definicion.match(/ESNULOGRID[(][$](\w+|[0-9^_]+)[)]/igm);
    //             modifiyExprs(exprs, reglaEntidad);

    //             exprs = reglaEntidad.definicion.match(/ELEMENTOSGRID[(][$](\w+|[0-9^_]+)[)]/igm);
    //             modifiyExprs(exprs, reglaEntidad);

    //             exprs = reglaEntidad.definicion.match(/VALORANTERIOR[(][$](\w+|[0-9^_]+)[)]/igm);
    //             modifiyExprs(exprs, reglaEntidad);
    //         }

    //         exprs = reglaEntidad.definicion.match(/SUMA[(](.*?)[)]/igm);
    //         if (exprs !== null) {
    //             $.each(exprs, function (k, expr) {
    //                 if (expr.indexOf(",") === -1) {
    //                     var exprsSuma = expr.match(/[_][0-9]+/);
    //                     if (exprsSuma !== null) {
    //                         $.each(exprsSuma, function (k, exprSuma) {
    //                             reglaEntidad.definicion = reglaEntidad.definicion.replace(expr, expr.replace(exprSuma, ""));
    //                             expr = expr.replace(exprSuma, "");
    //                         });
    //                     }
    //                 }
    //                 reglaEntidad.definicion = reglaEntidad.definicion.replace(expr, expr.replace("(", '("').replace(")", '")'));
    //             });
    //         }

    //         exprs = reglaEntidad.definicion.match(/SUMACONDICIONALCLASIFICADOR[(](.*?)[)]/igm);
    //         if (exprs !== null) {
    //             $.each(exprs, function (k, expr) {
    //                 if (expr.indexOf(",") === -1) {
    //                     var exprsSuma = expr.match(/[_][0-9]+/);
    //                     if (exprsSuma !== null) {
    //                         $.each(exprsSuma, function (k, exprSuma) {
    //                             reglaEntidad.definicion = reglaEntidad.definicion.replace(expr, expr.replace(exprSuma, ""));
    //                             expr = expr.replace(exprSuma, "");
    //                         });
    //                     }
    //                 }
    //                 reglaEntidad.definicion = reglaEntidad.definicion.replace(expr, expr.replace("(", '("').replace(")", '")'));
    //             });
    //         }

    //         exprs = reglaEntidad.definicion.match(/SUMAGRID[(](.*?)[)]/igm);
    //         if (exprs !== null) {
    //             $.each(exprs, function (k, expr) {
    //                 if (expr.indexOf(",") === -1) {
    //                     var encontroHijo = false;
    //                     var filaPadre;

    //                     var symbols = reglaEntidad.definicion.match(/[$](\w+|[0-9^_]+)/igm);

    //                     var fila = symbols[1].split("_")[1];

    //                     var rl = FormsBuilder.ViewModel.getFieldsForExprs()[symbols[1].split("_")[0]];

    //                     var relaciones = FormsBuilder.Modules.getRelacionesGrid();
    //                     for (var keyRelacionPadre in relaciones) {
    //                         for (var keyRelacion in relaciones[keyRelacionPadre]) {
    //                             if (keyRelacion == rl.entidad) {
    //                                 var nodoEncontrado = relaciones[keyRelacionPadre][keyRelacion];
    //                                 for (var padre in nodoEncontrado) {
    //                                     if (encontroHijo === false) {
    //                                         for (var hijo in nodoEncontrado[padre].hijos) {
    //                                             if (parseInt(fila) === parseInt(nodoEncontrado[padre].hijos[hijo].hijo)) {
    //                                                 filaPadre = nodoEncontrado[padre].padre;
    //                                                 encontroHijo = true;
    //                                                 break;
    //                                             }
    //                                         }
    //                                     }
    //                                 }
    //                             }
    //                         }
    //                     }
    //                     if (filaPadre !== undefined) {
    //                         var exprsCalculo = reglaEntidad.definicion.split("=");
    //                         if (exprsCalculo[0].split("_").length <= 1) {
    //                             reglaEntidad.definicion = reglaEntidad.definicion.replace(exprsCalculo[0], exprsCalculo[0] + "_" + filaPadre);
    //                         }
    //                     }
    //                 } else {
    //                     var encontroHijo = false;
    //                     var filaPadre;

    //                     var symbols = reglaEntidad.definicion.match(/[$](\w+|[0-9^_]+)/igm);

    //                     var fila = symbols[1].split("_")[1];

    //                     var rl = FormsBuilder.ViewModel.getFieldsForExprs()[symbols[1].split("_")[0]];

    //                     var relaciones = FormsBuilder.Modules.getRelacionesGrid();
    //                     for (var keyRelacionPadre in relaciones) {
    //                         for (var keyRelacion in relaciones[keyRelacionPadre]) {
    //                             if (keyRelacion == rl.entidad) {
    //                                 var nodoEncontrado = relaciones[keyRelacionPadre][keyRelacion];
    //                                 for (var padre in nodoEncontrado) {
    //                                     if (encontroHijo === false) {
    //                                         for (var hijo in nodoEncontrado[padre].hijos) {
    //                                             if (parseInt(fila) === parseInt(nodoEncontrado[padre].hijos[hijo].hijo)) {
    //                                                 filaPadre = nodoEncontrado[padre].padre;
    //                                                 encontroHijo = true;
    //                                                 break;
    //                                             }
    //                                         }
    //                                     }
    //                                 }
    //                             }
    //                         }
    //                     }
    //                     if (filaPadre !== undefined) {
    //                         var exprsCalculo = reglaEntidad.definicion.split("=");
    //                         reglaEntidad.definicion = reglaEntidad.definicion.replace(exprsCalculo[0], exprsCalculo[0] + "_" + filaPadre);
    //                     }
    //                 }
    //                 reglaEntidad.definicion = reglaEntidad.definicion.replace(expr, expr.replace("(", '("').replace(")", '")'));
    //             });
    //         }


    //         result = FormsBuilder.Runtime.evaluateGrid(reglaEntidad.definicion);

    //         if (AppDeclaracionesSAT.getConfig("view-rules")) {
    //             console.log("Resultado {0} -:- Tipo [{3}Grid] -:- RuleId {1}-:- Regla {2}".format(result, reglaEntidad.idRegla, reglaEntidad.definicion, reglaEntidad.tipo));
    //         }

    //         if (result !== undefined) {
    //             exprs = reglaEntidad.definicion.split("=");

    //             var rl = FormsBuilder.ViewModel.getFieldsForExprsGrid()[exprs[0]];
    //             if (rl !== undefined) {
    //                 var db_id2 = "E{0}P{1}".format(rl.entidad, rl.propiedad);

    //                 var detalleGrid2 = FormsBuilder.ViewModel.getDetalleGrid()[fbUtils.getEntidad(db_id2)];
    //                 for (var indexDetalle in detalleGrid2) {
    //                     if (detalleGrid2[indexDetalle][db_id2] !== undefined) {
    //                         detalleGrid2[indexDetalle][db_id2](result);

    //                         fbUtils.applyFormatCurrencyOnElement($('input[view-model="{0}"]'.format(db_id2)));

    //                     }
    //                 }
    //             } else {
    //                 exprs = reglaEntidad.definicion.split("=");

    //                 var rl = FormsBuilder.ViewModel.getFieldsForExprs()[exprs[0]];

    //                 var db_id2 = "E{0}P{1}".format(rl.entidad, rl.propiedad);
    //                 viewModel[fbUtils.getEntidad(db_id2)][db_id2](result);

    //                 var $input = $('input[view-model="{0}"]'.format(db_id2));
    //                 fbUtils.applyFormatCurrencyOnElement($input);

    //             }
    //         }
    //     } catch (err) {
    //         if (AppDeclaracionesSAT.getConfig("debug")) {
    //             console.log("Mensaje de error {0} -:- Regla {1}".format(err.message, reglaEntidad.definicion));
    //         }
    //     }

    //     return result;
    // }

    // function getDbIdsPropiedadesGrid(regla) {
    //     //var $xml = FormsBuilder.XMLForm.getCopy();
    //     var reglas = FormsBuilder.XMLForm.getReglas();
    //     var idRegla = regla.id;
    //     //$(regla).attr("id");
    //     var propiedadesInvolved = Enumerable.From(reglas.propiedades.propiedad).Where("$.idRegla == '{0}'".format(idRegla)).ToArray();
    //     //$xml.find("definicionReglas propiedad[idRegla='{0}']".format(idRegla));
    //     var propiedadesGrid = {};
    //     $.each(propiedadesInvolved, function (index, propiedad) {
    //         var idPropiedad = propiedad.idPropiedad;
    //         var $entidad = FormsBuilder.XMLForm.buscarEntidadPorIdPropiedad(idPropiedad);
    //         //$xml.find("propiedad[id='{0}']".format(idPropiedad)).parents("entidad:first");
    //         var $atributo = Enumerable.From($entidad.atributos.atributo).Where("$.nombre === 'multiplicidad'").FirstOrDefault();
    //         //$entidad.find('atributo[nombre="multiplicidad"]');
    //         if ($atributo.valor == "*") {
    //             var infoProp = FormsBuilder.ViewModel.getFieldsForExprs()["${0}".format(idPropiedad)];
    //             var dbId = "E{0}P{1}".format(infoProp.entidad, infoProp.propiedad);
    //             propiedadesGrid[idPropiedad] = dbId;
    //         }
    //     });
    //     var temp = [];
    //     for (var index in propiedadesGrid) {
    //         temp.push(propiedadesGrid[index]);
    //     }
    //     propiedadesGrid = temp;
    //     return propiedadesGrid;
    // }


    function applyRulesDejarSinEfecto(db_id, claveInformativa, general) {

        console.log(">>>> Inicia 'ViewModel.applyRulesDejarSinEfecto'");

        var reglas = FormsBuilder.XMLForm.getReglas();
        var reglasEntidad = FormsBuilder.Runtime.getRules()[db_id];

        if (reglasEntidad === undefined)
            return;

        $.each(reglasEntidad, function (k, reglaEntidad) {
            var regla;

            if (rulesCache[reglaEntidad.idRegla] === undefined) {
                regla = Enumerable.From(reglas.reglas.regla).Where("$.id == '{0}'".format(reglaEntidad.idRegla)).FirstOrDefault();
                rulesCache[reglaEntidad.idRegla] = regla;
            } else {
                regla = rulesCache[reglaEntidad.idRegla];
            }

            if (claveInformativa !== undefined) {
                var enableRule = ($.inArray(claveInformativa, ["C5", "C20"]) >= 0);
            }

            //var regla = $(reglas).find('regla[id="{0}"]'.format(reglaEntidad.idRegla));
            if (regla.validaSeccion === "1" || regla.validaSeccionAlEntrar === "1") {
                return;
            }
            reglaEntidad.definicion = regla.definicion;

            if (typeof enableRule !== "undefined") {
                if (enableRule === false && regla.ejecutarEnDejarSinEfecto !== "1") {
                    return;
                }
            } else if (general === true && regla.ejecutarEnDejarSinEfecto !== "1") {
                return;
            }

            var tipoRegla = regla.tipoRegla;
            switch (tipoRegla) {
                case "Validacion":
                    Validacion(db_id, regla);
                    break;
                case "Visual":
                    Visual(regla);
                    break;
                case "Calculo":
                case "Condicional Excluyente":
                    Calculo(regla);
                    break;
            }

        });
    }

    function applyRule(db_id, ejecutarValidacionCalculo) {

        console.log(">>>> Inicia 'ViewModel.applyRule'");

        var reglas = FormsBuilder.XMLForm.getReglasEjecutarSiempre();

        var reglasEntidad = FormsBuilder.Runtime.getRules()[db_id];

        if (reglasEntidad === undefined)
            return;

        $.each(reglasEntidad, function (k, reglaEntidad) {
            var regla;

            if (rulesCache[reglaEntidad.idRegla] === undefined) {
                regla = Enumerable.From(reglas).Where("$.id == '{0}'".format(reglaEntidad.idRegla)).FirstOrDefault();
                rulesCache[reglaEntidad.idRegla] = regla;
            } else {
                regla = rulesCache[reglaEntidad.idRegla];
            }

            if (regla) {
                if ((regla.validaSeccion && regla.validaSeccion == "1") || (regla.validaSeccionAlEntrar && regla.validaSeccionAlEntrar == "1")) {
                    return;
                }
                var tipoRegla = regla.tipoRegla;

                //var participaEnGrid = regla.participaEnGrid;
                if (regla.definicion.search(/SUMAGRID/ig) > -1) {
                    //applyRuleGridGeneric(regla, db_id);
                    var sumas = fbUtils.extraerFuncion(FN_SUMAGRID, regla.definicion.toUpperCase());

                    for (var i = 0; i < sumas.length; i++) {
                        var suma = sumas[i];
                        var parametros = fbUtils.obtenerParametros(FN_SUMAGRID, suma);
                        var nuevaSuma = suma;

                        for (var j = 0; j < parametros.length; j++) {
                            var parametro = parametros[j];
                            var columnaGrid = "{0}_{1}_{2}".format(PREFIJO_GRID, regla.idEntidad, parametro);
                            nuevaSuma = nuevaSuma.replace(parametro, columnaGrid);
                        }

                        regla.definicion = regla.definicion.replace(suma, nuevaSuma);
                    }
                }

                if (SAT.Environment.settings("actualizacionimporte") === true) {
                    if (regla.tipoRegla === "Visual" &&
                        regla.definicion.trimAll().match(/[^IN]HABILITAR[(][$](\w+|[0-9^_]+)[)]/igm)) {
                        return;
                    }
                }

                switch (tipoRegla) {
                    case "Validacion":
                        if (SAT.Environment.settings("applyrulesvalidation") === true && ejecutarValidacionCalculo === true) {
                            Validacion(db_id, regla);
                        }
                        break;
                    case "Visual":
                        if (SAT.Environment.settings("dejarsinefecto") === false && regla.participaEnGrid === false) {
                            Visual(regla);
                        }
                        break;
                    case "Calculo":
                    case "Condicional Excluyente":
                        if ((SAT.Environment.settings("isHydrate") === true &&
                            regla.ejecutarSiempre !== "1") && AppDeclaracionesSAT.getConfig("forma") !== "new") {
                            break;
                        }

                        if (ejecutarValidacionCalculo === true) {
                            Calculo(regla);
                        }
                        break;
                }
            }
        });
    }

    function Validacion(db_id, regla, modificarUi) {

        var result;
        var reglaEntidad = {};
        reglaEntidad.definicion = regla.definicion.trimAll();
        reglaEntidad.mensajeError = regla.mensajeError;
        reglaEntidad.idPropiedadAsociada = regla.idPropiedadAsociada;
        reglaEntidad.idRegla = regla.id;

        SAT.Environment.setSetting("executingRule", true);

        try {
            reglaEntidad.definicion = parametrosString(reglaEntidad.definicion);

            var exprs = reglaEntidad.definicion.match(/ESENTERONEGATIVO[(][$](\w+|[0-9^_]+)[)]/igm);
            if (exprs !== null) {
                $.each(exprs, function (index, expr) {
                    var idExpression = "${0}".format(db_id.substring(db_id.indexOf("P") + 1, db_id.length));
                    reglaEntidad.definicion = reglaEntidad.definicion.replace(expr, expr.replace(")", ',"{0}")'.format(idExpression)));
                });
            }

            reglaEntidad.mensajeError = fbUtils.procesarMensajeError(reglaEntidad.mensajeError, db_id.split("_")[1]);

            console.log("REGLA VALIDACION: " + reglaEntidad.definicion);

            result = FormsBuilder.Runtime.evaluate(reglaEntidad.definicion);
            var resultado = [reglaEntidad.tipo, result];

            if (AppDeclaracionesSAT.getConfig("view-rules")) {
                console.log("Resultado {0} -:- Tipo [Validacion] -:- RuleId {1}-:- Regla {2}".format(resultado, reglaEntidad.idRegla, reglaEntidad.definicion));
            }

            var rl = FormsBuilder.ViewModel.getFieldsForExprs()["$" + reglaEntidad.idPropiedadAsociada];
            var db_id2 = "E{0}P{1}".format(rl.entidad, rl.propiedad);

            var ctl = $('#htmlOutput [view-model="{0}"]'.format(db_id2)).not("a").not("button");
            var ctlParent = ctl.parent();
            ctl.removeClass("sat-obligatorio");

            if (modificarUi === undefined || modificarUi === true) {
                modificarUIValidacion(result, regla, reglaEntidad, db_id, db_id2, ctl, ctlParent, rl);
            }
        } catch (err) {
            if (AppDeclaracionesSAT.getConfig("debug")) {
                console.log("Mensaje de error {0} -:- Regla {1}".format(err.message, reglaEntidad.definicion));
            }
        } finally {
            SAT.Environment.setSetting("executingRule", false);
        }

        return result;
    }

    function modificarUIValidacion(result, regla, reglaEntidad, db_id, db_id2, ctl, ctlParent, rl) {

        console.log(">>>> Inicia 'modificarUIValidacion'" + db_id + " | " + db_id2);

        try {
            if (!result) {
                var saltarErrores = false;
                if (regla.limpiarCampoNoValido === "1") {
                    var ctlClean = $('#htmlOutput [view-model="{0}"]'.format(db_id));
                    if (!$(ctlClean).is(":disabled")) {
                        viewModel[fbUtils.getEntidad(db_id)][db_id]("");
                        saltarErrores = true;
                    }
                }

                if (regla.mensajeErrorEnDialogo === "1") {
                    if (!AppDeclaracionesSAT.getConfig("deshabilitarDialogos")) {
                        var existeMensaje = false;
                        $.each($("#modalSeccion .modal-body > div"), function (k, v) {
                            if (reglaEntidad.mensajeError === $(v).html()) {
                                existeMensaje = true;
                            }
                        });
                        if (existeMensaje === false) {
                            $("#modalSeccion .modal-body").append("<div>{0}</div>".format(reglaEntidad.mensajeError));
                        }
                        $("#modalSeccion").modal("show");
                        //document.activeElement.blur();
                    }
                } else {
                    if (ctlParent.length > 0) { //Se agrego para deducciones personales
                        if (saltarErrores === false) {
                            var iconError = ctlParent.find('i[vm="{0}"]'.format(db_id2));

                            ctl.addClass("alert");

                            if (ctl.attr("columnaFixed")) {
                                ctl.addClass("alertFixed");
                            }

                            if (iconError.length === 0) {
                                iconError = $('<i vm="{0}" class="icon-warning-sign sat-icon"></i>'.format(db_id2));
                                iconError.attr("rules", JSON.stringify([regla.id]));
                                iconError.attr("excluirEnGrid", regla.excluirEnGrid === "1", "1");

                                ctl.after(iconError);

                                if (ctl.attr("cuadrodialogo") === undefined) {
                                    ctl.css("display", "inline-block");
                                    ctl.css("margin-right", "5px");
                                } else {
                                    ctl.css("width", "71%!important");
                                }

                                setBadgeCount(ctlParent);
                            } else {
                                var rulesIcon = JSON.parse(iconError.attr("rules"));
                                var indexRule = $.inArray(regla.id, rulesIcon);

                                if (indexRule === -1) {
                                    rulesIcon.push(regla.id);
                                    iconError.attr("rules", JSON.stringify(rulesIcon));
                                }

                                setBadgeCount(ctlParent);
                            }
                        }
                    }
                }
            } else {
                setTimeout(function () {
                    var iconError = ctlParent.find('i[vm="{0}"]'.format(db_id2));
                    if (iconError.length > 0) {
                        var rulesIcon = JSON.parse(iconError.attr("rules"));
                        var indexRule = $.inArray(regla.id, rulesIcon);

                        if (indexRule >= 0) {
                            rulesIcon.splice(indexRule, 1);
                            iconError.attr("rules", JSON.stringify(rulesIcon));
                            $(".panelalert").find('i[rule="{0}"][dbid="{1}"]'.format(regla.id, db_id2)).remove();
                            $(".number").html($(".panelalert i").length);
                            if ($(".panelalert").find("i[entidad='{0}']".format(rl.entidad)).length === 0) {
                                $(".panelalert").find("div[entidad='{0}']".format(rl.entidad)).remove();
                            }

                            if ($("#htmlOutput i[vm]").length === 0) {
                                $(".panelalert").find("i[rule]").remove();
                                $(".number").html(0);
                            }

                            if (rulesIcon.length <= 0) {
                                var iconValidacion = ctlParent.find('i[vm="{0}"]'.format(db_id2));
                                iconValidacion.popover("destroy");
                                iconValidacion.remove();

                                if (ctl.attr("cuadrodialogo") === undefined) {
                                    if (ctl.is(":visible")) {
                                        ctl.css("display", "block");
                                    }
                                    ctl.css("margin-right", "0px");
                                }

                                ctl.removeClass("alert");
                                if (ctl.attr("columnaFixed")) {
                                    ctl.removeClass("alertFixed");
                                }
                                ctl.removeClass("sat-obligatorio");
                            }
                        }
                    } else {
                        $(".panelalert").find('i[rule="{0}"][dbid="{1}"]'.format(regla.id, db_id2)).remove();
                        $(".number").html($(".panelalert i").length);
                        if ($(".panelalert").find("i[entidad='{0}']".format(rl.entidad)).length === 0) {
                            $(".panelalert").find("div[entidad='{0}']".format(rl.entidad)).remove();
                        }

                        if ($("#htmlOutput i[vm]").length === 0) {
                            $(".panelalert").find("i[rule]").remove();
                            $(".number").html(0);
                        }
                    }
                    $("#htmlOutput").find(".popover").remove();

                    setBadgeCount(ctlParent);
                }, 10);
            }
        } catch (err) {
            console.log(err.message);
        }
    }

    function setBadgeCount(ctlParent) {
        if (ctlParent.length > 0) {
            ctlParent.each(function () {
                var control = $(this);
                var menu = control.parents("[idtab]");
                var grupo = control.parents(".ficha-collapse");
                var seccion = control.parents(".topmenu");
                var tab = control.parents("[data-tipocontenedor='tab']");
                var tituloMenu = $("[data-titulo-menu='{0}']".format(menu.attr("idtab")));
                var tituloGrupo = grupo.find("[data-titulo-grupo]");
                var tituloSeccion = seccion.find("[data-titulo-seccion]");
                var tituloTab = $("a[href='#{0}']".format(tab.attr("id")));
                var contarErrores = function (buscarErroresEn, mostrarEn) {
                    var numeroErrores = buscarErroresEn.find("i.icon-warning-sign, .registro-error").length;

                    if (numeroErrores <= 0) {
                        mostrarEn.find("span.badge").remove();
                    } else {
                        if (mostrarEn.find("span.badge").length === 0) {
                            mostrarEn.append("<span class='badge'>{0}</span>".format(numeroErrores));
                        } else {
                            mostrarEn.find("span.badge").html(numeroErrores);
                        }
                    }
                };

                contarErrores(menu, tituloMenu);
                contarErrores(grupo, tituloGrupo);
                contarErrores(seccion, tituloSeccion);
                contarErrores(tab, tituloTab);
            });
        }
    }

    function Visual(regla) {

        var reglaEntidad = {};
        reglaEntidad.definicion = regla.definicion.trimAll();
        reglaEntidad.mensajeError = regla.mensajeError;
        reglaEntidad.idPropiedadAsociada = regla.idPropiedadAsociada;
        reglaEntidad.idRegla = regla.id;

        SAT.Environment.setSetting("executingRule", true);

        try {
            reglaEntidad.definicion = parametrosString(reglaEntidad.definicion);

            console.log("REGLA VISUAL: " + reglaEntidad.definicion);

            FormsBuilder.Runtime.evaluate(reglaEntidad.definicion);

            // if (reglaEntidad.definicion.match(/ELEMENTOSGRID[(](.*)[)]/igm) === null) {
            //     FormsBuilder.Runtime.evaluate(reglaEntidad.definicion);
            // } else {
            //     var dbIds = getDbIdsPropiedadesGrid(regla);
            //     var detalleGrid = FormsBuilder.ViewModel.getDetalleGrid();

            //     for (var index in dbIds) {
            //         var dbId = dbIds[index];
            //         var idEntidad = fbUtils.getEntidad(dbId);
            //         var grid = detalleGrid[idEntidad];
            //         if (grid.length == 0) {
            //             FormsBuilder.Runtime.evaluate(reglaEntidad.definicion);
            //         } else {
            //             for (var indexRow in grid) {
            //                 for (var viewModelId in grid[indexRow]) {
            //                     var genericViewModelId = viewModelId.split("_")[0];
            //                     if (genericViewModelId === dbId) {
            //                         VisualGrid(viewModelId, regla);
            //                     }
            //                 }
            //             }
            //         }
            //     }
            // }

            if (AppDeclaracionesSAT.getConfig("view-rules")) {
                console.log("Resultado N/A -:- Tipo [Visual] -:- RuleId {0}-:- Regla {1}".format(reglaEntidad.idRegla, reglaEntidad.definicion));
            }
        } catch (err) {
            if (AppDeclaracionesSAT.getConfig("debug")) {
                console.log("Mensaje de error {0} -:- Regla {1}".format(err.message, reglaEntidad.definicion));
            }
        } finally {
            SAT.Environment.setSetting("executingRule", false);
        }
    }

    function Calculo(regla) {

        console.log("Inicia 'ViewModel.Calculo'");

        if (regla.noEjecutarCliente == "1") {
            return;
        }

        var result;
        var reglaEntidad = {};
        reglaEntidad.definicion = regla.definicion.trimAll();
        reglaEntidad.mensajeError = regla.mensajeError;
        reglaEntidad.idPropiedadAsociada = regla.idPropiedadAsociada;
        reglaEntidad.idRegla = regla.id;
        reglaEntidad.tipo = regla.tipoRegla;

        SAT.Environment.setSetting("executingRule", true);

        try {
            reglaEntidad.definicion = parametrosString(reglaEntidad.definicion);

            result = FormsBuilder.Runtime.evaluate(reglaEntidad.definicion);

            var exprs = reglaEntidad.definicion.match(/LLAMADAAJAX[(](.*?)[)]/igm);
            if (exprs && exprs.length > 0) {
                var newrule = result;
                result = FormsBuilder.Runtime.evaluate(newrule);
                if (newrule.includes("=")) {
                    exprs = newrule.split("=");

                    var rl = FormsBuilder.ViewModel.getFieldsForExprs()[exprs[0]];

                    var db_id2 = "E{0}P{1}".format(rl.entidad, rl.propiedad);
                    viewModel[fbUtils.getEntidad(db_id2)][db_id2](result);

                    var $input = $('input[view-model="{0}"]'.format(db_id2));
                    fbUtils.applyFormatCurrencyOnElement($input);
                    $input.focus().trigger("blur");
                }
            }

            console.log("REGLA: " + reglaEntidad.definicion);
            console.log("RESULTADO: " + result);

            if (AppDeclaracionesSAT.getConfig("view-rules")) {
                console.log("Resultado {0} -:- Tipo [{3}] -:- RuleId {1}-:- Regla {2}".format(result, reglaEntidad.idRegla, reglaEntidad.definicion, reglaEntidad.tipo));
            }

            if (result !== undefined) {
                exprs = reglaEntidad.definicion.split("=");
                var infoPropiedadCalculo = FormsBuilder.ViewModel.getFieldsForExprs()[exprs[0]];
                var idEntidadPropiedadCalculo = "E{0}P{1}".format(infoPropiedadCalculo.entidad, infoPropiedadCalculo.propiedad);
                var input = $('[view-model="{0}"]'.format(idEntidadPropiedadCalculo));

                viewModel[infoPropiedadCalculo.entidad][idEntidadPropiedadCalculo](result);
                fbUtils.applyFormatCurrencyOnElement(input);
            }
        } catch (err) {
            if (AppDeclaracionesSAT.getConfig("debug")) {
                console.log("Mensaje de error {0} -:- Regla {1}".format(err.message, reglaEntidad.definicion));
            }
        } finally {
            SAT.Environment.setSetting("executingRule", false);
        }

        return result;
    }

    function applyDataBindings(cb) {

        console.log(">>>> Inicia 'ViewModel.applyDataBindings'");

        var panels = $("#htmlOutput").children();

        SAT.Environment.setSetting("initialKoBinding", true);

        $.each(panels, function (key, panel) {
            try {
                $.each($(panel).find("[view-model]").not(".sat-container-clasificador2018"), function (k, controlViewModel) {
                    try {
                        var vmAttr = $(controlViewModel).attr("view-model");
                        var idEntidad = vmAttr.substring(1, vmAttr.indexOf("P"));
                        var vmEntidad = viewModel[parseInt(idEntidad)];

                        console.log("applyDataBindings -> view-model:{0}".format(vmAttr));

                        ko.applyBindings(vmEntidad, controlViewModel);
                    } catch (err) {
                        console.log(err.message);
                    }
                });
            } catch (err) {
                console.log(err.message);
            }
        });

        SAT.Environment.setSetting("initialKoBinding", false);

        if (cb && typeof cb === "function") {
            cb();
        }
    }

    function getEntitiesXml(entidades) {
        var newEntities = [];

        var seccionesVisibles = ["SAT_DATOS_GENERALES", "SAT_DATOS_ACUSE", "SAT_DATOS_ACUSE", "SAT_DATOS_CONTRIBUYENTE", "SAT_FOR"];
        var seccionesDialogo = ["SAT_OTROS_ESTIMULOS", "SAT_COMPENSACIONES"];
        var clavesImpuestos = [];
        var gridsAnidados = [];

        for (var entityId in viewModel) {
            var atributos = Enumerable.From(entidades).Where("$.id == '{0}'".format(entityId)).Select("$.atributos.atributo").FirstOrDefault();
            //xmlCopy.find('entidad[id="{0}"]'.format(entityId)).children('atributos');
            var tipo = Enumerable.From(atributos).Where("$.nombre === 'tipo'").Select("$.valor").FirstOrDefault();
            //atributos.find('atributo[nombre="tipo"]').attr("valor");
            var claveimpuesto = Enumerable.From(atributos).Where("$.nombre === 'ClaveImpuesto'").Select("$.valor").FirstOrDefault();
            //atributos.find('atributo[nombre="ClaveImpuesto"]').attr("valor");

            var visibilidadSeccion = false;
            if (flujoSecciones[entityId] !== undefined) {
                if (flujoSecciones[entityId].NoVisible !== undefined) {
                    visibilidadSeccion = !flujoSecciones[entityId].NoVisible;
                }
            } else {
                if ($.inArray(tipo, seccionesVisibles) > -1) {
                    visibilidadSeccion = true;
                }
            }

            if (visibilidadSeccion === true) {
                if (claveimpuesto !== undefined) {
                    clavesImpuestos.push(claveimpuesto);
                }

                var relacionesGrid = FormsBuilder.Modules.getRelacionesGrid()[entityId];
                if (relacionesGrid !== undefined) {
                    var props = Object.getOwnPropertyNames(relacionesGrid);
                    if (props.length > 0)
                        gridsAnidados.push(props[0]);
                }
            }

            if ($.inArray(entityId, gridsAnidados) > -1) {
                visibilidadSeccion = true;
            }

            if ($.inArray(tipo, seccionesDialogo) > -1) {
                if ($.inArray(claveimpuesto, clavesImpuestos) > -1) {
                    visibilidadSeccion = true;
                }
            }

            if (visibilidadSeccion === true) {
                newEntities.push(entityId);
            }
        }

        return newEntities;
    }

    function setIsMobile() {
        var propsEsMovil = fieldsForExprs["$67"];

        if (propsEsMovil && propsEsMovil.entidad && propsEsMovil.propiedad) {
            var db_id = "E{0}P{1}".format(propsEsMovil.entidad, propsEsMovil.propiedad);
            viewModel[propsEsMovil.entidad][db_id](Number(SAT.Environment.settings("isMobile")));
        }
    }

    function createXml(generarFacturas) {

        console.log(">>>> Inicia createXmlNew");

        var CLAVE_DED_PER = "SAT_DED_PER";
        var entidadesJson = FormsBuilder.XMLForm.getEntidades();
        var htmlOutput = $("#htmlOutput");
        var xml = $($.parseXML('<?xml version="1.0" encoding="utf-8" ?><modeloDatos><relacionesGrid /><calculos /><SubRegimenes /><ClabesBancarias /></modeloDatos>'));
        var seccionesVisibles = ["SAT_DATOS_GENERALES", "SAT_DATOS_ACUSE", "SAT_DATOS_ACUSE", "SAT_DATOS_CONTRIBUYENTE", "SAT_FOR"];
        var seccionesDialogo = ["SAT_OTROS_ESTIMULOS", "SAT_COMPENSACIONES"];
        var clavesImpuestos = [];
        var nodoDeducciones = sessionStorage.getItem(CLAVE_DED_PER);

        setIsMobile();

        Object.keys(viewModel).forEach(function (idEntidad) {
            var entidad = Enumerable.From(entidadesJson).Where("$.id == '{0}'".format(idEntidad)).FirstOrDefault();
            var atributos = entidad.atributos.atributo;
            var entityId = entidad.id;
            var tipo = Enumerable.From(atributos).Where("$.nombre === 'tipo'").Select("$.valor").FirstOrDefault();
            var claveimpuesto = Enumerable.From(atributos).Where("$.nombre === 'ClaveImpuesto'").Select("$.valor").FirstOrDefault();
            var tituloCorto = Enumerable.From(atributos).Where("$.nombre === 'TituloCorto'").Select("$.valor").FirstOrDefault();
            var tituloLargo = Enumerable.From(atributos).Where("$.nombre === 'TituloLargo'").Select("$.valor").FirstOrDefault();
            var llaveEntidad = Enumerable.From(atributos).Where("$.nombre === 'llave'").Select("$.valor").FirstOrDefault();
            var multiplicidad = Enumerable.From(atributos).Where("$.nombre === 'multiplicidad'").Select("$.valor").FirstOrDefault();            

            if (llaveEntidad !== CLAVE_DED_PER || !nodoDeducciones || generarFacturas === true) {
                var entityNode = $("<entidad />", xml);
                var visibilidadSeccion = false;
                var esClasificador2018 = $(".sat-container-clasificador2018[entidad='{0}']".format(idEntidad)).length > 0;

                if (!SAT.Environment.settings("isDAS")) {
                    if (flujoSecciones[entityId] !== undefined) {
                        if (flujoSecciones[entityId].NoAplica !== undefined) {
                            entityNode.attr("noaplica", flujoSecciones[entityId].NoAplica);
                        }

                        if (flujoSecciones[entityId].NoVisible !== undefined) {
                            visibilidadSeccion = !flujoSecciones[entityId].NoVisible;
                        }

                        if (flujoSecciones[entityId]["EntroSeccion"] !== undefined) {
                            entityNode.attr("entroseccion", flujoSecciones[entityId]["EntroSeccion"]);
                        }

                        if (flujoSecciones[entityId].OcultarMenuSeccion !== undefined) {
                            entityNode.attr("ocultarmenuseccion", flujoSecciones[entityId].OcultarMenuSeccion);
                        }
                    } else {
                        if ($.inArray(tipo, seccionesVisibles) > -1) {
                            visibilidadSeccion = true;
                        }
                    }
                } else {
                    visibilidadSeccion = true;
                }

                entityNode.attr("visibilidad", visibilidadSeccion);
                if (visibilidadSeccion === true) {
                    if (claveimpuesto !== undefined) {
                        clavesImpuestos.push(claveimpuesto);
                    }
                }

                if ($.inArray(tipo, seccionesDialogo) > -1) {
                    if ($.inArray(claveimpuesto, clavesImpuestos) > -1) {
                        visibilidadSeccion = true;
                    }
                }

                if (visibilidadSeccion === true) {
                    entityNode.attr("claveimpuesto", claveimpuesto);
                    entityNode.attr("id", entityId);
                    entityNode.attr("titulo", tituloCorto);
                    entityNode.attr("titulolargo", tituloLargo);
                    entityNode.attr("tipo", tipo);
                    entityNode.attr("clave", llaveEntidad);

                    if (multiplicidad === "*") {
                        var orden;
                        var detalle;
                        var propertyNode = $("<fila />", xml);

                        if (viewModelDetalle[entityId] !== undefined) {
                            entityNode.attr("numeroelementos", viewModelDetalle[entityId].length);
                            orden = 1;
                            for (var detalleId in viewModelDetalle[entityId]) {
                                detalle = viewModelDetalle[entityId][detalleId];
                                propertyNode.attr("identificador", orden);
                                propertyNode.attr("orden", orden);
                                orden++;

                                for (var det in detalle) {
                                    var propertyFile = $("<propiedad />", xml);
                                    var idPropiedad = detalle[det].propiedad;
                                    var propiedad = Enumerable.From(entidad.propiedades.propiedad).Where("$.id == '{0}'".format(idPropiedad)).FirstOrDefault();

                                    if (propiedad && propiedad.atributos && propiedad.atributos.atributo) {
                                        var llave = Enumerable.From(propiedad.atributos.atributo).Where("$.nombre == 'llave'").Select("$.valor").FirstOrDefault();
                                        var fechaIso = Enumerable.From(propiedad.atributos.atributo).Where("$.nombre == 'EsFechaISO'").Select("$.valor").FirstOrDefault();
                                        var catalogo = Enumerable.From(propiedad.atributos.atributo).Where("$.nombre == 'Catalogo'").Select("$.valor").FirstOrDefault();
                                        var valorDetalle = detalle[det].valor;
                                        var esFecha = /^[0-9_]{2}\/[0-9_]{2}\/[0-9_]{4}/igm.test(fbUtils.sanitizarValor(valorDetalle));

                                        propertyFile.attr("id", idPropiedad);
                                        propertyFile.attr("claveinformativa", propiedad.claveInformativa);

                                        if (!IsNullOrEmptyWhite(llave)) {
                                            propertyFile.attr("clave", llave);
                                        }

                                        if (!IsNullOrEmptyWhite(fechaIso)) {
                                            propertyFile.attr("esfechaiso", fechaIso);
                                        }

                                        if (!IsNullOrEmpty(detalle[det].etiqueta)) {
                                            propertyFile.attr("etiqueta", detalle[det].etiqueta);
                                        }

                                        if (esFecha) {
                                            if (!IsNullOrEmpty(valorDetalle) && !isDateEmpty(valorDetalle)) {
                                                var date = FECHA(valorDetalle);
                                                if (date !== fbUtils.getDateMin()) {
                                                    var dateISOString = date.toISOString();
                                                    propertyFile.text(dateISOString);
                                                }
                                            }
                                        } else {
                                            if (typeof (valorDetalle) === "string") {
                                                propertyFile.text(valorDetalle.replace(new RegExp(",", "g"), ""));
                                            } else {
                                                propertyFile.text(valorDetalle);
                                            }
                                        }

                                        propertyNode.append(propertyFile);
                                    }
                                }

                                entityNode.append(propertyNode);
                            }
                            $("modeloDatos", xml).append(entityNode);
                        } else {
                            entityNode.attr("grid", 1);

                            if (viewModelGrid[entityId] !== undefined && !esClasificador2018) {
                                orden = 1;
                                var numElementos = viewModelGrid[entityId].length;

                                entityNode.attr("numeroelementos", numElementos);

                                for (var i = 0; i < viewModelGrid[entityId].length; i++) {
                                    detalle = viewModelGrid[entityId][i];
                                    propertyNode.attr("identificador", orden);
                                    propertyNode.attr("orden", orden);
                                    orden++;

                                    for (var detGrid in detalle) {
                                        var idPropiedad = detGrid.substring(detGrid.indexOf("P") + 1, detGrid.length).split("_")[0];
                                        var propertyFile = $("<propiedad />", xml);
                                        var propiedad = Enumerable.From(entidad.propiedades.propiedad).Where("$.id == '{0}'".format(idPropiedad)).FirstOrDefault();

                                        if (propiedad && propiedad.atributos && propiedad.atributos.atributo) {
                                            var llave = Enumerable.From(propiedad.atributos.atributo).Where("$.nombre == 'llave'").Select("$.valor").FirstOrDefault();
                                            var fechaIso = Enumerable.From(propiedad.atributos.atributo).Where("$.nombre == 'EsFechaISO'").Select("$.valor").FirstOrDefault();
                                            var catalogo = Enumerable.From(propiedad.atributos.atributo).Where("$.nombre == 'Catalogo'").Select("$.valor").FirstOrDefault();
                                            var valorGrid = detalle[detGrid];
                                            var esFecha = /^[0-9_]{2}\/[0-9_]{2}\/[0-9_]{4}/igm.test(fbUtils.sanitizarValor(valorGrid));

                                            propertyFile.attr("id", idPropiedad);
                                            propertyFile.attr("claveinformativa", propiedad.claveInformativa);

                                            if (!IsNullOrEmptyWhite(llave)) {
                                                propertyFile.attr("clave", llave);
                                            }

                                            if (!IsNullOrEmptyWhite(fechaIso)) {
                                                propertyFile.attr("esfechaiso", fechaIso);
                                            }

                                            if (!IsNullOrEmptyWhite(catalogo)) {
                                                var etiqueta = FormsBuilder.Catalogs.getTextByValue(catalogo, valorGrid);
                                                propertyFile.attr("etiqueta", etiqueta);
                                            }

                                            if (esFecha) {
                                                if (!IsNullOrEmpty(valorGrid) && !isDateEmpty(valorGrid)) {
                                                    var date = FECHA(valorGrid);
                                                    if (date !== fbUtils.getDateMin()) {
                                                        var dateISOString = date.toISOString();
                                                        propertyFile.text(dateISOString);
                                                    }
                                                }

                                            } else {
                                                if (typeof (valorGrid) === "string") {
                                                    propertyFile.text(valorGrid.replace(new RegExp(",", "g"), ""));
                                                } else {
                                                    propertyFile.text(valorGrid);
                                                }
                                            }

                                            propertyNode.append(propertyFile);
                                        }
                                    }

                                    entityNode.append(propertyNode);
                                }
                                $("modeloDatos", xml).append(entityNode);
                            }
                        }
                    } else {
                        for (var propertyName in viewModel[entityId]) {
                            var ctl = htmlOutput.find('[view-model="{0}"]'.format(propertyName));
                            var esControlVisible = false;
                            var idPropiedad = propertyName.substring(propertyName.indexOf("P") + 1, propertyName.length);
                            var propiedad = Enumerable.From(entidad.propiedades.propiedad).Where("$.id == '{0}'".format(idPropiedad)).FirstOrDefault();

                            if (propiedad && propiedad.atributos && propiedad.atributos.atributo) {
                                var llave = Enumerable.From(propiedad.atributos.atributo).Where("$.nombre == 'llave'").Select("$.valor").FirstOrDefault();
                                var fechaIso = Enumerable.From(propiedad.atributos.atributo).Where("$.nombre == 'EsFechaISO'").Select("$.valor").FirstOrDefault();
                                var catalogo = Enumerable.From(propiedad.atributos.atributo).Where("$.nombre == 'Catalogo'").Select("$.valor").FirstOrDefault();
                                var propertyNode = $("<propiedad />", xml);
                                if (propertyName == "E360040PC11") {
                                    console.log("");
                                }
                                if (ctl.length > 0) {
                                    if ((ctl.css("display") !== "none") && (ctl.attr("type") !== "hidden")) {
                                        if (ctl.parents("[data-tipocontenedor][style*='display: none']").length === 0) {
                                            var idTab = ctl.parents("[idtab]").attr("id");
                                            var contenedorTabs = $(".containerTabs");
                                            if (contenedorTabs.find('[href="#{0}"]'.format(idTab)).parent().css("display") !== "none") {
                                                esControlVisible = true;
                                            }
                                        }
                                    }
                                }

                                propertyNode.attr("id", idPropiedad);
                                propertyNode.attr("visible", esControlVisible || false);

                                propertyNode.attr("claveinformativa", propiedad.claveInformativa || "");

                                if (!IsNullOrEmptyWhite(llave)) {
                                    propertyNode.attr("clave", llave);
                                }

                                if (!IsNullOrEmptyWhite(fechaIso)) {
                                    propertyNode.attr("esfechaiso", fechaIso);
                                }

                                if (!IsNullOrEmptyWhite(catalogo)) {
                                    var etiqueta = FormsBuilder.Catalogs.getTextByValue(catalogo, valorFlat);
                                    propertyNode.attr("etiqueta", etiqueta);
                                }

                                for (var checkIndex in viewModelCheckboxList) {
                                    var valueCheck = "";
                                    if (propertyName === checkIndex) {
                                        for (var checkval in viewModelCheckboxList[checkIndex]) {
                                            if (viewModelCheckboxList[checkIndex][checkval] === true) {
                                                valueCheck += checkval + ",";
                                            }
                                        }
                                        viewModel[entityId][propertyName](valueCheck);
                                    }
                                }

                                var valorFlat = viewModel[entityId][propertyName]();
                                var esFecha = /^[0-9_]{2}\/[0-9_]{2}\/[0-9_]{4}/igm.test(valorFlat);

                                if (esFecha) {
                                    if (!IsNullOrEmpty(valorFlat) && !isDateEmpty(valorFlat)) {
                                        var date = FECHA(valorFlat);
                                        if (date !== fbUtils.getDateMin()) {
                                            var dateISOString = date.toISOString();
                                            propertyNode.text(dateISOString);
                                        }
                                    }
                                } else {
                                    if (typeof (valorFlat) === "string") {
                                        propertyNode.text(valorFlat.replace(new RegExp(",", "g"), ""));
                                    } else {
                                        propertyNode.text(valorFlat);
                                    }
                                }

                                entityNode.append(propertyNode);
                            }
                        }
                    }

                    $("modeloDatos", xml).append(entityNode);
                }

                if (llaveEntidad === CLAVE_DED_PER && !esClasificador2018) {
                    sessionStorage.setItem(CLAVE_DED_PER, new XMLSerializer().serializeToString(entityNode[0]));
                }
            } else {
                var existeNodoDeducciones = $("modeloDatos", xml).find("entidad[clave='{0}']".format(CLAVE_DED_PER)).length > 0;

                if (!existeNodoDeducciones) {
                    $("modeloDatos", xml).append($(nodoDeducciones));
                }
            }
        });

        if (!SAT.Environment.settings("isDAS")) {
            var calculodeduccioninversion = $("<calculodeduccioninversion />", xml);
            var calculoamortizacion = $("<calculoamortizacion />", xml);

            calculodeduccioninversion.append(FormsBuilder.Modules.getCalculoInversionesJSONBase64());
            calculoamortizacion.append(FormsBuilder.Calculo.Amortizacion.getJsonBase64());

            $("modeloDatos calculos", xml).append(calculodeduccioninversion).append(calculoamortizacion);
        }

        var nodesClabes;
        var nodesSubRegimen;

        if (FormsBuilder.XMLForm.getCopyPrecarga() !== undefined) {
            nodesClabes = FormsBuilder.XMLForm.getCopyPrecarga().find("ClabesBancarias DatosBanco").clone();
            nodesSubRegimen = FormsBuilder.XMLForm.getCopyPrecarga().find("SubRegimenes Catalogo").clone();
            $("modeloDatos SubRegimenes", xml).append(nodesSubRegimen);
            $("modeloDatos ClabesBancarias", xml).append(nodesClabes);
        } else {
            nodesSubRegimen = FormsBuilder.XMLForm.getCopyDeclaracion().find("SubRegimenes Catalogo").clone();
            nodesClabes = FormsBuilder.XMLForm.getCopyDeclaracion().find("ClabesBancarias DatosBanco").clone();
            $("modeloDatos SubRegimenes", xml).append(nodesSubRegimen);
            $("modeloDatos ClabesBancarias", xml).append(nodesClabes);
        }

        console.log(">>>> Termina createXml");

        return new XMLSerializer().serializeToString(xml.context);
    }

    function parametrosString(definicionRegla) {
        var funciones = [
            "ESNULO",
            "OCULTAR",
            "MOSTRAR",
            "LIMPIARCHECK",
            "DESHABILITAR",
            "INHABILITAR",
            "HABILITAR",
            "OBLIGATORIO",
            "ELEMENTOSCOMBO",
            "ESENTEROPOSITIVO",
            "MOSTRARCONTENEDOR",
            "OCULTARCONTENEDOR",
            "FILTRARGRID",
            "MOSTRARBTNDETALLE",
            "OCULTARBTNDETALLE",
            "SUMA",
            "MAXCONDICIONADO",
            "MINCONDICIONADO",
            "CONTARREGISTROS",
            "RECALCULARCOLUMNA",
            "RECALCULARCOLUMNAS",
            "ELIMINARREGISTROGRID",
            "CANCELAREDICIONGRID",
            "CAMBIARTITULO",
            "MOVERTABAMENU",
            "QUITARTABDEMENU",
            "SUMACONDICIONALCLASIFICADOR",
            "ESCLABE",
            "ESCLABEDIGITOVERIFICADOR",
            "ESCLABEPLAZABANCARIA",
            "MOSTRARMENSAJEENMODAL",
            "EXCLUIROPCIONESCOMBO"
        ];

        for (var i = 0; i < funciones.length; i++) {
            var funcion = funciones[i];
            var funcionesRegla = fbUtils.extraerFuncion(funcion, definicionRegla);
            definicionRegla = modificarDefinicionRegla(funcionesRegla, definicionRegla);
        }

        return definicionRegla;
    }

    function modificarDefinicionRegla(expresiones, definicionRegla) {
        if (expresiones !== null) {
            expresiones = Enumerable.From(expresiones).Distinct().ToArray();
            $.each(expresiones, function (k, expresion) {
                var parentesisAbre = fbUtils.buscarCadena("(", expresion);
                var parentesisCierra = fbUtils.buscarCadena(")", expresion);
                var ultimoCierra = parentesisCierra[parentesisCierra.length - 1];
                if (parentesisAbre.length === 1 && parentesisCierra.length === 1) {
                    definicionRegla = definicionRegla.replaceAll(expresion, expresion.replace("(", '("').replace(")", '")'));
                } else if (parentesisAbre.length > 1 && parentesisCierra.length > 1) {
                    var parametros = expresion.substring(parentesisAbre[0] + 1, ultimoCierra);
                    var reemplazar = expresion.replace(parametros, '"' + parametros + '"');
                    definicionRegla = definicionRegla.replaceAll(expresion, reemplazar);
                }
            });
        }

        return definicionRegla;
    }

    function validarViewModel(viewModel) {
        var validacion = { "esViewModelCorrecto": false, "mensajeError": "" };
        if (viewModel) {
            for (var key in viewModel) {
                var idPropiedad = fbUtils.getPropiedad(key);
                var reglasValidacion = FormsBuilder.XMLForm.obtenerReglasPorIdPropiedad(idPropiedad, TIPO_REGLA.VALIDACION);

                if (reglasValidacion && reglasValidacion.length > 0) {
                    for (var i = 0; i < reglasValidacion.length; i++) {
                        var regla = reglasValidacion[i];
                        if (regla.mensajeErrorEnDialogo != "1") {
                            validacion.esViewModelCorrecto = Validacion(key, regla, false);

                            if (validacion.esViewModelCorrecto === false) {
                                validacion.mensajeError = fbUtils.procesarMensajeError(regla.mensajeError);
                                break;
                            }
                        }
                    }

                    if (validacion.esViewModelCorrecto === false) {
                        break;
                    }
                } else if (reglasValidacion && reglasValidacion.length === 0) {
                    validacion.esViewModelCorrecto = true;
                    break;
                }
            }
        }

        return validacion;
    }

    function obtenerObjetoPlano(viewModel) {
        var viewModelPlano = {};

        if (viewModel) {
            Object.keys(viewModel).forEach(function (key) {
                viewModelPlano[key] = viewModel[key]();
            });
        }

        return viewModelPlano;
    }
})();