export const A_CH_RED = {
	name: 'red',
	// angle: 300,
	angle: 90,
}
export const A_CH_GREEN = {
	name: 'green',
	// angle: 180,
	angle: 330,
}
export const A_CH_BLUE = {
	name: 'blue',
	// angle: 60,
	angle: 210,
}

export var ArchimedesConfig = {
	// minimum value to track
	// if the value is greater than 0, everything between 0 and valueMin
	// will be matched to scale between 0 and rMin
	valueMin: 5,
	// maximum value; like, wind is super-rarely more than 30 m/s
	valueMax: 30,
	// aMin: 0,
	aMin: A_CH_BLUE.angle,
	// aMax: 360,
	aMax: A_CH_RED + 360,
	rMin: 50,
	rMax: 255,
	brightnessMax: 255
}

let logger;
export class Archimedes {

	/**
	 *
	 * @param oConfig {object} configuration for Archimedean spiral, scaling and brightness
	 * @param fLog {function} actual logging function i.e. console.debug
	 */
	constructor(oConfig = ArchimedesConfig, oLogger) {
		// Object.assign(this, oConfig)
		logger = oLogger
		this.config = oConfig
		this.setPhiScale()
		this.setRScale()

		this.red = new Channel(A_CH_RED, this.config.brightnessMax)
		this.green = new Channel(A_CH_GREEN, this.config.brightnessMax)
		this.blue = new Channel(A_CH_BLUE, this.config.brightnessMax)
	}

	/**
	 * returns angle corresponding to position on scale
	 * @param flPosition
	 * @returns {number} float
	 */
	getPhi(flPosition){
		if (flPosition <= this.config.valueMin) { return this.config.aMin }
		return this.fK * flPosition + this.fB
	}

	/**
	 * returns radius on an Archimedean spiral according to phi provided
	 * if value is less than minimal, it should be a gradient from 0 to rMin
	 * @param flPhi calculated angle
	 * @param flValue to check if it is less than `minimal value`
	 * @returns {number} float radius
	 */
	getR(flPhi, flValue){
		if (flValue < this.config.valueMin) {
			return this.config.rMin * flValue / this.config.valueMin
		}
		return this.rK * flPhi + this.rB
	}

	/**
	 * calculates k and b in f(l) = kl + b to transpond linear scale to angle
	 * this is inaccurate as length of Archimedean spiral is not linear to angle
	 * but, as it is impossible to get angle out of length analytically, I'm sure not gonna do it numerically
	 */
	setPhiScale() {
		// k = (aMax - aMin) / (m - n)
		// b = aMin - (aMax - aMin) * n / (m - n)
		this.fK = (this.config.aMax - this.config.aMin) / (this.config.valueMax - this.config.valueMin)
		this.fB = this.config.aMin - (this.config.aMax - this.config.aMin) * this.config.valueMin / (this.config.valueMax - this.config.valueMin)
		log(`scaling parameters for Archimedes spiral are: k = ${this.fK}, b = ${this.fB}`)
	}

	/**
	 * calculates k and b in r(a) = ka + b to scale radius according to minimum and maximum values
	 */
	setRScale(){
		this.rK = (this.config.rMax - this.config.rMin) / (this.config.aMax - this.config.aMin)
		this.rB = this.config.rMin - (this.config.rMax - this.config.rMin) * this.config.aMin / (this.config.aMax - this.config.aMin)
		log(`scaling parameters for radius are: k = ${this.rK}, b = ${this.rB}`)
	}

	getSafeValue(flValue){
		// if (flValue < this.valueMin) { return this.valueMin }
		if (flValue < 0) { return 0 }
		if (flValue > this.config.valueMax) { return this.config.valueMax }
		return flValue
	}
	MGetColor(flValue){
		let safeValue = this.getSafeValue(flValue)
		let flPhi = this.getPhi(safeValue)
		let flR = this.getR(flPhi, safeValue)

		log(`Archimedes spiral for value ${flValue} is at ${flPhi} angle, ${flR} radius`)

		let strRed = Archimedes.ToHexString(this.red.MGetLevel(flPhi, flR))
		let strGreen = Archimedes.ToHexString(this.green.MGetLevel(flPhi, flR))
		let strBlue = Archimedes.ToHexString(this.blue.MGetLevel(flPhi, flR))

		log(`Archimedes suggests color components for safe value ${safeValue} as red: ${strRed} green: ${strGreen} blue: ${strBlue}`)

		return Number("0x" + strRed + strGreen + strBlue)
	}

	static ToHexString(intColor){
		return intColor.toString(16).padStart(2, "0")
	}

}

class Channel {

	/**
	 *
	 * @param aCh {object} one of A_CH_GREEN, A_CH_RED, A_CH_BLUE contains central angle of a main channel and channel name
	 * @param brightness {number} maximum brightness for a given channel
	 */
	constructor(aCh, brightness = 255) {
		this.aCH = aCh
		this.brightness = brightness
	}

	/**
	 * calculates distance between angle and central angle of a main channel in degrees
	 * @param a {number} angle
	 */
	dACH(a){
		let d1 = Math.abs(a - this.aCH.angle)
		if (d1 <= 180) { return d1 }
		return Math.abs( Math.abs(a - this.aCH.angle) - 360)
	}

	/**
	 * channel level for given angle on an outer circle of color wheel
	 * @param a
	 * @returns {number}
	 */
	calcOuterLevel(a){
		let dA = this.dACH(a)
		if (dA <= 60){ return this.brightness }
		if (dA <= 120) { return Math.round(this.brightness * 2 - this.brightness * dA / 60)}
		return 0
	}

	/**
	 * calculates final level for given channel intensity (initial radius) and given actual radius on a color wheel
	 * @param outerLevel level of channel calculated for required angle on a color wheel
	 * @param r required radius on a color wheel
	 * @returns {number}
	 * @constructor
	 */
	calcActualLevel(outerLevel, r){
		return Math.round((outerLevel - this.brightness) * r / this.brightness + this.brightness)
	}

	/**
	 * calculates channel level based on position provided
	 * @param flPhi {number} float angle on a color wheel
	 * @param flR {number} float radius on a color wheel
	 * @returns {number}
	 * @constructor
	 */
	MGetLevel(flPhi, flR){
		let outerLevel = this.calcOuterLevel(flPhi)
		let flLevel = this.calcActualLevel(outerLevel, flR)
		log(`${this.aCH.name} channel: outer: ${outerLevel} actual ${flLevel}`)
		return flLevel
	}

	/**
	 * calculates angle (0 .. 359) out of given: - 360 .. 720
	 * @todo use as a safe angle values
	 * @param a
	 * @returns {number|*}
	 */
	static absoluteAngle(a) {
		if ((0 <= a) && (360 > a)) {
			return a
		}
		// implies that 360 <= a < 720; otherwise have to be tweeked
		if (360 <= a) { return a - 360 }
		if (0 > a) { return 360 - a}
	}
}

function log(...args){
	if (logger !== undefined) {
		logger.debug(args)
	}
}