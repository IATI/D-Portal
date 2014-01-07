

ctrack.setup_html=function()
{

	ctrack.div={};

	ctrack.div.master=$(ctrack.args.master);
	ctrack.div.main=$("<div class=\"ctrack_main\"></div>");
	
	ctrack.div.master.empty();
	ctrack.div.master.append(ctrack.div.main);
	
//	ctrack.div.main.html( ctrack.plate.chunk("chunk1",{test:"TESTING"})  );

	ctrack.div.main.html( ctrack.plate.chunk("loading",{})  );
	
//	ctrack.fetch({});

	var d={};
	
	var chunk=function(n){
		d[n]=ctrack.plate.chunk(n,d);
	}
	
	chunk("ctend");
	chunk("ctplan");
	chunk("ctabout");
	chunk("ctlogo");
	chunk("ctembed");
	
	chunk("ctactive");
	chunk("ctactivities");
	chunk("ctpublishers");
	chunk("ctbox2");
	chunk("ctbox2table");
	chunk("ctbox2more");
	chunk("ctbox3");
	chunk("ctbox3table");
	chunk("ctbox2more");
	chunk("ctnearhead");
	chunk("ctneartable");
	chunk("ctnearmore");
	chunk("ctfootboxes");

	chunk("ctnav");
	chunk("cthead");
	chunk("ctbox1");
	chunk("ctbox1table");
	chunk("ctbox1more");
	chunk("ctboxes");
	chunk("ctnear");
	chunk("ctfooter");
	chunk("ctfind");
	chunk("bodytest");
 
	ctrack.div.main.html( d.bodytest );
 


}

