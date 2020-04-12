var AboutModule = {
	name: "about",

	init: function()
	{
		LiteGUI.menubar.add("Help/About", { callback: function() {

			var dialog = new LiteGUI.Dialog("intro_dialog",{ width: 400, height: 400, closable: true });
			dialog.content.innerHTML = ""+
				"<img src='imgs/icon200.png' style='float:left;'>"+
				"<p class='header center'>Welcome to WebAR studio!</p>" +
				"<p class='msg center'>The editor for webAR</p>" +
        "<p class='msg center'>Design and develop your own AR scenes and share them with your audience.</p><br><br>" + 
        "<p class='msg center'>The only open-source system that supports pictures as targets</p>";

			dialog.root.addEventListener("click",close_this);
			dialog.addButton("Close");
			dialog.show();
			dialog.center();
			dialog.fadeIn();

			function close_this(){
				dialog.close();
			}

		}});
	}
}

CORE.registerModule( AboutModule );