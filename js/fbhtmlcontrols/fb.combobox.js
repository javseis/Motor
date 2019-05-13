/** @module FormsBuilder.Modules */
/**
 * Modulo para el render de formularios que crea una lista desplegable
 * 
 * (c) SAT 2013, Iván González
 */
/*global namespace:false, FormsBuilder:false, SAT: false, AppDeclaracionesSAT:false, ko:false, Base64:false */

"use strict";

(function() {
    namespace("FormsBuilder.Modules", CuadroCombinado);

    var CONTROL_LAYOUT = 'select';
    var LABEL_LAYOUT = 'texto';

    function CuadroCombinado(control) {

        var ctrlBase = FormsBuilder.Modules.ControlBase();
        var db_id = FormsBuilder.Utils.getDbId2(control);

        var rowNewDiv;
        if (SAT.Environment.settings('isDAS')) {
            rowNewDiv = $('<div><div style="display: table; overflow: hidden;" class="sat-height-field"><div style="display: table-cell; vertical-align: bottom;"><span class="ic-help"></span></div></div><select class="form-control sat-height-field"></select><div class="clear"></div></div>');
        } else {
            rowNewDiv = $('<div><div style="display: table; overflow: hidden;" class="sat-height-field"><div style="display: table-cell; vertical-align: bottom;"></div></div><select class="form-control sat-height-field"></select><span class="ic-help"></span><div class="clear"></div></div>');
        }

        var entidad = Enumerable.From(FormsBuilder.XMLForm.getEntidades()).Where("$.id == {0}".format(control.idEntidadPropiedad)).FirstOrDefault();
        var atributo = Enumerable.From(entidad.propiedades.propiedad).Where("$.id == '{0}'".format(control.idPropiedad)).FirstOrDefault();

        var catalogo;
        var catalogoValorInicial;
        var titleLarge;
        var title;
        var esCatalogoPadre;
        var catalogoPadre;

        if (atributo.atributos !== undefined) {
            catalogo = Enumerable.From(atributo.atributos.atributo).Where("$.nombre == 'Catalogo'").FirstOrDefault();
            catalogoValorInicial = Enumerable.From(atributo.atributos.atributo).Where("$.nombre == 'ValorInicial'").FirstOrDefault();
            titleLarge = Enumerable.From(atributo.atributos.atributo).Where("$.nombre == 'TituloLargo'").FirstOrDefault();
            title = Enumerable.From(atributo.atributos.atributo).Where("$.nombre == 'TituloCorto'").FirstOrDefault();
            esCatalogoPadre = Enumerable.From(atributo.atributos.atributo).Where("$.nombre == 'EsCatalogoPadre'").FirstOrDefault();
            catalogoPadre = Enumerable.From(atributo.atributos.atributo).Where("$.nombre == 'CatalogoPadre'").FirstOrDefault();
        }

        var helpText = ctrlBase.getHelpText.apply(this, [control]);

        var elementAdding = '';
        if (catalogo !== undefined) {
            var catalogs = FormsBuilder.Catalogs.getAll();
            if (catalogo.valor === "122") {
                //codigo para mostrar estimulos por subregimen y por concepto, los catalogos son fijos 122 el de estimulos, 133 es de estimulos por concepto y 134 el de estimulos or subregimen
                var conceptosXEstimulos = ["0"];
                var catalogSubRegimenes = [];
                var xmlDocumento;

                var claveImpuesto = Enumerable.From(entidad.atributos.atributo).Where("$.nombre == 'ClaveImpuesto'").FirstOrDefault();
                //claveImpuesto.valor = "0119";
                if (claveImpuesto != undefined) {
                    $.each(catalogs.find('[id="{0}"]'.format("133")).find("elemento"), function(k, v) {
                        if ($(v).attr("concepto") === claveImpuesto.valor) {
                            conceptosXEstimulos.push($(v).attr("valor"));
                        }
                    });
                }

                if (!IsNullOrEmpty(FormsBuilder.XMLForm.getCopyPrecarga())) {
                    xmlDocumento = FormsBuilder.XMLForm.getCopyPrecarga();
                } else {
                    xmlDocumento = FormsBuilder.XMLForm.getCopyDeclaracion();
                }
                if (xmlDocumento != undefined) {
                    catalogSubRegimenes = xmlDocumento.find("SubRegimenes Catalogo IdCatalogo").map(function() {
                        return $(this).text();
                    }).get();
                }
                if (catalogSubRegimenes.length > 0) {
                    var catalogoEstimulosPorSubRegimen = catalogs.find('[id="{0}"]'.format("134"));
                    $.each(catalogs.find('[id="{0}"]'.format(catalogo.valor)).find("elemento"), function(k, v) {
                        var elementosValor = $(catalogoEstimulosPorSubRegimen).find('[valor="{0}"]'.format($(v).attr("valor")));
                        var subRegimenValor = [];
                        $.each(elementosValor, function(kEV, vEV) {
                            subRegimenValor.push($(vEV).attr("subregimen"));
                        });
                        var existeEnSubRegimen = false;
                        $.each(subRegimenValor, function(kSR, vSR) {
                            if ($.inArray(vSR, catalogSubRegimenes) != -1) {
                                existeEnSubRegimen = true;
                            }
                        });
                        if ($(v).attr("valor") === "0") {
                            existeEnSubRegimen = true;
                        }
                        if (($.inArray($(v).attr("valor"), conceptosXEstimulos) != -1) && (existeEnSubRegimen == true)) {
                            elementAdding += '<option value="{0}">{1}</option>'.format($(v).attr("valor"), $(v).attr(LABEL_LAYOUT));
                        }
                    });
                } else {
                    $.each(catalogs.find('[id="{0}"]'.format(catalogo.valor)).find("elemento"), function(k, v) {
                        if ($.inArray($(v).attr("valor"), conceptosXEstimulos) != -1) {
                            elementAdding += '<option value="{0}">{1}</option>'.format($(v).attr("valor"), $(v).attr(LABEL_LAYOUT));
                        }
                    });
                }
            } else {
                if (catalogoPadre == undefined) {
                    $.each(catalogs.find('[id="{0}"]'.format(catalogo.valor)).find("elemento"), function(k, v) {
                        elementAdding += '<option value="{0}">{1}</option>'.format($(v).attr("valor"), $(v).attr(LABEL_LAYOUT));
                    });
                } else {
                    var propiedades = Enumerable.From(FormsBuilder.XMLForm.getEntidades()).SelectMany("$.propiedades.propiedad").ToArray();
                    //var result=propiedades;
                    var combosPadresGeneral = Enumerable.From(propiedades).Where(function(propiedad) {
                        return Enumerable.From(propiedad.atributos.atributo).Any("$.nombre=='EsCatalogoPadre'");
                    }).ToArray();


                    var comboPadre = Enumerable.From(combosPadresGeneral).Where(function(propiedad) {
                        return Enumerable.From(propiedad.atributos.atributo).Any(
                            function(atributo) {
                                if ((atributo.nombre == 'Catalogo') && (atributo.valor == catalogoPadre.valor)) {
                                    return true;
                                }
                            }
                        );
                    }).FirstOrDefault();

                    var idValorInicialPadre = Enumerable.From(comboPadre.atributos.atributo).Where("$.nombre == 'ValorInicial'").FirstOrDefault();
                    $.each(catalogs.find('[id="{0}"]'.format(catalogo.valor)).find("elemento"), function(k, v) {
                        if ($(v).attr("idElementoCatalogoPadre") == idValorInicialPadre.valor) {
                            elementAdding += '<option value="{0}">{1}</option>'.format($(v).attr("valor"), $(v).attr(LABEL_LAYOUT));
                        }

                    });
                }
            }
        }

        rowNewDiv.find(CONTROL_LAYOUT).append(elementAdding);
        rowNewDiv.find(CONTROL_LAYOUT).attr('id', control.id);
        rowNewDiv.find("div.sat-height-field").children().attr('data-titulo-control', control.id);

        if (catalogoPadre != undefined) {
            rowNewDiv.find(CONTROL_LAYOUT).attr('catalogopadre', catalogoPadre.valor);
            rowNewDiv.find(CONTROL_LAYOUT).attr('catalogohijo', catalogo.valor);
        }

        if (SAT.Environment.settings('isDAS')) {
            var titleControl;
            if (control.atributos !== undefined) {
                titleControl = Enumerable.From(control.atributos.atributo).Where("$.nombre == 'TituloCorto'").FirstOrDefault();
            }
            title = titleControl !== undefined ? titleControl : title;
        }

        ctrlBase.noValidarCampoVacio.apply(this, [control, rowNewDiv, CONTROL_LAYOUT]);

        ctrlBase.muestraEnGrid.apply(this, [control, rowNewDiv, CONTROL_LAYOUT]);

        ctrlBase.cuentaClabe.apply(this, [control, rowNewDiv, CONTROL_LAYOUT]);

        ctrlBase.nombreBanco.apply(this, [control, rowNewDiv, CONTROL_LAYOUT]);

        ctrlBase.sinEtiqueta.apply(this, [control, rowNewDiv, title]);

        ctrlBase.textoAlineacionEtiqueta.apply(this, [control, rowNewDiv, CONTROL_LAYOUT]);

        ctrlBase.alineacionHorizontal.apply(this, [control, rowNewDiv, CONTROL_LAYOUT]);

        ctrlBase.ordenTabulador.apply(this, [control, rowNewDiv, CONTROL_LAYOUT]);

        ctrlBase.sinTitulo.apply(this, [control, rowNewDiv]);

        ctrlBase.obligatorio.apply(this, [control, rowNewDiv, CONTROL_LAYOUT]);

        ctrlBase.forzarModoEdicion.apply(this, [control, rowNewDiv, CONTROL_LAYOUT]);

        ctrlBase.sinDuplicidad.apply(this, [control, rowNewDiv, CONTROL_LAYOUT]);

        ctrlBase.copiaElementoGrid.apply(this, [control, rowNewDiv, CONTROL_LAYOUT]);

        var helpString = ctrlBase.helpString.apply(this, [titleLarge, helpText]);

        rowNewDiv.find(CONTROL_LAYOUT).attr('help-text', helpString);
        rowNewDiv.find(CONTROL_LAYOUT).attr('data-bind', 'value: {0}'.format(db_id));
        rowNewDiv.find(CONTROL_LAYOUT).attr('view-model', db_id);

        if (esCatalogoPadre != undefined) {
            if (esCatalogoPadre.valor == "1") {
                setTimeout(function() {
                    $("#{0}".format(control.id)).on('change', function() {
                        var elementosCombos = $(document).find('[catalogopadre="{0}"]'.format(catalogo.valor));
                        var valorSeleccionado = this.value;
                        $.each(elementosCombos, function(k, v) {
                            $(v).html("");
                            var catalogoId = $(v).attr("catalogohijo");
                            var elementosFiltrados = "";
                            $.each(catalogs.find('[id="{0}"]'.format(catalogoId)).find("elemento"), function(k, v) {
                                if ($(v).attr("idElementoCatalogoPadre") == valorSeleccionado) {
                                    elementosFiltrados += '<option value="{0}">{1}</option>'.format($(v).attr("valor"), $(v).attr(LABEL_LAYOUT));
                                }
                            });
                            $(v).html(elementosFiltrados);
                            $(v).trigger("change");
                        });
                        console.log("");
                    })
                }, 3000);
            }
        }

        return rowNewDiv.html();
    }
})();