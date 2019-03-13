var LangModule = {
	name: "language",
	lang: "en",

	init: function()
	{
		//language options
		/*LiteGUI.addCSS("\
			#lang-toggle {position: fixed; top: 3px; right: 200px; z-index: 99} \
			#lang-toggle .ico-flag-usa {background-image: url(imgs/sprite.png);background-position: -39px -203px;width: 35px;height: 25px; display: inline-block; vertical-align: middle; font-size: 0;} \
			#lang-toggle .ico-flag-china{background-image:url(imgs/sprite.png);background-position:0 -203px;width:35px;height:25px;display:inline-block;vertical-align:middle;font-size:0;} \
			#lang-toggle .nav-langs {float: right;} \
			#lang-toggle .nav-langs li {padding-left:5px; padding-right:5px; min-width: 45px} \
			#lang-toggle .nav-langs span {display: none;} \
		");*/
		
		var lang_bar = document.createElement("div");
		lang_bar.id = "lang-toggle";
		lang_bar.className = "big-buttons";
		lang_bar.innerHTML = "<nav class='nav-langs'>" + 
				"<ul><li class='current'><a id='opt_en' href='?lang=en'><i class='ico-flag-usa'></i><span>English</span></a></li>" +
				"<li class=''><a id='opt_zh' href='?lang=zh'><i class='ico-flag-china'></i><span>Chinese</span></a></li></ul>" +
				"</nav>";
		this.opt_en = lang_bar.querySelector("#opt_en");
		this.opt_zh = lang_bar.querySelector("#opt_zh");
		this.opt_en.addEventListener( "click", this.toggle.bind(this,"en"));
		this.opt_zh.addEventListener( "click", this.toggle.bind(this,"zh"));

		setTimeout( function() {
			document.getElementById("mainmenubar").appendChild( lang_bar );
		}, 1000);

	},

	//toggle language
	toggle: function(language)
	{
		//console.log("toggle language to: " + language);
		if(language)
			RW_Cookies.set('locale', language);
		else
			RW_Cookies.set('locale', this.lang);

		return false;
	}
}

CORE.registerModule( LangModule );