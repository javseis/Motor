(function () {

    namespace("AppDeclaracionesSAT" , inicializarPasoDas,
        inicializarPasoRevisionEnvio, inicializarEventosPasoRevisionEnvio);

    function inicializarPasoDas() {
        $('.btn-guardar-das, .btn-revisar-das, .btn-enviar-das, .btn-perfil-das').on('click', Service.Test.almacenarDeclaracionTemporalDas);
    }

    function inicializarPasoRevisionEnvio() {
        if ($(window).height() > 710) {
            $('.sat-container-main .row-form').css("height", "{0}px".format($(window).height() - 285));
        }
        var qStr = FormsBuilder.Utils.getQueryString();
        if (qStr['readonly'] !== undefined && qStr['readonly'] !== "undefined") {
            console.log('Declaración de solo lectura.');
            AppDeclaracionesSAT.setConfig('readonly', !!qStr['readonly']);
        }
        if (AppDeclaracionesSAT.getConfig('readonly') === true) {
            console.log('Quitar elementos de navegación.');
            setTimeout(function () {
                $('#enviarDeclaracion, #btnEnviarDeclara').addClass('hide');
                $('input, select').attr('disabled', 'disabled');
            }, 1000);
        }
        inicializarEventosPasoRevisionEnvio();
    }

    function inicializarEventosPasoRevisionEnvio() {

        $('#modalCantidadDeclaracion .si').on('click', function () {
            $('#modalCantidadDeclaracion').modal('hide');
            $('#modalYesNoFirmarDeclaracion').modal('show');
        });

        $('#modalCantidadDeclaracion .no').on('click', function () {
            $('#htmlOutput').attr('style', 'width:100%;height:100%');
            $('#htmlOutput').show();
        });

        $('#modalYesNoFirmarDeclaracion .si').on('click', function () {
            $('#modalYesNoFirmarDeclaracion').modal('hide');
            if (SAT.Environment.settings('isMobile')) {
                openDialogError('Esta opción no está disponible para este dispositivo, utiliza un equipo de cómputo de escritorio.');
            }
            else {
                var parametros = { respuesta: 'SI' };

                $('#modalCantidadDeclaracion').find('input:radio').each(function () {
                    if ($(this).is(':checked') === true) {
                        parametros['tipoforma'] = $(this).attr('valor');
                    }
                });

                var operacion = {
                    operacion: "OPENVIADOSF",
                    parametros: parametros
                };
                $('#DVOPER').html(JSON.stringify(operacion));
            }
        });

        $('#modalYesNoFirmarDeclaracion .no').on('click', function () {
            $('#modalYesNoFirmarDeclaracion').modal('hide');

            var parametros = { respuesta: 'NO' };

            $('#modalCantidadDeclaracion').find('input:radio').each(function () {
                if ($(this).is(':checked') === true) {
                    parametros['tipoforma'] = $(this).attr('valor');
                }
            });

            var operacion = {
                operacion: "OPENVIADOSF",
                parametros: parametros
            };
            $('#DVOPER').html(JSON.stringify(operacion));
            $('#modalEnvioDeclaracion').modal('show');
        });

        $('#modalYesNoFirmarDeclaracion .close').on('click', function () {
            $('#htmlOutput').attr('style', 'width:100%;height:100%');
            $('#htmlOutput').show();
        });

        $('#enviarDeclaracion').on('click', function () {
            if ($('.topay > span:last').html() !== '-') {
                $('#modalCantidadDeclaracion .modal-body span').html(utils.number.toCurrencyFormat(parseFloat($('.topay > span:last').html().replace(/,/g,"")), 2, '.', ','));
            } else {
                $('#modalCantidadDeclaracion .modal-body span').html(utils.number.toCurrencyFormat(parseFloat(Base64.decode($('#DVMONTO').html().replace(/,/g, ""))), 2, '.', ','));
            }
            $('#modalCantidadDeclaracion').modal('show');

            $('#htmlOutput').attr('style', 'width:0px;height:0px');
            $('#htmlOutput').hide();
        });

        $('#editarDeclaracion').on('click', function () {
            var operacion = {
                operacion: "OPEDITARS",
                parametros: {}
            };
            $('#DVOPER').html(JSON.stringify(operacion));
        });

        $('#home').on('click', function () {
            var operacion = {
                operacion: "OPHOME",
                parametros: {}
            };
            $('#DVOPER').html(JSON.stringify(operacion));
        });

        $("label.form-control").formatCurrency({ region: 'es-MX' });
    }
})();