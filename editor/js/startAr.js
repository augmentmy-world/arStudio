
var video = undefined;
//TODO Settings need to be configurable
const trackableName = 'trackable1';
const arCameraName = 'arcamera';
const farPlane = 1000;
const nearPlane = 0.01;

// Create a marker root object to keep track of the marker.
//
// We need a marker root that we can read from the scene. We manipulate all children of marker root.
let markerRoot = {};

function startAr(){
    console.log("Start AR");



    markerRoot = LS.GlobalScene.getNodeByName(trackableName);
    let scene = LS.GlobalScene;

    // Read the marker-root from the LiteScene

	video = ARController.getUserMedia({
		maxARVideoSize: 320, // do AR processing on scaled down video of this size
		facing: "environment",
		onSuccess: function(stream) {
			console.log('got video', stream);
			var cameraPara = new ARCameraParam('data/camera_para.dat');
			cameraPara.onload = function() {
                var arController = new ARController(video.videoWidth, video.videoHeight, cameraPara);
                arController.setDefaultMarkerWidth(80);
				console.log('ARController ready for use', arController);
                window.arController = arController;
                
                registerTrackables(arController);
                
                let arCameraNode = new LS.SceneNode();
                arCameraNode.name = arCameraName;
                let arCamera = new LS.Camera();
                let scene_rootNode = LS.GlobalScene.root;
                arCameraNode.addComponent(arCamera);
                scene_rootNode.addChild(arCameraNode);

                // Camera matrix is used to define the “perspective” that the camera would see.
                // The camera matrix returned from arController.getCameraMatrix() is already the OpenGLProjectionMatrix
                // LiteScene supports setting a custom projection matrix but an update of LiteScene is needed to do that.
                //FIX ME: arCamera.setCustomProjectionMatrix(arController.getCameraMatrix());

                // On each frame, detect markers, update their positions and
                // render the frame on the renderer.
                var tick = function() {
                    requestAnimationFrame(tick);

                    // Hide the marker, we don't know if it's visible in this frame.
                    markerRoot.visible = false;

                    // Process detects markers in the video frame and sends
                    // getMarker events to the event listeners.
                    arController.process(video);

                    // Render the updated scene.
                    LS.GlobalScene.refresh();
                    //renderer.render(scene, camera);
                };
                tick();

			};
		}
	});
	console.log("onStart");

}

function stopAr(){
    console.log("Stop AR");

    video.srcObject.getTracks()[0].stop();
}

function registerTrackables(arController){
    // Set the ARController pattern detection mode to detect barcode markers.
    arController.setPatternDetectionMode( artoolkit.AR_MATRIX_CODE_DETECTION );

    // Add an event listener to listen to getMarker events on the ARController.
    // Whenever ARController#process detects a marker, it fires a getMarker event
    // with the marker details.
    //
    // var detectedBarcodeMarkers = {};
    arController.addEventListener('getMarker', function(ev) {
        var barcodeId = ev.data.marker.idMatrix;
        if (barcodeId !== -1) {
            console.log("saw a barcode marker with id", barcodeId);

            // Note that you need to copy the values of the transformation matrix,
            // as the event transformation matrix is reused for each marker event
            // sent by an ARController.
            //
            var transform = ev.data.matrix;
            // if (!detectedBarcodeMarkers[barcodeId]) {
            //     detectedBarcodeMarkers[barcodeId] = {
            //         visible: true,
            //         matrix: new Float32Array(16)
            //     }
            // }
            // detectedBarcodeMarkers[barcodeId].visible = true;
            // detectedBarcodeMarkers[barcodeId].matrix.set(transform);
            console.log(transform);
            // Might be usefull
            // localToGlobal

            // Apply transform to marker root
            // markerRoot.transform.applyTransformMatrix(transform,undefined,true);
            let scene_arCameraNode= LS.GlobalScene.getNodeByName(arCameraName);
            let cameraGlobalMatrix = scene_arCameraNode.transform.getGlobalMatrix();
            let markerRootMatrix = mat4.create();
            mat4.multiply(markerRootMatrix,cameraGlobalMatrix,transform);

            // let cameraGlobalPos = scene_arCameraNode.transform.getGlobalPosition();
            // let cameraGlobalRot = scene_arCameraNode.transform.getGlobalRotation();

            // markerRoot.transform.applyTransformMatrix(markerRootMatrix);
            markerRoot.transform.setPosition(vec3.fromValues(markerRootMatrix[12],markerRootMatrix[13]*-1,markerRootMatrix[14]*-1));
            // markerRoot.transform.setRotation();


            // let scene_arCameraNode= LS.GlobalScene.getNodeByName("arcamera");
            // let scene_arCamera= scene_arCameraNode.camera;
            // scene_arCamera.lookAt(scene_arCamera.eye,markerRoot.transform.getPosition(),scene_arCamera.up);
        }
    });
}