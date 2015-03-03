var express = require('express');
var expressWs = require('express-ws');
var i2c = require('i2c-bus');
var MPU6050 = require('i2c-mpu6050');

var address = 0x68;
var i2c1 = i2c.openSync(1);
var sensor = new MPU6050(i2c1, address);

var app = express();
var appWs = expressWs(app);

app.get('/rotation', function (req, res) {
	var rot;
	try {
		rot = sensor.readRotation();
	} catch (e) {
		console.log(e);
		res.status(500).send(e);
		return;
	}

	res.send(rot.x+' '+rot.y);
});

app.ws('/rotation', function (ws, res) {});
var rotationWss = appWs.getWss('/rotation');

app.use(express.static(__dirname+'/public'));

var server = app.listen(process.env.PORT || 9000, function () {
	console.log('Server listening', server.address());

	setInterval(function () {
		if (!rotationWss.clients.length) {
			return;
		}

		var rot;
		try {
			rot = sensor.readRotation();
		} catch (e) {
			console.log(e);
			return;
		}
		rotationWss.clients.forEach(function (client) {
			client.send(rot.x+' '+rot.y+'\n');
		});
	}, 250);
});

module.exports = server;