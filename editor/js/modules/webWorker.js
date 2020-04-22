function isMobile() {
  return /Android|mobile|iPad|iPhone/i.test(navigator.userAgent);
}

function startWorker(marker, video, input_width, input_height, canvas_draw) {
  var vw, vh;
  var sw, sh;
  var pscale, sscale;
  var w, h;
  var pw, ph;
  var ox, oy;
  var worker;
  var camera_para = "../../data/camera_para.dat";

  var canvas_process = document.createElement("canvas");
  var context_process = canvas_process.getContext("2d");

  var load = function() {
    vw = input_width;
    vh = input_height;

    pscale = 320 / Math.max(vw, (vh / 3) * 4);
    sscale = isMobile() ? window.outerWidth / input_width : 1;

    sw = vw * sscale;
    sh = vh * sscale;

    w = vw * pscale;
    h = vh * pscale;
    pw = Math.max(w, (h / 3) * 4);
    ph = Math.max(h, (w / 4) * 3);
    ox = (pw - w) / 2;
    oy = (ph - h) / 2;
    canvas_process.style.clientWidth = pw + "px";
    canvas_process.style.clientHeight = ph + "px";
    canvas_process.width = pw;
    canvas_process.height = ph;

    worker = new Worker("./../editor/js/modules/artoolkit.worker.js");

    worker.postMessage({
      type: "load",
      pw: pw,
      ph: ph,
      camera_para: camera_para,
      marker: marker
    });

    worker.onmessage = function(ev) {
      var msg = ev.data;
      switch (msg.type) {
        case "loaded": {
          var proj = JSON.parse(msg.proj);
          var ratioW = pw / w;
          var ratioH = ph / h;
          proj[0] *= ratioW;
          proj[4] *= ratioW;
          proj[8] *= ratioW;
          proj[12] *= ratioW;
          proj[1] *= ratioH;
          proj[5] *= ratioH;
          proj[9] *= ratioH;
          proj[13] *= ratioH;
          //setMatrix(camera.projectionMatrix, proj);
          break;
        }
        case "found": {
          found(msg);
          break;
        }
        case "not found": {
          found(null);
          break;
        }
      }
      process();
    };
  };

  var world;

  var found = function(msg) {
    if (!msg) {
      world = null;
    } else {
      world = JSON.parse(msg.matrixGL_RH);
    }
  };

  load();
}
