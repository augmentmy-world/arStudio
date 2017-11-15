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

    // Register orientation change listener to be informed on orientation change events
    // https://stackoverflow.com/questions/1649086/detect-rotation-of-android-phone-in-the-browser-with-javascript
    // Detect whether device supports orientationchange event, otherwise fall back to
    // the resize event.
    this.supportsOrientationChange = "onorientationchange" in window;
    this.orientationEvent = this.supportsOrientationChange ? "orientationchange" : "resize";

    window.addEventListener(this.orientationEvent, function() {
        // Also window resize events are received here. Unfortunately if we don't have a running AR scene we don't have an arController and we see errors in the log
        // because of that we check if there is an ARController object available
        if(this.arController){
            console.log("window.orientation " + window.orientation + " screen.orientation " + screen.orientation );
            this._setupCameraForScreenOrientation(screen.orientation.type);
        }
    }.bind(this));

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
    var self = null;

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

                this.arController.setDefaultMarkerWidth(this.defaultMarkerWidth);
                
                // FIXME: In Player-Mode the detection Mode is undefined 
                this.arController.setPatternDetectionMode( (this.trackableDetectionMode || 3) );     

                // Add an event listener to listen to getMarker events on the ARController.
                // Whenever ARController#process detects a marker, it fires a getMarker event
                // with the marker details.
                this.arController.addEventListener('getMarker',this.onTrackableFound.bind(this));         

                this._arTrackable2DList.forEach(trackable2D => { 
                    if(trackable2D._trackableType === trackable2D.trackableTypes[1])
                    {
                        this.arController.loadMarker(trackable2D.trackablePath, function(markerId) {
                            console.log("Register trackable - Pattern");
                            trackable2D.trackableId = markerId;
                        });
                    }
                });

                var left = 0;
                var bottom = 0;
                var w = 1;
                var h = 1;
                var cw = 0;
                var ch = 0;                
                var vw = 0;
                var vh = 0;

                if(this.initVideo)
                {
                    var style = stream.style;
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
                    style.zIndex = '1';

                    var canvas = $('canvas');

                    vw = stream.videoWidth;
                    vh = stream.videoHeight;

                    if(canvas.length==1)
                    {
                        //View page is the player
                        var selectedCanvas = $(canvas[0]);
                        selectedCanvas.before(stream);
                        cw = selectedCanvas.width();
                        ch = selectedCanvas.height();
                        selectedCanvas.css("z-index",99);
                        selectedCanvas.css("position","absolute");
                    }
                    else if(canvas.length>1)
                    {
                        //View page is the editor.
                        var gameTab = $("#ingametab");
                        gameTab.append(stream);

                        var selectedCanvas = $(canvas[0]);
                        if(selectedCanvas)
                        {
                            cw = selectedCanvas.width();
                            ch = selectedCanvas.height();
                            selectedCanvas.css("z-index",99);
                            selectedCanvas.css("position","absolute");
                        }
                        //style.zIndex = '9';
                    }

                
                    var ratioW = cw/vw;
                    var ratioH = ch/vh;
                    var ratioMax = Math.max(ratioW, ratioH);

                    var vwScaled = ratioMax * vw;
                    var vhScaled = ratioMax * vh;

                    // Viewport, expressed in normalised canvas coordinates.
                    left = ((cw - vwScaled) / 2.0);
                    bottom = ((ch - vhScaled) / 2.0);
                    w = vwScaled;
                    h = vhScaled;

                }
                
                const sceneRoot = LS.GlobalScene.root;
     
                //Add the AR-Camera to the scene
                this.arCameraNode = new LS.SceneNode(ArControllerComponent.arCameraName);
                this.arCamera = new LS.Camera();
                this.arCamera.setViewportInPixels(0, 0, cw, ch);
                this.arCamera.background_color=[0, 0, 0, 0];
                this.arCamera.clear_color = false; //Do not clear buffer from first camera.
                this.arCameraNode.addComponent(this.arCamera);
                LS.Renderer.enableCamera(this.arCamera);                
                if(vw && vh)
                    this.resize(cw, ch, vw, vh);
                self = this;
                window.addEventListener('resize', function() {
                    var selectedCanvas = $(canvas[0]);
                    if(selectedCanvas)
                    {
                        //todo: handle window/canvas resize
                        self.arCamera.clear_color = true;

                        cw = selectedCanvas.width();
                        ch = selectedCanvas.height();
                        //gl.clearColor( 0.0,0.0,0.0,0.0 );
                        self.arCamera.setViewportInPixels(0, 0, cw, ch);

                        LS.Renderer.enableCamera(self.arCamera);                  
                        self.resize(cw, ch, vw, vh);                  
                    }

                }, false);                

                sceneRoot.addChild(this.arCameraNode, 0);
                LS.GlobalScene.root.getComponent(LS.Camera).background_color=[0, 0, 0, 0];
                this._setupCameraForScreenOrientation(screen.orientation.type);                

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
                        if( arTrackable._currentState === undefined){
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

};

ArControllerComponent.prototype.resize = function(cw, ch, vw, vh) {
    console.log('window resized');

    if (!this.arController) return;
    this.arController.orientation = (vw < vh) ? 'portrait' : 'landscape';

    // Resize the 3D camera frustum (via the fov)
    var camMatrix = this.arController.getCameraMatrix();
    var fovy = 2 * Math.atan(1 / camMatrix[5]) * 180 / Math.PI;


    if (vw < vh) {
        this.arCamera.fov = Math.abs(fovy) * (vh / vw);
    } else {
        if (cw / ch > vw / vh) {
            // Video Y FOV is limited so we must limit 3D camera FOV to match
            this.arCamera.fov = Math.abs(fovy) * (vw / vh) / (cw / ch);
        } else {
            // Video Y FOV is limited so we must limit 3D camera FOV to match
            this.arCamera.fov = Math.abs(fovy);
        }
    }
}

ArControllerComponent.prototype.stopAR = function(){
    console.log("Stop AR");    
    this.running = false;
    if(this.arController)
        this.arController.dispose();
    if(this._video !== undefined){
        this._video.srcObject.getTracks()[0].stop();
        this._video.remove();
    }

    if(this.arCamera)
        LS.GlobalScene.root.removeChild(this.arCamera);
    
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
        console.log("saw a trackable with id", trackableId);

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
                let cameraGlobalMatrix = this.arCameraNode.transform.getGlobalMatrix();
                let markerRootMatrix = mat4.create();
                mat4.multiply(markerRootMatrix, cameraGlobalMatrix, transform);
                let outQuat = quat.create();
                quat.fromMat4(outQuat,markerRootMatrix);
                outQuat[0]*=-1;
                markerRoot.transform.setPosition(vec3.fromValues(markerRootMatrix[12],markerRootMatrix[13]*-1,markerRootMatrix[14]*-1));
                markerRoot.transform.setRotation(outQuat);
            } // end if(trackableId === arTrackable.trackableId)
        });
    }
};

ArControllerComponent.prototype._setupCameraForScreenOrientation = function (orientation) {
    
    // Camera matrix is used to define the “perspective” that the camera would see.
    // The camera matrix returned from arController.getCameraMatrix() is already the OpenGLProjectionMatrix
    // LiteScene supports setting a custom projection matrix but an update of LiteScene is needed to do that.

    //Save the original projection matrix so that there is a reference
    if(this.originalProjectionMatrix === undefined) {
        this.originalProjectionMatrix = this.arCamera.getProjectionMatrix();
    }

    if ( orientation.includes('portrait') ) {
        this.arController.orientation = 'portrait';
        this.arController.videoWidth = this._video.videoHeight;
        this.arController.videoHeight = this._video.videoWidth;

        // TODO once we have proper handling of calibration file we use this
        // let cameraProjectionMatrix = this.arController.getCameraMatrix();
        // mat4.rotateX(cameraProjectionMatrix, cameraProjectionMatrix, 3.14159);  // Rotate around x by 180°                  

        let cameraProjectionMatrix = mat4.create();
        mat4.copy(cameraProjectionMatrix, this.originalProjectionMatrix);                 
        mat4.rotateZ(cameraProjectionMatrix, cameraProjectionMatrix, 1.5708);       // Rotate around z by 90°               
        this.arCamera.setCustomProjectionMatrix(cameraProjectionMatrix);
    } else {
        this.arController.orientation = 'landscape';
        this.arController.videoWidth = this._video.videoWidth;
        this.arController.videoHeight = this._video.videoHeight;
        // TODO: once we have proper handling of calibration file we use this
        // let cameraProjectionMatrix = this.arController.getCameraMatrix();
        // mat4.rotateX(cameraProjectionMatrix, cameraProjectionMatrix, 3.14159);                 
        // arCamera.setCustomProjectionMatrix(cameraProjectionMatrix);

        this.arCamera.setCustomProjectionMatrix(this.originalProjectionMatrix);
    }
}

