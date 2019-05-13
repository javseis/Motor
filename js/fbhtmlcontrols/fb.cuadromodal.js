/** @module FormsBuilder.Modules */
/**
 * Modulo para el render de modales personalizados.
 * 
 * (c) SAT 2016, Javier Cortes
 */
/*global namespace:false, FormsBuilder:false, SAT: false, AppDeclaracionesSAT:false, ko:false, Base64:false */

"use strict";

(function() {
    namespace("FormsBuilder.Modules", CuadroModal, loadedUICuadroModal);

    function CuadroModal(control) {
        var TAG_INPUT = "input";
        var ctrlBase = FormsBuilder.Modules.ControlBase();
        var helpString = "";
        var mostrarComoEtiqueta = false;
        var pintarEnModal = false;
        var tituloCorto = { valor: "" };
        var tituloLargo = { valor: "" };
        var tituloModal = { valor: "" };
        var helpText = ctrlBase.getHelpText.apply(this, [control]);
        var entidad = Enumerable.From(FormsBuilder.XMLForm.getEntidades()).Where("$.id == {0}".format(control.idEntidadPropiedad)).FirstOrDefault();
        var propiedad = Enumerable.From(entidad.propiedades.propiedad).Where("$.id == '{0}'".format(control.idPropiedad)).FirstOrDefault();
        var db_id = FormsBuilder.Utils.getDbId2(control);
        var htmlCuadroModal = $('<div><div style="display: table; overflow: hidden;" class="sat-height-field"><div class="titulo-{0}" style="display: table-cell; vertical-align: bottom;"><span class="ic-help"></span></div></div><div class="col-sm-12"><div class="row"><input type="text" onpaste="return false;" class="form-control sat-height-dlg sat-textbox-dialog sat-height-field" style="width: 78%!important;" placeholder="" /><a data-idcontrol="{0}" data-toggle="collapse" href="#collapse-{0}" class="btn btn-primary btn-detalle sat-button-dialog">Detalle</a></div></div><div class="clear"/></div>'.format(control.id));
        var controlesHtml = $("<div><div id='collapse-{0}' class='col-sm-12 collapse sat-cuadro-modal' data-tipocontenedor='collapse'><div class='row' style='padding: 10px;'><a href='#collapse-{0}' data-toggle='collapse' aria-label='Close' style='color: #c00000;'><span aria-hidden='true' style='margin-left: 5px;'>&times;</span></a></div></div></div>".format(control.id));
        var controlesHijo = Enumerable.From(control.controles.control).Where("$.tipoControl == 'Columna'").ToArray();

        if (control.atributos && control.atributos.atributo) {
            pintarEnModal = Enumerable.From(control.atributos.atributo).Any("$.nombre === 'MostrarEnModal'");
            mostrarComoEtiqueta = Enumerable.From(control.atributos.atributo).Any("$.nombre === 'MostrarComoEtiqueta'");
            tituloCorto = Enumerable.From(control.atributos.atributo).Where("$.nombre == 'TituloCorto'").FirstOrDefault({ valor: "" });
            tituloLargo = Enumerable.From(control.atributos.atributo).Where("$.nombre == 'TituloLargo'").FirstOrDefault({ valor: "" });
            tituloModal = Enumerable.From(control.atributos.atributo).Where("$.nombre == 'TituloDialogo'").FirstOrDefault({ valor: "" });
        }

        if (propiedad.atributos && propiedad.atributos.atributo) {
            if (!tituloCorto.valor) {
                tituloCorto = Enumerable.From(propiedad.atributos.atributo).Where("$.nombre == 'TituloCorto'").FirstOrDefault({ valor: "" });
            }
            if (!tituloLargo.valor) {
                tituloLargo = Enumerable.From(propiedad.atributos.atributo).Where("$.nombre == 'TituloLargo'").FirstOrDefault({ valor: "" });
            }
        }

        if (mostrarComoEtiqueta === true) {
            var etiquetaHtml = "<span class='sat-height-dlg sat-textbox-dialog sat-height-field' style='width: 71%!important; text-align: right; padding-top: 10px;'>{0}</span>".format(tituloCorto.valor);

            htmlCuadroModal.find(TAG_INPUT).remove();
            htmlCuadroModal.find("div.row").prepend(etiquetaHtml);

            TAG_INPUT = "span.sat-textbox-dialog";
        } else {
            htmlCuadroModal.find(TAG_INPUT).attr("data-bind", "value: {0}".format(db_id));
            htmlCuadroModal.find(".titulo-{0}".format(control.id)).append(tituloCorto.valor);
        }

        helpString = ctrlBase.helpString.apply(this, [tituloLargo, helpText]);

        htmlCuadroModal.find(".sat-height-field").children().attr('data-titulo-control', control.id);
        htmlCuadroModal.find(TAG_INPUT).attr('help-text', helpString);
        htmlCuadroModal.find(TAG_INPUT).attr('id', control.id);
        htmlCuadroModal.find(TAG_INPUT).attr("view-model", db_id);
        htmlCuadroModal.find("a").attr("vm", db_id);

        if (pintarEnModal) {
            htmlCuadroModal.find("a").attr("href", "#modal-{0}".format(control.id));
            htmlCuadroModal.find("a").attr("data-toggle", "modal");
            htmlCuadroModal.find("a").attr("data-backdrop", "static");
            htmlCuadroModal.find("a").attr("data-keyboard", "false");
            controlesHtml = $("<div id='modal-{0}' class='modal fade sat-cuadro-modal' role='dialog' data-tipocontenedor='modal'><div class='modal-dialog modal-lg'><div class='modal-content'><div class='modal-header'><button type='button' class='close' data-dismiss='modal' aria-label='Close'><span aria-hidden='true'>&times;</span></button><h4 class='modal-title'><label></label></h4></div><div class='modal-body'><div class='row'><div class='col-sm-12'></div></div></div><div class='modal-footer'><button type='button' class='btn btn-primary' data-dismiss='modal'>Cerrar</button></div></div></div></div>".format(control.id));
            controlesHtml.attr("entidad", control.idEntidadPropiedad);
            controlesHtml.find(".modal-title label").html(tituloModal.valor);
        } else {
            controlesHtml.find(".collapse").attr("entidad", control.idEntidadPropiedad);
            controlesHtml.find("a").prepend(tituloModal.valor);
        }

        ctrlBase.formatCurrency.apply(this, [propiedad, htmlCuadroModal, TAG_INPUT]);

        ctrlBase.capturaDecimales.apply(this, [control, htmlCuadroModal, TAG_INPUT]);

        ctrlBase.muestraEnGrid.apply(this, [control, htmlCuadroModal, TAG_INPUT]);

        ctrlBase.alineacionHorizontal.apply(this, [control, htmlCuadroModal, TAG_INPUT]);

        ctrlBase.forzarModoEdicion.apply(this, [control, htmlCuadroModal, TAG_INPUT]);

        ctrlBase.validaLongitud.apply(this, [control, htmlCuadroModal, TAG_INPUT]);

        ctrlBase.soloNumerosPositivos.apply(this, [control, htmlCuadroModal, TAG_INPUT]);

        ctrlBase.mostrarDecimales.apply(this, [control, htmlCuadroModal, TAG_INPUT]);

        ctrlBase.ayudaEnDialogo.apply(this, [control, htmlCuadroModal, TAG_INPUT]);

        ctrlBase.soloNumerosNegativos.apply(this, [control, htmlCuadroModal, TAG_INPUT, false]);

        ctrlBase.ordenTabulador.apply(this, [control, htmlCuadroModal, TAG_INPUT]);

        ctrlBase.acumular.apply(this, [control, htmlCuadroModal, TAG_INPUT]);

        ctrlBase.obligatorio.apply(this, [control, htmlCuadroModal, TAG_INPUT]);

        ctrlBase.sinTitulo.apply(this, [control, htmlCuadroModal]);

        ctrlBase.mensajeValidacion.apply(this, [control, htmlCuadroModal, TAG_INPUT]);

        ctrlBase.enMayusculas2.apply(this, [control, htmlCuadroModal, TAG_INPUT, false]);

        ctrlBase.validaRFCFM.apply(this, [control, htmlCuadroModal, TAG_INPUT]);

        ctrlBase.enMayusculas.apply(this, [control, htmlCuadroModal, TAG_INPUT, false]);

        ctrlBase.noRemoverCeros.apply(this, [control, htmlCuadroModal, TAG_INPUT]);

        ctrlBase.alineacionTexto.apply(this, [control, htmlCuadroModal, TAG_INPUT]);

        ctrlBase.copiaElementoGrid.apply(this, [control, htmlCuadroModal, TAG_INPUT]);

        FormsBuilder.Parser.columnsJsonParse(controlesHijo, controlesHtml.find(".col-sm-12"));
        htmlCuadroModal.append(controlesHtml);

        return htmlCuadroModal.html();
    }

    function loadedUICuadroModal() {
        $(".btn-detalle").click(function() {
            var referencia = $(this).attr("href");
            var target = $(referencia);

            if (target.length > 0) {
                var tabs = target.find("a[data-toggle='tab']").filter(function() { return $(this).parent().css("display") == undefined || $(this).parent().css("display") == "block" });

                if (tabs.length > 0) {
                    tabs.first().click();
                }
            }
        });

        $("div[id^='modal-']").on("hide.bs.modal", function() {
            var modal = $(this);
            var grid = modal.find(".sat-container-formgridedicion");

            if (grid.length > 0) {
                grid.find("button.btnCancelEdit").click();
            }
        });
    }
})();