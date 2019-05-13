/*global FormsBuilder:true, */

"use strict";

(function () {
    namespace("FormsBuilder.Parser", parseJson, columnsJsonParse, getDataProp);
    window.fbParser = FormsBuilder.Parser;
    // // Constants


    // var CONTROLS_LAYOUT = 'control';

    // var LABEL_GROUP = 'etiqueta';
    // var FORM_LAYOUT = 'formulario > controles';
    // var FORM_ROOT_LAYOUT = 'formulario';

    // var PANEL_LAYOUT = 'panel-default';
    // var PANEL_HEADING_LAYOUT = 'panel-heading';

    // var LIST_SECTIONS_LAYOUT = 'lt-sections';

    // Constants
    var REGIMEN_ISR_REFIPRES = 18;
    var REGIMEN_ENAJENACION_ACCIONES = 19;
    var REGIMEN_RIF_ANUAL = 31;
    var REGIMEN_ANUAL_PF = 6;
    // var PANEL_LAYOUT = 'panel-default';
    // var PANEL_HEADING_LAYOUT = 'panel-heading > h4 > a';
    var PATH_ICONOS = "../../Content/imgs/";
    var data_prop = [];

    function getDataProp() {
        return data_prop;
    }

    function validarRegimen() {
        var configuracion = AppDeclaracionesSAT.getConfig("configuracionDeclaracion");
        var ocultar = function () {
            $("[data-menu]").hide();
            $("a[href='#tabDeterminacion']").click();
            $("a.btn-guardar-das, a.btn-revisar-das, a.btn-enviar-das").show();
            $("a.btn-perfil-das").hide();
        };

        if (configuracion) {
            var regimen = configuracion.regimen;

            if (regimen instanceof Array) {
                var tieneRegimen6 = Enumerable.From(regimen).Any("$ == {0}".format(REGIMEN_ANUAL_PF));

                if (!tieneRegimen6) {
                    var tieneRegimenOcultar = Enumerable.From(regimen).Any("$ == {0} || $ == {1} || $ == {2}"
                        .format(REGIMEN_ISR_REFIPRES, REGIMEN_ENAJENACION_ACCIONES, REGIMEN_RIF_ANUAL));

                    if (tieneRegimenOcultar) {
                        ocultar();
                    }
                }
            } else {
                if (regimen == REGIMEN_ISR_REFIPRES || regimen == REGIMEN_ENAJENACION_ACCIONES
                    || regimen == REGIMEN_RIF_ANUAL) {

                    ocultar();
                }
            }
        }
    }

    function parseJson(jsonDoc, callback) {

        console.log(">>>> Inicia 'Parser.parseJson'");

        //var domGen = '';

        //$('.panel-sections .panel-title').html($(xmlDoc).find('formulario').attr('nombre'));

        FormsBuilder.Catalogs.init(jsonDoc.catalogos);

        FormsBuilder.XMLForm.initJson(jsonDoc);

        var navegacionOrdenada = Enumerable.From(jsonDoc.navegacion.agrupador).OrderBy("parseInt($.orden)").ToArray();

        navigationGroupMenuJsonParse(navegacionOrdenada);

        validarRegimen();

        callback();
    }

    function navigationGroupMenuJsonParse(navegacion) {
        var template = "<div id='{0}' class='panel panel-default ficha-collapse'><div class='panel-heading'>" +
            "<h4 class='panel-title' data-titulo-grupo><a data-toggle='collapse' data-parent='#groupcontainer{1}' href='#collapse{0}'><span>{2}</span></a></h4></div>" +
            "<div id='collapse{0}' class='panel-collapse {3}'><div class='panel-body'></div></div></div>";
        var controles = FormsBuilder.XMLForm.getControles();

        $(".icon6-wrapper").remove();
        $("[id^=groupcontainer]").html("");

        console.log("{{{{{navegacion}}}}}");
        console.log(navegacion);

        $.each(navegacion, function (key, grupo) {
            var titulo = grupo.titulo;
            var idGrupo = grupo.id;
            var idEntidadPropiedad = grupo.idEntidadPropiedad;
            var idTipoAgrupador = grupo.idTipoAgrupador;
            var secciones = grupo.seccion;
            var diagramacion = [];
            var htmlGrupo = "";
            var htmlControles = "";
            var contenedorPanel = $("#groupcontainer{0}".format(idTipoAgrupador));
            var contenedorSecciones = contenedorPanel.children().length;

            var db_id;
            if (grupo.idPropiedad !== undefined && grupo.idPropiedad !== "") {
                db_id = "E{0}P{1}".format(idEntidadPropiedad, grupo.idPropiedad);
                data_prop.push(db_id);
                //$('.panelmoney').append('<div class="col-lg-12 line-D-gray"><span>{0}</span><span field-bind="{1}"></span></div>'.format(title, db_id));
            }

            for (var i = 0; i < secciones.length; i++) {
                var seccion = secciones[i];
                var controlesSeccion = Enumerable.From(controles).Where("$.control.id == '{0}'".format(seccion.idControlFormulario)).Select("$.control").FirstOrDefault();

                diagramacion.push(controlesSeccion);
            }

            htmlControles = sectionJsonParse(diagramacion, idGrupo);
            htmlGrupo = $(template.format(idGrupo, idTipoAgrupador, titulo, contenedorSecciones === 0 ? "in" : "collapsing"));
            htmlGrupo.find(".panel-body").append(htmlControles);

            if (grupo.icono) {
                htmlGrupo.find("h4 > a").prepend("<img src='{0}{1}.png' />".format(PATH_ICONOS, grupo.icono));
            }

            contenedorPanel.append(htmlGrupo);
        });
    }

    function sectionJsonParse(secciones, idGrupo) {
        var navegacion = FormsBuilder.XMLForm.getNavegacion()["agrupador"];
        var seccionesNavegacion = Enumerable.From(navegacion).SelectMany("$.seccion").ToArray();
        var template = "<div class='topmenu col-xs-12 col-sm-12 panel panel-default' data-tipocontenedor='seccion'><div>" +
            "<h5 data-titulo-seccion><a data-toggle='collapse' data-parent='#sectioncontainer-{1}' href='#{0}'>" +
            "<i class='{2}' style='margin-right: 10px;'></i><span>{3}</span></a></h5></div>" +
            "<div id='{0}' class='panel-collapse {4}'><div class='panel-body'></div></div></div>";
        var contenedorSecciones = $("<div id='sectioncontainer-{0}' class='panel-group'></div>".format(idGrupo));
        var seccionTemplate = $("<div></div>");

        $.each(secciones, function (key, seccion) {
            var seccionNavegacion = Enumerable.From(seccionesNavegacion).Where("$.idControlFormulario == '{0}'".format(seccion.id)).FirstOrDefault();
            var titulo = seccionNavegacion.tituloSeccion ? seccionNavegacion.tituloSeccion : "";
            var columnasSeccion = seccion.controles.control;
            var panelClass = key === 0 ? "in" : "collapsing";
            var icono = key === 0 ? "icon-minus-sign" : "icon-plus-sign";
            var panel = $(template.format(seccion.id, idGrupo, icono, titulo, panelClass));

            columnsJsonParse(columnasSeccion, panel.find(".panel-body"));

            if (seccionNavegacion.ocultar) {
                panel.hide();
            }

            contenedorSecciones.append(panel);
        });

        seccionTemplate.append(contenedorSecciones);

        return seccionTemplate.html();
    }

    //Secciones en tabs
    // function sectionTabsJsonParse(grupos, sonSecciones) {
    //     var nuevoElemento = "";
    //     var navegacion = FormsBuilder.XMLForm.getNavegacion()["agrupador"];
    //     var seccionesNavegacion = Enumerable.From(navegacion).SelectMany("$.seccion").ToArray();
    //     var template = "<li class='{0}' style='width: {1}%;'><a data-toggle='tab' href='#tab{2}'>{3}</a></li>";
    //     var width = 100 / grupos.length;
    //     var lista = $("<ul class='topmenu col-xs-12 col-sm-12 nav nav-tabs'></ul>");
    //     var contenedorTabs = $("<div class='tab-content'></div>");
    //     var seccion = $("<div></div>");

    //     $.each(grupos, function(key, grapedGroup) {
    //         var group = grapedGroup.control;
    //         var seccionNavegacion = Enumerable.From(seccionesNavegacion).Where("$.idControlFormulario == '{0}'".format(group.id)).FirstOrDefault();
    //         var titulo = seccionNavegacion.tituloSeccion ? seccionNavegacion.tituloSeccion : "";
    //         var columnasGrupo = group.controles.control;
    //         var tabClass = key === 0 ? "tab-pane active" : "tab-pane fade";
    //         var liClass = key === 0 ? "active" : null;
    //         var tab = $("<div id='tab{0}' class='{1}'></div>".format(group.id, tabClass));
    //         var elementoLista = $(template.format(liClass, width, group.id, titulo));
    //         columnsJsonParse(columnasGrupo, tab);

    //         lista.append(elementoLista);
    //         contenedorTabs.append(tab);
    //     });

    //     seccion.append(lista);
    //     seccion.append(contenedorTabs);

    //     return seccion.html();
    // }

    // function groupsJsonParseAccordion(groups, areMainGroups) {
    //     var domGenerated = '';
    //     var paneldinamico = null;
    //     var columnasFixed = null;
    //     var title = null;
    //     $.each(groups, function(key, grapedGroup) {
    //         var group = grapedGroup.control;
    //         var panelNewDiv;

    //         if (areMainGroups) {
    //             panelNewDiv = $('<div><div class="panel panel-default ficha-collapse"><div class="panel-heading" role="tab"><h4 class="panel-title"><a role="button" data-toggle="collapse" data-parent="#accordion" href="#collapseOne" aria-expanded="true" aria-controls="collapseOne">Datos generales</a></h4></div><div id="collapseOne" class="panel-collapse collapsing" role="tabpanel" aria-labelledby="headingOne"><div class="panel-body"></div></div></div></div>'.format(PANEL_LAYOUT));
    //         } else {
    //             var tituloLargoGroup = group.atributos ? Enumerable.From(group.atributos.atributo).Where("$.nombre='TituloLargo'").FirstOrDefault() : null;

    //             if (tituloLargoGroup) {
    //                 var styleTituloGrupo = 'border-left: solid 1px lightgray; border-top: solid 1px lightgray; border-right: solid 1px lightgray; margin-bottom: 2px;';
    //                 var styleH5 = 'background-color: lightgray; padding: 5px;';

    //                 panelNewDiv = $('<div><div style="{0}" class="panel-body"><h5 style="{1}" tituloGrupo="">{2}</h5></div></div>'.format(styleTituloGrupo, styleH5, tituloLargoGroup.valor || ''));
    //             } else {
    //                 panelNewDiv = $('<div><div class="panel-body"></div></div>');
    //             }
    //         }

    //         var identifier = "A{0}".format(group.id);
    //         if (group.atributos != undefined) {
    //             if (Enumerable.From(group.atributos.atributo)
    //                 .Where("$.nombre == 'ocultar' && $.valor=='1'")
    //                 .Count() > 0) {

    //                 panelNewDiv.find('.' + PANEL_LAYOUT).hide();
    //             }


    //             paneldinamico = Enumerable.From(group.atributos.atributo).Where("$.nombre == 'Panel'").FirstOrDefault();
    //             columnasFixed = Enumerable.From(group.atributos.atributo).Where("$.nombre == 'ColumnasFixed'").FirstOrDefault();
    //             title = Enumerable.From(group.atributos.atributo).Where("$.nombre == 'TituloLargo'").FirstOrDefault();
    //         }

    //         panelNewDiv.find('.' + PANEL_LAYOUT).attr("id", "A{0}".format(group.id));
    //         panelNewDiv.find('.' + PANEL_LAYOUT).attr("idEntidadPropiedad", group.idEntidadPropiedad);
    //         panelNewDiv.find('.' + PANEL_HEADING_LAYOUT).attr('href', '#collapse' + identifier);
    //         panelNewDiv.find('#collapseOne').attr('id', 'collapse' + identifier);
    //         //panelNewDiv.find('.' + PANEL_LAYOUT).hide();
    //         //seccionesUI[group.idEntidadPropiedad] = "A{0}".format(group.id);

    //         FormsBuilder.ViewModel.getFlujoSecciones()[group.idEntidadPropiedad] = {};
    //         FormsBuilder.ViewModel.getFlujoSecciones()[group.idEntidadPropiedad]['EntroSeccion'] = false;

    //         /*TODO
    //         if ($(group).parents().eq(1)[0].nodeName === FORM_ROOT_LAYOUT) {
    //             panelNewDiv.find('.' + PANEL_LAYOUT).attr("id", "A{0}".format($(group).attr('id')));
    //             panelNewDiv.find('.' + PANEL_LAYOUT).attr("idEntidadPropiedad", $(group).attr('idEntidadPropiedad'));
    //             panelNewDiv.find('.' + PANEL_LAYOUT).hide();
    //             seccionesUI[$(group).attr('idEntidadPropiedad')] = "A{0}".format($(group).attr('id'));

    //             FormsBuilder.ViewModel.getFlujoSecciones()[$(group).attr('idEntidadPropiedad')] = {};
    //             FormsBuilder.ViewModel.getFlujoSecciones()[$(group).attr('idEntidadPropiedad')]['EntroSeccion'] = false;
    //         }
    //         */



    //         if (paneldinamico != null) {
    //             panelNewDiv.find('.' + PANEL_LAYOUT).attr('PanelDinamico', paneldinamico.valor || '');
    //         }


    //         if (columnasFixed != null) {
    //             panelNewDiv.find('.' + PANEL_LAYOUT).attr('ColumnasFixed', '');
    //         }


    //         if (title != null) {
    //             //panelNewDiv.find('.' + PANEL_LAYOUT).prepend('<div class="{0}"></div>'.format(PANEL_HEADING_LAYOUT));

    //             panelNewDiv.find('.' + PANEL_HEADING_LAYOUT).html(title.valor);
    //         }

    //         //var columns = Enumerable.From(group.controles.control).Where("$.tipoControl== 'Columna'").ToArray();
    //         var columns;
    //         if (group.controles.control instanceof Array) {
    //             columns = group.controles.control;
    //         } else {
    //             columns = [group.controles.control];
    //         }
    //         panelNewDiv = columnsJsonParse(columns, panelNewDiv);

    //         domGenerated += panelNewDiv.html();

    //     });

    //     return domGenerated;
    // }

    function grupsJsonParse(grupos) {
        var template = "<div id='{0}' class='panel panel-default'  data-tipocontenedor='fila'><div class='panel-heading'><b>{1}</b></div><div class='panel-body'></div></div><br>";
        var panelBody = $("<div></div>");

        $.each(grupos, function (key, group) {
            if (group.tipoControl === "Titulo") {
                var tituloHtml = titleJsonParse(group);
                panelBody.append(tituloHtml);
            } else {
                var titulo = "";
                var mostrarSiempre = false;
                var columnasGrupo = group.controles.control;
                var idGrupo = "A{0}".format(group.id);
                var panel = $(template.format(idGrupo));

                panel.attr("idEntidadPropiedad", group.idEntidadPropiedad);
                columnsJsonParse(columnasGrupo, panel.find(".panel-body"));

                if (group.atributos && group.atributos.atributo) {
                    var atributosFila = group.atributos.atributo;
                    titulo = Enumerable.From(atributosFila).Where("$.nombre === 'TituloLargo'").Select("$.valor").FirstOrDefault("");
                    mostrarSiempre = Enumerable.From(atributosFila).Any("$.nombre === 'MostrarSiempre' && $.valor == '1'");
                }

                panel.find(".panel-heading > b").text(titulo);
                panelBody.append(panel);
                FormsBuilder.ViewModel.getFlujoSecciones()[group.idEntidadPropiedad] = {};
                FormsBuilder.ViewModel.getFlujoSecciones()[group.idEntidadPropiedad]["EntroSeccion"] = false;

                if (!titulo) {
                    panel.find(".panel-heading:empty").remove();
                }

                if (mostrarSiempre) {
                    panel.addClass("sticky");
                }
            }
        });

        return panelBody.html();
    }

    function titleJsonParse(title) {
        var titleHtml = $("<div></div>");

        if (title.atributos && title.atributos.atributo) {
            var titleText = Enumerable.From(title.atributos.atributo).Where("$.nombre === 'TituloCorto'").Select("$.valor").FirstOrDefault("");
            titleHtml.append("<h2>{0}</h2><br>".format(titleText));
        }

        return titleHtml.html();
    }

    function columnsJsonParse(columns, panelNewDiv) {
        $.each(columns, function (key, column) {

            if (!column.controles) {
                column.controles = { "control": [] };
            } else if (!column.controles.control) {
                column.controles.control = [];
            }

            var childGroups = Enumerable.From(column.controles.control).Where("$.tipoControl== 'Grupo' || $.tipoControl== 'Titulo'").ToArray();
            var childTabs = Enumerable.From(column.controles.control).Where("$.tipoControl== 'Tab'").ToArray();
            //var childGroups = $(column).children('controles').children(GROUP_LAYOUT);

            var containerDiv = $('<div><div class="title-column"></div><div class="bd" data-tipocontenedor="columna"></div></div>');
            if (column.width !== undefined) {
                containerDiv.find(".bd").css({ "width": $(column).attr("width") });
            } else {
                if (columns.length === 1) {
                    containerDiv.find(".bd").css({ "width": "100%" });
                } else {
                    containerDiv.find(".bd").css({ "width": ((98 / columns.length)) + "%" });
                }
            }

            containerDiv.find(".bd").attr("style", containerDiv.find(".bd").attr("style") + " float: left;");

            if (!(column.controles.control instanceof Array)) {
                column.controles.control = [column.controles.control];
            }

            var controlHtml = controlsJsonParse(column);

            containerDiv.find(".bd:first").append(controlHtml);

            if (childGroups.length > 0) {
                var childRecursiveNodes = grupsJsonParse(childGroups);
                containerDiv.find(".bd:first").append(childRecursiveNodes);
            }

            if (childTabs.length > 0) {
                var childRecursiveNodes = tabsJsonParse(childTabs);
                containerDiv.find(".bd:first").append(childRecursiveNodes);
            }

            panelNewDiv.append(containerDiv.html());
        });

        return panelNewDiv;
    }

    function tabsJsonParse(tabs) {
        var entidades = FormsBuilder.XMLForm.getEntidades();
        var template = "<li class='{0}'><a data-toggle='tab' href='#{2}'>{3}</a></li>";
        var width;
        var lista = $("<ul class='col-xs-12 col-sm-12 nav nav-tabs'></ul>");
        var listaOtrasOpciones = $("<ul class='dropdown-menu' data-otros-tabs></ul>");
        var tabOtrasOpciones = $("<li class='dropdown'><a href='#' class='dropdown-toggle' data-toggle='dropdown'>M&aacute;s<span class='caret' style='margin-left: 10px;'></span></a></li>");
        var contenedorTabs = $("<div class='tab-content'></div>");
        var seccion = $("<div></div>");

        $.each(tabs, function (key, tab) {
            var elementoLista;
            var titulo = "";
            var esOpcionMenu = false;
            var entidadTab = Enumerable.From(entidades).Where("$.id == '{0}'".format(tab.idEntidadPropiedad)).FirstOrDefault();
            var propiedadTab = Enumerable.From(entidadTab.propiedades.propiedad).Where("$.id == '{0}'".format(tab.idPropiedad)).FirstOrDefault();
            var columnasGrupo = tab.controles.control;
            var tabClass = key === 0 ? "tab-pane active" : "tab-pane fade";
            var liClass = key === 0 ? "active" : null;
            var tabTemplate = $("<div id='{0}' class='{1}' data-tipocontenedor='tab'></div>".format(tab.id, tabClass));

            if (tab.atributos && tab.atributos.atributo) {
                titulo = Enumerable.From(tab.atributos.atributo).Where("$.nombre === 'TituloCorto'").Select("$.valor").FirstOrDefault("");
                esOpcionMenu = Enumerable.From(tab.atributos.atributo).Any("$.nombre === 'MostrarComoOpcionMenu'");
            } else if (propiedadTab.atributo && propiedadTab.atributos.atributo) {
                titulo = Enumerable.From(propiedadTab.atributos.atributo).Where("$.nombre === 'TituloCorto'").Select("$.valor").FirstOrDefault("");
            }

            elementoLista = $(template.format(liClass, width, tab.id, titulo));
            columnsJsonParse(columnasGrupo, tabTemplate);

            if (esOpcionMenu) {
                listaOtrasOpciones.append(elementoLista);
            } else {
                lista.append(elementoLista);
            }

            contenedorTabs.append(tabTemplate);
        });

        if (listaOtrasOpciones.children("li").length > 0) {
            tabOtrasOpciones.append(listaOtrasOpciones);
            lista.append(tabOtrasOpciones);
        }

        AppDeclaracionesSAT.ajustarAnchoTabs(lista);

        seccion.append(lista);
        seccion.append(contenedorTabs);

        return seccion.html();
    }

    function controlsJsonParse(column) {

        var controlHtml = "";
        $.each(column.controles.control, function (key, control) {
            if (control.controles && control.controles.control && !(Array.isArray(control.controles.control))) {
                control.controles.control = [control.controles.control];
            }

            controlHtml += FormsBuilder.HTMLBuilder.generate(control);
        });

        return controlHtml;
    }
})();