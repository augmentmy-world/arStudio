var AboutModule = {
	name: "about",

	init: function()
	{
		LiteGUI.menubar.add("Help/About", { callback: function() {

			var dialog = new LiteGUI.Dialog("intro_dialog",{ width: 400, height: 400, closable: true });
			dialog.content.innerHTML = ""+
					//	"<p class='center'><img height='150' target='_blank' src='http://webglstudio.org/images/logo.png'/></p>" +
				"<img src='imgs/realmax200.png' style='float:left;'>"+
				"<p class='header center'>Welcome to Realmax AR Editor!</p>" +
				"<p class='msg center'>Bringing AR to the Web.</p><br><br><br>" +
				"<p class='msg center'>Create your own AR scenes to be triggered and played back using the Realmax AR system.</p>";


/*			var dialog = new LiteGUI.Dialog({ title: "About Realmax AR Editor", closable: true, width: 400, height: 240} );
			dialog.content.style.fontSize = "2em";
			dialog.content.style.backgroundColor = "black";
			dialog.content.innerHTML = "<p>Realmax AR Editor v0.1</p><p>(c) Realmax 2017</p><p>Bringing AR to the web</p>";
//cwx		dialog.content.innerHTML = "<p>Realmax AR Editor v0.1"+CORE.config.version+"</p><p>Created by <a href='http://blog.tamats.com' target='_blank'>Javi Agenjo</a></p><p><a href='http://gti.upf.edu/' target='_blank'>GTI department</a> of <a href='http://www.upf.edu' target='_blank'>Universitat Pompeu Fabra</a></p><p><a target='_blank' href='https://github.com/jagenjo/webglstudio.js'>Fork me in Github</a></a>";
*/
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