'use strict';

var clientFromConnectionString = require('azure-iot-device-mqtt').clientFromConnectionString;
var Message = require('azure-iot-device').Message;
const http = require("http");
//require('string.prototype.startswith');

//example URL http://raspberrypi02/html/pipan.php?pan=90&tilt=60
var url = "http://raspberrypi03/html/pipan.php?"
var connectionString = "yourConnectionString";

var client = clientFromConnectionString(connectionString);
var panpiFifoPipePath = "/var/www/html/pipan_bak.txt"


function printResultFor(op) {
	return function printResult(err, res) {
		if (err) console.log(op + ' error: ' + err.toString());
	};
}

//get FIFO file on PIPAN to check actual seetings
function readPanPiFile(inputFile) {
	var arr = new Array();
	var fs = require('fs');
	var contents = fs.readFileSync(inputFile, 'utf8');
	arr = contents.split(" ");
	console.log("pan value: " + arr[0] + " tilt value: " + arr[1]);
	return arr;
}

function callPanTiltService(pan, tilt) {

	var requesturl = url + "pan=" + pan + "&tilt=" + tilt;
	console.log("requesting: " + requesturl);
	http.get(requesturl, (resp) => {
		let data = '';
		// A chunk of data has been recieved.
		resp.on('data', (chunk) => {
			data += chunk;
		});

		// The whole response has been received. Print out the result.
		resp.on('end', () => {
			//console.log(JSON.parse(data).explanation);
		});

	}).on("error", (err) => {
		console.log("Error: " + err.message);
	});
}

var connectCallback = function (err) {
	if (err) {
		console.log('Could not connect: ' + err);
	} else {

		console.log('Client connected');
		client.on('message', function (msg) {
			let strdata=msg.data.toString();
			if (msg.data == "left") {
				//pan +10
				console.log("start moving pan left");
				console.log("start reading pan tilt values");
				var pantiltvalues = readPanPiFile(panpiFifoPipePath);
				var panAsInt = parseInt(pantiltvalues[0]);
				var tiltAsInt = parseInt(pantiltvalues[1]);
				console.log("start setting new pan value");
				var newpanvalue = panAsInt + 10;
				console.log("start calling pan tilt service");
				callPanTiltService(newpanvalue.toString(), pantiltvalues[0]);
				console.log("moved pan left");
			} else if (msg.data == "right") {
				//pan -10

				var pantiltvalues = readPanPiFile(panpiFifoPipePath);
				var panAsInt = parseInt(pantiltvalues[0]);
				var tiltAsInt = parseInt(pantiltvalues[1]);
				var newpanvalue = panAsInt - 10;
				callPanTiltService(newpanvalue.toString(),pantiltvalues[0]);    
				console.log("moved pan right");
			} else if (msg.data == "up") {
				// tilt -10

				var pantiltvalues = readPanPiFile(panpiFifoPipePath);
				var panAsInt = parseInt(pantiltvalues[0]);
				var tiltAsInt = parseInt(pantiltvalues[1]);
				var newtiltvalue = tiltAsInt - 10;
				callPanTiltService(pantiltvalues[0], newtiltvalue);
				console.log("moved tilt up");
			} else if (msg.data == "down") {
				//tilt +10

				var pantiltvalues = readPanPiFile(panpiFifoPipePath);
				var panAsInt = parseInt(pantiltvalues[0]);
				var tiltAsInt = parseInt(pantiltvalues[1]);
				var newtiltvalue = tiltAsInt + 10;
				callPanTiltService(pantiltvalues[0], newtiltvalue);
				console.log("moved tilt down");
			} else if (strdata.startsWith("pic#")) {
				
				console.log("cmd pic# received");
				var args = new Array();
				args = strdata.split("#");

				
			}

		
			client.complete(msg, printResultFor('completed'));
		});
	}
};

client.open(connectCallback);