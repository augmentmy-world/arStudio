// chooses the lowest SD result
var lt = function(l, r) {
	if (abs(r[0]) < abs(l[0])) l = r;
}

// gl matrix should have these but oh well
var clamp = function(min, val, max) {
	return Math.min(Math.max(min, val), max);
}
function getInverse(m) {
    var a = m[0], b = m[1], c = m[2];
    var d = m[3], e = m[4], f = m[5];
    var g = m[6], h = m[7], i = m[8];
    var det = a*e*i - a*f*h - b*d*i + b*f*g + c*d*h - c*e*g;
    return [
        (e*i - f*h) / det, (c*h - b*i) / det, (b*f - c*e) / det,
        (f*g - d*i) / det, (a*i - c*g) / det, (c*d - a*f) / det,
        (d*h - e*g) / det, (b*g - a*h) / det, (a*e - b*d) / det
    ];
}
function multiply(a, b) {
    return [
        a[0]*b[0] + a[1]*b[3] + a[2]*b[6],
        a[0]*b[1] + a[1]*b[4] + a[2]*b[7],
        a[0]*b[2] + a[1]*b[5] + a[2]*b[8],
        a[3]*b[0] + a[4]*b[3] + a[5]*b[6],
        a[3]*b[1] + a[4]*b[4] + a[5]*b[7],
        a[3]*b[2] + a[4]*b[5] + a[5]*b[8],
        a[6]*b[0] + a[7]*b[3] + a[8]*b[6],
        a[6]*b[1] + a[7]*b[4] + a[8]*b[7],
        a[6]*b[2] + a[7]*b[5] + a[8]*b[8]
    ];
}
var mat3row = function(m, r) {
	var r3 = r * 3;
	return vec3.fromValues(m[r3], m[r3 + 1], m[r3 + 2]);
}
var mat4row = function(m, r) {
	var r4 = r * 4;
	return vec4.fromValues(m[r4], m[r4 + 1], m[r4 + 2], m[r4 + 3]);
}

// gets a matrix transform between two quads
function getSquareToQuad(pts) {
	var x0 = pts[0][0], x1 = pts[1][0], x2 = pts[2][0], x3 = pts[3][0],
		y0 = pts[0][1], y1 = pts[1][1], y2 = pts[2][1], y3 = pts[3][1];
    var dx1 = x1 - x2;
    var dy1 = y1 - y2;
    var dx2 = x3 - x2;
    var dy2 = y3 - y2;
    var dx3 = x0 - x1 + x2 - x3;
    var dy3 = y0 - y1 + y2 - y3;
    var det = dx1*dy2 - dx2*dy1;
    var a = (dx3*dy2 - dx2*dy3) / det;
    var b = (dx1*dy3 - dx3*dy1) / det;
    return [
        x1 - x0 + a*x1, y1 - y0 + a*y1, a,
        x3 - x0 + b*x3, y3 - y0 + b*y3, b,
        x0, y0, 1
    ];
}
//gets perspective transform between before and after
function getPerspective(before, after) {
    var a = getSquareToQuad(after);
    var b = getSquareToQuad(before);
    return multiply(getInverse(a), b);
}

// traces L against R, resizes L
var traceResize = function(l, r, zFar) {
	// raytrace ortho +-X and +-Z
	var l2px = r.rs(l.l, l.o[0]),
		l2pz = r.rs(l.l, l.o[2]);
	if (Math.abs(l2px) < zFar) {
		// if the ray hit 'in front of' ro
		if (l2px > 0.0) l.s[0] = Math.max(l.m, l2px);
		else l.s[2] = Math.max(l.m, -l2px);
	}
	if (Math.abs(l2pz) < zFar) {
		if (l2pz > 0.0) l.s[1] = Math.max(l.m, l2pz);
		else l.s[3] = Math.max(l.m, -l2pz);
	}
}

// plane equation and funcs
function plane() {
	this.o = mat3.create()	// orientation = mat3 (x = left, y = up (normal), z = forward)
	this.s = vec4.create();	// size = vec4(xz xz)
	this.l = vec3.create();	// loc = vec3
	this.m = 1.0;		// minimum size = float
	this.v = false;	// visible = bool
	this.d = -1;	// assosiated marker id
	
	// returns signed distance
	this.sd = function(_l) {
		return vec3.dot(mat3row(this.o, 1), vec3.subtract(vec3.create(), this.l, _l));
	}
	// returns distance to plane from ro along rd
	this.rs = function(ro, rd) {
		var n = mat3row(this.o, 1);
		return vec3.dot(n, vec3.subtract(vec3.create(), this.l, ro)) / vec3.dot(n, rd);
	}
	// returns UV of point on plane
	this.mapUV = function(_l) {
		var r = vec3.subtract(vec3.create(), this.l, _l);
		return vec2.fromValues(vec3.dot(mat3row(this.o, 0), r), vec3.dot(mat3row(this.o, 2), r));
	}
	// returns 3D point from uv on plane
	this.mapXYZ = function(uv) {
		var x = vec3.scale(vec3.create(), mat3row(this.o, 0), uv[0]);
		var z = vec3.scale(vec3.create(), mat3row(this.o, 2), uv[1]);
		return vec3.add(vec3.create(), vec3.add(vec3.create(), this.l, x), z);
	}

	// calculate plane end points (camera space)
	this.plnPoints = function() {
		var x = mat3row(this.o, 0),
			z = mat3row(this.o, 2);
		// create scaled basis vectors
		var xp = vec3.scale(vec3.create(), x, this.s[0]);
		var xm = vec3.scale(vec3.create(), x, this.s[2]);
		var zp = vec3.scale(vec3.create(), z, this.s[1]);
		var zm = vec3.scale(vec3.create(), z, this.s[3]);
		// get x +/-
		var lxp = vec3.add(vec3.create(), this.l, xp);
		var lxm = vec3.subtract(vec3.create(), this.l, xm);
		// add z+
		var a = vec3.add(vec3.create(), lxp, zp);
		var b = vec3.add(vec3.create(), lxm, zp);
		// subtract z-
		var c = vec3.subtract(vec3.create(), lxm, zm);
		var d = vec3.subtract(vec3.create(), lxp, zm);
		//return points CCW
		return [a, b, c, d];
	}

	// projects plnPts into screenspace
	this.toScreenspace = function(plnPts, screensize) {
		if (screensize == null) {
			screensize = {
				width: 640,
				height: 480
			};
		}
		// middle of the screen (pixels)
		var midpt = vec2.fromValues(screensize.width >> 1, screensize.height >> 1);
		// plane points xy
		var a = vec2.fromValues(plnPts[0][0], plnPts[0][1]);
		var b = vec2.fromValues(plnPts[1][0], plnPts[1][1]);
		var c = vec2.fromValues(plnPts[2][0], plnPts[2][1]);
		var d = vec2.fromValues(plnPts[3][0], plnPts[3][1]);
		// perspective divide
		var a1 = vec2.scale(vec3.create(), a, (screensize.width / plnPts[0][2]));
		var b1 = vec2.scale(vec3.create(), b, (screensize.width / plnPts[1][2]));
		var c1 = vec2.scale(vec3.create(), c, (screensize.width / plnPts[2][2]));
		var d1 = vec2.scale(vec3.create(), d, (screensize.width / plnPts[3][2]));
		// shift origin to midpt
		var a2 = vec2.add(vec3.create(), a1, midpt);
		var b2 = vec2.add(vec3.create(), b1, midpt);
		var c2 = vec2.add(vec3.create(), c1, midpt);
		var d2 = vec2.add(vec3.create(), d1, midpt);
		// should be CCW
		return [a2, b2, c2, d2];
	}
}

var PMMinstance = null;

// update from video
var updateFrame = function(s, v, c) {
	c.drawImage(v, 0, 0);
	window.setTimeout(updateFrame, 20, s, v, c);
}

// stops video and tracking, fades out window
var closeWindow = function(that) {
	// stop tracking
	JsARToolKitModule.stopAR();
	//custom fade out
	that.pmmwindow.fadeOut(500);
	//wait for transition to finish
	window.setTimeout(function() {
		//stop the camera
		that.stream.getTracks()[0].stop();
		//close the window
		that.pmmwindow.close();
	}, 500);
}

// adds a pln to pmmgroup, usually plnp (corners) is already available so no need to recompute
var addPlnToScene = function(pmmgroup, pln, plnp, tex) {
	//add a new node
	var newplane = new LS.SceneNode('plane' + pln.d.toString());
	pmmgroup.addChild(newplane);

	//put plane in scene
	var geo = new LS.Components.GeometricPrimitive();
	geo.geometry = LS.Components.GeometricPrimitive.PLANE;
	newplane.addComponent(geo);
	
	//no subdivisions
	geo.subdivisions = 0;
	//set size
	newplane.transform.scale(pln.s[0] + pln.s[2], 1.0, pln.s[1] + pln.s[3]);
	//set location
	var c = vec3.fromValues((plnp[0][0] + plnp[1][0] + plnp[2][0] + plnp[3][0]) * .25,
							(plnp[0][1] + plnp[1][1] + plnp[2][1] + plnp[3][1]) * .25,
							(plnp[0][2] + plnp[1][2] + plnp[2][2] + plnp[3][2]) * .25);
	//newplane.transform.position = plncenter;
	//set transform with matrix
	var m = mat4.create();
	m[0] = pln.o[0]; m[4] = pln.o[3]; m[8] =  pln.o[6]; m[12] = -c[0];
	m[1] = pln.o[1]; m[5] = pln.o[4]; m[9] =  pln.o[7]; m[13] = -c[1];
	m[2] = pln.o[2]; m[6] = pln.o[5]; m[10] = pln.o[8]; m[14] = -c[2];
	m[3] = 0.0;      m[7] = 0.0;      m[11] = 0.0;      m[15] = 1.0;
	newplane.transform.applyTransformMatrix(m);
	//create material
	
	//set texture
	
}

// take a poor mans mapping camera shot
var PMMModule = {
	name: "PMM Plugin",
	description: "Creates 3D reference from 2D image",
	section: "view-modes",
	icon: "imgs/mini-icon-pmm.png",
	preferences: {},

	//needs camera frame and tracking input
	pmm: function() {
		var that = PMMinstance;
		
		if (that.pose == null) return;
		var poses = [ that.pose ];

		var plns = [];
		var midpt = vec2.fromValues(320, 240);
		var farthestZ = 0.0;
		var zFar = 10000.0;
		var ctx = that.ctx;

		//Get the scene root
        var sceneRoot = LS.GlobalScene.root;
		//PMM group
		var pmmgroup = new LS.SceneNode("PMM Reference");
		sceneRoot.addChild(pmmgroup);

		//get video image in buffer
		ctx.drawImage(that.video, 0, 0);
		//store image data in GL texture
		var bgImg = new GL.Texture( 640, 480, {
			minFilter: gl.LINEAR,
			magFilter: gl.LINEAR,
			format: gl.RGB, 
			pixel_data: ctx.getImageData(0, 0, 640, 480)
		});
		var fsQuad = GL.mesh.plane({size:1.0});

		//one plane for each pose
		for (var i = 0; i < poses.length; i++) {
			plns.push(new plane());
			var loc = mat4row(poses[i].view, 3), //starting loc (SIZE IN MM)
				s = poses[i].size;				 //size
			plns[i].l = vec3.fromValues(loc[0] * .1, loc[1] * .1, loc[2] * .1);
			plns[i].o = mat3.fromMat4(mat3.create(), poses[i].view);
			plns[i].s = vec4.fromValues(s, s, s, s);
			plns[i].m = poses[i].size;
			plns[i].v = true;
			plns[i].d = poses[i].id;
		}

		//check vs other planes
		for (var i = 0; i < plns.length; i++) {
			var pln = plns[i];
			//dont do anything if it's not visible
			if (!pln.v) continue;

			//trace vs other planes
			for (var j = 0; j < plns.length; j++) {
				var plnj = plns[j];
				//only check 2 visible planes at once, dont check self
				if (!plnj.v || i == j) continue;
				traceResize(plnj, pln, zFar);
			}
	
			//world geometry of plane
			var plnp = pln.plnPoints();
			//to screen space
			var p = pln.toScreenspace(plnp);

			//get farthest z
			farthestZ = Math.max(farthestZ, plnp[0][2]);
			farthestZ = Math.max(farthestZ, plnp[1][2]);
			farthestZ = Math.max(farthestZ, plnp[2][2]);
			farthestZ = Math.max(farthestZ, plnp[3][2]);

			//get longest edge
			var size = 0.0;
			size = Math.max(size, vec3.squaredDistance(p[0], p[1]));
			size = Math.max(size, vec3.squaredDistance(p[1], p[2]));
			size = Math.max(size, vec3.squaredDistance(p[2], p[3]));
			size = Math.max(size, vec3.squaredDistance(p[3], p[0]));
			//rcp of how many pixels per centimeter (20)
			size = Math.sqrt(size) * 0.05;

			//for perspective transform to take a snapshot of the plane (for texturing)
			var ROI = [
				0, 0, 
				clamp(1.0, size * (pln.s[0] + pln.s[2]), 640.0),
				clamp(1.0, size * (pln.s[1] + pln.s[3]), 480.0)
			];
			var p2 = [
				[ 0.0, 0.0 ],
				[ ROI[2], 0.0 ],
				[ ROI[2], ROI[3] ],
				[ 0.0, ROI[3] ]
			];

			//TODO: warp bgImg perspective RTT

			//calculate perspective transform
			var mat = getPerspective(p, p2);
			
			//result texture
			var plnrtt = new GL.Texture(ROI[2], ROI[3], {
				minFilter: gl.LINEAR,
				magFilter: gl.LINEAR,
				format: gl.RGBA
			});
			//run perspective transform shader on canvas
			var fbo = new GL.FBO([plnrtt]);
			fbo.bind();
				//you render code here
				this.warpshade.uniforms({
					m: mat,
					tex: bgImg
				}).draw(fsQuad);
			fbo.unbind();
			
			//fill in poly where it was
			ctx.fillStyle = '#000';
			ctx.beginPath();
			ctx.moveTo(p[0][0], p[0][1]);
			ctx.lineTo(p[1][0], p[1][1]);
			ctx.lineTo(p[2][0], p[2][1]);
			ctx.lineTo(p[3][0], p[3][1]);
			ctx.closePath();
			ctx.fill();

			//fix artk pose
			var m = mat3.create();
			m[4] = 0.0; m[5] = -1.0;
			m[7] = -1.0; m[8] = 0.0;
			mat3.mul(pln.o, pln.o, m);

			addPlnToScene(pmmgroup, pln, plnp);
			
		} //for each plane

		//final backdrop plane with rest of image
		var backdrop = new plane();
		var fz640 = farthestZ / 640.0;
		//calc size
		backdrop.s[0] = midpt[0] * fz640;
		backdrop.s[2] = backdrop.s[0];
		backdrop.s[1] = midpt[1] * fz640;
		backdrop.s[3] = backdrop.s[1];
		//calc verts
		var wp = [
			[-backdrop.s[0], -backdrop.s[1], -farthestZ],
			[ backdrop.s[0], -backdrop.s[1], -farthestZ],
			[ backdrop.s[0],  backdrop.s[1], -farthestZ],
			[-backdrop.s[0],  backdrop.s[1], -farthestZ]
		];
		//rotate upright
		var m = mat3.create();
		m[4] = 0.0; m[5] = 1.0;
		m[7] = 1.0; m[8] = 0.0;
		backdrop.o = m;
		backdrop.d = 'BG';
		//store image data
		var bgImg = new GL.Texture( ROI[2], ROI[3], {
			minFilter: gl.LINEAR,
			magFilter: gl.LINEAR,
			format: gl.RGB, 
			pixel_data: ctx.getImageData(0, 0, 640, 480)
		});
		//add to scene
		addPlnToScene(pmmgroup, backdrop, wp, bgImg);

		// fade out window
		closeWindow(that);
	},

	// maintain list of poses
	markerTracking: function(ev) {
		// if a marker is seen
		if (ev.data.marker.id === -1) return;
		var that = PMMinstance;
		// record pose
		that.pose = {
			//view matrix
			view: ev.data.matrix,
			//size of marker in cm
			size: ev.target.defaultMarkerWidth * .1,
			//id of marker
			id: ev.data.marker.id
		}
	},

	// open a window or dialog and start up the camera
	startCamera: function() {
		var that = PMMinstance;
		
		// start tracking first
		if (typeof JsARToolKitModule !== 'undefined') {
			// thanks Thor
			JsARToolKitModule.createAR();
			JsARToolKitModule.startAR();
			// wait a bit for JSARTK to create video element and arController on window
			window.setTimeout(function() {
				window.arController.addEventListener('getMarker', that.markerTracking);
			}, 1000);
		}
		
		//liteGUI dialog
		that.pmmwindow = new LiteGUI.Dialog("pmm_dialog", { width: 640, height: 530, closable: true });
		//create a style
		that.pmmwindow.content.innerHTML += '<style type="text/css"> pmmbuttonstyle { padding: 10px; background-color:#000; } </style>'
		// capture and save obj and mtl
		that.pmmwindow.addButton('<pmmbuttonstyle> <font size="3"> Capture </font> </pmmbuttonstyle>', { callback: that.pmm });
		// gtfo button
		that.pmmwindow.addButton('<pmmbuttonstyle> <font size="3"> Close </font> </pmmbuttonstyle>', { callback: function() {
			closeWindow(that);
		}});
		that.pmmwindow.content.style = "height: 480px;";
		that.pmmwindow.content.innerHTML += '<canvas  width="640" height="480" id=\"pmmcanvas\"></canvas>';
		that.canvas = that.pmmwindow.content.getElementsByTagName('canvas')[0];
		that.canvas.width = 640;
		that.canvas.height = 480;
		that.ctx = that.canvas.getContext('2d');
		
		// create a video element (probably a bad idea)
		that.video = document.createElement('video');
		that.video.setAttribute('id', 'video');
		
		navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
		window.URL = window.URL || window.webkitURL || window.msURL || window.mozURL;
		// check for camerasupport
		if (navigator.getUserMedia) {
			// chrome 19 shim
			var videoSelector = { video : true };
			if (window.navigator.appVersion.match(/Chrome\/(.*?) /)) {
				var chromeVersion = parseInt(window.navigator.appVersion.match(/Chrome\/(\d+)\./)[1], 10);
				if (chromeVersion < 20) {
					videoSelector = "video";
				}
			};

			// opera shim
			if (window.opera) {
				window.URL = window.URL || {};
				if (!window.URL.createObjectURL) window.URL.createObjectURL = function(obj) {return obj;};
			}

			// set up stream
			navigator.getUserMedia(videoSelector, (function( stream ) {
				that.stream = stream;
				if (that.video.mozCaptureStream) {
				  that.video.mozSrcObject = stream;
				} else {
				  that.video.src = (window.URL && window.URL.createObjectURL(stream)) || stream;
				}
				that.video.play();
			}).bind(this), function() {
				return false
			});
		} else {
			return false;
		}

		// when video is playing
		that.video.addEventListener('playing', function() {
			//LiteGUI.menubar.remove("Game Object/Capture Reference/Start Camera");
			//LiteGUI.menubar.add("Game Object/Capture Reference/Take Snapshot", { callback: PMMModule.pmm });
			that.video.width = 640;
			that.video.height = 480;
			that.pmmwindow.show();
			that.pmmwindow.center();
			that.pmmwindow.fadeIn(500);
			window.setTimeout(updateFrame, 20, that, this, that.ctx);
		}, false);
	},
	
	// called when the plugin has been loaded
	init: function() {
		LiteGUI.menubar.add("Game Object/Capture Reference", { callback: this.startCamera });

		PMMinstance = this;
	
		//the warp shader takes UV mapped geometry, matrix, and texture input
		//this.warpshade = new GL.Shader('\
		//	attribute vec3 a_vertex; \
		//	attribute vec3 a_uv; \
		//	uniform mat4 m;\
		//	varying vec2 v_uv; \
		//	void main() { \
		//		v_uv = a_uv.xy; \
		//		gl_Position = m * vec4(a_vertex, 1.); \
		//	}','\
		//	varying vec2 v_uv; \
		//	uniform sampler2D tex; \
		//	void main() { \
		//		gl_FragColor = texture2d(tex, v_uv); \
		//	}'
		//);
	},

	/*
	//create the rendering context
	var gl = GL.create({width: window.innerWidth,height: window.innerHeight});
	var container = document.body;
	container.appendChild(gl.canvas);
	gl.animate();

	//build the mesh
	var mesh = GL.Mesh.cube({size:10});
	var sphere = GL.Mesh.sphere({size:100});
	var texture = new GL.Texture(512,512, { magFilter: gl.LINEAR });
	var fbo = new GL.FBO([texture]);

	//create basic matrices for cameras and transformation
	var persp = mat4.create();
	var view = mat4.create();
	var model = mat4.create();
	var model2 = mat4.create();
	var mvp = mat4.create();
	var temp = mat4.create();
	var identity = mat4.create();

	//get mouse actions
	gl.captureMouse();
	gl.onmousemove = function(e)
	{
		if(e.dragging)
			mat4.rotateY(model,model,e.deltax * 0.01);
	}

	//set the camera position
	mat4.perspective(persp, 45 * DEG2RAD, gl.canvas.width / gl.canvas.height, 0.1, 1000);
	mat4.lookAt(view, [0,20,20],[0,0,0], [0,1,0]);

	//basic shader
	var shader = new Shader('\
			precision highp float;\
			attribute vec3 a_vertex;\
			attribute vec3 a_normal;\
			attribute vec2 a_coord;\
			varying vec3 v_normal;\
			varying vec2 v_coord;\
			uniform mat4 u_mvp;\
			uniform mat4 u_model;\
			void main() {\
				v_coord = a_coord;\
				v_normal = (u_model * vec4(a_normal,0.0)).xyz;\
				gl_Position = u_mvp * vec4(a_vertex,1.0);\
			}\
			', '\
			precision highp float;\
			varying vec3 v_normal;\
			varying vec2 v_coord;\
			uniform vec4 u_color;\
			uniform sampler2D u_texture;\
			void main() {\
			  vec3 N = normalize(v_normal);\
			  gl_FragColor = u_color * texture2D( u_texture, v_coord);\
			}\
		');

	var flat_shader = new Shader('\
			precision highp float;\
			attribute vec3 a_vertex;\
			uniform mat4 u_mvp;\
			void main() {\
				gl_Position = u_mvp * vec4(a_vertex,1.0);\
				gl_PointSize = 4.0;\
			}\
			', '\
			precision highp float;\
			uniform vec4 u_color;\
			void main() {\
			  gl_FragColor = u_color;\
			}\
		');

	//generic gl flags and settings
	gl.clearColor(0.1,0.1,0.1,1);
	gl.enable( gl.DEPTH_TEST );

	//rendering loop
	gl.ondraw = function()
	{

		//render something in the texture
		fbo.bind();
			gl.clearColor(0.1,0.3,0.4,1);
			//gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

			//create modelview and projection matrices
			mat4.multiply(temp,view,model2);
			mat4.multiply(mvp,persp,temp);

			flat_shader.uniforms({
				u_color: [Math.sin( GL.getTime() * 0.001 ),0.3,0.1,1],
				u_model: model2,
				u_mvp: mvp
			}).draw(sphere, gl.POINTS);
		fbo.unbind();

		gl.clearColor(0.1,0.1,0.1,1);
		gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
		//create modelview and projection matrices
		mat4.multiply(temp,view,model);
		mat4.multiply(mvp,persp,temp);

		//render mesh using the shader
		shader.uniforms({
			u_color: [1,1,1,1],
			u_model: model,
			u_texture: texture.bind(0),
			u_mvp: mvp
		}).draw(mesh);
	};

	//update loop
	gl.onupdate = function(dt)
	{
		//rotate cube
		mat4.rotateY(model,model,dt*0.2);
		mat4.rotate(model2,model2,dt*0.1,[0,1, Math.sin( GL.getTime() * 0.001 ) ]);
	};
	*/
	
	// called when the plugin has been removed
	deinit: function() {
		closeWindow();
		LiteGUI.menubar.remove("Game Object/Capture Reference");
	}
};

if (typeof CORE !== 'undefined')
	CORE.registerModule( PMMModule );
