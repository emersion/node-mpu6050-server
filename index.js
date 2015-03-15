var express = require('express');
var expressWs = require('express-ws');
var i2c = require('i2c-bus');
var MPU6050 = require('i2c-mpu6050');

var address = 0x68;
var i2c1 = i2c.openSync(1);
var sensor = new MPU6050(i2c1, address);

var app = express();
var appWs = expressWs(app);

var reading = false;
app.ws('/socket', function (ws, res) {
	if (!reading) {
		readSensor();
	}
});
var wss = appWs.getWss('/socket');

var readSensor = function () {
	if (!wss.clients.length) {
		reading = false;
		return;
	}
	if (!reading) {
		reading = true;
	}

	var start = new Date().getTime();
	sensor.read(function (err, data) {
		if (err) {
			console.log(err);
		} else {
			var time = new Date().getTime() - start;
			var msg = JSON.stringify(data);
			wss.clients.forEach(function (client) {
				try {
					client.send(msg);
				} catch (e) {
					console.log(e);
				}
			});
			readSensor();
		}
	});
};

app.get('/rotation', function (req, res) {
	sensor.readRotation(function (err, rot) {
		if (err) {
			console.log(e);
			res.status(500).send(e);
			return;
		}

		res.send(rot.x+' '+rot.y);
	});
});

app.use(express.static(__dirname+'/public'));

var server = app.listen(process.env.PORT || 9000, function () {
	console.log('Server listening', server.address());
});

module.exports = server;
