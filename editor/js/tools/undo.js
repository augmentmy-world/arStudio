var undoTool = {
	name: "undo",
	description: "Undo Edit",
	section: "edit",
	icon: "skins/" + CORE.config.skin + "/imgs/mid-icon-undo.png",

	_action: true,

	onRegister: function() {
	},

	mousedown: function(e) {
	},

	mousemove: function(e) {
	},

	mouseup: function(e) {
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

	onRegister: function() {
	},

	mousedown: function(e) {
	},

	mousemove: function(e) {
	},

	mouseup: function(e) {
		UndoModule.doRedo();
		return false;		
	}
};
ToolsModule.registerTool( redoTool );


