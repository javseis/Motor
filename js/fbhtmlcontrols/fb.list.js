/** @module FormsBuilder.Modules */
/**
* Modulo para el render de formularios que crea una lista
* 
* (c) SAT 2017, Javier Cortés
*/
/*global namespace:false, FormsBuilder:false, SAT: false, AppDeclaracionesSAT:false, ko:false, Base64:false */

"use strict";

(function() {
	namespace("FormsBuilder.Modules", List);

	function List(control) {
	    var encabezados = [];
	    var listaHtml = $("<div><div class='list-group'></div></div>");

	    if (control.controles && control.controles.control && control.controles.control.length > 0) {
	        if (control.atributos && control.atributos.atributo) {
	            encabezados = Enumerable.From(control.atributos.atributo).Where("$.nombre === 'TituloCorto'").Select("$.valor").FirstOrDefault("").replaceAll(" | ", "|").split("|");

	            if (encabezados.length === 1 || encabezados.length === 2) {
	                var encabezadoHtml = "<a class='list-group-item' style='background-color: #eee;'>{0}<span style='float: right; font-size: 14px; font-weight: bold;'>{1}</span></a>".format(encabezados[0], encabezados[1] || "");
	                listaHtml.find(".list-group").append(encabezadoHtml);
	            }
	        }

	        for (var i = 0; i < control.controles.control.length; i++) {
	            var textoElemento = "";
	            var elementoHtml = $("<a class='list-group-item'><span class='label'></span></a>");
	            var elementoLista = control.controles.control[i];
	            var db_id = "E{0}P{1}".format(elementoLista.idEntidadPropiedad, elementoLista.idPropiedad);

	            if (elementoLista.atributos && elementoLista.atributos.atributo) {
	                var mostrarComoTotal = Enumerable.From(elementoLista.atributos.atributo).Any("$.nombre === 'MostrarComoTotal'");
	                textoElemento = Enumerable.From(elementoLista.atributos.atributo).Where("$.nombre === 'TituloCorto'").Select("$.valor").FirstOrDefault("");

	                if (mostrarComoTotal === true) {
	                    elementoHtml.css("background-color", "#eee");
	                }
	            }

	            if (IsNullOrEmptyWhite(textoElemento)) {
	                var propiedadJson = FormsBuilder.XMLForm.obtenerPropiedadPorId(null, elementoLista.idPropiedad);

	                if (propiedadJson && propiedadJson.atributos && propiedadJson.atributos.atributo) {
	                    textoElemento = Enumerable.From(propiedadJson.atributos.atributo).Where("$.nombre === 'TituloCorto'").Select("$.valor").FirstOrDefault("");
	                }
	            }

	            elementoHtml.append(textoElemento);
	            elementoHtml.attr("view-model", db_id);
	            elementoHtml.find("span").attr("data-bind", "text: {0}".format(db_id));

	            listaHtml.find(".list-group").append(elementoHtml);
	        }
	    }

	    return listaHtml.html();
	}
})();
