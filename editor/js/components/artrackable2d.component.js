function ArTrackable2D( o )
{   
    this.arControllerComponent = LS.GlobalScene.findNodeComponents('ArControllerComponent')[0];
    this.trackablePath = "";
    this.trackableId = 1;
    if(o)
    	this.configure(o);
}

LS.registerComponent(ArTrackable2D);

ArTrackable2D["@inspector"] = function( arTrackable, inspector )
{
    inspector.addMarker2D("Marker", arTrackable.trackablePath,
    {
        pretitle: AnimationModule.getKeyframeCode(arTrackable, "marker_pattern"),
        callback: function (v,e) { 
            arTrackable.trackablePath =v;
            var pattern = e.target.dataset["pattern"];
            console.log("---------------pattern file:"+pattern);
        }
    });
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

Object.defineProperty(this,'attachedGameObject', {
    get: function() {
        return this._root;
    },
    set: function() {
        console.log(`Not allowed to set the GameObject`);
    }
});

Object.defineProperty(this,'trackableId', {
    get: function() {
        return this.trackableId;
    },
    set: function(trackableId) {
        //ToDo: Check if there is already a trackable with this name.
        this.trackableId = trackableId;
    }
});