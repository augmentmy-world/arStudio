/*/	Usage:
 *
 *	getDeviceCapabilities().then(function(result) {
 *		console.log(result);
 *		console.log(getPlatform(result));
 *	}, function(err) {
 *		console.log('should never happen');	
 *	});
 *
 *	glasses+pi glasses mobile laptop desktop piNFC glassesNFC hasDeviceOrientation hasDeviceMotion hasFrontCamera hasRearCamera hasGlassesOrient userAgent gravityVector orientVector screenOrientation
 *
/*/

function ping(source, callback) {
	if (!this.inUse) {
		this.status = 'unchecked';
		this.inUse = true;
		this.callback = callback;
		this.source = source;
		var _that = this;
		this.img = new Image();
		this.img.onload = function () {
			_that.inUse = false;
			_that.callback('responded');
		};
		this.img.onerror = function (e) {
			if (_that.inUse) {
				_that.inUse = false;
				_that.callback('responded', e);
			}
		};
		this.start = new Date().getTime();
		this.img.src = this.source + '?' + (+ new Date());
		this.timer = setTimeout(function () {
			if (_that.inUse) {
				_that.inUse = false;
				_that.callback('timeout');
			}
		}, 1500);
	}
}

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

	// ping listener
	that.piCallback = function(status, event) {
		if (status == 'responded' && e == null) {
			that.hasRearCamera = true;
		}
	}
	
	// wait for results from async events
	return new Promise(function(resolve, reject) {
		// F and R
		that.hasFrontCamera = false;
		that.hasRearCamera = false;
		if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
			// list cameras
			navigator.mediaDevices.enumerateDevices().then(function(devices) {
				devices.forEach(function(device) {
					if (device.kind == 'videoinput') {
						console.log(device.kind + ": " + device.label + " id = " + device.deviceId);
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
		that.orientInGlasses = vec3.fromValues(180.0, 180.0, 70.0); //measured on LG G6 with Chrome in DK1 looking level
		window.addEventListener('deviceorientation', that.listenOrient);

		// pi (NFC, ping?)
		that.piNFC = false;
		that._ping = false;
		that._pingTries = 0;
		that.piIP = "10.0.0.192";
		//ping(that.piIP, that.piCallback);

		// O (screen orient)
		that.screenOrientation = 'landscape';
		if (window.innerHeight > window.innerWidth) that.screenOrientation = 'portrait';

		// A (user agent)
		that.userAgent = navigator.userAgent;

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
	// unused: 	glassesNFC	hasRearCamera	gravityVector	orientVector
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

var DeviceCapabilitiesModule = {
	//trigger with LEvent?
	monitor: function() {
        //update LS.GlobalScene.devcap and devplat
    },
    showDialog: function(that) {
		// alias lists
		var devcap = LS.GlobalScene.devcap || "";
		var devplat = LS.GlobalScene.devplat || "";
        // put in Publish Scene dialog?
        // create own dialog
		that.devcapDialog = new LiteGUI.Dialog("devcapDialog", { width: 640, height: 480, closable: true });
		that.devcapDialog.content.style = "height: 428px;";
		// shortcut
		var chkbx = function(list, group, name) {
			var chkd = '', res = list.includes(name);
			if (res) chkd = '" checked="' + res.toString();
			return '<input id="' + group + '" type="checkbox" name="' + group + '" value="' + name + chkd + '" />' + name + '<br />';
		}
        // create some check boxes for device capabilities
        that.devcapDialog.content.innerHTML += '<fieldset><legend>Device Capabilities</legend>' +
			chkbx( devcap, 'devcap', 'piNFC') +
			chkbx( devcap, 'devcap', 'glassesNFC') +
			chkbx( devcap, 'devcap', 'hasDeviceOrientation') +
			chkbx( devcap, 'devcap', 'hasDeviceMotion') +
			chkbx( devcap, 'devcap', 'hasFrontCamera') +
			chkbx( devcap, 'devcap', 'hasRearCamera') +
			chkbx( devcap, 'devcap', 'hasGlassesOrient') +
			'</fieldset>';
        // create some more for platforms
        that.devcapDialog.content.innerHTML += '<fieldset><legend>Supported Platforms</legend>' +
			chkbx( devplat, 'devplat', 'glasses+pi') +
			chkbx( devplat, 'devplat', 'glasses') +
			chkbx( devplat, 'devplat', 'mobile') +
			chkbx( devplat, 'devplat', 'laptop') +
			chkbx( devplat, 'devplat', 'desktop') +
			'</fieldset>';
		that.devcapDialog.addButton("Save and Close", { callback: function() {
            // save devcap
			var dcd = that.devcapDialog.content.getRootNode();
			// get all check boxes
			var dcElements = dcd.getElementsByName('devcap');
			var dpElements = dcd.getElementsByName('devplat');
			// reset
            devcap = '';
            devplat = '';
			// build strings
			for (i in dcElements) {
				if (!dcElements[i].checked) continue;
				var v = dcElements[i].value;
				if (v != null) devcap += v + ' ';
			}
			for (i in dpElements) {
				if (!dpElements[i].checked) continue;
				var v = dpElements[i].value;
				if (v != null) devplat += v + ' ';
			}
			LS.GlobalScene.devcap = devcap;
			LS.GlobalScene.devplat = devplat;
			// exit window
			that.closeDialog(that);
		}});
		that.devcapDialog.addButton("Discard and Close", { callback: function() {
			that.closeDialog(that);
		}});

		that.devcapDialog.show();
		that.devcapDialog.center();
		that.devcapDialog.fadeIn(500);
		
		//this.devcapDialog.content.getElementsByTagName('canvas')[0];

    },
    closeDialog: function(that) {
		//custom fade out
    	that.devcapDialog.fadeOut(500);
    	//wait for transition to finish
    	window.setTimeout(function() {
    		//close the window
    		that.devcapDialog.close();
    	}, 500);
    },
	// called when added
	init: function() {
	    // root?
		var that = this;
		//this module is loaded before others because it's in js/extra
		window.setTimeout(function () {
			LiteGUI.menubar.add("Project/Supported Devices", { callback: function() {
				that.showDialog(that);
			}});
		}, 500);
	},
	// called when removed
	deinit: function() {
		LiteGUI.menubar.remove("Project/Supported Devices");
	}
}

CORE.registerModule( DeviceCapabilitiesModule );
