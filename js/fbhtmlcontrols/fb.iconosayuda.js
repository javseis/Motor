/** @module FormsBuilder.Modules */
/**
* Modulo para el render de formularios que crea una caja de texto
* 
* (c) SAT 2013, Iván González
*/
/*global namespace:false */

"use strict";

(function () {
    namespace("FormsBuilder.Modules", IconosAyuda);

    var CONTROL_LAYOUT = "div.sat-padding-label";
    var TEMPLATE_AYUDA = "<div class='col-md-2 col-sm-4 col-xs-12 btnImgContainer'>" +
        "<button class='btn btnImg' data-toggle='modal' data-target='#detalleHonorarios'idCatalogo='{2}' idElemento='{3}' tooltip='{4}' ><div class='col-md-12 col-sm-12 col-xs-3'>" +
        "<img style='cursor: pointer;' src='/css/imgs/{0}' alt='{1}' /></div>" +
        "<div class='col-md-12 col-sm-12 col-xs-9'><p class='textIconos'>{4}</p></div></button></div>";

    function IconosAyuda(control) {
        var rowNewDiv = $("<div><div class='col-sm-12 gastosDeducibles'><div class='row iconosAyuda'></div></div></div>");
        var iconosAyuda = Enumerable.From(control.atributos.atributo).Where("$.nombre.startsWith('IconoAyuda')").ToArray();

        rowNewDiv.find(CONTROL_LAYOUT).attr("id", control.id);
        iconosAyuda = iconosAyuda.sort(function (a, b) {
            var ordenA = a.valor.split("|")[2];
            var ordenB = b.valor.split("|")[2];

            return parseInt(ordenA) - parseInt(ordenB);
        });

        iconosAyuda.forEach(function (icono) {
            var valor = icono.valor.split("|");
            var img = TEMPLATE_AYUDA.format(valor[0], icono.nombre, valor[1], valor[2], valor[3]);
            rowNewDiv.find("div.iconosAyuda").append(img);
        });

        return rowNewDiv.html();
    }
})();
