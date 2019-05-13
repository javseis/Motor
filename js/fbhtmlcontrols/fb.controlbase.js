/** @module FormsBuilder.Modules */
/**
 * Modulo para el render de formularios que contiene metodos reutilizables
 * 
 * (c) SAT 2013, Iván González
 */
/*global namespace:false, FormsBuilder:false */

"use strict";

(function () {
    namespace("FormsBuilder.Modules", ControlBase);

    var ctrlBase = {
        acumular: acumular,
        alineacionHorizontal: alineacionHorizontal,
        alineacionTexto: alineacionTexto,
        autoCompletarEnteros: autoCompletarEnteros,
        ayudaEnDialogo: ayudaEnDialogo,
        capturaDecimales: capturaDecimales,
        copiaElementoGrid: copiaElementoGrid,
        cuentaClabe: cuentaClabe,
        deshabilitarCero: deshabilitarCero,
        enMayusculas: enMayusculas,
        enMayusculas2: enMayusculas2,
        formatCurrency: formatCurrency,
        formatoEnGrid: formatoEnGrid,
        forzarModoEdicion: forzarModoEdicion,
        getHelpText: getHelpText,
        helpString: helpString,
        mascara: mascara,
        mensajeValidacion: mensajeValidacion,
        mostrarDecimales: mostrarDecimales,
        muestraEnGrid: muestraEnGrid,
        noRemoverCeros: noRemoverCeros,
        noValidarCampoVacio: noValidarCampoVacio,
        nombreBanco: nombreBanco,
        obligatorio: obligatorio,
        ordenTabulador: ordenTabulador,
        sinDuplicidad: sinDuplicidad,
        sinEtiqueta: sinEtiqueta,
        sinTitulo: sinTitulo,
        soloNumerosDecimales: soloNumerosDecimales,
        soloNumerosNegativos: soloNumerosNegativos,
        soloNumerosPositivos: soloNumerosPositivos,
        tamanoFuente: tamanoFuente,
        textoAlineacionEtiqueta: textoAlineacionEtiqueta,
        validaLongitud: validaLongitud,
        validaRFCFM: validaRFCFM
    };

    function ControlBase() {
        return ctrlBase;
    }

    function ayudaEnDialogo(control, rowNewDiv, controlLayout) {
        var atributoNode;
        if (control.atributos !== undefined) {
            atributoNode = Enumerable.From(control.atributos.atributo).Where("$.nombre== 'AyudaEnDialogo'").FirstOrDefault();
        }
        if (atributoNode !== undefined) {
            var helpText = atributoNode.valor;
            rowNewDiv.find(controlLayout).attr("ayudaEnDialogo", helpText);
        }
    }

    function obligatorio(control, rowNewDiv, CONTROL_LAYOUT) {
        var attrObligatorio;
        if (control.atributos !== undefined) {
            attrObligatorio = Enumerable.From(control.atributos.atributo).Where("$.nombre== 'Obligatorio'").FirstOrDefault();
        }
        if (attrObligatorio !== undefined) {
            rowNewDiv.find(CONTROL_LAYOUT).addClass("sat-obligatorio");
            rowNewDiv.find(CONTROL_LAYOUT).attr("data-obligatorio", true);
        }
    }

    function mostrarDecimales(control, rowNewDiv, CONTROL_LAYOUT) {
        var atributoNode;
        if (control.atributos !== undefined) {
            atributoNode = Enumerable.From(control.atributos.atributo).Where("$.nombre== 'AutocompletarDecimales' || $.nombre== 'MostrarDecimales'  ").FirstOrDefault();
        }

        if (atributoNode !== undefined) {
            var numDecimales = IsNullOrEmptyWhite(atributoNode.valor) ? 0 : atributoNode.valor;
            rowNewDiv.find(CONTROL_LAYOUT).attr("mostrarDecimales", numDecimales);
        }
    }

    function sinEtiqueta(control, rowNewDiv, title) {
        var iconoAyuda = "";
        var attrSinEtiqueta;
        if (control.atributos !== undefined) {
            attrSinEtiqueta = Enumerable.From(control.atributos.atributo).Where("$.nombre== 'SinEtiqueta'").FirstOrDefault();
        }
        if (attrSinEtiqueta === undefined && title) {
            rowNewDiv.find("div:first > div").append(iconoAyuda + title.valor || "");
        }
    }

    function forzarModoEdicion(control, rowNewDiv, CONTROL_LAYOUT) {
        var attrForzarModoEdicion;
        if (control.atributos !== undefined) {
            attrForzarModoEdicion = Enumerable.From(control.atributos.atributo).Where("$.nombre== 'ForzarModoEdicion'").FirstOrDefault();
        }

        if (attrForzarModoEdicion !== undefined) {
            rowNewDiv.find(CONTROL_LAYOUT).attr("ForzarModoEdicion", attrForzarModoEdicion.valor || "");
        }
    }

    function validaLongitud(control, rowNewDiv, CONTROL_LAYOUT) {
        var attrValidaLongitud;
        if (control.atributos !== undefined) {
            attrValidaLongitud = Enumerable.From(control.atributos.atributo).Where("$.nombre== 'ValidaLongitud'").FirstOrDefault();
        }

        if (attrValidaLongitud !== undefined) {
            rowNewDiv.find(CONTROL_LAYOUT).attr("maxlength", attrValidaLongitud.valor || "");
        }
    }

    function soloNumerosPositivos(control, rowNewDiv, CONTROL_LAYOUT) {
        var attrSoloNumerosPositivos;
        if (control.atributos !== undefined) {
            attrSoloNumerosPositivos = Enumerable.From(control.atributos.atributo).Where("$.nombre== 'SoloNumerosPositivos'").FirstOrDefault();
        }

        if (attrSoloNumerosPositivos !== undefined) {
            rowNewDiv.find(CONTROL_LAYOUT).attr("onkeydown", "SoloNumerosPositivos(event)");
            if (!$.browser.mozilla) {
                rowNewDiv.find(CONTROL_LAYOUT).attr("onkeypress", "OmitirSimulateKeys(event)");
            }
        }
    }

    function soloNumerosDecimales(control, rowNewDiv, CONTROL_LAYOUT) {
        var attrSoloNumerosDecimales;
        if (control.atributos !== undefined) {
            attrSoloNumerosDecimales = Enumerable.From(control.atributos.atributo).Where("$.nombre== 'SoloNumerosDecimales'").FirstOrDefault();
        }

        if (attrSoloNumerosDecimales !== undefined) {
            rowNewDiv.find(CONTROL_LAYOUT).attr("onkeydown", "SoloNumerosDecimales(event)");
            if (!$.browser.mozilla) {
                rowNewDiv.find(CONTROL_LAYOUT).attr("onkeypress", "OmitirSimulateKeys(event)");
            }
        }
    }

    function deshabilitarCero(control, rowNewDiv, CONTROL_LAYOUT) {
        var attr;
        if (control.atributos !== undefined) {
            attr = Enumerable.From(control.atributos.atributo).Where("$.nombre== 'DeshabilitarCero'").FirstOrDefault();
        }

        if (attr !== undefined) {
            rowNewDiv.find(CONTROL_LAYOUT).attr("onkeyup", "DeshabilitarCero(event)");
        }
    }

    // eslint-disable-next-line no-unused-vars
    function soloNumerosNegativos(control, rowNewDiv, CONTROL_LAYOUT, numerosNegativos) {
        numerosNegativos = false;

        var attrSoloNumerosNegativos;
        if (control.atributos !== undefined) {
            attrSoloNumerosNegativos = Enumerable.From(control.atributos.atributo).Where("$.nombre== 'SoloNumerosNegativos'").FirstOrDefault();
        }

        if (attrSoloNumerosNegativos !== undefined) {
            rowNewDiv.find(CONTROL_LAYOUT).attr("onkeydown", "SoloNumerosNegativos(event)");
            if (!$.browser.mozilla) {
                rowNewDiv.find(CONTROL_LAYOUT).attr("onkeypress", "OmitirSimulateKeys(event)");
            }
            numerosNegativos = true;
        }
    }

    function ordenTabulador(control, rowNewDiv, CONTROL_LAYOUT) {
        var attrOrdenTabulador;
        if (control.atributos !== undefined) {
            attrOrdenTabulador = Enumerable.From(control.atributos.atributo).Where("$.nombre== 'OrdenTabulador'").FirstOrDefault();
        }

        if (attrOrdenTabulador !== undefined) {
            rowNewDiv.find(CONTROL_LAYOUT).attr("tabindex", attrOrdenTabulador.valor || "");
        }
    }

    function acumular(control, rowNewDiv, CONTROL_LAYOUT) {
        var attrAcumular;
        if (control.atributos !== undefined) {
            attrAcumular = Enumerable.From(control.atributos.atributo).Where("$.nombre== 'Acumular'").FirstOrDefault();
        }

        if (attrAcumular !== undefined) {
            rowNewDiv.find(CONTROL_LAYOUT).attr("acumular", "");
        }
    }

    function sinTitulo(control, rowNewDiv) {
        var attrSinTitulo;
        if (control.atributos !== undefined) {
            attrSinTitulo = Enumerable.From(control.atributos.atributo).Where("$.nombre== 'SinTitulo'").FirstOrDefault();
        }

        if (attrSinTitulo !== undefined) {
            var valor = attrSinTitulo.valor;
            if (valor === "2") {
                rowNewDiv.find("div:first").css("min-height", "20px");
            } else {
                rowNewDiv.find("div:first").remove();
            }
        }
    }

    function mensajeValidacion(control, rowNewDiv, CONTROL_LAYOUT) {
        var attrMensajeValidacion;
        if (control.atributos !== undefined) {
            attrMensajeValidacion = Enumerable.From(control.atributos.atributo).Where("$.nombre== 'MensajeValidacion'").FirstOrDefault();
        }

        if (attrMensajeValidacion !== undefined) {
            rowNewDiv.find(CONTROL_LAYOUT).attr("mensajevalidacion", attrMensajeValidacion.valor || "");
        }
    }

    function enMayusculas(control, rowNewDiv, CONTROL_LAYOUT) {
        var attrEnMayusculas;
        if (control.atributos !== undefined) {
            attrEnMayusculas = Enumerable.From(control.atributos.atributo).Where("$.nombre== 'EnMayusculas'").FirstOrDefault();
        }

        if (attrEnMayusculas !== undefined) {
            rowNewDiv.find(CONTROL_LAYOUT).attr("onchange", "SoloMayusculas(event)");
        }
    }

    function enMayusculas2(control, rowNewDiv, CONTROL_LAYOUT, numerosNegativos) {
        var enMayusculas;
        if (control.atributos !== undefined) {
            enMayusculas = Enumerable.From(control.atributos.atributo).Where("$.nombre== 'EnMayusculas2'").FirstOrDefault();
        }

        if (enMayusculas !== undefined) {
            rowNewDiv.find(CONTROL_LAYOUT).attr("onchange", "SoloMayusculas2(event)");
        } else {
            if (numerosNegativos) {
                rowNewDiv.find(CONTROL_LAYOUT).attr("onchange", "RemoveZeros(event, true)");
            } else {
                rowNewDiv.find(CONTROL_LAYOUT).attr("onchange", "RemoveZeros(event, false)");
            }
        }
    }

    function validaRFCFM(control, rowNewDiv, CONTROL_LAYOUT) {
        var attrValidaRFCFM;
        if (control.atributos !== undefined) {
            attrValidaRFCFM = Enumerable.From(control.atributos.atributo).Where("$.nombre== 'ValidaRFCFM'").FirstOrDefault();
        }

        if (attrValidaRFCFM !== undefined) {
            rowNewDiv.find(CONTROL_LAYOUT).attr("onchange", 'Verf_rfc_FM(event, "' + attrValidaRFCFM.valor + '")');
        }
    }

    function noRemoverCeros(control, rowNewDiv, CONTROL_LAYOUT) {
        var attrNoRemoverCeros;
        if (control.atributos !== undefined) {
            attrNoRemoverCeros = Enumerable.From(control.atributos.atributo).Where("$.nombre== 'NoRemoverCeros'").FirstOrDefault();
        }

        if (attrNoRemoverCeros !== undefined) {
            rowNewDiv.find(CONTROL_LAYOUT).attr("onchange", "");
        }
    }

    function mascara(control, rowNewDiv, CONTROL_LAYOUT) {
        var attrMascara;
        if (control.atributos !== undefined) {
            attrMascara = Enumerable.From(control.atributos.atributo).Where("$.nombre== 'Mascara'").FirstOrDefault();
        }

        if (attrMascara !== undefined) {
            rowNewDiv.find(CONTROL_LAYOUT).attr("mascara", attrMascara.valor.replace(/#/g, "9"));
        }
    }

    function autoCompletarEnteros(control, rowNewDiv, CONTROL_LAYOUT) {
        var autocompletarEnteros;
        var autocompletarDecimales;
        if (control.atributos !== undefined) {
            autocompletarEnteros = Enumerable.From(control.atributos.atributo).Where("$.nombre== 'AutocompletarEnteros'").FirstOrDefault();
            autocompletarDecimales = Enumerable.From(control.atributos.atributo).Where("$.nombre== 'AutocompletarDecimales'").FirstOrDefault();
        }

        if (autocompletarEnteros !== undefined && autocompletarDecimales !== undefined) {
            rowNewDiv.find(CONTROL_LAYOUT).attr("onchange", "AUTOCOMPLETAR(event, {0}, {1})".format(autocompletarEnteros.valor, autocompletarDecimales.valor));
        }
    }

    function sinDuplicidad(control, rowNewDiv, CONTROL_LAYOUT) {
        var attrSinDuplicidad;
        if (control.atributos !== undefined) {
            attrSinDuplicidad = Enumerable.From(control.atributos.atributo).Where("$.nombre== 'SinDuplicidad'").FirstOrDefault();
        }

        if (attrSinDuplicidad !== undefined) {
            rowNewDiv.find(CONTROL_LAYOUT).attr("sinduplicidad", "");
        }
    }

    function helpString(titleLarge, helpText) {
        var helpStr = "<span>{0}</span><br />".format(titleLarge.valor || "");

        if (!IsNullOrEmptyWhite(helpText)) {
            helpStr = "<span><b>{0}</b></span><br /><br /><b>Ayuda: </b><span>{1}</b></span><br/>".format(titleLarge.valor, helpText);
        }

        return helpStr;
    }

    function capturaDecimales(control, rowNewDiv, CONTROL_LAYOUT) {
        var attrCapturaDecimales;
        if (control.atributos !== undefined) {
            attrCapturaDecimales = Enumerable.From(control.atributos.atributo).Where("$.nombre== 'CapturaDecimales'").FirstOrDefault();
        }

        if (attrCapturaDecimales !== undefined) {
            rowNewDiv.find(CONTROL_LAYOUT).attr("capturaDecimales", "");
        }
    }

    function muestraEnGrid(control, rowNewDiv, CONTROL_LAYOUT) {
        var obligatorio;
        if (control.atributos !== undefined) {
            obligatorio = Enumerable.From(control.atributos.atributo).Where("$.nombre== 'MuestraEnGrid'").FirstOrDefault();
        }
        if (obligatorio !== undefined) {
            var valor = obligatorio.valor || "";
            rowNewDiv.find(CONTROL_LAYOUT).attr("muestraEnGrid", valor);
        }
    }

    function formatCurrency(propiedad, rowNewField, controlLayout) {
        if (propiedad.tipoDatos === "Numerico") {
            rowNewField.find(controlLayout).addClass("currency");
        }
    }

    function alineacionTexto(control, rowNewDiv, CONTROL_LAYOUT) {
        var attrAlineacionTexto;
        if (control.atributos !== undefined) {
            attrAlineacionTexto = Enumerable.From(control.atributos.atributo).Where("$.nombre== 'AlineacionTexto'").FirstOrDefault();
        }
        if (attrAlineacionTexto !== undefined) {
            rowNewDiv.find(CONTROL_LAYOUT).attr("alineacionTexto", attrAlineacionTexto.valor || "");
        }
    }

    function getHelpText(control) {
        var ayudasEntidad;
        var helpText = "";
        var ayudasJson = FormsBuilder.XMLForm.getAyudas();
        var idEntidad = control.idEntidadPropiedad;
        var idPropiedad = control.idPropiedad;

        if (ayudasJson) {
            ayudasEntidad = Enumerable.From(ayudasJson.textos.ayudas.entidad).Where("$.IdEntidad == '{0}'".format(idEntidad)).FirstOrDefault();

            if (ayudasEntidad) {
                helpText = Enumerable.From(ayudasEntidad.ayuda).Where("$.IdPropiedad == '{0}'".format(idPropiedad)).Select("$.Valor").FirstOrDefault("");
            }
        }
        //fbXmlForm.getCopy().find('textos > ayudas > entidad[IdEntidad="{0}"] > ayuda[IdPropiedad="{1}"]'.format(idEntidad, idPropiedad));
        return helpText;
    }

    function alineacionHorizontal(control, rowNewDiv, CONTROL_LAYOUT) {
        var attrAlineacionHorizontal;
        if (control.atributos !== undefined) {
            attrAlineacionHorizontal = Enumerable.From(control.atributos.atributo).Where("$.nombre== 'AlineacionHorizontal'").FirstOrDefault();
        }

        if (attrAlineacionHorizontal !== undefined) {
            rowNewDiv.find("div.sat-height-field").wrap("<div style='padding-bottom: 10px;' class='col-sm-6'></div>");
            if (control.tipoControl === "ControlFecha") {
                rowNewDiv.find("div.datepicker-control-div,a").wrapAll("<div class='col-sm-6'></div>");
            } else if (control.tipoControl === "CuadroModal") {
                rowNewDiv.find(".col-sm-12").removeClass("col-sm-12");
                rowNewDiv.find(CONTROL_LAYOUT + ".sat-height-field,a").wrapAll("<div class='col-sm-6'></div>");
            } else {
                rowNewDiv.find(CONTROL_LAYOUT + ".sat-height-field,a").wrapAll("<div class='col-sm-6'></div>");
            }
        }
    }

    function cuentaClabe(control, rowNewDiv, CONTROL_LAYOUT) {
        var attrCuentaClabe;
        if (control.atributos !== undefined) {
            attrCuentaClabe = Enumerable.From(control.atributos.atributo).Where("$.nombre== 'CuentaClabe'").FirstOrDefault();
        }

        if (attrCuentaClabe !== undefined) {
            rowNewDiv.find(CONTROL_LAYOUT).attr("CuentaClabe", "");
        }
    }

    function nombreBanco(control, rowNewDiv, CONTROL_LAYOUT) {
        var attrNombreBanco;
        if (control.atributos !== undefined) {
            attrNombreBanco = Enumerable.From(control.atributos.atributo).Where("$.nombre== 'NombreBanco'").FirstOrDefault();
        }

        if (attrNombreBanco !== undefined) {
            rowNewDiv.find(CONTROL_LAYOUT).attr("NombreBanco", "");
        }
    }

    function textoAlineacionEtiqueta(control, rowNewDiv, CONTROL_LAYOUT) {
        var attrNombreBanco;
        if (control.atributos !== undefined) {
            attrNombreBanco = Enumerable.From(control.atributos.atributo).Where("$.nombre== 'TextoAlineacionEtiqueta'").FirstOrDefault();
        }

        if (attrNombreBanco !== undefined) {
            rowNewDiv.find(CONTROL_LAYOUT).parent().find("div.sat-height-field > div").css("text-align", "justify");
        }
    }

    function copiaElementoGrid(control, rowNewDiv, CONTROL_LAYOUT) {
        var attrCopiaElementoGrid;
        if (control.atributos !== undefined) {
            attrCopiaElementoGrid = Enumerable.From(control.atributos.atributo).Where("$.nombre== 'CopiaElementoGrid'").FirstOrDefault();
        }

        if (attrCopiaElementoGrid !== undefined) {
            rowNewDiv.find(CONTROL_LAYOUT).attr("CopiaElementoGrid", attrCopiaElementoGrid.valor || "");
        }
    }

    function noValidarCampoVacio(control, rowNewDiv, CONTROL_LAYOUT) {
        var attrNoValidarCampoVacio;
        if (control.atributos !== undefined) {
            attrNoValidarCampoVacio = Enumerable.From(control.atributos.atributo).Where("$.nombre== 'NoValidarCampoVacio'").FirstOrDefault();
        }

        if (attrNoValidarCampoVacio !== undefined) {
            rowNewDiv.find(CONTROL_LAYOUT).addClass("NoValidarCampoVacio");
        }
    }

    function formatoEnGrid(control, rowNewDiv, CONTROL_LAYOUT) {
        var formato;
        if (control.atributos && control.atributos.atributo) {
            formato = Enumerable.From(control.atributos.atributo).Where("$.nombre == 'FormatoColumna'").FirstOrDefault();
        }

        if (formato) {
            rowNewDiv.find(CONTROL_LAYOUT).attr("data-formato", formato.valor);
        }
    }

    function tamanoFuente(control, rowNewDiv, CONTROL_LAYOUT) {
        var tamano;
        if (control.atributos && control.atributos.atributo) {
            tamano = Enumerable.From(control.atributos.atributo).Where("$.nombre === 'TamanoFuente'").Select("$.valor").FirstOrDefault("");
        }

        if (!IsNullOrEmptyWhite(tamano) && !isNaN(tamano)) {
            rowNewDiv.find(CONTROL_LAYOUT).css("font-size", "{0}px".format(tamano));
        }
    }
})();