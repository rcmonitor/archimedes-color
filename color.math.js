import {log as Logger} from '@zos/utils'

const logger = Logger.getLogger("fetch_api")


const A_CH_GREEN = 180
const A_CH_RED = 300
const A_CH_BLUE = 60


export class Archimedes {
	red;
	green;
	blue;

	scaleMin;
	scaleMax;


	constructor(scaleMin = 0, scaleMax = 360) {
		this.scaleMin = scaleMin
		this.scaleMax = scaleMax
		this.red = new Channel(A_CH_RED, this.scaleMin, this.scaleMax)
		this.green = new Channel(A_CH_GREEN, this.scaleMin, this.scaleMax)
		this.blue = new Channel(A_CH_BLUE, this.scaleMin, this.scaleMax)
	}

	getSafeValue(flValue){
		if (flValue < this.scaleMin) { return this.scaleMin }
		if (flValue > this.scaleMax) { return this.scaleMax }
		return flValue
	}
	MGetColor(flValue){
		let safeValue = this.getSafeValue(flValue)
		let strRed = Archimedes.ToHexString(this.red.MGetColor(safeValue))
		let strGreen = Archimedes.ToHexString(this.green.MGetColor(safeValue))
		let strBlue = Archimedes.ToHexString(this.blue.MGetColor(safeValue))

		logger.debug(`Archimedes suggests color components for safe value ${safeValue} as red: ${strRed} green: ${strGreen} blue: ${strBlue}`)

		return Number("0x" + strRed + strGreen + strBlue)
	}

	static ToHexString(intColor){
		return intColor.toString(16).padStart(2, "0")
	}

}

class Channel {
	// central angle of a main channel
	aCH;
	// phi scale B
	fB;
	// phi scale k
	fK;
	// a;

	/**
	 *
	 * @param aCh central angle of a main channel; one of A_CH_GREEN, A_CH_RED, A_CH_BLUE
	 * @param scaleMin minimum value that corresponds to angle of 0
	 * @param scaleMax maximum value that corresponds to angle of 360
	 */
	constructor(aCh, scaleMin = 0, scaleMax = 30) {
		this.aCH = aCh
		// this.a = Math.round(a)
		// this.scaleMin = scaleMin
		// this.scaleMax = scaleMax

		this.setScalePhi(scaleMin, scaleMax)
	}
	// aCHMax(){
	// 	return this.aCH + 60
	// }
	// aCHMin(){
	// 	return this.aCH - 60
	// }

	/**
	 * distance between angle and central angle of a main channel in degrees
	 */
	dACH(a){
		let d1 = Math.abs(a - this.aCH)
		if (d1 <= 180) { return d1 }
		return Math.abs( Math.abs(a - this.aCH) - 360)
	}

	calcOuterLevel(a){
		let dA = this.dACH(a)
		if (dA <= 60){ return 255 }
		if (dA <= 120) { return Math.round(510 - 255 * dA / 60)}
		return 0
	}

	/**
	 * calculates final radius for given channel intensity (initial radius) and given actual radius on an Archimede Spiral
	 * @param outerLevel level of channel calculated for required angle on Archimedean spiral
	 * @param r required radius on an Archimedean spiral
	 * @returns {number}
	 * @constructor
	 */
	calcActualLevel(outerLevel, r){
		return (outerLevel - 255) * r / 255 + 255
	}

	/**
	 * calculates channel level based on position provided
	 * @param flPosition position within a scale [scaleMin .. scaleMax]
	 * @returns {number}
	 * @constructor
	 */
	MGetLevel(flPosition){
		// angle on Archimedean spiral
		let f = this.getPhi(flPosition)
		// radius on Archimedean spiral
		let r = this.getR(f)
		let outerLevel = this.calcOuterLevel(f)
		return this.calcActualLevel(outerLevel, r)
	}

	/**
	 * returns angle corresponding to position on scale
	 * @param flPosition
	 * @returns {*}
	 */
	getPhi(flPosition){
		return this.fK * flPosition + this.fB
	}

	getR(phi){
		return 255 * phi / 360
	}

	/**
	 * calculates k and b in f(l) = kl + b to transpond linear scale to angle
	 * this is inaccurate as length of Archimedean spiral is not linear to angle
	 * but, as it is impossible to get angle out of length analytically, I'm sure not gonna do it numerically
	 * @param scaleMin
	 * @param scaleMax
	 */
	setScalePhi(scaleMin, scaleMax) {
		this.fB = scaleMin
		this.fK = (scaleMax - scaleMin) / 360
	}

	static absoluteAngle(a) {
		if ((0 <= a) && (360 > a)) {
			return a
		}
		// implies that 360 <= a < 720; otherwise have to be tweeked
		if (360 <= a) { return a - 360 }
		if (0 > a) { return 360 - a}
	}
}