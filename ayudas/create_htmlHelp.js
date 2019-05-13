var libxmljs = require('libxmljs');
var fs = require('fs');
var util = require('util');
var path = require('path');

var doc;
var keys = {
	'aportaciones_complementarias.html': 5,
	'depositos_cuentas.html': 8,
	'donativos.html': 3,
	'gastos_funerales.html': 2,
	'honorarios.html': 1,
	'limite_deduccion.html': 10,
	'intereses_reales.html': 4,
	'pago_servicios.html': 9,
	'primas_seguros.html': 6,
	'transportacion_escolar.html': 7,
};
var values = {};

function writeCatalogs() {
	fs.readFile('../xml/Plantilla_Catalogos.xml', function(err, data) {
		var i;
		doc = libxmljs.parseXmlString(data);
		var gchilds = doc.find('//catalogo[@id="99"]/elemento');

		for (i = 0; i < gchilds.length; i++) {
			var key = parseInt(gchilds[i].attr('valor').value());

			gchilds[i].attr('texto').value(values[key]);
		}

		fs.writeFile('./Plantilla_Catalogos.xml', doc.toString(), function (err) {
			if (err) throw err;
			console.log('Plantilla creada, copie el archivo Plantilla_Catalogos.xml en el directorio xml');
		});
	});
}

fs.readdir('./', function(err, files){
	var i;
	for (i = 0; i < files.length; i++) {
		var fileName = files[i];
		if (path.extname(fileName) === '.html') {
			var data = fs.readFileSync(__dirname + '/' +  fileName);
			values[keys[fileName]] = new Buffer(data).toString('base64');
		}
	}

	writeCatalogs();
});
