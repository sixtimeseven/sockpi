//vim:ts=2:sw=2:tw=90:rnu

const server = require('http').createServer(handler);
const fs = require('fs');
const Gpio = require('onoff').Gpio;
// require socket.io and pass the server object
const io = require('socket.io')(server)

const ledPin = 17 + 571;
const btnPin = 22 + 571;

// set up LED pin as output, button as input with both press and release
const LED = new Gpio(ledPin, 'out');
const BTN = new Gpio(btnPin, 'in', 'both');

// listen on port 8080
server.listen(8080);
console.log("Server running at http://127.0.0.1:8080 \n go to: http://pifive:8080");

// the server
function handler(req, res) {
	// read index.html
	fs.readFile(__dirname + '/public/index.html', function(err, data) {
		if (err) {
			res.writeHead(404, {'Content-Type': 'text/html'});
			return res.end("404 Not Found, bro");
		}

		res.writeHead(200, {'Content-Type': 'text/html'});
		res.write(data);
		return res.end();
	});
}

// websocket connection
io.sockets.on('connection', function(socket) {
	let lightValue = 0;
	BTN.watch(function(err, value) {
		if (err) {
			console.error('Something went wrong', err);
			return;
		}
		lightValue = value;
		// send button status to client
		socket.emit('light', lightValue); 
	});
	// get light status from client
	socket.on('light', function(data) {
		lightValue = data;
		// only change the LED if the status has changed
		if (lightValue != LED.readSync()) {
			LED.writeSync(lightValue);
		}
	});
});


// gracefully kill
process.on('SIGINT', function() {
	console.log("\n\n*** k, bye. ***\n\n");
	// turn off the LED
	LED.writeSync(0);
	// free GPIO resources
	LED.unexport();
	BTN.unexport();

	process.exit();
});

