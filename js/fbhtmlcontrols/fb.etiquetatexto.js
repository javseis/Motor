/** @module FormsBuilder.Modules */
/**
 * Modulo para el render de formularios que crea una caja de texto
 * 
 * (c) SAT 2013, Iván González
 */
/*global namespace:false, FormsBuilder:false, SAT: false, AppDeclaracionesSAT:false, ko:false, Base64:false */

"use strict";

(function() {
    namespace("FormsBuilder.Modules", EtiquetaTexto);

    var CONTROL_LAYOUT = 'div.sat-padding-label';
    var LABEL_LAYOUT = 'div.sat-padding-label > span';

    function EtiquetaTexto(control) {
        var ctrlBase = FormsBuilder.Modules.ControlBase();
        var db_id = FormsBuilder.Utils.getDbId2(control);

        var rowNewDiv = $('<div><div style="display: table; overflow: hidden;" class="sat-height-field"><div style="display: table-cell; vertical-align: middle; font-weight: bold; font-family: helvetica;"></div></div><div class="sat-height-field sat-padding-label" style="display: table;"><span style="display: table-cell; vertical-align: middle;"></span></div></div>');

        rowNewDiv.find(CONTROL_LAYOUT).attr('id', control.id);
        rowNewDiv.find(".sat-height-field").children().attr('data-titulo-control', control.id);

        var entidad = Enumerable.From(FormsBuilder.XMLForm.getEntidades()).Where("$.id == {0}".format(control.idEntidadPropiedad)).FirstOrDefault();
        var atributo = Enumerable.From(entidad.propiedades.propiedad).Where("$.id == '{0}'".format(control.idPropiedad)).FirstOrDefault();
        var title = Enumerable.From(atributo.atributos.atributo).Where("$.nombre== 'TituloCorto'").FirstOrDefault();


        var helpText = ctrlBase.getHelpText.apply(this, [control]);

        ctrlBase.sinEtiqueta.apply(this, [control, rowNewDiv, title]);
        ctrlBase.alineacionHorizontal.apply(this, [control, rowNewDiv, CONTROL_LAYOUT]);
        ctrlBase.alineacionTexto.apply(this, [control, rowNewDiv, CONTROL_LAYOUT]);
        ctrlBase.sinTitulo.apply(this, [control, rowNewDiv]);

        rowNewDiv.find(LABEL_LAYOUT).attr('data-bind', 'text: {0}'.format(db_id));
        rowNewDiv.find(CONTROL_LAYOUT).attr('view-model', db_id);

        return rowNewDiv.html();
    }
})();