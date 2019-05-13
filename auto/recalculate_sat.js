/*
* Ivan Gonzalez Zamora
* 
*/
console.log(' [*] Procesando pagina y generando xml');

var fs = require('fs');
var page = require('webpage').create();

var url = 'stepthree.html';

page.onCallback = function(data) {
	console.log(' [*] Se obtuvo una respuesta xml');

	var file = fs.open('./auto/output/output.xml', 'w');
	file.write(data);

	page.render('./auto/output/declaraciones.png');

	phantom.exit();
};

page.open(url, function (status) {
	if (status === 'success') {
		page.evaluate(function() {
			setTimeout(function () {
				if (typeof window.callPhantom === 'function') {
					var xml = FormsBuilder.ViewModel.createXml();

					window.callPhantom(xml);
				}
			}, 10 * 1000);
	    });
	}
});
