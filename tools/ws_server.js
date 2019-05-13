var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({ port: 9090 });

wss.broadcast = function(data) {
	for (var i in this.clients)
		this.clients[i].send(data);
};

wss.on('connection', function(ws) {
	ws.on('message', function(message) {
		wss.broadcast(message);
	});
});