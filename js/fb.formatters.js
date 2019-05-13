/* global namespace: false, FormsBuilder: false, SAT: false, TIPO_CFDI: false, ESTADO_CFDI: false, moment: false */

"use strict";

(function () {
    namespace("FormsBuilder.Formatters", consecutivoFormatter, consecutivoInfoFormatter, fechaFormatter, numeroFormatter, monedaFormatter, 
        linkNumeroFormatter, accionesRegistroCfdi, accionesSoloLecturaCfdi, estadoRegistroFormatter, reducirTextoFormatter, 
        alertaInconsistenciasCfdi);

    function consecutivoFormatter(value, row, index) {
        return index + 1;
    }

    function consecutivoInfoFormatter(value, row, index) {
        var consecutivo = "";
        var idEntidad = fbUtils.getEntidad(Object.keys(row)[0]);

        if (!IsNullOrEmptyWhite(idEntidad)) {
            var claveMapeoTipo = FormsBuilder.XMLForm.obtenerPropiedadMapeoPorClave(idEntidad, SAT.Environment.settings("claveMapeoTipoComprobante"));

            if (claveMapeoTipo) {
                var idEntidadPropiedadTipo = "E{0}P{1}".format(idEntidad, claveMapeoTipo.idPropiedad);
                var tipoCfdiRegistro = row[idEntidadPropiedadTipo];

                if (tipoCfdiRegistro !== TIPO_CFDI.INGRESO) {
                    var tipoStr = fbUtils.obtenerTipoCfdiStr(tipoCfdiRegistro).toLowerCase();
                    consecutivo = "<a class='info-cfdi' href='#info-cfdi' data-toggle='modal' data-mostrar-mensaje='{0}'><i class='icon icon-info-sign'></i></a>{1}"
                        .format(tipoStr, index + 1);
                } else {
                    consecutivo = index + 1;
                }
            } else {
                console.error(">>> Formatters.consecutivoInfoFormatter -> No se encontro la propiedad mapeo 'TipoComprobante'");
            }
        }
        return consecutivo;
    }

    function reducirTextoFormatter(value, row, index, table) {
        var textoCorto = "";
        var limite = SAT.Environment.settings("longitudMaximaCampoGrid");

        if (!isNaN(parseInt($(table).attr("data-longitud-maxima-campos")))) {
            limite = parseInt($(table).attr("data-longitud-maxima-campos"));
        }

        if (!IsNullOrEmptyWhite(value)) {
            if (value.length > limite) {
                textoCorto = "<span title='{0}'>{1}...</span>".format(value, value.substr(0, limite));
            } else {
                textoCorto = value;
            }
        }

        return textoCorto;
    }

    function fechaFormatter(value) {
        var fecha = "";
        var regex = /\d{2}[/]\d{2}[/]\d{4}/;

        if (regex.test(value)) {
            fecha = value;
        } else {
            fecha = moment.utc(value).format("DD/MM/YYYY");
        }

        return fecha;
    }

    function numeroFormatter(value) {
        var valorNumero;

        if (!isNaN(parseFloat(value))) {
            valorNumero = parseFloat(value);
        } else {
            valorNumero = 0;
        }

        return valorNumero.toLocaleString("es-MX", { "useGruping": true, "maximumFractionDigits": 2, "minimumFractionDigits": 2 });
    }

    function monedaFormatter(value) {
        var valorMoneda = "";

        if (value && !isNaN(value)) {
            valorMoneda = parseFloat(value).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
        }

        return valorMoneda;
    }

    function linkNumeroFormatter(value, row, index) {
        var link = "";
        var valorNumero = numeroFormatter(value);
        var idEntidad = fbUtils.getEntidad(Object.keys(row)[0]);

        if (!IsNullOrEmptyWhite(idEntidad)) {
            var claveMapeoConceptos = FormsBuilder.XMLForm.obtenerPropiedadMapeoPorClave(idEntidad, SAT.Environment.settings("claveMapeoConceptosCfdi"));

            if (claveMapeoConceptos) {
                var idEntidadPropiedadConceptos = "E{0}P{1}".format(idEntidad, claveMapeoConceptos.idPropiedad);

                if (row[idEntidadPropiedadConceptos] === true
                    && SAT.Environment.settings("isProposal") === false
                    && SAT.Environment.settings("actualizacionimporte") === false) {

                    link = "<a class='mostrar-conceptos-cfdi' href='#detalle-conceptos-cfdi' data-toggle='modal' data-index='{0}' title='Revisar'>".format(index) +
                        "<i class='icon icon-zoom-in'></i>{0}</a></div>".format(valorNumero);
                } else {
                    link = valorNumero;
                }
            } else {
                console.error(">>> Formatters.linkNumeroFormatter -> No se encontro la propiedad mapeo 'ConceptosCfdi'");
            }
        }

        return link;
    }

    function accionesRegistroCfdi(value, row, index) {
        var acciones = "";
        var idEntidad = fbUtils.getEntidad(Object.keys(row)[0]);
        // var grid = $(".sat-container-gridcfdi[entidad='{0}']".format(idEntidad));
        // var tipo = grid.attr("data-tipo-cfdi");

        if (!IsNullOrEmptyWhite(idEntidad)) {
            var claveMapeoEstado = FormsBuilder.XMLForm.obtenerPropiedadMapeoPorClave(idEntidad, SAT.Environment.settings("claveMapeoEstadoCfdi"));

            if (claveMapeoEstado) {
                var idEntidadPropiedadEstado = "E{0}P{1}".format(idEntidad, claveMapeoEstado.idPropiedad);

                if (row[idEntidadPropiedadEstado] === ESTADO_CFDI.ELIMINADO) {
                    acciones = "<a class='recuperar-cfdi' href='#' title='Recuperar CFDI' data-index='{0}'><i class='icon icon-undo'></i></a>";
                } else if (row[idEntidadPropiedadEstado] === ESTADO_CFDI.NUEVO) {
                    acciones = "<a class='eliminar-registro' href='#' title='Eliminar registro' data-index='{0}'><i class='icon icon-minus-sign'></i></a>";
                } else {
                    //if (tipo == TIPO_CFDI.GASTO) {
                    //    var claveMapeoEsCfdiClasificado = FormsBuilder.XMLForm.obtenerPropiedadMapeoPorClave(idEntidad, SAT.Environment.settings("claveMapeoEsCfdiClasificado"));

                    //    if (claveMapeoEsCfdiClasificado) {
                    //        var idEntidadPropiedadEsClasificado = "E{0}P{1}".format(idEntidad, claveMapeoEsCfdiClasificado.idPropiedad);

                    //        if (row[idEntidadPropiedadEsClasificado] == false) {
                    //            acciones = "<a class='ver-detalle' href='#detalle-cfdi' data-toggle='modal' title='Ver detalle' data-index='{0}'><i class='icon icon-eye-open'></i></a>" +
                    //            "<a class='editar-registro margin-left' href='#' title='Editar registro' data-index='{0}'><i class='icon icon-edit'></i></a>" +
                    //            "<a class='eliminar-registro margin-left' href='#' title='Eliminar registro' data-index='{0}'><i class='icon icon-minus-sign'></i></a>";
                    //        } else {
                    //            acciones = "<a class='ver-detalle' href='#detalle-cfdi' data-toggle='modal' title='Ver detalle' data-index='{0}'><i class='icon icon-eye-open'></i></a>" +
                    //            "<a class='eliminar-registro margin-left' href='#' title='Eliminar registro' data-index='{0}'><i class='icon icon-minus-sign'></i></a>";
                    //        }
                    //    } else {
                    //        console.error(">>> Formatters.accionesRegistroCfdi -> No se encontro la propiedad mapeo 'EsCfdiClasificado'");
                    //    }
                    //} else {
                    //    acciones = "<a class='ver-detalle' href='#detalle-cfdi' data-toggle='modal' title='Ver detalle' data-index='{0}'><i class='icon icon-eye-open'></i></a>" +
                    //    "<a class='eliminar-registro margin-left' href='#' title='Eliminar registro' data-index='{0}'><i class='icon icon-minus-sign'></i></a>";
                    //}

                    acciones = "<a class='ver-detalle' href='#detalle-cfdi' data-toggle='modal' title='Ver detalle' data-index='{0}'><i class='icon icon-eye-open' title='Ver detalle'></i></a>" +
                        "<a class='eliminar-registro margin-left' href='#' title='Eliminar registro' data-index='{0}'><i class='icon icon-minus-sign' title='Eliminar registro'></i></a>";
                }
            } else {
                console.error(">>> Formatters.accionesRegistroCfdi -> No se encontro la propiedad mapeo 'Estado'");
            }
        }

        return "<div style='width: 70px;'>" + acciones.format(index) + "</div>";
    }

    function accionesSoloLecturaCfdi(value, row, index) {
        var acciones = "<a class='ver-detalle' href='#detalle-cfdi' data-toggle='modal' title='Ver detalle' data-index='{0}'><i class='icon icon-eye-open'></i></a>";

        return acciones.format(index);
    }

    function estadoRegistroFormatter(row) {
        var formato = {};
        var idEntidad = fbUtils.getEntidad(Object.keys(row)[0]);

        if (!IsNullOrEmptyWhite(idEntidad)) {
            var claveMapeoEstado = FormsBuilder.XMLForm.obtenerPropiedadMapeoPorClave(idEntidad, SAT.Environment.settings("claveMapeoEstadoCfdi"));

            if (claveMapeoEstado) {
                var idEntidadPropiedadEstado = "E{0}P{1}".format(idEntidad, claveMapeoEstado.idPropiedad);

                switch (row[idEntidadPropiedadEstado]) {
                    case ESTADO_CFDI.ELIMINADO:
                        formato.classes = "danger";
                        break;
                    case ESTADO_CFDI.NUEVO:
                        formato.classes = "success";
                        break;
                }
            } else {
                console.error(">>> Formatters.estadoRegistroFormatter -> No se encontro la propiedad mapeo 'Estado'");
            }
        }

        return formato;
    }

    function alertaInconsistenciasCfdi(value, row) {
        var alerta;
        var idEntidad = fbUtils.getEntidad(Object.keys(row)[0]);

        if (!IsNullOrEmptyWhite(idEntidad)) {
            var claveMapeoInconsistencias = FormsBuilder.XMLForm.obtenerPropiedadMapeoPorClave(idEntidad, SAT.Environment.settings("claveMapeoInconsistenciasCfdi"));

            if (claveMapeoInconsistencias) {
                var idEntidadPropiedad = "E{0}P{1}".format(idEntidad, claveMapeoInconsistencias.idPropiedad);

                if (!IsNullOrEmptyWhite(row[idEntidadPropiedad])) {
                    var inconsistencias = row[idEntidadPropiedad].split("|");
                    var catalogoInconisistencias = $(FormsBuilder.XMLForm.getCatalogos()).find("catalogo[id='204']");
                    var mensaje = "<ul>";

                    inconsistencias.forEach(function (inconsistencia) {
                        mensaje += "<li class=\"text-justify\">" + $("elemento[valor='{0}']".format(inconsistencia), catalogoInconisistencias).attr("texto") + "</li>";
                    });

                    mensaje += "</ul>";

                    alerta = "<a class='alerta-inconsistencias' href='#' title='Ver inconsistencias' data-mensaje='{0}'><i class='icon icon-warning-fa'></i></a>"
                        .format(mensaje);
                }
            } else {
                console.error(">>> Formatters.alertaInconsistenciasCfdi -> No se encontro la propiedad mapeo 'InconsistenciasCfdi'");
            }
        }

        return alerta;
    }
})();