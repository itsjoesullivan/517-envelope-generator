

var envmask = [
	[0, 1, 0, 1, 0, 1, 0, 1],
	[0, 1, 0, 1, 0, 1, 1, 1],
	[0, 1, 1, 1, 0, 1, 1, 1],
	[0, 1, 1, 1, 1, 1, 1, 1]
];

var outputlevel = [
	0, 5, 9, 13, 17, 20, 23, 25, 27, 29, 31, 33, 35, 37, 39,
	41, 42, 43, 45, 46, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61,
	62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80,
	81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99,
	100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114,
	115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127
];

// I think this is used to determine whether our current 
// index + rate will map to a value
function envenable(i, qr) {
	var shift = (qr >> 2) - 11;
	if (shift < 0) {
		var sm = (1 << -shift) - 1;
		if ((i & sm) != sm) return false;
		i >>= -shift;
	}
	var res = envmask[qr & 3][i & 7] != 0;
	return res;
}

// Process an attack step
/*

*/
function attackstep(lev, i, qr) {
  var shift = (qr >> 2) - 11;
  if (!envenable(i, qr)) return lev;
  var slope = 17 - (lev >> 8);
  lev += slope << Math.max(shift, 0);
  return lev;
}

function decaystep(lev, i, qr) {
	var shift = (qr >> 2) - 11;
	if (!envenable(i, qr)) return lev;
	lev -= 1 << Math.max(shift, 0);
	return lev;
}

function Env(params) {
	this.params = params;
	this.level = 0;
	this.ix = 0;
	this.i = 0;
	this.down = true;
	this.advance(0);
	console.log('0', '0', '0');
}

Env.prototype.getsample = function() {
	if (envenable(this.i, this.qr) && (this.ix < 3 || (this.ix < 4 && !this.down))) {
		if (this.rising) {
			var lev = attackstep(this.level, this.i, this.qr);
			if (lev >= this.targetlevel) {
				lev = this.targetlevel;
				console.log(this.ix + 1, this.i, lev);
				this.advance(this.ix + 1);
			}
			this.level = lev;
		} else {
			var lev = decaystep(this.level, this.i, this.qr);
			if (lev <= this.targetlevel) {
				lev = this.targetlevel;
				console.log(this.ix + 1, this.i, lev);
				this.advance(this.ix + 1);
			}
			this.level = lev;
		}
		if (this.i > 100 && lev === 0) {
			console.log(this.ix + 1, this.i, 0);
			process.exit();
		}
	}
	this.i++;
	return this.level;
}

Env.prototype.advance = function(newix) {
	this.ix = newix;
	if (this.ix < 4) {
		var newlevel = this.params['level'+ (newix + 1)];
		var scaledlevel = Math.max(0, (outputlevel[newlevel] << 5) - 224);
		this.targetlevel = scaledlevel;
		this.rising = (this.targetlevel - this.level) > 0;
		var rate_scaling = 0;
		this.qr = Math.min(63, rate_scaling + ((this.params['rate' + (newix + 1)] * 41) >> 6));
	}
}

Env.prototype.keyup = function() {
	console.log('changed level at', this.i);
	this.down = false;
	this.advance(3);
}

function envdata(params, nsamp) {
	var env = new Env(params);
	var result = [];
	for (var i = 0; i < nsamp; i++) {
		if (i == 3 * nsamp / 4) {
			env.keyup();
		}
		result.push(env.getsample());
	}
	return result;
}

var envelopeGenerator = {
	level1: 99,
	rate1: 96,
	level2: 75,
	rate2: 25,
	level3: 0,
	rate3: 25,
	level4: 0,
	rate4: 67
};

var len = 100000000;
x = envdata(envelopeGenerator, len);
//console.log(x);
console.log(x[0], x[25000], x[50000], x[75000], x[90000]);
