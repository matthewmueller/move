
var parseColor = require('color-parser')
var Emitter = require('emitter/light')
var style = require('computed-style')
var Tween = require('tween/tween')
var reset = Tween.prototype.reset
var tweens = require('./tweens')
var prefix = require('prefix')
var merge = require('merge')
var raf = require('raf')
var css = require('css')

module.exports = function(el){
	return new Move(el)
}

/**
 * the Move class
 *
 * @param {Element} el
 * @api public
 */

function Move(el){
	this.tweens = {}
	this.el = el
}

/**
 * mixin methods
 */

merge(Move.prototype, Emitter.prototype)
merge(Move.prototype, Tween.prototype)
merge(Move, Tween)

/**
 * add `prop` to animation. When the animation is run
 * `prop` will be tweened from its current value to `to`
 *
 * @param {String} prop
 * @param {CSS} to
 * @return {this}
 */

Move.prototype.set = function(prop, to){
	this.tween(prop, this.current(prop), to)
	return this
}

/**
 * get tween for `prop` with force; if it doesn't
 * exist it will be created
 *
 * @param {String} prop
 * @return {Tween}
 * @api private
 */

Move.prototype.getf = function(prop){
	prop = prefix(prop)
	var tweens = this.tweens
	if (tweens[prop]) return tweens[prop]
	var curr = this.current(prop)
	this.tween(prop, curr, curr)
	return tweens[prop]
}

/**
 * increment `prop` by `n`
 *
 * @param {String} prop
 * @param {Number} to
 * @return {this}
 */

Move.prototype.add = function(prop, n){
	var curr = parseInt(this.current(prop), 10)
	this.tween(prop, curr, curr + n)
	return this
}

/**
 * decrement `prop` by `n`
 *
 * @param {String} prop
 * @param {Number} to
 * @return {this}
 */

Move.prototype.sub = function(prop, n){
	var curr = parseInt(this.current(prop), 10)
	this.tween(prop, curr, curr - n)
	return this
}

/**
 * add a tween
 *
 * @param {String} prop
 * @param {CSS} from
 * @param {CSS} to
 * @api private
 */

Move.prototype.tween = function(prop, from, to){
	this.tweens[prop] = tween(prop, from, to)
}

/**
 * get the current value of `prop`
 *
 * @param {String} prop
 * @return {CSS}
 */

Move.prototype.current = function(prop){
	return style(this.el)[prop]
}

/**
 * Skew `x` and `y`.
 *
 * @param {Number} x
 * @param {Number} y
 * @return {Move} for chaining
 * @api public
 */

Move.prototype.skew = function(x, y){
	this.getf('transform').skew(
		toRadians(x),
		toRadians(y || 0))
	return this
}

/**
 * Skew x by `n`.
 *
 * @param {Number} n
 * @return {Move} for chaining
 * @api public
 */

Move.prototype.skewX = function(n){
	return this.skew(n, 0)
}

/**
 * Skew y by `n`.
 *
 * @param {Number} n
 * @return {Move} for chaining
 * @api public
 */

Move.prototype.skewY = function(n){
	return this.skew(0, n)
}

/**
 * Translate `x` and `y` axis.
 *
 * @param {Number} x
 * @param {Number} y
 * @param {Number} z
 * @return {Move} for chaining
 * @api public
 */

Move.prototype.translate = function(x, y, z){
	this.getf('transform').translate(x, y, z || 0)
	return this
}

/**
 * Translate on the x axis to `n`.
 *
 * @param {Number} n
 * @return {Move} for chaining
 * @api public
 */

Move.prototype.translateX =
Move.prototype.x = function(n){
	return this.translate(n, 0, 0)
}

/**
 * Translate on the y axis to `n`.
 *
 * @param {Number} n
 * @return {Move} for chaining
 * @api public
 */

Move.prototype.translateY =
Move.prototype.y = function(n){
	return this.translate(0, n, 0)
}

/**
 * Scale the x and y axis by `x`, or
 * individually scale `x` and `y`.
 *
 * @param {Number} x
 * @param {Number} y
 * @return {Move} for chaining
 * @api public
 */

Move.prototype.scale = function(x, y){
	this.getf('transform').scale(x, y, 1)
	return this
}

/**
 * Scale x axis by `n`.
 *
 * @param {Number} n
 * @return {Move} for chaining
 * @api public
 */

Move.prototype.scaleX = function(n){
	return this.scale(n, 1, 1)
}

/**
 * Scale y axis by `n`.
 *
 * @param {Number} n
 * @return {Move} for chaining
 * @api public
 */

Move.prototype.scaleY = function(n){
	return this.scale(1, n, 1)
}

/**
 * Rotate `n` degrees.
 *
 * @param {Number} n
 * @return {Move} for chaining
 * @api public
 */

Move.prototype.rotate = function(n){
	this.getf('transform').rotate(0, 0, n)
	return this
}

/**
 * create a frame at point `p` through the animation
 *
 * @param {Number} p
 * @return {Object}
 * @api private
 */

Move.prototype.frame = function(p){
	var tweens = this.tweens
	var curr = this._curr
	for (var k in tweens) {
		curr[k] = tweens[k].frame(p)
	}
	return curr
}

/**
 * reset the animation so it can be re-used
 *
 * @return {this}
 * @api public
 */

Move.prototype.reset = function(){
	for (var tween in this.tweens) {
		this.tweens[tween]
			.ease(this._ease)
			.reset()
	}
	reset.call(this)
	this._curr = {}
	// precomputed last frame
	this._to = copy(this.frame(1))
	return this
}

/**
 * set duration to `n`. if `n` is a string it
 * is assumed to be in seconds
 *
 * @param {Number|String} n
 * @return {this}
 */

Move.prototype.duration = function(n){
	if (typeof n == 'string') n = parseFloat(n) * 1000
	this._duration = n
	return this
}

/**
 * Create a `DeferredMove` instance which will run
 * when `this` move completes.
 *
 * @return {DeferredMove}
 * @api public
 */

Move.prototype.then = function(){
	var move = new DeferredMove(this)
	this.on('end', function(){
		move.run()
	})
	if (!this.running) this.run()
	return move
}

/**
 * create a specialized sub-class of `Move` for use
 * in `then()`
 *
 * @param {Move} parent
 * @api private
 */

var DeferredMove = Move.extend(function(parent){
	this._duration = parent._duration
	this._ease = parent._ease
	this.parent = parent
	this.el = parent.el
	this.tweens = {}
}, 'final')

/**
 * check parent tween incase `prop` is currently being
 * animated. If it is get the final frame
 *
 * @param {String} prop
 * @return {CSS}
 * @api private
 */

DeferredMove.prototype.current = function(prop){
	if (prop in this.parent._to) {
		return this.parent._to[prop]
	}
	return style(this.el)[prop]
}

/**
 * sugar for `this.parent`. Sometimes looks nicer in
 * long chains
 *
 * @return {Move}
 * @api public
 */

DeferredMove.prototype.pop = function(){
	return this.parent
}

/**
 * run the animation with an optional duration
 *
 * @param {Number|String} [n]
 * @return {this}
 * @api public
 */

Move.prototype.run = function(n){
	if (n != null) this.duration(n)
	var self = this
	raf(function loop(){
		css(self.el, self.next())
		if (self.done) self.emit('end')
		else raf(loop)
	})
	this.running = true
	this.reset()
	return this
}

Move.prototype.on('end', function(){
	this.running = false
})

/**
 * determine type of `css` value
 *
 * @param {String|Number} css
 * @return {String}
 * @api private
 */

function type(css){
	if (typeof css == 'number') return 'px'
	if (/^matrix/.test(css)) return 'matrix'
	if (/^\d+px/.test(css)) return 'px'
	if (parseColor(css)) return 'color'
}

function tween(prop, from, to){
	var Tween = tweens[type(from)]
		|| tweens[defaultType[prop]]
	return new Tween(from, to)
}

/**
 * map of default types
 * @type {Object}
 */

var defaultType = {}
defaultType[prefix('transform')] = 'matrix'

function copy(obj){
	return merge({}, obj)
}

function toRadians(angle){
	return angle * (Math.PI / 180)
}