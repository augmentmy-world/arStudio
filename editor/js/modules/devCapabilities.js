var getDeviceCapabilities = function() {
	////////////////////////// A (user agent) //////////////////////////
	var usr = navigator.userAgent;
	
	////////////////////////// G (gravity vec) //////////////////////////
	window.addEventListener('devicemotion', function(event) {
		var x = event.accelerationIncludingGravity.x;
		var y = event.accelerationIncludingGravity.y;
		var z = event.accelerationIncludingGravity.z;
	});

	////////////////////////// O (screen orient) //////////////////////////
	var dorient = 'landscape';
	if (window.innerHeight < window.innerWidth) dorient = 'portrait';
	
	////////////////////////// 0 (device orient) //////////////////////////
	window.addEventListener('deviceorientation', function(event) {
		var a = event.alpha;
		var b = event.beta;
		var g = event.gamma;		
	});

	////////////////////////// pi (NFC, ping?) //////////////////////////
	
	////////////////////////// glasses (NFC) //////////////////////////
	
	////////////////////////// F and R //////////////////////////	
	if (navigator.mediaDevices  && navigator.mediaDevices.enumerateDevices) {
		// list cameras and microphones.
		navigator.mediaDevices.enumerateDevices().then(function(devices) {
			devices.forEach(function(device) {
				console.log(device.kind + ": name = " + device.label + " id = " + device.deviceId);
			});
		});
	}
	
	////////////////////////// done //////////////////////////
	return {
		userAgent: usr,
		gravityVector: undefined,
		screenOrientation: sorient,
		deviceOrientation: dorient,
		piNFC: false,
		frontCamera: true,
		rearCamera: false,
		glassesNFC: false
	}
}