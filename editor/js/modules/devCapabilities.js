var getDeviceCapabilities = function() {
	var that = this;
	
	// motion listener
	that.listenMotion = function(event) {
		var x = event.acceleration.x;
		var y = event.acceleration.y;
		var z = event.acceleration.z;
		that.hasDeviceMotion = !(x == null || y == null || z == null);
		var xG = event.accelerationIncludingGravity.x;
		var yG = event.accelerationIncludingGravity.y;
		var zG = event.accelerationIncludingGravity.z;
		var hasGrav = !(xG == null || yG == null || zG == null);
		if (that.hasDeviceMotion) {
			alert('devicemotion: ' + x.toString() + ' ' + y.toString() + ' ' + z.toString());
			if (hasGrav) {
				alert('gravity: ' + xG.toString() + ' ' + yG.toString() + ' ' + zG.toString());
				// TODO: take many samples
				that.gravityVector = vec3.fromValues(xG - x, yG - y, zG - z);
			}
		}
		window.removeEventListener('devicemotion', that.listenMotion);
	}
	
	// orientation listener
	that.listenOrient = function(event) {
		var a = event.alpha;
		var b = event.beta;
		var g = event.gamma;
		that.hasDeviceOrientation = !(a == null || b == null || g == null);
		if (that.hasDeviceOrientation) {
			that.orientVector = vec3.fromValues(a, b, g);
			var ang = vec3.distance(that.orientInGlasses, that.orientVector);
			if (ang < 30.) that.hasGlassesOrient = true;
			alert('deviceorientation: ' + a.toString() + ' ' + b.toString() + ' ' + g.toString() + ' ang: ' + ang.toString());
		}
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
		that.hasDeviceMotion = false;
		that.gravityVector = [0.0, 0.0, 0.0];
		window.addEventListener('devicemotion', that.listenMotion);

		// 0 (device orient)
		that.hasDeviceOrientation = false;
		that.hasGlassesOrient = false;
		that.orientInGlasses = [180.0, -180.0, 45.0]; //measured on LG G6 with Chrome
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
		window.setTimeout(function() {
			resolve({
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
		}, 500);
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
	} else if (dev.userAgent.includes('x64') || dev.userAgent.includes('x86') || dev.userAgent.includes('Windows') || dev.userAgent.includes('Macintosh')) {
		if (dev.hasFrontCamera && dev.screenOrientation == 'landscape') return 'laptop';
		else return 'desktop';
	}
}

var devCapInst = getDeviceCapabilities().then(function(result) {
	alert('o:' + result.hasDeviceOrientation + ' m:' + result.hasDeviceMotion + ' f:' + result.hasFrontCamera + ' r:' + result.hasRearCamera + ' G:' + result.gravityVector[0].toString() + ',' + result.gravityVector[1].toString() + ',' + result.gravityVector[2].toString());
	alert(getPlatform(result));
}, function(err) {
	console.log('should not happen');	
});

/*/	Usage:
 *
 *	var devCapInst = getDeviceCapabilities().then(function(result) {
 *		console.log(result);
 *		console.log(getPlatform(result));
 *	}, function(err) {
 *		console.log('should not happen');	
 *	});
 *
/*/
