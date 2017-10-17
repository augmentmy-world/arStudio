function ArTrackableComponent( o )
{   
    this.arControllerComponent = LS.Component.getComponent('ArControllerComponent');
    this.trackableId;
    if(o)
    	this.configure(o);
}

LS.registerComponent(ArTrackableComponent);

ArTrackableComponent.prototype.onAddedToScene = function( scene ){
    //Register trackable with ARController
    if(this.arControllerComponent !== undefined){
        this.arControllerComponent.registerTrackable(this);
    }
}
ArTrackableComponent.prototype.onRemovedFromScene = function( scene ) {
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