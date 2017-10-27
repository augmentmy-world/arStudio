function ArTrackable2D( o )
{   
    this.arControllerComponent = LS.GlobalScene.findNodeComponents('ArControllerComponent')[0];
    // FIXME: make that static
    this.trackableTypes = ["Barcode", "Pictorial"];
    // FIXME: make that static
    this._defaultTrackableType = 0;

    this._trackableType = this.trackableTypes[this._defaultTrackableType];
    this._trackablePath = this.trackablePath;
    this._trackableId = 1;
    this._barcodeIds = [];
    this._currentState = undefined;
    this._previousState = this._currentState;

    for(i = 0; i <= 63; i++){
        this._barcodeIds.push(i);
    }
    this.selectedBarcodeId = this._barcodeIds[0];

    if(o)
    	this.configure(o);
}

ArTrackable2D.prototype.serialize = function()
{
	return {
        trackableId: this._trackableId,
        trackableType: this._trackableType
	};
}

ArTrackable2D.prototype.configure = function(o)
{
    if(o.trackableType !== undefined){
        this._trackableType = o.trackableType;
    }

	if(o.trackableId !== undefined) //we can control if the parameter exist
		this.trackableId = o.trackableId;
}

Object.defineProperty(ArTrackable2D.prototype, "trackablePath", {
    set: function (v) {
        this._trackablePath = v; 
        this._trackableType = this.trackableTypes[1];
        //this.updateMaterial();
    },
    get: function () {
        return this._trackablePath;
    }
});

ArTrackable2D.trackableName = '2D Trackable';


// ArTrackable2D.prototype.updateMaterial = function(){
//     if (!this.root.material)
//         this.root.material = new LS.StandardMaterial();
//     var material = this.root.getMaterial();    
//     material.setTexture('color', this.trackablePath); 
// }

LS.registerComponent(ArTrackable2D);

ArTrackable2D["@inspector"] = function( arTrackable, inspector )
{
    inspector.addCombo("Trackable type", arTrackable._trackableType, {values: arTrackable.trackableTypes, callback: v => {
        arTrackable._trackableType = v;
        inspector.refresh();
    }});

    if(arTrackable._trackableType === arTrackable.trackableTypes[1]) {
        inspector.addMarker2D("Image", arTrackable.trackablePath,
        {
            pretitle: AnimationModule.getKeyframeCode(arTrackable, "marker_pattern"),
            callback: function (v,e) { 
                arTrackable.trackablePath =v;
                var pattern = e.target.dataset["pattern"];
                console.log("---------------pattern file:"+pattern);
            }
        });
    }
    else {
        inspector.addCombo("Barcode Id", arTrackable.selectedBarcodeId, {values: arTrackable._barcodeIds, callback: v => {
            arTrackable.selectedBarcodeId = v;
            arTrackable.trackableId = arTrackable.selectedBarcodeId;
        }});
    }
}

ArTrackable2D.prototype.onAddedToScene = function( scene ){
    //Register trackable with ARController
    if(this.arControllerComponent !== undefined){
        this.arControllerComponent.registerTrackable(this);
    }
}
ArTrackable2D.prototype.onRemovedFromScene = function( scene ) {
    //Remove trackable from ARController
    if(this.arControllerComponent !== undefined){
        this.arControllerComponent.unRegisterTrackable(this);
    }
}

Object.defineProperty(ArTrackable2D.prototype,'attachedGameObject', {
    get: function() {
        return this._root;
    },
    set: function() {
        console.log(`Not allowed to set the GameObject`);
    }
});

Object.defineProperty(ArTrackable2D.prototype,'trackableId', {
    get: function() {
        return this._trackableId;
    },
    set: function(trackableId) {
        //ToDo: Check if there is already a trackable with this name.
        this._trackableId = trackableId;
        // If Barcode trackable is selected use the id as selectedBarcodeId
        if(this._trackableType === this.trackableTypes[0]) {
            this.selectedBarcodeId = trackableId;
        }

    }
});

Object.defineProperty(ArTrackable2D.prototype,'visible', {
    get: function() {
        return this._visible;
    },
    set: function(visible) {
        this._visible = visible;
        if(visible){
            this._currentState = 'visible';
            // Only send the event when the trackable wasn't visible inside the previous frame.
            if(this._previousState === undefined){
                LEvent.trigger(LS.GlobalScene, "onTrackableFound", this);    
            }
            // This means the trackable was visible inside the previous frame and is still visible. In that case we send a onTrackableTracking event
            else {
                LEvent.trigger(LS.GlobalScene, "onTrackableTracking", this);                    
            }
            this.attachedGameObject.visible = true;        
        }
        else{
            // Sanity: Make sure to only send the trackable lost event if trackable was visible inside the previous frame
            if( this._previousState !== undefined ) {
                LEvent.trigger(LS.GlobalScene, "onTrackableLost", this);  
            }
            this.attachedGameObject.visible = false;
        }
    }
});