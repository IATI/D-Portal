
ctrack.setup_html=function(opts)
{

	ctrack.div={};

	ctrack.div.master=$(opts.div);
	ctrack.div.main=$("<div class=\"ctrack_main\"></div>");
	
	ctrack.div.master.empty();
	ctrack.div.master.append(ctrack.div.main);

}

