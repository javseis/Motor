/** @module AppDeclaracionesSAT */
/**
 * Modulo que inicia la UI principal
 *
 * (c) SAT 2013, Iván González
 */
/*global namespace:false, FormsBuilder:false, SAT: false, AppDeclaracionesSAT:false, ko:false, Base64:false */

"use strict";

(function () {
    namespace("AppDeclaracionesSAT", initUIStepThree, initStateForm, initGrids, resetCursorInputCurrency, ajustarAnchoTabs,
        showHelpDialog, helpIconMobile, helpIcon, helpIconPopover, cargarClabesBancarias, validaErroresSecciones, tabMenuClick,
        obtenerElementosVisibles, cambiarSeccion, mostrarMensajeModal);

    var precarga = false;
    // Crea un nuevo registros en los grids sin valores
    function initGrids() {

        console.log(">>>> Inicia 'AppDeclaracionesSAT.initGrids'");

        if (AppDeclaracionesSAT.getConfig("forma") === "new" || (AppDeclaracionesSAT.getConfig("forma") === "tmp" && AppDeclaracionesSAT.getConfig("tipodisco") === "vigente")) {
            precarga = true;
        }

        FormsBuilder.Modules.loadedUI();
        FormsBuilder.Modules.loadedUICompensaciones();
        FormsBuilder.Modules.loadedUIFormularioGridEdicion();
        FormsBuilder.Modules.loadedUICuadroModal();
        FormsBuilder.Modules.loadedUIGridCfdi();
        FormsBuilder.Modules.loadedUIClasificador2018();

        if (AppDeclaracionesSAT.getConfig("forma") !== "tmp") {
            $(".panel").find("button.btnAddCtrlGridRow:first").click();
            $(".panel").find("button.btnAddFormularioGridEdicionRow:first").click();
        }

        //if (!SAT.Environment.settings('isDAS')) {
        //    FormsBuilder.Modules.loadedUI();
        //    FormsBuilder.Modules.loadedUICompensaciones();
        //    FormsBuilder.Modules.loadedUIControlesGrid();
        //    FormsBuilder.Modules.loadedUIControlesGridRetenciones();
        //    FormsBuilder.Modules.loadedUICalculoIngresoExento();
        //    FormsBuilder.Modules.loadedUIFormularioGridEdicion();
        //    FormsBuilder.Modules.loadedUIPanelDinamico();
        //    FormsBuilder.Modules.loadedUIFormularioGrid();

        //    if (AppDeclaracionesSAT.getConfig('forma') !== 'tmp') {
        //        $('.panel').find('button.btnAddCtrlGridRow:first').click();
        //        $('.panel').find('button.btnAddFormularioGridEdicionRow:first').click();
        //    }
        //} else {
        //    FormsBuilder.Modules.loadedUIFormularioGridEdicion();
        //    FormsBuilder.Modules.loadedUICompensaciones();
        //    if (AppDeclaracionesSAT.getConfig('forma') !== 'tmp') {
        //        $('.panel').find('button.btnAddFormularioGridEdicionRow:first').click();
        //    }
        //}

        if (precarga) {
            cargarClabesBancarias();
        }

        //if (SAT.Environment.settings('isDAS')) {
        $("a.sat-button-dialog").attr("disabled", false);

        //}

        eliminarBotonesDeCalculo();
    }

    ko.observable.fn.withPausing = function () {
        this.notifySubscribers = function () {
            if (!this.pauseNotifications) {
                ko.subscribable.fn.notifySubscribers.apply(this, arguments);
            }
        };

        this.sneakyUpdate = function (newValue) {
            this.pauseNotifications = true;
            this(newValue);
            this.pauseNotifications = false;
        };

        return this;
    };

    ko.bindingHandlers.radio = {
        init: function (element, valueAccessor, allBindings) {
            var $buttons, $element, elementBindings, observable;
            observable = valueAccessor();
            if (!ko.isWriteableObservable(observable)) {
                throw "You must pass an observable or writeable computed";
            }
            $element = $(element);
            if ($element.hasClass("btn")) {
                $buttons = $element;
            } else {
                $buttons = $(".btn", $element);
            }
            elementBindings = allBindings();
            $buttons.each(function () {
                var $btn, btn, radioValue;
                btn = this;
                $btn = $(btn);
                radioValue = elementBindings.radioValue || $btn.attr("data-value") || $btn.attr("value") || $btn.text();
                $btn.on("click", function () {
                    if (!$(this).hasClass("active")) {
                        observable(ko.utils.unwrapObservable(radioValue));
                    } else {
                        $(this).removeClass("active");
                        observable("");
                    }
                });
                return ko.computed({
                    disposeWhenNodeIsRemoved: btn,
                    read: function () {
                        $btn.toggleClass("active", observable() === ko.utils.unwrapObservable(radioValue));
                    }
                });
            });
        }
    };

    function initUIStepThree(callback) {

        console.log(">>>> inicia 'AppDeclaracionesSAT.initUIStepThree'");




        $(".topmenu > li").on("click", function () {
            $("#htmlOutput .panel[class*=\"current\"]").hide();

            $(".submenu").addClass("hide");
            $(".topmenu > li > a").removeClass("selected");

            $(this).find("a").addClass("selected");

            var idTab = $(this).find("a").attr("idTab");

            $(this).parents().eq(1).find(".tabsmenu").addClass("hide");
            $(this).parents().eq(1).find(".tabsmenu > li").removeClass("active");
            $(this).parents().eq(1).find(".tabsmenu[idTab=\"{0}\"]".format(idTab)).removeClass("hide");
            $(this).parents().eq(1).find(".tabsmenu[idTab=\"{0}\"] > li:first".format(idTab)).click();
        });

        $(".tabsmenu > li").on("click", function () {
            $("#htmlOutput .panel[class*=\"current\"]").hide();

            $(".tabsmenu > li").removeClass("active");

            $(this).addClass("active");

            var idSubmenu = $(this).find("a").attr("idSubmenu");

            $(".submenu").addClass("hide");
            $(".submenu[idSubmenu=\"{0}\"]".format(idSubmenu)).removeClass("hide");
            $(".submenu[idSubmenu=\"{0}\"] li:visible:first > a:first".format(idSubmenu)).click();
        });

        $(".submenu li").on("click", function () {
            $(".submenu li").removeClass("active");
            $(".submenu li > a").removeClass("active");
            $(this).addClass("active");
            $(this).find("a").addClass("active");

            checkMassive("massives", $(this).find("a:first").attr("idpanel"));

        });

        $(".headerbtns a").focus(function () {
            setTimeout(function () {
                fbUtils.setDecimalsElement();
            }, 1);
        });

        $(window).blur(function () {
            setTimeout(function () {
                fbUtils.setDecimalsElement();
            }, 1);
        });

        $("#home").focus(function () {
            setTimeout(function () {
                fbUtils.setDecimalsElement();
            }, fbUtils.getMs());
        });

        $(window).click(function () {
            setTimeout(function () {
                fbUtils.setDecimalsElement();
                window.lastElement = $("#htmlOutput").find("[view-model]:first");
            }, fbUtils.getMs());
        });
        $("[ColumnasFixed]").find(".form-control").css("width", "80%").attr("columnaFixed", "true");

        //if (!SAT.Environment.settings('isDAS'))
        //    FormsBuilder.Calculo.Amortizacion.loadedUI();

        $(".informacion-declaracion").html("Versión {0}".format(SAT.Environment.settings("appversion")));

        $("[ayudaEnDialogo]").focus(showHelpDialog);

        $("#htmlOutput").find("input[view-model]").focus(function () {
            var that = this;

            console.log("$('#htmlOutput').find('input[view-model]').focus");

            //setTimeout(function() {
            fbUtils.setDecimalsElement();
            if ($(that).hasClass("currency")) {
                // if (window.lastElement) {
                //     if (window.lastElement.attr('view-model') !== $(document.activeElement).attr('view-model')) {
                $(that).toNumber();
                //     }
                // }
            }
            //}, fbUtils.getMs());
        });

        $(".currency").blur(function () {
            window.lastElement = $(this);
        });

        resetCursorInputCurrency();

        if ($(window).height() > 710) {
            $(".sat-container-main .row-form").css("height", "{0}px".format($(window).height() - 285));
            $(".sat-container-main .panel-sections").css("height", "{0}px".format($(window).height() - 285));
        }
        $(".sat-container-main").width(parseInt($(window).width()) - 85);
        $(window).resize(function () {
            $(".sat-container-main").width(parseInt($(window).width()) - 85);
        });

        $(".row-form").scroll(function () {
            $("#htmlOutput").find("i").popover("hide");
            $("#htmlOutput").find(".popover").remove();
        });


        $("#htmlOutput span.ic-help").each(helpIconMobile);


        $("#btnRevisionDeclara").on("click", function () {
            var currentPanel = $(".submenu a.active");
            var gridsEntidad = $(".sat-container-formgridedicion[entidad={0}]".format(idEntidad));
            var idPanel = $(currentPanel).attr("idPanel");

            if (idPanel !== undefined) {
                var seccion = $("#htmlOutput .panel[id=\"{0}\"]".format(idPanel));
                var idEntidad = $(seccion).attr("identidadpropiedad");

                if (gridsEntidad.length > 0) {
                    if (FormsBuilder.Modules.getModeGrid() === "new") {
                        console.log("Cancelo con entidad ", idEntidad);
                        $(".btnCancelFormularioGridEdicionRow").click();
                    }
                }
            }
            setTimeout(function () {
                if (FormsBuilder.Utils.hasAllQueueRules() === true ||
                    SAT.Environment.settings("isHydrate") === true) {
                    console.log("Aun existe reglas en ejecución");
                    return;
                }

                setTimeout(function () {

                    if (validaErroresSecciones()) {
                        $("#modalErroresEnSecciones").modal("show");
                        return;
                    }

                    var xml = FormsBuilder.ViewModel.createXml();
                    var encodeXmlResult = Base64.encode(xml);
                    $("#DVDECLARACION").html(encodeXmlResult);

                    //var monto = 0;
                    //if (!SAT.Environment.settings('isMobile')) {
                    //    monto = $('.topay > span:last').html().substring(1, $('.topay span:last').html().length)
                    //}
                    var operacion = {
                        operacion: "OPENVIADOSF",
                        parametros: {
                            //monto: !SAT.Environment.settings('isDAS') ? $('.topay > span:last').html().substring(1, $('.topay span:last').html().length) : $('#1008017').val(),
                            monto: $("#1008017").val(),
                        }
                    };
                    $("#DVOPER").html(JSON.stringify(operacion));
                }, 800);
            }, 800);
        });

        $.each($("input[mascara]"), function () {
            $(this).mask($(this).attr("mascara"));
        });


        $("#modalYesNoSeccion .si").on("click", function () {
            var db_id = "";
            SAT.Environment.setSetting("applyrulesvalidation", false);

            var idSeccion = $("#modalYesNoSeccion input[type=\"hidden\"]").val();

            var seccion = $("#htmlOutput .panel[id=\"{0}\"]".format(idSeccion));
            var inputs = seccion.find("input[type=\"text\"]");
            $.each(inputs, function (k, input) {
                db_id = $(input).attr("view-model");
                FormsBuilder.ViewModel.get()[(db_id.split("P")[0]).replace("E", "")][db_id]("");
            });

            var combos = seccion.find("select");
            $.each(combos, function (k, combo) {
                db_id = $(combo).attr("view-model");
                FormsBuilder.ViewModel.get()[(db_id.split("P")[0]).replace("E", "")][db_id]("");
            });
            seccion.attr("saltado", "true");
            seccion.hide();

            FormsBuilder.ViewModel.getFlujoSecciones()[seccion.attr("identidadpropiedad")]["NoAplica"] = true;

            $("#modalYesNoSeccion").modal("hide");
        });

        $(".guardardeclaracion").on("click", function () {
            var that = this;
            if (FormsBuilder.Utils.hasAllQueueRules() === true) {
                console.log("Aun existe reglas en ejecución");
                setTimeout(function () {
                    $(that).popover("destroy");
                    $(that).popover({
                        trigger: "manual",
                        content: "Existen reglas ejecutándose, inténtelo nuevamente.",
                        placement: "bottom",
                    }).popover("show");
                    setTimeout(function () {
                        $(that).popover("hide");
                    }, 1000 * 6);
                }, 1000);

                return;
            }
            guardarDeclaracion(true);
        });

        var mostrarModalValidando = function (callback, generarFacturas) {
            if (callback && typeof callback === "function") {
                $("#modalValidando").unbind("shown.bs.modal");
                $("#modalValidando").modal("show");
                $("#modalValidando").on("shown.bs.modal", function () {
                    callback();

                    if (SAT.Environment.settings("isModified") === true) {
                        if (FormsBuilder.Utils.hasAllQueueRules() === true) {
                            console.log("Aun existe reglas en ejecución");
                        } else {
                            console.log(">>>> guardarDeclaracion()");
                            guardarDeclaracion(generarFacturas);
                        }
                    }

                    $("#modalValidando").modal("hide");
                });
            }
        };

        $(".topmenu [data-titulo-seccion] a").on("click", function () {
            var seccionValidar = $(this).parents("[id^='sectioncontainer']").find("[id*='maincontainer'].active, [id*='maincontainer'].in");
            var seccionSeleccionada = $($(this).attr("href"));
            mostrarModalValidando(function () {
                cambiarSeccion(seccionValidar, seccionSeleccionada);
            });
        });

        $("[data-titulo-grupo] a").on("click", function () {
            var grupoValidar = $(this).parents("[idtab]").find("[id*='group'].panel-collapse.in");
            mostrarModalValidando(function () {
                cambiarGrupo(grupoValidar);
            });
        });

        $("a[data-titulo-menu]").on("click", function () {
            var TAB_DEDUCCIONES = "tabDeducciones";
            var linkTab = $(this).attr("href");
            var menuValidar = $("[idtab].active.in");

            if ((linkTab === "#tabDeterminacion" || linkTab === "#tabPago") &&
                (SAT.Environment.settings("isProposal") === false)) {
                $("#btnRevisionDeclara, #btnEnviarDeclara").show();
            } else {
                $("#btnRevisionDeclara, #btnEnviarDeclara").hide();
            }

            mostrarModalValidando(function () {
                cambiarMenu(menuValidar);
            }, menuValidar.attr("id") === TAB_DEDUCCIONES);
            if ((linkTab === "#tabDeducciones" || linkTab === "#tabIngresos") && SAT.Environment.settings("isSimulador") === true) {
                $("#modalAvisoSim").modal("show");
            }
        });

        $("#closeAvisoSim").click(function () {
            $("#modalAvisoSim").modal("hide");
        });

        $("#modalSeccionSaltada").find(".si").on("click", function () {
            var idPanel = $("#modalSeccionSaltada input[type=\"hidden\"]").val();
            var panel = $("#htmlOutput .panel[id=\"{0}\"]".format(idPanel));

            panel.attr("saltado", "");

            FormsBuilder.ViewModel.getFlujoSecciones()[panel.attr("identidadpropiedad")]["NoAplica"] = false;

            cambiarSeccion(idPanel);

            var entidades = FormsBuilder.XMLForm.getEntidades();
            var entidadPanel = Enumerable.From(entidades).Where("$.id == '{0}'".format(panel.attr("identidadpropiedad"))).FirstOrDefault();
            //$(xmlCopy).find('entidad[id="{0}"]'.format($('#htmlOutput .panel[id="{0}"]'.format(idPanel)).attr("identidadpropiedad")));
            $.each(entidadPanel.propiedades, function (key, propiedad) {
                var reglas = FormsBuilder.XMLForm.getReglas();
                var reglasPropiedad = Enumerable.From(reglas.reglas).Where("$.idPropiedadAsociada == '{0}'".format(propiedad.id)).ToArray();
                //$(xmlCopy).find('definicionReglas regla[idPropiedadAsociada="{0}"]'.format($(propiedad).attr('id')));
                $.each(reglasPropiedad, function (key, regla) {
                    if (regla.tipoRegla === "Calculo") {
                        FormsBuilder.ViewModel.Calculo(regla);
                    }
                });
            });

            $("#modalSeccionSaltada").modal("hide");
        });

        $(".calculoinversion").on("click", function () {
            var fieldsToTransfer = $(this).attr("campos");
            FormsBuilder.Modules.loadedCuadroDeduccionInversion(function () {
                FormsBuilder.Modules.showCuadroDeduccionInversion(fieldsToTransfer);
            });
            if (!FormsBuilder.Modules.isVisibleCuadroDeduccionInversion()) {
                FormsBuilder.Modules.showCuadroDeduccionInversion(fieldsToTransfer);
            }
        });

        $("#modalAvisoPreCarga .si").on("click", function () {
            AppDeclaracionesSAT.precargaAnexoPersonaFisica(function () {
                setTimeout(function () {
                    $(".topmenu li:first").click();
                    $("#myModal").modal("hide");

                    //if (SAT.Environment.settings('isDAS')) {
                    SAT.Environment.setSetting("isHydrate", false);

                    // if (SAT.Environment.settings('isMobile')) {
                    //     var panelCollapse = $('div.ficha-collapse[identidadpropiedad="1005"]').find('.panel-collapse');
                    //     panelCollapse.collapse('show');
                    // }
                    //}
                }, 250);
            });
        });

        $("#modalSeccion .si").on("click", function () {
            $("#modalSeccion .modal-body").empty();
        });

        $("#modalSeccion").on("hidden.bs.modal", function () {
            $("#modalSeccion .modal-body").empty();
        });

        $(".panelalert i").click(function () {
            var entidad = $(this).attr("entidad");
            var promise;
            var controles = FormsBuilder.XMLForm.getControles();
            var controlFormulario = Enumerable.From(controles).Where("$.control.idEntidadPropiedad == '{0}'".format(entidad)).FirstOrDefault();
            //xmlCopy.find('formulario > controles').children('control[idEntidadPropiedad="{0}"]'.format(entidad)).attr('id');            
            var navegacion = FormsBuilder.XMLForm.getNavegacion();
            var secciones = Enumerable.From(navegacion.agrupador).SelectMany("$.seccion").ToArray();
            var seccionJson = Enumerable.From(secciones).Where("$.idControlFormulario == '{0}'".format(controlFormulario.id)).FirstOrDefault();
            //xmlCopy.find('navegacion seccion[idControlFormulario="{0}"]'.format(ctrlId));
            if (!seccionJson) {
                if (seccionJson.ocultar == 1) {
                    return;
                }
            }

            var idPanel = FormsBuilder.Parser.getSeccionesUI(entidad);
            if (idPanel === undefined) {
                var entidadPadre = $(".sat-container-formgrid[entidad=\"{0}\"]".format(entidad)).find("div[entidadpadre]").attr("entidadpadre");
                idPanel = FormsBuilder.Parser.getSeccionesUI(entidadPadre);
            }
            var agrupador = Enumerable.From(navegacion.agrupador).Where("$.idEntidadPropiedad == '{0}'".format(entidad)).FirstOrDefault();
            //xmlFormulario.find('agrupador').find('[idControlFormulario="{0}"]'.format(controlEntidad)).parent().attr('idTipoAgrupador');

            var topMenu = $(".topmenu li > a[idTab=\"{0}\"]".format(agrupador.idTipoAgrupador));
            var seccion = $(".container-submenus li a[idPanel=\"{0}\"]".format(idPanel));
            var subMenu = $(".containerTabs li a[idSubmenu=\"{0}\"]".format(seccion.parents().eq(3).attr("idSubmenu")));

            if (topMenu.hasClass("selected")) {
                if (subMenu.parent().hasClass("active")) {
                    if (!seccion.hasClass("active")) {
                        setTimeout(function () {
                            seccion.click();
                        }, 250);
                    }
                } else {
                    promise = $.when(subMenu.parent().click());
                    promise.done(function () {
                        if (!seccion.hasClass("active")) {
                            setTimeout(function () {
                                seccion.click();
                            }, 250);
                        }
                    });
                }
            } else {
                promise = $.when(topMenu.parent().click());
                promise.done(function () {
                    setTimeout(function () {
                        var promiseSubMenu = $.when(subMenu.parent().click());
                        promiseSubMenu.done(function () {
                            setTimeout(function () {
                                seccion.click();
                            }, 250);
                        });
                    }, 250);
                });
            }
        });



        callback();

        $(".panel-collapse").on("show.bs.collapse", function () {
            var self = this;
            $(".panel-collapse").each(function (k, v) {
                if ($(v).parent().attr("identidadpropiedad") !== $(self).parent().attr("identidadpropiedad")) {
                    if ($(v).hasClass("in")) {
                        $(v).collapse("hide");
                        if (SAT.Environment.settings("isModified") === true) {
                            if (FormsBuilder.Utils.hasAllQueueRules() === true) {
                                console.log("Aun existe reglas en ejecución");
                            } else {
                                if (typeof Service !== "undefined") {
                                    Service.Test.almacenarDeclaracionTemporalDas(false, "");
                                }
                            }
                        }
                    }
                }
            });
        });

        $(".panel-collapse").on("shown.bs.collapse", function () {
            if (SAT.Environment.settings("isMobile") &&
                //SAT.Environment.settings('isDAS') &&
                AppDeclaracionesSAT.getConfig("forma") === "new" &&
                precarga === true) {
                if ($(this).parent().attr("identidadpropiedad") === "1005") {
                    var anclaIngresos = $(this).find("a.ancla-tabla");
                    fbUtils.jump(anclaIngresos[0]);
                }
            }
        });

        var iconosAyuda = $("#htmlOutput .btnImgContainer > button");
        $.each(iconosAyuda, function (k, v) {
            $(v).tooltip({ title: $(v).attr("tooltip"), trigger: "hover focus" });
        });
        iconosAyuda.on("click", function () {
            var idCatalogo = $(this).attr("idCatalogo");
            var idElemento = $(this).attr("idElemento");
            var titulo = $(this).attr("tooltip");

            mostrarMensajeModal(titulo, idCatalogo, idElemento);
        });



        setTimeout(function () {
            $("#myModal").modal("hide");
            SAT.Environment.setSetting("isHydrate", false);
        }, 1000);


        if (typeof AppDeclaracionesSAT.inicializarPasoDas === "function") {
            AppDeclaracionesSAT.inicializarPasoDas();
        }



        $("#btnRegresaPerfil").on("click", function () {
            setTimeout(function () {
                if (FormsBuilder.Utils.hasAllQueueRules() === true ||
                    SAT.Environment.settings("isHydrate") === true) {
                    console.log("Aun existe reglas en ejecución");
                    return;
                }
                var xml = FormsBuilder.ViewModel.createXml();
                var encodeXmlResult = Base64.encode(xml);
                $("#DVDECLARACION").html(encodeXmlResult);
                $("#DVOPER").html(JSON.stringify({
                    operacion: "OPGUARDATEMP",
                    parametros: {
                        urlRedirect: "/Perfil/ConfiguraDeclaracion",
                        sendParametersUrl: "true"
                    }
                }));
            }, 300);
        });

        $("#btnEnviarDeclara").on("click", function () {
            var currentPanel = $(".submenu a.active");
            var idPanel = $(currentPanel).attr("idPanel");

            if (idPanel !== undefined) {
                var seccion = $("#htmlOutput .panel[id=\"{0}\"]".format(idPanel));
                var idEntidad = $(seccion).attr("identidadpropiedad");
                var formularioGridEdicion = $(".sat-container-formgridedicion[entidad='{0}']".format(idEntidad));

                if (formularioGridEdicion.length > 0) {
                    if (FormsBuilder.Modules.getModeGrid() === "new") {
                        console.log("Cancelo con entidad ", idEntidad);
                        $(".btnCancelFormularioGridEdicionRow").click();
                    }
                }
            }
            setTimeout(function () {
                if (FormsBuilder.Utils.hasAllQueueRules() === true ||
                    SAT.Environment.settings("isHydrate") === true) {
                    console.log("Aun existe reglas en ejecución");
                    return;
                }

                setTimeout(function () {
                    if (validaErroresSecciones()) {
                        $("#modalErroresEnSecciones").modal("show");
                        return;
                    }

                    var xml = FormsBuilder.ViewModel.createXml();
                    var encodeXmlResult = Base64.encode(xml);
                    $("#DVDECLARACION").html(encodeXmlResult);

                    var operacion = {
                        operacion: "OPENVIADOSF",
                        parametros: {
                            //monto: !SAT.Environment.settings('isDAS') ? $('.topay > span:last').html().substring(1, $('.topay span:last').html().length) : $('#1008017').val(),
                            monto: $("#1008017").val(),
                            revision: false
                        }
                    };
                    $("#DVOPER").html(JSON.stringify(operacion));
                }, 800);
            }, 800);

        });

        $("#btn-acepta-propuesta").click(function () {
            //if (SAT.Environment.settings("personalDeductionsReviwed") === true) {
            FormsBuilder.ViewModel.setViewModelsPropuesta(1, 0);
            SAT.Environment.setSetting("isProposal", false);
            SAT.Environment.setSetting("acceptProposal", true);
            console.log("Aceptó la propuesta");
            // } else {
            //     $("#modalRevisarDeducciones").modal("show");
            // }
        });

        $("#btn-confirma-rechaza-propuesta").click(function () {
            $("[view-model], .sat-container-formgridedicion button.btnAddItem, " +
                ".sat-container-formgridedicion button.btnNewItem, " +
                ".sat-container-formgridedicion button.btnDeleteFormularioGridEdicionRow, " +
                ".cargaMasiva, .cargaMasiva > a, input[type='file']").removeAttr("disabled");

            $("a[href='#tabIngresos']").click();
            $("#btn-acepta-propuesta, #btn-rechaza-propuesta").hide();
            $("#modalRechazaPropuesta").modal("hide");

            FormsBuilder.ViewModel.setViewModelsPropuesta(1, 1);
            SAT.Environment.setSetting("isProposal", false);
            SAT.Environment.setSetting("acceptProposal", false);
            FormsBuilder.Runtime.runInitRules();
            FormsBuilder.Modules.verifyProposal();

            $("a.btn-guardar-das").show();
        });

        $("#btn-ir-deducciones").click(function () {
            $("#modalRevisarDeducciones").modal("hide");
            $("a[href='#tabDeducciones']").click();
        });

        $("a[href='#tabDeducciones']").click(function () {
            if (SAT.Environment.settings("isProposal") === true) {
                SAT.Environment.setSetting("personalDeductionsReviwed", true);
            }
        });

        $(".panel-collapse[id*='maincontainer']").on("show.bs.collapse", function () {
            $(this).parent().find(".icon-plus-sign").removeClass("icon-plus-sign").addClass("icon-minus-sign");
        });

        $(".panel-collapse[id*='maincontainer']").on("hide.bs.collapse", function () {
            $(this).parent().find(".icon-minus-sign").removeClass("icon-minus-sign").addClass("icon-plus-sign");
        });

        $("ul[data-otros-tabs] > li > a").click(tabMenuClick);

        $(document).on("click", "i[vm]", function (event) {
            event.preventDefault();
            var strReglas = $(this).attr("rules");

            if (!IsNullOrEmpty(strReglas)) {
                var idReglas = JSON.parse(strReglas);
                var idRegla = idReglas[0];
                var mensajeError = fbUtils.obtenerMensajeError(idRegla);

                fbUtils.mostrarMensajeError(mensajeError);
            }
        });

        setTimeout(function () {
            try {
                //$('.datepicker-control').datepicker({ format: 'dd/mm/yyyy' });
                $(".datepicker-control-div").datepicker({ format: "dd/mm/yyyy" });

            } catch (e) { console.log("No pudo crear los controles de fechas."); }
        }, 0);

        // Elimina la flecha en los browsers IE version menor a 10. Bug 2505.
        var iexplorer = navigator.userAgent.match(/Trident/);
        if (iexplorer) {
            var msie = navigator.userAgent.indexOf("MSIE");
            if (msie > -1) {
                var version = parseInt(navigator.userAgent.substr((msie + 5), 5).trim().replace(";", ""));
                if (version && version < 10) {
                    $("select").css("background-image", "none");
                }
            }
        }

        if ($(".sticky").length > 0) {

            var stickyTop = $(".sticky").offset().top;

            $(window).scroll(function () {

                var windowTop = $(window).scrollTop();

                if (stickyTop < windowTop) {
                    $(".sticky").css({ position: "fixed", top: 0 });
                } else {
                    $(".sticky").css("position", "static");
                }
            });

        }
    }

    function initStateForm() {
        AppDeclaracionesSAT.setConfig("deshabilitarDialogos", true);
        SAT.Environment.setSetting("isHydrate", true);

        //var xmlCopy = FormsBuilder.XMLForm.getCopy();
        var xmlCopyDeclaracion = FormsBuilder.XMLForm.getCopyDeclaracion();

        var panel, noAplica, entroSeccion;
        for (var seccion in FormsBuilder.ViewModel.getFlujoSecciones()) {
            noAplica = FormsBuilder.ViewModel.getFlujoSecciones()[seccion]["NoAplica"];
            entroSeccion = FormsBuilder.ViewModel.getFlujoSecciones()[seccion]["EntroSeccion"];

            if (entroSeccion === "true") {
                panel = $("#htmlOutput .panel[identidadpropiedad=\"{0}\"]".format(seccion));
                if (noAplica !== "true") {
                    var seccionObligatorios = $("#htmlOutput .panel[id=\"{0}\"]".format(panel.attr("id")));
                    var obligatorios = seccionObligatorios.find(".sat-obligatorio");

                    $.each(obligatorios, function (key, obligatorio) {
                        if (SAT.Environment.settings("applyrulesvalidation") === true) {
                            var propiedadControl = fbUtils.getPropiedad($(obligatorio).attr("view-model"));
                            var reglas = FormsBuilder.XMLForm.getReglas()["reglas"];
                            var reglasAsociadas = Enumerable.From(reglas.regla).Where("$.idPropiedadAsociada == '{0}'".format(propiedadControl)).ToArray();
                            //$(xmlCopy).find('definicionReglas regla[idPropiedadAsociada="{0}"]'.format(db_id.substring(db_id.indexOf('P') + 1, db_id.length)));
                            $.each(reglasAsociadas, function (key, regla) {
                                if (regla.tipoRegla === "Validacion") {
                                    var definicion = regla.definicion;

                                    if (definicion.match(/ESNULO[(][$](\w+|[0-9^_]+)[)]/igm) !== null) {
                                        FormsBuilder.ViewModel.Validacion("", regla);
                                    }

                                    if (definicion.match(/!=0,VERDADERO,FALSO/igm) !== null) {
                                        FormsBuilder.ViewModel.Validacion("", regla);
                                    }
                                }
                            });
                        }
                    });
                }
            }
        }

        // var navegacion = xmlCopy.find('diagramacion > navegacion > agrupador');
        var catalogos = xmlCopyDeclaracion.find("SubRegimenes > Catalogo");
        var subregimenes = [];
        $.each(catalogos, function (kCatalogo, catalogo) {
            subregimenes.push($(catalogo).find("IdCatalogo").text());
        });

        // $.each(navegacion, function (key, agrupador) {
        //     $(agrupador).find('seccion').each(function (key, seccion) {
        //         var idEntidad = xmlCopy.find('diagramacion formulario controles').children('control[id="{0}"]'.format($(seccion).attr('idControlFormulario'))).attr('idEntidadPropiedad');
        //         FormsBuilder.ViewModel.getFlujoSecciones()[idEntidad]['NoVisible'] = false;
        //     });
        // });

        var ctrlsGrid = $(".ctrlsGrid");
        $.each(ctrlsGrid, function (k, ctrlGrid) {
            var search = true;
            var objCtrl = $(ctrlGrid).parent();
            while (search) {
                if (objCtrl.attr("identidadpropiedad") !== undefined) {
                    search = false;
                } else {
                    objCtrl = objCtrl.parent();
                }
            }

            var idEntidad = objCtrl.attr("identidadpropiedad");
            var dataGrid = xmlCopyDeclaracion.find("entidad[id=\"{0}\"]".format(idEntidad));
            var dataGridFilas = dataGrid.find("fila");
            var numFilas = dataGridFilas.length;

            var buttonAddGrid = objCtrl.find("button.btnAddCtrlGridRow:first");
            while (numFilas > 0) {
                buttonAddGrid.click();
                numFilas--;
            }

            setTimeout(function () {
                var detalleDataGrid = FormsBuilder.ViewModel.getDetalleGrid()[idEntidad];
                var entidadesJson = FormsBuilder.XMLForm.getEntidades();
                var $entidadXml = Enumerable.From(entidadesJson).Where("$.id == '{0}'".format(idEntidad)).FirstOrDefault();
                //xmlCopy.find("modeloDatos entidad[id='{0}']".format(idEntidad));
                $.each(dataGridFilas, function (key, fila) {
                    if (detalleDataGrid !== undefined) {
                        var filaDataBinding = detalleDataGrid[key];
                        if (filaDataBinding !== undefined) {
                            for (var filaData in filaDataBinding) {
                                var id = filaData.substring(filaData.indexOf("P") + 1, filaData.length);
                                var propiedad = $(fila).find("propiedad[id=\"{0}\"]".format(id.split("_")[0]));
                                if (id.split("_")[0] === propiedad.attr("id")) {
                                    var value = propiedad.text();
                                    var dataType = Enumerable.From($entidadXml.propiedades.propiedad).Where("$.id == '{0}'".format(propiedad.attr("id"))).Select("$.tipoDatos").FirstOrDefault();
                                    //$entidadXml.find("propiedad[id='{0}']".format(propiedad.attr('id'))).attr("tipoDatos");
                                    value = fbUtils.convertValue(value, dataType);
                                    filaDataBinding[filaData](value);

                                    if ($("input[view-model=\"{0}\"]".format(filaData)).hasClass("currency")) {
                                        fbUtils.applyFormatCurrencyOnElement($("input[view-model=\"{0}\"]".format(filaData)), true);
                                    }
                                }
                            }
                        }
                    }
                });
            }, 100);
        });

        setTimeout(function () {
            var panelsChecks = $("input[paneldinamico]");
            $.each(panelsChecks, function (key, panelCheck) {
                var control = $(panelCheck).parents().eq(3).find(".panel-group[paneldinamico=\"{0}\"]".format($(panelCheck).attr("paneldinamico")));
                this.checked ? control.show() : control.hide();
            });
            if (SAT.Environment.settings("dejarsinefecto") === true || SAT.Environment.settings("actualizacionimporte") === true) {
                $("#htmlOutput .sat-obligatorio").removeClass("sat-obligatorio");
            }
        }, 200);

        var formsGrid = $("[formulariogrid]");
        $.each(formsGrid, function (k, formGrid) {
            var idEntidad = $(formGrid).attr("formulariogrid");
            var entidadesJson = FormsBuilder.XMLForm.getEntidades();
            var $entidadXml = Enumerable.From(entidadesJson).Where("$.id == '{0}'".format(idEntidad)).FirstOrDefault();
            //xmlCopy.find("modeloDatos entidad[id='{0}']".format(idEntidad));
            var divPadre = $(formGrid).parents().eq(1);
            var xmlCopyDeclaracion = FormsBuilder.XMLForm.getCopyDeclaracion();
            var dataGrid = xmlCopyDeclaracion.find("entidad[id=\"{0}\"]".format(idEntidad));
            var dataGridFilas = dataGrid.find("fila");
            var numFilas = dataGridFilas.length;

            var buttonAddGrid = divPadre.find("button.btnAddFormularioGridRow:first");
            for (var i = 0; i < numFilas; i++) {

                $.when(buttonAddGrid.click()).done(function () {
                    var indice = dataGridFilas.eq(i).attr("indice");
                    if (dataGridFilas.eq(i).attr("error") == true) {
                        $("#htmlOutput table tr[tr-entidad=" + idEntidad + "][index=" + indice + "] td:last").html("<i class=\"icon-warning-sign sat-icon\"></i>");
                    }
                });

                var detalleDataGrid = FormsBuilder.ViewModel.getDetalleGrid()[idEntidad];
                var filaDataBinding = detalleDataGrid[i];
                if (filaDataBinding !== undefined) {
                    for (var filaData in filaDataBinding) {
                        var id = filaData.substring(filaData.indexOf("P") + 1, filaData.length);
                        var propiedad = dataGridFilas.eq(i).find("propiedad[id=\"{0}\"]".format(id.split("_")[0]));
                        if (id.split("_")[0] === propiedad.attr("id")) {
                            var value = propiedad.text();
                            var dataType = Enumerable.From($entidadXml.propiedades.propiedad).Where("$.id == '{0}'".format(propiedad.attr("id"))).Select("$.tipoDatos").FirstOrDefault();
                            //$entidadXml.find("propiedad[id='{0}']".format(propiedad.attr('id'))).attr("tipoDatos");
                            value = fbUtils.convertValue(value, dataType);
                            filaDataBinding[filaData](value);

                        }
                    }
                }

                var indicePadre = dataGridFilas.eq(i).attr("indice");

                var idEntidadHijo = $(formGrid).attr("entidadHijo");
                var $entidadChildXml = Enumerable.From(entidadesJson).Where("$.id == '{0}'".format(idEntidadHijo)).FirstOrDefault();
                //xmlCopy.find("modeloDatos entidad[id='{0}']".format(idEntidadHijo));
                if (idEntidadHijo !== undefined) {
                    var relacion = $(xmlCopyDeclaracion).find("relacionesGrid relacion[entidadHijo=\"{0}\"]".format(idEntidadHijo));
                    if (relacion.length > 0) {
                        var padreHijo = relacion.find("hijo[padre=\"{0}\"]".format(indicePadre));
                        var dataGridHijo = xmlCopyDeclaracion.find("entidad[id=\"{0}\"]".format(idEntidadHijo));
                        var divPadreHijo = $("#htmlOutput").find(".panel-body [entidadPadre=\"{0}\"]".format(idEntidad));
                        var buttonAddGridHijo = divPadreHijo.parents().eq(1).find("button.btnAddFormularioGridRow:first");

                        if (!IsNullOrEmpty(padreHijo.attr("hijos"))) {
                            var hijos = padreHijo.attr("hijos").split(",");
                            if (hijos.length > 0) {
                                var hijosLen = hijos.length;
                                for (var j = 0; j < hijosLen; j++) {
                                    buttonAddGridHijo.click();
                                    var dataGridFilaHijo = dataGridHijo.find("fila[indice=\"{0}\"]".format(hijos[j]));
                                    var detalleDataGridHijo = FormsBuilder.ViewModel.getDetalleGrid()[idEntidadHijo];
                                    var filaDataBindingHijo = detalleDataGridHijo[detalleDataGridHijo.length - 1];

                                    if (filaDataBindingHijo !== undefined) {
                                        for (var filaDataHijo in filaDataBindingHijo) {
                                            var idHiijo = filaDataHijo.substring(filaDataHijo.indexOf("P") + 1, filaDataHijo.length);
                                            var propiedadHijo = dataGridFilaHijo.find("propiedad[id=\"{0}\"]".format(idHiijo.split("_")[0]));
                                            if (idHiijo.split("_")[0] === propiedadHijo.attr("id")) {
                                                var valueChild = propiedadHijo.text();
                                                var dataTypeChild = Enumerable.From($entidadChildXml.propiedades.propiedad).Where("$.id == '{0}'".format(propiedadHijo.attr("id"))).Select("$.tipoDatos").FirstOrDefault();
                                                //$entidadChildXml.find("propiedad[id='{0}']".format(propiedad.attr('id'))).attr("tipoDatos");
                                                valueChild = fbUtils.convertValue(valueChild, dataTypeChild);
                                                filaDataBindingHijo[filaDataHijo](valueChild);

                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        var formsEditGrid = $(".sat-container-formgridedicion");
        $.each(formsEditGrid, function (k, formGrid) {
            var idEntidad = $(formGrid).attr("entidad");
            var entidadesJson = FormsBuilder.XMLForm.getEntidades();
            var $entidadXml = Enumerable.From(entidadesJson).Where("$.id == '{0}'".format(idEntidad)).FirstOrDefault();
            var detalleDataGrid = FormsBuilder.ViewModel.getDetalleGrid();
            var viewModelGrid = FormsBuilder.ViewModel.get()[idEntidad];
            var xmlCopyDeclaracion = FormsBuilder.XMLForm.getCopyDeclaracion();
            var dataGrid = xmlCopyDeclaracion.find("entidad[id=\"{0}\"]".format(idEntidad));
            var dataGridFilas = dataGrid.find("fila");

            detalleDataGrid[idEntidad] = [];

            if ($entidadXml) {
                dataGridFilas.each(function () {
                    var fila = $(this);

                    if (Object.keys(viewModelGrid).length > 0) {
                        var validacion;
                        var nuevoRegistro;

                        SAT.Environment.setSetting("applyrules", false);

                        for (var key in viewModelGrid) {
                            var id = key.substring(key.indexOf("P") + 1, key.length);
                            var propiedad = fila.find("propiedad[id=\"{0}\"]".format(id));

                            if (id == propiedad.attr("id")) {
                                var value = propiedad.text().trim();
                                var dataType = Enumerable.From($entidadXml.propiedades.propiedad).Where("$.id == '{0}'".format(id)).Select("$.tipoDatos").FirstOrDefault();
                                value = fbUtils.convertValue(value, dataType);
                                viewModelGrid[key](value);
                            }
                        }

                        SAT.Environment.setSetting("applyrules", true);

                        validacion = FormsBuilder.ViewModel.validarViewModel(viewModelGrid);
                        nuevoRegistro = FormsBuilder.ViewModel.obtenerObjetoPlano(viewModelGrid);

                        if (validacion.esViewModelCorrecto === false) {
                            nuevoRegistro.error = validacion.mensajeError;
                        }

                        detalleDataGrid[idEntidad].push(nuevoRegistro);
                    }
                });

                FormsBuilder.Modules.renderFormularioGrid(idEntidad);
                FormsBuilder.Modules.limpiarViewModel(idEntidad);
            }
        });

        var viewModelDetalle = FormsBuilder.ViewModel.getDetalle();

        var detalleDlg = $(".sat-detalle");
        $.each(detalleDlg, function (index, detalle) {
            var db_id = $(detalle).attr("view-model");
            var controlDlg = window[detalle.id][0];

            if (controlDlg && viewModelDetalle[controlDlg.idEntidadPropiedad] !== undefined) {
                SAT.Environment.setSetting("showdialogs", false);
                $(detalle).parent().find("a").click();
                SAT.Environment.setSetting("showdialogs", true);

                var dlg = $("[sat-dlg-dbid=\"{0}\"] div:first".format(db_id));
                $.each(viewModelDetalle[controlDlg.idEntidadPropiedad], function (index, dtl) {
                    dlg.find("#nuevaFila").click();
                    var fila = dlg.find("tr:last");
                    $.each(dtl, function (index, dtlItem) {
                        fila.find("[view-model=\"{0}\"]".format("E{0}P{1}".format(controlDlg.idEntidadPropiedad, dtlItem.propiedad))).val(dtlItem.valor);
                    });
                });
                FormsBuilder.ViewModel.getDetalleFK()[db_id] = controlDlg.idEntidadPropiedad;
            }
        });

        var detalleCompensacionesDlg = $(".sat-comp");
        $.each(detalleCompensacionesDlg, function (index, detalleCompensacion) {
            var db_id = $(detalleCompensacion).attr("view-model");
            var idEntidadCompensaciones = fbUtils.getEntidad(db_id);
            //var controlDlg = window[detalleCompensacion.id][0];

            var entidadesJson = FormsBuilder.XMLForm.getEntidades();
            var entidadCompensaciones = Enumerable.From(entidadesJson).Where("$.id=='{0}'".format(idEntidadCompensaciones)).FirstOrDefault();
            var pObligacionDestino = Enumerable.From(entidadCompensaciones.atributos.atributo).Where("$.nombre == 'ClaveImpuesto'").Select("$.valor").FirstOrDefault("");
            var entidadesPagos = Enumerable.From(entidadesJson).Where(function (item) { return Enumerable.From(item.atributos.atributo).Any("$.valor == '{0}'".format(pObligacionDestino)); }).ToArray();
            var $entidadCompensaciones = Enumerable.From(entidadesPagos).Where(function (item) { return Enumerable.From(item.atributos.atributo).Any("$.valor == 'SAT_COMPENSACIONES'"); }).FirstOrDefault();
            //var entidadCompensaciones = Enumerable.From(entidadesPagos).Where("$.atributos.atributo.valor == '{0}'".format("SAT_COMPENSACIONES")).ToArray();
            var idEntidadPropiedad = $entidadCompensaciones.id;
            if (viewModelDetalle[idEntidadPropiedad] !== undefined) {
                SAT.Environment.setSetting("showdialogs", false);
                $(detalleCompensacion).parent().find("a").click();
                SAT.Environment.setSetting("showdialogs", true);

                var dlg = $("[sat-dlg-compensaciones-dbid=\"{0}\"] div:first".format(db_id));
                $.each(viewModelDetalle[idEntidadPropiedad], function (index, dtl) {
                    dlg.find("#addItem").click();
                    var fila = dlg.find(".sat-row-compensaciones:last");

                    $.each(dtl, function (index, dtlItem) {
                        var control = $(fila).find(":input[claveInformativa=\"{0}\"]".format(dtlItem.claveinformativa));
                        var fecha;
                        switch (control.attr("id")) {
                            case "txtSaldoAplicar":
                                {
                                    $(fila).find("#btnValidar").prop("disabled", false);
                                    $(fila).find("#btnValidar").click();
                                    control.val(dtlItem.valor);
                                    break;
                                }
                            case "txtFechaCausacion":
                                {
                                    if (!IsNullOrEmpty(dtlItem.valor)) {
                                        fecha = FECHA(dtlItem.valor);
                                        if (fecha) {
                                            dtlItem.valor = fecha.toString("dd/MM/yyyy");
                                            control.parent(".date").datepicker("setDate", dtlItem.valor);
                                            control.val(dtlItem.valor);
                                        }
                                    }
                                    break;
                                }
                            case "txtFechaDeclaracion":
                                {
                                    if (!IsNullOrEmpty(dtlItem.valor)) {
                                        fecha = FECHA(dtlItem.valor);
                                        if (fecha) {
                                            dtlItem.valor = fecha.toString("dd/MM/yyyy");
                                            control.parent(".date").datepicker("setDate", dtlItem.valor);
                                            control.val(dtlItem.valor);
                                        }
                                    }
                                    break;
                                }
                            default:
                                {
                                    control.val(dtlItem.valor);
                                    break;
                                }
                        }

                        if (control.get(0) && control.get(0).tagName == "SELECT")
                            control.change();
                        if ($.inArray(control.attr("id"), ["txtNumeroOperacion", "txtFechaCausacion"]) >= 0) {
                            control.blur();
                        }
                    });
                });
                var numeroCompensaciones = dlg.find(".sat-row-compensaciones").find("#txtSaldoAplicar");
                var MontoCompensaciones = 0;
                $.each(numeroCompensaciones, function () {
                    MontoCompensaciones += parseInt($(this).val());
                });
                dlg.find("#lblMonto").html(MontoCompensaciones);
                FormsBuilder.ViewModel.getDetalleFK()[db_id] = idEntidadPropiedad;
            }
        });

        var propiedad = $(".calculoAmortizacion:first")[0];
        var elementWithData = FormsBuilder.XMLForm.getCopyDeclaracion().find("calculos calculoamortizacion");
        var base64String;
        var camposTransferencia;
        if (elementWithData && propiedad) {
            camposTransferencia = $(propiedad).attr("campos");
            base64String = elementWithData.text();
        }
        if (!IsNullOrEmpty(base64String)) {
            FormsBuilder.Calculo.Amortizacion.fillViewModel(base64String, camposTransferencia);
        }

        var jsonBase64CalculoDeduccionInversion = FormsBuilder.XMLForm.getCopyDeclaracion().find("calculos calculodeduccioninversion").text();
        if (!IsNullOrEmpty(jsonBase64CalculoDeduccionInversion)) {
            FormsBuilder.Modules.fillViewModelCuadroDeduccionInversion(jsonBase64CalculoDeduccionInversion);
        }

        setTimeout(function () {
            if (SAT.Environment.settings("dejarsinefecto") === true) {
                var detalleGrid = FormsBuilder.ViewModel.getDetalleGrid();
                var enumerable = function (element) {
                    for (var key in element) {
                        if (element[key] !== "") {
                            var entidad = FormsBuilder.Utils.getEntidad(key);
                            var propiedad = FormsBuilder.Utils.getPropiedad(key);
                            var entidadesJson = FormsBuilder.XMLForm.getEntidades();
                            var entidadJson = Enumerable.From(entidadesJson).Where("$.id == '{0}'".format(entidad)).FirstOrDefault();

                            if (entidadJson && entidadJson.propiedades && entidadJson.propiedades.propiedad) {
                                var infoPropiedad = Enumerable.From(entidadJson.propiedades.propiedad).Where("$.id == '{0}'".format(propiedad)).FirstOrDefault();

                                if (infoPropiedad) {
                                    var oCatalogo = Enumerable.From(infoPropiedad.atributos.atributo).Where("$.nombre == '{0}'".format("Catalogo")).FirstOrDefault();
                                    if (oCatalogo) {
                                        element[key] = "0";
                                    } else if (infoPropiedad.tipoDatos) {
                                        //xmlCopy.find('modeloDatos > entidades > entidad[id="{0}"]'.format(entidad)).find('propiedad[id="{0}"]'.format(propiedad));
                                        switch (infoPropiedad.tipoDatos) {
                                            case "Numerico":
                                                element[key] = 0;
                                                break;
                                            case "Alfanumerico":
                                            case "Fecha":
                                                element[key] = "";
                                                break;
                                        }
                                    }
                                }
                            }
                        }
                    }
                };

                for (var key in detalleGrid) {
                    var grid = $(".sat-container-formgridedicion[entidad=\"{0}\"]".format(key));
                    var clasificador = $(".clasificador[entidad=\"{0}\"]".format(key));

                    detalleGrid[key].forEach(enumerable);

                    if (grid.length > 0) {
                        FormsBuilder.Modules.renderFormularioGrid(key);
                        grid.find("button.btnDeleteFormularioGridEdicionRow, button.btnNewItem, .cargaMasiva, .cargaMasiva > a, input[type='file'], button.btnAddItem").attr("disabled", "disabled");
                    } else if (clasificador.length > 0) {
                        FormsBuilder.Modules.verifyProposal();
                        FormsBuilder.Modules.render();
                    }
                }
            }

            $("#helptext").html("");
            AppDeclaracionesSAT.setConfig("deshabilitarDialogos", false);
        }, 500);

        if (AppDeclaracionesSAT.getConfig("tipodisco") !== "vigente") {
            eliminarBotonesDeCalculo();
        }
    }

    function validarContenedor(elementos, funcionEjecutar, ejecutarAlEntrarSeccion) {
        if ((elementos && elementos.length > 0) && (funcionEjecutar && typeof funcionEjecutar === "function")) {
            elementos.each(function () {
                var elemento = $(this);

                funcionEjecutar(elemento);

                if (ejecutarAlEntrarSeccion === undefined || ejecutarAlEntrarSeccion === true) {
                    var seccionDefault = $("[idtab].active.in [id^='collapse'].panel-collapse.in [id*='maincontainer'].panel-collapse.in");
                    cambiarSeccion(null, seccionDefault);
                }
            });
        }
    }

    function cambiarGrupo(grupoValidar) {
        var seccionesValidar = grupoValidar.find("[id*='maincontainer']");

        validarContenedor(seccionesValidar, cambiarSeccion);
    }

    function cambiarMenu(menuValidar) {
        var grupoValidar = menuValidar.find("[id*='group'].ficha-collapse");

        validarContenedor(grupoValidar, cambiarGrupo);
    }


    function cambiarSeccion(seccionValidar, seccionSeleccionada) {
        var reglas = FormsBuilder.XMLForm.getReglas()["reglas"];

        console.log(">>>> Inicia cambiarSeccion");

        $("#htmlOutput").find("i").popover("hide");

        if (seccionValidar && seccionValidar.length > 0 && SAT.Environment.settings("dejarsinefecto") === false) {
            var obligatorios = seccionValidar.find("[data-obligatorio]");

            $.each(obligatorios, function (key, obligatorio) {
                var formulariogridedicion = $(obligatorio).parents(".sat-container-formgridedicion");
                var gridCfdis = $(obligatorio).parents(".sat-container-gridcfdi");

                if (SAT.Environment.settings("applyrulesvalidation") === true && formulariogridedicion.length === 0 && gridCfdis.length === 0) {
                    var db_id = $(obligatorio).attr("view-model");
                    var propiedadObligatorio = fbUtils.getPropiedad(db_id);
                    var reglasAsociadas = Enumerable.From(reglas.regla).Where("$.idPropiedadAsociada == '{0}'".format(propiedadObligatorio)).ToArray();
                    $.each(reglasAsociadas, function (key, regla) {
                        if (regla.tipoRegla === "Validacion" && (!regla.mensajeErrorEnDialogo || regla.mensajeErrorEnDialogo != 1)) {
                            var definicion = regla.definicion;

                            if (definicion.match(/ESNULO[(][$](\w+|[0-9^_]+)[)]/igm) !== null) {
                                FormsBuilder.ViewModel.Validacion("", regla);
                            }

                            if (definicion.match(/!=0,VERDADERO,FALSO/igm) !== null) {
                                FormsBuilder.ViewModel.Validacion("", regla);
                            }

                            if (definicion.match(/==0,FALSO,VERDADERO/igm) !== null) {
                                FormsBuilder.ViewModel.Validacion("", regla);
                            }

                            if (definicion.match(/==0\),FALSO,VERDADERO/igm) !== null) {
                                FormsBuilder.ViewModel.Validacion("", regla);
                            }
                        }
                    });
                } else if (formulariogridedicion.length > 0) {
                    formulariogridedicion.find(".btnCancelEdit:visible").click();
                }
            });
        }

        if (seccionSeleccionada && seccionSeleccionada.length > 0 && SAT.Environment.settings("dejarsinefecto") === false) {
            var controlesSeccion = seccionSeleccionada.find("[view-model]");

            controlesSeccion.each(function () {
                var control = $(this);
                var idPropiedad = fbUtils.getPropiedad(control.attr("view-model"));
                var reglasEntrarSeccion = Enumerable.From(reglas.regla).Where("$.idPropiedadAsociada == '{0}' && $.tipoRegla === 'Validacion' && $.validaSeccionAlEntrar".format(idPropiedad)).ToArray();

                if (reglasEntrarSeccion && reglasEntrarSeccion.length > 0) {
                    reglasEntrarSeccion.forEach(function (reglaEntrarSeccion) {
                        FormsBuilder.ViewModel.Validacion("", reglaEntrarSeccion);
                    });
                }
            });
        }

        if (SAT.Environment.settings("dejarsinefecto") === false) {
            SAT.Environment.setSetting("applyrulesvalidation", true);
        }

        SAT.Environment.setSetting("isHydrate", false);

        console.log(">>>> Termina cambiarSeccion");
    }

    function guardarDeclaracion(generarFacturas) {
        if (SAT.Environment.settings("isProposal") === false && SAT.Environment.settings("isSimulador") === false) {
            // DESCOMENTAR EN LOCAL
            var xml = FormsBuilder.ViewModel.createXml(generarFacturas);
            var encodeXmlResult = Base64.encode(xml);

            sessionStorage.setItem("DECLARACION", encodeXmlResult);

            // DESCOMENTAR EN UAT Y/O PROD
            // Service.Test.almacenarDeclaracionTemporalDas(false, "", generarFacturas);
            SAT.Environment.setSetting("isModified", false);
        }
    }

    function showHelpDialog(event) {
        event = event || window.event;
        var $target = $(event.target);
        if (!IsNullOrEmpty($target.val())) {
            event.preventDefault(event);
            return;
        }
        var isShowing = $target.attr("messageShowed");
        var focusOnInput = function () {
            $("#divDynamicModals > *:first").off("hide.bs.modal");
            $target.focus();
        };

        if (!isShowing) {
            var putOnNode = $("#divDynamicModals");
            var helpText = $(this).attr("ayudaEnDialogo");
            var newModal = $("#modalSeccion").clone();
            $(".modal-body", newModal).html(helpText);
            $target.attr("messageShowed", true);
            $("*:first", putOnNode).remove();
            putOnNode.html(newModal);
            newModal = $("*:first", putOnNode);
            $(newModal).on("hide.bs.modal", focusOnInput);
            $(newModal).modal("show");
        }
    }

    function mostrarMensajeModal(titulo, idCatalogo, idElemento) {
        if (!IsNullOrEmptyWhite(titulo)
            && !IsNullOrEmptyWhite(idCatalogo)
            && !IsNullOrEmptyWhite(idElemento)) {

            var texto = fbCatalogos.getCatalogById(idCatalogo).find("[valor=\"{0}\"]".format(idElemento)).attr("texto");

            var mdAyuda = $("#modal-iconoAyuda");
            mdAyuda.find(".modal-title").html(titulo);
            var htmlAyuda = $(Base64.decode(texto));
            var htmlAyudaCarousel;
            if (SAT.Environment.settings("isMobile")) {
                if (htmlAyuda.find("table").length > 0) {
                    htmlAyudaCarousel = $($("#ayudasCarousel").parents().html());
                    var head = htmlAyuda.find("thead > tr > th");
                    $.each(head, function (k, v) {
                        htmlAyudaCarousel.find(".item").eq(k).find("table > thead > tr").html(v);
                    });
                    var body = htmlAyuda.find("tbody:first > tr > td");
                    $.each(body, function (k, v) {
                        htmlAyudaCarousel.find(".item").eq(k).find("table > tbody > tr").html(v);
                    });
                }
            }
            mdAyuda.find(".modal-body").html(htmlAyudaCarousel || htmlAyuda);
            mdAyuda.modal("show");
        }
    }

    function resetCursorInputCurrency(elementOnApply) {
        var old_val = "";

        var reset = function (e) {
            console.log("resetCursorInputCurrency()");
            var val = this.value,
                len = val.length;

            this.setSelectionRange(len, len);

            if (e.type === "keyup" || e.type === "keydown") {
                var short, long;
                if (old_val.length < val.length) {
                    short = old_val;
                    long = val;
                } else {
                    short = val;
                    long = old_val;
                }

                if (long.indexOf(short) !== 0) {
                    val = old_val;
                    this.value = val;
                    this.setSelectionRange(old_val.length, old_val.length);

                    e.preventDefault();
                    // Just exit from the function now
                    return false;
                }
            }

            old_val = val;
        };

        if (elementOnApply) {
            $(elementOnApply).find(".currency").each(function (i, e) {
                e.addEventListener("focus", reset, false);
            });
        } else {

            $(".currency").each(function (i, e) {
                e.addEventListener("focus", reset, false);
            });
        }
    }

    function eliminarBotonesDeCalculo() {
        //if (SAT.Environment.settings('isDAS')) 
        return;

        //var sinCalculo = precarga ? FormsBuilder.XMLForm.getCopyPrecarga().find('[claveInformativa="55"]').text() : FormsBuilder.Runtime.evaluate('$55');
        //if (parseInt(sinCalculo) === 1) {
        //    $('.calculoinversion').remove();
        //    $('.calculoAmortizacion').remove();
        //}
    }

    function helpIconMobile(v) {
        var that = $(v);
        var sibling = that.prev();
        var helpText = sibling.attr("help-text");

        if (helpText === undefined) {
            helpText = that.parent().parent().next().attr("help-text");
        }

        if (helpText === undefined) {
            sibling = that.next();
            helpText = sibling.attr("help-text");
        }

        if (helpText === undefined) {
            sibling = that.parent().next();
            helpText = sibling.attr("help-text");
        }

        if (helpText === undefined) {
            sibling = that.parents().eq(2).next().find("[help-text]");
            helpText = sibling.attr("help-text");
        }

        if (helpText === undefined) {
            sibling = that.siblings("[help-text]");
            helpText = sibling.attr("help-text");
        }

        if (helpText === undefined) {
            sibling = $("#{0}".format(that.parent().attr("data-titulo-control")));
            helpText = sibling.attr("help-text");
        }

        //Quita las ayudas que solo tienen el título largo y no texto de ayuda, de lo contrario agrega la funcionalidad del click
        if (helpText !== undefined) {
            var check = helpText.split("<span>");
            if (check.length < 3) {
                that.remove();
            } else {
                that.on("click", function () {
                    var mdAyuda = $("#modal-ayuda");
                    mdAyuda.find(".modal-body").html(helpText);
                    mdAyuda.modal("show");
                });
            }
        } else {
            that.remove();
        }
    }

    function helpIcon(v) {
        var that = $(v);
        var sibling = that.prev();
        var helpText = sibling.attr("help-text");
        if (helpText === undefined) {
            helpText = that.parent().parent().next().attr("help-text");
        }

        if (helpText === undefined) {
            sibling = sibling.prev();
            helpText = sibling.attr("help-text");
        }

        //Quita las ayudas que solo tienen el título largo y no texto de ayuda, de lo contrario agrega la funcionalidad del click
        if (helpText !== undefined) {
            var check = helpText.split("<span>");
            if (check.length < 3) {
                that.remove();
            } else {
                that.popover({
                    trigger: "click",
                    template: "<div class=\"popover pophelp\" role=\"tooltip\"><div class=\"arrow\"></div><h3 class=\"popover-title\"></h3><div class=\"popover-content\"></div></div>",
                    placement: "left",
                    content: "<div><div style=\"clear: both\"></div>{0}</div>".format(helpText),
                    html: "true"
                });
            }
        }
    }

    function helpIconPopover() {
        $("#htmlOutput").find("span.ic-help").popover("hide");
        $("#htmlOutput").find(".popover").remove();
    }

    function cargarClabesBancarias() {
        var ctrlCuentaClabe = $("#htmlOutput").find("select[Cuentaclabe]");

        if (ctrlCuentaClabe.length > 0) {
            var ctrlNombreBanco = $("#htmlOutput").find("select[NombreBanco]");

            var viewModel = ctrlNombreBanco.attr("view-model");
            var idEntidad = viewModel.split("P")[0];
            idEntidad = idEntidad.substring(1, idEntidad.length);

            ctrlCuentaClabe.on("change", function () {
                fbViewModel.get()[idEntidad][viewModel]($(this).find("option:selected").attr("claveBanco"));
            });

            var precargaXml = FormsBuilder.XMLForm.getCopyPrecarga();
            precargaXml = precargaXml && precargaXml.length > 0 ? FormsBuilder.XMLForm.getCopyPrecarga() : FormsBuilder.XMLForm.getCopyDeclaracion();

            var datosBanco = precargaXml.find("ClabesBancarias > DatosBanco");
            var elementAdding = "";
            if (datosBanco.length > 0) {
                elementAdding = "<option value=\"0\">Sin selección</option>";

                $.each(datosBanco, function (k, v) {
                    var clabe = $(v).find("Clabe").text();
                    var claveBanco = $(v).find("ClaveBanco").text();
                    var nombreBanco = $(v).find("NombreBancoC").text();

                    elementAdding += "<option claveBanco=\"{0}\" value=\"{1}\">{2}</option>".format(claveBanco, clabe, "{0} - {1}".format(clabe, nombreBanco));
                });
            }
            elementAdding += "<option value=\"-1\">Otro...</option>";
            ctrlCuentaClabe.append(elementAdding);
            if (AppDeclaracionesSAT.getConfig("tipodisco") !== "temporal" &&
                AppDeclaracionesSAT.getConfig("forma") !== "new") {
                ctrlCuentaClabe.change();
            } else if (AppDeclaracionesSAT.getConfig("tipodisco") === "temporal" &&
                AppDeclaracionesSAT.getConfig("forma") === "new" &&
                datosBanco.length <= 0) {
                ctrlCuentaClabe.change();
            }
        }
    }

    function validaErroresSecciones() {
        var errores = false;
        //if (parseInt($('.alertas .number').html()) > 0 && !SAT.Environment.settings('isDAS')) {
        //    errores = true;
        ////} else if (SAT.Environment.settings('isDAS')) {
        //} else{

        $("span.badge").not(".badgeMenuCategoria").each(function (k, v) {
            if (parseInt($(v).html()) > 0) {
                errores = true;
            }
        });
        //}
        return errores;
    }

    function checkMassive(key, identidad) {
        var index = SAT.Environment.settings("massives").indexOf(identidad);
        if (index != -1) {
            setTimeout(function () {
                $("[id=" + identidad + "]").find(".paginador").find("a:first").click();
                SAT.Environment.removeArraySetting(key, identidad);
            }, 500);
        }
    }

    function tabMenuClick() {
        var contenedorOtrosTabs = $(this).parents("ul[data-otros-tabs]");
        var contenedorTabs = $(this).parents("ul.nav-tabs");
        var tabMover = $(this).parent();

        tabMover.insertBefore(contenedorTabs.children("li.dropdown"));
        $(this).unbind("click");

        if (contenedorOtrosTabs.children("li").length < 1) {
            contenedorOtrosTabs.parent().remove();
        }

        ajustarAnchoTabs(contenedorTabs);
    }

    function ajustarAnchoTabs(contenedor) {
        var tabsVisibles = obtenerElementosVisibles(contenedor.children("li").not("li.dropdown"));
        var tabMenu = obtenerElementosVisibles(contenedor.children("li.dropdown"));
        var anchoTotal = tabMenu.length > 0 ? 90 : 100;
        var width = anchoTotal / tabsVisibles.length;

        tabsVisibles.css("width", "{0}%".format(width));
    }

    function obtenerElementosVisibles(elementos) {
        return elementos.filter(function () {
            return $(this).attr("style") == undefined || $(this).css("display") == undefined || $(this).css("display") != "none";
        });
    }

})();