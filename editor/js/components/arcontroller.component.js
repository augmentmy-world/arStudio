function ArControllerComponent( o )
{
    this.farPlane = 1000;
    this.nearPlane= 0.01;
    this.defaultMarkerWidth = 80;
    this.cameraCalibrationFile = 'data/camera_para.dat';
    this._video = undefined;
    this._arTrackable2DList = [];
    this._defaultMarkerWidthUnit = 'mm';
    this._visibleTrackables = [];
    this.initVideo = true;
    this.running = false;
    this.arController = null;
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

ArControllerComponent.arCameraName = 'arcamera';
ArControllerComponent.arBackgroundCamera = 'arbackgroundcamera';
ArControllerComponent.arBackground = 'arBackground';

ArControllerComponent["@inspector"] = function( arController, inspector )
{   
    inspector.addTitle("AR Controller");
    inspector.addCombo("Trackable detection mode", arController.trackableDetectionMode, { values: arController.trackableDetectionModeList, callback: function (value) { arController.trackableDetectionMode = value }});
    
    inspector.addNumber("Far plane", arController.farPlane, {callback: v => arController.farPlane = v, precision:2, step:1});
    inspector.addNumber("Near plane", arController.nearPlane, {callback: v => arController.nearPlane = v, precision:2, step:0.01});
    
    inspector.addNumber("Trackable width", arController.defaultMarkerWidth, {callback: v => arController.defaultMarkerWidth = v, precision:0, step:1, units: arController._defaultMarkerWidthUnit, min: 10});
}

LS.registerComponent(ArControllerComponent);

ArControllerComponent.prototype.onAddedToScene = function( scene ){
    LEvent.bind(scene,"start",this.startAR,this);
    LEvent.bind(scene,'finish',this.stopAR, this );
}
ArControllerComponent.prototype.onRemovedFromScene = function( scene ) {
    LEvent.unbind(scene,"start", this.startAR, this); 
    LEvent.unbind(scene,'finish',this.stopAR, this );
}

ArControllerComponent.prototype.startAR = function() {
    console.log("Start AR");
    this.running = true;
    let scene = LS.GlobalScene;
    var maxARVideoSize = 320;
    // Read the marker-root from the LiteScene

    this._video = ARController.getUserMedia({
        facing: "environment",
        onSuccess: function(stream) {
            console.log('got video', stream);
            this.cameraPara = new ARCameraParam(this.cameraCalibrationFile);
            this.cameraPara.onload = function(param) {
                var maxSize = maxARVideoSize || Math.max(stream.videoWidth, stream.videoHeight);
				var f = maxSize / Math.max(stream.videoWidth, stream.videoHeight);
				var w = f * stream.videoWidth;
				var h = f * stream.videoHeight;
				if (stream.videoWidth < stream.videoHeight) {
					var tmp = w;
					w = h;
					h = tmp;
				}
                
                this.arController = new ARController(w, h, this.cameraPara);        
				this.arController.image = stream;
				if (stream.videoWidth < stream.videoHeight) {
					this.arController.orientation = 'portrait';
					this.arController.videoWidth = stream.videoHeight;
					this.arController.videoHeight = stream.videoWidth;
				} else {
					this.arController.orientation = 'landscape';
					this.arController.videoWidth = stream.videoWidth;
					this.arController.videoHeight = stream.videoHeight;
                }

                this.arController.setDefaultMarkerWidth(this.defaultMarkerWidth);
                
                //this.arController = new ARController(this._video.videoWidth, this._video.videoHeight, cameraPara);
                //this.arController.setDefaultMarkerWidth(this.defaultMarkerWidth);
                //console.log('ARController ready for use', this.arController);
                
                // FIXME: In Player-Mode the detection Mode is undefined 
                this.arController.setPatternDetectionMode( (this.trackableDetectionMode || 3) );     

                // Add an event listener to listen to getMarker events on the ARController.
                // Whenever ARController#process detects a marker, it fires a getMarker event
                // with the marker details.
                this.arController.addEventListener('getMarker',this.onTrackableFound.bind(this));         

                // Camera matrix is used to define the “perspective” that the camera would see.
                // The camera matrix returned from arController.getCameraMatrix() is already the OpenGLProjectionMatrix
                // LiteScene supports setting a custom projection matrix but an update of LiteScene is needed to do that.
                //FIX ME: arCamera.setCustomProjectionMatrix(arController.getCameraMatrix());

                this._arTrackable2DList.forEach(trackable2D => { 
                    if(trackable2D._trackableType === trackable2D.trackableTypes[1])
                    {
                        this.arController.loadMarker(trackable2D.trackablePath, function(markerId) {
                            console.log("Register trackable - Pattern");
                            trackable2D.trackableId = markerId;
                        });
                    }
                });

                const sceneRoot = LS.GlobalScene.root;
     
                //Add the AR-Camera to the scene
                let arCameraNode = new LS.SceneNode(ArControllerComponent.arCameraName);
                let arCamera = new LS.Camera();
                arCamera.background_color=[0, 0, 0, 0];
                arCamera.clear_color = false; //Do not clear buffer from first camera.
                arCameraNode.addComponent(arCamera);
                sceneRoot.addChild(arCameraNode, 0);

                // On each frame, detect markers, update their positions and
                // render the frame on the renderer.
                var tick = function() {
                    if(!this.running)
                        return;
                    requestAnimationFrame(tick);
                    
                    // Hide the marker, as we don't know if it's visible in this frame.
                    for (var trackable2D of this._arTrackable2DList){
                        trackable2D._previousState = trackable2D._currentState;                        
                        trackable2D._currentState = undefined;
                    }

                    // Process detects markers in the video frame and sends
                    // getMarker events to the event listeners.
                    this.arController.process(this._video);

                    // If after the processing trackable2D.currentState is still undefined and the previous state wasn't undefined we assume that the marker was not visible within that frame
                    this._arTrackable2DList.forEach(arTrackable => {
                        if( arTrackable._currentState === undefined && arTrackable._previousState !== undefined){
                            arTrackable.visible = false;
                        }
                    });
                    
                    // Render the updated scene.
                    LS.GlobalScene.refresh();
                    //renderer.render(scene, camera);
                }.bind(this);
                tick();

            }.bind(this);
        }.bind(this)
    });
    var style = this._video.style;
    style.position = 'absolute';
    style.top = '50%';
    style.left = '50%';
    style.width = 'auto';
    style.height = 'auto';
    style.minWidth = '100%';
    style.minHeight = '100%';
    style.backgroundSize = 'cover';
    style.overflow = 'hidden';
    style.transform = 'translate(-50%, -50%)';
    style.zIndex = '-1';
    var canvas = $('canvas');
    canvas.css("z-index",99);
    canvas[0].parentElement.insertBefore(this._video, canvas[0]);


    //(document.body.children[0])
};

ArControllerComponent.prototype.stopAR = function(){
    console.log("Stop AR");    
    this.running = false;
    if(this.arController)
        this.arController.dispose();
    if(this._video !== undefined){
        this._video.srcObject.getTracks()[0].stop();
    }

    var arCamera = LS.GlobalScene.getNode(ArControllerComponent.arCameraName);
    if(arCamera)
        LS.GlobalScene.root.removeChild(arCamera);
    
    var arBackgroundCamera = LS.GlobalScene.getNode(ArControllerComponent.arBackgroundCamera);
    if(arBackgroundCamera)
        LS.GlobalScene.root.removeChild(arBackgroundCamera);
    
    var arBackground = LS.GlobalScene.getNode(ArControllerComponent.arBackground);
    if(arBackground)
        LS.GlobalScene.root.removeChild(arBackground);
    this.initVideo = true;
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

ArControllerComponent.prototype.onTrackableFound = function (ev){
    const markerIndex = ev.data.index;
    const markerType = ev.data.type;
    const marker = ev.data.marker;
    //Look for a barcode trackable
    let trackableId = ev.data.marker.idMatrix;
    //Look for a pattern trackable
    if(trackableId === undefined || trackableId < 0) {
        trackableId = ev.data.marker.idPatt;
    }
    
    if (trackableId !== -1) {
        // console.log("saw a trackable with id", trackableId);

        this._arTrackable2DList.forEach(arTrackable => {
            if(trackableId === arTrackable.trackableId) {
                let markerRoot = arTrackable.attachedGameObject;
                arTrackable.visible = true;
                
                // Note that you need to copy the values of the transformation matrix,
                // as the event transformation matrix is reused for each marker event
                // sent by an ARController.
                var transform = ev.data.matrix;
                // console.log(transform);

                // Apply transform to marker root
                scene_arCameraNode= LS.GlobalScene.getNodeByName( ArControllerComponent.arCameraName );

                let cameraGlobalMatrix = scene_arCameraNode.transform.getGlobalMatrix();
                let markerRootMatrix = mat4.create();
                mat4.multiply(markerRootMatrix,cameraGlobalMatrix,transform);
                let outQuat = quat.create();
                quat.fromMat4(outQuat,markerRootMatrix);
                outQuat[0]*=-1;
                markerRoot.transform.setPosition(vec3.fromValues(markerRootMatrix[12],markerRootMatrix[13]*-1,markerRootMatrix[14]*-1));
                markerRoot.transform.setRotation(outQuat);
            } // end if(trackableId === arTrackable.trackableId)
        });
    }
};