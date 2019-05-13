/** @module FormsBuilder.Modules */
/**
 * Modulo para el render de formularios que crea una caja de texto
 * 
 * (c) SAT 2013, Iván González
 */
/*global namespace:false, FormsBuilder:false, SAT: false */

"use strict";

(function() {
    namespace("FormsBuilder.Modules", CuadroTexto);

    var CONTROL_LAYOUT = "input";

    function CuadroTexto(control) {
        var ctrlBase = FormsBuilder.Modules.ControlBase();
        var db_id = FormsBuilder.Utils.getDbId2(control);

        var entidad = Enumerable.From(FormsBuilder.XMLForm.getEntidades()).Where("$.id == {0}".format(control.idEntidadPropiedad)).FirstOrDefault();
        var atributo = Enumerable.From(entidad.propiedades.propiedad).Where("$.id == '{0}'".format(control.idPropiedad)).FirstOrDefault();
        var type = 'type="text"';

        if (atributo.tipoDatos === "Numerico" && SAT.Environment.settings("isMobile")) {
            type = 'type="numeric" pattern="[0-9]*" inputmode="numeric"';
        }

        var rowNewDiv;
        if (SAT.Environment.settings("isDAS")) {
            rowNewDiv = $('<div><div style="display: table; overflow: hidden;" class="sat-height-field"><div style="display: table-cell; vertical-align: bottom;"><span class="ic-help"></span></div></div><input onpaste="return false;" ondragstart="blanktext(event.dataTransfer)" {0} class="form-control sat-height-field" placeholder=""><div class="clear"></div></div>'.format(type));
        } else {
            rowNewDiv = $('<div><div style="display: table; overflow: hidden;" class="sat-height-field"><div style="display: table-cell; vertical-align: bottom;"></div></div><input onpaste="return false;" ondragstart="blanktext(event.dataTransfer)" type="text" class="form-control sat-height-field" placeholder=""><span class="ic-help"></span><div class="clear"></div></div>');
        }

        rowNewDiv.find(CONTROL_LAYOUT).attr("id", control.id);
        rowNewDiv.find(".sat-height-field").children().attr("data-titulo-control", control.id);

        var title;
        if (SAT.Environment.settings("isDAS")) {
            if (control.atributos !== undefined) {
                title = Enumerable.From(control.atributos.atributo).Where("$.nombre == 'TituloCorto'").FirstOrDefault();
            }

            title = title !== undefined ? title : Enumerable.From(atributo.atributos.atributo).Where("$.nombre == 'TituloCorto'").FirstOrDefault();
        } else {
            //title = atributo.find('atributo[nombre="TituloCorto"]');
            title = Enumerable.From(atributo.atributos.atributo).Where("$.nombre == 'TituloCorto'").FirstOrDefault();
        }
        var titleLarge = Enumerable.From(atributo.atributos.atributo).Where("$.nombre == 'TituloLargo'").FirstOrDefault({ valor: "" });
        //var titleLarge = atributo.find('atributo[nombre="TituloLargo"]');
        var helpText = ctrlBase.getHelpText.apply(this, [control]);

        if (atributo.tipoDatos === "Numerico") {
            rowNewDiv.find(CONTROL_LAYOUT).addClass("currency");
        } else if (atributo.tipoDatos === "Alfanumerico") {
            // rowNewDiv.find(CONTROL_LAYOUT).attr('onkeydown', 'BloqueaEmoticons(event)');
        }

        var copiadoDesde;
        if (control.atributos !== undefined) {
            copiadoDesde = Enumerable.From(control.atributos.atributo).Where("$.nombre == 'CopiadoDesde'").FirstOrDefault();

        }

        if (copiadoDesde != undefined) {
            rowNewDiv.find(CONTROL_LAYOUT).attr("copiadoDesde", copiadoDesde.valor);
        }

        ctrlBase.capturaDecimales.apply(this, [control, rowNewDiv, CONTROL_LAYOUT]);

        ctrlBase.muestraEnGrid.apply(this, [control, rowNewDiv, CONTROL_LAYOUT]);

        ctrlBase.sinEtiqueta.apply(this, [control, rowNewDiv, title]);

        ctrlBase.alineacionHorizontal.apply(this, [control, rowNewDiv, CONTROL_LAYOUT]);

        ctrlBase.forzarModoEdicion.apply(this, [control, rowNewDiv, CONTROL_LAYOUT]);

        ctrlBase.validaLongitud.apply(this, [control, rowNewDiv, CONTROL_LAYOUT]);

        ctrlBase.soloNumerosPositivos.apply(this, [control, rowNewDiv, CONTROL_LAYOUT]);

        ctrlBase.soloNumerosDecimales.apply(this, [control, rowNewDiv, CONTROL_LAYOUT]);

        ctrlBase.mostrarDecimales.apply(this, [control, rowNewDiv, CONTROL_LAYOUT]);

        ctrlBase.ayudaEnDialogo.apply(this, [control, rowNewDiv, CONTROL_LAYOUT]);

        var numerosNegativos = false;
        ctrlBase.soloNumerosNegativos.apply(this, [control, rowNewDiv, CONTROL_LAYOUT, numerosNegativos]);

        ctrlBase.ordenTabulador.apply(this, [control, rowNewDiv, CONTROL_LAYOUT]);

        ctrlBase.acumular.apply(this, [control, rowNewDiv, CONTROL_LAYOUT]);

        ctrlBase.obligatorio.apply(this, [control, rowNewDiv, CONTROL_LAYOUT]);

        ctrlBase.sinTitulo.apply(this, [control, rowNewDiv]);

        ctrlBase.mensajeValidacion.apply(this, [control, rowNewDiv, CONTROL_LAYOUT]);

        ctrlBase.enMayusculas2.apply(this, [control, rowNewDiv, CONTROL_LAYOUT, numerosNegativos]);

        ctrlBase.validaRFCFM.apply(this, [control, rowNewDiv, CONTROL_LAYOUT]);

        ctrlBase.enMayusculas.apply(this, [control, rowNewDiv, CONTROL_LAYOUT, numerosNegativos]);

        ctrlBase.noRemoverCeros.apply(this, [control, rowNewDiv, CONTROL_LAYOUT]);

        ctrlBase.alineacionTexto.apply(this, [control, rowNewDiv, CONTROL_LAYOUT]);

        ctrlBase.copiaElementoGrid.apply(this, [control, rowNewDiv, CONTROL_LAYOUT]);
        ctrlBase.formatoEnGrid.apply(this, [control, rowNewDiv, CONTROL_LAYOUT]);

        var helpString = ctrlBase.helpString.apply(this, [titleLarge, helpText]);

        rowNewDiv.find(CONTROL_LAYOUT).attr("help-text", helpString);
        rowNewDiv.find(CONTROL_LAYOUT).attr("data-bind", 'valueUpdate: "blur", value: {0}'.format(db_id));
        rowNewDiv.find(CONTROL_LAYOUT).attr("view-model", db_id);

        return rowNewDiv.html();
    }
})();