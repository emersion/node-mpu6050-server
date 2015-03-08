var express = require('express');
var expressWs = require('express-ws');
var i2c = require('i2c-bus');
var MPU6050 = require('i2c-mpu6050');

var address = 0x68;
var i2c1 = i2c.openSync(1);
var sensor = new MPU6050(i2c1, address);

var app = express();
var appWs = expressWs(app);

app.ws('/socket', function (ws, res) {});
var wss = appWs.getWss('/socket');

app.get('/rotation', function (req, res) {
	var rot;
	try {
		rot = sensor.readRotationSync();
	} catch (e) {
		console.log(e);
		res.status(500).send(e);
		return;
	}

	res.send(rot.x+' '+rot.y);
});

app.use(express.static(__dirname+'/public'));

var server = app.listen(process.env.PORT || 9000, function () {
	console.log('Server listening', server.address());

	setInterval(function () {
		if (!wss.clients.length) {
			return;
		}

		var data;
		try {
			data = sensor.readSync();
		} catch (e) {
			console.log(e);
			return;
		}
		var msg = JSON.stringify(data);
		wss.clients.forEach(function (client) {
			try {
				client.send(msg);
			} catch (e) {
				console.log(e);
			}
		});
	}, 250);
});

module.exports = server;
