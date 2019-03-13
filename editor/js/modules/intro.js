var IntroModule = {
	name: "intro",

	preferences: {
		show_intro_dialog: true
	},

	init: function()
	{
		//if( this.preferences.show_intro_dialog !== false || true==true)
			this.showIntroDialog();
	},

	showIntroDialog: function()
	{
		var dialog = new LiteGUI.Dialog("intro_dialog",{ width: 400, height: 400, closable: true });
		dialog.content.innerHTML = ""+
		//	"<p class='center'><img height='150' target='_blank' src='http://webglstudio.org/images/logo.png'/></p>" +
			"<img src='imgs/realmax200.png' style='float:left;'>"+
			"<p class='header center'>Welcome to Realmax AR Editor!</p>" +
			"<p class='msg center'>Bringing AR to the Web.</p><br><br>" +
			"<p class='msg center'>Create your own AR scenes to be triggered and played back using the Realmax AR system.</p>";

		dialog.on_close = function()
		{
			IntroModule.preferences.show_intro_dialog = false;	// only show once... cw removed this!
		}
	
		dialog.addButton("Close");
		dialog.show();
		dialog.center();
		dialog.fadeIn();

		var links = dialog.content.querySelectorAll("a");
		for(var i = 0; i < links.length; i++)
			links[i].addEventListener("click",prevent_this, true);
		dialog.root.addEventListener("click",close_this);

		function prevent_this(e){
			e.stopImmediatePropagation();
			e.stopPropagation();
			return false;
		}

		function close_this(){
			dialog.close();
		}
	}
}

CORE.registerModule( IntroModule );