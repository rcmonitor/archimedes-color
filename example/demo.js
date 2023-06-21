import index from "cli-interact";
import {Archimedes, ArchimedesConfig, A_CH_RED, A_CH_BLUE} from "../index.js";
const run = () => {
	ArchimedesConfig.aMax = A_CH_RED.angle
	// blue-green
	ArchimedesConfig.aMin = A_CH_BLUE.angle + 30
	ArchimedesConfig.rMin = 100
	ArchimedesConfig.rMax = 200
	ArchimedesConfig.valueMin = 5
	ArchimedesConfig.valueMax = 25
	ArchimedesConfig.brightnessMax = 200
	let oArchimedes = new Archimedes(ArchimedesConfig)
	while (true){
		let answer = index.getNumber('value (0 - 30)');
		console.log('Archimedes suggests: ', oArchimedes.MGetColor(answer));
	}
}

run();