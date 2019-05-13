/** @module FormsBuilder.Modules */
/**
 * Control para clasificar CFDI
 * 
 * (c) SAT 2016, Mauricio Cortez
 */
/*global namespace:false, FormsBuilder:false, SAT: false, AppDeclaracionesSAT:false, ko:false, Base64:false */

"use strict";

(function() {
    namespace("FormsBuilder.Modules", Clasificador, loadedClasificadorUI, ejecutarReglasCalculo, updateCreateCfdi, verifyProposal, render, getCfdis);
    var AVISO_SIN_CLASIFICACION = "Estas facturas no fueron identificadas por el SAT como deducciones personales, puedes revisarlas y si cumplen con las disposiciones fiscales vigentes, clasifícalas como tales.";
    var AVISO_DED_CLASIFICADAS = "A continuación, se muestran las facturas que el SAT tiene identificadas como posibles deducciones personales, favor de verificarlas antes de enviar tu declaración.";
    var MSJ_HAY_ERRORES = "Por favor corrija los errores del formulario.";
    var MSJ_CAMPOS_VACIOS = "No se capturó ningún dato.";
    var VALOR_SI = "Si";
    var VALOR_NO = "No";
    var PREFIJO_DOLLAR = "$";

    var idControl;
    var idEntity;
    var controls;
    var lastIndexSelected = -1;
    var rootControl = {};
    var isCurrencySeted = false;

    var idClassificationCatalog = "47"
    var idPaymentTypeCatalog = "117";
    var idLevelCatalog = "45";
    var idBeneficiaryCatalog = "46";
    var idDerivativeCredit = "1";
    var idDestinationCredit = "136";

    var classificationCatalog = [];
    var paymentTypeCatalog = [];
    var levelCatalog = [];
    var beneficiaryCatalog = [];
    var derivativeCredit = [];
    var destinationCredit = [];

    var deduccionesPersonales = ["A", "A1", "B", "C", "D", "E", "F", "G"];
    var estimulos = ["H", "J"];
    var otros = ["L"];

    var beforeEditCfdi = {};

    function Clasificador(control) {

        rootControl = control;

        idControl = control.id;
        idEntity = control.idEntidadPropiedad;

        classificationCatalog = FormsBuilder.Catalogs.getAll().find('catalogo[id="{0}"]'.format(idClassificationCatalog));
        paymentTypeCatalog = FormsBuilder.Catalogs.getAll().find('catalogo[id="{0}"]'.format(idPaymentTypeCatalog));
        levelCatalog = FormsBuilder.Catalogs.getAll().find('catalogo[id="{0}"]'.format(idLevelCatalog));
        beneficiaryCatalog = FormsBuilder.Catalogs.getAll().find('catalogo[id="{0}"]'.format(idBeneficiaryCatalog));
        derivativeCredit = FormsBuilder.Catalogs.getAll().find('catalogo[id="{0}"]'.format(idDerivativeCredit));
        destinationCredit = FormsBuilder.Catalogs.getAll().find('catalogo[id="{0}"]'.format(idDestinationCredit));

        var rowNewDiv = $('<div class="col-md-12 clasificador" entidad="{0}">'.format(idEntity));

        controls = collectControls(control);

        if (controls.length == 0) {
            console.log("Se debe definir los controles internos");
            return "";
        }

        rowNewDiv.append(getEditModal());
        rowNewDiv.append('<div class="row"><div class="col-md-12"><button id="nuevoCfdiSelector" type="button" class="btn btn-primary btn-red pull-right" entidad="{0}">Agregar</button></div></div>'.format(control.idEntidadPropiedad));

        createFieldsForExprsGrid();

        return rowNewDiv[0].outerHTML;
    }

    function clone(obj) {
        var copy;

        // Handle the 3 simple types, and null or undefined
        if (null == obj || "object" != typeof obj) return obj;

        // Handle Date
        if (obj instanceof Date) {
            copy = new Date();
            copy.setTime(obj.getTime());
            return copy;
        }

        // Handle Array
        if (obj instanceof Array) {
            copy = [];
            for (var i = 0, len = obj.length; i < len; i++) {
                copy[i] = clone(obj[i]);
            }
            return copy;
        }

        // Handle Object
        if (obj instanceof Object) {
            copy = {};
            for (var attr in obj) {
                if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
            }
            return copy;
        }

        throw new Error("Unable to copy obj! Its type isn't supported.");
    }

    function mapFormToCfdi(cfdi) {
        var cfdiIntoViewModel = -1;

        $.each(FormsBuilder.ViewModel.getDetalleGrid()[idEntity], function(index, data) {
            if (data["E{0}PIndex".format(idEntity)] == lastIndexSelected) {
                cfdiIntoViewModel = index;
                return false;
            }
        });

        for (var p in cfdi) {

            var id = p.substring(p.indexOf("P") + 1);

            if ($("#modalEdicionDetalleFactura").find("[name={0}]".format(p)).length > 0) {
                var value = "";

                if (isDate(id)) {
                    value = $("#modalEdicionDetalleFactura").find("[name={0}]".format(p))[0].value;

                    FormsBuilder.ViewModel.getDetalleGrid()[idEntity][cfdiIntoViewModel][p] = value;
                } else {
                    value = $("#modalEdicionDetalleFactura").find("[name={0}]".format(p)).val();
                    value = value.replace(/,/g, "");

                    FormsBuilder.ViewModel.getDetalleGrid()[idEntity][cfdiIntoViewModel][p] = isNaN(value) || IsNullOrEmpty(value) ? value : Number(value);
                }
            }
        }
    }

    function mapCfdiToViewModel(cfdi) {
        setTimeout(function() {
            SAT.Environment.setSetting("runRulesGrid", false);
            var cfdiIntoViewModel = -1;

            $.each(FormsBuilder.ViewModel.getDetalleGrid()[idEntity], function(index, data) {
                if (data["E{0}PIndex".format(idEntity)] == lastIndexSelected) {
                    cfdiIntoViewModel = index;
                    return false;
                }
            });

            for (var p in cfdi) {
                if ($("#modalEdicionDetalleFactura").find("[name={0}]".format(p)).length > 0) {
                    FormsBuilder.ViewModel.getDetalleGrid()[idEntity][cfdiIntoViewModel][p] = cfdi[p];
                }
            }

            SAT.Environment.setSetting("runRulesGrid", true);

        }, 100);
    }

    var triggerBinding = function() {
        var viewModel = FormsBuilder.ViewModel.get()[idEntity];

        for (var p in viewModel) {
            console.log(p);
            FormsBuilder.ViewModel.get()[idEntity][p].valueHasMutated();
        }
    };

    function createFieldsForExprsGrid() {

        var entity = Enumerable.From(FormsBuilder.XMLForm.getEntidades()).Where("$.id == {0}".format(idEntity)).First();

        var camposGrid = FormsBuilder.ViewModel.getFieldsForExprsGrid();

        $.each(entity.propiedades.propiedad, function(index2, property) {
            camposGrid[PREFIJO_DOLLAR + property.id] = {
                entidad: entity.id,
                propiedad: property.id
            };
        });
    };

    function openCfdiRow(index) {
        console.log("nivel openCfdiRow " + index);

        if (index >= 0) {
            var cfdis = FormsBuilder.ViewModel.getDetalleGrid()[idEntity];
            var cfdi = Enumerable.From(cfdis).Where(function(c) {
                return c["E{0}PIndex".format(idEntity)] == index;
            }).First();

            sleep(200, function() {

                var classification = cfdi["E{0}PTipoDeduccion".format(idEntity)];
                var rfc = cfdi["E{0}PRFCEmisor".format(idEntity)];
                var index = cfdi["E{0}PIndex".format(idEntity)];

                var row = $(".clasificador[entidad='{0}']".format(idEntity)).find('li[data-classification="{0}"]'.format(classification)).find("table tbody tr")[0];
                var container = $(row).closest("div.nivel-1").parent();
                var childrenCount = container.children().length;

                var level1 = $(row).closest("div.nivel-1");
                level1.trigger(!$(level1.find("table")[0]).hasClass("active-level") ? "level:open" : "level:close");

                if (classification && childrenCount == 1) {

                    var secondLevel = renderSecondLevel(classification);

                    level1.parent().append(secondLevel);

                    $(row).closest("div.nivel-1").find("table:first-child").addClass("active-level");
                    $(row).closest("div.nivel-1").parent().siblings().find(".nivel-1").trigger("level:close");
                    $(row).closest("div.nivel-1").next().find(".nivel-2").show(300);
                }

                sleep(200, function() {
                    var row2 = $(".clasificador[entidad='{0}']".format(idEntity)).find('li[data-rfc="{0}"]'.format(rfc)).find("table tbody tr")[0];
                    var container = $(row2).closest("div.nivel-2").parent();
                    var childrenCount = container.children().length;

                    var level2 = $(row2).closest("div.nivel-2");
                    level2.trigger(!$(level2.find("table")[0]).hasClass("active-level") ? "level:open" : "level:close");

                    if (classification && childrenCount == 1) {

                        var thirdLevel = renderThirdLevel(classification, rfc);

                        level2.parent().append(thirdLevel);

                        $(row2).closest("div.nivel-2").find("table:first-child").addClass("active-level");
                        $(row2).closest("div.nivel-2").parent().siblings().find(".nivel-2").trigger("level:close");
                        $(row2).closest("div.nivel-2").next().find(".nivel-3").show(300);

                        //permite mostrar estilos de poppup correctos
                        $(".nivel-3 .edit").tooltip('hide');
                        $(".nivel-3 .delete").tooltip('hide');
                        $(".nivel-3 .viewPDF").tooltip('hide');
                    }

                    sleep(200, function() {
                        $('html, body').animate({
                            scrollTop: $($(".clasificador[entidad='{0}']".format(idEntity)).find('tr[data-index="{0}"]'.format(index))[0]).offset().top - 20
                        }, 500, function() {
                            //$($(".clasificador").find('tr[data-index="{0}"]'.format(index))[0]).stop().animate({ fontSize: '20px' }, 200, function () {
                            //    $($(".clasificador").find('tr[data-index="{0}"]'.format(index))[0]).stop().animate({ fontSize: '16px' }, 300);
                            //});
                        });
                    });
                });
            });
        }
    }

    function sleep(time, callback) {
        setTimeout(callback, time)
    }

    function getEditModal() {
        var html = '';

        html += '<div id="modalEdicionDetalleFactura" class="modal fade in" tabindex="-1" role="dialog" style="display: none; padding-right: 17px;" data-action="edit">';
        html += '<div class="modal-dialog modal-lg" role="document">';
        html += '<div class="modal-content">';
        html += '<div class="modal-header">';
        html += '<button type="button" class="close" data-dismiss="modal" aria-label="Close" tabindex="-1"><span aria-hidden="true">×</span></button>';
        html += '<h4 class="modal-title">Edicion del detalle de la factura</h4>';
        html += '</div>';
        html += '<div class="modal-body">';
        html += '<div class="row">';

        var columns = getColumns();
        var numControls = 0;

        $.each(columns, function(index, value) {

            var controls = getControlsPerColumn(index);
            var controlsOrderer = Enumerable.From(controls).OrderBy("$.orden || '0'").ToArray();

            html += '<div class="col-md-{0}">'.format((12 / columns.length));

            $.each(controlsOrderer, function(index, control) {

                var key = "E{0}P{1}".format(idEntity, control.idPropiedad);

                var hide = Enumerable.From(control.atributos.atributo).Where("$.nombre == 'OcultarEnEdicion'").Any();
                if (hide)
                    return;

                var title = Enumerable.From(control.atributos.atributo).Where("$.nombre == 'TituloCorto'").FirstOrDefault().valor;

                numControls++;

                if (isSelect(control.idPropiedad)) {
                    var titleLarge = Enumerable.From(control.atributos.atributo).Where("$.nombre == 'TituloLargo'").FirstOrDefault({ valor: "" });

                    var helpText = FormsBuilder.Modules.ControlBase().getHelpText.apply(this, [control]);

                    var helpString = FormsBuilder.Modules.ControlBase().helpString.apply(this, [titleLarge, helpText]);

                    html += '<div>';
                    html += '<div><div><span class="ic-help"></span><label>{0}</label>'.format(title);
                    html += '</div><select class="form-control sat-height-field" name="{0}" view-model="{0}" help-text="{1}" data-bind="valueUpdate: \'blur\', value: {0}" tabindex="{2}">'.format(key, helpString, numControls);
                    $.each(getCatalogSelect(control.idPropiedad).find("elemento"), function(index, control) {

                        var valor = $(control).attr("valor");
                        var texto = $(control).attr("texto");

                        html += '<option value="{0}">{1}</option>'.format(valor, texto);
                    });
                    html += '</select>';
                    html += '</div><div class="clear"></div>';
                    html += '</div>';

                    return;
                }

                var input = '<div>';
                input += '<div><div><span class="ic-help"></span><label>{0}</label>'.format(title);
                input += '</div><input onpaste="return false;" class="form-control sat-height-field {2}" type="text" value="" name="{1}" view-model="{1}" data-bind="valueUpdate: \'blur\', value: {1}" tabindex="{3}"/>'.format(control.idPropiedad, key, isDate(control.idPropiedad) ? "isDatepicker" : "", numControls);
                input += '</div><div class="clear"></div>';
                input += '</div>';

                var titleLarge = Enumerable.From(control.atributos.atributo).Where("$.nombre == 'TituloLargo'").FirstOrDefault({ valor: "" });
                var helpText = FormsBuilder.Modules.ControlBase().getHelpText.apply(this, [control]);

                var node = $(input);

                FormsBuilder.Modules.ControlBase().validaLongitud(control, node, "input");
                FormsBuilder.Modules.ControlBase().soloNumerosPositivos(control, node, "input");
                FormsBuilder.Modules.ControlBase().enMayusculas(control, node, "input");
                FormsBuilder.Modules.ControlBase().mostrarDecimales(control, node, "input");
                FormsBuilder.Modules.ControlBase().capturaDecimales(control, node, "input");
                FormsBuilder.Modules.ControlBase().soloNumerosDecimales(control, node, "input");

                var property = getPropertyById(control.idPropiedad);
                if (property)
                    FormsBuilder.Modules.ControlBase().formatCurrency(property, node, "input");

                var helpString = FormsBuilder.Modules.ControlBase().helpString.apply(this, [titleLarge, helpText]);
                node.find("input").attr('help-text', helpString);

                html += node.html();
            });

            html += '</div>';
        });

        html += '</div>';
        html += '</div>';
        html += '<div class="modal-footer">';
        html += '<button type="button" class="btn btn-primary" data-dismiss="modal" tabindex="{0}">Cerrar</button>'.format(numControls + 1);
        html += '<button type="button" class="btn btn-primary actualizaCfdi" tabindex="{0}">Guardar</button>'.format(numControls + 2);
        html += '</div>';
        html += '</div>';
        html += '</div>';
        html += '</div>';

        return html;
    }

    //se replica seleccion de metododePagoId hacia metododPago en nuevos registros
    function setPayment() {
        var modal = $("#modalEdicionDetalleFactura");

        modal.find('select').blur(function(k) {
            var current = $(k)[0].currentTarget;

            var propiedadControl = current.name.substring(current.name.indexOf("P") + 1);

            var catalogoId = getCatalogSelect(propiedadControl)[0].id;

            if (catalogoId === idPaymentTypeCatalog) {
                var value = current.value;

                if (value >= 0) {
                    var texto = FormsBuilder.Catalogs.getTextByValue(catalogoId, value);

                    $("input[view-model='E{0}PMetododePago']".format(idEntity)).val(texto);
                } else {
                    $("input[view-model='E{0}PMetododePago']".format(idEntity)).val('Otros');
                }
            }
        });
    }

    function setCurrency() {

        var modal = $("#modalEdicionDetalleFactura");

        modal.find('.currency').each(function(key, value) {
            setTimeout(function() {
                fbUtils.applyFormatCurrencyOnElement(value, true);
            }, 200);
        });

        if (!isCurrencySeted) {
            modal.find('.currency').focus(function() {
                if (navigator.userAgent.match(/Edge\/(13|14)/)) {
                    return setTimeout($(this).select.bind($(this)), 10)
                }

                $(this).select();
            });

            modal.find('.currency').blur(function() {
                fbUtils.applyFormatCurrencyOnElement($(this), true);
            });

            if (modal.length > 0)
                isCurrencySeted = true;
        }
    };

    function isSelect(id) {
        return id == "MetododePagoId" || id == "Nivel" || id == "Beneficiario" || id == "TipoDeduccion" || id == "CreditoDerivado" || id == "CreditoDestinado";
    };

    function getCatalogSelect(id) {
        var keys = {
            "MetododePagoId": paymentTypeCatalog,
            "Nivel": levelCatalog,
            "Beneficiario": beneficiaryCatalog,
            "TipoDeduccion": classificationCatalog,
            "CreditoDerivado": derivativeCredit,
            "CreditoDestinado": destinationCredit,
        };

        return keys[id];
    };

    function getClassificationTextByValue(value) {
        return classificationCatalog.find('elemento[valor="{0}"]'.format(value)).attr("texto");
    }

    function getPaymentTypeTextByValue(value) {
        return paymentTypeCatalog.find('elemento[valor="{0}"]'.format(value)).attr("texto");
    }

    function collectControls(control) {

        var controls = [];

        var columns = getColumns();

        $.each(columns, function(index, value) {
            controls = controls.concat(getControlsPerColumn(index));
        });

        return controls;
    }

    function getColumns() {
        var columns = Enumerable.From(rootControl.controles.control).Where("$.tipoControl == 'Columna'").ToArray();

        return columns;
    }

    function getControlsPerColumn(columnIndex) {
        var columns = getColumns();

        if (columns.length >= (columnIndex + 1)) {
            if (columns[columnIndex]) {
                return columns[columnIndex].controles.control
            }
        }
    }

    function getLevelControls(level) {
        var levelControls = Enumerable.From(controls).Where(function(c) {
            return Enumerable.From(c.atributos.atributo).Any("$.nombre == 'MuestraEnGrid' && $.valor == " + level);
        }).ToArray();

        return levelControls;
    }

    function renderFirstLevel(cfdis) {

        console.log("Render Primer Nivel");

        var html = '';

        var groupedOrderer = Enumerable.From(cfdis).OrderBy("$.E{0}PTipoDeduccion".format(idEntity)).ToArray();

        var grouped = Enumerable.From(groupedOrderer).GroupBy("$.E{0}PTipoDeduccion".format(idEntity)).ToArray();

        var deduccionesList = Enumerable.From(grouped).Where(function(g) {
            return deduccionesPersonales.indexOf(g.Key()) >= 0;
        }).ToArray();

        var estimulosList = Enumerable.From(grouped).Where(function(g) {
            return estimulos.indexOf(g.Key()) >= 0;
        }).ToArray();

        var otrosList = Enumerable.From(grouped).Where(function(g) {
            return otros.indexOf(g.Key()) >= 0;
        }).ToArray();

        var fullContent = [deduccionesList, estimulosList, otrosList];

        for (var i = 0; i < fullContent.length; i++) {
            var index = 0;

            html += '<ul>';

            if ((i === 0 && fullContent[i].length > 0) ||
                (i === 1 && fullContent[0].length === 0 && fullContent[i].length > 0)) {
                html += "<li><h3>" + AVISO_DED_CLASIFICADAS + "</h3><br></li>";
            } else if (i === 2 && fullContent[i].length > 0) {
                html += "<li><h3>" + AVISO_SIN_CLASIFICACION + "</h3><br></li>";
            }


            for (var g = 0; g < fullContent[i].length; g++) {

                var group = fullContent[i][g];
                var totalSummation = Enumerable.From(group.source).Sum("$.E{0}PTotal".format(idEntity));

                //Se visualiza la suma Deducible correcta; restando el monto recuperado                
                var montoRecuperado = 0;
                if (group.Key() === "A" || group.Key() === "A1" || group.Key() === "B") {
                    montoRecuperado = Enumerable.From(group.source).Sum(function(data) {
                        return IsNullOrEmpty(data["E{0}PMontoRecuperacion".format(idEntity)]) ? 0 : data["E{0}PMontoRecuperacion".format(idEntity)];
                    });
                }

                var montoSummation = Enumerable.From(group.source).Sum("$.E{0}PMontoDeducible".format(idEntity)) - montoRecuperado;

                html += '<li data-classification="{0}">'.format(group.Key());

                var data = {};
                data["E{0}P{1}".format(idEntity, "TipoDeduccion")] = group.Key();
                data["E{0}P{1}".format(idEntity, "DescripcionDeduccion")] = getClassificationTextByValue(group.Key());
                data["E{0}P{1}".format(idEntity, "SumatoriaTotal")] = totalSummation;
                data["E{0}P{1}".format(idEntity, "SumatoriaMontoDeducible")] = montoSummation;
                data["E{0}P{1}".format(idEntity, "MontoPorDeducirTotal")] = 0; //montoPorDeducirSummation;

                html += createTableLevel("1", [data], index, " ");

                html += '</li>';

                index++;
            }

            html += '</ul>';
        }

        return html;
    };

    function renderSecondLevel(clasification) {
        console.log("Render segundo nivel " + clasification);

        var html = '';

        var cfdis = FormsBuilder.ViewModel.getDetalleGrid()[idEntity];

        var groupedOrderer = Enumerable.From(cfdis).Where(function(x) { return x["E{0}PTipoDeduccion".format(idEntity)] == clasification }).OrderBy("$.E{0}PRFCEmisor".format(idEntity)).ToArray();

        var grouped = Enumerable.From(groupedOrderer).GroupBy(function(x) { return x["E{0}PRFCEmisor".format(idEntity)]; }).ToArray();

        html += '<ul style="margin-left: 20px;">';

        var index = 0;
        for (var g = 0; g < grouped.length; g++) {

            var group = grouped[g];

            var emisorInfo = Enumerable.From(group.source).FirstOrDefault(null, function(x) {
                return x["E{0}PRFCEmisor".format(idEntity)] == group.Key();
            });

            var totalSummation = Enumerable.From(group.source).Sum("$.E{0}PTotal".format(idEntity));

            //Se visualiza la suma Deducible correcta; restando el monto recuperado
            var montoRecuperado = 0;
            if (clasification === "A" || clasification === "A1" || clasification === "B") {
                montoRecuperado = Enumerable.From(group.source).Sum(function(data) {
                    return IsNullOrEmpty(data["E{0}PMontoRecuperacion".format(idEntity)]) ? 0 : data["E{0}PMontoRecuperacion".format(idEntity)];
                });
            }
            var montoSummation = Enumerable.From(group.source).Sum("$.E{0}PMontoDeducible".format(idEntity)) - montoRecuperado;

            html += '<li data-classification="{0}" data-rfc="{1}">'.format(clasification, group.Key());

            emisorInfo["E{0}PRFCEmisor".format(idEntity)] = group.Key();
            emisorInfo["E{0}PSumatoriaTotal".format(idEntity)] = totalSummation;
            emisorInfo["E{0}PSumatoriaMontoDeducible".format(idEntity)] = montoSummation;

            html += createTableLevel("2", [emisorInfo], index);

            html += '</li>';

            index++;
        }

        html += '</ul>';

        console.log(html);
        return html;
    }

    function renderThirdLevel(clasification, emisor) {
        console.log("Render tercer nivel " + clasification + " " + emisor);

        var html = '';

        var cfdis = FormsBuilder.ViewModel.getDetalleGrid()[idEntity];

        var items = Enumerable.From(cfdis).Where(function(x) { return x["E{0}PTipoDeduccion".format(idEntity)] == clasification && x["E{0}PRFCEmisor".format(idEntity)] == emisor }).OrderBy("$.E{0}PFechaEmision".format(idEntity)).ToArray();

        html += '<ul style="margin-left: 20px;">';
        html += '<li>';

        html += createTableLevel("3", items, 0);

        html += '</li>';
        html += '</ul>';

        return html;
    }

    //Regresa el ancho personalizado que se requieran para cada celda, por default el mismo valor que recibe
    function calculateColumnWidth(level, columnWidth, numColumn) {
        var columnWidth = columnWidth;

        if (level === "1" && numColumn === 0) {
            columnWidth = columnWidth * 3;
        } else if (level === "2" && (numColumn === 0 || numColumn === 1)) {
            columnWidth = columnWidth * 1.5;
        } else if (level === "2" && numColumn === 3) {
            // última columna ocupan 3 posiciones para alinear montos
            columnWidth = columnWidth * 3;
        } else if (level === "3" && numColumn === 1) {
            columnWidth = columnWidth * 1.5;
        }

        return columnWidth;
    }

    function createTableLevel(level, collection, rootIndex, name) {
        var levelControls = getLevelControls(level);
        var tipoDeduccion = collection.length > 0 ? collection[0]["E{0}PTipoDeduccion".format(idEntity)] : "";

        var headers = '';
        var body = '';

        var requireEditionControls = level == "3";

        //El tamaño de ancho de columna se determinará de acuerdo a los controles visibles del ultimo nivel:3
        var levelControlsForWidth = getLevelControls(3);
        var columnWidth = 100 / (levelControlsForWidth.length + 2);

        if ((rootIndex === 0 && !IsNullOrEmpty(name)) || level === "2" || level === "3") {
            if (requireEditionControls) {
                headers += '<th>Num.</th>';
            }

            $.each(levelControls, function (idx, control) {
                var headCellText = Enumerable.From(control.atributos.atributo).Where("$.nombre == 'TituloCorto'").FirstOrDefault().valor;

                //Se muestran todos menos los dos últimos títulos de nivel-2
                //Se muestran todos menos los tres últimos títulos de nivel-3
                if (!(idx > 1 && (level === "2" || level === "3"))) {

                    //Para el tipo de deduccion "D" no debe mostrarse titulo "FechaEmision"
                    if (control.idPropiedad === "FechaEmision" && tipoDeduccion === "D") {
                        headCellText = "";
                    }

                    headers += '<th>{0}</th>'.format(headCellText || "", columnWidth);
                }
            });
        }

        //Se agrega columna para forma de pago en nivel 1
        if (level == '1') {
            var headCellText = "Forma de Pago";
            headers += '<th>{0}</th>'.format(headCellText || "", columnWidth);
        }

        var count = 0;
        for (var d = 0; d < collection.length; d++) {

            var data = collection[d];
            var index = data["E{0}PIndex".format(idEntity)];

            body += requireEditionControls ? '<tr data-index="{0}">'.format(index) : '<tr>';

            if (requireEditionControls) {
                body += '<td style="width:{0}%">{1}</td>'.format(columnWidth * 0.5, ++count);
            }

            $.each(levelControls, function(idx, control) {
                var key = "E{0}P{1}".format(idEntity, control.idPropiedad);

                //Para el tipo de deduccion "D" no debe mostrarse valor en "FechaEmision"
                if (key === "E{0}PFechaEmision".format(idEntity) && tipoDeduccion === "D") {
                    body += '<td></td>';
                    return;
                }

                var value = data[key];
                var columnWidthAux = calculateColumnWidth(level, columnWidth, idx);

                if (isNumeric(control.idPropiedad)) {
                    body += '<td style="width:{0}%" data-name="{1}">{2}</td>'.format(columnWidthAux, key, formatMoney(value, 2, '.', ','));
                } else {
                    //Se agrega clase de icono, sólo al primer elemento de los niveles 1 y 2
                    if (idx === 0 && level !== "3") {
                        body += '<td style="width:{0}%" data-name="{1}"><i class="icon-plus-sign" style="margin-right: 10px;"></i>{2}</td>'.format(columnWidthAux, key, value || "");
                    } else {
                        body += '<td style="width:{0}%" data-name="{1}">{2}</td>'.format(columnWidthAux, key, value || "");
                    }
                }

                if (requireEditionControls) {
                    executeRowRules(control.idPropiedad);
                }
            });

            //Se agrega columna para forma de pago en nivel 1
            if (level == '1') {
                body += '<td></td>';
            }

            if (requireEditionControls) {
                body += '<td style="width:{0}%"><div style="width: 155px;">'.format(columnWidth, index);
                //muestra link para ver info. de PDf en formato html únicamente de elementos precargados y diferentes a créditos hipotecarios
                if (SAT.Environment.settings("ViewCfdiPDF") && data["E{0}PProvieneDePrecarga".format(idEntity)] == "1" && data["E{0}PTipoDeduccion".format(idEntity)] != "D") {
                    body += '<a class="pull-left viewPDF" data-index="{0}" style="cursor:pointer;" data-toggle="tooltip" data-placement="top" title="Ver factura"><span class="glyphicon glyphicon-eye-open" aria-hidden="true"></span>Ver</a>'.format(index);
                }
                body += '<button type="button" class="btn pull-left edit" data-index="{1}" style="margin: -5px 0px 0px 5px;" data-toggle="tooltip" data-placement="top" title="Editar"><img class="btnEditFormularioGridEdicionRow" src="Engine/css/imgs/editar.png" /></button>'.format(columnWidth, index);
                body += '<button type="button" class="btn pull-left delete" data-index="{1}" style="margin: -5px 0px 0px 5px;" data-toggle="tooltip" data-placement="top" title="Eliminar"><img src="Engine/css/imgs/borrar.png" /></button>'.format(columnWidth, index);

                body += '</div></td>';
            }

            body += '</tr>';
        }

        var html = '';

        html += '<div class="table-responsive nivel-{0}" data-level="{0}">'.format(level);

        html += '<table class="table table-condensed table-striped">';

        if (rootIndex === 0) {
            html += '<thead>';
            html += '<tr>';
            html += headers;
            html += '</tr>';
            html += '</thead>';
        }

        html += '<tbody>';

        html += body;

        html += '</tbody>';

        html += '</table>'

        html += '</div>';

        return html;
    }

    function executeRowRules(idPropiedadAsociada) {
        var allRules = FormsBuilder.XMLForm.getReglasEjecutarSiempre();

        var propertyRules = Enumerable.From(allRules).Where(function(r) {
            return r.idEntidad == idEntity && r.idPropiedadAsociada == idPropiedadAsociada && r.tipoRegla == "Calculo";
        }).ToArray();

        $.each(propertyRules, function(index, rule) {
            FormsBuilder.ViewModel.Calculo(rule);
        });
    }

    function executeMontoPorDeducirRules() {
        var items = $(".clasificador[entidad='{0}']".format(idEntity)).find("li[data-classification]").filter(':not([data-rfc])');

        $.each(items, function(index, value) {
            var calssification = $(value).data("classification");

            var valor = calculateMontoPorDeducir(calssification);

            var cols = $(value).find("td[data-name='E{0}PMontoPorDeducirTotal']".format(idEntity));

            //El monto pendiente por deducir para Colegiaturas y Sin clasificación no se muestran:
            if (calssification == 'J' || calssification == 'L') {
                $.each(cols, function(index2, value2) {
                    $(value2).html('');
                });
            } else {
                $.each(cols, function(index2, value2) {
                    $(value2).html(formatMoney(valor, 2, '.', ','));
                });
            }
        });

        console.log("executeMontoPorDeducirRules");
    }

    function calculateMontoPorDeducir(tipoDeduccion) {

        var result = 0.0;

        if (tipoDeduccion == 'A' || tipoDeduccion == 'B' || tipoDeduccion == 'D' || tipoDeduccion == 'F' || tipoDeduccion == 'G') {
            var op1 = $INGANUAL * 0.15;
            var op2 = 5 * $TopeAnualUMMA;
            var minResult = op2;

            if (op1 < op2)
                minResult = op1;

            result = minResult + ($TotalRecuperacionMedicos + $TotalRecuperacionFunerales) - ($TotalHonorariosMedicos + $TotalFunerales + $TotalInteresesHipotecarios + $TotalPrimasSeguros + $TotalTransportacionEscolar);

            if (tipoDeduccion == 'B') {
                var opA = $TopeAnualUMMA + $TotalRecuperacionFunerales - $TotalFunerales;
                var opB = result;
                var minResult = opB;
                if (opA < opB)
                    minResult = opA;
                result = minResult;
            }
        } else if (tipoDeduccion == 'A1') {
            result = $INGANUAL + $TotalRecuperacionIncapacidad - $TotalIncapacidadDiscapacidad;
        } else if (tipoDeduccion == 'E') {

            var op1 = $DEG01 * 0.10;
            var op2 = 5 * $TopeAnualUMMA;
            var minResult = op2;

            if (op1 < op2)
                minResult = op1;

            result = minResult - $TotalAportaciones;
        } else if (tipoDeduccion == 'H') {
            result = 152000 - $TotalAhorro;
        } else if (tipoDeduccion == 'C') {
            result = $TopeDonativos - $TotalDonativos;
        }

        return result < 0 ? 0 : result;
    }

    function getCfdis() {

        var formType = AppDeclaracionesSAT.getConfig('forma');

        if (formType == "tmp") {
            sleep(500, function() {
                var data = FormsBuilder.XMLForm.getCopyDeclaracion().find('entidad[clave="SAT_DED_PER"]').find("fila");

                var loadedCfdis = mapCfdisToEntityFromDeclaracion(data);

                mapToViewModel(loadedCfdis)

                render();
            });
        }

        if (formType == "new") {
            var data = $.parseXML(Base64.decode($('#DVDAPREFOR').html())) || FormsBuilder.XMLForm.getCopyPrecarga();
            //var cfdis = $(data).find('DatosAnexoPersonaFisica').find('Cfdi[idEntidad="{0}"]'.format(idEntity));
            var cfdis = $(data).find('DatosAnexoPersonaFisica').find('Cfdi[idEntidad]'.format(idEntity));

            if (cfdis && cfdis.length > 0) {
                var loadedCfdis = mapCfdisToEntity(cfdis);

                mapToViewModel(loadedCfdis)

                render();
            } else { //Se ejecutan por primera vez la reglas de calculo para mostrar total deducible y monto pendiente por deducir actualizado
                sleep(100, function() {
                    ejecutarReglasCalculo();
                });
            }
        }
    }

    function render() {
        $("#cfditree").remove();

        var cfdis = FormsBuilder.ViewModel.getDetalleGrid()[idEntity];

        var html = renderFirstLevel(cfdis);
        $(".clasificador[entidad='{0}']".format(idEntity)).append('<div id="cfditree" class="row"><div class="col-md-12">' + html + '</div></div>');

        //El boton se pinta al final de la facturas
        $(".clasificador[entidad='{0}'] #cfditree".format(idEntity)).insertBefore(".clasificador[entidad='{0}'] #nuevoCfdiSelector".format(idEntity));

        if (lastIndexSelected >= 0)
            openCfdiRow(lastIndexSelected);
        var t0 = performance.now();
        ejecutarReglasCalculo();
        var t1 = performance.now();
        console.log("Call to ejecutarReglasCalculo " + (t1 - t0) + " milliseconds.");
    }

    function mapCfdisToEntityFromDeclaracion(rows) {
        var result = [];

        for (var i = 0; i < rows.length; i++) {
            var row = rows[i];

            var mapped = {};

            mapped["Index"] = (i + 1);

            var properties = $(row).find("propiedad[id]");

            for (var x = 0; x < properties.length; x++) {
                var property = properties[x];

                mapped[$(property).attr("id")] = !isNaN($(property).text()) && !IsNullOrEmpty($(property).text()) ? Number($(property).text()) : $(property).text();
            }

            if (!$.isEmptyObject(mapped)) {
                result.push(mapped);
            }
        }

        return result;
    }

    function mapCfdisToEntity(cfdis) {
        var result = [];

        for (var i = 0; i < cfdis.length; i++) {
            var cfdi = cfdis[i];

            var mapped = {};

            mapped["Index"] = (i + 1);

            var properties = $(cfdi).find("[claveInformativa]");

            $.each(properties, function(index, name) {
                var value = $(cfdi).find('[claveInformativa="{0}"]'.format(name.tagName)).text();

                mapped[name.tagName] = !isNaN(value) && !IsNullOrEmpty(value) ? Number(value) : value;
            });

            if (!$.isEmptyObject(mapped)) {
                result.push(mapped);
            }
        }

        return result;
    }

    function mapToViewModel(loadedCfdis) {

        var entity = Enumerable.From(FormsBuilder.XMLForm.getEntidades()).Where("$.id == {0}".format(idEntity)).First();

        FormsBuilder.ViewModel.getDetalleGrid()[idEntity] = [];

        $.each(loadedCfdis, function(index1, cfdi) {

            var obj = {};

            obj["E{0}PIndex".format(idEntity)] = (index1);

            $.each(entity.propiedades.propiedad, function(index2, property) {
                var key = "E{0}P{1}".format(entity.id, property.id);

                if (cfdi[property.id] !== undefined) {

                    if (isDate(property.id)) {
                        obj[key] = formatDate(parseDateTime(cfdi[property.id]), "dd/MM/yyyy");
                    } else {
                        obj[key] = cfdi[property.id];
                    }
                }
            });

            FormsBuilder.ViewModel.getDetalleGrid()[idEntity].push(obj);
        });

        console.log("CLASIFICADOR: view model upated");

    }

    function formatMoney(n, c, d, t) {
        var c = isNaN(c = Math.abs(c)) ? 2 : c,
            d = d == undefined ? "." : d,
            t = t == undefined ? "," : t,
            s = n < 0 ? "-" : "",
            i = String(parseInt(n = Math.abs(Number(n) || 0).toFixed(c))),
            j = (j = i.length) > 3 ? j % 3 : 0;
        return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
    };

    function formatDate(date, format) {

        if (!isNaN(date)) {

            if (!format)
                format = "MM/dd/yyyy";

            var month = date.getMonth() + 1;
            var year = date.getFullYear();

            format = format.replace("MM", month.toString().padL(2, "0"));

            if (format.indexOf("yyyy") > -1)
                format = format.replace("yyyy", year.toString());
            else if (format.indexOf("yy") > -1)
                format = format.replace("yy", year.toString().substr(2, 2));

            format = format.replace("dd", date.getDate().toString().padL(2, "0"));

            var hours = date.getHours();
            if (format.indexOf("t") > -1) {
                if (hours > 11)
                    format = format.replace("t", "pm")
                else
                    format = format.replace("t", "am")
            }
            if (format.indexOf("HH") > -1)
                format = format.replace("HH", hours.toString().padL(2, "0"));
            if (format.indexOf("hh") > -1) {
                if (hours > 12) hours - 12;
                if (hours == 0) hours = 12;
                format = format.replace("hh", hours.toString().padL(2, "0"));
            }
            if (format.indexOf("mm") > -1)
                format = format.replace("mm", date.getMinutes().toString().padL(2, "0"));
            if (format.indexOf("ss") > -1)
                format = format.replace("ss", date.getSeconds().toString().padL(2, "0"));
            return format;

        }

        return "";
    }

    function isNumeric(id) {
        var entity = Enumerable.From(FormsBuilder.XMLForm.getEntidades()).Where("$.id == {0}".format(idEntity)).First();

        var property = Enumerable.From(entity.propiedades.propiedad).FirstOrDefault(undefined, function(item) {
            return item.id == id;
        });

        if (property) {
            return property.tipoDatos == "Numerico";
        }

        return false;
    }

    function isDate(id) {
        var entity = Enumerable.From(FormsBuilder.XMLForm.getEntidades()).Where("$.id == {0}".format(idEntity)).First();

        var property = Enumerable.From(entity.propiedades.propiedad).FirstOrDefault(undefined, function(item) {
            return item.id == id;
        });

        if (property) {
            return property.tipoDatos == "Fecha";
        }

        return false;
    }

    function getPropertyById(id) {
        var entity = Enumerable.From(FormsBuilder.XMLForm.getEntidades()).Where("$.id == {0}".format(idEntity)).First();

        var property = Enumerable.From(entity.propiedades.propiedad).FirstOrDefault(undefined, function(item) {
            return item.id == id;
        });

        return property;
    }

    function hasPropety(object, key) {
        return object ? hasOwnProperty.call(object, key) : false;
    }

    function ejecutarReglasCalculo() {

        var entity = Enumerable.From(FormsBuilder.XMLForm.getEntidades()).Where("$.id == {0}".format(idEntity)).First();

        var reglas = FormsBuilder.XMLForm.getReglasEjecutarPosterior();

        for (var i = 0; i < reglas.length; i++) {
            var regla = reglas[i];

            if (regla.idPropiedadAsociada) {
                var propiedadesAsociadas = regla.idPropiedadAsociada.split(",");

                for (var j = 0; j < propiedadesAsociadas.length; j++) {
                    var propiedadAsociada = propiedadesAsociadas[j];

                    var campoGrid = Enumerable.From(entity.propiedades.propiedad).Where(function(item) {
                        return item.id == propiedadAsociada;
                    }).FirstOrDefault(undefined);

                    if (campoGrid) {
                        FormsBuilder.ViewModel.Calculo(regla);
                        break;
                    }
                }
            }
        }

        //Se deja de mostrar la columna "Por Deducir", por lo que ya no se ejecutan sus cálculos
        // executeMontoPorDeducirRules();
    }

    function setDateControl() {
        try {
            var maxDateAble = '31/12/' + $30;
            var minDateAble = '01/01/' + $30;
            $(".isDatepicker").datepicker({ format: 'dd/mm/yyyy', endDate: maxDateAble, startDate: minDateAble, allowDeselection: false });
        } catch (e) {
            console.log("error en creación de picker");
        }
    }

    function parseDateTime(value) {
        var valorFecha = FECHA(value);
        if (valorFecha <= 0 && (typeof value === 'string' || value instanceof String)) {
            var dateTime = value.split(" ");

            var date = [];
            var time = [];

            if (dateTime.length >= 1)
                date = dateTime[0].split("-");

            if (dateTime.length >= 2)
                time = dateTime[1].split(":");

            if (time.length > 0) {
                valorFecha = new Date(Number(date[0]), Number(date[1]) - 1, Number(date[2]), Number(time[0]), Number(time[1]), Number(time[2]));
            } else {
                valorFecha = new Date(Number(date[0]), Number(date[1]) - 1, Number(date[2]));
            }
        }
        return valorFecha;
    }

    //se suscribe evento clic a Ayudas
    function addHelp() {
        $.each($(".clasificador[entidad='{0}']".format(idEntity)).find("span.ic-help"), function(k, v) {

            var helpText = $(v).siblings('input').attr('help-text');

            if (helpText === undefined) {
                helpText = $(v).parent().next().attr('help-text');
            }

            if (helpText !== undefined) {
                $(this).on("click", function() {
                    var mdAyuda = $('#modal-ayuda');
                    mdAyuda.find('.modal-body').html(helpText);
                    mdAyuda.modal('show');
                });
            }
        });
    }

    function quitarErrores() {
        var modal = $("#modalEdicionDetalleFactura");

        modal.find(".alert").removeClass("alert");
        modal.find("i[vm].icon-warning-sign").remove();

        FormsBuilder.ViewModel.setBadgeCount(modal);
    }

    function loadedClasificadorUI() {

        console.log("loadedClasificadorUI");

        if ($(".clasificador[entidad='{0}']".format(idEntity)).length <= 0) {
            return;
        }

        $(".clasificador[entidad='{0}']".format(idEntity)).on("click", ".nivel-1 > table", function() {

            var level1 = $(this).parent();

            level1.trigger(!$(this).hasClass("active-level") ? "level:open" : "level:close");
        });

        $(".clasificador[entidad='{0}']".format(idEntity)).on("click", ".nivel-1 > table tr", function() {

            var classification = $(this).closest("li").attr("data-classification");

            var container = $(this).closest("div.nivel-1").parent();
            var childrenCount = container.children().length;

            if (classification && childrenCount == 1) {
                var secondLevel = renderSecondLevel(classification);

                container.append(secondLevel);
            }
        });

        $(".clasificador[entidad='{0}']".format(idEntity)).on("click", ".nivel-2 > table tr", function() {

            var classification = $(this).closest('li[data-classification]').attr("data-classification");
            var emisor = $(this).find('td[data-name="E{0}PRFCEmisor"]'.format(idEntity)).text();

            var container = $(this).closest("div.nivel-2").parent();
            var childrenCount = container.children().length;

            if (classification && emisor && childrenCount == 1) {
                var thirdLevel = renderThirdLevel(classification, emisor);
                container.append(thirdLevel);

                verifyProposal();
            }
        });

        $(".clasificador[entidad='{0}']".format(idEntity)).on("click", ".nivel-2 > table", function() {
            var level2 = $(this).parent();

            level2.trigger(!$(this).hasClass("active-level") ? "level:open" : "level:close");
        });

        //Muestra información de factura en Modal        
        $(".clasificador[entidad='{0}']".format(idEntity)).on("click", ".viewPDF", function() {
            lastIndexSelected = $(this).data("index");

            var cfdi = Enumerable.From(FormsBuilder.ViewModel.getDetalleGrid()[idEntity]).Where(function(c) {
                return c["E{0}PIndex".format(idEntity)] == lastIndexSelected;
            }).First();

            if (!IsNullOrEmpty(cfdi["E{0}PUUID".format(idEntity)])) {
                var facturaHTML = "";

                facturaHTML = Service.Test.obtenerFacturaPDF(cfdi["E{0}PUUID".format(idEntity)]);

                var mdAyuda = undefined;

                if ($('#modal-ayuda-cfdi').length > 0) {
                    mdAyuda = $('#modal-ayuda-cfdi');
                } else {
                    mdAyuda = $('#modal-ayuda').clone();

                    mdAyuda.attr("id", "modal-ayuda-cfdi");
                    mdAyuda.find('.modal-dialog').addClass("modal-lg");
                    mdAyuda.append("<div class=\"modal-header\"><button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-label=\"Close\"><span aria-hidden=\"true\">×</span></button><h4 class=\"modal-title\">Información de factura</h4></div>");
                    mdAyuda.find('.modal-header').insertBefore(mdAyuda.find('.modal-body'));
                    mdAyuda.find('.btn-primary').html("Cerrar");

                    $("body").append(mdAyuda);
                }

                mdAyuda.find('.modal-body').html(facturaHTML);
                mdAyuda.find('.modal-body').addClass("col-xs-12 col-sm-12 col-md-12 col-lg-12");
                mdAyuda.find('.container').addClass("col-xs-12 col-sm-12 col-md-12 col-lg-12");

                mdAyuda.modal({ backdrop: 'static', keyboard: false });
            }
        });

        $(".clasificador[entidad='{0}']".format(idEntity)).on("click", ".delete", function() {

            lastIndexSelected = $(this).data("index");

            var cfdis = FormsBuilder.ViewModel.getDetalleGrid()[idEntity];
            var cfdi = Enumerable.From(cfdis).Where(function(c) {
                return c["E{0}PIndex".format(idEntity)] == lastIndexSelected;
            }).First();

            var fromPreLoad = cfdi["E{0}PProvieneDePrecarga".format(idEntity)];

            if (fromPreLoad == 1) {
                for (var p = 0; p < cfdis.length; p++) {
                    if (cfdis[p]["E{0}PIndex".format(idEntity)] == lastIndexSelected) {
                        var key = "E{0}PTipoDeduccion".format(idEntity);
                        var montoDeducible = "E{0}PMontoDeducible".format(idEntity);
                        FormsBuilder.ViewModel.getDetalleGrid()[idEntity][p][key] = "L";
                        FormsBuilder.ViewModel.getDetalleGrid()[idEntity][p][montoDeducible] = 0;

                        break;
                    }
                }
            } else {
                deleteCfdiByIndex(lastIndexSelected);

                //Se despliega solo nivel 1 en render()
                lastIndexSelected = -1;
            }

            render();
        });

        $(".clasificador[entidad='{0}']".format(idEntity)).on("click", ".edit", function() {
            lastIndexSelected = $(this).data("index");

            var viewModel = FormsBuilder.ViewModel.get()[idEntity];

            var cfdis = FormsBuilder.ViewModel.getDetalleGrid()[idEntity];

            /*Permite que la sumatoria no tome en cuenta el registro que se está mostrando.
             *Se debe quitar la bandera al cerrar modal y antes de ejecutar nuevamente reglas.
             */
            for (var i = 0; i < cfdis.length; i++) {
                if (cfdis[i]["E{0}PIndex".format(idEntity)] != lastIndexSelected) {
                    var detalle = cfdis[i];
                    delete detalle.editando;
                } else {
                    cfdis[i].editando = true;
                    cfdis[i]["E{0}PMontoOriginal".format(idEntity)] = Number(cfdis[i]["E{0}PMontoDeducible".format(idEntity)]) - Number(cfdis[i]["E{0}PMontoRecuperacion".format(idEntity)]);
                }
            }

            var cfdi = Enumerable.From(cfdis).Where(function(c) {
                return c["E{0}PIndex".format(idEntity)] == lastIndexSelected;
            }).First();

            for (var p in cfdi) {
                if (viewModel["{0}".format(p)]) {
                    viewModel["{0}".format(p)](cfdi[p]);
                }
            }

            //Búsqueda de "forma de pago" precargada para seleccionar la opcion correspondiente en el combo
            var option = $("select[view-model='E{0}PMetododePagoId']".format(idEntity)).find('option:contains("{0}")'.format(cfdi["E{0}PMetododePagoId".format(idEntity)]));
            if (option.length > 0) {
                $("select[view-model='E{0}PMetododePagoId']".format(idEntity)).val(option.val());
            } else {
                $("select[view-model='E{0}PMetododePagoId']".format(idEntity)).val("10");
            }

            $("#modalEdicionDetalleFactura").find(".modal-title").html("Proporciona los datos de la factura");

            $("#modalEdicionDetalleFactura").data("action", "edit");

            $("#modalEdicionDetalleFactura").modal({ backdrop: 'static', keyboard: false });

        });

        $(".clasificador[entidad='{0}']".format(idEntity)).on("click", ".actualizaCfdi", updateCreateCfdi);

        $(".clasificador[entidad='{0}']".format(idEntity)).on("click", "#nuevoCfdiSelector", function() {
            //Por si se encuentra bloqueado, se habilita boton
            $("#modalEdicionDetalleFactura .actualizaCfdi").removeAttr("disabled");

            clearForm(true); //true: validar reglas de viewModel

            setPayment();

            $("#modalEdicionDetalleFactura").find(".modal-title").html("Proporciona los datos de la factura");

            $("#modalEdicionDetalleFactura").data("action", "new");

            $("#modalEdicionDetalleFactura").modal({ backdrop: 'static', keyboard: false });
        });

        getCfdis();

        var viewModel = FormsBuilder.ViewModel.get()[idEntity];

        ko.cleanNode($("#modalEdicionDetalleFactura")[0]);
        ko.applyBindings(viewModel, $("#modalEdicionDetalleFactura")[0]);

        //Si es propuesta in-habilitar boton "Nuevo"
        verifyProposal();

        //inicialmente se limpia model sin validar reglas. De no hacerlo al abrir el primer modal precargado no visualiza reglas correctamente
        clearForm(false);

        //Para evitar errores en montos y validaciones se ejecutan reglas al salir del modal
        $('#modalEdicionDetalleFactura').on('hidden.bs.modal', function() {
            /*
            Permite que la sumatoria tome en cuenta el registro que se estába editando.            
            */
            var cfdis = FormsBuilder.ViewModel.getDetalleGrid()[idEntity];
            for (var i = 0; i < cfdis.length; i++) {
                if (cfdis[i]["E{0}PIndex".format(idEntity)] == lastIndexSelected) {
                    var detalle = cfdis[i];
                    delete detalle.editando;
                }
            }

            if ($("#modalEdicionDetalleFactura i.icon-warning-sign").length > 0) {
                ejecutarReglasCalculo();
            }

            clearForm(false);

            quitarErrores();
        });

        //Evento para obligar tab en safari
        $('#modalEdicionDetalleFactura').on({
            'keydown': function(e) {
                if (navigator.appVersion.match("Safari")) {
                    //Si es safari, Se busca el elemento activo siguiente, si ya no hay,
                    //se regresa el Foco al primer elemento
                    if (e.keyCode == 9 && !e.shiftKey) { //Tab presionada
                        e.preventDefault();

                        var tabIndex = e.target.tabIndex;

                        var Elementos = $('#modalEdicionDetalleFactura select, #modalEdicionDetalleFactura button, #modalEdicionDetalleFactura input:enabled').not(':hidden');

                        var Elementos = jQuery.grep(Elementos, function(a) {
                            return a.tabIndex > tabIndex;
                        });

                        if (Elementos.length > 0) {
                            tabIndex = Elementos[0].tabIndex;
                        } else {
                            tabIndex = 1;
                        }

                        $('input[tabindex="' + tabIndex + '"], select[tabindex="' + tabIndex + '"], button[tabindex="' + tabIndex + '"]').focus();
                    }
                } else {
                    //En cualquier otro navegador se iguala funcionamiento cuando no hay tabindex (p/e botón cerrar),
                    //regresando el foco al primer elemento
                    if (e.keyCode == 9 && !e.shiftKey) { //Tab presionada

                        var tabIndex = e.target.tabIndex;

                        if (tabIndex == -1) {
                            e.preventDefault();
                            tabIndex = 1;
                            $('input[tabindex="' + tabIndex + '"], select[tabindex="' + tabIndex + '"], button[tabindex="' + tabIndex + '"]').focus();
                        }
                    }
                }
            }
        });

        //Funciones que siempre se ejecutan; sea nueva factura o precargada
        $('#modalEdicionDetalleFactura').on('shown.bs.modal', function() {

            setDateControl();

            setCurrency();

            addHelp();

            //Si proviene de precarga se muestra TipoDeduccion "L", caso contrario se oculta.
            var fromPreLoad = FormsBuilder.ViewModel.get()[idEntity]["E{0}PProvieneDePrecarga".format(idEntity)]();
            if (fromPreLoad === 1) {
                $("select[view-model='E{0}PTipoDeduccion'] > option[value={1}]".format(idEntity, otros[0])).removeAttr('disabled').removeAttr('style');
            } else {
                //Safari no acepta metodo hide, tampoco hidden y su fondo en select es negro, por lo que se oculta texto unicamente
                var isSafari = /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor);
                if (isSafari) {
                    $("select[view-model='E{0}PTipoDeduccion'] > option[value={1}]".format(idEntity, otros[0])).attr('disabled', 'disabled').attr('style', 'color: white;');
                } else {
                    $("select[view-model='E{0}PTipoDeduccion'] > option[value={1}]".format(idEntity, otros[0])).attr('disabled', 'disabled').attr('style', 'visibility: hidden;').hide();
                }
            }

            //Si es propuesta in-habilitar todos los controles de edición
            //No es necesario habilitar porque por default al mapear ViewModel se muestran controles editables.
            if (SAT.Environment.settings("isProposal") || SAT.Environment.settings("acceptProposal")) {
                setTimeout(function() {
                    $("#modalEdicionDetalleFactura [view-model]").attr("disabled", "disabled");
                }, 500);
            } else {
                //Por si se encuentra bloqueado, se habilita boton
                $("#modalEdicionDetalleFactura .actualizaCfdi").removeAttr("disabled");
            }
        });

        //Se quita padding a: monto total por deducir 
        $("div.col-sm-6:contains('total por deducir')").attr("style", "padding-bottom:10px; padding-right:0px;");
    }

    function verifyProposal() {
        if (SAT.Environment.settings("isProposal") || SAT.Environment.settings("acceptProposal") || SAT.Environment.settings("dejarsinefecto")) {
            $("#nuevoCfdiSelector").attr("disabled", "disabled");
            $(".delete").attr("disabled", "disabled");
            $(".actualizaCfdi").attr("disabled", "disabled");
        } else {
            $("#nuevoCfdiSelector").removeAttr("disabled");
            $(".delete").removeAttr("disabled");
            $(".actualizaCfdi").removeAttr("disabled");
        }
    }

    //Se ejecutan reglas de validacion de cada uno de los campos del modal, sin tomar en cuenta las que tengan mensajeErrorEnDialogo
    function runModalRules(cfdi) {
        var reglas = FormsBuilder.XMLForm.getReglas()["reglas"]["regla"];

        for (var p in cfdi) {
            var propiedadControl = fbUtils.getPropiedad(p);

            var reglasObligatorio = Enumerable.From(reglas).Where("$.idEntidad == '{0}' && $.idPropiedadAsociada == '{1}' && $.tipoRegla === 'Validacion'".format(idEntity, propiedadControl)).ToArray();

            if (reglasObligatorio.length > 0) {
                for (var i = 0; i < reglasObligatorio.length; i++) {
                    var regla = reglasObligatorio[i];
                    if (!regla.mensajeErrorEnDialogo || regla.mensajeErrorEnDialogo != 1) {
                        FormsBuilder.ViewModel.Validacion(p, regla);
                    }
                }
            }
        }
    }

    //Ejecuta las reglas visuales marcadas con el atributo "ParticipaEnGrid"
    function ejecutarReglasVisuales() {
        var reglas = FormsBuilder.XMLForm.getReglas()["reglas"]["regla"];
        var reglasVisuales = Enumerable.From(reglas)
            .Where("$.idEntidad == '{0}' && $.tipoRegla === 'Visual' && $.participaEnGrid === true".format(idEntity))
            .ToArray();

        if (reglasVisuales.length > 0) {
            reglasVisuales.forEach(function (regla, index) {
                FormsBuilder.ViewModel.Visual(regla);
            });
        }
    }

    //Busca elementos vacíos en el modal (Excepto TipoDeduccion), muestra poppup con mensaje general correspondiente a los errores
    function validarControlesVacios() {
        var grid = $("#modalEdicionDetalleFactura .modal-body div.row");
        var controles = grid.find("input, select").not(':hidden');
        var hayControlesVacios = true;

        controles.each(function() {
            var control = $(this);
            var tag = control[0].tagName;
            var valor = control.val();

            if ((tag === "SELECT" && (!IsNullOrEmptyWhite(valor) && valor !== "0" && control[0].name !== "E{0}PTipoDeduccion".format(idEntity))) ||
                (tag === "INPUT" && !IsNullOrEmptyWhite(valor) && valor !== "0.00" && valor !== "0")) {
                hayControlesVacios = false;
                return false;
            }
        });

        if (hayControlesVacios && !$("#modalEdicionDetalleFactura .actualizaCfdi").is(':disabled')) {
            fbUtils.mostrarMensajeError(MSJ_CAMPOS_VACIOS);
        } else if (!$("#modalEdicionDetalleFactura .actualizaCfdi").is(':disabled')) {
            fbUtils.mostrarMensajeError(MSJ_HAY_ERRORES);
        }
    }

    function updateCreateCfdi() {
        var boton = $("#modalEdicionDetalleFactura .actualizaCfdi");

        boton.attr("disabled", "disabled");

        setTimeout(function() {
            var containsErrors = $("#modalEdicionDetalleFactura i.icon-warning-sign").length > 0;
            if (containsErrors) {
                boton.removeAttr("disabled");

                validarControlesVacios();

                return;
            }            

            var cfdis = FormsBuilder.ViewModel.getDetalleGrid()[idEntity];
            var action = $("#modalEdicionDetalleFactura").data("action");

            if (action == "edit") {

                var cfdi = Enumerable.From(cfdis).Where(function(c) {
                    return c["E{0}PIndex".format(idEntity)] == lastIndexSelected;
                }).First();

                beforeEditCfdi = clone(cfdi);

                mapFormToCfdi(cfdi);
                ejecutarReglasCalculo();

                runModalRules(cfdi);

                var containsErrors = $("#modalEdicionDetalleFactura i.icon-warning-sign").length > 0;
                if (containsErrors) {
                    boton.removeAttr("disabled");

                    mapCfdiToViewModel(beforeEditCfdi);

                    fbUtils.mostrarMensajeError(MSJ_HAY_ERRORES);

                    return;
                } else {
                    //Se elimina bandera editando
                    delete cfdi.editando;
                }
            } else if (action == "new") {

                lastIndexSelected = -1;

                var entity = Enumerable.From(FormsBuilder.XMLForm.getEntidades()).Where("$.id == {0}".format(idEntity)).First();

                var cfdi = {};

                $.each(entity.propiedades.propiedad, function(index, property) {
                    var key = "E{0}P{1}".format(idEntity, property.id);

                    cfdi[key] = undefined;

                    if ($("#modalEdicionDetalleFactura").find("[name={0}]".format(key)).length > 0) {
                        var value = $("#modalEdicionDetalleFactura").find("[name={0}]".format(key)).val();
                        value = value.replace(/,/g, "");

                        cfdi[key] = isNaN(value) || IsNullOrEmpty(value) ? value : Number(value);
                    }
                });

                if (FormsBuilder.ViewModel.getDetalleGrid()[idEntity] === undefined)
                    FormsBuilder.ViewModel.getDetalleGrid()[idEntity] = [];

                //El indice no es la longitud del arreglo (puede haber eliminados)
                //Se toma como indice un numero mayor al del último elemento 
                var index = -1;
                if (FormsBuilder.ViewModel.getDetalleGrid()[idEntity].length > 0) {
                    index = FormsBuilder.ViewModel.getDetalleGrid()[idEntity][FormsBuilder.ViewModel.getDetalleGrid()[idEntity].length - 1]["E{0}PIndex".format(idEntity)] + 1;
                } else {
                    index = 0;
                }

                cfdi["E{0}PIndex".format(idEntity)] = index;
                cfdi.editando = true;

                FormsBuilder.ViewModel.getDetalleGrid()[idEntity].push(cfdi);

                ejecutarReglasCalculo();
                runModalRules(cfdi);

                var containsErrors = $("#modalEdicionDetalleFactura i.icon-warning-sign").length > 0;
                if (containsErrors) {
                    boton.removeAttr("disabled");

                    deleteCfdiByIndex(index);

                    fbUtils.mostrarMensajeError(MSJ_HAY_ERRORES);

                    return;
                } else {
                    lastIndexSelected = index;

                    //Se elimina bandera editando
                    delete cfdi.editando;
                }
            }

            ejecutarReglasVisuales();
            render();

            $("#modalEdicionDetalleFactura").modal("hide");
        }, 100);
    }

    function deleteCfdiByIndex(index) {
        if (FormsBuilder.ViewModel.getDetalleGrid()[idEntity] === undefined)
            FormsBuilder.ViewModel.getDetalleGrid()[idEntity] = [];

        var cfdis = FormsBuilder.ViewModel.getDetalleGrid()[idEntity];

        FormsBuilder.ViewModel.getDetalleGrid()[idEntity] = Enumerable.From(cfdis).Where(function(c) {
            return c["E{0}PIndex".format(idEntity)] != index;
        }).ToArray();
    }

    //Recibe parametro que indica si debe validar reglas (form nuevo) o no validarlas (al cerrar modal)
    function clearForm(validarReglas) {
        setTimeout(function() {
            var viewModel = FormsBuilder.ViewModel.get()[idEntity];
            var entity = Enumerable.From(FormsBuilder.XMLForm.getEntidades()).Where("$.id == {0}".format(idEntity)).First();

            if (!validarReglas) {
                SAT.Environment.setSetting("runRulesGrid", false);
            }

            $.each(entity.propiedades.propiedad, function(index, property) {

                var key = "E{0}P{1}".format(idEntity, property.id);

                if ($("#modalEdicionDetalleFactura").find("[name={0}]".format(key)).length > 0) {
                    $("#modalEdicionDetalleFactura").find("[name={0}]".format(key)).val("");
                    viewModel[key]("");
                }
            });

            if (viewModel["E{0}PProvieneDePrecarga".format(idEntity)]) {
                viewModel["E{0}PProvieneDePrecarga".format(idEntity)](0);
            }

            if (!validarReglas) {
                SAT.Environment.setSetting("runRulesGrid", true);
            }
        }, 100);
    };

    //Evento de apertura de nivel 1
    $("body").on("level:open", ".nivel-1", function(e) {
        //Agregar la clase de nivel activo
        if ($(this).find("table:first-child").length > 0) {
            $(this).find("table:first-child").addClass("active-level");
            $(this).find(".icon-plus-sign").removeClass("icon-plus-sign").addClass("icon-minus-sign");
        }
        //Cuando es el primer elemento <thead> es first-child, asi que se busca la tabla
        else {
            $(this).find("table").addClass("active-level");
        }

        //Cierra los demas contenedores de nivel 1
        $(this).parent().siblings().find(".nivel-1").trigger("level:close");

        //Cierra los contenedores de otros grupos si los hay
        $(this).parent().parent().siblings().find(".nivel-1").trigger("level:close");
        //Muestra el contenido de este nivel 1
        $(this).next().find(".nivel-2").show(300);
    });

    //Evento de cierre de nivel 1
    $("body").on("level:close", ".nivel-1", function(e) {
        //Si se han realizado cambios en este nivel entonces hacer reset
        if ($(this).attr("data-modificado") != undefined) {
            $(this).trigger("level:reset");
            $(this).removeAttr("data-modificado");
        }

        //Quitar la clase de nivel activo
        if ($(this).find("table:first-child").length > 0) {
            $(this).find("table:first-child").removeClass("active-level");
            $(this).find(".icon-minus-sign").removeClass("icon-minus-sign").addClass("icon-plus-sign");
        }
        //Cuando es el primer elemento <thead> es first-child, asi que se busca la tabla
        else {
            $(this).find("table").removeClass("active-level");
        }

        //Cierra los contenedores de nivel 2
        $(this).next().find(".nivel-2").trigger("level:close");

        //Oculta el contenido de este nivel 1
        $(this).next().find(".nivel-2").hide(300);
    });

    //Evento de apertura de nivel 2
    $("body").on("level:open", ".nivel-2", function(e) {
        //Agregar la clase de nivel activo
        $(this).find("table:first-child").addClass("active-level");
        $(this).find(".icon-plus-sign").removeClass("icon-plus-sign").addClass("icon-minus-sign");

        //Cierra los demas contenedores de nivel 2
        //$(this).closest("li").siblings().find(".nivel-2").trigger("level:close");
        $(this).parent().siblings().find(".nivel-2").trigger("level:close");

        //Muestra el contenido de este nivel 1
        $(this).next().find(".nivel-3").show(300);

        //permite mostrar estilos de poppup correctos
        $(".nivel-3 .edit").tooltip('hide');
        $(".nivel-3 .delete").tooltip('hide');
        $(".nivel-3 .viewPDF").tooltip('hide');
    });

    //Evento de cierre de nivel 2
    $("body").on("level:close", ".nivel-2", function(e) {
        //Si se han realizado cambios en este nivel entonces hacer reset
        if ($(this).attr("data-modificado") != undefined) {
            $(this).trigger("level:reset");
            $(this).removeAttr("data-modificado");
        }

        //Quitar la clase de nivel activo
        $(this).find("table:first-child").removeClass("active-level");
        $(this).find(".icon-minus-sign").removeClass("icon-minus-sign").addClass("icon-plus-sign");

        //Cierra los contenedores de nivel 2
        $(this).next().find(".nivel-3").trigger("level:close");

        //Oculta el contenido de este nivel 1
        $(this).next().find(".nivel-3").hide(300);
    });

    String.repeat = function(chr, count) {
        var str = "";
        for (var x = 0; x < count; x++) { str += chr };
        return str;
    }

    String.prototype.padL = function(width, pad) {
        if (!width || width < 1)
            return this;

        if (!pad) pad = " ";
        var length = width - this.length
        if (length < 1) return this.substr(0, width);

        return (String.repeat(pad, length) + this).substr(0, width);
    }
    String.prototype.padR = function(width, pad) {
        if (!width || width < 1)
            return this;

        if (!pad) pad = " ";
        var length = width - this.length
        if (length < 1) this.substr(0, width);

        return (this + String.repeat(pad, length)).substr(0, width);
    }

})();