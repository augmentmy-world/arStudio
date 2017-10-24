const trackableName= '2D Trackable';

function ArTrackable2D( o )
{   
    this.arControllerComponent = LS.GlobalScene.findNodeComponents('ArControllerComponent')[0];
    this.trackableTypes = ["Barcode", "Pictorial"];
    this._defaultTrackableType = 0;
    this._trackableType = this.trackableTypes[this._defaultTrackableType];
    this.trackablePath = "";
    this._trackablePath = this.trackablePath;
    this._trackableId = 1;
    this._barcodeIds = [];
    this.selectedBarcodeId = this._barcodeIds[0];

    for(i = 0; i <= 63; i++){
        this._barcodeIds.push(i);
    }

    if(o)
    	this.configure(o);
}

Object.defineProperty(ArTrackable2D.prototype, "trackablePath", {
    set: function (v) {
        this._trackablePath = v; 
        //this.updateMaterial();
    },
    get: function () {
        return this._trackablePath;
    }
});

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
            LEvent.trigger(this, "onTrackableFound", this);    
            this.attachedGameObject.visible = true;        
        }
        else{
            LEvent.trigger(this, "onTrackableLost", this);  
            this.attachedGameObject.visible = false;
        }
    }
});