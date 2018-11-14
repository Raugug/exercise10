const CircuitBraker = require("brakes");

const options = {
	timeout: 1000,
	threshold: 1,
	waitThreshold: 2,
    circuitDuration: 30000,
    statInterval: 5000
};

const circuitBraker = new CircuitBraker(options);

module.exports = circuitBraker;