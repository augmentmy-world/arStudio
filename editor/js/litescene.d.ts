// Type definitions for [~THE LIBRARY NAME~] [~OPTIONAL VERSION NUMBER~]
// Project: [~THE PROJECT NAME~]
// Definitions by: [~YOUR NAME~] <[~A URL FOR YOU~]>

/*~ If this library is callable (e.g. can be invoked as myLib(3)),
 *~ include those call signatures here.
 *~ Otherwise, delete this section.
 */
/**
 * Type known variables
 */
// We know that 'node' is available for scripting and that it is of type LS.SceneNode
declare const node: SceneNode;
declare const scene:SceneTree;

//TODO: define
declare class SpatialContainer {

}

declare namespace Transform {
    let temp_matrix:any;
    let icon:string;
    let ZERO:any;
    let UP:any;
    let RIGHT:any;
    let FRONT:any;

    const properties: object;
}

/** Transform that contains the position (vec3), rotation (quat) and scale (vec3) 
* @class Transform
* @constructor
* @param {Object} object to configure from
*/
declare class Transform {
    constructor(initialize?:boolean);

    private _data:Float32Array;
    data: Float32Array;
    private _position:Float32Array;
    position:Float32Array;
    private _rotation:Float32Array;
    rotation:Float32Array;
    private _scaling:Float32Array;
    scaling:Float32Array;
    private _local_matrix:any;
    local_matrix: Float32Array;

    /**
    * The local matrix transform relative to its parent in mat4 format
    * @property matrix {mat4}
    */
    private _global_matrix:any;
    global_matrix:any;

    _uid:any;
    _root: Node;
    _parent: Node;

    /**
    * Force object to update matrices
    * @property mustUpdate {boolean}
    */
    private _must_update:boolean;
    must_update:boolean;
    _version: number;

    x:number;
    y:number;
    z:number;
    xrotation:number;
    yrotation:number;
    zrotation:number;

    /**
    * The local matrix transform relative to its parent in mat4 format
    * @property matrix {mat4}
    */    
    forward:any;



    /**
    * The position relative to its parent in vec3 format
    * @property position {vec3}
    */
    globalPosition:any;





    onAddedToNode(node:Node);

    onRemovedFromNode(node:Node);

    getPropertiesInfo(v:string):object;

    /**
    * Copy the transform from another Transform
    * @method copyFrom
    * @param {Transform} src
    */   
    copyFrom(src:Transform);

    /**
    * Configure from a serialized object
    * @method configure
    * @param {Object} object with the serialized info
    */    
    configure(o:object);

    /**
    * Serialize the object 
    * @method serialize
    * @return {Object} object with the serialized info
    */    
    serialize():object;

    /**
    * Reset this transform
    * @method identity
    */    
    identity();

    // same as identity()
    reset();

    /**
    * Sets the rotation to identity
    * @method resetRotation
    */   
    resetRotation();
    
    /**
    * Sets the position to 0,0,0
    * @method resetPosition
    */   
    resetPosition();
    
    /**
    * Sets the scale to 1,1,1
    * @method resetScale
    */   
    resetScale();
    
    /**
    * Returns a copy of the local position
    * @method getPosition
    * @param {vec3} out [optional] where to store the result, otherwise one vec3 is created and returned
    * @return {vec3} the position
    */    
    getPosition(out?:any):any;

    /**
    * Returns a copy of the global position
    * @method getGlobalPosition
    * @param {vec3} out [optional] where to store the result, otherwise one vec3 is created and returned
    * @return {vec3} the position
    */  
    getGlobalPosition(out?:any):any;
    
    /**
    * Returns the rotation in quaternion array (a copy)
    * @method getRotation
    * @param {quat} out [optional] where to store the result, otherwise one quat is created and returned
    * @return {quat} the rotation
    */  
    getRotation(quat?:any):any;    
    
    /**
    * Returns the global rotation in quaternion array (a copy)
    * @method getGlobalRotation
    * @param {quat} out [optional] where to store the result, otherwise one quat is created and returned
    * @return {quat} the rotation
    */    
    getGlobalRotation(out:any):any;

    /**
    * Returns the scale (its a copy)
    * @method getScale
    * @param {vec3} out [optional] where to store the result, otherwise one vec3 is created and returned
    * @return {vec3} the scale
    */  
    getScale(out:any):any;  

    /**
    * Returns a copy of the global scale (this is not correct, there is no global_scale factor, because due to rotations the axis could change)
    * @method getGlobalScale
    * @param {vec3} out [optional] where to store the result, otherwise one vec3 is created and returned
    * @return {vec3} the scale
    */    
    getGlobalScale(out:any):any;  

    /**
    * update the local Matrix to match the position,scale and rotation
    * @method updateMatrix
    */    
    updateMatrix();

    //same as updateMatrix()
    updateLocalMatrix();

    /**
    * updates the global matrix using the parents transformation
    * @method updateGlobalMatrix
    * @param {bool} fast it doesnt recompute parent matrices, just uses the stored one, is faster but could create errors if the parent doesnt have its global matrix update
    */   
    updateGlobalMatrix(fast:boolean);


    //TODO define the rest of the functions.
}

declare namespace SceneTree {
    const supported_events: string[];
}

/**
* The SceneTree contains all the info about the Scene and nodes
*
* @class SceneTree
* @constructor
*/
declare class SceneTree {
    uid: string;
    private _root: SceneNode;
    root:SceneNode;
    private _nodes: SceneNode[];
    private _nodes_by_name: object;
    private _nodes_by_uid: object;
    private _components_by_uid: object;
    
    //used to stored info when collecting from nodes
    _instances: any[];
    _lights: any[];
    _cameras: any[];
    _colliders: any[];

    time:any;
    state:any;
    globalTime:any;
    frame:any;

    
    //MOST OF THE PARAMETERS ARE CREATED IN init() METHOD

    //in case the resources base path are located somewhere else, if null the default is used
	private external_repository:string;
    
    //work in progress, not finished yet. This will contain all the objects
    // TODO: add type
    private _spatial_container:SpatialContainer;

    external_scripts:any[]; //external scripts that must be loaded before initializing the scene (mostly libraries used by this scene)
    global_scripts:any[]; //scripts that are located in the resources folder and must be loaded before launching the app
    preloaded_resources:object; //resources that must be loaded, appart from the ones in the components

    //track with global animations of the scene
    animation:any;

    //FEATURES NOT YET FULLY IMPLEMENTED
    private _paths:string[]; //FUTURE FEATURE: to store splines I think
    private _local_resources:object; //used to store resources that go with the scene

    layer_names: string[];

    private _shaderblock_info:any;


    /**
    * This initializes the content of the scene.
    * Call it to clear the scene content
    *
    * @method init
    * @return {Boolean} Returns true on success
    */
    init();

    /**
    * Clears the scene using the init function
    * and trigger a "clear" LEvent
    *
    * @method clear
    */
    clear();
        
    /**
    * Configure the Scene using an object (the object can be obtained from the function serialize)
    * Inserts the nodes, configure them, and change the parameters
    * ATTENTION: Destroys all previously existing info
    *
    * @method configure
    * @param {Object} scene_info the object containing all the info about the nodes and config of the scene
    */
    configure(scene_info:object);


    /**
    * Creates and object containing all the info about the scene and nodes.
    * The oposite of configure.
    * It calls the serialize method in every node
    *
    * @method serialize
    * @return {Object} return a JS Object with all the scene info
    */
    serialize():object;

    /**
    * Assigns a scene from a JSON description (or WBIN,ZIP)
    *
    * @method setFromJSON
    * @param {String} data JSON object containing the scene
    * @param {Function}[on_complete=null] the callback to call when the scene is ready
    * @param {Function}[on_error=null] the callback to call if there is a  loading error
    * @param {Function}[on_progress=null] it is called while loading the scene info (not the associated resources)
    * @param {Function}[on_resources_loaded=null] it is called when all the resources had been loaded
    * @param {Function}[on_scripts_loaded=null] the callback to call when the loading is complete but before assigning the scene
    */
    setFromJSON(data:string, on_complete?:() => void , on_error?:() => void, on_progress?:() => void, on_resources_loaded?:() => void, on_scripts_loaded?:() => void)

    /**
    * Loads a scene from a relative url pointing to a JSON description (or WBIN,ZIP)
    * Warning: this url is not passed through the LS.ResourcesManager so the url is absolute
    *
    * @method load
    * @param {String} url where the JSON object containing the scene is stored
    * @param {Function}[on_complete=null] the callback to call when the loading is complete
    * @param {Function}[on_error=null] the callback to call if there is a  loading error
    * @param {Function}[on_progress=null] it is called while loading the scene info (not the associated resources)
    * @param {Function}[on_resources_loaded=null] it is called when all the resources had been loaded
    */    
    load(url:string, on_complete?:() => void, on_error?:() => void, on_progress?:() => void, on_resources_loaded?:() => void, on_loaded?:() => void);

    /**
    * Loads a scene from a relative url pointing to a JSON description (or WBIN,ZIP)
    * It uses the resources folder as the root folder (in comparison with the regular load function)
    *
    * @method loadFromResources
    * @param {String} url where the JSON object containing the scene is stored
    * @param {Function}[on_complete=null] the callback to call when the loading is complete
    * @param {Function}[on_error=null] the callback to call if there is a  loading error
    * @param {Function}[on_progress=null] it is called while loading the scene info (not the associated resources)
    * @param {Function}[on_resources_loaded=null] it is called when all the resources had been loaded
    */
    loadFromResources(url:string, on_complete?:() => void, on_error?:() => void, on_progress?:() => void, on_resources_loaded?:() => void);

    /**
    * Static method, returns a list of all the scripts that must be loaded, in order and with the full path
    *
    * @method SceneTree.getScriptsList
    * @param {SceneTree|Object} scene the object containing info about the scripts (could be a scene or a JSON object)
    * @param {Boolean} allow_local if we allow local resources
    * @param {Boolean} full_paths if true it will return the full path to every resource
    */
    getScriptsList(scene:SceneTree | object, allow_local:boolean, full_paths:boolean):any[];

    //reloads external and global scripts taking into account if they come from wbins
    loadScripts(scripts:any[], on_complete?: () => void, on_error?: () => void, force_reload?:boolean);

    //used to ensure that components use the right class when the class comes from a global script
    checkComponentsCodeModification();

    appendScene(scene:SceneTree);

    getCamera():object;

    /**
    * Returns an array with all the cameras enabled in the scene
    *
    * @method getActiveCameras
    * @param {boolean} force [optional] if you want to collect the cameras again, otherwise it returns the last ones collected
    * @return {Array} cameras
    */
    getActiveCameras(force?:boolean):object[];

    /**
    * Returns an array with all the cameras in the scene (even if they are disabled)
    *
    * @method getAllCameras
    * @return {Array} cameras
    */
    getAllCameras():object[];

    getLight():object[];

    /**
    * Returns an array with all the lights enabled in the scene
    *
    * @method getActiveLights
    * @param {boolean} force [optional] if you want to collect the lights again, otherwise it returns the last ones collected
    * @return {Array} lights
    */
    getActiveLights(force?:boolean):object[];

    /**
	 * Fires nodeAdded and change LEvent when a new node is added to this scene
	 * LEvent.trigger(this,"nodeAdded", node);
	 * LEvent.trigger(this,"change");
     * 
     * @param e TODO: not used?
     * @param node the node that might have been added
     */
    onNodeAdded(e:any,node:SceneNode);

    /**
	 * Fires nodeAdded and change LEvent when a new node is added to this scene
	 * LEvent.trigger(this,"nodeAdded", node);
	 * LEvent.trigger(this,"change");
     * 
     * @param e TODO: not used?
     * @param node the node that might have been added
     */
    onNodeRemoved(e:any,node:SceneNode);

    /**
    * all nodes are stored in an array, this function recomputes the array so they are in the right order in case one has changed order
    *
    * @method recomputeNodesArray
    */   
    recomputeNodesArray();

    /**
    * Returns the array containing all the nodes in the scene
    *
    * @method getNodes
    * @param {bool} recompute [optional] in case you want to rearrange the nodes
    * @return {Array} array containing every SceneNode in the scene
    */
    getNodes(recompute?:boolean):SceneNode[];

    /**
    * retrieves a Node that matches that name. It is fast because they are stored in an object.
    * If more than one object has the same name, the first one added to the tree is returned
    *
    * @method getNodeByName
    * @param {String} name name of the node
    * @return {Object} the node or null if it didnt find it
    */    
    getNodeByName(name:string): SceneNode | null;

    /**
    * retrieves a Node based on a given uid. It is fast because they are stored in an object
    *
    * @method getNodeByUId
    * @param {String} uid uid of the node
    * @return {Object} the node or null if it didnt find it
    */
    getNodeByUId(uid:string):SceneNode | null;

    /**
    * retrieves a Node by its index
    *
    * @method getNodeByIndex
    * @param {Number} node index
    * @return {Object} returns the node at the 'index' position in the nodes array
    */
    getNodeByIndex(index:number): SceneNode | null;

    //for those who are more traditional
    getElementById(name:string): SceneNode;

    /**
    * retrieves a node array filtered by the filter function
    *
    * @method filterNodes
    * @param {function} filter a callback function that receives every node and must return true or false
    * @return {Array} array containing the nodes that passes the filter
    */    
    filterNodes(filterFunction: () => boolean ): SceneNode[];

    /**
    * searches the component with this uid, it iterates through all the nodes and components (slow)
    *
    * @method findComponentByUId
    * @param {String} uid uid of the node
    * @return {Object} component or null
    */  
    findComponentByUId(uid:string):object;

    /**
    * searches the material with this uid, it iterates through all the nodes (slow)
    *
    * @method findMaterialByUId
    * @param {String} uid uid of the material
    * @return {Object} Material or null
    */    
    findMaterialByUId(uid:string):object;

    /**
    * Returns information of a node component property based on the locator of that property
    * Locators are in the form of "{NODE_UID}/{COMPONENT_UID}/{property_name}"
    *
    * @method getPropertyInfo
    * @param {String} locator locator of the property
    * @return {Object} object with node, component, name, and value
    */    
    getPropertyInfo(property_uid:string):object;

    /**
    * Returns information of a node component property based on the locator of that property
    * Locators are in the form of "{NODE_UID}/{COMPONENT_UID}/{property_name}"
    *
    * @method getPropertyInfoFromPath
    * @param {Array} path
    * @return {Object} object with node, component, name, and value
    */
    getPropertyInfoFromPath(path:string):object;

    /**
    * Assigns a value to the property of a component in a node based on the locator of that property
    * Locators are in the form of "{NODE_UID}/{COMPONENT_UID}/{property_name}"
    *
    * @method getPropertyValue
    * @param {String} locator locator of the property
    * @param {SceneNode} root [Optional] if you want to limit the locator to search inside a node
    * @return {Component} the target where the action was performed
    */    
    getPropertyValue(locator:string,root?:SceneNode):object;

    getPropertyValueFromPath(path:string):object;

    /**
    * Assigns a value to the property of a component in a node based on the locator of that property
    * Locators are in the form of "{NODE_UID}/{COMPONENT_UID}/{property_name}"
    *
    * @method setPropertyValue
    * @param {String} locator locator of the property
    * @param {*} value the value to assign
    * @param {SceneNode} root [Optional] if you want to limit the locator to search inside a node
    * @return {Component} the target where the action was performed
    */
    setPropertyValue( locator:string, value:any, root_node?:SceneNode ):object;

    /**
    * Assigns a value to the property of a component in a node based on the locator that property
    * Locators are in the form of "{NODE_UID}/{COMPONENT_UID}/{property_name}"
    *
    * @method setPropertyValueFromPath
    * @param {Array} path a property locator split by "/"
    * @param {*} value the value to assign
    * @param {SceneNode} root_node [optional] the root node where you want to search the locator (this is to limit the locator to a branch of the scene tree)
    * @param {Number} offset [optional] used to avoir generating garbage, instead of slicing the array every time, we pass the array index
    * @return {Component} the target where the action was performed
    */  
    setPropertyValueFromPath(path:string[], value:any, root_node:SceneNode, offset:number):object;  

    /**
    * Returns the resources used by the scene
    * includes the nodes, components, preloads and global_scripts
    * doesn't include external_scripts
    *
    * @method getResources
    * @param {Object} resources [optional] object with resources
    * @param {Boolean} as_array [optional] returns data in array format instead of object format
    * @param {Boolean} skip_in_pack [optional] skips resources that come from a pack
    * @param {Boolean} skip_local [optional] skips resources whose name starts with ":" (considered local resources)
    * @return {Object|Array} the resources in object format (or if as_array is true, then an array)
    */    
    getResources(resources?:object, as_array?:boolean, skip_in_pack?:boolean, skip_local?:boolean):object | object[];

    /**
    * Loads all the resources of all the nodes in this scene
    * it sends a signal to every node to get all the resources info
    * and load them in bulk using the ResourceManager
    *
    * @method loadResources
    * @param {Function} on_complete called when the load of all the resources is complete
    */
    loadResources(on_complete: () => void);    

    /**
    * Adds a resource that must be loaded when the scene is loaded
    *
    * @method addPreloadResource
    * @param {String} fullpath the name of the resource
    */    
    addPreloadResource(fullpath:string);

    /**
    * Remove a resource from the list of resources to preload
    *
    * @method removePreloadResource
    * @param {String} fullpath the name of the resource
    */ 
    removePreloadResource(fullpath:string);  
    
    /**
    * start the scene (triggers an "start" event)
    * Fired when the scene is starting to play
	* 	LEvent.trigger(this,"start",this);
    * @method start
    * @param {Number} dt delta time
    */
    start();

    /**
    * pauses the scene (triggers an "pause" event)
    *
    * @method pause
    */
    pause();

    /**
    * unpauses the scene (triggers an "unpause" event)
    *
    * @method unpause
    */
    unpause();

    /**
    * stop the scene (triggers an "finish" event)
    *
    * @method finish
    */
    finish();

    /**
    * renders the scene using the assigned renderer
    *
    * @method render
    */  
    render(options:object);  

    /**
    * This methods crawls the whole tree and collects all the useful info (cameras, lights, render instances, colliders, etc)
    * Mostly rendering stuff but also some collision info.
    * TO DO: refactor this so it doesnt redo the same task in every frame, only if changes are made
    * @method collectData
    */    
    collectData();

    //instead of recollect everything, we can reuse the info from previous frame, but objects need to be updated
    //WIP: NOT USED YET
    updateCollectedData();

    update();

    /**
    * triggers an event to all nodes in the scene
    * this is slow if the scene has too many nodes, thats why we use bindings
    *
    * @method triggerInNodes
    * @param {String} event_type event type name
    * @param {Object} data data to send associated to the event
    */    
    triggerInNodes(event_type:string,data:object);

    /**
    * generate a unique node name given a prefix
    *
    * @method generateUniqueNodeName
    * @param {String} prefix the prefix, if not given then "node" is used
    * @return {String} a node name that it is not in the scene
    */    
    generateUniqueNodeName(prefix:string):string;

    /**
    * Marks that this scene must be rendered again
    *
    * @method requestFrame
    */ 
    requestFrame();
    
    /**
    * returns current scene time (remember that scene time remains freezed if the scene is not playing)
    *
    * @method getTime
    * @return {Number} scene time in seconds
    */
    getTime():number;

    //This is ugly but sometimes if scripts fail there is a change the could get hooked to the scene forever
    //so this way we remove any event that belongs to a component thats doesnt belong to this scene tree
    purgeResidualEvents();
    
    /**
    * returns an array with the name of all the layers given a layers mask
    *
    * @method getLayerNames
    * @param {Number} layers a number with the enabled layers in bit mask format, if ommited all layers are returned
    * @return {Array} array of strings with the layer names
    */
    getLayerNames(layers:number):string[];

    /**
    * returns an array with all the components in the scene and scenenodes that matches this class
    *
    * @method findNodeComponents
    * @param {String||Component} type the type of the components to search (could be a string with the name or the class itself)
    * @return {Array} array with the components found
    */
    findNodeComponents(type:string|object):object[];

    /**
    * Allows to instantiate a prefab from the fullpath of the resource
    *
    * @method instantiate
    * @param {String} prefab_url the filename to the resource containing the prefab
    * @param {vec3} position where to instantiate
    * @param {quat} rotation the orientation
    * @param {SceneNode} parent [optional] if no parent then scene.root will be used
    * @return {SceneNode} the resulting prefab node
    */    
    instantiate(prefab_url:string, position:any, rotation:any, parent:SceneNode):SceneNode;

    /**
    * returns a pack containing all the scene and resources, used to save a scene to harddrive
    *
    * @method toPack
    * @param {String} fullpath a given fullpath name, it will be assigned to the scene with the appropiate extension
    * @param {Array} resources [optional] array with all the resources to add, if no array is given it will get the active resources in this scene
    * @return {LS.Pack} the pack
    */
    toPack(fullpath:string, resources?:any[]): Pack;

    //WIP: this is in case we have static nodes in the scene
    updateStaticObjects();

    //tells to all the components, nodes, materials, etc, that one resource has changed its name so they can update it inside
    sendResourceRenamedEvent(old_name:string, new_name:string, resource:any);

    /**
    * Creates and returns an scene animation track
    *
    * @method createAnimation
    * @return {LS.Animation} the animation track
    */
    createAnimation():Animation;
}

//TODO Needs to be defined
/**
* An Animation is a resource that contains samples of properties over time, similar to animation curves
* Values could be associated to an specific node.
* Data is contained in tracks
*
* @class Animation
* @namespace LS
* @constructor
*/
declare class Animation {
    constructor(configure:boolean);

    name:string;
    tackes: object;
}

//TODO need to be defined
declare class Resource {

}

declare class Pack {
    version:number;
    resource_names:string[];
    _data:object;
    _resources_data:object;
    private _original_data:object;
    bindata:object;



    /**
    * configure the pack from an unpacked WBin
    * @method configure
    * @param {Object} data an unpacked WBIN (object with every chunk)
    **/
    configure(data:object);

    fromBinary(data:object);

    //given a list of resources that come from the Pack (usually a wbin) it extracts, process and register them 
    processResources();

    setResources(resource_names:string, mark_them:boolean );

    //adds to every resource in this pack info about where it came from (the pack)
    setResourcesLink(value:object);

    //adds a new resource (or array of resources) to this pack
    addResources(resource_names, mark_them);

    /**
    * to create a WBin containing all the resource and metadata
    * @method Pack.createWBin
    * @param {String} fullpath for the pack
    * @param {Array} resource_names array with the names of all the resources to store
    * @param {Object} metadata [optional] extra data to store
    * @param {boolean} mark_them [optional] marks all the resources as if they come from a pack
    * @return object containing the pack data ready to be converted to WBin
    **/
    createPack(filename:string, resource_names:string[], extra_data?:object, mark_them?:boolean):Uint8Array;

    //Given a bunch of resource names it creates a WBin with all inside
    packResources(resource_names:string[], base_object?:object);

    //just tells the resources where they come from, we cannot do that before because we didnt have the name of the pack
    flagResources();

    getDataToStore():Uint8Array; 

}

/**
* The SceneNode class represents and object in the scene
* Is the base class for all objects in the scene as meshes, lights, cameras, and so
*
* @class SceneNode
* @param {String} name the name for this node (otherwise a random one is computed)
* @constructor
*/
declare class SceneNode {
    constructor(name?: string);

    //Generic identifying info
    private _name: string;
    //public get name():string;
    name:string;
    fullname:string;
    uid:string;
    visible:boolean;
    is_static:boolean;
    material:any;
    prefab:any;
    classList: object;
    className: string;


    private _uid: string;
    private _classList: object;
    private layers: number; //32 bits for layers (force to int)
    private node_type: string; //used to store a string defining the node info

    //more generic info
    private _prefab: any;
    private _material: any;

    //from Componentcontainer
    private _components: any[]; //used for logic actions
    private _missing_components: any; //used to store state of component that couldnt be created

    //from CompositePattern
    private _parentNode: any;
    private _children: any;
    private _in_tree: any;

    flags: object;

    init(keep_components: boolean, keep_info: boolean);

    clear();

    setName(new_name:string);

    /**
    * Destroys this node
    * @method destroy
    * @param {number} time [optional] time in seconds to wait till destroying the node
    **/
    destroy(time?: number);

    /**
    * Returns the locator string of this node
    * @method getLocator
    * @param {string} property_name [optional] you can pass the name of a property in this node to get the locator of that one
    * @return {String} the locator string of this node
    **/
    getLocator(property_name:string):string;

    /**
    * Returns and object with info about a property given a locator
    * @method getPropertyInfo
    * @param {string} locator
    * @return {Object} object with { node, target, name, value and type }
    **/
    getPropertyInfo(locator:string):object;

    /**
    * Returns and object with info about a property given a locator in path format
    * @method getPropertyInfoFromPath
    * @param {Array} path a locator in path format (split by /)
    * @return {Object} object with { node, target, name, value and type }
    **/
    getPropertyInfoFromPath(path:string[]):object;

    /**
    * Returns the value of a property given a locator in string format
    * @method getPropertyValue
    * @param {String} locaator
    * @return {*} the value of that property
    **/
    getPropertyValue(locator:string):any;

    /**
    * Returns the value of a property given a locator in path format
    * @method getPropertyValueFromPath
    * @param {Array} locator in path format (array)
    * @return {*} the value of that property
    **/
    getPropertyValueFromPath(path:string[]): any;

    /**
    * assigns a value to a property given the locator for that property
    * @method setPropertyValue
    * @param {String} locator
    * @param {*} value
    **/
    setPropertyValue(locator:string,value:any);


    /**
    * given a locator in path mode (array) and a value, it searches for the corresponding value and applies it
    * @method setPropertyValueFromPath
    * @param {Array} path
    * @param {*} value
    * @param {Number} [optional] offset used to skip the firsst positions in the array
    **/
    setPropertyValueFromPath(path:string[],value:any,offset?:number);

    /**
    * Returns all the resources used by this node and its components (you can include the resources from the children too)
    * @method getResources
    * @param {Object} res object where to store the resources used (in "res_name":LS.TYPE format)
    * @param {Boolean} include_children if you want to add also the resources used by the children nodes
    * @return {Object} the same object passed is returned 
    **/
    getResources(res:object, include_children:boolean):object;

    getTransform();

    //Helpers

    getMesh(use_lod_mesh:boolean):any;
    
    //Light component
    getLight():any;

    //Camera component
    getCamera():any;

    /**
    * Simple way to assign a mesh to a node, it created a MeshRenderer component or reuses and existing one and assigns the mesh
    * @method setMesh
    * @param {string} mesh_name the name of the mesh (path to the file)
    * @param {Number} submesh_id if you want to assign a submesh
    **/     
    setMesh(mesh_name:string, submesh_id:number);

    loadAndSetMesh(mesh_filename:string, options?:object);

    getMaterial():object;

    /**
    * Apply prefab info (skipping the root components) to node, so all children will be removed and components lost and overwritten
    * It is called from prefab.applyToNodes when a prefab is loaded in memory
    * @method reloadFromPrefab
    **/
    reloadFromPrefab();

    /**
    * Assigns this node to one layer
    * @method setLayer
    * @param {number|String} the index of the layer or the name (according to scene.layer_names)
    * @param {boolean} value 
    */
    setLayer(num_or_name:number | string, value:boolean);

    /**
    * checks if this node is in the given layer
    * @method isInLayer
    * @param {number|String} index of layer or name according to scene.layer_names
    * @return {boolean} true if belongs to this layer
    */
    isInLayer(num_or_name:number|string):boolean;

    getLayers():object[];

    /**
    * Returns the root node of the prefab incase it is inside a prefab, otherwise null
    * @method insidePrefab
    * @return {Object} returns the node where the prefab starts
    */
    insidePrefab():object;

    /**
    * remember clones this node and returns the new copy (you need to add it to the scene to see it)
    * @method clone
    * @return {Object} returns a cloned version of this node
    */
    clone():object;

    /**
    * Configure this node from an object containing the info
    * @method configure
    * @param {Object} info the object with all the info (comes from the serialize method)
    */      
    configure(info:object);
    
    //adds components according to a mesh
    addMeshComponents(mesh_id:object, extra_info: object);

    /**
    * Serializes this node by creating an object with all the info
    * it contains info about the components too
    * @method serialize
    * @param {bool} ignore_prefab serializing wont returns children if it is a prefab, if you set this to ignore_prefab it will return all the info
    * @return {Object} returns the object with the info
    */      
    serialize(ignore_prefab:boolean):object;  

    //used to recompute matrix so when parenting one node it doesnt lose its global transformation
    _onChildAdded( child_node: object, recompute_transform:boolean );

    _onChangeParent( future_parent: object, recompute_transform:boolean);

    _onChildRemoved ( node: SceneNode, recompute_transform:boolean, remove_components:boolean );

    //Computes the bounding box from the render instance of this node
    //doesnt take into account children
    getBoundingBox ( bbox:object, only_instances:boolean ): object;
}

/*~ If your library has properties exposed on a global variable,
 *~ place them here.
 *~ You should also place types (interfaces and type alias) here.
 */
declare namespace LS {
    

    //vars used for uuid genereration
	const _last_uid: number;
	const _uid_prefix: string; //WARNING: must be one character long
	let debug: boolean; //enable to see verbose output
	let allow_static: boolean; //used to disable static instances in the editor

	const Classes: object; //maps classes name like "Prefab" or "Animation" to its namespace "LS.Prefab". Used in Formats and ResourceManager when reading classnames from JSONs or WBin.
	const ResourceClasses: object; //classes that can contain a resource of the system
    const Globals: object; //global scope to share info among scripts
    
    let SceneTree: SceneTree;
    let SceneNode: SceneNode;
    let Animation: Animation;
    let Resource: Resource;
    let Pack: Pack;

    //Interpolation methods
    const NONE:number;
    const LINEAR:number;
    const TRIGONOMETRIC:number;
    const BEZIER:number;
    const SPLINE:number;
    
	/**
	* Generates a UUID based in the user-agent, time, random and sequencial number. Used for Nodes and Components.
	* @method generateUId
	* @return {string} uuid
	*/
    function generateUId(prefix?:string, suffix?:string);

	/**
	* validates name string to ensure there is no forbidden characters
	* valid characters are letters, numbers, spaces, dash, underscore and dot
	* @method validateName
	* @param {string} name
	* @return {boolean} 
	*/
    function validateName(name:string):boolean;

    const valid_property_types: string[];
    function validatePropertyType(v:any):boolean;

    let _catch_exceptions:boolean;
    const Components: object;

    /**
	* Register a component (or several) so it is listed when searching for new components to attach
	*
	* @method registerComponent
	* @param {Component} component component class to register
	* @param {String} old_classname [optional] the name of the component that this class replaces (in case you are renaming it)
	*/
    function registerComponent(component:object, old_classname:string)

    /**
	* Unregisters a component from the system (although existing instances are kept in the scene)
	*
	* @method unregisterComponent
	* @param {String} name the name of the component to unregister
    */
    function unregisterComponent(name:string);

    /**
	* Tells you if one class is a registered component class
	*
	* @method isClassComponent
	* @param {ComponentClass} comp component class to evaluate
	* @return {boolean} true if the component class is registered
    */
    function isClassComponent(comp_class:object):boolean;

    	/**
	* Replaces all components of one class in the scene with components of another class
	*
	* @method replaceComponentClass
	* @param {SceneTree} scene where to apply the replace
	* @param {String} old_class_name name of the class to be replaced
	* @param {String} new_class_name name of the class that will be used instead
	* @return {Number} the number of components replaced
	*/
	function replaceComponentClass(scene:object,old_class_name:string, new_class_name:string): number;

    /**
	* Register a resource class so we know which classes could be use as resources
	*
	* @method registerResourceClass
	* @param {ComponentClass} c component class to register
    */
    function registerResourceClass(c:any);

    /**
	* Is a wrapper for callbacks that throws an LS "code_error" in case something goes wrong (needed to catch the error from the system)
	* @method safeCall
	* @param {function} callback
	* @param {array} params
	* @param {object} instance
    */
    function safeCall(callback: () => any, params: any[], instance:object);

    /**
	* Is a wrapper for setTimeout that throws an LS "code_error" in case something goes wrong (needed to catch the error from the system)
	* @method setTimeout
	* @param {function} callback
	* @param {number} time in ms
	* @param {number} timer_id
	*/
	function setTimeout(callback: () => any, time:number);
    
	/**
	* Is a wrapper for setInterval that throws an LS "code_error" in case something goes wrong (needed to catch the error from the system)
	* @method setInterval
	* @param {function} callback
	* @param {number} time in ms
	* @param {number} timer_id
	*/
    function setInterval(callback: () => any, time: number);
    
    /**
	* copy the properties (methods and properties) of origin class into target class
	* @method extendClass
	* @param {Class} target
	* @param {Class} origin
	*/
	function extendClass( target:object, origin:object );

	/**
	* Clones an object (no matter where the object came from)
	* - It skip attributes starting with "_" or "jQuery" or functions
	* - it tryes to see which is the best copy to perform
	* - to the rest it applies JSON.parse( JSON.stringify ( obj ) )
	* - use it carefully
	* @method cloneObject
	* @param {Object} object the object to clone
	* @param {Object} target=null optional, the destination object
	* @return {Object} returns the cloned object (target if it is specified)
	*/
	function cloneObject( object: object, target: object, recursive?: boolean, only_existing?: boolean ): object

	/**
	* Clears all the uids inside this object and children (it also works with serialized object)
	* @method clearUIds
	* @param {Object} root could be a node or an object from a node serialization
	*/
	function clearUIds(root: object);

	/**
	* Returns an object class name (uses the constructor toString)
	* @method getObjectClassName
	* @param {Object} the object to see the class name
	* @return {String} returns the string with the name
	*/
    function getObjectClassName(obj:object):string;
    
    /**
	* Returns an string with the class name
	* @method getClassName
	* @param {Object} class object
	* @return {String} returns the string with the name
	*/
    function getClassName(obj:object):string
    
    /**
	* Returns the public properties of one object and the type (not the values)
	* @method getObjectProperties
	* @param {Object} object
	* @return {Object} returns object with attribute name and its type
	*/
	//TODO: merge this with the locator stuff
	function getObjectProperties( object:object ): object;

    function setObjectProperty( obj:object, name:string, value:any );

    let MaterialClasses: object;

    /**
	* Register a Material class so it is listed when searching for new materials to attach
	*
	* @method registerMaterialClass
	* @param {ComponentClass} comp component class to register
	*/
    function registerMaterialClass( material_class: object );
}