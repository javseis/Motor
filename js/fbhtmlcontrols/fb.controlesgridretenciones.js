/** @module FormsBuilder.Modules */
/**
* Modulo para el render de formularios que crea un contenedor con
* controles que se repiten en forma de grid.
* 
* (c) SAT 2013, Iván González
*/
/*global namespace:false, FormsBuilder:false, SAT: false, AppDeclaracionesSAT:false, ko:false, Base64:false */

"use strict";

(function () {
    namespace("FormsBuilder.Modules", ControlesGridRetenciones, loadedUIControlesGridRetenciones, loadRetenciones, initMassive, deleteRetenciones, actualizarModeloCargasMasivas);

    var counterRowsGrid = 0;
    var applyRulesFuncs = [];

    var MAX_ELEMENTS = 14;
    var MAX_ITEMS = 15;

    function ControlesGridRetenciones(control) {
        var rowNewDiv = $('<div><input type="hidden"><div class="ctrlsGridRetenciones"></div><button type="button" class="btn btn-primary btn-red btnAddCtrlGridRetencionesRow hidden">Agregar</button><div style="clear: both;" /><div class="paginador"></div></div>');
        var panelNewDiv = $('<div><div class="panel"><div class="panel-body"></div></div></div>');

        var controles = $(control).children('controles').children('control[tipoControl="Grupo"]');
        var htmlRow;

        if (controles.length >= 1) {
            var htmlPanel = $('<div><div class="panel"></div></div>');
            htmlPanel.find('div:last').append(FormsBuilder.Parser.groupsParse(controles, panelNewDiv));
            htmlRow = $(htmlPanel.html());
        } else {
            controles = $(control).children('controles').children('control[tipoControl="Columna"]');
            htmlRow = FormsBuilder.Parser.columnsParse(controles, panelNewDiv);
        }

        htmlRow.children('.panel').addClass('panel-pag').prepend('<div class="panel-heading">1 de 1</div>');
        htmlRow.children('.panel').children('.panel-body:last').append('<div style="clear: both;"><button type="button" class="btn btn-primary btn-red btnDelCtrlGridRetencionesRow" style="float: right;">Eliminar</button>');

        var xmlCopy = FormsBuilder.XMLForm.getCopy();
        var controlesFormulario = htmlRow.find('[view-model]');
        var grid = $('<table class="table table-hover tabla-formulariogridedicion" entidad="{0}"></table>'.format($(control).attr('idEntidadPropiedad')));

        var filaHtml = '<tr class="danger">';
        var gridEncabezado = $('<thead><tr></tr></thead>');
        var gridCuerpo = $('<tbody></tbody>');

        $.each(controlesFormulario, function (key, control) {
            $(control).attr('temp-model', $(control).attr('view-model'));
            if ($(control).attr('muestraEnGrid') !== undefined) {
                var viewmodel = $(control).attr('view-model').substring($(control).attr('view-model').indexOf('P') + 1, $(control).attr('view-model').length).split('_')[0];
                var propiedad = $(xmlCopy).find('modeloDatos propiedad[id="{0}"]'.format(viewmodel));

                if (propiedad.length > 0) {
                    var tituloCorto = propiedad.find('atributo[nombre="TituloCorto"]').attr('valor');

                    var gridColumna = $('<th>{0}</th>'.format(tituloCorto));
                    gridEncabezado.find('tr').append(gridColumna);

                    if ($(control).attr('alineacionTexto') === 'izquierda') {
                        filaHtml += '<td style="text-align: left !important;"></td>';
                    } else {
                        filaHtml += '<td></td>';
                    }
                }
            }
        });
        gridEncabezado.find('tr').append($('<th></th>'));

        grid.append(gridEncabezado);
        grid.append(gridCuerpo);
        grid.append('<input class="indexFormularioGrid" type="hidden" /><input class="modeFormularioGrid" type="hidden" /><input class="filaTablaGrid" type="hidden" />');

        filaHtml += '</tr>';

        rowNewDiv.find('.ctrlsGridRetenciones').append(grid);

        rowNewDiv.find('input[type="hidden"]:first').val(htmlRow.html());
        rowNewDiv.find('input.filaTablaGrid').val(filaHtml);
        return rowNewDiv.html();
    }

    function loadedUIControlesGridRetenciones() {
        $('button.btnAddCtrlGridRetencionesRow').on('click', function (event) {
            event = event || window.event;
            if (!isValidGrid(event)) return;

            var xmlCopy = FormsBuilder.XMLForm.getCopy();
            var tmpl = $($(this).parent().find('input[type="hidden"]:first').val());

            $(this).parent().find('.ctrlsGridRetenciones').append(tmpl);

            var panels = $(this).parent().find('.ctrlsGridRetenciones').children('.panel');

            $.each(panels, function (k, panel) {
                $(panel).children('.panel-heading').html('{0} de {1}'.format(k + 1, panels.length));
            });

            var viewModels = $(this).parent().find('.ctrlsGridRetenciones').children('.panel:last').find('[view-model]');

            $.each(viewModels, function (key, ctrlViewModel) {
                $(ctrlViewModel).attr('view-model', $(ctrlViewModel).attr('view-model') + '_' + counterRowsGrid);
                if ($(ctrlViewModel).attr('data-bind') !== undefined) {
                    $(ctrlViewModel).attr('data-bind', $(ctrlViewModel).attr('data-bind') + '_' + counterRowsGrid);
                }
            });

            var entidad;
            var detalleGrid = FormsBuilder.ViewModel.getDetalleGrid();
            if (viewModels.length > 0) {
                entidad = ($(viewModels[0]).attr('view-model').split('P')[0]).replace('E', '');
                if (detalleGrid[entidad] !== undefined) {
                } else {
                    detalleGrid[entidad] = [];
                }

                var fieldsForExprs = FormsBuilder.ViewModel.getFieldsForExprsGrid();
                var objItem = {};
                $.each(viewModels, function (key, ctrlViewModel) {
                    var db_id = $(ctrlViewModel).attr('view-model');
                    objItem[db_id] = ko.observable('');
                    objItem[db_id].subscribe(function (newValue) {

                    });
                    var valuePropiedad = $(xmlCopy).find('modeloDatos').find('propiedad[id="{0}"]'.format(db_id.substring(db_id.indexOf('P') + 1, db_id.length).split('_')[0]));
                    fieldsForExprs['$' + db_id.substring(db_id.indexOf('P') + 1, db_id.length)] = {
                        entidad: entidad,
                        propiedad: db_id.substring(db_id.indexOf('P') + 1, db_id.length),
                        tipoDatos: $(valuePropiedad).attr("tipoDatos")
                    };
                });

                detalleGrid[entidad].push(objItem);

                var panel = $(this).parent().find('.ctrlsGridRetenciones').children('.panel:last')[0];
                ko.applyBindings(detalleGrid[entidad][detalleGrid[entidad].length - 1], panel);

                $(this).parent().find('.ctrlsGridRetenciones').children('.panel').hide();

                // Tabla
                var filaHtml = $(this).parent().find('input.filaTablaGrid').val();

                var tabla = $(this).parent().find('table[entidad="{0}"] tbody'.format(entidad));
                tabla.append('{0}'.format(filaHtml));
                tabla.find('tr').removeClass('danger');

                var keysCounter = 0;
                $.each(viewModels, function (key, ctrlViewModel) {
                    if ($(ctrlViewModel).attr('muestraEnGrid') !== undefined) {
                        if (ctrlViewModel.tagName === 'SELECT') {
                            var vmmodel_tmp = $(ctrlViewModel).attr('temp-model');
                            var propiedad = vmmodel_tmp.substring(vmmodel_tmp.indexOf('P') + 1, vmmodel_tmp.length);

                            var modelo = $(xmlCopy).find('modeloDatos').find('propiedad[id="{0}"]'.format(propiedad));
                            var control = $(xmlCopy).find('formulario').find('control[idPropiedad="{0}"]'.format(propiedad));

                            var catalogo = modelo.find('atributo[nombre="Catalogo"]');
                            var noMostrarEnVacio = control.find('atributo[nombre="SinSeleccionEnGrid"]').length > 0;

                            tabla.find('tr:last > td:eq({0})'.format(keysCounter)).attr('data-bind', 'text: GetTexto({0}, {1}, {2})'.format($(ctrlViewModel).attr('view-model'), catalogo.attr('valor'), noMostrarEnVacio));
                        } else {
                            tabla.find('tr:last > td:eq({0})'.format(keysCounter)).attr('data-bind', "text: " + $(ctrlViewModel).attr('view-model'));
                        }
                        tabla.find('tr:last > td:eq({0})'.format(keysCounter)).attr('td-viewmodel', $(ctrlViewModel).attr('temp-model'));
                        keysCounter++;
                    }
                });

                var filaActiva = $(this).parent().find('tr:last');
                // console.log(filaActiva);

                counterRowsGrid++;

                ko.applyBindings(detalleGrid[entidad][detalleGrid[entidad].length - 1], filaActiva[0]);
            }
        });

        $('button.btnDelCtrlGridRetencionesRow').live('click', function () {
            var ctrlsGrid = $(this).parents().eq(4).find('.ctrlsGrid');

            var actualPanel = $(this).parents().eq(2);
            var viewModel = actualPanel.find('[view-model]:first').attr('view-model');
            var entidad = (viewModel.split('P')[0]).replace('E', '');
            var mainContainer = actualPanel.parents(".bd:first");
            actualPanel.remove();

            var panels = ctrlsGrid.children('.panel');
            var ctrls = ctrlsGrid.find('.panel:last [view-model]');
            var lastOrderTab = ctrlsGrid.find('.panel:first [view-model]:last');
            var ordenTab = (panels.length * ctrls.length) + lastOrderTab.attr('tabindex');

            $.each(ctrls, function (index, ctrl) {
                $(ctrl).attr('tabindex', ordenTab++);
            });

            $.each(panels, function (index, panel) {
                $(panel).children('.panel-heading').html('{0} de {1}'.format(index + 1, panels.length));
            });

            // Se quita para efectos de retenciones
            var detalleGrid = FormsBuilder.ViewModel.getDetalleGrid();
            for (var detalle in detalleGrid[entidad]) {
                for (var detalleItem in detalleGrid[entidad][detalle]) {
                    if (detalleItem === viewModel) {
                        detalleGrid[entidad].splice(detalle, 1);
                        break;
                    }
                }
            }
        });
    }

    function isValidGrid(event) {
        var result = false;
        if (event) {
            var $mainContainer = $(event.target).parents('.panel:first');
            result = $mainContainer.find(".ctrlsGridRetenciones input.sat-val-error").length <= 0;
        }
        return result;
    }

    function loadRetenciones(retenciones, entidad) {
        var panel = $('#htmlOutput .panel[idEntidadPropiedad="{0}"]'.format(entidad));

        panel.find('button.btnDelCtrlGridRetencionesRow').each(function (k, v) { $(v).click(); });

        var btnAdd = panel.find('button.btnAddCtrlGridRetencionesRow:first');

        for (var i = 0; i < retenciones.length; i++) {
            var promise = $.when(btnAdd.click());

            promise.done(function () {
                var detalleDataGrid = FormsBuilder.ViewModel.getDetalleGrid()[entidad];
                var detalle = detalleDataGrid[detalleDataGrid.length - 1];

                var objProps = Object.getOwnPropertyNames(detalle);
                var indice = objProps[0].split('_')[1];
                var retencion = retenciones[i];

                for (var key in retencion) {
                    var propiedad = "E{0}P{1}_{2}".format(entidad, key, indice);
                    if (detalle[propiedad] !== undefined)
                        detalle[propiedad](retencion[key] == null ? '' : retencion[key].replace(/&amp;/g, '&'));


                }
            });
        }
        //if (SAT.Environment.settings('isHydrate') !== true) {
        $('#modalCargaMasiva').modal('hide');
        //}
    }

    //var massiveLoaded = [];
    function initMassive(pages, numElements, entidad, data) {

        var paginador = createPaginator(pages, numElements, entidad);
        funcsPages(paginador, pages, numElements, entidad);

        if (SAT.Environment.settings('actualizacionimporte') === false) {
            $('#htmlOutput .panel[idEntidadPropiedad="{0}"] .cargaMasivaRetenciones.borrar'.format(entidad)).removeAttr("disabled");
        }
        $('#htmlOutput .panel[idEntidadPropiedad="{0}"] .cargaMasivaRetenciones.carga'.format(entidad)).attr("disabled", "disabled");
        
        UpdateData(data);
        paginador.find('a:eq(0)').click();
        paginador.find('a:eq(1)').addClass('pagina-actual');
    }

    function createPaginator(pages, numElements, entidad, paginaActual) {
        var paginaInicial;
        var paginaFinal;

        var elementosIzquierda = false;
        var elementosDerecha = false;
        if (SAT.Environment.settings('isHydrate') !== true) {
            $('#modalCargaMasiva').modal('show');
        }
        if (paginaActual === undefined) {
            paginaInicial = 1;
            paginaFinal = MAX_ELEMENTS;
        } else {
            var paginaDerecha = paginaActual + 9;
            var paginaIzquierda = paginaActual - 9;

            if (paginaIzquierda >= 1 && paginaDerecha <= pages) {
                paginaInicial = paginaIzquierda;
                paginaFinal = paginaDerecha;

                elementosDerecha = paginaDerecha === pages ? false : true;
                elementosIzquierda = paginaIzquierda === 1 ? false : true;
            } else if (paginaIzquierda < 1 && paginaDerecha <= pages) {
                paginaInicial = 1;
                paginaFinal = MAX_ELEMENTS;

                elementosDerecha = true;
            } else if (paginaIzquierda >= 1 && paginaDerecha > pages) {
                paginaInicial = pages - MAX_ELEMENTS;
                paginaFinal = pages;

                elementosIzquierda = true;
            }

            if (pages < MAX_ELEMENTS) {
                paginaInicial = 1;
                paginaFinal = pages;
            }
        }

        var paginas = '';
        paginas += elementosIzquierda ? '<a href="#">Primero</a><span>...</span>' : '<a href="#">Primero</a>';
        for (var i = paginaInicial; i <= paginaFinal; i++) {
            paginas += '<a href="#">{0}</a>'.format(i);
        }
        paginas += elementosDerecha ? '<span>...</span><a href="#">Ultimo</a>' : '<a href="#">Ultimo</a>';

        var paginador = $('#htmlOutput .panel[idEntidadPropiedad="{0}"] .paginador'.format(entidad));
        paginador.attr('pages', pages);
        paginador.attr('numElements', numElements);

        paginador.off('a').on('click');
        paginador.empty();

        paginador.append(paginas);

        return paginador;
    }

    function funcsPages(paginador, pages, numElements, entidad) {
        paginador.find('a').on('click', function () {
            var paginaActual = $(this).html();

            if (paginaActual === 'Primero') {
                paginaActual = "1";
            } else if (paginaActual === 'Ultimo') {
                paginaActual = pages.toString();
            }

            var paginador = createPaginator(pages, numElements, entidad, parseInt(paginaActual));
            funcsPages(paginador, pages, numElements, entidad);

            paginador.find('a').filter(function () {
                return $(this).text() === paginaActual;
            }).addClass('pagina-actual');
            $('#htmlOutput table[entidad="{0}"] tbody'.format(entidad)).empty();
            ko.cleanNode($('#htmlOutput table[entidad="{0}"]'.format(entidad)));

            var rfc;
            var infoProp = FormsBuilder.ViewModel.getFieldsForExprs()['$10'];
            if (infoProp !== undefined) {
                rfc = FormsBuilder.ViewModel.get()[infoProp.entidad]['E{0}P{1}'.format(infoProp.entidad, infoProp.propiedad)]();
            }

            infoProp = FormsBuilder.ViewModel.getFieldsForExprs()['$30'];
            var ejercicio;
            if (infoProp !== undefined) {
                ejercicio = FormsBuilder.ViewModel.get()[infoProp.entidad]['E{0}P{1}'.format(infoProp.entidad, infoProp.propiedad)]();
            }

            var solicitudPagina = {
                tipo: 1, rfc: rfc, entidad: entidad, pagina: paginaActual, ejercicio: ejercicio, numoperacion: AppDeclaracionesSAT.getConfig('readonlynumerooperacion')
            };

            $('#DVINITRETENCIONES').html('');
            $('#DVINITRETENCIONES').html(JSON.stringify(solicitudPagina));

            // Aqui inicia codigo que debe hacer el backend
            // var elementos = [];
            // var pagina = paginaActual;
            // var mulElements = pagina * MAX_ITEMS;
            // var initElemtns = mulElements-MAX_ITEMS;

            // for (var i = initElemtns; i < mulElements; i++) {
            //     elementos.push(window['retenciones'][entidad][i]);
            // }

            // var objRetenciones = {tipo: 1, elementos: elementos, entidad: entidad};
            // $('#DVRETENCIONES').html(JSON.stringify(objRetenciones));
            // Aqui finaliza el codigo que debe hacer el backend
        });
    }

    function deleteRetenciones(data, entidad) {
        $('#htmlOutput table[entidad="{0}"] tbody'.format(entidad)).empty();
        ko.cleanNode($('#htmlOutput table[entidad="{0}"]'.format(entidad)));

        var panel = $('#htmlOutput .panel[idEntidadPropiedad="{0}"]'.format(entidad));

        panel.find('button.btnDelCtrlGridRetencionesRow').each(function (k, v) { $(v).click(); });

        var paginador = $('#htmlOutput .panel[idEntidadPropiedad="{0}"] .paginador'.format(entidad));

        paginador.removeAttr('pages');
        paginador.removeAttr('numElements');

        paginador.empty();

        UpdateData(data);
        if (SAT.Environment.settings('actualizacionimporte') === false) {
            $('#htmlOutput .panel[idEntidadPropiedad="{0}"] .cargaMasivaRetenciones.borrar'.format(entidad)).attr("disabled", "disabled");
        }
        $('#htmlOutput .panel[idEntidadPropiedad="{0}"] .cargaMasivaRetenciones.carga'.format(entidad)).removeAttr("disabled");

        $('#modalCargaMasiva').modal('hide');
    }
    function UpdateData(data) {
        for (var key in data) {
            var infoProp = FormsBuilder.ViewModel.getFieldsForExprs()['${0}'.format(key)];
            FormsBuilder.ViewModel.get()[infoProp.entidad]['E{0}P{1}'.format(infoProp.entidad, infoProp.propiedad)](data[key]);
            fbUtils.applyFormatCurrencyOnElement($('[view-model="E{0}P{1}"]'.format(infoProp.entidad, infoProp.propiedad)));
        }
    }
    function getCgLenQueueRules() {
        return applyRulesFuncs.length;
    }
    function actualizarModeloCargasMasivas() {
        SAT.Environment.settings('massives').forEach(function (entidad) {
            entidad = entidad.substring(1, 5);
            var informacionPropiedad = FormsBuilder.ViewModel.getFieldsForExprs()['$30'];
            var ejercicio = informacionPropiedad !== undefined ? FormsBuilder.ViewModel.get()[informacionPropiedad.entidad]['E{0}P{1}'.format(informacionPropiedad.entidad, informacionPropiedad.propiedad)]() : ejercicio;
            Service.Test.actualizaModeloPaginaMasiva(JSON.stringify({
                tipo: 1, rfc: AppDeclaracionesSAT.getConfig('rfc'), entidad: entidad, pagina: 1, ejercicio: ejercicio, numoperacion: AppDeclaracionesSAT.getConfig('readonlynumerooperacion')
            }));
        });
    }
})();



