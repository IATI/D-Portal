// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var savi=exports;


var iati_codes=require("../../dstore/json/iati_codes.json")


savi.fixup = function(args){

args=args || {};	
var inside=args.inside || "";
//var prelink=args.link || "http://datastore.iatistandard.org/api/1/access/activity.xml?iati-identifier=";
var prelink=args.link || "http://d-portal.org/q.xml?aid=";
var postlink=args.link_post || "";

var commafy=function(s) { return (""+parseFloat(s)).replace(/(^|[^\w.])(\d{4,})/g, function($0, $1, $2) {
        return $1 + $2.replace(/\d(?=(?:\d\d\d)+(?!\d))/g, "$&,"); }) };

// Adjust some tags using js

var wrap_link=function(it,url,cc)
{
	it.wrap("<a href=\""+url+"\" class=\""+cc+"\" target=\"_blank\" ></a>");
}

var wrapInner_link=function(it,url,cc)
{
	it.wrapInner("<a href=\""+url+"\" class=\""+cc+"\" target=\"_blank\" ></a>");
}

$(inside+"value").each(function(i){var it=$(this);
	var c=it.attr("currency");
	if(!c) { c=it.parents("iati-activity").attr("default-currency"); } // use default?
	if(c)
	{
		c=c.toUpperCase();
		it.html( commafy( it.html() ) +"<span>"+c+"</span>" );
	}
});

$(inside+"iati-activity").each(function(i){var it=$(this);
	var needed=["title","recipient-country","participating-org","reporting-org","description","activity-status"];
	needed.forEach(function(n){
		if( it.children(n).length==0 )
		{
			it.append("<"+n+" />"); // just add a blank tag
		}
	});

	var ad=it.children("activity-date");
	var got_start=false;
	var got_end=false;
	ad.each(function(i,a){
		var t=$(a).attr("type");
		if(t=="start-actual")
		{
			got_start=true;
		}
		if(t=="end-actual")
		{
			got_end=true;
		}
	});

	if(!got_start){ it.append("<activity-date type=\"start-actual\" />"); }
	if(!got_end)  { it.append("<activity-date type=\"end-actual\" />"); }
	
});

$(inside+"participating-org").each(function(i){var it=$(this);
	var c=it.attr("role");
	if(c)
	{
		c=c.toLowerCase();
		it.attr("role",c)
	}
});

$(inside+"transaction").each(function(i){var it=$(this);
	var needed=["transaction-date","transaction-type","description","provider-org","receiver-org","value"];
	needed.forEach(function(n){
		if( it.children(n).length==0 )
		{
			it.append("<"+n+" />"); // just add a blank tag
		}
	});
});

$(inside+"budget").each(function(i){var it=$(this);
	var needed=["period-start","period-end","value"];
	needed.forEach(function(n){
		if( it.children(n).length==0 )
		{
			it.append("<"+n+" />"); // just add a blank tag
		}
	});

});

$(inside+"activity-date,transaction-date,period-start,period-end").each(function(i){var it=$(this);
	it.html( it.attr("iso-date") );
});

$(inside+"related-activity").each(function(i){var it=$(this);
	if( it.html().length<4 )
	{
		it.html(it.attr("ref"));
	}
});


$(inside+"reporting-org").each(function(i){var it=$(this);
	var t=it.attr("ref");
	t=iati_codes.publisher_names[t];
	if(t)
	{
		it.html(t);
	}
});

$(inside+"activity-status").each(function(i){var it=$(this);
	var tc=it.attr("code");
	tc=iati_codes.activity_status[tc] || tc;
	if(tc)
	{
		it.html(tc);
	}
});

$(inside+"sector").each(function(i){var it=$(this);

	var tp=it.attr("percentage") || 100;
	var tc=it.attr("code");

	if(!it.attr("vocabulary")) { it.attr("vocabulary","DAC"); }

	tc=iati_codes.sector[tc] || tc;	
	if(tc)
	{
		it.html("<span>"+tc+"</span><span>"+tp+"%</span>");
	}

});

$(inside+"transaction-type").each(function(i){var it=$(this);

	var tc=it.attr("code");
	if(tc)
	{
		tc=tc.toUpperCase();
		tc=iati_codes.transaction_type[tc] || tc;
		if(tc)
		{
			it.html(tc);
		}
	}
});

$(inside+"recipient-country").each(function(i){var it=$(this);

	var tp=it.attr("percentage") || 100;
	var tc=it.attr("code")
	if(tc)
	{
		tc=tc.toUpperCase();
		tc=iati_codes.country[tc] || tc;
		if(tc)
		{
			it.html("<span>"+tc+"</span><span>"+tp+"%</span>");
		}
	}

});

$(inside+"budget").each(function(i){var it=$(this);
	
	var sortlist=[
		"period-start",
		"period-end",
		"value",
		0];
	var sortweight={}; for(var i=0; i<sortlist.length; i++) { sortweight[ sortlist[i] ]=i+1; }

	var aa=it.children();
	aa.sort(function(a,b){
		var ret=0;
		var aw=sortweight[a.tagName.toLowerCase()] || sortweight[0];
		var bw=sortweight[b.tagName.toLowerCase()] || sortweight[0];	
		if(ret===0)
		{
			if(aw > bw ) { ret= 1; }
			if(aw < bw ) { ret=-1; }
		}
		if(ret===0)
		{
			if(a.tagName.toLowerCase() > b.tagName.toLowerCase() ) { ret= 1; }
			if(a.tagName.toLowerCase() < b.tagName.toLowerCase() ) { ret=-1; }
		}
		return ret;
	});
	it.append(aa);

});

$(inside+"transaction").each(function(i){var it=$(this);
	
	var sortlist=[
		"transaction-date",
		"transaction-type",
		"description",
		"provider-org",
		"receiver-org",
		"value",
		0];
	var sortweight={}; for(var i=0; i<sortlist.length; i++) { sortweight[ sortlist[i] ]=i+1; }

	var aa=it.children();	
	aa.sort(function(a,b){
		var ret=0;
		var aw=sortweight[a.tagName.toLowerCase()] || sortweight[0];
		var bw=sortweight[b.tagName.toLowerCase()] || sortweight[0];	
		if(ret===0)
		{
			if(aw > bw ) { ret= 1; }
			if(aw < bw ) { ret=-1; }
		}
		if(ret===0)
		{
			if(a.tagName.toLowerCase() > b.tagName.toLowerCase() ) { ret= 1; }
			if(a.tagName.toLowerCase() < b.tagName.toLowerCase() ) { ret=-1; }
		}
		return ret;
	});
	it.append(aa);

});

var sorted=0;
$(inside+"iati-activity").each(function(i){var it=$(this);
sorted++;
	var sortlist=[
		"title",
		"iati-identifier",
		"recipient-country",
		"activity-date",
		"participating-org",
		"reporting-org",
		"description",
		"sector",
		"budget",
		"transaction",
		"contact-info",
		"activity-website",
		"activity-status",
		"document-link",
		"related-activity",
	0
	];
	var sortweight={}; for(var i=0; i<sortlist.length; i++) { sortweight[ sortlist[i] ]=i+1; }

	var aa=it.children();	
	aa.sort(function(a,b){
		var ret=0;
		
		var aname=a.tagName.toLowerCase();
		var bname=b.tagName.toLowerCase();
		
		var aw=sortweight[aname] || sortweight[0];
		var bw=sortweight[bname] || sortweight[0];

		if(ret===0)
		{
			if(aw > bw ) { ret= 1; }
			if(aw < bw ) { ret=-1; }
		}

		if(ret===0)
		{
			if(aname > bname ) { ret= 1; }
			if(aname < bname ) { ret=-1; }
		}
		
		if( (ret===0) && (aname=="recipient-country") )
		{
			var at=Number(a.getAttribute("percentage"));
			var bt=Number(b.getAttribute("percentage"));
			if(at<bt) { ret=1; } else if(at>bt) { ret=-1; }
		}
		
		if( (ret===0) && (aname=="activity-date") )
		{
			var at=a.getAttribute("type");
			var bt=b.getAttribute("type");
			if(at<bt) { ret=1; } else if(at>bt) { ret=-1; }
		}
		
		if( (ret===0) && (aname=="sector") )
		{
			var at=a.getAttribute("vocabulary");
			var bt=b.getAttribute("vocabulary");
			if(at>bt) { ret=1; } else if(at<bt) { ret=-1; }
		}

		if( (ret===0) && (aname=="sector") )
		{
			var at=Number(a.getAttribute("percentage"));
			var bt=Number(b.getAttribute("percentage"));
			if(at<bt) { ret=1; } else if(at>bt) { ret=-1; }
		}

		if( (ret===0) && (aname=="budget") )
		{
			var at=$(a).children("period-start").first().attr("iso-date");
			var bt=$(b).children("period-start").first().attr("iso-date");
			if(at>bt) { ret=1; } else if(at<bt) { ret=-1; }
		}

		if( (ret===0) && (aname=="transaction") )
		{
			var at=$(a).children("transaction-date").first().attr("iso-date");
			var bt=$(b).children("transaction-date").first().attr("iso-date");
			if(at>bt) { ret=1; } else if(at<bt) { ret=-1; }
		}

		if( (ret===0) && (aname=="transaction") )
		{
			var order={"C":4,"D":3,"IR":2,"E":1}; // order by transaction types
			var at=$(a).children("transaction-type").first().attr("code");
			var bt=$(b).children("transaction-type").first().attr("code");
			at=order[at] || 0;
			bt=order[bt] || 0;
			if(at<bt) { ret=1; } else if(at>bt) { ret=-1; }
		}

		if( (ret===0) && (aname=="related-activity") )
		{
			var at=$(a).attr("type");
			var bt=$(b).attr("type");
			if(at>bt) { ret=1; } else if(at<bt) { ret=-1; }
		}
		
		if( (ret===0) && (aname==bname) )
		{
			var at=$(a).attr("xml:lang");
			var bt=$(b).attr("xml:lang");
			if(at&&bt)
			{
				if(at>bt) { ret=1; } else if(at<bt) { ret=-1; }
			}
		}
		
		return ret;
	});
	it.append(aa);

	for(var i=0; i<sortlist.length-1; i++) { var v=sortlist[i];
		it.children( v ).wrapAll( "<span class='span_"+v+"' />");
	}

});
//console.log("sorted "+sorted+" acts");

$(inside+"document-link").each(function(i){var it=$(this);
	wrap_link(it,it.attr("url"),"a_"+this.tagName.toLowerCase());
});

$(inside+"activity-website").each(function(i){var it=$(this);
	wrap_link(it,it.html(),"a_"+this.tagName.toLowerCase());
});

$(inside+"iati-identifier").each(function(i){var it=$(this);
	var slug=it.parent().parent().attr("dstore:slug"); // do we know where this came from?
	var id=encodeURIComponent(it.text().trim());
	wrap_link(it,prelink+id+postlink,"a_"+this.tagName.toLowerCase());
	it.append($("<a class='a_xml_"+this.tagName.toLowerCase()+"' href='http://datastore.iatistandard.org/api/1/access/activity.xml?iati-identifier="+id+"'>xml</a>"));
	if(slug)
	{
		it.append($("<a class='a_slug' href='http://iatiregistry.org/dataset/"+slug+"'>dataset</a>"));
	}
});

$(inside+"provider-org[provider-activity-id]").each(function(i){var it=$(this);
	var id=it.attr("receiver-activity-id");
	if(id)
	{
		wrapInner_link(it,prelink+id+postlink,"a_"+this.tagName.toLowerCase());
	}
});

$(inside+"receiver-org[receiver-activity-id]").each(function(i){var it=$(this);
	var id=it.attr("receiver-activity-id");
	if(id)
	{
		wrapInner_link(it,prelink+id+postlink,"a_"+this.tagName.toLowerCase());
	}
});

$(inside+"related-activity").each(function(i){var it=$(this);
	var id=it.attr("ref");
	if(id)
	{
		wrap_link(it,prelink+id+postlink,"a_"+this.tagName.toLowerCase());
	}
});

$(inside+"iati-activity").each(function(i){var it=$(this);

	var base=it.children(".span_sector");
	var aa=base.children("sector[vocabulary=\"DAC\"]");
	if(aa.length>0)
	{
	
		var av=[];
		var an=[];
		aa.each(function(i,v){
			var name=$(this).children("span").first().html();
			var value=$(this).attr("percentage") || "100";
			av.push(value);
			an.push(name+" ("+value+"%)");
		});
		
		var url="http://chart.googleapis.com/chart?chco=0099ff,888888&chdls=444444,16&chs=880x275&cht=p&chds=a";
		url=url+"&chd=t:"+av.join(",")+"&chdl="+an.join("|")

		base.before("<img src=\""+url+"\" style=\"width:880px;height:275px\" class=\"sector_pie\" />");
	}
});


};

