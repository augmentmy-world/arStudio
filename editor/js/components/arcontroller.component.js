function ArControllerComponent( o )
{
    this.farPlane = 1000;
    this.nearPlane= 0.01;
    this.defaultMarkerWidth = 40;
    this.cameraCalibrationFile = 'data/camera_para.dat';
    this._video = undefined;
    this._arTrackable2DList = [];
    this._defaultMarkerWidthUnit = 'mm';
    //Square tracking options
    this.trackableDetectionModeList = {
        'Trackable square pattern (color)' : artoolkit.AR_TEMPLATE_MATCHING_COLOR,
        'Trackable square pattern (mono)' : artoolkit.AR_TEMPLATE_MATCHING_MONO,
        'Trackable square barcode' : artoolkit.AR_MATRIX_CODE_DETECTION,
        'Trackable square pattern and barcode (color)' : artoolkit.AR_TEMPLATE_MATCHING_COLOR_AND_MATRIX,
        'Trackable square pattern and barcode (mono)' : artoolkit.AR_TEMPLATE_MATCHING_MONO_AND_MATRIX
    };    
    
    this.trackableDetectionMode = artoolkit.AR_TEMPLATE_MATCHING_COLOR_AND_MATRIX;
    

    if(o)
    	this.configure(o);
}

ArControllerComponent["@inspector"] = function( arController, inspector )
{   
    inspector.addTitle("AR Controller");
    inspector.addCombo("Trackable detection mode", arController.trackableDetectionMode, { values: arController.trackableDetectionModeList, callback: function (value) { arController.trackableDetectionMode = value }});
    
    inspector.addNumber("Far plane", arController.farPlane, {callback: v => arController.farPlane = v, precision:2, step:1});
    inspector.addNumber("Near plane", arController.nearPlane, {callback: v => arController.nearPlane = v, precision:2, step:0.01});
    
    inspector.addNumber("Marker width", arController.defaultMarkerWidth, {callback: v => arController.defaultMarkerWidth = v, precision:0, step:1, units: arController._defaultMarkerWidthUnit, min: 10});
}

LS.registerComponent(ArControllerComponent);

ArControllerComponent.prototype.onAddedToScene = function( scene ){
    LEvent.bind(scene,"start",this.startAR,this);
    LEvent.bind(scene,'finish',this.stopAR, this );
}
ArControllerComponent.prototype.onRemovedFromScene = function( scene ) {
    //LEvent.bind(scene,"stop",this.stopAR,this);    
}

ArControllerComponent.prototype.startAR = function() {
    console.log("Start AR");

    let scene = LS.GlobalScene;

    // Read the marker-root from the LiteScene

    this._video = ARController.getUserMedia({
        maxARVideoSize: 320, // do AR processing on scaled down video of this size
        facing: "environment",
        onSuccess: function(stream) {
            console.log('got video', stream);
            var cameraPara = new ARCameraParam(this.cameraCalibrationFile);
            cameraPara.onload = function() {
                var arController = new ARController(this._video.videoWidth, this._video.videoHeight, cameraPara);
                arController.setDefaultMarkerWidth(this.defaultMarkerWidth);
                console.log('ARController ready for use', arController);
                
                //TODO: Add select box and use selected detection mode here
                 arController.setPatternDetectionMode( this.trackableDetectionMode );     

                // Add an event listener to listen to getMarker events on the ARController.
                // Whenever ARController#process detects a marker, it fires a getMarker event
                // with the marker details.
                arController.addEventListener('getMarker',this.onMarkerFound.bind(this));         

                // Camera matrix is used to define the “perspective” that the camera would see.
                // The camera matrix returned from arController.getCameraMatrix() is already the OpenGLProjectionMatrix
                // LiteScene supports setting a custom projection matrix but an update of LiteScene is needed to do that.
                //FIX ME: arCamera.setCustomProjectionMatrix(arController.getCameraMatrix());

                // On each frame, detect markers, update their positions and
                // render the frame on the renderer.
                var tick = function() {
                    requestAnimationFrame(tick);

                    // Hide the marker, as we don't know if it's visible in this frame.
                    for (var trackable2D of this._arTrackable2DList){
                        trackable2D.attachedGameObject.visible = false;
                    }

                    // Process detects markers in the video frame and sends
                    // getMarker events to the event listeners.
                    arController.process(this._video);
                    
                    // Render the updated scene.
                    LS.GlobalScene.refresh();
                    //renderer.render(scene, camera);
                }.bind(this);
                tick();

            }.bind(this);
        }.bind(this)
    });
};

ArControllerComponent.prototype.stopAR = function(){
    console.log("Stop AR");    
    if(this._video !== undefined){
        this._video.srcObject.getTracks()[0].stop();
    }
};

ArControllerComponent.prototype.registerTrackable = function(arTrackable2D){
    console.log("Register trackable");
    this._arTrackable2DList.push(arTrackable2D);
}

ArControllerComponent.prototype.unRegisterTrackable = function(arTrackable2D){
    console.log(`Unregister trackable`);
    const indexToRemove = this._arTrackable2DList.indexOf(arTrackable2D);
    if(indexToRemove > -1) {
        this._arTrackable2DList.splice(indexToRemove,1);
    }
}

ArControllerComponent.prototype.onMarkerFound = function (ev){
    const markerIndex = ev.data.index;
    const markerType = ev.data.type;
    const marker = ev.data.marker;
    //Look for a barcode trackable
    const trackableId = ev.data.marker.idMatrix;
    //Look for a pattern trackable
    if(trackableId === undefined || trackableId < 0) {
        const trackableId = ev.data.marker.idPatt;
    }
    
    if (trackableId !== -1) {
        console.log("saw a trackable with id", trackableId);

        this._arTrackable2DList.forEach(arTrackable => {
            if(trackableId === arTrackable.trackableId) {
                let markerRoot = arTrackable.attachedGameObject;
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
                let outQuat = quat.create();
                quat.fromMat4(outQuat,markerRootMatrix);


                markerRoot.transform.setPosition(vec3.fromValues(markerRootMatrix[12],markerRootMatrix[13]*-1,markerRootMatrix[14]*-1));
                markerRoot.transform.setRotation(outQuat);
            } // end if(value === barcodeId)
        });
    }
};