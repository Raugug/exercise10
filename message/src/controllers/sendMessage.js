const http = require("http");
const saveMessage = require("../clients/saveMessage");
const circuitBraker = require('../circuitBraker/braker');
const util = require("util");

//Check state on snapshot stats object
circuitBraker.on("snapshot", snapshot => {
	console.log(`-- OPEN -- ${util.inspect(snapshot.open)}`);
});
  
  module.exports = function (messgBody) {

	const message = messgBody.message;
		delete message['status'];
		const body = JSON.stringify(message);
		
		const postOptions = {
			//host: "messageapp",
			host: "localhost",
			port: 3000,
			path: "/message",
			method: "post",
			json: true,
			headers: {
				"Content-Type": "application/json",
				"Content-Length": Buffer.byteLength(body)
			}
		}
	  
	const circuitFunction = (postOptions) => {

		return new Promise((resolve, reject) => {
			let postReq = http.request(postOptions, (res) => {
				
				if (res.statusCode === 200) {
					console.log({ ...message })
					saveMessage(
						{
							...message,
							status: "OK"
						},
						function (_result, error) {
							if (error) {
								console.log('Error 500: Internal error', error);
							} else {
								console.log('Successfully saved with status OK');
							}
						}
					);
					return resolve(message);
				} else {
					console.error("Error while sending message 1");

					saveMessage(
						{
							...message,
							status: "ERROR"
						},
						() => {
							console.log('Error 500: Internal server error: SERVICE ERROR 1');
						}
					);
					return reject(new Error("Error while sending message"))
				}
			});

			postReq.setTimeout(1000);

			postReq.on("timeout", () => {
				console.error("Timeout Exceeded");
				saveMessage(
					{
						...message,
						status: "TIMEOUT"
					},
					() => {
						console.log('Error 500: Internal server error: TIMEOUT');
					}
				);
				return reject(new Error('Error TIMEOUT'))
			});

			postReq.on("error", () => {
				console.error("Error while sending message 2");

				saveMessage(
					{
						...message,
						status: "ERROR"
					},
					() => {
						console.log('Error 500: Internal server error: SERVICE ERROR 2');
					}
				);
				return reject(new Error("Error while sending message"));
			});

			postReq.write(body);
			postReq.end();
		})
	}

	const circuit = circuitBraker.slaveCircuit(circuitFunction)
	circuit.exec(postOptions)
		.then(result => {
			console.log(`result: ${result}`);
		})
		.catch(error => {
			console.error(`${error}`);
		});
};