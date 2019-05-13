/** @module FormsBuilder.Modules */
/**
 * Modulo para el render de formularios que crea un contenedor de CFDIs
 * 
 * (c) SAT 2019, Javier Cortés Cruz
 */
/*global namespace:false, FormsBuilder:false, SAT: false */

"use strict";

(function () {
    namespace("FormsBuilder.Modules", Clasificador2018, loadedUIClasificador2018, actualizarContadores);

    function Clasificador2018(control) {
        var idClasificador = control.id;
        var controles = Enumerable.From(control.controles.control).Where("$.tipoControl == 'Columna'").ToArray();
        var grid = Enumerable.From(control.controles.control).Where("$.tipoControl == 'GridCfdi'").FirstOrDefault();
        var template = $("<div><div class='row sat-container-clasificador2018' id='{0}' entidad='{1}' data-tipocontenedor='clasificador'></div></div>".format(idClasificador, control.idEntidadPropiedad));
        var menu = $("<div class='bd col-lg-3 col-md-2 col-sm-12 col-xs-12 menu-tipo-deduccion'><div class='list-group'></div></div>");
        var contenedorControles = $("<div class='col-lg-9 col-md-10 col-sm-12 col-xs-12 contenedor-controles'></div>");
        var contenedorGrid = $("<div class='col-lg-12 col-md-12 col-sm-12 col-xs-12 contenedor-grid'></div>");
        var catalogoTiposDeduccion;
        var tiposDeduccion;
        var templateGrid;

        if (control.atributos && control.atributos.atributo) {
            catalogoTiposDeduccion = Enumerable.From(control.atributos.atributo).Where("$.nombre === 'Catalogo'").Select("$.valor").FirstOrDefault();
        }

        if (!IsNullOrEmpty(catalogoTiposDeduccion)) {
            tiposDeduccion = FormsBuilder.Catalogs.getAll().find("[id='{0}'] elemento".format(catalogoTiposDeduccion));
        }

        if (tiposDeduccion && tiposDeduccion.length > 0) {
            var idEntidadGrid = grid.idEntidadPropiedad;
            tiposDeduccion.each(function () {
                var tipoDeduccion = $(this);
                var templateTipoDeduccion = $("<a href='#' class='list-group-item'><span class='ellipsis txtMenuCategoria'></span><span class='badge badgeMenuCategoria'>0</span></a>");

                templateTipoDeduccion.attr("data-tipo-deduccion", tipoDeduccion.attr("valor"));
                templateTipoDeduccion.attr("data-entidad-grid", idEntidadGrid);
                templateTipoDeduccion.find(".txtMenuCategoria").text(tipoDeduccion.attr("texto"));
                menu.find(".list-group").append(templateTipoDeduccion);
            });
        }

        templateGrid = FormsBuilder.Modules.GridCfdi(grid);

        FormsBuilder.Parser.columnsJsonParse(controles, contenedorControles);
        contenedorGrid.append(templateGrid);
        contenedorControles.append(contenedorGrid);

        template.find(".sat-container-clasificador2018").attr("view-model", "E{0}P{1}".format(control.idEntidadPropiedad, control.idPropiedad));

        template.find(".sat-container-clasificador2018").append(menu);
        template.find(".sat-container-clasificador2018").append(contenedorControles);
        return template.html();
    }

    function loadedUIClasificador2018() {
        $("a[data-tipo-deduccion]").click(function (event) {
            event.preventDefault();
            var link = $(this);
            var padre = link.parent();
            var tipoDeduccion = link.attr("data-tipo-deduccion");
            var idEntidadGrid = link.attr("data-entidad-grid");
            var idEntidad = link.parents(".sat-container-clasificador2018").attr("entidad");
            var idEntidadPropiedad = link.parents(".sat-container-clasificador2018").attr("view-model");

            padre.children().removeClass("active");
            link.addClass("active");

            mostrarConceptosPorTipoDeduccion(idEntidadGrid, tipoDeduccion);
            FormsBuilder.ViewModel.setViewModel(idEntidad, idEntidadPropiedad, tipoDeduccion);
        });

        $("a[data-tipo-deduccion]:first").click();
    }

    function mostrarConceptosPorTipoDeduccion(idEntidad, tipoDeduccion) {
        if (!IsNullOrEmpty(idEntidad) && !IsNullOrEmpty(tipoDeduccion)) {
            var claveMapeoTipoDeduccion = FormsBuilder.XMLForm.obtenerPropiedadMapeoPorClave(idEntidad, SAT.Environment.settings("claveMapeoTipoDeduccion"));

            if (claveMapeoTipoDeduccion) {
                var idEntidadPropiedadTipoDed = "E{0}P{1}".format(idEntidad, claveMapeoTipoDeduccion.idPropiedad);
                var filtro = '{"{0}": "{1}"}'.format(idEntidadPropiedadTipoDed, tipoDeduccion);
                var grid = $(".sat-container-gridcfdi table[entidad='{0}']".format(idEntidad));

                grid.bootstrapTable("filterBy", JSON.parse(filtro));
                grid.bootstrapTable("uncheckAll");
            }
        } else {
            console.error("El IdEntidad y el TipoDeduccion son requeridos");
        }
    }

    function actualizarContadores() {
        $("a[data-tipo-deduccion]").each(function () {
            var link = $(this);
            var tipoDeduccion = link.attr("data-tipo-deduccion");
            var idEntidadGrid = link.attr("data-entidad-grid");
            var claveMapeoTipoDeduccion = FormsBuilder.XMLForm.obtenerPropiedadMapeoPorClave(idEntidadGrid, SAT.Environment.settings("claveMapeoTipoDeduccion"));

            if (claveMapeoTipoDeduccion) {
                var idEntidadPropiedadTipoDed = "E{0}P{1}".format(idEntidadGrid, claveMapeoTipoDeduccion.idPropiedad);
                var detalleGrid = FormsBuilder.ViewModel.getDetalleGrid()[idEntidadGrid];
                var registros = Enumerable.From(detalleGrid).Where("$.{0} === '{1}'".format(idEntidadPropiedadTipoDed, tipoDeduccion)).Count();

                link.find(".badgeMenuCategoria").text(registros);

                if (registros === 0) {
                    link.hide();
                } else {
                    link.show();
                }
            }
        });

        seleccionarDefault();
    }

    function seleccionarDefault() {
        var linkSeleccionado = $("a[data-tipo-deduccion].active");
        if (linkSeleccionado.css("display") === "none") {
            linkSeleccionado.removeClass("active");

            $("a[data-tipo-deduccion]").each(function () {
                var link = $(this);
                var esVisible = link.css("display") !== "none";

                if (esVisible) {
                    link.click();
                    return false;
                }
            });
        }
    }
})();