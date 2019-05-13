var libxml = require('libxmljs');
var fs = require('fs');
var doc;
var gchilds;
var i;

fs.readFile(__dirname + '/Plantilla_ModeloDatos.xml', function(err, data) {
    doc = libxml.parseXmlString(data);

    gchilds = doc.find('//*[@nombre="AyudaEnLinea"]');

    createElements();
    // removeElements();
});

function removeElements() {
	for (i=0; i < gchilds.length; i++) {
		gchilds[i].remove();
	}

    console.log(doc.toString());
}

function createElements() {
	var docAyudas = new libxml.Document();
	var nodeAyudas = docAyudas.node('textos').node('ayudas');
	var entidades = {};

	for (i=0; i < gchilds.length; i++) {
		var entidad = gchilds[i].parent().parent().parent().parent().attr('id');
		entidades[entidad.value()] = {};
	}

	var entidades = Object.getOwnPropertyNames(entidades);
	for (var j in entidades) {
		var entidadNode = nodeAyudas.node('entidad');
		entidadNode.attr({IdEntidad: entidades[j]});
		for (i=0; i < gchilds.length; i++) {

			var idEntidad = gchilds[i].parent().parent().parent().parent().attr('id').value();
			if (idEntidad == entidades[j]) {
				var ayudaNode = entidadNode.node('ayuda');
				var valor = gchilds[i].attr('valor');
				var prop = gchilds[i].parent().parent().attr('id');

				ayudaNode.attr({IdPropiedad: prop.value()});
				ayudaNode.attr({Valor: valor.value()});
			}
		}
	}

	console.log(docAyudas.toString());
}
