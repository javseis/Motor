/** @module FormsBuilder.Modules */
/**
 * Modulo para el render de formularios que crea una etiqueta
 * 
 * (c) SAT 2013, Iván González
 */
/*global namespace:false, FormsBuilder:false, SAT: false, AppDeclaracionesSAT:false, ko:false, Base64:false */

"use strict";

(function() {
    namespace("FormsBuilder.Modules", Etiqueta);

    var CONTROL_LAYOUT = 'div.sat-padding-label';

    function Etiqueta(control) {
        var ctrlBase = FormsBuilder.Modules.ControlBase();
        var rowNewDiv = $('<div><div style="display: table; overflow: hidden;" class="sat-height-field"><div style="display: table-cell; vertical-align: bottom;"></div></div><div class="sat-height-field sat-padding-label text-justify" style="height: auto;"></div><div class="clear"></div></div>');

        var entidad = Enumerable.From(FormsBuilder.XMLForm.getEntidades()).Where("$.id == {0}".format(control.idEntidadPropiedad)).FirstOrDefault();
        var atributo = Enumerable.From(entidad.propiedades.propiedad).Where("$.id == '{0}'".format(control.idPropiedad)).FirstOrDefault();
        var db_id = FormsBuilder.Utils.getDbId2(control);
        var title;
        if (SAT.Environment.settings('isDAS')) {
            if (control.atributos !== undefined) {
                title = Enumerable.From(control.atributos.atributo).Where("$.nombre == 'TituloCorto'").FirstOrDefault();
            }

            title = title !== undefined ? title : Enumerable.From(atributo.atributos.atributo).Where("$.nombre == 'TituloCorto'").FirstOrDefault();
        } else {
            title = Enumerable.From(atributo.atributos.atributo).Where("$.nombre == 'TituloCorto'").FirstOrDefault();
        }

        if (atributo.atributos.atributo !== undefined) {
            var negrita = Enumerable.From(atributo.atributos.atributo).Where("$.nombre == 'Negritas'").FirstOrDefault();
            if (negrita !== undefined) {
                rowNewDiv.find('div.sat-padding-label').html("<b>{0}</b>".format(title.valor));
            } else {
                rowNewDiv.find('div.sat-padding-label').html(title.valor);
            }
        }

        var centrarTitulo;
        if (atributo.atributos.atributo !== undefined) {
            centrarTitulo = Enumerable.From(atributo.atributos.atributo).Where("$.nombre == 'CentrarTitulo'").FirstOrDefault();
        }

        if (centrarTitulo !== undefined) {
            rowNewDiv.find('div.sat-padding-label').css("text-align", "center");
        }

        ctrlBase.sinTitulo.apply(this, [control, rowNewDiv]);
        ctrlBase.tamanoFuente.apply(this, [control, rowNewDiv, CONTROL_LAYOUT]);

        rowNewDiv.find(CONTROL_LAYOUT).attr('view-model', db_id);

        return rowNewDiv.html();
    }
})();