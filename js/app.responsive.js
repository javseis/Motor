/** @module AppDeclaracionesSAT */
/**
* Modulo de punto de entrada de la aplicacion, que carga datos iniciales
* e inicia eventos del DOM
*
* (c) SAT 2013, Iván González
*/
/*global namespace:false, FormsBuilder:false, SAT: false, AppDeclaracionesSAT:false, ko:false, Base64:false */

"use strict";

(function () {
    namespace("AppDeclaracionesSAT", initStepThree, initProxyDivs);

    var catalogos = {};
    var numCatalogos = 0;
    var tipoPersona = '';

    var TipoDeclaracion = {
        Normal: '001'
    };
    
    function initStepThree() {
        $('#myModal').modal('show');

        Helper.Test.readJsonPlantilla(function (data) {
            loadStepThree(data);
        });
    }

    function initProxyDivs() {
        $('.sat-div-contenedores').bind("DOMSubtreeModified", function () {
            switch ($(this).attr("id")) {
                case "DVPLANFOR":
                    cargandoPaso(20);
                    SAT.Environment.setSetting('loadXMLTemplate', true);
                    if (!SAT.Environment.settings('loadXMLTemplate')) {
                        if ($(this).html() !== "") {
                            var xmlDoc = fbXmlForm.reconstructXml();
                            $(this).remove();
                            loadStepThree(xmlDoc);
                        }
                    }
                    break;

                case "DVCA01":
                    if ($(this).html() !== "") {
                        var xmlDoc = $.parseXML(Base64.decode($(this).html()));
                        $(this).remove();
                        loadCombobox(xmlDoc, 'ejercicio');
                    }
                    break;

                case "DVCA04":
                    if ($(this).html() !== "") {
                        var xmlDoc = $.parseXML(Base64.decode($(this).html()));
                        $(this).remove();
                        loadCombobox(xmlDoc, 'tipodeclaracion');
                    }
                    break;

                case "DVCA05":
                    if ($(this).html() !== "") {
                        var xmlDoc = $.parseXML(Base64.decode($(this).html()));
                        $(this).remove();
                        loadCombobox(xmlDoc, 'tipocomplementaria');
                    }
                    break;

                case "DVCA03":
                    if ($(this).html() !== "") {
                        var xmlDoc = $.parseXML(Base64.decode($(this).html()));
                        $(this).remove();
                        loadComboboxPeriodo(xmlDoc);
                    }
                    break;

                case "DVCA06":
                    if ($(this).html() !== "") {
                        var xmlDoc = $.parseXML(Base64.decode($(this).html()));
                        $(this).remove();
                        loadCombobox(xmlDoc, 'regimenes');
                    }
                    break;
                case "DVCA07":
                    if ($(this).html() !== "") {
                        var xmlDoc = $.parseXML(Base64.decode($(this).html()));
                        loadCombobox(xmlDoc, 'subregimenes', function () {
                        });
                    }
                    break;
                case "DVCA08":
                    if ($(this).html() !== "") {
                        var xmlDoc = $.parseXML(Base64.decode($(this).html()));
                        loadCombobox(xmlDoc, 'areasgeograficas', function () {
                        });
                    }
                    break;
                case "DVOFRMGRD":
                    var formularios = JSON.parse($(this).html());
                    $('.sat-list-forms ul li').remove();

                    $.each(formularios, function (k, v) {
                        var forma = $($('.tplformas').html());
                        forma.find('span').html(v.nombre);
                        forma.attr('idForma', v.idForma);

                        if ($('.sat-list-forms ul').hasClass("item-removing")) {
                            forma.find('span').append("<a class='close' idForma='{0}' forma='{1}' href='javascript:void(0);'><i class='icon-trash'></i></a>".format(v.idForma, v.nombre));
                        }

                        var element = $("<li>").append(forma);
                        element.addClass("list-group-item");

                        $('.sat-list-forms ul').append(element);
                    });

                    $('.sat-list-forms ul li a').on('dblclick', function () {
                        var operacion = {
                            operacion: "OPCARGATEMP",
                            parametros: { idForma: $(this).attr("idForma") }
                        };
                        $('#DVOPER').html(JSON.stringify(operacion));
                    });

                    $('.sat-list-forms ul li a span a.close').tooltip({ title: 'Eliminar', trigger: 'hover focus' });
                    $('.sat-list-forms ul li a span a.close').on('click', function () {
                        $("#modal-confirm-delete").modal("show");
                        $("#modal-confirm-delete #mensaje-confirmacion strong").html("{0}");
                        var mensaje = $("#modal-confirm-delete #mensaje-confirmacion").html();

                        $("#modal-confirm-delete #confimar-eleminacion").attr("idForma", $(this).attr("idForma"));
                        $("#modal-confirm-delete #mensaje-confirmacion").html(mensaje.format($(this).attr("forma")));
                    });

                    // $('.sat-list-forms ul li a span a.export').tooltip({title: 'Exportar', trigger: 'hover focus'});
                    // $('.sat-list-forms ul li a span a.export').on('click', function () {
                    //     $("#modal-confirm-export").modal("show");
                    //     $("#modal-confirm-export #mensaje-confirmacion strong").html("{0}");
                    //     var mensaje = $("#modal-confirm-export #mensaje-confirmacion").html();

                    //     $("#modal-confirm-export #confimar-exportacion").attr("idForma", $(this).attr("idForma"));
                    //     $("#modal-confirm-export #mensaje-confirmacion").html(mensaje.format($(this).attr("forma")));
                    // });

                    $('#myModal').modal('hide');
                    break;

                case "DVDECLARACIONDISCO":
                    var declaracion = $.parseXML(Base64.decode($(this).html()));

                    if (declaracion === null) break;

                    if (SAT.Environment.settings('esquemaanterior') === true) {
                        $('#myModal').modal('hide');
                        break;
                    }
                    AppDeclaracionesSAT.initGrids();
                    cargarXmlDisco(declaracion, function (camposC26) {
                        if (SAT.Environment.settings('dejarsinefecto') === true) {
                            FormsBuilder.Runtime.initFormulario();
                            $('#htmlOutput').find('[view-model]').attr("disabled", true);
                            $('.btncollapse').attr("disabled", true);
                            $('.calculoinversion').attr("disabled", true);
                            $('.calculoAmortizacion').attr("disabled", true);
                            $('.panel').find('button.btnAddCtrlGridRow, button.btnDelCtrlGridRow').attr("disabled", true);
                            $('button.btnAddFormularioGridRow, button.btnDelFormularioGridRow, button.btnCancelFormularioGridEdicionRow, button.btnSaveFormularioGridEdicionRow, button.cargaMasivaRetenciones').attr("disabled", true);

                            var declaracion = FormsBuilder.XMLForm.getCopyDeclaracion();
                            var menusOcultos = declaracion.find('entidad[ocultarmenuseccion="true"]');
                            $.each(menusOcultos, function (key, menuOculto) {
                                var panel = $('#htmlOutput .panel[identidadpropiedad="{0}"]'.format($(menuOculto).attr('id')));
                                var ancla = $('.container-submenus li a[idPanel="{0}"]'.format(panel.attr('id')));
                                ancla.parent().hide();
                            });
                        }

                        if (SAT.Environment.settings('verificarfechapagoanterioridad') === true) {
                            habilitarCamposC26(camposC26);
                        }

                        var operacion = {
                            operacion: "OPCARGADECLARACION",
                            parametros: {}
                        };
                        $('#DVOPER').html(JSON.stringify(operacion));
                    });
                    break;

                case "DVDAPREFOR":
                    var precarga = $.parseXML(Base64.decode($(this).html()));
                    precargaInformacion(precarga, AppDeclaracionesSAT.initGrids);
                    break;

                case "DVDAPREFORCOMP":
                    var precarga = $.parseXML(Base64.decode($(this).html()));
                    AppDeclaracionesSAT.setConfig('complementaria', 'true');
                    precargaInformacionComplementaria(precarga);
                    break;

                case "DVACUSE":
                    var urlAcuse = Base64.decode($(this).html());
                    $('#acuse').attr('src', urlAcuse);
                    break;

                case "DVINFOCON":
                    var infoContribuyente = JSON.parse($(this).html());
                    for (var prop in infoContribuyente) {
                        AppDeclaracionesSAT.setConfig(prop, infoContribuyente[prop]);
                    }

                    $('#nombreContribuyente').html(infoContribuyente.nombre);
                    $('#rfc').html(infoContribuyente.rfc);
                    tipoPersona = infoContribuyente.tipopersona;

                    SAT.Environment.setSetting('tipopersona', tipoPersona);
                    SAT.Environment.setSetting('forma', infoContribuyente.forma);

                    if (AppDeclaracionesSAT.getConfig('tipocomplementaria') === AppDeclaracionesSAT.getConst('TipoComplementariaDejarSinEfecto')) {
                        console.log('Dejar sin efecto');

                        SAT.Environment.setSetting('dejarsinefecto', true);
                    }

                    if (AppDeclaracionesSAT.getConfig('tipocomplementaria') === AppDeclaracionesSAT.getConst('TipoComplementariaEsquemaAnterior') &&
                        AppDeclaracionesSAT.getConfig('tipodeclaracion') === AppDeclaracionesSAT.getConst('TipoDeclaracionComplementaria')) {
                        console.log('Esquema anterior');

                        SAT.Environment.setSetting('esquemaanterior', true);
                    }

                    if (AppDeclaracionesSAT.getConfig('tipocomplementaria') === AppDeclaracionesSAT.getConst('TipoComplementariaDejarSinEfecto') ||
                        AppDeclaracionesSAT.getConfig('tipocomplementaria') === AppDeclaracionesSAT.getConst('TipoComplementariaModificacionObligaciones')) {

                        SAT.Environment.setSetting('verificarfechapagoanterioridad', true);
                    }

                    //var encabezado = generarEncabezado(infoContribuyente);

                    //$('.info-declara b').text(encabezado);

                    var operacion = {
                        operacion: "OPINFOCONCAR",
                        parametros: {}
                    };
                    $('#DVOPER').html(JSON.stringify(operacion));
                    break;

                case "DVRFCCOMBO":
                    if ($(this).html() !== "") {
                        var formularios = JSON.parse($(this).html());

                        var elementAdding = '';

                        $.each(formularios, function (k, v) {
                            elementAdding += '<option value="{0}">{1}</option>'.format($(v).attr("id"), $(v).attr("descripcion"));
                        });

                        $('#rfcCombo').html(elementAdding);
                    }
                    break;

                case "DVINFOALERTCLIENT":
                    if (IsNullOrEmpty($(this).html())) return;

                    var alertObject = JSON.parse($(this).html());

                    $("#modalAlertClient div.modal-body").html(alertObject.mensaje);
                    $("#modalAlertClient div.modal-footer button").click(function () {
                        var operacion = {
                            operacion: "OPERALERTERROR",
                            parametros: { origen: alertObject.origen }
                        };
                        $('#DVOPER').html(JSON.stringify(operacion));
                        $("#modalAlertClient").modal('hide');
                    });

                    $("#modalAlertClient").modal('show');
                    break;

                case "DVCONFSOBREESC":
                    if (IsNullOrEmpty($(this).html()) || $(this).html() == '-') return;

                    $("#modal-confirm-delete").modal("show");
                    $("#modal-confirm-delete #confimar-eleminacion").attr("respuesta", "SI");
                    $(this).html('-')
                    break;

               
               
            }
        });
    }

    function loadStepThree(data) {
        var reading = function () {
            Helper.Test.readPrecarga(function (precargaXml) {
                precargaInformacion(precargaXml, AppDeclaracionesSAT.initGrids);
            });

            // Helper.Test.readDeclaracion(function(dataDeclaracion) {
            //     AppDeclaracionesSAT.initGrids();
            //
            //     cargarXmlDisco(dataDeclaracion, function(camposC26) {
            //         if (SAT.Environment.settings('dejarsinefecto') === true) {
            //            FormsBuilder.Runtime.initFormulario();
            //
            //             $('#htmlOutput').find('[view-model]').attr("disabled", true);
            //             $('.btncollapse').attr("disabled", true);
            //             $('.panel').find('button.btnAddCtrlGridRow, button.btnDelCtrlGridRow').attr("disabled", true);
            //             $('button.btnAddFormularioGridRow, button.btnDelFormularioGridRow, button.btnCancelFormularioGridEdicionRow, button.btnSaveFormularioGridEdicionRow').attr("disabled", true);
            //         }
            //
            //         if (SAT.Environment.settings('verificarfechapagoanterioridad') === true) {
            //             var isTemporal = false;// Establecer para emular dejarsinefecto/modificacionobligaciones nuevas o temporales
            //             habilitarCamposC26(camposC26, isTemporal);
            //         }
            //
            //         console.log('Carga de XML');
            //    });
            // });
           
            if (SAT.Environment.settings('dejarsinefecto') === false) {
                $('#htmlOutput').find('input[ForzarModoEdicion], select[ForzarModoEdicion]').attr("disabled", false);
            }

            if (SAT.Environment.settings('esquemaanterior') === true) {
                $('#myModal').modal('hide');
            }

            var operacion = {
                operacion: "OPCARGOPLT",
                parametros: {}
            };
            $('#DVOPER').html(JSON.stringify(operacion));

            if (AppDeclaracionesSAT.getConfig('readonly') === true) {
                console.log('Quitar elementos de navegación.');
                setTimeout(function () {
                    $('.guardardeclaracion, .btnEditFormularioGridEdicionRow, .btnDeleteFormularioGridEdicionRow, .btnDelCtrlGridRow, .btnAddCtrlGridRow, .calculoAmortizacion, .calculoinversion, .btnSaveFormularioGridEdicionRow, .btnCancelFormularioGridEdicionRow, .cargaMasivaRetenciones, .btnAddFormularioGridRow, .btnDelFormularioGridRow, .sat-button-dialog, #btnEnviarDeclara, #btnRevisionDeclara, #btnRegresaPerfil').addClass('hide');
                    $('input, select').attr('disabled', 'disabled');
                }, 4000);
            }

            console.log("all loaded!");
        };

        var initializingRuntime = function () {
            setTimeout(function () {
                FormsBuilder.Runtime.init(data.reglas, reading);
            }, 250);
        };

        var initializingUI = function () {
            setTimeout(function () {
                //cargandoPaso(70);
                AppDeclaracionesSAT.initUIStepThree(initializingRuntime);
            }, 250);
        };

        var rendering = function (domString) {
            $('#htmlOutput').html(domString);

            if (SAT.Environment.settings('dejarsinefecto') === true) {
                SAT.Environment.setSetting('applyrulesvalidation', false);
                $('#htmlOutput').find('[view-model]').attr("disabled", true);
            }

            FormsBuilder.ViewModel.applyDataBindings(initializingUI);
        };

        FormsBuilder.ViewModel.init(data.modeloDatos, 
          FormsBuilder.Parser.parseJson(data, rendering)          
        );
    }

    function precargaInformacion(data, callback) {
        console.log('precarga normal');

        if (data == null || data == undefined)
            return;

        FormsBuilder.XMLForm.copyPrecarga(data);
        FormsBuilder.Runtime.runInitRules();

        AppDeclaracionesSAT.setConfig("deshabilitarDialogos", true);

        if (SAT.Environment.settings('dejarsinefecto') === false) {
            $('#htmlOutput').find('input[ForzarModoEdicion], select[ForzarModoEdicion]').attr("disabled", false);
        }

        var listValores = [];
        var valores = $(data).find('DatosContribuyente').children('*').not('DatosAnexoPersonaFisica');
        $.each(valores, function (k, v) {
            if ($(v).children().length > 0) {
                var childs = $(v).children('[claveInformativa]');
                $.each(childs, function (key, child) {
                    listValores.push(child);
                });
            } else {
                if ($(v).attr('claveInformativa') !== undefined) {
                    listValores.push(v);
                }
            }
        });

        $.each(listValores, function (key, valor) {
            var rule = FormsBuilder.ViewModel.getFieldsForExprs()["$" + $(valor).attr('claveInformativa')];
            if (rule !== undefined) {
                var db_id = "E{0}P{1}".format(rule.entidad, rule.propiedad);
                FormsBuilder.ViewModel.get()[(db_id.split('P')[0]).replace('E', '')][db_id]($(valor).text());
            }
        });

        if (callback && typeof (callback) == "function") {
            callback();
        }

        var entidadNoVisible = [];
        var subRegimenSugerido = [];

        if (AppDeclaracionesSAT.getConfig('forma') === 'new' &&
            ((AppDeclaracionesSAT.getConfig('tipodeclaracion') === AppDeclaracionesSAT.getConst('TipoDeclaracionNormal') ||
            AppDeclaracionesSAT.getConfig('tipodeclaracion') === AppDeclaracionesSAT.getConst('TipoDeclaracionNormalCorrecionFiscal')) ||
            AppDeclaracionesSAT.getConfig('esSelector') === true &&
            AppDeclaracionesSAT.getConfig('tipodeclaracion') === AppDeclaracionesSAT.getConst('TipoDeclaracionComplementaria') ||
             AppDeclaracionesSAT.getConfig('esSelector') === true &&
            AppDeclaracionesSAT.getConfig('tipodeclaracion') === AppDeclaracionesSAT.getConst('TipoDeclaracionComplementariaCorrecionFiscal') ||
             AppDeclaracionesSAT.getConfig('esSelector') === true &&
            AppDeclaracionesSAT.getConfig('tipodeclaracion') === AppDeclaracionesSAT.getConst('TipoDeclaracionComplementariaDictamen')
            )) {

            var datosAnexoSubRegimenSugerido = $(data).find('DatosGenerales').find('Regimenes');
            $.each(datosAnexoSubRegimenSugerido, function (key, subRegimen) {
                var idSubRegimen = $(subRegimen).find('Regimen').find('ClaveRegimen').text();
                subRegimenSugerido.push(idSubRegimen);
            });

            var datosAnexoPersonaFisica = $(data).find('DatosAnexoPersonaFisica').find('[idEntidad]');
            var xmlFormulario = FormsBuilder.XMLForm.getCopy();

            $.each(datosAnexoPersonaFisica, function (key, datoFisica) {
                var entidad = $(datoFisica).attr('idEntidad');

                var controlEntidad = xmlFormulario.find('formulario').children('controles').children('[idEntidadPropiedad="{0}"]'.format(entidad)).attr('id');

                var idSubregimen = xmlFormulario.find('agrupador').find('[idControlFormulario="{0}"]'.format(controlEntidad)).parent().attr('idSubRegimen');

                if (idSubregimen != undefined) {
                    if (entidadNoVisible.indexOf(idSubregimen) === -1) {
                        entidadNoVisible.push(idSubregimen);
                    }
                }
            });
        }

        if (tipoPersona === 'F') {
            var xmlCopy = FormsBuilder.XMLForm.getCopy();
            var navegacion = xmlCopy.find('navegacion > agrupador');
            $.each(navegacion, function (key, agrupador) {
                $(agrupador).find('seccion').each(function (key, seccion) {
                    var idEntidad = xmlCopy.find('diagramacion formulario controles').children('control[id="{0}"]'.format($(seccion).attr('idControlFormulario'))).attr('idEntidadPropiedad');
                    FormsBuilder.ViewModel.getFlujoSecciones()[idEntidad]['NoVisible'] = false;
                });
            });

            if (datosAnexoPersonaFisica !== undefined && datosAnexoPersonaFisica.length > 0) {
                if (AppDeclaracionesSAT.getConfig('esSelector') === true) {
                    setTimeout(function () {
                        AppDeclaracionesSAT.precargaAnexoPersonaFisica(function () {

                            if (AppDeclaracionesSAT.getConfig('forma') === 'new' &&
                              (AppDeclaracionesSAT.getConfig('tipodeclaracion') === AppDeclaracionesSAT.getConst('TipoDeclaracionNormalCorrecionFiscal') ||
                                   AppDeclaracionesSAT.getConfig('esSelector') === true &&
                                   AppDeclaracionesSAT.getConfig('tipodeclaracion') === AppDeclaracionesSAT.getConst('TipoDeclaracionComplementaria') ||
                                   AppDeclaracionesSAT.getConfig('esSelector') === true &&
                                   AppDeclaracionesSAT.getConfig('tipodeclaracion') === AppDeclaracionesSAT.getConst('TipoDeclaracionComplementariaCorrecionFiscal') ||
                                   AppDeclaracionesSAT.getConfig('esSelector') === true &&
                                   AppDeclaracionesSAT.getConfig('tipodeclaracion') === AppDeclaracionesSAT.getConst('TipoDeclaracionComplementariaDictamen')
                              )) {
                                obtenerCamposC26(FormsBuilder.ViewModel.createXml(), function (camposC26) {
                                    habilitarCamposC26(camposC26, false);
                                    setTimeout(function () {
                                        // Se agregó el click en la ruta selector.
                                        $('.topmenu li:last').click();
                                        $('#myModal').modal('hide');
                                        AppDeclaracionesSAT.setConfig("deshabilitarDialogos", false);
                                    }, 250);
                                });
                            }

                            else {
                                setTimeout(function () {
                                    // Se agregó el click en la ruta selector.
                                    $('.topmenu li:last').click();
                                    $('#myModal').modal('hide');
                                    AppDeclaracionesSAT.setConfig("deshabilitarDialogos", false);
                                }, 250);
                            }
                        });
                    }, 1000);
                } else {
                    $('#modalAvisoPreCarga').modal('show');
                    AppDeclaracionesSAT.setConfig("deshabilitarDialogos", false);
                }
            } else {
                if (parseInt(FormsBuilder.XMLForm.getCopyPrecarga().find('[claveInformativa="57"]').text()) === 1 && AppDeclaracionesSAT.getConfig('esSelector') !== true) {
                    $('#modalAvisoNoPreCarga').modal('show');
                }

                AppDeclaracionesSAT.setConfig("deshabilitarDialogos", false);               
            }

            setTimeout(function () {
                if (AppDeclaracionesSAT.getConfig('esSelector') === true)
                    $('.topmenu li:last').click();
                else {
                    // $('.topmenu li:visible:first').click();
                    $('.submenu li').each(function (k, v) {
                        if ($(v).hasClass('hidden') === false) {
                            var idSubmenu = $(v).parents().eq(2).attr('idsubmenu');
                            var idTab = $('.tabsmenu a[idsubmenu="{0}"]'.format(idSubmenu)).parents().eq(1).attr('idtab');
                            $('.topmenu a[idTab="{0}"]'.format(idTab)).click();
                            return false;
                        }
                    });
                }

                setTimeout(function () {



                    $('#myModal').modal('hide');



                }, 100);
            }, 250);
        }

        fbUtils.applyFormatCurrencyOnElement($("#htmlOutput"), true);

        if (IsNullOrEmptyOrZero(document.referrer) === false) {
            if (document.referrer.split('/')[4].split('?')[0] == 'StepPerfil'
                || document.referrer.split('/')[4].split('?')[0] == 'Install') {
                reiniciaSession();
                $('.submenu li').each(function (k, v) {
                    if ($(v).hasClass('hidden') === false) {
                        var idSubmenu = $(v).parents().eq(2).attr('idsubmenu');
                        var idTab = $('.tabsmenu a[idsubmenu="{0}"]'.format(idSubmenu)).parents().eq(1).attr('idtab');
                        $('.topmenu a[idTab="{0}"]'.format(idTab)).click();
                        return false;
                    }
                });
                //var xml = FormsBuilder.ViewModel.createXml();
                //var encodeXmlResult = Base64.encode(xml);
                //$('#DVDECLARACION').html(encodeXmlResult);

            }
        }
    }
})();
