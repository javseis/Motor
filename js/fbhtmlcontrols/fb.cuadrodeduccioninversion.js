/**
* Modulo para el calculo de deducciones de inversion
* 
* (c) SAT 2013, Carlos Ortiz
*/
/*global namespace:false, FormsBuilder:false, SAT: false, AppDeclaracionesSAT:false, ko:false, Base64:false */

"use strict";

(function () {
    namespace("FormsBuilder.Modules", getViewModelCuadroDeduccionInversion, loadedCuadroDeduccionInversion, showCuadroDeduccionInversion, fillViewModelCuadroDeduccionInversion, getCalculoInversionesJSONBase64, isVisibleCuadroDeduccionInversion);

    var CONTROL_LAYOUT = 'input';
    var CONTROL_MODAL = 'cuadrodeduccioninversion';
    var CALOGO_CALSIFICACIONES = "CLASIFICACIÓN";
    var MESSAGESS = "messages-deduccion-inversion";
    var stateCuadroDeduccionInversion = {
        CREATED: 'created',
        HYDRATED: 'hydrated'
    };

    var viewModelCalculate = null;
    var ejercicios = ["", "NO", "Se enajenó", "Dejó de ser útil", "Se perdió"];
    var regimenes = [
         { idRegimen: 2, regimen: "Actividad Empresarial y Profesional", modalGanancia: "modal-actividad-empresarial-profesional", modalTransferencia: "transferencia-empresarial-profesional" },
         { idRegimen: 3, regimen: "Actividad Empresarial Contabilidad Simplificada", modalGanancia: "modal-actividad-empresarial", modalTransferencia: "tarnsferencia-empresarial" },
         { idRegimen: 4, regimen: "Actividad Profesional", modalGanancia: "modal-actividad-profesional", modalTransferencia: "transferencia-actividad-profesional" },
         { idRegimen: 5, regimen: "Regimen Intermedio", modalGanancia: "modal-regimen-intermedio", modalTransferencia: "transferencia-regimen-intermedio" }];

    var clasificaciones = {};
    var catalogoClasificaciones = []

    function showCuadroDeduccionInversion(fieldsToTransfer) {

        $("#{0}".format(CONTROL_MODAL)).find("#btn-ver-resultados").text("Ver resultados");
        $("#{0} #form-calculo, #{0} #grid-calculo, #{0} #btn-nuevo-calculo, #{0} #btn-eliminar-calculo".format(CONTROL_MODAL)).show();
        $("#{0} #grid-resultado, #{0} #btn-transferir, #{0} #btn-salvar".format(CONTROL_MODAL)).hide();

        viewModelCalculate.calculoArray.sort(function (left, right) {
            return left.numero() == right.numero() ? 0 : (left.numero() < right.numero() ? -1 : 1);
        });
        $("#{0} #grid-resultado p.currency".format(CONTROL_MODAL)).formatCurrency({ region: 'es-MX' });

        $("#{0}".format(CONTROL_MODAL)).modal("show");

        viewModelCalculate.closeState(0);
        viewModelCalculate.fieldsToTransfer(fieldsToTransfer);
    }

    function isVisibleCuadroDeduccionInversion() {
        return $("#{0}".format(CONTROL_MODAL)).is('visible');
    }

    function getViewModelCuadroDeduccionInversion() {
        return viewModelCalculate;
    }

    function loadedCuadroDeduccionInversion(callback) {
        if ($("#{0}".format(CONTROL_MODAL)).hasClass(stateCuadroDeduccionInversion.CREATED)) return;

        if (!$("#{0}".format(CONTROL_MODAL)).hasClass(stateCuadroDeduccionInversion.HYDRATED)) {
            viewModelCalculate = new CuadroDeduccionInversionViewModel();
            ko.applyBindings(viewModelCalculate, $("#view-model-{0}".format(CONTROL_MODAL))[0]);
        }

        $("#{0} #form-calculo".format(CONTROL_MODAL)).find(".default-disabled").attr("disabled", "disabled");
        $.each($("#{0} input[mascara]".format(CONTROL_MODAL)), function () { $(this).mask($(this).attr('mascara')); });

        $("#{0} #grid-resultado span.declaracion-date".format(CONTROL_MODAL)).html(getYearExercise() - 1);

        $("#{0} input.currency".format(CONTROL_MODAL)).focus(function () {
            $(this).off("blur");
            $(this).toNumber();
            $(this).blur(function () {
                $('#{0} #grid-calculo td.currency'.format(CONTROL_MODAL)).formatCurrency({ region: 'es-MX' });
                $(this).formatCurrency({ region: 'es-MX' });
            });
        });

        $("#{0} input.currency".format(CONTROL_MODAL)).keydown(SoloNumerosPositivos);
        $("#{0} input.decimal".format(CONTROL_MODAL)).keydown(SoloNumerosDecimales);

        if (!$.browser.mozilla) {
            $("#{0} input.currency".format(CONTROL_MODAL)).keypress(OmitirSimulateKeys);
            $("#{0} input.decimal".format(CONTROL_MODAL)).keypress(OmitirSimulateKeys);
        }

        $("#{0} input.numero".format(CONTROL_MODAL)).each(function (i, e) {
            if (!$.browser.mozilla) {
                $(e).keypress(OmitirSimulateKeys);
            }
            $(e).keydown(SoloNumerosPositivos);
        });

        $("#{0}".format(CONTROL_MODAL)).find("#btn-ver-resultados").click(function myfunction() {
            if ($("#{0} #form-calculo".format(CONTROL_MODAL)).is(':visible')) {
                if (!validCalculo()) return false;
                $(this).text("Regresar");
                $("#{0} #form-calculo, #{0} #grid-calculo, #{0} #btn-nuevo-calculo, #{0} #btn-eliminar-calculo".format(CONTROL_MODAL)).hide();

                $("#{0} #grid-resultado, #{0} #btn-transferir, #{0} #btn-salvar".format(CONTROL_MODAL)).show();
                $("#{0} #resultadosDeduccionInversion td span.currency".format(CONTROL_MODAL)).each(function (k, v) {
                    $(v).formatCurrency({ region: 'es-MX' });
                });

                viewModelCalculate.calculoArray.sort(function (left, right) {
                    return left.clasificacion() == right.clasificacion() ? 0 : (left.clasificacion() < right.clasificacion() ? -1 : 1);
                });
                $("#{0} #grid-resultado  p.currency".format(CONTROL_MODAL)).formatCurrency({ region: 'es-MX' });
            }
            else {
                $(this).text("Ver resultados");
                $("#{0} #form-calculo, #{0} #grid-calculo, #{0} #btn-nuevo-calculo, #{0} #btn-eliminar-calculo".format(CONTROL_MODAL)).show();
                $("#{0} #grid-resultado, #{0} #btn-transferir, #{0} #btn-salvar".format(CONTROL_MODAL)).hide();

                viewModelCalculate.calculoArray.sort(function (left, right) {
                    return left.numero() == right.numero() ? 0 : (left.numero() < right.numero() ? -1 : 1);
                });
                $("#{0} #grid-resultado p.currency".format(CONTROL_MODAL)).formatCurrency({ region: 'es-MX' });

            }
        });

        loadCatalogs();
        initMessagessModal();

        $("#{0}".format(CONTROL_MODAL)).addClass(stateCuadroDeduccionInversion.CREATED);

        if (callback && typeof (callback) == "function") {
            callback();
        }
    }

    function fillViewModelCuadroDeduccionInversion(jsonBase64) {
        var json = Base64.decode(jsonBase64);
        var data = ko.utils.parseJson(json);

        loadCatalogs();

        if (!$("#{0}".format(CONTROL_MODAL)).hasClass(stateCuadroDeduccionInversion.HYDRATED)) {
            viewModelCalculate = new CuadroDeduccionInversionViewModel();
            ko.applyBindings(viewModelCalculate, $("#view-model-{0}".format(CONTROL_MODAL))[0]);
        }

        var items = ko.utils.arrayMap(data, function (item) {
            var calculo = new CalculoObject();
            calculo.numero(item.numero);
            calculo.descripcion(item.descripcion);
            calculo.clasificacion(item.clasificacion);
            calculo.montoOriginalInversion(item.montoOriginalInversion);
            calculo.fechaAdquisicion(item.fechaAdquisicion);
            calculo.porcentajeDepreciacion(item.porcentajeDepreciacion);
            calculo.otroPorcentajeDepreciacion(item.otroPorcentajeDepreciacion);
            calculo.inicioUsoBien(item.inicioUsoBien);
            calculo.fechaUsoBien(item.fechaUsoBien);
            calculo.inicioDeduccionEn(item.inicioDeduccionEn);
            calculo.enElEjercicio(item.enElEjercicio);
            calculo.precioVenta(item.precioVenta);
            calculo.mesPrescindioActivo(item.mesPrescindioActivo);
            calculo.isNewOrEditItem(item.isNewOrEditItem);
            calculo.isCreated(true);

            return calculo;
        });

        viewModelCalculate.calculoArray(items);

        $('#{0} #grid-calculo td.currency'.format(CONTROL_MODAL)).formatCurrency({ region: 'es-MX' });

        viewModelCalculate.calculoArray.sort(function (left, right) {
            return left.numero() == right.numero() ? 0 : (left.numero() < right.numero() ? -1 : 1);
        });

        $("#{0}".format(CONTROL_MODAL)).addClass(stateCuadroDeduccionInversion.HYDRATED);
    }

    function TransferObject() {
        var self = this;
        self.Field = null;
        self.Entity = null;
        self.Section = null;
        self.Clasification = null;
        self.Value = null;
    }

    function CalculoObject() {
        var self = this;

        self.numero = ko.observable();
        self.descripcion = ko.observable();
        self.clasificacion = ko.observable();
        self.montoOriginalInversion = ko.observable();
        self.fechaAdquisicion = ko.observable();
        self.porcentajeDepreciacion = ko.observable();
        self.otroPorcentajeDepreciacion = ko.observable();
        self.inicioUsoBien = ko.observable();
        self.fechaUsoBien = ko.observable();
        self.inicioDeduccionEn = ko.observable();
        self.enElEjercicio = ko.observable();
        self.precioVenta = ko.observable();
        self.mesPrescindioActivo = ko.observable();
        self.isNewOrEditItem = ko.observable(); //0=New 1=Edit
        self.isCreated = ko.observable(false);

        //Suscribes

        self.numero.subscribe(function (newValue) {
            var isPossibleDuplicate = viewModelCalculate.possibleDuplicate(newValue);
            showErrorMessageIf(isPossibleDuplicate, 'inputNumero', "Este número se encuentra duplicado");
        });

        self.fechaAdquisicion.subscribe(function (newValue) {
            if (!isValidDate(newValue)) showErrorMessageIf(true, "inputFechaAdquisicion", "La fecha no es válida");
            else {
                var fiscalDate = new Date();
                fiscalDate.setFullYear(getYearExercise(), 11, 31);
                var newDate = new Date.parseExact(newValue, ["d/M/yyyy"]);
                showErrorMessageIf(newDate > fiscalDate, "inputFechaAdquisicion", "No puede ser mayor a {0}/{1}/{2}".format(31, 12, getYearExercise()));
            }

            if (!$("#{0} #{1}".format(CONTROL_MODAL, "inputFechaAdquisicion")).hasClass("sat-obligatorio") && self.inicioUsoBien() == 'true') {
                self.fechaUsoBien(newValue);
            }
        });

        self.inicioUsoBien.subscribe(function (newValue) {
            if (newValue === 'true')
                self.fechaUsoBien(self.fechaAdquisicion());
            else {
                self.fechaUsoBien("");
                self.inicioDeduccionEn("");
                self.enElEjercicio("");
                self.mesPrescindioActivo("");
                self.precioVenta("");
            }
        });

        self.fechaUsoBien.subscribe(function (newValue) {
            if (!isValidDate(newValue) && self.inicioUsoBien() === 'true') showErrorMessageIf(true, "inputFechaUsoBien", "La fecha no es válida");
            else {
                var fiscalDate = Date.parseExact("31/12/{0}".format(getYearExercise()), ["d/M/yyyy"]);
                var newDate = Date.parseExact(newValue, ["d/M/yyyy"]);
                var dateAdquisicion = isValidDate(self.fechaAdquisicion()) ? Date.parseExact(self.fechaAdquisicion(), ["d/M/yyyy"]) : newDate;

                showErrorMessageIf(self.inicioUsoBien() === 'true' && (newDate > fiscalDate || newDate < dateAdquisicion), "inputFechaUsoBien",
                                    newDate > fiscalDate ? "No puede ser mayor a {0}/{1}/{2}".format(31, 12, getYearExercise()) : "No puede ser menor a la fecha de adquisición");

                if (self.mesPrescindioActivo() !== 0) self.mesPrescindioActivo.valueHasMutated();
            }
        });

        self.enElEjercicio.subscribe(function (newValue) {
            if (ejercicios[newValue] === 'NO') {
                self.precioVenta("");
                self.mesPrescindioActivo("");
            }
            else if (ejercicios[newValue] === 'Dejó de ser útil' || ejercicios[newValue] === 'Se perdió') self.precioVenta("");
            if (self.mesPrescindioActivo() !== 0) self.mesPrescindioActivo.valueHasMutated();
        });

        self.mesPrescindioActivo.subscribe(function (newValue) {
            var usoBien = Date.parseExact(self.fechaUsoBien(), ["d/M/yyyy"]);
            var mesEnajenacion = $("#{0} #{1} option:selected".format(CONTROL_MODAL, "inputMesPrescindioActivo")).text();

            showErrorMessageIf(usoBien !== null && (!IsNullOrEmpty(self.enElEjercicio()) && ejercicios[self.enElEjercicio()] !== "NO") &&
                                (getYearExercise() == usoBien.getFullYear() && !IsNullOrEmptyOrZero(newValue) && newValue < (usoBien.getMonth() + 1)), "inputMesPrescindioActivo",
                                "La fecha de inicio de uso no puede ser posterior al mes de enajenación {0}".format(mesEnajenacion), "30%");

            $("#{0} #{1}".format(CONTROL_MODAL, "inputMesPrescindioActivo")).attr("style", "width:30%");

        });

        //Computed Field´s

        self.codeClasificacion = ko.computed(function () {
            if (IsNullOrEmpty(self.clasificacion())) return;
            return self.clasificacion();
        });

        self.clasificacionText = ko.computed(function () {
            if (IsNullOrEmpty(self.clasificacion())) return;
            return clasificaciones[self.clasificacion()];
        });

        self.montoOriginalInversionFixed = ko.computed(function () {
            if (self.enElEjercicio() === "3") return self.montoOriginalInversion() - 1;
            return self.montoOriginalInversion();
        });

        self.depreciacionAnual = ko.computed(function () {
            var depreciacionAnual = ((self.porcentajeDepreciacion() < 0 ?
                                      self.otroPorcentajeDepreciacion() : self.porcentajeDepreciacion()) / 100) * self.montoOriginalInversionFixed();
            return depreciacionAnual;
        }, self);

        self.porcentajeDepreciacionFixed = ko.computed(function () {
            if (self.porcentajeDepreciacion() > 0)
                return parseFloat(self.porcentajeDepreciacion()).toFixed(2);
            else return self.otroPorcentajeDepreciacion();
        }, self);

        self.depreciacionMensual = ko.computed(function () {
            return self.depreciacionAnual() / 12;
        });

        self.inicioSuDeduccionEn = ko.computed(function () {
            if (self.inicioDeduccionEn() === 'siguiente') return 'Año siguiente';
            else if (self.inicioDeduccionEn() === 'usando') return "Ejercicio uso";
        });

        self.depreciacionAlEjercicio = ko.computed(function () {
            if (!isValidDate(self.fechaUsoBien())) return "";

            var useDate = Date.parseExact(self.fechaAdquisicion(), ["d/M/yyyy"]),
                beginDate = Date.parseExact("01/01/{0}".format(getYearExercise()), ["d/M/yyyy"]),
                endDate = Date.parseExact("31/12/{0}".format(getYearExercise()), ["d/M/yyyy"]);

            var depreciacionAlEjercicio = 0, yearsMonth = 12, nextYear = 1, nextMonth = 1;

            if (self.inicioDeduccionEn() == "siguiente")
                depreciacionAlEjercicio = ((endDate.getFullYear() - (useDate.getFullYear() + nextYear)) * yearsMonth) * self.depreciacionMensual();
            else depreciacionAlEjercicio = (((endDate.getFullYear() - useDate.getFullYear()) * yearsMonth) - (useDate.getMonth() + nextMonth)) * self.depreciacionMensual();

            return depreciacionAlEjercicio <= 0 ? 0 :
                    depreciacionAlEjercicio > self.montoOriginalInversionFixed() ? self.montoOriginalInversionFixed() : depreciacionAlEjercicio;
        });

        self.enajenoDejoSerUtilOrSePerdio = ko.computed(function () {
            return ejercicios[self.enElEjercicio()];
        });

        self.mesEvento = ko.computed(function () {
            if (self.enajenoDejoSerUtilOrSePerdio() === "NO" || self.inicioUsoBien() === 'false') return "";
            return "{0}-{1}".format(self.mesPrescindioActivo(), getYearExercise());
        });

        self.mesesUso = ko.computed(function () {
            var beginDate = Date.parseExact("01/01/{0}".format(getYearExercise()), ["d/M/yyyy"]);
            var fechaUso = isValidDate(self.fechaUsoBien()) ? Date.parseExact(self.fechaUsoBien(), ["d/M/yyyy"]) : null;
            var totalMesesUso = 0, mesesDepreciados = 0, meses = 12;

            if (beginDate === null || fechaUso === null) return;

            mesesDepreciados = (self.montoOriginalInversionFixed() - self.depreciacionAlEjercicio()) / self.depreciacionMensual();

            if (fechaUso < beginDate && self.enajenoDejoSerUtilOrSePerdio() === "NO") totalMesesUso = 12;
            else if (fechaUso >= beginDate && self.enajenoDejoSerUtilOrSePerdio() === "NO") totalMesesUso = 12 - (fechaUso.getMonth() + 1);
            else if (fechaUso < beginDate && self.enajenoDejoSerUtilOrSePerdio() !== "NO") totalMesesUso = self.mesPrescindioActivo();
            else if (fechaUso >= beginDate && self.enajenoDejoSerUtilOrSePerdio() !== "NO") totalMesesUso = self.mesPrescindioActivo() - (fechaUso.getMonth() + 1);

            return mesesDepreciados > meses ? totalMesesUso :
                    (mesesDepreciados < totalMesesUso ? mesesDepreciados : totalMesesUso);
        });

        self.depreciacionHistorica = ko.computed(function () {
            if (self.inicioUsoBien() === 'false') return "";
            return self.depreciacionMensual() * self.mesesUso();
        });

        self.depreciacionParteNoDeducida = ko.computed(function () {
            var sumaGenerada = (self.depreciacionAlEjercicio() + self.depreciacionHistorica() + parseFloat(self.precioVenta()));

            if (self.enajenoDejoSerUtilOrSePerdio() === 'Dejó de ser útil' || self.enajenoDejoSerUtilOrSePerdio() === 'Se perdió') {
                return (self.montoOriginalInversionFixed() - self.depreciacionAlEjercicio()) - self.depreciacionHistorica();
            }
            else if (self.enajenoDejoSerUtilOrSePerdio() === 'Se enajenó' && self.montoOriginalInversionFixed() > sumaGenerada) {
                return self.montoOriginalInversionFixed() - (self.depreciacionAlEjercicio() + self.depreciacionHistorica() + parseFloat(self.precioVenta()));
            }
            else if (sumaGenerada > self.montoOriginalInversionFixed()) return "";
        });

        self.inpcAdq = ko.computed(function () {
            if (!isValidDate(self.fechaAdquisicion()) || self.inicioUsoBien() === 'false') return "";

            var milNovecientosCincuenta = Date.parseExact("01/01/1950", ["d/M/yyyy"]);
            var dateAdquisicion = Date.parseExact(self.fechaAdquisicion(), ["d/M/yyyy"]);

            if (dateAdquisicion < milNovecientosCincuenta) dateAdquisicion = milNovecientosCincuenta;

            var inpc = FormsBuilder.Catalogs.getCatalog('INPC').find('elemento[anio="{0}"][mes="{1}"]'.format(dateAdquisicion.getFullYear(), dateAdquisicion.getMonth() + 1));
            inpc = inpc.length == 0 ? FormsBuilder.Catalogs.getCatalog('INPC').find('elemento[anio="{0}"]:last'.format(dateAdquisicion.getFullYear())) : inpc ;
            return inpc ? inpc.attr("indice") : "";
        });

        self.inpcAdqFixed = ko.computed(function () {
            var result = TRUNCAR(self.inpcAdq(), 4);
            return toFixedValue(result, 4);
        });

        self.inpcUltimoMesPrimeraMitad = ko.computed(function () {
            if (!isValidDate(self.fechaAdquisicion())) return "";
            if (!isValidDate(self.fechaUsoBien())) return "";

            var ultimoMesPrimeraMitad = null, inpc = null, mesPrimeraMitad = null, diciembre = 12;
            var beginDate = Date.parseExact("01/01/{0}".format(getYearExercise()), ["d/M/yyyy"]);
            var dateAdquisicion = Date.parseExact(self.fechaAdquisicion(), ["d/M/yyyy"]);
            var dateFechaUso = Date.parseExact(self.fechaUsoBien(), ["d/M/yyyy"]);

            if (dateAdquisicion < beginDate && self.enajenoDejoSerUtilOrSePerdio() === "NO") ultimoMesPrimeraMitad = 6;
            else if (dateAdquisicion >= beginDate && self.enajenoDejoSerUtilOrSePerdio() === "NO") {
                mesPrimeraMitad = (diciembre - dateFechaUso.getMonth()) / 2;
                ultimoMesPrimeraMitad = mesPrimeraMitad % 2 !== 0 ? Math.floor(mesPrimeraMitad + dateFechaUso.getMonth()) : mesPrimeraMitad + dateFechaUso.getMonth();
            }
            else if (dateAdquisicion < beginDate && self.enajenoDejoSerUtilOrSePerdio() !== "NO") {
                mesPrimeraMitad = Math.round((self.mesPrescindioActivo() - (beginDate.getMonth())) / 2);
                ultimoMesPrimeraMitad = (self.mesPrescindioActivo() - (beginDate.getMonth())) % 2 !== 0 ? Math.floor(mesPrimeraMitad - 1) : mesPrimeraMitad;
            }
            else if (dateAdquisicion >= beginDate && self.enajenoDejoSerUtilOrSePerdio() !== "NO") {
                mesPrimeraMitad = (self.mesPrescindioActivo() - dateFechaUso.getMonth()) / 2;
                ultimoMesPrimeraMitad = (self.mesPrescindioActivo() - dateFechaUso.getMonth()) % 2 !== 0 ? Math.floor((mesPrimeraMitad + dateFechaUso.getMonth())) : (mesPrimeraMitad + dateFechaUso.getMonth());
            }
            inpc = FormsBuilder.Catalogs.getCatalog('INPC').find('elemento[anio="{0}"][mes="{1}"]'.format(getYearExercise(), ultimoMesPrimeraMitad <= 0 ? 1 : ultimoMesPrimeraMitad));
            inpc = inpc.length == 0 ? FormsBuilder.Catalogs.getCatalog('INPC').find('elemento[anio="{0}"]:last'.format(getYearExercise())) : inpc ;
            return inpc ? TRUNCAR(inpc.attr("indice"), 4) : "";
        });

        self.inpcUltimoMesPrimeraMitadFix = ko.computed(function () {
            var result = TRUNCAR(self.inpcUltimoMesPrimeraMitad(), 4);
            return toFixedValue(result, 4);
        });

        self.fa = ko.computed(function () {
            if (self.inicioUsoBien() === 'false') return "";
            return TRUNCAR(self.inpcUltimoMesPrimeraMitad() / self.inpcAdq(), 4);
        });

        self.deduccionInverEjerc = ko.computed(function () {
            if (self.inicioUsoBien() === 'false') return "";
            return TRUNCAR(self.depreciacionHistorica() * self.fa(), 2);
        });

        self.deduccionParteNoDeducida = ko.computed(function () {
            var deduccion = 0;

            if (self.enajenoDejoSerUtilOrSePerdio() === 'Se enajenó')
                deduccion = TRUNCAR(((self.montoOriginalInversionFixed() - (self.depreciacionAlEjercicio() + (self.mesesUso() * self.depreciacionMensual()))) * self.fa()) - self.precioVenta(), 2);
            else if (self.enajenoDejoSerUtilOrSePerdio() === "Dejó de ser útil") deduccion = TRUNCAR((parseFloat(self.depreciacionParteNoDeducida()) * self.fa()), 2);
            else if (self.enajenoDejoSerUtilOrSePerdio() === 'Se perdió') deduccion = self.depreciacionParteNoDeducida();

            return deduccion <= 0 ? "" : deduccion;
        });
    }

    function CuadroDeduccionInversionViewModel() {
        var self = this;
        var isNewItem = 0, isEditItem = 1;
        var entidad = null, propiedad = null;
        var enumTransferState = { NO_TRANSFER: 0, TRANSFERRING: 1, TRANSFERRED: 2 },
            enumCloseState = { NO_CLOSED: 0, CLOSING: 1, CLOSED: 2 };

        self.fieldsToTransfer = ko.observable();

        self.transferState = ko.observable(enumTransferState.NO_TRANSFER);
        self.closeState = ko.observable(enumCloseState.NO_CLOSED);

        self.calculoArray = ko.observableArray();
        self.editItem = ko.observable(new CalculoObject());

        self.catalogoClasificaciones = ko.observableArray(catalogoClasificaciones);

        //method's

        self.agregarCalculo = function () {
            var isValid = true, newCalculo = {};

            $("#{0} #form-calculo".format(CONTROL_MODAL)).find(".default-disabled").removeAttr("disabled");
            if (self.calculoArray().length > 0) isValid = validCalculo();

            if (!isValid) return;
            else self.editItem().isCreated(true);

            ko.utils.arrayForEach(self.calculoArray(), function (item) {
                item.isNewOrEditItem(isNewItem);
            });

            newCalculo = new CalculoObject();
            newCalculo.isNewOrEditItem(isNewItem);

            self.calculoArray.push(newCalculo);
            self.editItem(newCalculo);
        };

        self.updateCalculo = function (calculo) {
            if (!validCalculo()) return false;
            $("#{0} #form-calculo".format(CONTROL_MODAL)).find(".default-disabled").removeAttr("disabled");

            ko.utils.arrayForEach(self.calculoArray(), function (item) {
                item.isNewOrEditItem(isNewItem);
            });

            self.editItem(calculo);
            self.editItem().isNewOrEditItem(isEditItem);

            formatCurrencyApply();
        };

        self.eliminarCalculo = function () {

            self.calculoArray.remove(self.editItem());
            self.editItem(new CalculoObject());
            self.editItem().numero.valueHasMutated();

            $("#{0} #form-calculo".format(CONTROL_MODAL)).find(".default-disabled").attr("disabled", "disabled");
        };

        self.transferir = function () {
            try {
                var regimen = self.getRegimenFromPrecarga();
                var hasGanancia = false;

                hasGanancia = self.hasGanancias(regimen);
                if (!hasGanancia) self.showModalTransferencias(regimen);

                self.transferState(enumTransferState.TRANSFERRING);
            } catch (e) {
                console.log(e.message);
            }

        };

        self.acceptTransfer = function () {
            try {
                var regimen = self.getRegimenFromPrecarga();

                var transferObjects = [];

                if (self.fieldsToTransfer().split('|').length > 1)
                    transferObjects = self.BindObjectsToTransfer();
                else transferObjects.push(self.BindObjectToTransfer());

                $.each(transferObjects, function (k, v) {
                    if (FormsBuilder.ViewModel.get()[v.Entity][v.Field]() !== v.Value) {
                        FormsBuilder.ViewModel.get()[v.Entity][v.Field](v.Value === undefined ? 0 : REDONDEARSAT(v.Value));
                        $("#htmlOutput input[view-model={0}]".format(v.Field)).formatCurrency({ region: 'es-MX', roundToDecimalPlace: 0 });
                    }
                });

                self.transferState(enumTransferState.TRANSFERRED);
                $("#{0}".format(MESSAGESS)).find("#{0}".format(regimen.modalTransferencia)).modal("hide");

            } catch (e) {
                console.log(e.message);
            }
            finally {
                self.cerrarWithoutGanancia();
            }
        };

        self.cancelTransfer = function () {
            var regimen = self.getRegimenFromPrecarga();

            self.transferState(enumTransferState.TRANSFERRED);
            $("#{0}".format(MESSAGESS)).find("#{0}".format(regimen.modalTransferencia)).modal("hide");
        };

        self.acceptGanancia = function () {
            try {
                var regimen = self.getRegimenFromPrecarga();

                $("#{0}".format(MESSAGESS)).find("#{0}".format(regimen.modalGanancia)).on('hidden.bs.modal', function (e) {

                    if (self.transferState() === enumTransferState.TRANSFERRING) self.showModalTransferencias(regimen);

                    if (self.closeState() === enumCloseState.CLOSING) {
                        $("#{0}".format(CONTROL_MODAL)).modal("hide");
                        self.closeState(enumCloseState.CLOSED);
                    }
                });

                $("#{0}".format(MESSAGESS)).find("#{0}".format(regimen.modalGanancia)).modal("hide");
            } catch (e) {
                console.log(e.message);
            }
        };

        self.cerrar = function () {
            var hasGanancia = false;
            try {
                var regimen = self.getRegimenFromPrecarga();

                self.closeState(enumCloseState.CLOSING);
                hasGanancia = self.hasGanancias(regimen);
            } catch (e) {
                console.log(e.message);
            }
            finally {
                if (!hasGanancia) {
                    $("#{0}".format(CONTROL_MODAL)).modal("hide");
                    self.closeState(enumCloseState.CLOSED);
                }
                if (!validCalculo()) {
                    self.eliminarCalculo();
                }
            }
        };

        self.cerrarWithoutGanancia = function () {

            $("#{0}".format(CONTROL_MODAL)).modal("hide");
            self.closeState(enumCloseState.CLOSED);

            if (!validCalculo()) {
                self.eliminarCalculo();
            }
        };

        self.hasGanancias = function (regimen) {
            var content = $("#{0}".format(MESSAGESS)), has = false;

            if (regimen === undefined) return false;

            if (regimenes[0].idRegimen === regimen.idRegimen) has = self.showModalGananciasFiscalesAndContables($(content).find("#{0}".format(regimenes[0].modalGanancia)));
            else has = self.showModalGananciasFiscales($(content).find("#{0}".format(regimen.modalGanancia)));

            return has;
        };

        self.possibleDuplicate = function (valueComparer) {
            var findedDuplicate = ko.utils.arrayFirst(self.calculoArray(), function (item) {
                return item.numero() === valueComparer && item.isCreated() === true && item.isNewOrEditItem() === isNewItem;
            });
            return findedDuplicate !== null;
        };

        self.requiredInputValue = function (inputValue, element) {
            var defaultConsiderations = element === undefined && (self.editItem().isNewOrEditItem() === isNewItem || self.editItem().isNewOrEditItem() === isEditItem);
            return cssClassRequiredIf(defaultConsiderations && IsNullOrEmpty(inputValue));
        };

        self.requiredSelectValue = function (selectValue, element) {
            var defaultConsiderations = element === undefined && (self.editItem().isNewOrEditItem() === isNewItem || self.editItem().isNewOrEditItem() === isEditItem);
            return cssClassRequiredIf(defaultConsiderations && IsNullOrEmptyOrZero(selectValue));
        };

        self.requiredOtroPorcentajeDepreciacion = ko.computed(function () {
            return cssClassRequiredIf((self.editItem().isNewOrEditItem() === isNewItem || self.editItem().isNewOrEditItem() === isEditItem) &&
                                      IsNullOrEmpty(self.editItem().otroPorcentajeDepreciacion()) &&
                                      self.editItem().porcentajeDepreciacion() == -1);
        }, self);

        self.requiredFechaUsoBien = ko.computed(function () {
            return cssClassRequiredIf((self.editItem().isNewOrEditItem() === isNewItem || self.editItem().isNewOrEditItem() === isEditItem) &&
                                      IsNullOrEmpty(self.editItem().fechaUsoBien()) &&
                                      self.editItem().inicioUsoBien() == 'true');
        }, self);

        self.requiredInicioDeduccion = ko.computed(function () {
            return cssClassRequiredIf((self.editItem().isNewOrEditItem() === isNewItem || self.editItem().isNewOrEditItem() === isEditItem) &&
                                      IsNullOrEmpty(self.editItem().inicioDeduccionEn()) &&
                                      self.editItem().inicioUsoBien() == 'true');
        }, self);

        self.requiredEjercicio = ko.computed(function () {
            return cssClassRequiredIf((self.editItem().isNewOrEditItem() === isNewItem || self.editItem().isNewOrEditItem() === isEditItem) &&
                                     IsNullOrEmpty(self.editItem().enElEjercicio()) &&
                                     self.editItem().inicioUsoBien() == 'true');
        }, self);

        self.requiredPrecioVenta = ko.computed(function () {
            return cssClassRequiredIf((self.editItem().isNewOrEditItem() === isNewItem || self.editItem().isNewOrEditItem() === isEditItem) &&
                                      self.editItem().enElEjercicio() == 2 &&
                                      self.editItem().inicioUsoBien() == 'true' &&
                                      IsNullOrEmpty(self.editItem().precioVenta()));
        }, self);

        self.requiredMesPrescindioActivo = ko.computed(function () {
            return cssClassRequiredIf((self.editItem().isNewOrEditItem() === isNewItem || self.editItem().isNewOrEditItem() === isEditItem) &&
                                      self.editItem().inicioUsoBien() == 'true' &&
                                      (!IsNullOrEmpty(self.editItem().enElEjercicio()) &&
                                       self.editItem().enElEjercicio() !== "1") &&
                                      IsNullOrEmptyOrZero(self.editItem().mesPrescindioActivo()));
        }, self);

        self.TotalMontoOriginalInvercion = ko.computed(function () {
            var total = 0;
            ko.utils.arrayForEach(self.calculoArray(), function (element) {
                if (!IsNullOrEmpty(element.montoOriginalInversionFixed()))
                    total += parseFloat(element.montoOriginalInversionFixed());
            });
            return total.toFixed(2);
        }, self);

        self.TotalDepreciacionAlEjercicio = ko.computed(function () {
            var total = 0;
            ko.utils.arrayForEach(self.calculoArray(), function (element) {
                if (!IsNullOrEmpty(element.depreciacionAlEjercicio()))
                    total += parseFloat(element.depreciacionAlEjercicio());
            });
            return total.toFixed(2);
        });

        self.TotalDepreciacionEjercicioHistorica = ko.computed(function () {
            var total = 0;
            ko.utils.arrayForEach(self.calculoArray(), function (element) {
                if (!IsNullOrEmpty(element.depreciacionHistorica()))
                    total += parseFloat(element.depreciacionHistorica());
            });
            return total.toFixed(2);
        });

        self.TotalDepreciacionParteNoDeducida = ko.computed(function () {
            var total = 0;
            ko.utils.arrayForEach(self.calculoArray(), function (element) {
                if (!IsNullOrEmpty(element.depreciacionParteNoDeducida()))
                    total += parseFloat(element.depreciacionParteNoDeducida());
            });
            return total.toFixed(2);
        });

        self.TotalDeduccionInvercion = ko.computed(function () {
            var total = 0;
            ko.utils.arrayForEach(self.calculoArray(), function (element) {
                if (!IsNullOrEmpty(element.deduccionInverEjerc()))
                    total += parseFloat(element.deduccionInverEjerc());
            });
            return total.toFixed(2);
        });

        self.TotalDeduccionParteNoDeducida = ko.computed(function () {
            var total = 0;
            ko.utils.arrayForEach(self.calculoArray(), function (element) {
                if (!IsNullOrEmpty(element.deduccionParteNoDeducida()))
                    total += parseFloat(element.deduccionParteNoDeducida());
            });
            return total.toFixed(2);
        });

        self.getJSONBase64 = function () {
            if (self.calculoArray === undefined || self.calculoArray === null || self.calculoArray().length === 0) return "";
            var items = ko.toJS(self.calculoArray);
            ko.utils.arrayMap(items, function (item) {
                item.depreciacionAnual = undefined;
                item.depreciacionMensual = undefined;
                item.inicioSuDeduccionEn = undefined;
                item.depreciacionAlEjercicio = undefined;
                item.enajenoDejoSerUtilOrSePerdio = undefined;
                item.mesEvento = undefined;
                item.mesesUso = undefined;
                item.depreciacionHistorica = undefined;
                item.depreciacionParteNoDeducida = undefined;
                item.inpcAdq = undefined;
                item.inpcUltimoMesPrimeraMitad = undefined;
                item.fa = undefined;
                item.deduccionInverEjerc = undefined;
                item.deduccionParteNoDeducida = undefined;
            });
            return Base64.encode(ko.toJSON(items));

        };

        self.getRegimenFromPrecarga = function () {
            var regimen = null, catalogSubRegimenes = null;
            try {
                if (!IsNullOrEmpty(FormsBuilder.XMLForm.getCopyPrecarga())) catalogSubRegimenes = FormsBuilder.XMLForm.getCopyPrecarga();
                else catalogSubRegimenes = FormsBuilder.XMLForm.getCopyDeclaracion();

                for (var i = 0; i < regimenes.length; i++) {
                    regimen = catalogSubRegimenes.find("SubRegimenes Catalogo").filter(function () {
                        return $('IdCatalogo', this).text() === regimenes[i].idRegimen.toString();
                    }).find("IdCatalogo").text();
                    if (!IsNullOrEmpty(regimen)) break;
                }

                if (IsNullOrEmpty(regimen)) {
                    throw new Error("SubRegimenes not found. !!");
                }

                return $.grep(regimenes, function (e) {
                    return e.idRegimen === parseInt(regimen);
                })[0];
            }
            catch (e) {
                throw e;
            }
        };

        self.BindObjectsToTransfer = function () {
            var transfer = [], groupCalculoArray = [];
            var fields = self.fieldsToTransfer().split("|");
            var compareDate = Date.parseExact("01/01/{0}".format(getYearExercise()), ["d/M/yyyy"]);
            var COLUMNA_UNO = "COLUMNA_UNO", COLUMNA_TRES = "COLUMNA_TRES", SECCION_UNO = "1", SECCION_TRES = "3", OTHER_FIELD_A = "GE", OTHER_FIELD_B = "DDI";

            var propertyIndex = {};
            ko.utils.arrayForEach(self.calculoArray(), function (item) {
                var key = ko.utils.unwrapObservable(item["codeClasificacion"]);
                var dateAdquisicion = Date.parseExact(item.fechaAdquisicion(), ["d/M/yyyy"]);

                if (key) {
                    propertyIndex[key] = propertyIndex[key] || [];
                    if (isNaN(propertyIndex[key][COLUMNA_UNO]) && isNaN(propertyIndex[key][COLUMNA_TRES])) {
                        propertyIndex[key][COLUMNA_UNO] = 0; propertyIndex[key][COLUMNA_TRES] = 0;
                    }

                    var _deduccionInverconEjercicio = parseFloat(IsNullOrEmpty(item.deduccionInverEjerc()) ? 0 : item.deduccionInverEjerc());
                    var _deduccionParteNoDeducida = parseFloat(IsNullOrEmpty(item.deduccionParteNoDeducida()) ? 0 : item.deduccionParteNoDeducida());

                    propertyIndex[key][COLUMNA_UNO] += (_deduccionInverconEjercicio + _deduccionParteNoDeducida);

                    if (dateAdquisicion >= compareDate) {
                        var _montoOriginalInversion = parseFloat(IsNullOrEmpty(item.montoOriginalInversion()) ? 0 : item.montoOriginalInversion());
                        propertyIndex[key][COLUMNA_TRES] += _montoOriginalInversion;
                    }
                }
            });

            $.each(fields, function (k, v) {
                var objectTransfer = new TransferObject();
                var otherFields = v.split(',')[1];

                objectTransfer.Entity = (v.split('P')[0]).replace('E', '');
                objectTransfer.Field = (v.split(','))[0];
                objectTransfer.Section = (v.split(','))[1][0];
                objectTransfer.Clasification = v.split(',')[1].substring(1, v.split(',')[1].length);

                if (objectTransfer.Section === SECCION_UNO && propertyIndex[objectTransfer.Clasification] !== undefined) {
                    objectTransfer.Value = propertyIndex[objectTransfer.Clasification][COLUMNA_UNO];
                }
                else if (objectTransfer.Section === SECCION_TRES && propertyIndex[objectTransfer.Clasification] !== undefined) {
                    objectTransfer.Value = propertyIndex[objectTransfer.Clasification][COLUMNA_TRES];
                }
                else if (otherFields === OTHER_FIELD_A) {
                    var totalGanancia = 0;
                    var gananancasFiscales = self.GananciaFiscal();
                    if (gananancasFiscales.length > 0) {
                        $.each(gananancasFiscales, function (i, e) {
                            totalGanancia += e.Ganancia;
                        });
                        objectTransfer.Value = totalGanancia;
                    }
                }
                else if (otherFields === OTHER_FIELD_B) {
                    objectTransfer.Value = parseFloat(self.TotalDeduccionInvercion()) + parseFloat(self.TotalDeduccionParteNoDeducida());
                }

                if (IsNullOrEmpty(objectTransfer.Value)) objectTransfer.Value = 0;

                transfer.push(objectTransfer);
            });

            return transfer;
        };

        self.BindObjectToTransfer = function () {
            var v = self.fieldsToTransfer();
            var objectTransfer = new TransferObject();

            objectTransfer.Entity = (v.split('P')[0]).replace('E', '');
            objectTransfer.Field = (v.split(','))[0];
            objectTransfer.Section = (v.split(','))[1][0];
            objectTransfer.Clasification = v.split(',')[1].substring(1, v.split(',')[1].length);
            objectTransfer.Value = parseFloat(self.TotalDeduccionInvercion()) + parseFloat(self.TotalDeduccionParteNoDeducida());

            return objectTransfer;
        };

        self.showModalGananciasFiscalesAndContables = function (elemento) {
            var gananciaFiscal = 0,
               gananciaContable = 0,
               totalGananciaFiscal = 0,
               totalGananciaContable = 0,
               textoElementoFiscal = [],
               textoElementoContable = [];

            var templateDataListResults = "<strong>({0}) </strong><strong>$</strong><strong class='currency'>{1}</strong>";

            gananciaFiscal = self.GananciaFiscal();
            gananciaContable = self.GananciaContable();

            if (gananciaContable.length <= 0 && gananciaFiscal.length <= 0) return false;

            $(elemento).find("blockquote span strong").remove();
            $(elemento).find("blockquote strong.currency, blockquote span").each(function (k, v) {
                $(this).html("{" + k + "}");
            });

            var htmlReplacing = $(elemento).find("blockquote").html();

            $.each(gananciaFiscal, function (k, v) {
                textoElementoFiscal.push(templateDataListResults.format(v.Numero, REDONDEARSAT(v.Ganancia.toFixed(2))));
                totalGananciaFiscal += v.Ganancia;
            });

            $.each(gananciaContable, function (k, v) {
                textoElementoContable.push(templateDataListResults.format(v.Numero, REDONDEARSAT(v.Ganancia.toFixed(2))));
                totalGananciaContable += v.Ganancia;
            });

            htmlReplacing = htmlReplacing.format("{0}".format(REDONDEARSAT(totalGananciaContable.toFixed(2))),
                                                 textoElementoContable.join(", "),
                                                 "{0}".format(REDONDEARSAT(totalGananciaFiscal.toFixed(2))),
                                                 textoElementoFiscal.join(", "));

            $(elemento).find("blockquote").html(htmlReplacing);
            $(elemento).find("blockquote strong.currency").formatCurrency({ region: 'es-MX' });

            $(elemento).modal("show");

            return true;
        };

        self.showModalGananciasFiscales = function (elemento) {
            var gananciaFiscal = 0,
               totalGananciaFiscal = 0,
               textoElementoFiscal = [],
               htmlReplacing = "";

            var templateDataListResults = "<strong>({0}) </strong><strong>$</strong><strong class='currency'>{1}</strong>";

            gananciaFiscal = self.GananciaFiscal();
            if (gananciaFiscal.length <= 0) return false;

            $(elemento).find("blockquote span strong").remove();
            $(elemento).find("blockquote strong.currency, blockquote span").each(function (k, v) {
                $(this).html("{" + k + "}");
            });
            htmlReplacing = $(elemento).find("blockquote").html();

            $.each(gananciaFiscal, function (k, v) {
                textoElementoFiscal.push(templateDataListResults.format(v.Numero, REDONDEARSAT(v.Ganancia.toFixed(2))));
                totalGananciaFiscal += v.Ganancia;
            });

            htmlReplacing = htmlReplacing.format("{0}".format(REDONDEARSAT(totalGananciaFiscal.toFixed(2))),
                                                 textoElementoFiscal.join(", "));

            $(elemento).find("blockquote").html(htmlReplacing);
            $(elemento).find("blockquote strong.currency").formatCurrency({ region: 'es-MX' });

            $(elemento).modal("show");

            return true;
        };

        self.showModalTransferencias = function (regimen) {
            var transferencia = $("#{0}".format(MESSAGESS)).find("#{0}".format(regimen.modalTransferencia));
            $(transferencia).modal("show");
        };

        self.hideModalTransferencias = function (regimen) {
            var transferencia = $("#{0}".format(MESSAGESS)).find("#{0}".format(regimen.modalTransferencia));
            $(transferencia).modal("hide");
        };

        self.GananciaFiscal = function () {
            var calculosConGananciaFiscal = [], totalAcomparar = 0;
            ko.utils.arrayForEach(self.calculoArray(), function (item) {
                if (item.inicioUsoBien() === 'true') {
                    totalAcomparar = (item.montoOriginalInversionFixed() - (item.depreciacionAlEjercicio() + item.depreciacionHistorica()));
                    if (!IsNullOrEmpty(item.precioVenta()) && totalAcomparar > 0 && (item.precioVenta() > (totalAcomparar) * item.fa())) {
                        calculosConGananciaFiscal.push({
                            Numero: item.numero(),
                            Ganancia: item.precioVenta() - (totalAcomparar) * item.fa()
                        });
                    }
                }
            });
            return TRUNCAR(calculosConGananciaFiscal, 2);
        };

        self.GananciaContable = function () {
            var calculosConGananciaContable = [], totalAcomparar = 0;
            ko.utils.arrayForEach(self.calculoArray(), function (item) {
                if (item.inicioUsoBien() === 'true') {
                    totalAcomparar = (item.montoOriginalInversionFixed() - (item.depreciacionAlEjercicio() + item.depreciacionHistorica()));
                    if (!IsNullOrEmpty(item.precioVenta()) && totalAcomparar > 0 && item.precioVenta() > totalAcomparar) {
                        calculosConGananciaContable.push({
                            Numero: item.numero(),
                            Ganancia: item.precioVenta() - totalAcomparar
                        });
                    }
                }
            });
            return TRUNCAR(calculosConGananciaContable, 2);
        };
    }

    function validCalculo() {
        return !$("#{0} #form-calculo * ".format(CONTROL_MODAL)).hasClass("sat-obligatorio");
    }

    function cssClassRequiredIf(operationResult) {
        return (operationResult ? "sat-obligatorio" : "");
    }

    function showErrorMessageIf(operation, element, messageError, percentResize) {

        var jqElement = $("#{0} #{1}".format(CONTROL_MODAL, element));
        var contentElement = jqElement.parent();
        var styleResizeInput = "width:{0}!important; display:inline".format(percentResize === undefined ? '93%' : percentResize);

        jqElement.toggleClass("input-error", operation);
        jqElement.removeAttr("style").attr("style", operation ? styleResizeInput : "");

        contentElement.find("i").popover("destroy").remove();
        contentElement.find(".popover").remove();

        var iconPopover = $("<i class='icon-warning-sign icon-ok-circle' style='color: rgb(207, 57, 40);'></i>");
        iconPopover.popover({
            html: true,
            content: messageError,
            placement: "left"
        });
        contentElement.append(operation ? iconPopover : "");
    }

    function formatCurrencyApply() {
        $('#{0} #form-calculo input.currency'.format(CONTROL_MODAL)).formatCurrency({ region: 'es-MX' });
        $('#{0} #grid-calculo td.currency'.format(CONTROL_MODAL)).formatCurrency({ region: 'es-MX' });
    }

    function getCalculoInversionesJSONBase64() {
        if (viewModelCalculate === null ||
            viewModelCalculate.calculoArray().length === 0) return "";
        var items = ko.toJS(viewModelCalculate.calculoArray);
        ko.utils.arrayMap(items, function (item) {
            item.depreciacionAnual = undefined;
            item.depreciacionMensual = undefined;
            item.inicioSuDeduccionEn = undefined;
            item.depreciacionAlEjercicio = undefined;
            item.enajenoDejoSerUtilOrSePerdio = undefined;
            item.mesEvento = undefined;
            item.mesesUso = undefined;
            item.depreciacionHistorica = undefined;
            item.depreciacionParteNoDeducida = undefined;
            item.inpcAdq = undefined;
            item.inpcUltimoMesPrimeraMitad = undefined;
            item.fa = undefined;
            item.deduccionInverEjerc = undefined;
            item.deduccionParteNoDeducida = undefined;
        });
        return Base64.encode(ko.toJSON(items));
    }

    function getYearExercise() {
        var result;
        if (IsNullOrEmptyOrZero($30)) {
            result = $(FormsBuilder.XMLForm.getCopyDeclaracion()).find("propiedad[id=30]").text();
            if (IsNullOrEmpty(result)) {
                result = $(FormsBuilder.XMLForm.getCopyPrecarga()).find("Ejercicio").text();
            }
        }
        else {
            result = $30;
        }
        return result;
    }

    function loadCatalogs() {
        if (catalogoClasificaciones.length > 0) return;

        var xmlClasificaciones = FormsBuilder.Catalogs.getCatalog(CALOGO_CALSIFICACIONES)[0];
        $(xmlClasificaciones).find('elemento').each(function (k, v) {
            var elemento = $(v);
            clasificaciones[elemento.attr('valor')] = elemento.attr('texto');
            catalogoClasificaciones.push({ texto: elemento.attr('texto'), valor: elemento.attr('valor') });
        });
    }

    function initMessagessModal() {
        $("#view-model-{0} #messages-deduccion-inversion div[role]".format(CONTROL_MODAL)).each(function (k, v) {
           var $modalMessage = $(v);

            $modalMessage.on('show.bs.modal', function (e) {
                $('#view-model-{0} div[role]:first'.format(CONTROL_MODAL)).css("z-index", 1020);
            });

            $modalMessage.on('hidden.bs.modal', function (e) {
                $('#view-model-{0} div[role]:first'.format(CONTROL_MODAL)).css("z-index", 1040);
            });
        });
    }

    function toFixedValue(inputValue, precision) {
        var result = inputValue;
        if (!IsNullOrEmptyWhite(result)) {
            var value = parseFloat(result);
            result = typeof (value) == "number" ? value.toFixed(precision) : result;
        }
        return result;
    }
})();