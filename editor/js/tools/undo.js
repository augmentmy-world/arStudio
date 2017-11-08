var undoTool = {
	name: "undo",
	description: "Undo Edit",
	section: "edit",
	icon: "skins/" + CORE.config.skin + "/imgs/mid-icon-undo.png",

	_action: true,
	_stateful: 'no', // prevent the tool to be in an 'enabled' state

	onRegister: function() {
	},

	mousedown: function(e) {
	},

	mousemove: function(e) {
	},

	mouseup: function(e) {	
	},

	onClick: function() {
		UndoModule.doUndo();
		return false;		
	}
};
ToolsModule.registerTool( undoTool );

//redo
var redoTool = {
	name: "redo",
	description: "Redo Edit",
	section: "edit",
	icon: "skins/" + CORE.config.skin + "/imgs/mid-icon-redo.png",

	_action: true,
	_stateful: 'no', 

	onRegister: function() {
	},

	mousedown: function(e) {
	},

	mousemove: function(e) {
	},

	mouseup: function(e) {		
	},

	onClick: function() {
		UndoModule.doRedo();
		return false;	
	}	

};
ToolsModule.registerTool( redoTool );


