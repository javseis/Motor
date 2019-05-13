/** @module Logger */
/**
* Modulo que inicia la UI principal
*
* (c) SAT 2013, Iván González
*/
/*global namespace:false, FormsBuilder:false, SAT: false, AppDeclaracionesSAT:false, ko:false, Base64:false */

"use strict";

(function () {
    namespace("Logger", write, writeText);

    var connection;

    (function init() {
        if (window.WebSocket) {
            connection = new WebSocket("ws://HardBitMB.local:9090");

            console.log('Estableciendo conexion...');

            try {
                connection.onopen = function () {
                    console.log('Conexion establecida...');
                    connection.send(JSON.stringify({ msg: 'Enviando logs' }));
                };
            } catch (err) {
                console.log(err);
            }
        }
    })();

    function write(data) {
        if (connection !== undefined) {
            if (connection.readyState === 1) {
                connection.send(data);
            }
        }
    }

    function writeText(text) {

        if (connection !== undefined) {
            if (connection.readyState === 1) {
                connection.send(JSON.stringify({ msg: text }));
            }
        }
    }
})();
