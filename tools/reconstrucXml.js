var libxmljs = require('libxmljs');
var fs = require('fs');
var file = __dirname + '/plantilla.txt';

fs.readFile(file, 'utf8', function (err, data) {
  if (err) {
    return console.log('Error: ' + err);
  }

  data = JSON.parse(data);

  var modeloDatos = libxmljs.parseXml(data.Xml[0]);
  var diagramacion = libxmljs.parseXml(data.Xml[1]);
  var navegacion = libxmljs.parseXml(data.Xml[2]);
  var reglas = libxmljs.parseXml(data.Xml[3]);
  var catalogos = libxmljs.parseXml(data.Xml[4]);
  var ayudas = libxmljs.parseXml(data.Xml[5]);

  saveFile('Plantilla_ModeloDatos.xml', modeloDatos.toString());
  saveFile('Plantilla_Diagramacion.xml', diagramacion.toString());
  saveFile('Plantilla_Navegacion.xml', navegacion.toString());
  saveFile('Plantilla_Reglas.xml', reglas.toString());
  saveFile('Plantilla_Catalogos.xml', catalogos.toString());
  saveFile('Plantilla_Ayudas.xml', ayudas.toString());
});

function saveFile(fileName, string) {
	fs.writeFile(fileName, string, function(err) {
	    if (err) {
	        return console.log(err);
	    }

	    console.log("The file " + fileName + " saved!");
	}); 
}