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

	// writes to output and mtlfile in OBJ format
	this.toObj = function(plnp, plnNum, faceIndOffset) {
		var output = "";
		// mesh name
		var name = "pln" + plnNum.toString();
		// object
		output += "o " + name + "\n";
		// output verts
		output += "v " + plnp[0][0].toString() + " " + plnp[0][1].toString() + " " + plnp[0][2].toString() + "\n";
		output += "v " + plnp[1][0].toString() + " " + plnp[1][1].toString() + " " + plnp[1][2].toString() + "\n";
		output += "v " + plnp[2][0].toString() + " " + plnp[2][1].toString() + " " + plnp[2][2].toString() + "\n";
		output += "v " + plnp[3][0].toString() + " " + plnp[3][1].toString() + " " + plnp[3][2].toString() + "\n";
		// generate UV's
		output += "vt 0.0 1.0\n";
		output += "vt 1.0 1.0\n";
		output += "vt 1.0 0.0\n";
		output += "vt 0.0 0.0\n";
		// normals are just plane normals
		var o1 = mat3row(this.o, 1);
		var nstr = "vn " + o1[0].toString() + " " + o1[1].toString() + " " + o1[2].toString() + "\n";
		output += nstr + nstr + nstr + nstr;
		// generate shading/texture stuff
		output += "g " + name + "\n";
		output += "usemtl " + name + "\n";
		output += "s " + (plnNum + 1).toString() + "\n";
		// generate faces
		var f0 = faceIndOffset.toString(),
		f1 = (faceIndOffset + 1).toString(),
		f2 = (faceIndOffset + 2).toString(),
		f3 = (faceIndOffset + 3).toString();
		output += "f " + f0 + "/" + f0 + "/" + f0 + " " + f1 + "/" + f1 + "/" + f1 + " " + f2 + "/" + f2 + "/" + f2 + "\n";
		output += "f " + f0 + "/" + f0 + "/" + f0 + " " + f2 + "/" + f2 + "/" + f2 + " " + f3 + "/" + f3 + "/" + f3 + "\n";
		return output;
	}
	
	this.toMtl = function(plnNum) {
		var mtlfile = "";
		// mesh name
		var name = "pln" + plnNum.toString();
		// generate mtl file
		mtlfile += "newmtl " + name + "\n";
		mtlfile += "Ns 10.0000\n";
		mtlfile += "Ni 1.5000\n";
		mtlfile += "d 1.0000\n";
		mtlfile += "Tr 0.0000\n";
		mtlfile += "Tf 1.0000 1.0000 1.0000\n";
		mtlfile += "illum 2\n";
		mtlfile += "Ka 0.0000 0.0000 0.0000\n";
		mtlfile += "Kd 1.0000 1.0000 1.0000\n";
		mtlfile += "Ks 0.0000 0.0000 0.0000\n";
		mtlfile += "Ke 0.0000 0.0000 0.0000\n";
		mtlfile += "map_Kd " + name + ".jpg\n";
		return mtlfile;
	}
}

var pmmwindow = null;
var pmmvideo = null;

// take a poor mans mapping camera shot
var PMMModule = {
	name: "PMM Plugin",
	description: "Creates 3D reference from 2D image",
	section: "view-modes",
	icon: "imgs/mini-icon-pmm.png",
	preferences: {},

	//needs camera frame and tracking input
	pmm: function() {
		console.log("pmm");
		
		//canvas = document.createElement('canvas');
		//canvas.width = 640;
		//canvas.height = 480;
		//canvas.setAttribute('id', 'pmmcanvas');

		var SNAP_DIST = 10.0;
		var zFar = 100.0;
		var canvas = pmmwindow.document.getElementById('pmmcanvas');
		var ctx = canvas.getContext('2d');
		var video = pmmvideo; //document.getElementById('video');
		
		// pose container for info	
		var pose = {
			// view matrix
			view: mat4.create(),
			// size of marker in cm
			size: 10.0
		}
		//cheat and pre-bake a pose in here
		pose.view[0] = 1.0; pose.view[1] = 0.0; pose.view[2] = 0.0; pose.view[3] = 0.0;
		pose.view[4] = 0.0; pose.view[5] = 0.0; pose.view[6] = -1.0; pose.view[7] = 0.0; 
		pose.view[8] = 0.0; pose.view[9] = 1.0; pose.view[10] = 0.0; pose.view[11] = 0.0;
		pose.view[12] = 0.0; pose.view[13] = 0.0; pose.view[14] = 30.0; pose.view[15] = 0.0;
		var poses = [ pose ];

		var plnImgs = [];
		var plns = [];
		var outpImg;
		var output = "", mtlfile = "";
		var midpt = vec2.fromValues(320, 240);
		var farthestZ = 0.0;
		var indOffset = 1;

		ctx.translate(640, 0);
			ctx.scale(-1, 1);
				ctx.drawImage(video, 0, 0);
			ctx.scale(-1, 1);
		ctx.translate(-640, 0);
		
		//save this capture
		output = "# Scene mesh OBJ generated by kibbles\n";
		output += "mtllib PMMcapture.mtl\n";

		//one plane for each pose
		for (var i = 0; i < poses.length; i++) {
			plns.push(new plane());
			var loc = mat4row(poses[i].view, 3), //starting loc
				s = poses[i].size;				 //size
			plns[i].l = vec3.fromValues(loc[0], loc[1], loc[2]);
			plns[i].o = mat3.fromMat4(mat3.create(), poses[i].view);
			plns[i].s = vec4.fromValues(s, s, s, s);
			plns[i].m = poses[i].size;
			plns[i].v = true;
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
	
			//grab perspective corrected texture and geometry of plane
			var plnp = pln.plnPoints();
			//calc plane points in screen space, perspective, used for perspective transform
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
			//warp perspective
			var mat = getPerspective(p, p2);
			//save image
			plnImgs.push(null);
			
			//fill in poly where it was
			ctx.fillStyle = '#000';
			ctx.beginPath();
			ctx.moveTo(p[0][0], p[0][1]);
			ctx.lineTo(p[1][0], p[1][1]);
			ctx.lineTo(p[2][0], p[2][1]);
			ctx.lineTo(p[3][0], p[3][1]);
			ctx.closePath();
			ctx.fill();
			
			//write to object and material files
			output += pln.toObj(plnp, i, indOffset);
			mtlfile += pln.toMtl(i)
			
			//offset next group of faces
			indOffset += 4;
		} //for each plane

		if (farthestZ < 1.0) {
			console.log("failed to save\n");
			return;
		} else {
			console.log("farthestZ " + farthestZ.toString());
		}

		var backdrop = new plane();
		var fz640 = farthestZ / 640.0;
		//final backdrop plane with rest of image via inverse perspective transform
		var wp = [
			[-midpt[0] * fz640, -midpt[1] * fz640, -farthestZ],
			[ midpt[0] * fz640, -midpt[1] * fz640, -farthestZ],
			[ midpt[0] * fz640,  midpt[1] * fz640, -farthestZ],
			[-midpt[0] * fz640,  midpt[1] * fz640, -farthestZ]
		];
		//add backdrop plane to file, should probably be a sphere section (fovw x fovh) tho
		output += backdrop.toObj(wp, plns.length, indOffset);
		mtlfile += backdrop.toMtl(plns.length)

		//save plane images to HDD
		//for (int i = 0; i < plnImgs.length; i++)
			//cv::imwrite("models\\pln" + std::to_string(i) + ".jpg", plnImgs[i]);

		//save background to HDD
		ctx.translate(640, 0);
			ctx.scale(-1, 1);
				ctx.drawImage(video, 0, 0);
			ctx.scale(-1, 1);
		ctx.translate(-640, 0);
		
		//cv::imwrite("models\\pln" + plns.length.toString() + ".jpg", outpImg);

		//save mesh data to HDD
		var filename = "models\\PMMcapture.obj",
			mtlname = "models\\PMMcapture.mtl";
		//saveTxt(filename, output);
		console.log(output);
		//saveTxt(mtlname, mtlfile);

		//tell them it has happened
		console.log("Saved " + filename + " with " + plns.length.toString() + " planes");
	},

	startCamera: function() {
		//canvas = document.createElement('canvas');
		//canvas.width = 640;
		//canvas.height = 480;
		//canvas.setAttribute('id', 'pmmcanvas');

		pmmwindow = LiteGUI.newWindow('yeaD', 640, 480, '');
		pmmwindow.document.body.innerHTML += '<canvas  width="640" height="480" id=\"pmmcanvas\"></canvas>';
		var canvas = pmmwindow.document.getElementById('pmmcanvas');
		canvas.width = 640;
		canvas.height = 480;
		var ctx = canvas.getContext('2d');
		
		// create a video element (probably a bad idea)
		var video = document.createElement('video');
		video.setAttribute('id', 'video');
		
		navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
		window.URL = window.URL || window.webkitURL || window.msURL || window.mozURL;
		// check for camerasupport
		if (navigator.getUserMedia) {
			// chrome 19 shim
			var videoSelector = {video : true};
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
				this.stream = stream;
				if (video.mozCaptureStream) {
				  video.mozSrcObject = stream;
				} else {
				  video.src = (window.URL && window.URL.createObjectURL(stream)) || stream;
				}
				video.play();
			}).bind(this), function() {
				return false
			});
		} else {
			return false;
		}

		// when video is playing
		video.addEventListener('playing', function() {
			LiteGUI.menubar.remove("Game Object/Capture Reference/Start Camera");
			LiteGUI.menubar.add("Game Object/Capture Reference/Take Snapshot", { callback: PMMModule.pmm });
			video.width = 640;
			video.height = 480;
			pmmvideo = video;
			window.setTimeout(PMMModule.updateFrame, 20, this, ctx);
		}, false);
	},
	
	updateFrame: function(v, c) {
		c.drawImage(v, 0, 0);
		//some kinda exit needs to be here
		window.setTimeout(PMMModule.updateFrame, 20, v, c);
	},
	
	//called when the plugin has been loaded
	init: function() {
		LiteGUI.menubar.add("Game Object/Capture Reference/Start Camera", { callback: this.startCamera });
	},

	//called when the plugin has been removed
	deinit: function() {
		LiteGUI.menubar.remove("Game Object/Capture Reference/Take Snapshot");
		LiteGUI.menubar.remove("Game Object/Capture Reference/Start Camera");
	}
};

CORE.registerModule( PMMModule );
