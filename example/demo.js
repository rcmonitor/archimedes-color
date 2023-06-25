import index from "cli-interact";
import {Archimedes, ArchimedesConfig, A_CH_RED, A_CH_BLUE} from "../index.js";
const run = () => {
	ArchimedesConfig.aMin = A_CH_BLUE.angle
	ArchimedesConfig.aMax = A_CH_RED.angle + 360
	ArchimedesConfig.rMin = 100
	ArchimedesConfig.rMax = 200
	ArchimedesConfig.valueMin = 5
	ArchimedesConfig.valueMax = 25
	ArchimedesConfig.brightnessMax = 200
	let oArchimedes = new Archimedes(ArchimedesConfig, console)
	while (true){
		let answer = index.getNumber('value (0 - 30)');
		console.log('Archimedes suggests: ', oArchimedes.MGetColor(answer));
	}
}

run();