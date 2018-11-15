const CircuitBraker = require("brakes");

const options = {
	timeout: 1000,
	threshold: 1,
	waitThreshold: 2,
    circuitDuration: 20000,
    statInterval: 4000
};

const circuitBraker = new CircuitBraker(options);

module.exports = circuitBraker;