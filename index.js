export const A_CH_GREEN = {
	name: 'green',
	angle: 180
}
export const A_CH_RED = {
	name: 'red',
	angle: 300
}
export const A_CH_BLUE = {
	name: 'blue',
	angle: 60
}

export var ArchimedesConfig = {
	// minimum value to track
	valueMin: 0,
	// maximum value; like, wind is super-rarely more than 30 m/s
	valueMax: 30,
	aMin: 0,
	aMax: 360,
	rMin: 0,
	rMax: 255,
	brightnessMax: 255
}

export class Archimedes {
	red;
	green;
	blue;

	valueMin;
	valueMax;
	aMin;
	aMax;
	rMin;
	rMax;
	// Phi offset
	fB;
	// phi scale coefficient
	fK;
	// radius offset
	rB;
	// radius scale coefficient
	rK;

	/**
	 *
	 * @param oConfig {ArchimedesConfig} configuration for Archimedean spiral, scaling and brightness
	 */
	constructor(oConfig = {}) {
		if (oConfig === undefined){
			oConfig = ArchimedesConfig
		}
		Object.assign(this, oConfig)
		this.setPhiScale()
		this.setRScale()

		this.red = new Channel(A_CH_RED, oConfig.brightnessMax)
		this.green = new Channel(A_CH_GREEN, oConfig.brightnessMax)
		this.blue = new Channel(A_CH_BLUE, oConfig.brightnessMax)
	}

	/**
	 * returns angle corresponding to position on scale
	 * @param flPosition
	 * @returns {float}
	 */
	getPhi(flPosition){
		if (flPosition <= this.valueMin) { return this.aMin }
		return this.fK * flPosition + this.fB
	}

	/**
	 * returns radius on an Archimedean spiral according to phi provided
	 * if value is less than minimal, it should be a gradient from 0 to rMin
	 * @param flPhi calculated angle
	 * @param flValue to check if it is less than `minimal value`
	 * @returns {float}
	 */
	getR(flPhi, flValue){
		if (flValue < this.valueMin) {
			return this.rMin * flValue / this.valueMin
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
		this.fK = (this.aMax - this.aMin) / (this.valueMax - this.valueMin)
		this.fB = this.aMin - (this.aMax - this.aMin) * this.valueMin / (this.valueMax - this.valueMin)
		console.debug(`scaling parameters for Archimedes spiral are: k = ${this.fK}, b = ${this.fB}`)
	}

	/**
	 * calculates k and b in r(a) = ka + b to scale radius according to minimum and maximum values
	 */
	setRScale(){
		this.rK = (this.rMax - this.rMin) / (this.aMax - this.aMin)
		this.rB = this.rMin - (this.rMax - this.rMin) * this.aMin / (this.aMax - this.aMin)
		console.debug(`scaling parameters for radius are: k = ${this.rK}, b = ${this.rB}`)
	}

	getSafeValue(flValue){
		// if (flValue < this.valueMin) { return this.valueMin }
		if (flValue < 0) { return 0 }
		if (flValue > this.valueMax) { return this.valueMax }
		return flValue
	}
	MGetColor(flValue){
		let safeValue = this.getSafeValue(flValue)
		let flPhi = this.getPhi(safeValue)
		let flR = this.getR(flPhi, safeValue)

		console.debug(`dot on an Archimedes spiral corresponding to value ${flValue} is at ${flPhi} angle, ${flR} radius`)

		let strRed = Archimedes.ToHexString(this.red.MGetLevel(flPhi, flR))
		let strGreen = Archimedes.ToHexString(this.green.MGetLevel(flPhi, flR))
		let strBlue = Archimedes.ToHexString(this.blue.MGetLevel(flPhi, flR))

		console.debug(`Archimedes suggests color components for safe value ${safeValue} as red: ${strRed} green: ${strGreen} blue: ${strBlue}`)

		return Number("0x" + strRed + strGreen + strBlue)
	}

	static ToHexString(intColor){
		return intColor.toString(16).padStart(2, "0")
	}

}

class Channel {
	// central angle of a main channel
	aCH;
	brightness;

	/**
	 *
	 * @param aCh central angle of a main channel; one of A_CH_GREEN, A_CH_RED, A_CH_BLUE
	 */
	constructor(aCh, brightness = 255) {
		this.aCH = aCh
		this.brightness = brightness
	}

	/**
	 * distance between angle and central angle of a main channel in degrees
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
	 * @param flPhi {float} angle on a color wheel
	 * @param flR {float} radius on a color wheel
	 * @returns {number}
	 * @constructor
	 */
	MGetLevel(flPhi, flR){
		let outerLevel = this.calcOuterLevel(flPhi)
		let flLevel = this.calcActualLevel(outerLevel, flR)
		console.debug(`${this.aCH.name} channel: outer: ${outerLevel} actual ${flLevel}`)
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