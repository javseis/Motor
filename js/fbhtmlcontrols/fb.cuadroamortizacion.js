/**

*/
/*global namespace:false, FormsBuilder:false, SAT: false, AppDeclaracionesSAT:false, ko:false, Base64:false */

"use strict";

(function () {
    namespace("FormsBuilder.Calculo.Amortizacion", loadedUI, fillViewModel, getJsonBase64, getModel);

    var DBID_MODAL = "calculoAmor";
    //#region Classes
    function toFixedValue(inputValue, precision) {
        var result = inputValue;
        if (!IsNullOrEmptyWhite(result)) {
            var value = parseFloat(result);
            result = typeof (value) == "number" ? value.toFixed(precision) : result;
        }
        return result;
    }

    var InfoRegimen = function (name, _formatLabelPEAAE, _formatlabelPEAPAA, id) {
        this.Id = id;
        this.Name = name;
        var formatLabelPEAAE = _formatLabelPEAAE;
        var formatlabelPEAPAA = _formatlabelPEAPAA;
        var labelPEAAE;
        var labelPEAPAA;
        var entidadesJson = FormsBuilder.XMLForm.getEntidades();
        this.LabelPEAAE = function (dbId) {
            var idPropiedad = fbUtils.getPropiedad(dbId);
            //var formularioXml = FormsBuilder.XMLForm.getCopy();
            //var queryPropiedad = "modeloDatos propiedad[id='{0}']".format(idPropiedad);            
            var propiedad = Enumerable.From(entidadesJson).SelectMany("$.propiedades.propiedad").Where("$.id == '{0}'".format(idPropiedad)).FirstOrDefault();
            var tituloCorto = Enumerable.From(propiedad.atributos.atributo).Where("$.nombre == 'TituloCorto'").Select("$.valor").FirstOrDefault();
            //$(queryPropiedad, formularioXml).find('atributo[nombre="TituloCorto"]').attr("valor");
            labelPEAAE = formatLabelPEAAE.format(tituloCorto);
            return labelPEAAE;
        };
        this.LabelPEAPAA = function (dbId) {
            var idPropiedad = fbUtils.getPropiedad(dbId);
            // var formularioXml = FormsBuilder.XMLForm.getCopy();
            // var queryPropiedad = "modeloDatos propiedad[id='{0}']".format(idPropiedad);
            var propiedad = Enumerable.From(entidadesJson).SelectMany("$.propiedades.propiedad").Where("$.id == '{0}'".format(idPropiedad)).FirstOrDefault();
            var tituloCorto = Enumerable.From(propiedad.atributos.atributo).Where("$.nombre == 'TituloCorto'").Select("$.valor").FirstOrDefault();
            //$(queryPropiedad, formularioXml).find('atributo[nombre="TituloCorto"]').attr("valor");
            labelPEAPAA = formatlabelPEAPAA.format(tituloCorto);
            return labelPEAPAA;
        };
    };

    var SubRegimenes = {
        ActividadesProfesionales: new InfoRegimen(
            "Actividad Profesional",
            "{0}",
            "{0}",
            "4"),
        ActividadEmpresarialYProfesional: new InfoRegimen(
            "Actividad Empresarial y Profesional",
            "{0}",
            "{0} de Datos Informativos",
            "2"),
        ActividadEmpresarialContabilidad: new InfoRegimen(
            "Actividad Empresarial Contabilidad Simplificada",
            "{0}",
            "{0} de Datos Informativos",
            "3"),
        RegimenIntermedio: new InfoRegimen(
            "Regimen Intermedio",
            "{0}",
            "{0} de Datos Informativos",
            "5")
    };

    var ClavesResultado = {
        PerdidasEjerciciosAnteAplicadosEjercicio: "PEAAE",
        PerdidasEjerciciosAntePendientesAmortActualizados: "PEAPAA"
    };

    var Tipo = {
        Utilidad: "Utilidad",
        Perdida: "Perdida",
        CalculoNegativo: "CalculoNegativo",
        PerdidaOmitida: "PerdidaOmitida",
        PerdidaEnCalculo: "PerdidaEnCalculo"
    };

    var Ejercicio = function (year, tipo, valor) {
        var self = this;
        this.Year = ko.observable(year || 0);
        this.Tipo = ko.observable(tipo).withPausing();
        this.Valor = ko.observable(valor).withPausing();
        this.IsActive = ko.observable(true).withPausing();
        this.IsCalculo = ko.observable(false).withPausing();
        this._perdidaEjercicioAntPendAplicar = ko.observable();
        this._InpcDic = ko.observable();
        this.INPCDic = ko.computed(
            {
                read: function () {
                    if (!self._InpcDic()) {
                        if (self.Tipo() === Tipo.Perdida) {
                            var inpc = FormsBuilder.Catalogs.getCatalog('INPC').find('elemento[anio="{0}"][mes="12"]'.format(self.Year()));
                            if (inpc) {
                                self._InpcDic(inpc.attr("indice"));
                            }
                        }
                    }
                    return self._InpcDic();
                },
                write: function (value) {
                    self._InpcDic(value);
                },
                owner: this
            }
        );
        this.PerdidaEjercicioAntPendAplicar = ko.computed({
            read: function () {
                return self._perdidaEjercicioAntPendAplicar();
            },
            write: function (value) {
                var result = TRUNCAR(value, 2);
                self._perdidaEjercicioAntPendAplicar(result);
            },
            owner: this
        });
        this.changeTipo = function (data, value) {
            data.Tipo(value);
        };
        this.inicializa = function (ejercicio) {
            if (ejercicio) {
                this.Year(ejercicio.Year());
                this.Valor(ejercicio.Valor() || 0);
            }
        };

        var getElementWithClass = function (element, className) {
            var result;
            var $element = $(element);
            var $contentParent = $element.parents(".{0}:first".format(className));
            if ($contentParent.hasClass(className)) {
                result = $contentParent.find("input:first");
            } else {
                var $contentRow = $element.parents("tr:first");
                result = $contentRow.find(".{0} input:first".format(className));
            }
            return result;
        };
        this.validValor = function (data, event, element) {
            event = event || window.event;
            var validTipoWasSelected = IsNullOrEmpty(self.Tipo()) && !IsNullOrEmpty(self.Valor());
            element = getElementWithClass(element, "valor");
            var $target = element ? $(element) : $(event.target);
            ShowValidationMesaggeIf(validTipoWasSelected, $target, "No ha especificado el tipo de ejercicio");
        };

        //#region Properties Formated
        this.INPCDicFixed = ko.computed(function () {
            var result = TRUNCAR(self.INPCDic(), 4);
            return toFixedValue(result, 4);
        }, this);
        this.ValorFixed = ko.computed(function () {
            return toFixedValue(self.Valor(), 2);
        }, this);
        this.PerdidaEjercicioAntPendAplicarFixed = ko.computed(function () {
            return toFixedValue(self.PerdidaEjercicioAntPendAplicar(), 2);
        }, this);
        //#endregion
    };

    var Perdida = function (ejercicio, keepReference) {
        var self = this;
        extend(this, keepReference ? ejercicio : new Ejercicio());
        if (!keepReference) {
            this.inicializa(ejercicio);
        }
        this.Tipo(Tipo.Perdida);
        this.INPCJul = ko.computed(function () {
            var result = NaN;
            if (self.IsCalculo()) {
                return result;
            }
            var inpc = FormsBuilder.Catalogs.getCatalog('INPC').find('elemento[anio="{0}"][mes="7"]'.format(this.Year()));
            if (inpc) {
                result = inpc.attr("indice");
            }
            return result;

        }, this);
        this.FA = ko.computed(function () {
            var result = NaN;
            if (self.IsCalculo()) {
                return result;
            }
            var fa = this.INPCDic() / self.INPCJul();
            fa = fa.toFixed(5);
            result = TRUNCAR(fa, 4);
            return result;
        }, this);
        this.PerdidaActualizadaDic = ko.computed(function () {
            var result = this.Valor() * self.FA();
            result = result.toFixed(5);
            return TRUNCAR(result, 2);
        }, this);
        //#region Properties Formated
        this.INPCJulFixed = ko.computed(function () {
            var result = TRUNCAR(self.INPCJul(), 4);
            return toFixedValue(result, 4);
        }, this);
        this.FAFixed = ko.computed(function () {
            return toFixedValue(self.FA(), 4);
        }, this);
        this.PerdidaActualizadaDicFixed = ko.computed(function () {
            return toFixedValue(self.PerdidaActualizadaDic(), 2);
        }, this);
        //#endregion
    };

    var Utilidad = function (ejercicio, keepReference) {
        var self = this;
        extend(this, keepReference ? ejercicio : new Ejercicio());
        this._perdidaFiscalActualizada = ko.observable();
        this._utilidadGravableEjercicio = ko.observable();
        this.NotCalculatePerdidaFiscalActualizada = ko.observable(false);
        if (!keepReference) {
            this.inicializa(ejercicio);
        }
        this.Tipo(Tipo.Utilidad);
        this.PerdidaFiscalAplicada = ko.observable();
        this.INPCJun = ko.computed(function () {
            var result = NaN;
            var inpc = FormsBuilder.Catalogs.getCatalog('INPC').find('elemento[anio="{0}"][mes="6"]'.format(this.Year()));
            if (inpc) {
                result = inpc.attr("indice");
            }
            return result;
        }, this);
        this.FA = ko.computed(function () {
            var result;
            if (parseFloat(self.INPCJun()) < parseFloat(this.INPCDic())) {
                return 1;
            }
            var fa = self.INPCJun() / this.INPCDic();
            fa = fa.toFixed(5);
            result = TRUNCAR(fa, 4);
            return result;
        }, this);
        this.PerdidaFiscalActualizada = ko.computed({
            read: function () {
                return self._perdidaFiscalActualizada();
            },
            write: function (value) {
                var result = value;
                if (!self.NotCalculatePerdidaFiscalActualizada()) {
                    result = value * self.FA();
                }
                result = result.toFixed(5);
                result = TRUNCAR(result, 2);
                self._perdidaFiscalActualizada(result);
            },
            owner: this
        });
        this.UtilidadGravableEjercicio = ko.computed({
            read: function () {
                return self._utilidadGravableEjercicio();
            },
            write: function (value) {
                var result = TRUNCAR(value, 2);
                self._utilidadGravableEjercicio(result);
            },
            owner: this
        });
        //#region Properties Formated
        this.INPCJunFixed = ko.computed(function () {
            var result = TRUNCAR(self.INPCJun(), 4);
            return toFixedValue(result, 4);
        }, this);
        this.FAFixed = ko.computed(function () {
            return toFixedValue(self.FA(), 4);
        }, this);
        this.PerdidaFiscalAplicadaFixed = ko.computed(function () {
            return toFixedValue(self.PerdidaFiscalAplicada(), 2);
        }, this);
        this.PerdidaFiscalActualizadaFixed = ko.computed(function () {
            return toFixedValue(self.PerdidaFiscalActualizada(), 2);
        }, this);
        this.UtilidadGravableEjercicioFixed = ko.computed(function () {
            return toFixedValue(self.UtilidadGravableEjercicio(), 2);
        }, this);
        //#endregion
    };

    var Calculo = function (perdida, utilidadesAdyacentes) {
        var self = this;
        var _yearLastUtilidad;
        var _utilidadesAdyacentesOrdered;
        var breakingIndex;
        this.Perdida = perdida;
        this.UtilidadesAdyacentes = ko.observableArray(utilidadesAdyacentes);
        this.UtilidadesAdyacentesOrdered = function () {
            if (!_utilidadesAdyacentesOrdered) {
                _utilidadesAdyacentesOrdered = self.UtilidadesAdyacentes.sort(byYear);
            }
            return _utilidadesAdyacentesOrdered;
        };
        this.YearLastUtilidad = function () {
            if (!_yearLastUtilidad) {
                var years = [];
                $.each(self.UtilidadesAdyacentes(), function (index, value) {
                    years.push(value.Year());
                });
                _yearLastUtilidad = Math.max.apply(this, years);
            }
            return _yearLastUtilidad;
        };

        this.getPerdidaFiscalActualizadaFromUtilidadAdyacente = function (indexUtilidad) {
            var result;
            var utilidad = self.UtilidadesAdyacentesOrdered()[indexUtilidad];
            if (!utilidad) {
                return result;
            }
            if (indexUtilidad === 0) {
                utilidad.INPCDic(self.Perdida.INPCDic());
                if (self.Perdida.IsCalculo()) {
                    result = self.Perdida.Valor() * utilidad.FA();
                    result = result.toFixed(5);
                    result = TRUNCAR(result, 2);
                } else {
                    result = self.Perdida.PerdidaActualizadaDic();
                }
            } else {
                var previousUtilidad = self.UtilidadesAdyacentesOrdered()[indexUtilidad - 1];
                utilidad.INPCDic(previousUtilidad.INPCJun());
                if (previousUtilidad.PerdidaEjercicioAntPendAplicar() <= 0) {
                    breakingIndex = indexUtilidad;
                    previousUtilidad.PerdidaEjercicioAntPendAplicar(undefined);
                    result = undefined;
                } else {
                    result = previousUtilidad.PerdidaEjercicioAntPendAplicar();
                }
            }
            return result;
        };

        this.convertCalculo = function (indexUtilidad, operacion) {
            var utilidad = self.UtilidadesAdyacentesOrdered()[indexUtilidad];
            var isUtilidad = operacion > 0;
            if (isUtilidad) {
                utilidad.UtilidadGravableEjercicio(operacion);
                extend(self, new Utilidad());
                self.Year(utilidad.Year());
            } else {
                operacion *= -1;
                utilidad.PerdidaEjercicioAntPendAplicar(operacion);
                extend(self, new Perdida());
                self.Year(self.Perdida.Year());
                self.INPCDic(utilidad.INPCJun());
            }
            return operacion;
        };

        var removeUtilidadesNegativas = function () {
            var itemsToRemove = [];
            $.each(self.UtilidadesAdyacentesOrdered(), function (index, item) {
                if (breakingIndex === 0) {
                    if (index > breakingIndex) {
                        itemsToRemove.push(item);
                        return;
                    }
                } else {
                    if (index >= breakingIndex) {
                        itemsToRemove.push(item);
                        return;
                    }
                }
            });
            $.each(itemsToRemove, function (index, item) {
                self.UtilidadesAdyacentes.remove(item);
            });
        };

        this.calculate = function () {
            $.each(self.UtilidadesAdyacentesOrdered(), function (index, utilidad) {
                var perdidaFiscalActualizada = self.getPerdidaFiscalActualizadaFromUtilidadAdyacente(index);
                utilidad.PerdidaFiscalActualizada(perdidaFiscalActualizada);

                if (index === 0 && self.Perdida.IsCalculo()) {
                    utilidad.NotCalculatePerdidaFiscalActualizada(true);
                    utilidad.PerdidaFiscalActualizada(perdidaFiscalActualizada);
                }
                if (breakingIndex !== undefined) {
                    utilidad.UtilidadGravableEjercicio(utilidad.Valor());
                    return;
                }

                var operacion;
                if (utilidad.Year() != self.YearLastUtilidad()) {
                    utilidad.UtilidadGravableEjercicio(utilidad.Valor());
                    operacion = utilidad.PerdidaFiscalActualizada() - utilidad.UtilidadGravableEjercicio();
                    operacion = operacion.toFixed(5);
                    utilidad.PerdidaEjercicioAntPendAplicar(operacion);
                }
                if (utilidad.Year() == self.YearLastUtilidad()) {
                    var perdidaFiscalAplicada = Math.min(utilidad.PerdidaFiscalActualizada(), utilidad.Valor());
                    utilidad.PerdidaFiscalAplicada(perdidaFiscalAplicada);
                    operacion = utilidad.Valor() - utilidad.PerdidaFiscalActualizada();
                    operacion = operacion.toFixed(5);
                    operacion = self.convertCalculo(index, operacion);
                    operacion = TRUNCAR(operacion, 2);
                    self.Valor(operacion);
                }
            });

            if (breakingIndex !== undefined) {
                removeUtilidadesNegativas();
                extend(self, new Ejercicio(self.Perdida.Year()));
                self.Tipo(Tipo.CalculoNegativo);

            }
            self.IsCalculo(true);
        };

        this.getOperacionNoAplicadaFromUtilidadAdyacente = function (indexUtilidadAdyacente) {
            var result;
            if (self.UtilidadesAdyacentes().length == 1 && (self.Tipo() != Tipo.CalculoNegativo && self.Tipo() != Tipo.Perdida && self.Tipo() != Tipo.PerdidaOmitida)) {
                return result;
            }
            if (self.IsCalculo()) {
                var lastUtilidad = self.UtilidadesAdyacentes().length - 1;
                var utilidad = self.UtilidadesAdyacentes()[indexUtilidadAdyacente];
                if (self.Tipo() == Tipo.Utilidad) {
                    result = undefined;
                }
                if ((self.Tipo() == Tipo.Perdida || self.Tipo() == Tipo.PerdidaOmitida) && indexUtilidadAdyacente == lastUtilidad) {
                    result = utilidad.PerdidaEjercicioAntPendAplicar();
                }
                if (indexUtilidadAdyacente != lastUtilidad) {
                    result = utilidad.UtilidadGravableEjercicio();
                }
                if (self.Tipo() == Tipo.CalculoNegativo) {
                    result = utilidad.PerdidaFiscalActualizada();
                }
            }
            return result;
        };

    };

    var Operacion = function (perdida, utilidad, year, perdidaNoaAplicada, isCalculo, noUtilitiesBefore) {
        var self = this;
        this.Year = ko.observable(year);
        this.Perdida = perdida;
        this.Utilidad = utilidad;
        this.ContainsResultToTransfer = ko.observable();
        this.PerdidaNoAplicada = undefined;
        if (noUtilitiesBefore && this.Perdida instanceof Perdida) {
            this.Perdida.PerdidaEjercicioAntPendAplicar(perdidaNoaAplicada);
        } else {
            this.PerdidaNoAplicada = perdidaNoaAplicada;
            if (!isCalculo) {
                this.Perdida.PerdidaEjercicioAntPendAplicar(undefined);
            }
        }
        this.IsCalculo = isCalculo;
        //#region Properties Formated
        this.PerdidaNoAplicadaFixed = function () {
            return toFixedValue(self.PerdidaNoAplicada, 2);
        };
        //#endregion
    };

    var ModalData = function (ejercicios) {
        var self = this;

        var elementsByPage = 11;
        this.actualPage = ko.observable(0);

        //#region Search Method
        this.getPerdida = function (year) {
            var perdidas = self._perdidas().concat(self.calculosPerdida());
            var query = ko.utils.arrayFilter(perdidas, function (ejer) {
                return ejer.Year() == year && ejer.IsActive();
            });
            return query && query.length > 0 ? query[0] : undefined;
        };

        this.getUtilidad = function (year) {
            var utilidades = self._utilidades().concat(self.calculosUtilidad());
            var query = ko.utils.arrayFilter(utilidades, function (ejer) {
                return ejer.Year() == year && ejer.IsActive();
            });
            return query && query.length > 0 ? query[0] : undefined;
        };

        this.existUtilidadOfDeclaracion = function () {
            var utilidades = self._utilidades().concat(self.calculosUtilidad());
            var query = ko.utils.arrayFilter(utilidades, function (ejer) {
                return ejer.Year() == getYearDeclaracion() && !ejer.IsCalculo() && ejer.IsActive();
            });
            return query.length > 0;
        };

        this.getUtilidadesBetweenInclusive = function (yearMax, yearMin) {
            var result = [];
            var utilidades = self._utilidades().concat(self.calculosUtilidad());
            var utilidadesFiltered = ko.utils.arrayFilter(utilidades, function (ejer) {
                return (ejer.Year() <= yearMax && ejer.Year() >= yearMin) && ejer.IsActive();
            });
            $.each(utilidadesFiltered, function (index, item) {
                result.push(new Utilidad(item));
            });
            return result;
        };

        this.getYearsBetweenExclusive = function (yearMax, yearMin) {
            var result = [];
            var utilidades = self._utilidades().concat(self.calculosUtilidad());
            var years = ko.utils.arrayFilter(utilidades, function (ejer) {
                return (ejer.Year() < yearMax && ejer.Year() > yearMin) && ejer.IsActive();
            });
            $.each(years, function (index, ejer) {
                result.push(ejer.Year());
            });

            return result;
        };

        this.TipoLastEjercicio = function () {
            var ejerciciosActivos = self.perdidasFilter().concat(self.utilidadesFilter());
            ejerciciosActivos.sort(byYear);
            var indexLastEjercicio = ejerciciosActivos.length - 1;
            return ejerciciosActivos[indexLastEjercicio].Tipo();

        };

        this.getPerdidasBefore = function (year) {
            var perdidas = self._perdidas().concat(self.calculosPerdida());
            return ko.utils.arrayFilter(perdidas, function (ejer) {
                return ejer.Year() < year && ejer.IsActive();
            });
        };
        //#endregion

        //#region Events
        this.applyCurrencyFormatToPane = function (data, event) {
            event = event || window.event;
            var $target = $(event.target);
            $target = $target.has("a") > 0 ? $target.find("a") : $target;
            var tabPaneId = $target.attr("href");
            var $contentBody = $target.parents(".modal-body:first");
            var $tabPane = $contentBody.find(tabPaneId);
            $tabPane.find(".currency").formatCurrency({ region: 'es-MX' });
            $tabPane.find(".currency-four").formatCurrency({ region: 'es-MX', roundToDecimalPlace: 4 });
        };

        this.declareCustomEvents = function (elements, data) {
            $(elements).find(".tipo button").click(function (event) {
                event = event || window.event;
                var $target = $(event.target);
                var $row = $target.parents("tr");
                var dataRow = data;
                var isDisabled = $row.find('.valor input').attr('disabled') !== undefined;
                if (isDisabled) {
                    dataRow.Valor('');
                } else {
                    $row.find('.valor input').formatCurrency({ region: 'es-MX' });
                }
            });
        };

        this.applyCurrencyFormatToSection = function (data, event) {
            event = event || window.event;
            var $target = $(event.target);
            var $section = $target.parents(".tab-pane.active:first");
            $section.find(".currency").formatCurrency({ region: 'es-MX' });
            $section.find(".currency-four").formatCurrency({ region: 'es-MX', roundToDecimalPlace: 4 });
        };

        this.formatNumber = function (data, event) {
            event = event || window.event;
            var target = event.target;
            var valor = $(target).val();
            valor = TRUNCAR(valor, 2);
            $(target).val(valor);
            $(target).formatCurrency({ region: 'es-MX', roundToDecimalPlace: 0 });
        };

        this.toNumber = function (data, event) {
            event = event || window.event;
            var target = event.target;
            $(target).toNumber();
        };


        this.selectElement = function (data, event) {
            event = event || window.event;
            var id = $(event.target).parents("div[id*=div]:first").attr("id");
            $("#{0}".format(id)).find('.list-group-item').removeClass("active").removeClass('activeItem');

            var divElement;
            if ($(event.target).hasClass("list-group-item")) {
                divElement = $(event.target);
            } else {
                divElement = $(event.target).parents(".list-group-item");
            }
            divElement.toggleClass("active").addClass('activeItem');

        };

        var doCalculo = function (perdida, perdidasOmitidas, utilidad, utilidades) {
            perdida.IsActive(false);
            if (!perdida.IsCalculo()) {
                perdida.Tipo(Tipo.PerdidaEnCalculo);
            }
            $.each(perdidasOmitidas, function (index, value) {
                value.Tipo(Tipo.PerdidaOmitida);
            });

            var newCalculo = new Calculo(perdida, utilidades);

            newCalculo.calculate();

            if (newCalculo.Tipo() != Tipo.CalculoNegativo) {
                utilidad.IsActive(false);
            }

            self.calculos.push(newCalculo);
        };

        this.aplicarAmortizacion = function (data, event) {
            event = event || window.event;
            var panelElement = $(event.target).parents(".tab-pane:first");

            var perdidaElement = panelElement.find("div[id*='divPerdidas'] a.active:first");
            var utilidadElement = panelElement.find("div[id*='divUtilidades'] a.active:first");

            if (ShowMessageIf(!perdidaElement[0] || !utilidadElement[0], "Se debe de seleccionar una pérdida y una utilidad.", event)) {
                preventDefaultEvent(event);
                return;
            }

            var yearPerdida = perdidaElement.find('h3 > span').text();
            var yearUtilidad = utilidadElement.find('h3 > span').text();
            if (ShowMessageIf(yearUtilidad < yearPerdida, "No se puede aplicar una pérdida a una utilidad de un año anterior.", event)) {
                preventDefaultEvent(event);
                return;
            }

            var perdida = self.getPerdida(yearPerdida);
            var perdidasOmitidas = self.getPerdidasBefore(yearPerdida);


            var utilidad = self.getUtilidad(yearUtilidad);
            var utilidades = self.getUtilidadesBetweenInclusive(yearUtilidad, yearPerdida);
            var yearsBeforeText = self.getYearsBetweenExclusive(yearUtilidad, yearPerdida).join(',');
            var message = "Existen ejercicios anteriores ({0}) con utilidad fiscal contra los que puede amortizarse la pérdida seleccionada. ".format(yearsBeforeText) +
                "Recuerde que pierde el derecho a disminuirla posteriormente hasta por la cantidad en la que pudo haber amortizado." +
                "¿Es correcta su aplicacion?";

            if (!ShowMessageIf(utilidades.length > 1, message, event, function (e) {
                doCalculo(perdida, perdidasOmitidas, utilidad, utilidades);
                self.applyCurrencyFormatToSection(data, event);
                hideMessageModal(e);
            })) {
                doCalculo(perdida, perdidasOmitidas, utilidad, utilidades);
                self.applyCurrencyFormatToSection(data, event);
            }
        };

        this.clean = function () {
            self.calculos([]);
            self.ejercicios.valueHasMutated();
        };

        this.adviceNoCalculos = function (data, event) {
            event = event || window.event;
            if (ShowMessageIf(self._perdidas().length === 0 && self._utilidades().length === 0, "No has capturado alguna utilidad o pérdida. Regresa a la pestaña de '1. Captura' e ingresa algunos datos", event)) {
                preventDefaultEvent(event);
                return;
            }

            if (ShowMessageIf(self.calculos().length === 0 && (self._perdidas().length > 0 && self._utilidades().length > 0), "No has indicado la aplicación de las pérdidas contra las utilidades.", event)) {
                preventDefaultEvent(event);
                return;
            }

        };

        this.showHelpText = function (data, event) {
            event = event || window.event;
            var target = $(event.target);
            var node = target.has('[help-text]').length > 0 ? target : target.parents('*[help-text]:first');

            var helpText = node.attr('help-text');
            var helpContainer = target.parents(".tab-pane:first").find(".help");
            helpContainer.find('.divHelp').html(helpText);
            helpContainer.find('.divCommonText').addClass('hidden');
            helpContainer.find('.divHelp').removeClass('hidden');
        };

        this.hideHelpText = function (data, event) {
            event = event || window.event;
            var target = $(event.target);
            var helpContainer = target.parents(".tab-pane:first").find(".help");
            helpContainer.find('.divCommonText').removeClass('hidden');
            helpContainer.find('.divHelp').addClass('hidden');
        };

        //#endregion

        //#region Properties
        this.ejercicios = ko.observableArray(ejercicios);
        this.calculos = ko.observableArray();
        this.calculosUtilidad = ko.computed(function () {
            return ko.utils.arrayFilter(self.calculos(), function (calc) {
                return calc.Tipo() === Tipo.Utilidad;
            });
        }, this);
        this.calculosPerdida = ko.computed(function () {
            return ko.utils.arrayFilter(self.calculos(), function (calc) {
                return calc.Tipo() === Tipo.Perdida;
            });
        }, this);
        this._utilidades = ko.computed(function () {
            var result = [];
            var elements = ko.utils.arrayFilter(self.ejercicios(), function (ejer) {
                return ejer.Tipo() === Tipo.Utilidad && ejer.Valor() > 0;
            });
            $.each(elements, function (index, value) {
                result.push(new Utilidad(value));
            });
            return result;
        }, this);
        this._perdidas = ko.computed(function () {
            var result = [];
            var elements = ko.utils.arrayFilter(self.ejercicios(), function (ejer) {
                return ejer.Tipo() === Tipo.Perdida && ejer.Valor() > 0;
            });
            $.each(elements, function (index, value) {
                result.push(new Perdida(value));
            });
            return result;
        }, this);

        this.utilidadesFilter = ko.computed(function () {
            var result = self._utilidades().concat(self.calculosUtilidad());
            result = ko.utils.arrayFilter(result, function (u) {
                return !IsNullOrEmpty(u.Valor()) && u.IsActive();
            });
            result.sort(byYear);
            return result;
        }, this);
        this.perdidasFilter = ko.computed(function () {
            var result = self._perdidas().concat(self.calculosPerdida());
            result = ko.utils.arrayFilter(result, function (p) {
                return p.Tipo() === Tipo.Perdida && !IsNullOrEmpty(p.Valor()) && p.IsActive();
            });
            result.sort(byYear);
            return result;
        }, this);

        var markOperationsForResultToTransfer = function (operations) {
            var years = {};
            $.each(operations, function (index, oper) {
                var year = oper.Year();
                if (!years.hasOwnProperty(year)) {
                    years[year] = [index];
                } else {
                    years[year].push(index);
                }
            });
            $.each(years, function (index, operationsYear) {
                var indexLastOperation = operationsYear[operationsYear.length - 1];
                operations[indexLastOperation].ContainsResultToTransfer(true);
            });

        };
        var getYearLastUtilidad = function () {
            var yearLastUtilidad = 0;
            var utilidades = self._utilidades().concat(self.calculos());
            utilidades = ko.utils.arrayFilter(utilidades, function (value) {
                return value.IsActive();
            }).sort(byYear).reverse();

            if (utilidades[0]) {
                yearLastUtilidad = utilidades[0].Year();
            }
            return yearLastUtilidad;
        };

        this.resultado = ko.computed(function () {
            var result = [];
            var toShow = self._perdidas().concat(self.calculos());
            toShow = ko.utils.arrayFilter(toShow, function (value) {
                return (value.Tipo() == Tipo.Perdida ||
                    value.Tipo() == Tipo.PerdidaOmitida ||
                    value.Tipo() == Tipo.CalculoNegativo) ||
                    (value.IsCalculo() && value.Tipo() == Tipo.Utilidad);

            });
            var yearLastUtilidad = getYearLastUtilidad();
            toShow.sort(byYear);
            var yearsAdded = {};
            $.each(toShow, function (index, value) {
                var perdidaNoAplicada;
                var utilidadOperacion = {};
                var perdidaOperacion = {};
                var yearOperacion;
                var noUtilitiesBefore = undefined;
                if (value.IsCalculo()) {
                    $.each(value.UtilidadesAdyacentesOrdered(), function (indexUt, utilidad) {
                        var yearPerdida = value.Perdida.Year();
                        if (!yearsAdded.hasOwnProperty(yearPerdida)) {
                            perdidaOperacion = value.Perdida;
                            yearsAdded[yearPerdida] = {};
                        } else {
                            perdidaOperacion = {};
                        }
                        utilidadOperacion = utilidad;
                        yearOperacion = value.Perdida.Year();
                        perdidaNoAplicada = value.getOperacionNoAplicadaFromUtilidadAdyacente(indexUt);
                        if (utilidad.Year() == value.YearLastUtilidad()) {
                            noUtilitiesBefore = value.Year() >= yearLastUtilidad;
                        }
                        result.push(new Operacion(perdidaOperacion, utilidadOperacion, yearOperacion, perdidaNoAplicada, true, noUtilitiesBefore));
                    });
                } else {
                    noUtilitiesBefore = value.Year() > yearLastUtilidad;
                    perdidaNoAplicada = value.PerdidaActualizadaDic();
                    yearOperacion = value.Year();
                    perdidaOperacion = value;
                    utilidadOperacion = {};
                    result.push(new Operacion(perdidaOperacion, utilidadOperacion, yearOperacion, perdidaNoAplicada, false, noUtilitiesBefore));
                }

            });
            result.sort(byYear);
            markOperationsForResultToTransfer(result);
            return result;
        });

        this.PerdidasEjerciciosAnterioresAplicadasEjercicio = ko.computed(function () {
            var suma = 0;
            var operacionesWithPerdidaEjercicioAntPendAplicar = ko.utils.arrayFilter(self.resultado(), function (oper) {
                return oper.ContainsResultToTransfer();
            });
            $.each(operacionesWithPerdidaEjercicioAntPendAplicar, function (index, oper) {
                var valor;
                if (oper.IsCalculo) {
                    valor = oper.Utilidad.PerdidaEjercicioAntPendAplicar() || 0;
                } else {
                    valor = oper.Perdida.hasOwnProperty("PerdidaEjercicioAntPendAplicar") ? oper.Perdida.PerdidaEjercicioAntPendAplicar() || 0 : 0;
                }
                suma += valor;
            });
            return Math.round(suma);
        }, this);

        this.PerdidasEjerciciosAnterioresPendientesAmortizarActualizadas = ko.computed(function () {
            var result = 0;
            var yearDeclaracion = getYearDeclaracion();
            var query = ko.utils.arrayFilter(self.resultado(), function (oper) {
                return (oper.Perdida.hasOwnProperty("Year") && oper.Perdida.Year() == yearDeclaracion) || (oper.Utilidad.hasOwnProperty("Year") && oper.Utilidad.Year() == yearDeclaracion);
            });
            $.each(query, function (index, operacion) {
                if (operacion && operacion.IsCalculo) {
                    result += operacion.Utilidad.PerdidaFiscalAplicada() || 0;
                }
            });
            return Math.round(result);
        }, this);
        //#endregion

        //#region Pagination Methods
        this.ejerciciosPaginated = ko.computed(function () {
            var from = self.actualPage() * elementsByPage;
            var to = from + elementsByPage;
            return self.ejercicios().slice(from, to);
        }, this);
        this.totalPages = ko.computed(function () {
            var totalPages = Math.floor(self.ejercicios().length / elementsByPage);
            totalPages += totalPages / elementsByPage > 0 ? 1 : 0;
            return totalPages - 1;
        }, this);
        this.pagesEjercicios = ko.computed(function () {
            var result = [];
            for (var page = 1; page <= self.totalPages() + 1; page++) {
                result.push(page);
            }
            return result;
        }, this);
        this.hasNext = ko.computed(function () {
            return self.actualPage() !== self.totalPages();
        }, this);
        this.hasPrevious = ko.computed(function () {
            return self.actualPage() !== 0;
        }, this);
        this.next = function () {
            if (this.hasNext()) {
                this.actualPage(this.actualPage() + 1);
            }
        };
        this.previous = function () {
            if (this.hasPrevious()) {
                this.actualPage(this.actualPage() - 1);
            }
        };
        this.setPage = function () {
            self.actualPage(this - 1);
        };
        //#endregion
    };

    //#endregion

    var viewModel;

    //#region Public Methods

    function getModel() {
        return viewModel;
    }


    function loadedUI() {
        $("#htmlOutput .calculoAmortizacion ").on('click', initUIEvent);
    }

    function fillViewModel(base64String, camposTransferencia) {
        try {
            if (IsNullOrEmptyWhite(base64String) || IsNullOrEmptyWhite(camposTransferencia)) {
                console.log("No se cargo la informacion de la calculadora de Amortizacion, faltan datos");
                return;
            }
            var jsonString = Base64.decode(base64String);
            var items = ko.utils.parseJson(jsonString);

            var calculos = ko.utils.arrayFilter(items, function (item) {
                return item.IsCalculo;
            });

            var ejercicios = ko.utils.arrayFilter(items, function (item) {
                return !item.IsCalculo;
            });

            var utilidades = ko.utils.arrayFilter(items, function (item) {
                return item.Tipo == Tipo.Utilidad && !item.IsCalculo;
            });

            var perdidas = ko.utils.arrayFilter(items, function (item) {
                return (item.Tipo == Tipo.Perdida || item.Tipo == Tipo.PerdidaEnCalculo || item.Tipo == Tipo.PerdidaOmitida) && !item.IsCalculo;
            });
            var id = DBID_MODAL;
            initUI(id, camposTransferencia);
            var modelCalculadora = viewModel;


            $.each(modelCalculadora.ejercicios(), function (index, model) {
                $.each(ejercicios, function (indexInner, ejer) {
                    if (model.Year() == ejer.Year) {
                        var tipo;
                        if (ejer.Tipo == Tipo.PerdidaEnCalculo || ejer.Tipo == Tipo.PerdidaOmitida) {
                            tipo = Tipo.Perdida;
                        }
                        model.Tipo(tipo || ejer.Tipo);
                        model.Valor(ejer.Valor);
                    }
                });
            });

            $.each(modelCalculadora._utilidades(), function (index, model) {
                $.each(utilidades, function (indexInner, util) {
                    if (model.Year() == util.Year) {
                        model.Tipo(util.Tipo);
                        model.Valor(util.Valor);
                        model.IsActive(util.IsActive);
                        model.IsCalculo(util.IsCalculo);
                        model._InpcDic(util._InpcDic);
                        model.NotCalculatePerdidaFiscalActualizada(util.NotCalculatePerdidaFiscalActualizada);
                        model._perdidaFiscalActualizada(util._perdidaFiscalActualizada);
                        model._perdidaEjercicioAntPendAplicar(util._perdidaEjercicioAntPendAplicar);
                        model.PerdidaFiscalAplicada(util.PerdidaFiscalAplicada);
                    }
                });
            });

            $.each(modelCalculadora._perdidas(), function (index, model) {
                $.each(perdidas, function (indexInner, perd) {
                    if (model.Year() == perd.Year) {
                        model.Tipo(perd.Tipo);
                        model.Valor(perd.Valor);
                        model.IsActive(perd.IsActive);
                        model.IsCalculo(perd.IsCalculo);
                        model._InpcDic(perd._InpcDic);
                        model._perdidaEjercicioAntPendAplicar(perd._perdidaEjercicioAntPendAplicar);
                    }
                });
            });

            var perdidasModel = ko.utils.arrayFilter(modelCalculadora.ejercicios(), function (item) {
                return item.Tipo() == Tipo.Perdida || item.Tipo() == Tipo.PerdidaEnCalculo || item.Tipo() == Tipo.PerdidaOmitida;
            });

            $.each(calculos, function (index, calc) {
                var perdida = {};
                if ((calc.Perdida instanceof Perdida)) {
                    perdida = getPerdida(calc.Perdida.Year, calc.Perdida.IsCalculo, perdidasModel);
                }
                var utilidadesAdyacentes = [];
                $.each(calc.UtilidadesAdyacentes, function (indexInner, util) {
                    var newUtilidad = new Utilidad();
                    newUtilidad.Year(util.Year);
                    newUtilidad.Tipo(util.Tipo);
                    newUtilidad.Valor(util.Valor);
                    newUtilidad.IsActive(util.IsActive);
                    newUtilidad.IsCalculo(util.IsCalculo);

                    newUtilidad._InpcDic(util._InpcDic);
                    newUtilidad._perdidaFiscalActualizada(util._perdidaFiscalActualizada);
                    newUtilidad._perdidaEjercicioAntPendAplicar(util._perdidaEjercicioAntPendAplicar);
                    newUtilidad.NotCalculatePerdidaFiscalActualizada(util.NotCalculatePerdidaFiscalActualizada);
                    utilidadesAdyacentes.push(newUtilidad);
                });
                var newCalculo = new Calculo(perdida, utilidadesAdyacentes);
                switch (calc.Tipo) {
                    case Tipo.Utilidad:
                        extend(newCalculo, new Utilidad());
                        newCalculo.NotCalculatePerdidaFiscalActualizada(calc.NotCalculatePerdidaFiscalActualizada);
                        newCalculo._InpcDic(calc._InpcDic);
                        newCalculo._perdidaFiscalActualizada(calc._perdidaFiscalActualizada);
                        break;
                    case Tipo.Perdida:
                    case Tipo.PerdidaEnCalculo:
                    case Tipo.PerdidaOmitida:
                        extend(newCalculo, new Perdida());
                        break;
                    case Tipo.CalculoNegativo:
                        extend(newCalculo, new Ejercicio());
                        break;
                }
                newCalculo.Year(calc.Year);
                newCalculo.Tipo(calc.Tipo);
                newCalculo.Valor(calc.Valor);
                newCalculo.IsActive(calc.IsActive);
                newCalculo.IsCalculo(calc.IsCalculo);
                newCalculo._perdidaEjercicioAntPendAplicar(calc._perdidaEjercicioAntPendAplicar);
                modelCalculadora.calculos().push(newCalculo);
                if (calc.Tipo == Tipo.Perdida) {
                    perdidasModel.push(newCalculo);
                }
            });
            modelCalculadora.calculos.valueHasMutated();

            var modal = getModal(id);
            if (modal) {
                $(modal).find(".currency").formatCurrency({ region: 'es-MX' });
                $(modal).find("a[href*='#resultado']").click();
            }
        } catch (err) {
            console.log("Error al cargar la informacion de la calculadora de amortizaciones");
            console.log("Reason: {0}".format(err));
        }
    }

    function getJsonBase64() {
        var result = "";
        var perdidas;
        var utilidades;
        var calculos;
        if (viewModel) {
            perdidas = viewModel._perdidas();
            utilidades = viewModel._utilidades();
            calculos = viewModel.calculos();
        }
        var data = [];
        if (perdidas && perdidas.length > 0) {
            data = data.concat(perdidas);
        }
        if (utilidades && utilidades.length > 0) {
            data = data.concat(utilidades);
        }
        if (calculos && calculos.length > 0) {
            data = data.concat(calculos);
        }
        if (data.length > 0) {
            var items = ko.toJS(data);
            //Remove items computables and functions
            items = ko.utils.arrayMap(items, function (item) {
                item.INPCDic = undefined;
                item.changeTipo = undefined;
                item.inicializa = undefined;
                item.PerdidaEjercicioAntPendAplicar = undefined;

                switch (item.Tipo) {
                    case Tipo.Utilidad:
                        item.INPCJun = undefined;
                        item.FA = undefined;
                        item.PerdidaFiscalActualizada = undefined;
                        item.UtilidadGravableEjercicio = undefined;
                        break;
                    case Tipo.Perdida:
                    case Tipo.PerdidaEnCalculo:
                    case Tipo.PerdidaOmitida:
                        item.INPCJul = undefined;
                        item.FA = undefined;
                        item.PerdidaActualizadaDic = undefined;
                        break;
                    case Tipo.CalculoNegativo:
                        break;
                }
                if (item.IsCalculo) {
                    item.UtilidadesAdyacentesOrdered = undefined;
                    item.getPerdidaFiscalActualizadaFromUtilidadAdyacente = undefined;
                    item.convertCalculo = undefined;
                    item.calculate = undefined;
                    item.getOperacionNoAplicadaFromUtilidadAdyacente = undefined;
                    for (var indexUt in item.UtilidadesAdyacentes) {
                        var utilidad = item.UtilidadesAdyacentes[indexUt];
                        utilidad.INPCJun = undefined;
                        utilidad.FA = undefined;
                        utilidad.PerdidaFiscalActualizada = undefined;
                        utilidad.UtilidadGravableEjercicio = undefined;
                        utilidad.PerdidaEjercicioAntPendAplicar = undefined;
                        utilidad.INPCDic = undefined;
                    }
                }

                return item;
            });

            var jsonString = ko.toJSON(items);
            result = Base64.encode(jsonString);
        }

        return result;
    }
    //#endregion

    //#region Private Methods
    var byYear = function (left, right) {
        if (left.Year() == right.Year()) {
            return 0;
        }
        if (left.Year() < right.Year()) {
            return -1;
        }
        if (left.Year() > right.Year()) {
            return 1;
        }
    };

    function initUI(dbId, camposTransferencia) {
        var modal = getModal(dbId);
        if (!modal) {
            modal = createModal(dbId, camposTransferencia);
            var years = getYears();
            var ejercicios = [];

            $.each(years, function (index, year) {
                ejercicios.push(new Ejercicio(year));
            });

            if (!viewModel) {
                viewModel = new ModalData(ejercicios);
            }

            try {
                ko.applyBindings(viewModel, getModal(dbId));
            } catch (exc) {
                console.log(exc.message);
            }

            //Events
            $(modal).find(".nav a").click(function () {
                $(this).tab('show');
            });

            $(modal).find('#btnTerminarAmort').click(function (e) {
                terminarEvent(e, dbId);
            });

            AppDeclaracionesSAT.resetCursorInputCurrency(modal);
        }
    }

    function getCamposTransferencia(text) {
        var result = {};
        if (text) {
            var arrayCampos = text.split('|');
            $.each(arrayCampos, function (index, value) {
                var dbId = "", clave = "", idEntidad;
                if (value) {
                    dbId = value.split(',')[0];
                    clave = value.split(',')[1];
                    idEntidad = dbId.split('P')[0].replace('E', '');
                }
                result[clave] = {
                    DbId: dbId,
                    IdEntidad: idEntidad
                };
            });
        }
        return result;
    }

    function initUIEvent(event) {

        event = event || window.event;
        var $target = $(event.target);
        var camposTransferencia = $target.attr('campos');
        var dbId = DBID_MODAL;
        initUI(dbId, camposTransferencia);
        var modal = getModal(dbId);
        $(modal).attr("camposTransferencia", camposTransferencia);
        if (modal) {
            $(modal).modal({
                show: true,
                backdrop: "static"
            });
        }
    }

    var transferResult = function (camposTransferencia, dbid) {
        var modal = getModal(dbid);
        var existUtilidadEnDeclaracion = viewModel.existUtilidadOfDeclaracion();

        $.each(camposTransferencia, function (index, campo) {
            var value = 0;
            switch (index) {
                case ClavesResultado.PerdidasEjerciciosAnteAplicadosEjercicio:
                    value = viewModel.PerdidasEjerciciosAnterioresAplicadasEjercicio();
                    if (!IsNullOrEmptyOrZero(value)) {
                        var fieldTransfer = camposTransferencia[ClavesResultado.PerdidasEjerciciosAntePendientesAmortActualizados];

                        if (existUtilidadEnDeclaracion)
                            FormsBuilder.ViewModel.get()[campo.IdEntidad][campo.DbId](0);
                        else
                            FormsBuilder.ViewModel.get()[campo.IdEntidad][campo.DbId]("");

                        FormsBuilder.ViewModel.get()[fieldTransfer.IdEntidad][fieldTransfer.DbId](value);

                        $("[view-model='{0}']".format(fieldTransfer.DbId)).formatCurrency({ region: 'es-MX', roundToDecimalPlace: 0 });
                    }
                    break;
                case ClavesResultado.PerdidasEjerciciosAntePendientesAmortActualizados:
                    value = viewModel.PerdidasEjerciciosAnterioresPendientesAmortizarActualizadas();
                    if (!IsNullOrEmptyOrZero(value)) {
                        var fieldTransfer = camposTransferencia[ClavesResultado.PerdidasEjerciciosAnteAplicadosEjercicio];

                        FormsBuilder.ViewModel.get()[campo.IdEntidad][campo.DbId]("");
                        FormsBuilder.ViewModel.get()[fieldTransfer.IdEntidad][fieldTransfer.DbId](value);

                        $("[view-model='{0}']".format(fieldTransfer.DbId)).formatCurrency({ region: 'es-MX', roundToDecimalPlace: 0 });
                    }
                    break;
            }

        });

        if (modal) {
            $(modal).modal('hide');
        }
    };

    var getPerdida = function (year, isCalculo, perdidas) {
        var query = ko.utils.arrayFilter(perdidas, function (perd) {
            return perd.Year() == year && perd.IsCalculo() == isCalculo;
        });
        return query && query.length > 0 ? query[0] : undefined;
    };

    var getSubRegimenInfo = function () {
        var result;
        var idSubregimen;
        var precargaXml = FormsBuilder.XMLForm.getCopyPrecarga();
        var xml = precargaXml && precargaXml.length > 0 ? FormsBuilder.XMLForm.getCopyPrecarga() : FormsBuilder.XMLForm.getCopyDeclaracion();
        var query;
        if (xml) {
            query = $("SubRegimenes IdCatalogo", xml).filter(function () {
                switch ($(this).text()) {
                    case SubRegimenes.ActividadEmpresarialContabilidad.Id:
                    case SubRegimenes.ActividadEmpresarialYProfesional.Id:
                    case SubRegimenes.ActividadesProfesionales.Id:
                    case SubRegimenes.RegimenIntermedio.Id:
                        return true;
                    default:
                        return false;
                }
            });
            if (query && query.length > 0) {
                idSubregimen = $(query[0]).text();
            }

        }

        $.each(SubRegimenes, function (index, enumElement) {
            if (enumElement.Id === idSubregimen) {
                result = enumElement;
            }
        });

        return result;
    };

    var terminarEvent = function (event, dbid) {

        event = event || window.event;

        var modal = getModal(dbid);
        var camposText = $(modal).attr("camposTransferencia");
        var infoRegimenActual = getSubRegimenInfo();
        if (infoRegimenActual) {
            var camposTransferencia = getCamposTransferencia(camposText);
            var dbIdPEAAE = camposTransferencia[ClavesResultado.PerdidasEjerciciosAnteAplicadosEjercicio].DbId;
            var dbIdPEAPAA = camposTransferencia[ClavesResultado.PerdidasEjerciciosAntePendientesAmortActualizados].DbId;

            var message = "Al transferir resultados, se modificarán los campos: <br/>" +
                "1) {0} <br/>".format(infoRegimenActual.LabelPEAAE(dbIdPEAAE)) +
                "2) {0} <br/>".format(infoRegimenActual.LabelPEAPAA(dbIdPEAPAA)) +
                "¿Estás de acuerdo con la modificación?</br></br>";

            ShowMessageIf(true, message, event, function (e) {
                transferResult(camposTransferencia, dbid);
                hideMessageModal(e);
            });
        } else {
            console.log("La declaracion no cuenta con la informacion de los subregimenes, favor de agregarlos al archivo de la declaracion o de precarga");
            $(modal).modal('hide');
        }
    };


    function hideMessageModal(event) {
        event = event || window.event;
        var modal = $(".divAlertSection > div:first");
        $(modal).modal('hide');
    }

    function ShowValidationMesaggeIf(validation, $target, message) {
        var $contentNode = $target.parent();
        $target.toggleClass("sat-val-error", validation);
        if (validation) {
            $contentNode.removeClass("col-lg-12");
            $contentNode.addClass("col-lg-10");

            $contentNode.parent().find("i").popover("destroy").remove();
            $contentNode.parent().find('.popover').remove();
            $contentNode.parent().find(".message").remove();


            var $iconPopoverNode = $("<div class='col-lg-1 message' style='padding-left: 0px;padding-top: 5px;'><i class='icon-warning-sign icon-ok-circle' style='color: rgb(207, 57, 40);'></i>");
            $iconPopoverNode.popover({
                html: true,
                content: message,
                placement: "left"
            });
            $contentNode.parent().append($iconPopoverNode);
        } else {
            $contentNode.addClass("col-lg-12");

            $contentNode.parent().find("i").popover("destroy").remove();
            $contentNode.parent().find('.popover').remove();
            $contentNode.parent().find(".message").remove();
        }
    }

    function ShowMessageIf(doAlert, message, event, callback) {
        event = event || window.event;

        if (doAlert && !SAT.Environment.settings('isHydrate')) {
            var alertModal = $("#templateAlertMessage").clone();
            var putOnNode = $(".divAlertSection");
            var $alert = $(alertModal);

            $alert.find(".modal-body").html(message);

            $(putOnNode).find('*:first').remove();
            $(putOnNode).html($alert.html());

            $alert = $(putOnNode).find('div:first');

            if (callback && callback instanceof Function) {
                $alert.find(".validation").removeClass("hidden");
                $alert.find(".notify").addClass("hidden");

                $alert.find(".validation .si").click(callback);
            } else {
                $alert.find(".validation").addClass("hidden");
                $alert.find(".notify").removeClass("hidden");
            }
            $alert.find(".no").click(hideMessageModal);
            $alert.modal({
                backdrop: "static"
            });

            $alert.on('show.bs.modal', function (e) {
                $('.modalAmortizacion div[role]:first').css("z-index", 1020);
            });

            $alert.on('hidden.bs.modal', function (e) {
                $('.modalAmortizacion div[role]:first').css("z-index", 1040);
            });

            $alert.modal("show");
        }

        return doAlert;

    }

    function getModal(dbId) {
        return $('[sat-dlg-dbid="{0}"] div:first'.format(dbId))[0];
    }

    var createModal = function (dbId, camposTransferencia) {
        var containerHtml = $('<div><div class="modalAmortizacion" sat-dlg-dbid="{0}"></div></div>'.format(dbId));
        var templateModal = $('#templateCuadroAmortizacion div:first').clone();

        //Add identifier
        var newModal = containerHtml.find('[sat-dlg-dbid]').html(templateModal);

        $(document.body).append(newModal);

        newModal = $('[sat-dlg-dbid="{0}"] div:first'.format(dbId));


        $(newModal).attr('camposTransferencia', camposTransferencia);
        changeLinksTabs(newModal, dbId);
        changeIdsLists(newModal, dbId);

        return newModal;
    };

    var getYearDeclaracion = function () {
        var result;
        if (IsNullOrEmpty($30)) {
            result = $(FormsBuilder.XMLForm.getCopyDeclaracion()).find("propiedad[id=30]").text();
        } else {
            result = $30;
        }
        return result;
    };

    var getYears = function () {
        var result = [];

        var ejercicioDeclaracion = getYearDeclaracion();
        var actualYear = ejercicioDeclaracion;
        var initYear = actualYear - 10;
        for (var year = initYear; year <= actualYear; year++) {
            result.push(year);
        }
        return result;
    };

    function changeLinksTabs(newModal, dbId) {
        $(newModal).find(".tab-content .tab-pane").each(function (index, element) {
            var value = $(element).attr('id');
            $(element).attr('id', "{0}_{1}".format(value, dbId));
        });

        $(newModal).find(".nav a").each(function (index, element) {
            var value = $(element).attr('href');
            $(element).attr('href', "{0}_{1}".format(value, dbId));
        });
    }

    var changeIdsLists = function (newModal, dbId) {
        var actualId = $(newModal).find("#divPerdidas").attr("id");
        $(newModal).find("#divPerdidas").attr("id", "{0}_{1}".format(actualId, dbId));

        actualId = $(newModal).find("#divUtilidades").attr("id");
        $(newModal).find("#divUtilidades").attr("id", "{0}_{1}".format(actualId, dbId));
    };

    //#endregion
})();