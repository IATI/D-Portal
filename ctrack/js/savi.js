// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var savi=exports;


var iati_codes=require("../../dstore/json/iati_codes.json")


savi.fixup = function(args){


args=args || {};	
var inside=args.inside || "";
//var prelink=args.link || "http://datastore.iatistandard.org/api/1/access/activity.xml?iati-identifier=";
var prelink=args.link || "http://d-portal.org/q.html?aid=";
var postlink=args.link_post || "";


var acts=$(inside+"iati-activity").not(".savidone"); // ignore activities that have already been done
acts.addClass("savidone"); // mark as done so we ignore if we get called again

//console.log("save fixup "+inside+"iati-activity"+" "+acts.length);
//console.log(acts.html());


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

acts.find("value").each(function(i){var it=$(this);
	var c=it.attr("currency");
	if(!c) { c=it.parents("iati-activity").attr("default-currency"); } // use default?
	if(c)
	{
		c=c.toUpperCase();
		it.html( commafy( it.html() ) +"<span>"+c+"</span>" );
	}
});

acts.each(function(i){var it=$(this);
	var needed=["title","recipient-country","participating-org","reporting-org","description","activity-status"];
	needed.forEach(function(n){
		if( it.children(n).length==0 )
		{
			it.append("<"+n+" />"); // just add a blank tag
		}
	});
	
/*
	if( it.find("narrative").length==0 ) // no narrative ( PRE 201 ) , so we add them in to simplify the CSS
	{
		var narratives=["title"];
		narratives.forEach(function(n){
			it.find(n).each(function(i){var it=$(this);
console.log("adding narrative tag to "+it.html());
				it.wrapInner("<narrative></narrative>");
			});
		});
	}
*/
	

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

// change title to span_title (title tag seems to confuse browsers)
acts.find("title").each(function(i){var it=$(this);
//console.log(it.text());
	it.replaceWith($('<span-title>' + it.text() + '</span-title>'));
});


acts.find("participating-org").each(function(i){var it=$(this);
	var c=it.attr("role");
	if(c)
	{
		c=c.toLowerCase();
		it.attr("role",c)
	}
	
	if( it.html().trim()=="" )
	{
		it.html( it.attr("ref") || it.html() );
	}

});

acts.find("transaction").each(function(i){var it=$(this);
	var needed=["transaction-date","transaction-type","description","provider-org","receiver-org","value"];
	needed.forEach(function(n){
		if( it.children(n).length==0 )
		{
			it.append("<"+n+" />"); // just add a blank tag
		}
	});
	var tdate=it.children("transaction-date");
	var tvalue=it.children("value");
	if( !tdate.attr("iso-date") && tvalue.attr("value-date") ) // use value date if iso-date is missing
	{
//		console.log("fixing "+tvalue.attr("value-date"))
		tdate.attr("iso-date",tvalue.attr("value-date"));
	}
	
});

acts.find("budget").each(function(i){var it=$(this);
	var needed=["period-start","period-end","value"];
	needed.forEach(function(n){
		if( it.children(n).length==0 )
		{
			it.append("<"+n+" />"); // just add a blank tag
		}
	});

});

acts.find("activity-date,transaction-date,period-start,period-end").each(function(i){var it=$(this);
	it.html( it.attr("iso-date") );
});

// duplicate the baseline into the period for display purposes (it is in many ways a start value)
acts.find("result").each(function(i){var it=$(this);

	var baseline=it.find("baseline").first();
	
	it.find("period").each(function(i){var it=$(this);
		it.prepend( baseline.clone() );
		
		var dpct=0;
		
		var sdate=it.find("period-start").first().attr("iso-date")
		var edate=it.find("period-end").first().attr("iso-date")
		
		if( sdate && edate )
		{
			sdate=sdate.split("-");
			edate=edate.split("-");
			
			sdate=Date.UTC(sdate[0],sdate[1],sdate[2]);
			edate=Date.UTC(edate[0],edate[1],edate[2]);

			var dtot=edate-sdate;
			var dval=(new Date()).getTime()-sdate;
			dpct=Math.floor(100*dval/dtot);
			if(dpct<0){dpct=0;}
			if(dpct>100){dpct=100;}
		}
		
//		console.log(it,dpct);
		
		it.find("period-end").first().after("<div class=\"timeline\"><div class=\"time time-percent"+dpct+"\" style=\"width:"+dpct+"%;\"><span></span></div></div>");
		
		var target=it.find("target").first();
		var actual=it.find("actual").first();
		
		var div=actual; // the div we intend to change
		
		if(target&&actual)
		{
			target=target.attr("value");
			actual=actual.attr("value");
			
			if($.isNumeric(target)&&$.isNumeric(actual))
			{
				target=Number(target);
				actual=Number(actual);
				
				if(actual>=target)
				{
					div.addClass("value-higher");
				}
				else
//				if(actual>0)
				{
					div.addClass("value-lower");
				}
			}
		}
		
	});
});

acts.find("result target, result actual").each(function(i){var it=$(this);
	it.append($('<span-narrative>' + it.attr("value") + '</span-narrative>'));
});

acts.find("result dimension").each(function(i){var it=$(this);
	if(it.attr("name"))
	{
		it.append($('<span-narrative class="dimension-name">'  + it.attr("name") + '</span-narrative>'));
	}
	if(it.attr("value"))
	{
		it.append($('<span-narrative class="dimension-value">' + it.attr("value") + '</span-narrative>'));
	}
});

acts.find("result baseline").each(function(i){var it=$(this);
	if(it.attr("value"))
	{
		it.prepend($('<span-narrative class="baseline-value">' + it.attr("value") + '</span-narrative>'));
	}
	if(it.attr("year"))
	{
		it.prepend($('<span-narrative class="baseline-year">'  + it.attr("year") + '</span-narrative>'));
	}
});

acts.find("result location").each(function(i){var it=$(this);
	if(it.attr("ref"))
	{
		it.append($('<span-narrative class="location-ref">'  + it.attr("ref") + '</span-narrative>'));
	}
});

acts.find("result actual comment narrative").each(function(i){var it=$(this);
	it.replaceWith($('<span-narrative>' + it.text() + '</span-narrative>'));
});

acts.find("result reference").each(function(i){var it=$(this);
	var id=it.attr("indicator-uri");
	if(id)
	{
		it.text(id);
		wrapInner_link(it,id,"a_"+this.tagName.toLowerCase());
	}
});

acts.find("related-activity").each(function(i){var it=$(this);
	if( it.html().length<4 )
	{
		it.html(it.attr("ref"));
	}
});


//acts.find("participating-org").each(function(i){var it=$(this);
//	if(it.attr("role"))
//	{
//		it.append($('<span-narrative class="participating-role">'  + it.attr("role") + " role" + '</span-narrative>'));
//	}
//});


acts.find("reporting-org").each(function(i){var it=$(this);
	var t=it.attr("ref");
	t=iati_codes.publisher_names[t];
	if(t)
	{
		it.html(t);
	}
});

acts.find("activity-status").each(function(i){var it=$(this);
	var tc=it.attr("code");
	tc=iati_codes.activity_status[tc] || tc;
	if(tc)
	{
		it.html(tc);
	}
});

acts.find("sector").each(function(i){var it=$(this);

	var tp=it.attr("percentage") || 100;
	var tc=it.attr("code");

	if(!it.attr("vocabulary")) { it.attr("vocabulary","DAC"); }

	tc=iati_codes.sector[tc]  || iati_codes.sector_category[tc] || tc;	
	if(tc)
	{
		it.html("<span>"+tc+"</span><span>"+tp+"%</span>");
	}

});

acts.find("transaction-type").each(function(i){var it=$(this);

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

acts.find("recipient-country").each(function(i){var it=$(this);

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

acts.find("period").each(function(i){var it=$(this);
	
	var sortlist=[
		"period-start",
		"period-end",
		"baseline",
		"target",
		"actual",
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

acts.find("budget").each(function(i){var it=$(this);
	
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

acts.find("transaction").each(function(i){var it=$(this);
	
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
acts.each(function(i){var it=$(this);
sorted++;
	var sortlist=[
		"title",
		"span-title",
		"iati-identifier",
		"recipient-country",
		"activity-date",
		"participating-org",
		"reporting-org",
		"description",
		"sector",
		"budget",
		"transaction",
		"result",
		"contact-info",
		"activity-website",
		"document-link",
		"related-activity",
		"activity-status",
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
			if(at<bt) { ret=1; } else if(at>bt) { ret=-1; }
		}

		if( (ret===0) && (aname=="transaction") )
		{
			var at=$(a).children("transaction-date").first().attr("iso-date");
			var bt=$(b).children("transaction-date").first().attr("iso-date");
			if(at<bt) { ret=1; } else if(at>bt) { ret=-1; }
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

acts.find("document-link").each(function(i){var it=$(this);
	wrap_link(it,it.attr("url"),"a_"+this.tagName.toLowerCase());
});

acts.find("activity-website").each(function(i){var it=$(this);
	wrap_link(it,it.html(),"a_"+this.tagName.toLowerCase());
});

acts.find("iati-identifier").each(function(i){var it=$(this);
	var slug=it.parent().parent().attr("dstore:slug"); // do we know where this came from?
	var id=encodeURIComponent(it.text().trim());
	wrap_link(it,prelink+id+postlink,"a_"+this.tagName.toLowerCase());
	it.append($("<div></div>"));
	it.append($("<a class='a_xml_"+this.tagName.toLowerCase()+
//	"' href='http://datastore.iatistandard.org/api/1/access/activity.xml?iati-identifier="+id+"'>xml</a>"));
	"' href='http://d-portal.org/q.xml?aid="+id+"' target='_blank'>xml</a>"));
	if(slug)
	{
		it.append($("<a class='a_slug' href='http://iatiregistry.org/dataset/"+slug+"' target='_blank'>dataset</a>"));
	}
});

acts.find("provider-org[provider-activity-id]").each(function(i){var it=$(this);
	var id=it.attr("provider-activity-id");
	if(id)
	{
		wrapInner_link(it,prelink+id+postlink,"a_"+this.tagName.toLowerCase());
	}
});

acts.find("receiver-org[receiver-activity-id]").each(function(i){var it=$(this);
	var id=it.attr("receiver-activity-id");
	if(id)
	{
		wrapInner_link(it,prelink+id+postlink,"a_"+this.tagName.toLowerCase());
	}
});

acts.find("participating-org[activity-id]").each(function(i){var it=$(this);
	var id=it.attr("activity-id");
	if(id)
	{
		wrapInner_link(it,prelink+id+postlink,"a_"+this.tagName.toLowerCase());
	}
});


acts.find("related-activity").each(function(i){var it=$(this);
	var id=it.attr("ref");
	if(id)
	{
		wrap_link(it,prelink+id+postlink,"a_"+this.tagName.toLowerCase());
	}
});

acts.find("*").each(function(i){var it=$(this);
	if( ($.trim(it.text())=="") && (it.children().length==0) ) // no text or tags
	{
        it.addClass("empty");
    }
});

acts.each(function(i){var it=$(this);

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

