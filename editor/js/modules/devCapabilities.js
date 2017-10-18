var getDeviceCapabilities = function() {
	var that = this;
	
	// motion listener	TODO: take many samples
	that.listenMotion = function(event) {
		var x = event.acceleration.x;
		var y = event.acceleration.y;
		var z = event.acceleration.z;
		that.hasDeviceMotion = !(x == undefined || (x == 0 && y == 0 && z == 0));
		var xG = event.accelerationIncludingGravity.x;
		var yG = event.accelerationIncludingGravity.y;
		var zG = event.accelerationIncludingGravity.z;
		var hasGrav = !(xG == 0 && yG == 0 && zG == 0);
		if (that.hasDeviceMotion) {
			if (hasGrav) that.gravityVector = vec3.fromValues(xG - x, yG - y, zG - z);
		} else if (++that._motionTries <= 10) return;
		that._motion = true;
		window.removeEventListener('devicemotion', that.listenMotion);
	}
	
	// orientation listener
	that.listenOrient = function(event) {
		var a = event.alpha;
		var b = event.beta;
		var g = event.gamma;
		that.hasDeviceOrientation = !(a == undefined || (a == 0 && b == 0 && g == 0));
		if (that.hasDeviceOrientation) {
			// use this line if we dont care which landscape the phone is in
			that.orientVector = vec3.fromValues(a, Math.abs(b), Math.abs(g));
			// use this line if we want to use the landscape orientation that puts the phone charger towards the hole in the headset
			//that.orientVector = vec3.fromValues(a, -b, g);
			var ang = vec3.distance(that.orientInGlasses, that.orientVector);
			if (ang < 30.) that.hasGlassesOrient = true;
		} else if (++that._orientTries <= 10) return;
		that._orient = true;
		window.removeEventListener('deviceorientation', that.listenOrient);
	}
	
	// wait for results from async events
	return new Promise(function(resolve, reject) {
		// F and R
		that.hasFrontCamera = false;
		that.hasRearCamera = false;
		if (navigator.mediaDevices  && navigator.mediaDevices.enumerateDevices) {
			// list cameras and microphones.
			navigator.mediaDevices.enumerateDevices().then(function(devices) {
				devices.forEach(function(device) {
					if (device.kind == 'videoinput') {
						if (!that.hasFrontCamera) that.hasFrontCamera = true;
						else that.hasRearCamera = true;
					}
				});
			});
		}

		// G (gravity vec)
		that._motion = false;
		that._motionTries = 0;
		that.hasDeviceMotion = false;
		that.gravityVector = vec3.fromValues(0.0, 0.0, 0.0);
		window.addEventListener('devicemotion', that.listenMotion);

		// 0 (device orient)
		that._orient = false;
		that._orientTries = 0;
		that.hasGlassesOrient = false;
		that.hasDeviceOrientation = false;
		that.orientVector = vec3.fromValues(0.0, 0.0, 0.0);
		that.orientInGlasses = vec3.fromValues(180.0, 180.0, 70.0); //measured on LG G6 with Chrome
		window.addEventListener('deviceorientation', that.listenOrient);

		// O (screen orient)
		that.screenOrientation = 'landscape';
		if (window.innerHeight > window.innerWidth) that.screenOrientation = 'portrait';

		// A (user agent)
		that.userAgent = navigator.userAgent;

		// pi (NFC, ping?)
		that.piNFC = false;
		if (that.piNFC) that.hasRearCamera = true;

		// glasses (NFC, check gravity)
		that.glassesNFC = false;

		// done
		that._try = 0;
		that._resolve = resolve;
		that._waitFunc = function() {
			// if not done call function again
			if (!(that._motion && that._orient) && (that._try < 10)) {
				that._try += 1;
				window.setTimeout(that._waitFunc, 100);
				return;
			}
			that._resolve({
				piNFC: that.piNFC,
				glassesNFC: that.glassesNFC,
				hasDeviceOrientation: that.hasDeviceOrientation,
				hasDeviceMotion: that.hasDeviceMotion,
				hasFrontCamera: that.hasFrontCamera,
				hasRearCamera: that.hasRearCamera,
				hasGlassesOrient: that.hasGlassesOrient,
				userAgent: that.userAgent,
				gravityVector: that.gravityVector,
				orientVector: that.orientVector,
				screenOrientation: that.screenOrientation
			});
		}
		window.setTimeout(that._waitFunc, 100);

	});
}

var getPlatform = function(dev) {
	// unused: 	dev.glassesNFC	dev.hasRearCamera	dev.gravityVector	dev.orientVector
	if (dev.userAgent.includes('mobile') || dev.hasDeviceMotion || dev.hasDeviceOrientation) {
		if (dev.hasGlassesOrient) {
			if (dev.piNFC) return 'glasses+pi';
			return 'glasses';
		}
		return 'mobile';
	}
	if (dev.hasFrontCamera && dev.screenOrientation == 'landscape') return 'laptop';
	return 'desktop';
}

var devCapInst = getDeviceCapabilities().then(function(result) {
	console.log(result);
	alert(getPlatform(result));
}, function(err) {
	console.log('should never happen');	
});

/*/	Usage:
 *
 *	var devCapInst = getDeviceCapabilities().then(function(result) {
 *		console.log(result);
 *		console.log(getPlatform(result));
 *	}, function(err) {
 *		console.log('should never happen');	
 *	});
 *
/*/
