let video= undefined;
//TODO Settings need to be configurable
const trackableName= 'trackable1';
const trackableName2= 'trackable2';
const arCameraName= 'arcamera';
const farPlane = 1000;
const nearPlane= 0.01;
const trackableId1 = 1;
const trackableId2 = 2;

// Create a marker root object to keep track of the marker.
//
// We need a marker root that we can read from the scene. We manipulate all children of marker root.
let markerRoot =  {};

const trackableMarkerMap = new Map();
trackableMarkerMap.set(trackableName, trackableId1);
trackableMarkerMap.set(trackableName2, trackableId2);

const JsARToolKitModule = {
    /**
     * If the scene is empty we setup an example scene that shows simple barcode marker tracking with two markers each having one cube assigned.
     */
    createAR() {
        //Get the scene
        const scene = LS.GlobalScene;
        //Get the scene root
        const sceneRoot = LS.GlobalScene.root;

        //Check if scene root is empty
        if(sceneRoot.childNodes.length === 0){
            //Add the AR-Camera to the scene
            let arCameraNode = new LS.SceneNode(arCameraName);
            let arCamera = new LS.Camera();
            arCameraNode.addComponent(arCamera);
            sceneRoot.addChild(arCameraNode);

            //Add two trackables to the scene
            //Trackable 1
            let arTrackable1 = new LS.SceneNode(trackableName);
            sceneRoot.addChild(arTrackable1);

            //Trackable 2
            let arTrackable2 = new LS.SceneNode(trackableName2);
            sceneRoot.addChild(arTrackable2);

            //Add 3D cube to trackable1
            let cube = new LS.Components.GeometricPrimitive();
            cube.size = 4;
            arTrackable1.addComponent(cube);

            //Add 3D sphere to trackable2
            let sphere = new LS.Components.GeometricPrimitive();
            sphere.geometry = LS.Components.GeometricPrimitive.SPHERE;
            sphere.size = 4;
            arTrackable2.addComponent(sphere);

        }
    },
    startAR() {
        console.log("Start AR");

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
                    arController.setDefaultMarkerWidth(40);
                    console.log('ARController ready for use', arController);
                    window.arController = arController;
                    
                    JsARToolKitModule.registerTrackables(arController);

                    // Camera matrix is used to define the “perspective” that the camera would see.
                    // The camera matrix returned from arController.getCameraMatrix() is already the OpenGLProjectionMatrix
                    // LiteScene supports setting a custom projection matrix but an update of LiteScene is needed to do that.
                    //FIX ME: arCamera.setCustomProjectionMatrix(arController.getCameraMatrix());

                    // On each frame, detect markers, update their positions and
                    // render the frame on the renderer.
                    var tick = function() {
                        requestAnimationFrame(tick);

                        // Hide the marker, we don't know if it's visible in this frame.
                        for (var [trackableName,trackableId] of trackableMarkerMap){
                            let markerRoot = LS.GlobalScene.getNodeByName(trackableName);
                            markerRoot.visible = false;
                        }

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
    },

    stopAR(){
        if(video !== undefined){
            console.log("Stop AR");
            video.srcObject.getTracks()[0].stop();
        }
    },

    registerTrackables(arController){
        // Set the ARController pattern detection mode to detect barcode markers.
        arController.setPatternDetectionMode( artoolkit.AR_MATRIX_CODE_DETECTION );

        // Add an event listener to listen to getMarker events on the ARController.
        // Whenever ARController#process detects a marker, it fires a getMarker event
        // with the marker details.
        arController.addEventListener('getMarker', function(ev) {
            var barcodeId = ev.data.marker.idMatrix;
            if (barcodeId !== -1) {
                console.log("saw a barcode marker with id", barcodeId);

                for(var [trackableName,trackableId] of trackableMarkerMap){
                    if(trackableId === barcodeId) {
                        let markerRoot = LS.GlobalScene.getNodeByName(trackableName);
                        markerRoot.visible = true;

                        // Note that you need to copy the values of the transformation matrix,
                        // as the event transformation matrix is reused for each marker event
                        // sent by an ARController.
                        var transform = ev.data.matrix;
                        console.log(transform);

                        // Apply transform to marker root
                        let scene_arCameraNode= LS.GlobalScene.getNodeByName(arCameraName);
                        let cameraGlobalMatrix = scene_arCameraNode.transform.getGlobalMatrix();
                        let markerRootMatrix = mat4.create();
                        mat4.multiply(markerRootMatrix,cameraGlobalMatrix,transform);

                        markerRoot.transform.setPosition(vec3.fromValues(markerRootMatrix[12],markerRootMatrix[13]*-1,markerRootMatrix[14]*-1));
                    } // end if(value === barcodeId)
                } // end for(var [key,value] of trackableMarkerMap)
            } // end if (barcodeId !== -1)
        }) // end arController.addEventListener('getMarker', function(ev) {
    }
};