
ctrack.setup_html=function()
{

	ctrack.div={};

	ctrack.div.master=$(ctrack.args.master);
	ctrack.div.main=$("<div class=\"ctrack_main\"></div>");
	
	ctrack.div.master.empty();
	ctrack.div.master.append(ctrack.div.main);
	
	ctrack.div.main.html( ctrack.plate.chunk("chunk1",{test2:"OKOKOK"})  );

}

