"use strict";

(function() {
    namespace("FormsBuilder.Paginacion", crearPaginador, paginar, configurarPaginador);

    var LIMITE_PAGINAS;
    var ELEMENTOS_POR_PAGINA;

    var MOVER_ANTERIOR = 0;
    var MOVER_SIGUIENTE = 1;
    var TEMPLATE_CONTENEDOR = "<div class='col-sm-12 text-right paginador'></div>";
    var TEMPLATE_PAGINADOR = "<ul class='pagination' style='margin-top: 0;' entidad='{0}'></ul>";
    var TEMPLATE_PAGINA = "<li><a href='javascript:void(0)' data-inicio='{0}' data-fin='{1}'>{2}</a></li>";

    function configurarPaginador() {
        LIMITE_PAGINAS = AppDeclaracionesSAT.getConfig("limitePaginasPaginador");
        ELEMENTOS_POR_PAGINA = AppDeclaracionesSAT.getConfig("limiteRegistrosGrid");
    }

    function crearPaginador(idEntidad, numeroRegistrosGrid, target) {
        var paginadorHtml = $(TEMPLATE_PAGINADOR.format(idEntidad));

        if (numeroRegistrosGrid > 0 && ELEMENTOS_POR_PAGINA && target) {
            var numeroPaginas = Math.ceil(numeroRegistrosGrid / ELEMENTOS_POR_PAGINA);
            var pintarSiguiente = numeroPaginas > LIMITE_PAGINAS;
            var paginasPintar = pintarSiguiente ? LIMITE_PAGINAS : numeroPaginas;

            target.children(".paginador").remove();

            paginadorHtml.attr("data-totalpaginas", numeroPaginas);

            pintarPaginas(paginadorHtml, paginasPintar, 1, false, pintarSiguiente);

            paginadorHtml.children("li:first").addClass("active").siblings().removeClass("active");
        }

        target.append(TEMPLATE_CONTENEDOR);
        target.children(".paginador").append(paginadorHtml);
        target.attr("data-paginado", true);
    }

    function evtClickPagina(event) {
        $(this).parent().addClass("active").siblings().removeClass("active");
        var paginador = $(this).parents("ul");
        var totalPaginas = parseInt(paginador.attr("data-totalpaginas"));
        var paginaInicio = 0;

        if ($(this).attr("aria-label") === "Next") {
            siguienteAnterior(paginador, totalPaginas, MOVER_SIGUIENTE);
        } else if ($(this).attr("aria-label") === "Previous") {
            siguienteAnterior(paginador, totalPaginas, MOVER_ANTERIOR);
        } else {
            var registroInicio = parseInt($(this).attr("data-inicio"));
            var registroFin = parseInt($(this).attr("data-fin"));
            var idEntidad = paginador.attr("entidad");
            var grid = $(this).parents(".sat-container-formgridedicion").eq(0);
            var filtrado = grid.attr("data-filtrado") === "true";
            var datos = filtrado ? FormsBuilder.ViewModel.getDetalleGridFiltrado()[idEntidad] : FormsBuilder.ViewModel.getDetalleGrid()[idEntidad];

            paginar(idEntidad, datos, registroInicio, registroFin);
            FormsBuilder.Modules.renderFormularioGrid(idEntidad, ORIGEN_DATOS_GRID.PAGINADO, false);
        }
    }

    function paginar(idEntidad, datos, inicio, fin) {
        if (idEntidad) {
            if (datos && datos.length > 0 && inicio && fin) {
                inicio--;

                FormsBuilder.ViewModel.setDetalleGridPaginado(idEntidad, datos.slice(inicio, fin));
            }
        }
    }

    function siguienteAnterior(paginador, totalPaginas, accion) {
        if (totalPaginas && (accion === MOVER_ANTERIOR || accion === MOVER_SIGUIENTE)) {
            var paginaInicio;
            var pintarAnterior;
            var pintarSiguiente;
            var paginasPintar;

            paginador.children("li").remove();

            if (accion === MOVER_ANTERIOR) {
                paginaInicio = parseInt(paginador.attr("data-paginainicio")) - LIMITE_PAGINAS;
                pintarAnterior = paginaInicio > LIMITE_PAGINAS;

                pintarPaginas(paginador, LIMITE_PAGINAS, paginaInicio, pintarAnterior, true);
                seleccionarPagina(paginador, paginaInicio + (LIMITE_PAGINAS - 1));
            } else if (accion === MOVER_SIGUIENTE) {
                paginaInicio = parseInt(paginador.attr("data-paginafin")) + 1;
                pintarSiguiente = (totalPaginas - (paginaInicio - 1)) > LIMITE_PAGINAS;
                paginasPintar = pintarSiguiente ? LIMITE_PAGINAS : totalPaginas - (paginaInicio - 1);

                pintarPaginas(paginador, paginasPintar, paginaInicio, true, pintarSiguiente);
                seleccionarPagina(paginador, paginaInicio);
            }
        }
    }

    function pintarPaginas(paginador, paginasPintar, valorInicio, pintarAnterior, pintarSiguiente) {
        if (paginasPintar && paginasPintar <= LIMITE_PAGINAS) {
            var paginaInicio = valorInicio;
            var paginaFin = valorInicio - 1;
            var registroInicio;
            var registroFin;

            paginador.children("li").remove();

            if (pintarAnterior) {
                paginador.append("<li><a href='javascript:void(0)' aria-label='Previous'><span aria-hidden='true'>&laquo;</span></a></li>");
            }

            for (var i = 0; i < paginasPintar; i++) {
                paginaFin++;
                registroFin = paginaFin * ELEMENTOS_POR_PAGINA;
                registroInicio = registroFin - (ELEMENTOS_POR_PAGINA - 1);
                paginador.append(TEMPLATE_PAGINA.format(registroInicio, registroFin, paginaFin));
            }

            if (pintarSiguiente) {
                paginador.append("<li><a href='javascript:void(0)' aria-label='Next'><span aria-hidden='true'>&raquo;</span></a></li>");
            }

            paginador.attr("data-paginainicio", paginaInicio);
            paginador.attr("data-paginafin", paginaFin);

            paginador.find("a").click(evtClickPagina);
        }
    }

    function seleccionarPagina(paginador, numeroPagina) {
        var pagina = paginador.find("a:contains({0})".format(numeroPagina));

        pagina.click();
    }
})();