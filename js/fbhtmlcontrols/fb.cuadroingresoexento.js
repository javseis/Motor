/** @module FormsBuilder.Modules */
/**
* Modulo para el render de formularios que crea una caja de texto
*
* (c) SAT 2013, Iván González
*/
/*global namespace:false, FormsBuilder:false, SAT: false, AppDeclaracionesSAT:false, ko:false, Base64:false */

'use strict';

(function () {
    namespace('FormsBuilder.Modules', loadedUICalculoIngresoExento);

    var limite1 = {};
    var limite2 = {};
    var limite3 = {};
    var limite4 = {};
    var limite5 = {};

    var areaGeograficaA = 70.1;
    var areaGeograficaB = 68.28;

    limite1['DCE1'] = (30 * areaGeograficaA);
    limite1['DCE2'] = (15 * areaGeograficaA);
    limite1['DCE3'] = (15 * areaGeograficaA);

    var ctx;

    function loadedUICalculoIngresoExento() {
        $('#htmlOutput .calculoexentos').on('click', initUIEvent);
        $('.calcular-ingreso-exento').on('click', calcularIngresoExento);
        $('.limpiar-ingreso-exento').on('click', limpiarIngresoExento);

        ctx = $('.tabla-calculo-ingreso');

        ctx.find('input').focus(function () {
            var that = this;
            setTimeout(function () {
                $(that).toNumber();
            }, fbUtils.getMs());
        });

        ctx.find('input').blur(function () {
            var self = this;
            setTimeout(function () {
                fbUtils.applyFormatCurrencyOnElement(self, true);
            }, 20);
        });
    }

    function initUIEvent() {
        $('#modalCalculoIngresoExento').modal('show');
    }

    function limpiarIngresoExento() {
        $(this).parent().parent().find('input').val('');
        $(this).parent().parent().find('label').text('');
    }

    function calcularIngresoExento() {
        console.log('calculando...');
        $('.calcular-ingreso-exento').attr('disabled', 'disabled');
        ctx.find('input').each(function (k, v) {
            $(v).toNumber();
        });

        var func = function () {
            // console.log(limite1);
            
            limite2['DCE1'] = (parseInt(ctx.find('.E1DCE1').val() || 0) >= limite1['DCE1'] ? 0 : limite1['DCE1'] - parseInt(ctx.find('.E1DCE1').val() || 0));
            limite2['DCE2'] = (parseInt(ctx.find('.E1DCE2').val() || 0) >= limite1['DCE2'] ? 0 : limite1['DCE2'] - parseInt(ctx.find('.E1DCE2').val() || 0));
            limite2['DCE3'] = (parseInt(ctx.find('.E1DCE3').val() || 0) >= limite1['DCE3'] ? 0 : limite1['DCE3'] - parseInt(ctx.find('.E1DCE3').val() || 0));
            // console.log(limite2);

            limite3['DCE1'] = (parseInt(ctx.find('.E2DCE1').val() || 0) >= limite2['DCE1'] ? 0 : limite2['DCE1'] - parseInt(ctx.find('.E2DCE1').val() || 0));
            limite3['DCE2'] = (parseInt(ctx.find('.E2DCE2').val() || 0) >= limite2['DCE2'] ? 0 : limite2['DCE2'] - parseInt(ctx.find('.E2DCE2').val() || 0));
            limite3['DCE3'] = (parseInt(ctx.find('.E2DCE3').val() || 0) >= limite2['DCE3'] ? 0 : limite2['DCE3'] - parseInt(ctx.find('.E2DCE3').val() || 0));
            // console.log(limite3);

            limite4['DCE1'] = (parseInt(ctx.find('.E3DCE1').val() || 0) >= limite3['DCE1'] ? 0 : limite3['DCE1'] - parseInt(ctx.find('.E3DCE1').val() || 0));
            limite4['DCE2'] = (parseInt(ctx.find('.E3DCE2').val() || 0) >= limite3['DCE2'] ? 0 : limite3['DCE2'] - parseInt(ctx.find('.E3DCE2').val() || 0));
            limite4['DCE3'] = (parseInt(ctx.find('.E3DCE3').val() || 0) >= limite3['DCE3'] ? 0 : limite3['DCE3'] - parseInt(ctx.find('.E3DCE3').val() || 0));
            // console.log(limite4);

            limite5['DCE1'] = (parseInt(ctx.find('.E4DCE1').val() || 0) >= limite4['DCE1'] ? 0 : limite4['DCE1'] - parseInt(ctx.find('.E4DCE1').val() || 0));
            limite5['DCE2'] = (parseInt(ctx.find('.E4DCE2').val() || 0) >= limite4['DCE2'] ? 0 : limite4['DCE2'] - parseInt(ctx.find('.E4DCE2').val() || 0));
            limite5['DCE3'] = (parseInt(ctx.find('.E4DCE3').val() || 0) >= limite4['DCE3'] ? 0 : limite4['DCE3'] - parseInt(ctx.find('.E4DCE3').val() || 0));
            // console.log(limite5);

            var totalE1 = Math.min(parseInt(ctx.find('.E1DCE1').val() || 0), limite1['DCE1']) +
						  Math.min(parseInt(ctx.find('.E1DCE2').val() || 0), limite1['DCE2']) +
						  Math.min(parseInt(ctx.find('.E1DCE3').val() || 0), limite1['DCE3']) +
						  parseInt(ctx.find('.E1DCE4').val() || 0);

            var totalE2 = Math.min(parseInt(ctx.find('.E2DCE1').val() || 0), limite2['DCE1']) +
						  Math.min(parseInt(ctx.find('.E2DCE2').val() || 0), limite2['DCE2']) +
						  Math.min(parseInt(ctx.find('.E2DCE3').val() || 0), limite2['DCE3']) +
						  parseInt(ctx.find('.E2DCE4').val() || 0);

            var totalE3 = Math.min(parseInt(ctx.find('.E3DCE1').val() || 0), limite3['DCE1']) +
						  Math.min(parseInt(ctx.find('.E3DCE2').val() || 0), limite3['DCE2']) +
						  Math.min(parseInt(ctx.find('.E3DCE3').val() || 0), limite3['DCE3']) +
						  parseInt(ctx.find('.E3DCE4').val() || 0);

            var totalE4 = Math.min(parseInt(ctx.find('.E4DCE1').val() || 0), limite4['DCE1']) +
						  Math.min(parseInt(ctx.find('.E4DCE2').val() || 0), limite4['DCE2']) +
						  Math.min(parseInt(ctx.find('.E4DCE3').val() || 0), limite4['DCE3']) +
						  parseInt(ctx.find('.E4DCE4').val() || 0);

            var totalE5 = Math.min(parseInt(ctx.find('.E5DCE1').val() || 0), limite5['DCE1']) +
						  Math.min(parseInt(ctx.find('.E5DCE2').val() || 0), limite5['DCE2']) +
						  Math.min(parseInt(ctx.find('.E5DCE3').val() || 0), limite5['DCE3']) +
						  parseInt(ctx.find('.E5DCE4').val() || 0);

            ctx.find('.TotalE1').text(!isNaN(totalE1) ? totalE1 : '');
            ctx.find('.TotalE2').text(!isNaN(totalE2) ? totalE2 : '');
            ctx.find('.TotalE3').text(!isNaN(totalE3) ? totalE3 : '');
            ctx.find('.TotalE4').text(!isNaN(totalE4) ? totalE4 : '');
            ctx.find('.TotalE5').text(!isNaN(totalE5) ? totalE5 : '');

            ctx.find('input,label').each(function (key, value) {
                setTimeout(function () {
                    fbUtils.applyFormatCurrencyOnElement(value, true);
                }, 20);
            });
            $('.calcular-ingreso-exento').removeAttr('disabled');
        }

        setTimeout(func, 250);
    }
})();
