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
  var camera_para = "editor/data/camera_para.dat";

  var canvas_process = document.createElement("canvas");
  var context_process = canvas_process.getContext("2d");

  var load = function () {
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

    // create a Worker to handle loading of NFT marker and tracking of it
    const workerBlob = new Blob(
      [embeddedWorker.toString().replace(/^function .+\{?|\}$/g, '')],
      { type: 'text/js-worker' }
    )
    const workerBlobUrl = URL.createObjectURL(workerBlob)

    worker = new Worker(workerBlobUrl);

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

  function embeddedWorker () {
    self.onmessage = function (e) {
      var msg = e.data;
      switch (msg.type) {
        case "load": {
          console.log(msg);
          load(msg);
          return;
        }
        case "process": {
          next = msg.imagedata;
          process();
          return;
        }
      }
    };

    var next = null;

    var ar = null;
    var markerResult = null;

    function load (msg) {
      const basePath = self.origin
      let artoolkitUrl, cameraParamUrl, nftMarkerUrl
      let artoolkitPath = "editor/js/modules/artoolkit.min.js"
      console.debug('Base path:', basePath)
      // test if the msg.param (the incoming url) is an http or https path
      const regexA = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#()?&//=]*)/igm
      var reA = regexA.test(artoolkitPath)
      if (reA == true) {
        artoolkitUrl = artoolkitPath
      } else if (reA == false) {
        artoolkitUrl = basePath + '/' + artoolkitPath
      };
      console.debug('Importing WASM lib from: ', artoolkitUrl)

      importScripts(artoolkitUrl)

      var onLoad = function () {

        ar = new ARController(msg.pw, msg.ph, param);
        var cameraMatrix = ar.getCameraMatrix();

        ar.addEventListener('getNFTMarker', function (ev) {
          markerResult = {type: "found", matrixGL_RH: JSON.stringify(ev.data.matrixGL_RH), proj: JSON.stringify(cameraMatrix)};
        });

        // after the ARController is set up, we load the NFT Marker
        const regexM = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#()?&//=]*)/igm
        var reM = regexM.test(msg.marker);
        if (reM == true) {
          nftMarkerUrl = msg.marker;
        } else if (reM == false) {
          nftMarkerUrl = basePath + '/editor/' + msg.marker;
        };

        console.debug('Loading NFT marker at: ', nftMarkerUrl);

        ar.loadNFTMarker(nftMarkerUrl, function (markerId) {
          ar.trackNFTMarkerId(markerId);
          console.log("loadNFTMarker -> ", markerId);
        });

        postMessage({type: "loaded", proj: JSON.stringify(cameraMatrix)});
      };
      const onError = function (error) {
          console.error(error)
        };
      const regexC = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#()?&//=]*)/igm;
      const reC = regexC.test(msg.camera_para);
      if (reC == true) {
        cameraParamUrl = msg.camera_para;
      } else if (reC == false) {
        cameraParamUrl = basePath + '/' + msg.camera_para;
      }
      cameraParamUrl = basePath + '/' + msg.camera_para;
      console.debug('Loading camera at:', cameraParamUrl);
      // we cannot pass the entire ARController, so we re-create one inside the Worker, starting from camera_param
      const param = new ARCameraParam(cameraParamUrl, onLoad, onError);
    };

  }

  function process () {
    markerResult = null;

    if (ar && ar.process) {
      ar.process(next);
    }

    if (markerResult) {
      postMessage(markerResult);
    } else {
      postMessage({type: "not found"});
    }

    next = null;
  }

  var world;

  var found = function(msg) {
    if (!msg) {
      world = null;
    } else {
      world = JSON.parse(msg.matrixGL_RH);
    }
  };

  load();
  process();
}
