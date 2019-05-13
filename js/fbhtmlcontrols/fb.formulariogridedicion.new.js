/** @module FormsBuilder.Modules */
/**
 * Modulo para el render de formularios que crea un contenedor con
 * controles que se repiten en forma de grid.
 * 
 * (c) SAT 2016, Javier Cortés Cruz
 */
/*global namespace:false, FormsBuilder:false, SAT: false, AppDeclaracionesSAT:false, ko:false, Base64:false */

"use strict";

(function () {
    namespace("FormsBuilder.Modules", FormularioGridEdicion, loadedUIFormularioGridEdicion, getModeGrid, getRelacionesGrid, renderFormularioGrid, eliminarElementoGrid,
        ejecutarReglasCalculoGrid, cancelarEdicionGrid, validarDuplicidad, limpiarViewModel);

    var MSJ_HAY_ERRORES = "Por favor corrija los errores del formulario.";
    var MSJ_CAMPOS_VACIOS = "No se capturó ningún dato.";
    var VALOR_SI = "Si";
    var VALOR_NO = "No";
    var PREFIJO_DOLLAR = "$";
    var relacionesGrids = {};
    var mostrarEnGrid = {};
    var totales = {};
    var detalleGridTmp = {};
    var modeGrid;
    var valorFkPadre;

    function FormularioGridEdicion(control) {
        var propiedadRelacionada;
        var controlesFormulario;
        var filtrado = false;
        var pintarEnModal = false;
        var gridTotales;
        var mostrarTotales;
        var ocultarAcciones = false;
        var cargaMasiva;
        var idFormularioGrid = control.id;
        var camposGrid = FormsBuilder.ViewModel.getFieldsForExprsGrid();
        var modeloDatos = FormsBuilder.XMLForm.getEntidades();
        var controles = Enumerable.From(control.controles.control).Where("$.tipoControl == 'Columna'").ToArray();
        var template = $("<div><div class='sat-container-formgridedicion' id='{0}' entidad='{1}' data-tipocontenedor='grid'></div></div>".format(idFormularioGrid, control.idEntidadPropiedad));
        var htmlControl = $('<div><div class="panel panel-default formgrid" style="display: none;"><div class="panel-body"></div></div></div>');
        var divResponsive = $('<div class="table-responsive" style="overflow-y: scroll;"></div>');
        var grid = $('<table class="table table-hover tabla-formulariogridedicion" entidad="{0}" data-table-for="{1}"></table>'.format(control.idEntidadPropiedad, idFormularioGrid));
        var gridEncabezado = $('<thead><tr></tr></thead>');
        var gridCuerpo = $('<tbody data-bind="foreach: array"></tbody>');
        var contenedorControles = htmlControl.find(".panel-body");
        var contenedorBotones = htmlControl;

        if (control.atributos && control.atributos.atributo) {
            var llavePrimaria = Enumerable.From(control.atributos.atributo).Where("$.nombre == 'SinDuplicidad'").FirstOrDefault();
            var mensajeDuplicados = Enumerable.From(control.atributos.atributo).Where("$.nombre == 'MensajeValidacion'").FirstOrDefault();
            mostrarTotales = Enumerable.From(control.atributos.atributo).Where("$.nombre == 'MostrarTotales'").FirstOrDefault();
            propiedadRelacionada = Enumerable.From(control.atributos.atributo).Where("$.nombre == 'PropiedadRelacion'").FirstOrDefault();
            pintarEnModal = Enumerable.From(control.atributos.atributo).Any("$.nombre == 'MostrarEnModal'");
            filtrado = Enumerable.From(control.atributos.atributo).Any("$.nombre == 'Filtrado'");
            ocultarAcciones = Enumerable.From(control.atributos.atributo).Any("$.nombre == 'OcultarAccionesGrid'");
            cargaMasiva = Enumerable.From(control.atributos.atributo).Where("$.nombre == 'CargaMasiva'").FirstOrDefault();

            if (llavePrimaria) {
                template.find('.sat-container-formgridedicion').attr("data-llaveprimaria", llavePrimaria.valor);
            }

            if (mensajeDuplicados) {
                template.find('.sat-container-formgridedicion').attr("data-mensajeduplicados", mensajeDuplicados.valor);
            }
        }

        if (mostrarTotales) {
            totales[control.id] = mostrarTotales.valor.replace(/\s/g, "").split(",");
            gridTotales = $("<tfoot style='display: none;'><tr></tr></tfoot>");
            template.find('.sat-container-formgridedicion').attr('data-totales', true);
        } else {
            template.find('.sat-container-formgridedicion').attr('data-totales', false);
        }

        if (propiedadRelacionada) {
            template.find('.sat-container-formgridedicion').attr('data-propiedadrelacion', propiedadRelacionada.valor);
        }

        if (filtrado) {
            template.find('.sat-container-formgridedicion').attr('data-filtrado', true);
        } else {
            template.find('.sat-container-formgridedicion').attr('data-filtrado', false);
        }

        if (ocultarAcciones) {
            template.find('.sat-container-formgridedicion').attr('data-ocultaracciones', true);
        } else {
            template.find('.sat-container-formgridedicion').attr('data-ocultaracciones', false);
        }

        htmlControl.find('.panel-default').attr('entidad', control.idEntidadPropiedad);

        if (pintarEnModal) {
            var htmlModal = $("<div id='modal-{0}' class='modal fade'><div class='modal-lg' style='margin: 0 auto;'><div class='modal-content'>".format(control.id) +
                "<div class='modal-body'><div class='row' style='padding: 15px;'></div></div><div class='modal-footer'><div class='notify'></div></div></div></div></div>");

            htmlControl.append(htmlModal);
            contenedorControles = htmlModal.find(".row");
            contenedorBotones = htmlModal.find(".notify");
        }

        FormsBuilder.Parser.columnsJsonParse(controles, contenedorControles);
        controlesFormulario = htmlControl.find('[view-model^="E{0}"]'.format(control.idEntidadPropiedad));

        $.each(controlesFormulario, function (key, control) {
            var propiedadControl = fbUtils.getPropiedad($(control).attr('view-model'));
            var entidadControl = fbUtils.getEntidad($(control).attr('view-model'));
            var propiedadJson;
            var tipoDatos;
            var entidades = Enumerable.From(modeloDatos).Where("$.propiedades != null").ToArray();
            var entidadJson = Enumerable.From(entidades).Where("$.id == '{0}'".format(entidadControl)).FirstOrDefault();

            if (entidadJson) {
                propiedadJson = Enumerable.From(entidadJson.propiedades.propiedad).Where("$.id == '{0}'".format(propiedadControl)).FirstOrDefault();
            }

            if (propiedadJson && propiedadJson.tipoDatos) {
                tipoDatos = propiedadJson.tipoDatos;
            }

            camposGrid[PREFIJO_DOLLAR + propiedadControl] = {
                entidad: entidadControl,
                propiedad: propiedadControl,
                tipoDatos: tipoDatos
            };

            $(control).attr('temp-model', $(control).attr('view-model'));

            if ($(control).attr('muestraEnGrid') !== undefined) {

                if (!mostrarEnGrid[idFormularioGrid]) {
                    mostrarEnGrid[idFormularioGrid] = [];
                }

                mostrarEnGrid[idFormularioGrid].push($(control).attr('view-model'));

                if (propiedadJson) {
                    var tituloCorto;
                    var gridColumna;

                    if ($(control).attr('muestraEnGrid') !== '') {
                        tituloCorto = $(control).attr('muestraEnGrid');
                    } else {
                        tituloCorto = Enumerable.From(propiedadJson.atributos.atributo).Where("$.nombre == 'TituloCorto'").FirstOrDefault({ valor: "" }).valor;
                    }

                    gridColumna = $('<th>{0}</th>'.format(tituloCorto));
                    gridEncabezado.find('tr').append(gridColumna);

                    if (gridTotales && gridTotales.length > 0) {
                        gridTotales.find("tr").append("<td columna='grid_{0}_${1}'></td>".format(entidadJson.id, propiedadJson.id));
                    }
                }
            }
        });

        if (!ocultarAcciones) {
            gridEncabezado.find('tr').append($('<th></th>'));
        }

        grid.append(gridEncabezado);
        grid.append(gridCuerpo);

        if (gridTotales && gridTotales.length > 0) {
            if (!ocultarAcciones) {
                gridTotales.find("tr").append("<td></td>");
            }

            gridTotales.find("td:first").css({ "border-left": "1px solid #A3A3A3", "text-align": "left", "font-weight": "bold" }).html("Total");
            grid.append(gridTotales);
        }

        grid.append('<input class="indexFormularioGrid" type="hidden" /><input class="modeFormularioGrid" type="hidden" />');

        htmlControl.prepend('<div><br /><div/>');

        if (!ocultarAcciones) {
            htmlControl.append('<button type="button" class="btn btn-primary btn-red btnNewItem" style="margin-right: 15px;" entidad="{0}">Agregar</button>'.format(control.idEntidadPropiedad));

            if (cargaMasiva && !IsNullOrEmptyWhite(cargaMasiva.valor)) {
                var urlManual = SAT.Environment.settings(cargaMasiva.valor);

                htmlControl.append('<div class="btn cargaMasiva" style="display: inline-block;" entidad="{1}"><label class="btn btn-primary" style="margin-right: 15px;"> Agregar desde archivo <input type="file" id="file-{0}" style="display: none;" name="carga-masiva" entidad="{1}" accept=".txt"></label></div>'.format(control.id, control.idEntidadPropiedad));
                htmlControl.find(".cargaMasiva").append('<a class="ic-help" style="float: none;display: inline-block;" href="{0}" target="_blank"></a>'.format(urlManual));
            }

            contenedorBotones.append('<button type="button" class="btn btn-primary btn-red btnCancelEdit" style="margin-right: 15px; display: none;" entidad="{0}">Cancelar</button>'.format(control.idEntidadPropiedad));
            contenedorBotones.append('<button type="button" class="btn btn-primary btn-red btnAddItem" style="margin-right: 15px; display: none;" entidad="{0}">Guardar</button>'.format(control.idEntidadPropiedad));
        }

        divResponsive.append(grid);
        htmlControl.append(divResponsive);

        template.find('.sat-container-formgridedicion').append(htmlControl.html());

        return template.html();
    }

    function filtrarGrid(idEntidad) {

        console.log(">>>> Inicia -> 'filtrarGrid'");

        var reglasJson = FormsBuilder.XMLForm.getReglas();

        if (reglasJson && reglasJson.reglas && reglasJson.reglas.regla) {
            var reglasFiltro = Enumerable.From(reglasJson.reglas.regla).Where("$.definicion.indexOf('FILTRARGRID') >= 0").ToArray();

            if (reglasFiltro && reglasFiltro.length > 0) {
                var controlesGrid = $(".sat-container-formgridedicion[entidad='{0}'] [view-model^='E{0}']".format(idEntidad));

                controlesGrid.each(function () {
                    var controlGrid = $(this);
                    var propiedad = fbUtils.getPropiedad(controlGrid.attr("view-model"));
                    var reglaFiltro = Enumerable.From(reglasFiltro).Where("$.idPropiedadAsociada.indexOf('{0}') >= 0".format(propiedad)).FirstOrDefault();

                    if (reglaFiltro) {
                        FormsBuilder.ViewModel.Visual(reglaFiltro);
                    }
                });
            }
        }

        console.log(">>>> Termina -> 'filtrarGrid'");
    }

    function pintarFilasGrid(idEntidad, registros) {

        console.log(">>>> pintarFilasGrid()");

        var grids = $(".sat-container-formgridedicion[entidad='{0}']".format(idEntidad));

        grids.each(function () {
            var grid = $(this);
            var table = $("table[entidad={0}][data-table-for='{1}']".format(idEntidad, grid.attr("id")));
            var propiedadesEntidad = Enumerable.From(FormsBuilder.XMLForm.getEntidades()).Where("$.id == '{0}'".format(idEntidad)).SelectMany("$.propiedades.propiedad").ToArray();
            var ocultarAcciones = grid.attr("data-ocultaracciones") === "true";

            table.find("th.columna-error").remove();
            table.find("tbody tr").remove();

            if (registros && registros.length > 0) {
                var acciones = "<td style='width: 80px'><button type='button' class='btn-link btnEditFormularioGridEdicionRow' style='border: 0; padding: 0; margin: 0 5px;' row={0}><i class='icon icon-edit size20'></i></button><button type='button' class='btn-link btnDeleteFormularioGridEdicionRow' style='border: 0; padding: 0; margin: 0 5px;' row={0}><i class='icon icon-trash size20'></i></button></td>";
                var hayRegistrosConError = Enumerable.From(registros).Any("$.error");

                if (hayRegistrosConError === true) {
                    table.find("thead tr").append("<th class='columna-error'></th>");
                }

                for (var i = 0; i < registros.length; i++) {
                    var elemento = registros[i];
                    var fila = $("<tr></tr>");

                    for (var j = 0; j < mostrarEnGrid[grid.attr("id")].length; j++) {
                        var campoMostrar = mostrarEnGrid[grid.attr("id")][j];
                        var propiedad = fbUtils.getPropiedad(campoMostrar);

                        if (elemento[campoMostrar] !== undefined) {
                            var propiedadJson = Enumerable.From(propiedadesEntidad).Where("$.id == '{0}'".format(propiedad)).FirstOrDefault();
                            var valorCelda = elemento[campoMostrar];
                            var catalogo = Enumerable.From(propiedadJson.atributos.atributo).Where("$.nombre === 'Catalogo'").Select("$.valor").FirstOrDefault();

                            if (catalogo) {
                                valorCelda = FormsBuilder.Catalogs.getTextByValue(catalogo, valorCelda);
                            }

                            fila.append("<td columna='grid_{0}_${1}'>{2}</td>".format(idEntidad, propiedad, valorCelda));

                            if (propiedadJson && propiedadJson.tipoDatos && propiedadJson.tipoDatos === "Numerico") {
                                var decimales = $("[view-model='{0}'][mostrarDecimales]".format(campoMostrar)).attr("mostrarDecimales");
                                var format = FormsBuilder.Utils.getFormatCurrency(decimales);
                                fila.find("td:last").formatCurrency(format);
                            }
                        }
                    }

                    if (!ocultarAcciones) {
                        fila.append(acciones.format(elemento.index));

                        if (SAT.Environment.settings("isProposal") === true) {
                            fila.find("button.btnDeleteFormularioGridEdicionRow").attr("disabled", "disabled");
                        }
                    }

                    if (elemento.error != undefined) {
                        fila.append("<td class='columna-error'><a class='registro-error' href='#'><i class='icon icon-warning-fa error'></i></a></td>");
                    } else if (hayRegistrosConError === true) {
                        fila.append("<td class='columna-error'></td>");
                    }

                    table.find("tbody").append(fila);
                }

                table.find(".btnEditFormularioGridEdicionRow").click(function (event) {
                    var indiceDetalle = parseInt($(this).attr("row"));
                    editarElementoGrid(idEntidad, indiceDetalle);
                });
                table.find(".btnDeleteFormularioGridEdicionRow").click(function (event) {
                    var indiceEliminar = parseInt($(this).attr("row"));
                    eliminarElementoGrid(idEntidad, indiceEliminar);
                });

                table.find(".btnEditFormularioGridEdicionRow").tooltip({ title: "Editar", trigger: "hover focus" });
                table.find(".btnDeleteFormularioGridEdicionRow").tooltip({ title: "Eliminar", trigger: "hover focus" });
                table.find(".registro-error").tooltip({ title: "Existen errores en el registro", trigger: "hover focus" });

                if (SAT.Environment.settings("isProposal") === true || SAT.Environment.settings("acceptProposal") === true) {
                    grid.find("button.btnAddItem, button.btnNewItem, .cargaMasiva, .cargaMasiva > a, input[type='file'], button.btnDeleteFormularioGridEdicionRow").attr("disabled", "disabled");
                }
            }
        });
    }

    function editarElementoGrid(idEntidad, indice) {
        var viewModelEntidad = FormsBuilder.ViewModel.get()[idEntidad];
        var detalleGrid = FormsBuilder.ViewModel.getDetalleGrid()[idEntidad];
        var grid = $(".sat-container-formgridedicion[entidad='{0}']".format(idEntidad));
        var gridHijo = grid.find(".sat-container-formgridedicion");
        var modal = grid.children(".modal");
        var tabs = grid.find("a[data-toggle='tab']").filter(function () { return $(this).parent().css("display") == undefined || $(this).parent().css("display") == "block" });

        var viewModelElemento = $.extend(true, {}, detalleGrid[indice]);

        var obligatorios = grid.find("[data-obligatorio]");
        obligatorios.addClass("sat-obligatorio");

        if (gridHijo.length > 0) {
            var idEntidadHijo = gridHijo.attr("entidad");
            var detalleGridHijo = FormsBuilder.ViewModel.getDetalleGrid()[idEntidadHijo];

            if (!detalleGridHijo) {
                detalleGridHijo = [];
            }

            detalleGridTmp[idEntidadHijo] = JSON.parse(JSON.stringify(detalleGridHijo));
        }

        detalleGrid[indice]["editando"] = true;

        for (var i = 0; i < detalleGrid.length; i++) {
            if (i != indice) {
                var detalle = detalleGrid[i];
                delete detalle.editando;
            }
        }

        SAT.Environment.setSetting('modifyingGridVm', true);

        for (var key in viewModelEntidad) {
            var control = $(".sat-container-formgridedicion[entidad='{0}'] [view-model='{1}']".format(idEntidad, key));

            if (control.length > 0) {
                var nuevoValor = fbUtils.desSanitizarValor(viewModelElemento[key]);
                var idPropiedad = fbUtils.getPropiedad(key);

                if (nuevoValor === VALOR_SI) {
                    nuevoValor = true;
                }

                if (nuevoValor === VALOR_NO) {
                    nuevoValor = false;
                }

                viewModelEntidad[key](nuevoValor);

                var entidadCombo = Enumerable.From(FormsBuilder.XMLForm.getEntidades()).Where("$.id == {0}".format(idEntidad)).FirstOrDefault();
                var atributoCombo = Enumerable.From(entidadCombo.propiedades.propiedad).Where("$.id == '{0}'".format(idPropiedad)).FirstOrDefault();
                if (atributoCombo != undefined) {
                    var esCatalogoPadre = Enumerable.From(atributoCombo.atributos.atributo).Where("$.nombre == 'EsCatalogoPadre'").FirstOrDefault();
                    if (esCatalogoPadre != undefined) {
                        control.trigger("change");
                    }
                }

                formatoMoneda($("[view-model='{0}']".format(key)), idEntidad, idPropiedad);
            }
        }

        SAT.Environment.setSetting('modifyingGridVm', false);

        if (gridHijo.length > 0) {
            var fkPadre = gridHijo.attr("data-propiedadrelacion");
            var db_id_padre = "E{0}P{1}".format(idEntidad, fkPadre);
            valorFkPadre = grid.find("[view-model='{0}']".format(db_id_padre)).val();
        }

        if (tabs.length > 0) {
            tabs.first().click();
        }

        if (modal.length > 0) {
            modal.modal({ backdrop: "static", keyboard: false });
            $("button.btnAddItem[entidad='{0}'], button.btnCancelEdit[entidad='{0}']".format(idEntidad)).show();
        } else {
            $("button.btnNewItem[entidad='{0}'], .cargaMasiva[entidad='{0}']".format(idEntidad)).hide();
            $("div.formgrid[entidad='{0}'], button.btnAddItem[entidad='{0}'], button.btnCancelEdit[entidad='{0}']".format(idEntidad)).show();
        }

        $("button.btnAddItem[entidad='{0}']".format(idEntidad)).attr("editar", indice);
    }

    function eliminarElementoGrid(idEntidad, indice) {
        var formularioGrid = $(".sat-container-formgridedicion[entidad='{0}']".format(idEntidad));
        var filtrado = formularioGrid.attr("data-filtrado") === "true";
        var detalleGrid = FormsBuilder.ViewModel.getDetalleGrid()[idEntidad];
        var registroEliminar = detalleGrid[indice];

        console.log("eliminarElementoGrid -> " + indice);

        detalleGrid.splice(indice, 1);

        if (filtrado) {
            filtrarGrid(idEntidad);
        } else {
            var gridHijo = formularioGrid.find(".sat-container-formgridedicion");

            if (gridHijo.length > 0) {
                var entidadHijo = gridHijo.attr("entidad");
                var propiedadRelacionPadre = gridHijo.attr("data-propiedadrelacion");
                var propiedadRelacionHijo = formularioGrid.attr("data-propiedadrelacion");
                var db_id_padre = "E{0}P{1}".format(idEntidad, propiedadRelacionPadre);
                var db_id_hijo = "E{0}P{1}".format(entidadHijo, propiedadRelacionHijo);
                var detalleHijo = FormsBuilder.ViewModel.getDetalleGrid()[entidadHijo];

                detalleHijo = Enumerable.From(detalleHijo).Where(function (detalle) {
                    return detalle[db_id_hijo] != registroEliminar[db_id_padre];
                }).ToArray();

                FormsBuilder.ViewModel.setDetalleGridEntidad(entidadHijo, detalleHijo);
            }

            renderFormularioGrid(idEntidad, null, true);
        }

        limpiarViewModel(idEntidad);
        setTimeout(function () {
            quitarErrores(idEntidad);
        }, 100);

        $("button.btnAddItem[entidad='{0}']".format(idEntidad)).removeAttr("editar");
    }

    function evtEliminarElementoGrid(idEntidad) {
        $("table[entidad={0}] .btnDeleteFormularioGridEdicionRow:last".format(idEntidad)).click(function (event) {
            var indiceDetalle = parseInt($(this).attr("row"));
            eliminarElementoGrid(idEntidad, indiceDetalle);
        });
    }

    function loadedUIFormularioGridEdicion() {
        var grids = $(".sat-container-formgridedicion");

        $("button.btnNewItem").click(function (event) {
            var idEntidad = $(this).attr("entidad");
            var grid = $(".sat-container-formgridedicion[entidad='{0}']".format(idEntidad));
            var gridHijo = grid.find(".sat-container-formgridedicion");
            var modal = grid.children(".modal");
            var obligatorios = grid.find("[data-obligatorio]");
            var tabs = grid.find("a[data-toggle='tab']").filter(function () { return $(this).parent().css("display") == undefined || $(this).parent().css("display") == "block" });

            valorFkPadre = null;

            if (gridHijo.length > 0) {
                var idEntidadHijo = gridHijo.attr("entidad");
                var detalleGridHijo = FormsBuilder.ViewModel.getDetalleGrid()[idEntidadHijo];

                if (!detalleGridHijo) {
                    detalleGridHijo = [];
                }

                detalleGridTmp[idEntidadHijo] = JSON.parse(JSON.stringify(detalleGridHijo));
            }

            $("button.btnAddItem[entidad='{0}']".format(idEntidad)).removeAttr("editar");

            obligatorios.addClass("sat-obligatorio");

            if (tabs.length > 0) {
                tabs.first().click();
            }

            if (modal.length > 0) {
                modal.modal({ backdrop: "static", keyboard: false });
                $("button.btnAddItem[entidad='{0}'], button.btnCancelEdit[entidad='{0}']".format(idEntidad)).show();
            } else {
                $("div.formgrid[entidad='{0}'], button.btnAddItem[entidad='{0}'], button.btnCancelEdit[entidad='{0}']".format(idEntidad)).show();
                $(this).hide();
                $(".cargaMasiva[entidad='{0}']".format(idEntidad)).hide();
            }
        });

        $("button.btnAddItem").click(function (event) {
            var errores;
            var boton = $(this);
            var idEntidad = boton.attr("entidad");
            var formularioGrid = $(".sat-container-formgridedicion[entidad='{0}']".format(idEntidad));
            var esGridHijo = formularioGrid.parents(".sat-container-formgridedicion").length > 0;
            var gridHijo = formularioGrid.find(".sat-container-formgridedicion");
            var filtrado = formularioGrid.attr("data-filtrado") === "true";
            var modal = formularioGrid.children(".modal");
            var llavePrimaria = formularioGrid.attr("data-llaveprimaria");

            boton.attr("disabled", "disabled");

            validarCamposObligatorios(idEntidad);
            setTimeout(function () {
                errores = formularioGrid.find("i.icon-warning-sign").length;

                if (errores === 0) {
                    var entidadViewModel = FormsBuilder.ViewModel.get()[idEntidad];
                    var hayControlesVacios = validarControlesVacios(idEntidad);
                    var esDuplicado = false;

                    if (llavePrimaria) {
                        esDuplicado = validarDuplicidad(llavePrimaria, idEntidad, entidadViewModel, true);
                    }

                    if (!hayControlesVacios && !esDuplicado) {
                        var registroEditar = boton.attr("editar");
                        var viewModel = {};
                        var detalleGrid = FormsBuilder.ViewModel.getDetalleGrid();

                        if (!detalleGrid[idEntidad]) {
                            detalleGrid[idEntidad] = [];
                        }

                        for (var key in entidadViewModel) {
                            var valorPropiedad = entidadViewModel[key]();

                            if (valorPropiedad === true) {
                                valorPropiedad = VALOR_SI
                            }

                            if (valorPropiedad === false) {
                                valorPropiedad = VALOR_NO;
                            }

                            viewModel[key] = fbUtils.sanitizarValor(valorPropiedad);
                        }

                        if (esGridHijo) {
                            viewModel["temporal"] = true;
                        } else if (gridHijo.length > 0) {
                            var idEntidadHijo = gridHijo.attr("entidad");
                            var fkHijo = formularioGrid.attr("data-propiedadrelacion");
                            var fkPadre = gridHijo.attr("data-propiedadrelacion");
                            var db_id_padre = "E{0}P{1}".format(idEntidad, fkPadre);
                            var fkPadreValor = formularioGrid.find("[view-model='{0}']".format(db_id_padre)).val();
                            confirmarCambios(idEntidadHijo, fkHijo, fkPadreValor);
                        }

                        if (registroEditar) {
                            delete viewModel.error;
                            detalleGrid[idEntidad][registroEditar] = viewModel;
                            boton.removeAttr("editar");
                        } else {
                            detalleGrid[idEntidad].push(viewModel);
                        }

                        if (filtrado) {
                            filtrarGrid(idEntidad);
                        } else {
                            crearIndiceElementos(detalleGrid[idEntidad]);
                            renderFormularioGrid(idEntidad, ORIGEN_DATOS_GRID.NORMAL, true);
                        }
                    }

                    limpiarViewModel(idEntidad);
                    setTimeout(function () {
                        quitarErrores(idEntidad);
                    }, 100);

                    if (modal.length > 0) {
                        modal.modal("hide");
                    } else {
                        $("div.formgrid[entidad='{0}'], button.btnAddItem[entidad='{0}'], button.btnCancelEdit[entidad='{0}']".format(idEntidad)).hide();
                        $("button.btnNewItem[entidad='{0}'], .cargaMasiva[entidad='{0}']".format(idEntidad)).show();
                    }
                } else {
                    fbUtils.mostrarMensajeError(MSJ_HAY_ERRORES);
                }

                boton.removeAttr("disabled");
            }, 100);
        });

        $("button.btnCancelEdit").click(function (event) {
            var idEntidad = $(this).attr("entidad");
            cancelarEdicionGrid(idEntidad);
        });

        $("input[type='file'][entidad]").change(function (event) {
            console.log(">>>>input.change()");

            var inputFile = this;

            if (this.files.length > 0) {
                var idEntidad = $(inputFile).attr("entidad");
                var archivo = inputFile.files[0];
                var llavePrimaria = $(inputFile).parents(".sat-container-formgridedicion").eq(0).attr("data-llaveprimaria");

                $("#modalCargandoArchivo").unbind("shown.bs.modal");
                $("#modalCargandoArchivo").on("shown.bs.modal", function () {
                    FormsBuilder.CargaMasiva.cargarArchivo(idEntidad, archivo, llavePrimaria);
                });
                $("#modalCargandoArchivo").modal("show");

                inputFile.value = "";
            }
        });

        if (grids.length > 0) {
            grids.each(function () {
                var grid = $(this);
                var gridHijo = grid.find(".sat-container-formgridedicion");
                var idEntidad = grid.attr("entidad");

                if (gridHijo.length > 0) {
                    var fkPadre = gridHijo.attr("data-propiedadrelacion");
                    var db_id_padre = "E{0}P{1}".format(idEntidad, fkPadre);
                    grid.find("[view-model='{0}']".format(db_id_padre)).change(function () {
                        var fkHijo = grid.attr("data-propiedadrelacion");
                        var nuevoFk = $(this).val();
                        var idEntidadHijo = gridHijo.attr("entidad");
                        actualizarFk(idEntidadHijo, fkHijo, valorFkPadre, nuevoFk);
                        valorFkPadre = $(this).val();
                    });

                }
            });
        }
    }

    function cancelarEdicionGrid(idEntidad) {
        var grid = $(".sat-container-formgridedicion[entidad='{0}']".format(idEntidad));
        var gridHijo = grid.find(".sat-container-formgridedicion");
        var modal = grid.children(".modal");
        var registroEditar = $("button.btnAddItem[entidad='{0}']".format(idEntidad)).attr("editar");

        limpiarViewModel(idEntidad);
        setTimeout(function () {
            quitarErrores(idEntidad);
        }, 100);

        if (modal.length > 0) {
            modal.modal("hide");
        } else {
            $("div.formgrid[entidad='{0}'], button.btnAddItem[entidad='{0}'], button.btnCancelEdit[entidad='{0}']".format(idEntidad)).hide();
            $("button.btnNewItem[entidad='{0}'], .cargaMasiva[entidad='{0}']".format(idEntidad)).show();
        }

        if (registroEditar) {
            var detalleGrid = FormsBuilder.ViewModel.getDetalleGrid()[idEntidad][registroEditar];

            delete detalleGrid.editando;
        }

        if (gridHijo.length > 0) {
            var idEntidadHijo = gridHijo.attr("entidad");
            var detalleGridHijo = JSON.parse(JSON.stringify(detalleGridTmp[idEntidadHijo]));
            revertirCambios(idEntidadHijo, detalleGridHijo);
            detalleGridTmp[idEntidadHijo] = null;
        }

        ejecutarReglasCalculoGrid(idEntidad);
    }

    function limpiarViewModel(idEntidad) {
        setTimeout(function () {
            var entidadViewModel = FormsBuilder.ViewModel.get()[idEntidad];

            SAT.Environment.setSetting('modifyingGridVm', true);
            SAT.Environment.setSetting("runRulesGrid", false);

            for (var key in entidadViewModel) {
                var control = $(".sat-container-formgridedicion[entidad='{0}'] [view-model='{1}']".format(idEntidad, key));

                if (control.length > 0) {
                    var propiedad = fbUtils.getPropiedad(key);
                    entidadViewModel[key]("");
                    window[PREFIJO_DOLLAR + propiedad] = "";
                }
            }

            SAT.Environment.setSetting("runRulesGrid", true);
            SAT.Environment.setSetting('modifyingGridVm', false);
        }, 100);
    }

    function quitarErrores(idEntidad) {
        var grid = $(".sat-container-formgridedicion[entidad='{0}']".format(idEntidad));

        grid.find(".alert").removeClass("alert");
        grid.find("i[vm].icon-warning-sign").remove();

        FormsBuilder.ViewModel.setBadgeCount(grid);
    }

    function ejecutarReglasCalculoGrid(idEntidad) {
        var reglas = FormsBuilder.XMLForm.getReglasEjecutarPosterior();
        var camposGrid = FormsBuilder.ViewModel.getFieldsForExprsGrid();

        for (var i = 0; i < reglas.length; i++) {
            var regla = reglas[i];
            var propiedadesAsociadas = regla.idPropiedadAsociada.split(",");

            for (var j = 0; j < propiedadesAsociadas.length; j++) {
                var propiedadAsociada = propiedadesAsociadas[j].trim();
                var campoGrid = camposGrid[PREFIJO_DOLLAR + propiedadAsociada];
                if (campoGrid) {
                    if (campoGrid.entidad == idEntidad) {
                        FormsBuilder.ViewModel.Calculo(regla);
                        break;
                    }
                }
            }
        }
    }

    function validarControlesVacios(idEntidad) {
        var grid = $(".sat-container-formgridedicion[entidad='{0}']".format(idEntidad));
        var controles = grid.find("input, select").not("input[type='file'],input[type='hidden']");
        var hayControlesVacios = true;

        controles.each(function () {
            var control = $(this);
            var tag = control[0].tagName;
            var valor = control.val();

            if ((tag === "SELECT" && (!IsNullOrEmptyWhite(valor) && valor !== "0")) ||
                (tag === "INPUT" && !IsNullOrEmptyWhite(valor))) {

                hayControlesVacios = false;
                return false;
            }
        });

        if (hayControlesVacios) {
            fbUtils.mostrarMensajeError(MSJ_CAMPOS_VACIOS);
        }

        return hayControlesVacios;
    }

    function validarViewModelEntidad(viewModelEntidad) {
        var noEsNulo = false;
        for (var propiedad in viewModelEntidad) {
            var validar = viewModelEntidad[propiedad]();
            if (validar) {
                noEsNulo = true;
                break;
            }
        }

        return noEsNulo;
    }

    function validarCamposObligatorios(idEntidad) {
        var obligatorios = $(".sat-container-formgridedicion[entidad='{0}'] [data-obligatorio]".format(idEntidad));
        var reglas = FormsBuilder.XMLForm.getReglas()["reglas"]["regla"];

        obligatorios.each(function () {
            var obligatorio = $(this);
            var db_id = obligatorio.attr("view-model");
            var propiedadObligatorio = fbUtils.getPropiedad(db_id);
            var reglasObligatorio = Enumerable.From(reglas).Where("$.idEntidad == '{0}' && $.idPropiedadAsociada == '{1}' && $.tipoRegla === 'Validacion'".format(idEntidad, propiedadObligatorio)).ToArray();

            if (reglasObligatorio.length > 0) {
                for (var i = 0; i < reglasObligatorio.length; i++) {
                    var regla = reglasObligatorio[i];
                    if (!regla.mensajeErrorEnDialogo || regla.mensajeErrorEnDialogo != 1) {
                        FormsBuilder.ViewModel.Validacion(db_id, regla);
                    }
                }
            }
        });

    }

    function validarDuplicidad(llavePrimaria, idEntidad, viewModel, mostrarMensaje) {
        var esDuplicado = true;
        var detalleGrid = Enumerable.From(FormsBuilder.ViewModel.getDetalleGrid()[idEntidad]).Where("$.editando === undefined").ToArray();

        if (detalleGrid.length > 0) {
            var propiedadesLlave = llavePrimaria.split(",");
            var expresion = "";

            for (var i = 0; i < propiedadesLlave.length; i++) {
                var propiedadLlave = propiedadesLlave[i].trim();
                var entidadPropiedad = "E{0}P{1}".format(idEntidad, propiedadLlave);

                expresion = expresion.concat("$.", entidadPropiedad, " == '", viewModel[entidadPropiedad]() || "", "'");

                if (i < (propiedadesLlave.length - 1)) {
                    expresion = expresion.concat(" && ");
                }
            }

            esDuplicado = Enumerable.From(detalleGrid).Any(expresion);
        } else {
            esDuplicado = false;
        }

        if (esDuplicado && mostrarMensaje === true) {
            var mensaje = $(".sat-container-formgridedicion[entidad='{0}']".format(idEntidad)).attr("data-mensajeduplicados");

            fbUtils.mostrarMensajeError(mensaje);
        }

        return esDuplicado;
    }

    function formatoMoneda(elemento, idEntidad, idPropiedad) {
        var entidadJson = Enumerable.From(FormsBuilder.XMLForm.getEntidades()).Where("$.id == '{0}'".format(idEntidad)).FirstOrDefault();
        var propiedadJson = Enumerable.From(entidadJson.propiedades.propiedad).Where("$.id == '{0}'".format(idPropiedad)).FirstOrDefault();
        var tipoDato = propiedadJson.tipoDatos;

        if (tipoDato === "Numerico") {
            var decimales = elemento.attr("mostrarDecimales");
            var formato = fbUtils.getFormatCurrency(decimales);
            elemento.formatCurrency(formato);
        }
    }

    function pintarTotales(idEntidad) {
        var grids = $(".sat-container-formgridedicion[entidad='{0}']".format(idEntidad));

        grids.each(function () {
            var registros;
            var grid = $(this);
            var filtrado = grid.attr("data-filtrado") === "true";

            if (filtrado) {
                registros = obtenerDetalleGrid(idEntidad, ORIGEN_DATOS_GRID.FILTRADO).length;
            } else {
                registros = obtenerDetalleGrid(idEntidad, ORIGEN_DATOS_GRID.NORMAL).length;
            }

            if (registros >= 2) {
                if (grid.attr("data-totales") && grid.attr("data-totales") === "true") {
                    var propiedadesTotal = totales[grid.attr("id")];
                    var tipoSuma = ORIGEN_DATOS_GRID.NORMAL;

                    if (filtrado) {
                        tipoSuma = ORIGEN_DATOS_GRID.FILTRADO;
                    }

                    if (propiedadesTotal && propiedadesTotal.length > 0) {
                        for (var i = 0; i < propiedadesTotal.length; i++) {
                            var propiedadTotal = propiedadesTotal[i];
                            var suma = sumaRegistrosGrid(tipoSuma, idEntidad, propiedadTotal);
                            var celda = grid.find("tfoot>tr>td[columna='grid_{0}_${1}']".format(idEntidad, propiedadTotal));

                            if (celda.length > 0) {
                                var decimales = $("[view-model='E{0}P{1}'][mostrarDecimales]".format(idEntidad, propiedadTotal)).attr("mostrarDecimales");
                                var format = FormsBuilder.Utils.getFormatCurrency(decimales);
                                celda.html(suma);
                                celda.formatCurrency(format);
                            }
                        }

                        grid.find("tfoot").show();
                    }
                }
            } else {
                grid.find("tfoot").hide();
            }
        });
    }

    function getModeGrid() {
        return modeGrid;
    }

    function getRelacionesGrid() {
        return relacionesGrids;
    }

    /*  ACCIONES GRID HIJO  */

    function confirmarCambios(idEntidad, fk, fkValor) {
        var detalleGrid = FormsBuilder.ViewModel.getDetalleGrid()[idEntidad];

        if (detalleGrid && fk && fkValor) {
            for (var i = 0; i < detalleGrid.length; i++) {
                var detalle = detalleGrid[i];
                var db_id = "E{0}P{1}".format(idEntidad, fk);
                if (detalle[db_id] == fkValor) {
                    delete detalle.temporal;
                }
            }

            detalleGridTmp[idEntidad] = null;
            valorFkPadre = null;
        }
    }

    function revertirCambios(idEntidad, detalleAnterior) {
        if (idEntidad) {
            detalleAnterior = Enumerable.From(detalleAnterior).Where("$.temporal === undefined").ToArray();
            FormsBuilder.ViewModel.setDetalleGridEntidad(idEntidad, detalleAnterior);

            renderFormularioGrid(idEntidad);
        }
    }

    function actualizarFk(idEntidad, propiedadFk, valorFkBuscar, valorNuevoFk) {
        if (idEntidad && propiedadFk && valorFkBuscar) {
            var detalleGridVm = FormsBuilder.ViewModel.getDetalleGrid()[idEntidad];
            var db_id_fk = "E{0}P{1}".format(idEntidad, propiedadFk);

            if (detalleGridVm && (!detalleGridTmp[idEntidad] || detalleGridTmp[idEntidad].length !== detalleGridVm.length)) {
                detalleGridTmp[idEntidad] = JSON.parse(JSON.stringify(detalleGridVm));
            }

            if (detalleGridTmp[idEntidad]) {
                var detalleGrid = JSON.parse(JSON.stringify(detalleGridTmp[idEntidad]));
                for (var i = 0; i < detalleGrid.length; i++) {
                    var detalle = detalleGrid[i];
                    if (detalle[db_id_fk] == valorFkBuscar) {
                        detalle[db_id_fk] = valorNuevoFk;
                    }
                }

                FormsBuilder.ViewModel.setDetalleGridEntidad(idEntidad, detalleGrid);
                renderFormularioGrid(idEntidad);
            }
        }
    }

    function sumaRegistrosGrid(tipoSuma, idEntidad, idPropiedadSumar) {
        var suma = 0;

        if (tipoSuma && idEntidad && idPropiedadSumar) {
            var db_id = "E{0}P{1}".format(idEntidad, idPropiedadSumar);
            var datos = obtenerDetalleGrid(idEntidad, tipoSuma);

            if (datos.length > 0) {
                for (var i = 0; i < datos.length; i++) {
                    var detalleFila = datos[i];
                    if (!detalleFila["editando"] && detalleFila[db_id]) {
                        var value = parseFloat(detalleFila[db_id]);
                        if (!isNaN(value)) {
                            suma += value;
                        }
                    }
                }
            }
        }

        return suma;
    }

    function renderFormularioGrid(idEntidad, origen, ejecutarReglasCalculo) {
        if (idEntidad) {
            var limiteRegistros = AppDeclaracionesSAT.getConfig("limiteRegistrosGrid");
            var grid = $(".sat-container-formgridedicion[entidad='{0}']".format(idEntidad));
            var detalleGridOriginal = obtenerDetalleGrid(idEntidad, ORIGEN_DATOS_GRID.NORMAL);
            var detalleGrid = obtenerDetalleGrid(idEntidad, origen || ORIGEN_DATOS_GRID.NORMAL);

            if (detalleGridOriginal) {
                crearIndiceElementos(detalleGridOriginal);
            }

            if (detalleGrid) {
                if (detalleGrid.length > limiteRegistros) {
                    FormsBuilder.Paginacion.crearPaginador(idEntidad, detalleGrid.length, grid);
                    FormsBuilder.Paginacion.paginar(idEntidad, detalleGrid, 1, limiteRegistros);
                    detalleGrid = FormsBuilder.ViewModel.getDetalleGridPaginado()[idEntidad];
                } else if (origen !== ORIGEN_DATOS_GRID.PAGINADO) {
                    grid.find("ul.pagination").remove();
                }

                pintarFilasGrid(idEntidad, detalleGrid);
                pintarTotales(idEntidad);

                if (ejecutarReglasCalculo === true) {
                    ejecutarReglasCalculoGrid(idEntidad);
                }
            }
        }
    }

    function obtenerDetalleGrid(idEntidad, origen) {
        var detalle;

        switch (origen) {
            case ORIGEN_DATOS_GRID.NORMAL:
                detalle = FormsBuilder.ViewModel.getDetalleGrid()[idEntidad];
                break;
            case ORIGEN_DATOS_GRID.FILTRADO:
                detalle = FormsBuilder.ViewModel.getDetalleGridFiltrado()[idEntidad];
                break;
            case ORIGEN_DATOS_GRID.PAGINADO:
                detalle = FormsBuilder.ViewModel.getDetalleGridPaginado()[idEntidad];
                break;
        }

        if (!detalle) {
            detalle = [];
        }

        return detalle;
    }

    function crearIndiceElementos(array) {
        if (array.length > 0) {
            array.forEach(function (elemento, indice) {
                if (typeof elemento === "object") {
                    elemento.index = indice;
                }
            });
        }
    }
})();