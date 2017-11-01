/**
 * Created by chriswalsh on 10/4/17.
 */

var HeadtrackingModule = {
	name: "Headtracking Plugin",
	description: "Enhanced immersion",
	icon: "imgs/mini-icon-headtracking.png",

	// gets camera and suggested location
	updateCam: function(mid, ledge) {
		this.camera = ToolUtils.getCamera();
		if (this.camera == null) return;

		// if supplied with suggestions
		if (mid != null && ledge != null && ledge > 0.0) {
			// back out camera so we can see AABBs longest possible diag within FOV
			var dist = (ledge * 1.41421356237) / Math.sin(this.camera.fov * Math.PI / 180.0);
			var orthoForward = this.camera._model_matrix.slice(8,11);
			// preserve look direction?
			this.camera.eye = vec3.scaleAndAdd(vec3.create(), mid, orthoForward, dist);
			this.camera.center = mid;
			this.dist = dist;
		} else {
			// just start from where we already are
			this.dist = 100.0;
		}

		// save the projection matrix
		this.camMatrix = this.camera._projection_matrix;
		// how many frames weve had head tracking
		this.frame = 0;
		// initial transform for comfort
		this.camera.initialPosition = {
			x: 0.0,
			y: 0.0,
			z: 0.0
		};
		this.camera.lastEvent = {
			x: 0.0,
			y: 0.0,
			z: 0.0
		};
	},
	
	// function hooked up to document listener
	handleHeadTracking: function(event) {
		var htm = HeadtrackingModule;
		if (htm == null) return;
		
		// check if they changed camera or something
		if (htm.camera == null) htm.updateCam();

		// calibrate 0,0,0 to initial head position
		if (htm.frame == 0) {
			htm.camera.initialPosition = {
				x: event.x,
				y: event.y,
				z: event.z
			};
		}
		
		//console.log("detector: " + event.x.toString() + ", " + event.y.toString() + ", " + event.z.toString());

		// motion tracking output delta
		var detectorPosition = {
			x: event.x - htm.camera.initialPosition.x - htm.camera.lastEvent.x,
			y: event.y - htm.camera.initialPosition.y - htm.camera.lastEvent.y,
			z: 0.0
		};
		
		// helps scale invariance
		var scl = Math.sqrt(htm.dist) * 0.1;
		detectorPosition.x *= scl;
		detectorPosition.y *= scl;
		
		// build translation
		var dlta = vec3.create();
		// slice the orthonormal basis out of mat4
		var orthoRight = htm.camera._model_matrix.slice(0,3);
		var orthoUp = htm.camera._model_matrix.slice(4,7);
		vec3.scaleAndAdd(dlta, dlta, orthoRight, detectorPosition.x);
		vec3.scaleAndAdd(dlta, dlta, orthoUp, detectorPosition.y);
		vec3.add(htm.camera.eye, htm.camera.eye, dlta);
		vec3.add(htm.camera.center, htm.camera.center, dlta);
		
		// force update all
		htm.camera.updateMatrices(true);

		// delta to absolute, CM to M
		detectorPosition.x = (detectorPosition.x + htm.camera.lastEvent.x) * 0.01;
		detectorPosition.y = (detectorPosition.y + htm.camera.lastEvent.y) * 0.01;
		detectorPosition.z = event.z * 0.01;
		
		// recover variables that headtracking has changed
		var near = htm.camera.near + detectorPosition.z;
		var far = htm.camera.far + near;
		var w = near/htm.camMatrix[0];
		var h = near/htm.camMatrix[5];

		// change the vanishing point of the projection matrix to complete effect
		var left = -w - detectorPosition.x;
		var right = w - detectorPosition.x;
		var bottom = -h - detectorPosition.y;
		var top = h - detectorPosition.y;

		// new coefficients
		var x =  (2.0 * near)   / (right - left);
		var y =  (2.0 * near)   / (top - bottom);
		var a =  (right + left) / (right - left);
		var b =  (top + bottom) / (top - bottom);
		var c = -(far + near)   / (far - near);
		var d = -(2.0 * far * near) / (far - near);
		var e = -1.0;
	
		// new projection matrix
		var m = htm.camera._projection_matrix;
		m[0] =   x; m[4] = 0.0; m[8] =  a; m[12] = 0.0;
		m[1] = 0.0; m[5] =   y; m[9] =  b; m[13] = 0.0;
		m[2] = 0.0; m[6] = 0.0; m[10] = c; m[14] =   d;
		m[3] = 0.0; m[7] = 0.0; m[11] = e; m[15] = 0.0;
		// camera does not support asymmetrical transforms so they must be done manually
		mat4.multiply(htm.camera._viewprojection_matrix, htm.camera._projection_matrix, htm.camera._view_matrix);
		
		// trigger re-render of scene
		LS.GlobalScene.refresh();
		// last event for delta
		htm.camera.lastEvent = {
			x: (event.x - htm.camera.initialPosition.x),
			y: (event.y - htm.camera.initialPosition.y),
			z: (event.z - htm.camera.initialPosition.z)
		};
		htm.frame += 1;
	},
	
	// function hooked up to document listener
	handleHeadTrackingWithZ: function(event) {
		var htm = HeadtrackingModule;
		if (htm == null) return;
		
		// check if they changed camera or something
		if (htm.camera == null) htm.updateCam();

		// calibrate 0,0,0 to initial head position
		if (htm.frame == 0) {
			htm.camera.initialPosition = {
				x: event.x,
				y: event.y,
				z: event.z
			};
		}
		
		//console.log("detector: " + event.x.toString() + ", " + event.y.toString() + ", " + event.z.toString());

		// motion tracking output delta
		var detectorPosition = {
			x: event.x - htm.camera.initialPosition.x - htm.camera.lastEvent.x,
			y: event.y - htm.camera.initialPosition.y - htm.camera.lastEvent.y,
			z: event.z - htm.camera.initialPosition.z - htm.camera.lastEvent.z,
		};
		
		// helps scale invariance
		var scl = Math.sqrt(htm.dist) * 0.1;
		detectorPosition.x *= scl;
		detectorPosition.y *= scl;
		detectorPosition.z *= scl;
		
		// build translation
		var dlta = vec3.create();
		// slice the orthonormal basis out of mat4
		var orthoRight = htm.camera._model_matrix.slice(0,3);
		var orthoUp = htm.camera._model_matrix.slice(4,7);
		var orthoForward = htm.camera._model_matrix.slice(8,11);
		vec3.scaleAndAdd(dlta, dlta, orthoRight, detectorPosition.x);
		vec3.scaleAndAdd(dlta, dlta, orthoUp, detectorPosition.y);
		vec3.scaleAndAdd(dlta, dlta, orthoForward, detectorPosition.z);
		// add location delta so we dont fight with mouse input
		vec3.add(htm.camera.eye, htm.camera.eye, dlta);
		vec3.add(htm.camera.center, htm.camera.center, dlta);

		// change FOV?
		var scrHeight = 10.0; //screen height cm * 0.5
		var scrDepth = event.z; //eye z in cm
		var TO_DEG = 360.0 / Math.PI;
		htm.camera.fov = 35.0 + Math.atan(scrHeight / scrDepth) * TO_DEG;
		
		// force update all
		htm.camera.updateMatrices(true);
		// save the projection matrix
		htm.camMatrix = htm.camera._projection_matrix;
		
		// delta to absolute, CM to M
		detectorPosition.x = (detectorPosition.x + htm.camera.lastEvent.x) * 0.01;
		detectorPosition.y = (detectorPosition.y + htm.camera.lastEvent.y) * 0.01;
		detectorPosition.z = event.z * 0.01;
		
		// recover variables that headtracking has changed
		var near = htm.camera.near + detectorPosition.z;
		var far = htm.camera.far + near;
		var w = near/htm.camMatrix[0];
		var h = near/htm.camMatrix[5];

		// change the vanishing point of the projection matrix to complete effect
		var left = -w - detectorPosition.x;
		var right = w - detectorPosition.x;
		var bottom = -h - detectorPosition.y;
		var top = h - detectorPosition.y;

		// new coefficients
		var x =  (2.0 * near)   / (right - left);
		var y =  (2.0 * near)   / (top - bottom);
		var a =  (right + left) / (right - left);
		var b =  (top + bottom) / (top - bottom);
		var c = -(far + near)   / (far - near);
		var d = -(2.0 * far * near) / (far - near);
		var e = -1.0;
	
		// new projection matrix
		var m = htm.camera._projection_matrix;
		m[0] =   x; m[4] = 0.0; m[8] =  a; m[12] = 0.0;
		m[1] = 0.0; m[5] =   y; m[9] =  b; m[13] = 0.0;
		m[2] = 0.0; m[6] = 0.0; m[10] = c; m[14] =   d;
		m[3] = 0.0; m[7] = 0.0; m[11] = e; m[15] = 0.0;
		// camera does not support asymmetrical transforms so they must be done manually
		mat4.multiply(htm.camera._viewprojection_matrix, htm.camera._projection_matrix, htm.camera._view_matrix);
		
		// trigger re-render of scene
		LS.GlobalScene.refresh();
		// last event for delta
		htm.camera.lastEvent = {
			x: (event.x - htm.camera.initialPosition.x),
			y: (event.y - htm.camera.initialPosition.y),
			z: (event.z - htm.camera.initialPosition.z)
		};
		htm.frame += 1;
	},

	// stop head tracking
	Stop: function() {
		if (!this.enabled) return; // already stopped
		document.removeEventListener('headtrackingEvent', this.handleHeadTracking);
		document.removeEventListener('headtrackingEvent', this.handleHeadTrackingWithZ);
		if (this.headtrackr != null) {
			this.headtrackr.stream.getTracks()[0].stop();
			this.headtrackr.stop();
			delete this.headtrackr;
		}
		if (this.canv != null) {
			this.canv.innerHTML='';
			delete this.canv;
		}
		if (this.vid != null) {
			this.vid.innerHTML='';
			delete this.vid;
		}
		if (this.win != null) {
			this.win.close();
			delete this.win;
		}
		// force update all (resets projection matrix)
		this.camera.updateMatrices(true);

		this.enabled = false;
	},

	// start head tracking
	Start: function() {
		if (this.enabled) { // already started
			this.enableZ = !this.enableZ;
			if (this.enableZ) {
				var statusEvent = document.createEvent("Event");
				statusEvent.initEvent("headtrackrStatus", true, true);
				statusEvent.status = 'zenabled';
				document.dispatchEvent(statusEvent);
				// choose the function that has Z support
				document.removeEventListener('headtrackingEvent', this.handleHeadTracking);
				document.addEventListener('headtrackingEvent', this.handleHeadTrackingWithZ);
			} else {
				var statusEvent = document.createEvent("Event");
				statusEvent.initEvent("headtrackrStatus", true, true);
				statusEvent.status = 'zdisabled';
				document.dispatchEvent(statusEvent);
				// choose the function without Z support
				document.removeEventListener('headtrackingEvent', this.handleHeadTrackingWithZ);
				document.addEventListener('headtrackingEvent', this.handleHeadTracking);
			}
			return;
		}
		// initial setup
		if (this.enableZ) {
			// choose the function that has Z support
			document.addEventListener('headtrackingEvent', this.handleHeadTrackingWithZ);
		} else {
			// choose the function without Z support
			document.addEventListener('headtrackingEvent', this.handleHeadTracking);
		}
		// create canvas for headtracking to draw buffer to
		this.canv = document.createElement('canvas');
		this.canv.setAttribute('id', 'canvas');
		// create a video element (probably a bad idea)
		this.vid = document.createElement('video');
		this.vid.setAttribute('id', 'video');
		// maybe do something better for the UI like log to console window
		this.headtrackr = new headtrackr.Tracker({ ui : true });
		// starts tracking (false arg wont re-init video)
		this.headtrackr.init(this.vid, this.canv, true);
		// start tracking
		this.enabled = this.headtrackr.start();

		// first aabb
		var first = true;
		// lowest point
		var minp;
		// highest point
		var maxp;
		//get the AABB
		for (var componentUID in LS.GlobalScene._components_by_uid) {
			var compHandle = LS.GlobalScene._components_by_uid[componentUID];
			if (compHandle._render_instance == null) continue;
			var aabb = compHandle._render_instance.aabb;
			// if first iteration
			if (first) {
				// lowest point
				minp = vec3.create(aabb[6], aabb[7], aabb[8]);
				// highest point
				maxp = vec3.create(aabb[9], aabb[10], aabb[11]);
				// got first aabb
				first = false;
			} else {
				// lowest point
				minp[0] = Math.min(minp[0], aabb[6]);
				minp[1] = Math.min(minp[1], aabb[7]);
				minp[2] = Math.min(minp[2], aabb[8]);
				// highest point
				maxp[0] = Math.max(maxp[0], aabb[9]);
				maxp[1] = Math.max(maxp[1], aabb[10]);
				maxp[2] = Math.max(maxp[2], aabb[11]);
			}
		}

		// get half of longest edge
		var ledge = 0.0;
		ledge = Math.max(ledge, maxp[0] - minp[0]);
		ledge = Math.max(ledge, maxp[1] - minp[1]);
		ledge = Math.max(ledge, maxp[2] - minp[2]);
		// get midpoint
		var mid = vec3.fromValues(0.5 * (maxp[0] + minp[0]), 0.5 * (maxp[1] + minp[1]), 0.5 * (maxp[2] + minp[2]));
		// suggest new focus point and distance for camera
		this.updateCam(mid, ledge);
	},

	// when the plugin has been loaded
	init: function() {
		this.enabled = false;
		this.enableZ = false;
	},

	// when the plugin has been removed
	deinit: function() {
		this.Stop();
	}
};

if (typeof CORE !== 'undefined')
	CORE.registerModule( HeadtrackingModule );
