
$(function(){

var commafy=function(s) { return s.replace(/(^|[^\w.])(\d{4,})/g, function($0, $1, $2) {
        return $1 + $2.replace(/\d(?=(?:\d\d\d)+(?!\d))/g, "$&,"); }) };

var codes_lookup={"sector":{"11110":"Education policy and administrative management","11120":"Education facilities and training","11130":"Teacher training","11182":"Educational research","11220":"Primary education","11230":"Basic life skills for youth and adults","11240":"Early childhood education","11320":"Secondary education","11330":"Vocational training","11420":"Higher education","11430":"Advanced technical and managerial training","12110":"Health policy and administrative management","12181":"Medical education/training","12182":"Medical research","12191":"Medical services","12220":"Basic health care","12230":"Basic health infrastructure","12240":"Basic nutrition","12250":"Infectious disease control","12261":"Health education","12262":"Malaria control","12263":"Tuberculosis control","12281":"Health personnel development","13010":"Population policy and administrative management","13020":"Reproductive health care","13030":"Family planning","13040":"STD control including HIV/AIDS","13081":"Personnel development for population and reproductive health","14010":"Water resources policy and administrative management","14015":"Water resources protection","14020":"Water supply and sanitation - large systems","14021":"Water supply - large systems ","14022":"Sanitation - large systems","14030":"Basic drinking water supply and basic sanitation","14031":"Basic drinking water supply","14032":"Basic sanitation","14040":"River development","14050":"Waste management/disposal","14081":"Education and training in water supply and sanitation","15110":"Economic and development policy/planning","15111":"Public finance management","15112":"Decentralisation and support to subnational government","15113":"Anti-corruption organisations and institutions","15120":"Public sector financial management","15130":"Legal and judicial development","15140":"Government administration","15150":"Democratic participation and civil society","15151":"Elections","15152":"Legislatures and political parties","15153":"Media and free flow of information","15160":"Human rights","15170":"Women's equality organisations and institutions *","15210":"Security system management and reform","15220":"Civilian peace-building, conflict prevention and resolution","15230":"Post-conflict peace-building (UN)","15240":"Reintegration and SALW control","15250":"Land mine clearance","15261":"Child soldiers (Prevention and demobilisation)","16010":"Social/ welfare services","16020":"Employment policy and administrative management","16030":"Housing policy and administrative management","16040":"Low-cost housing","16050":"Multisector aid for basic social services","16061":"Culture and recreation","16062":"Statistical capacity building","16063":"Narcotics control","16064":"Social mitigation of HIV/AIDS","21010":"Transport policy and administrative management","21020":"Road transport","21030":"Rail transport","21040":"Water transport","21050":"Air transport","21061":"Storage","21081":"Education and training in transport and storage","22010":"Communications policy and administrative management","22020":"Telecommunications","22030":"Radio/television/print media","22040":"Information and communication technology (ICT)","23010":"Energy policy and administrative management","23020":"Power generation/non-renewable sources","23030":"Power generation/renewable sources","23040":"Electrical transmission/ distribution","23050":"Gas distribution","23061":"Oil-fired power plants","23062":"Gas-fired power plants","23063":"Coal-fired power plants","23064":"Nuclear power plants","23065":"Hydro-electric power plants","23066":"Geothermal energy","23067":"Solar energy","23068":"Wind power","23069":"Ocean power","23070":"Biomass","23081":"Energy education/training","23082":"Energy research","24010":"Financial policy and administrative management","24020":"Monetary institutions","24030":"Formal sector financial intermediaries","24040":"Informal/semi-formal financial intermediaries","24081":"Education/training in banking and financial services","25010":"Business support services and institutions","25020":"Privatisation","31110":"Agricultural policy and administrative management","31120":"Agricultural development","31130":"Agricultural land resources","31140":"Agricultural water resources","31150":"Agricultural inputs","31161":"Food crop production","31162":"Industrial crops/export crops","31163":"Livestock","31164":"Agrarian reform","31165":"Agricultural alternative development","31166":"Agricultural extension","31181":"Agricultural education/training","31182":"Agricultural research","31191":"Agricultural services","31192":"Plant and post-harvest protection and pest control","31193":"Agricultural financial services","31194":"Agricultural co-operatives","31195":"Livestock/veterinary services","31210":"Forestry policy and administrative management","31220":"Forestry development","31261":"Fuelwood/charcoal","31281":"Forestry education/training","31282":"Forestry research","31291":"Forestry services","31310":"Fishing policy and administrative management","31320":"Fishery development","31381":"Fishery education/training","31382":"Fishery research","31391":"Fishery services","32110":"Industrial policy and administrative management","32120":"Industrial development","32130":"Small and medium-sized enterprises (SME) development","32140":"Cottage industries and handicraft","32161":"Agro-industries","32162":"Forest industries","32163":"Textiles, leather and substitutes","32164":"Chemicals","32165":"Fertilizer plants","32166":"Cement/lime/plaster","32167":"Energy manufacturing","32168":"Pharmaceutical production","32169":"Basic metal industries","32170":"Non-ferrous metal industries","32171":"Engineering","32172":"Transport equipment industry","32182":"Technological research and development","32210":"Mineral/mining policy and administrative management","32220":"Mineral prospection and exploration","32261":"Coal","32262":"Oil and gas","32263":"Ferrous metals","32264":"Nonferrous metals","32265":"Precious metals/materials","32266":"Industrial minerals","32267":"Fertilizer minerals","32268":"Offshore minerals","32310":"Construction policy and administrative management","33110":"Trade policy and administrative management","33120":"Trade facilitation","33130":"Regional trade agreements (RTAs)","33140":"Multilateral trade negotiations","33150":"Trade-related adjustment","33181":"Trade education/training","33210":"Tourism policy and administrative management","41010":"Environmental policy and administrative management","41020":"Biosphere protection","41030":"Bio-diversity","41040":"Site preservation","41050":"Flood prevention/control","41081":"Environmental education/ training","41082":"Environmental research","43010":"Multisector aid","43030":"Urban development and management","43040":"Rural development","43050":"Non-agricultural alternative development","43081":"Multisector education/training","43082":"Research/scientific institutions","51010":"General budget support","52010":"Food aid/Food security programmes","53030":"Import support (capital goods)","53040":"Import support (commodities)","60010":"Action relating to debt","60020":"Debt forgiveness","60030":"Relief of multilateral debt","60040":"Rescheduling and refinancing","60061":"Debt for development swap","60062":"Other debt swap","60063":"Debt buy-back","72010":"Material relief assistance and services","72040":"Emergency food aid","72050":"Relief co-ordination; protection and support services","73010":"Reconstruction relief and rehabilitation","74010":"Disaster prevention and preparedness","91010":"Administrative costs","92010":"Support to national NGOs","92020":"Support to international NGOs","92030":"Support to local and regional NGOs","93010":"Refugees in donor countries","99810":"Sectors not specified","99820":"Promotion of development awareness"},"transaction_type":{"C":"Commitment","D":"Disbursement","E":"Expenditure","IF":"Incoming Funds","IR":"Interest Repayment","LR":"Loan Repayment","R":"Reimbursement","QP":"Purchase of Equity","QS":"Sale of Equity","CG":"Credit Guarantee"},"activity_status":{"1":"Pipeline/identification","2":"Implementation","3":"Completion","4":"Post-completion","5":"Cancelled"},"country":{"AF":"AFGHANISTAN","AX":"ÅLAND ISLANDS","AL":"ALBANIA","DZ":"ALGERIA","AS":"AMERICAN SAMOA","AD":"ANDORRA","AO":"ANGOLA","AI":"ANGUILLA","AQ":"ANTARCTICA","AG":"ANTIGUA AND BARBUDA","AR":"ARGENTINA","AM":"ARMENIA","AW":"ARUBA","AU":"AUSTRALIA","AT":"AUSTRIA","AZ":"AZERBAIJAN","BS":"BAHAMAS","BH":"BAHRAIN","BD":"BANGLADESH","BB":"BARBADOS","BY":"BELARUS","BE":"BELGIUM","BZ":"BELIZE","BJ":"BENIN","BM":"BERMUDA","BT":"BHUTAN","BO":"BOLIVIA, PLURINATIONAL STATE OF","BQ":"BONAIRE, SINT EUSTATIUS AND SABA","BA":"BOSNIA AND HERZEGOVINA","BW":"BOTSWANA","BV":"BOUVET ISLAND","BR":"BRAZIL","IO":"BRITISH INDIAN OCEAN TERRITORY","BN":"BRUNEI DARUSSALAM","BG":"BULGARIA","BF":"BURKINA FASO","BI":"BURUNDI","KH":"CAMBODIA","CM":"CAMEROON","CA":"CANADA","CV":"CAPE VERDE","KY":"CAYMAN ISLANDS","CF":"CENTRAL AFRICAN REPUBLIC","TD":"CHAD","CL":"CHILE","CN":"CHINA","CX":"CHRISTMAS ISLAND","CC":"COCOS (KEELING) ISLANDS","CO":"COLOMBIA","KM":"COMOROS","CG":"CONGO","CD":"CONGO, THE DEMOCRATIC REPUBLIC OF THE","CK":"COOK ISLANDS","CR":"COSTA RICA","CI":"CÔTE D'IVOIRE","HR":"CROATIA","CU":"CUBA","CW":"CURAÇAO","CY":"CYPRUS","CZ":"CZECH REPUBLIC","DK":"DENMARK","DJ":"DJIBOUTI","DM":"DOMINICA","DO":"DOMINICAN REPUBLIC","EC":"ECUADOR","EG":"EGYPT","SV":"EL SALVADOR","GQ":"EQUATORIAL GUINEA","ER":"ERITREA","EE":"ESTONIA","ET":"ETHIOPIA","FK":"FALKLAND ISLANDS (MALVINAS)","FO":"FAROE ISLANDS","FJ":"FIJI","FI":"FINLAND","FR":"FRANCE","GF":"FRENCH GUIANA","PF":"FRENCH POLYNESIA","TF":"FRENCH SOUTHERN TERRITORIES","GA":"GABON","GM":"GAMBIA","GE":"GEORGIA","DE":"GERMANY","GH":"GHANA","GI":"GIBRALTAR","GR":"GREECE","GL":"GREENLAND","GD":"GRENADA","GP":"GUADELOUPE","GU":"GUAM","GT":"GUATEMALA","GG":"GUERNSEY","GN":"GUINEA","GW":"GUINEA-BISSAU","GY":"GUYANA","HT":"HAITI","HM":"HEARD ISLAND AND MCDONALD ISLANDS","VA":"HOLY SEE (VATICAN CITY STATE)","HN":"HONDURAS","HK":"HONG KONG","HU":"HUNGARY","IS":"ICELAND","IN":"INDIA","ID":"INDONESIA","IR":"IRAN, ISLAMIC REPUBLIC OF","IQ":"IRAQ","IE":"IRELAND","IM":"ISLE OF MAN","IL":"ISRAEL","IT":"ITALY","JM":"JAMAICA","JP":"JAPAN","JE":"JERSEY","JO":"JORDAN","KZ":"KAZAKHSTAN","KE":"KENYA","KI":"KIRIBATI","KP":"KOREA, DEMOCRATIC PEOPLE'S REPUBLIC OF","KR":"KOREA, REPUBLIC OF","KW":"KUWAIT","KG":"KYRGYZSTAN","LA":"LAO PEOPLE'S DEMOCRATIC REPUBLIC","LV":"LATVIA","LB":"LEBANON","LS":"LESOTHO","LR":"LIBERIA","LY":"LIBYA","LI":"LIECHTENSTEIN","LT":"LITHUANIA","LU":"LUXEMBOURG","MO":"MACAO","MK":"MACEDONIA, THE FORMER YUGOSLAV REPUBLIC OF","MG":"MADAGASCAR","MW":"MALAWI","MY":"MALAYSIA","MV":"MALDIVES","ML":"MALI","MT":"MALTA","MH":"MARSHALL ISLANDS","MQ":"MARTINIQUE","MR":"MAURITANIA","MU":"MAURITIUS","YT":"MAYOTTE","MX":"MEXICO","FM":"MICRONESIA, FEDERATED STATES OF","MD":"MOLDOVA, REPUBLIC OF","MC":"MONACO","MN":"MONGOLIA","ME":"MONTENEGRO","MS":"MONTSERRAT","MA":"MOROCCO","MZ":"MOZAMBIQUE","MM":"MYANMAR","NA":"NAMIBIA","NR":"NAURU","NP":"NEPAL","NL":"NETHERLANDS","NC":"NEW CALEDONIA","NZ":"NEW ZEALAND","NI":"NICARAGUA","NE":"NIGER","NG":"NIGERIA","NU":"NIUE","NF":"NORFOLK ISLAND","MP":"NORTHERN MARIANA ISLANDS","NO":"NORWAY","OM":"OMAN","PK":"PAKISTAN","PW":"PALAU","PS":"PALESTINE, STATE OF","PA":"PANAMA","PG":"PAPUA NEW GUINEA","PY":"PARAGUAY","PE":"PERU","PH":"PHILIPPINES","PN":"PITCAIRN","PL":"POLAND","PT":"PORTUGAL","PR":"PUERTO RICO","QA":"QATAR","RE":"RÉUNION","RO":"ROMANIA","RU":"RUSSIAN FEDERATION","RW":"RWANDA","BL":"SAINT BARTHÉLEMY","SH":"SAINT HELENA, ASCENSION AND TRISTAN DA CUNHA","KN":"SAINT KITTS AND NEVIS","LC":"SAINT LUCIA","MF":"SAINT MARTIN (FRENCH PART)","PM":"SAINT PIERRE AND MIQUELON","VC":"SAINT VINCENT AND THE GRENADINES","WS":"SAMOA","SM":"SAN MARINO","ST":"SAO TOME AND PRINCIPE","SA":"SAUDI ARABIA","SN":"SENEGAL","RS":"SERBIA","SC":"SEYCHELLES","SL":"SIERRA LEONE","SG":"SINGAPORE","SX":"SINT MAARTEN (DUTCH PART)","SK":"SLOVAKIA","SI":"SLOVENIA","SB":"SOLOMON ISLANDS","SO":"SOMALIA","ZA":"SOUTH AFRICA","GS":"SOUTH GEORGIA AND THE SOUTH SANDWICH ISLANDS","SS":"SOUTH SUDAN","ES":"SPAIN","LK":"SRI LANKA","SD":"SUDAN","SR":"SURINAME","SJ":"SVALBARD AND JAN MAYEN","SZ":"SWAZILAND","SE":"SWEDEN","CH":"SWITZERLAND","SY":"SYRIAN ARAB REPUBLIC","TW":"TAIWAN, PROVINCE OF CHINA","TJ":"TAJIKISTAN","TZ":"TANZANIA, UNITED REPUBLIC OF","TH":"THAILAND","TL":"TIMOR-LESTE","TG":"TOGO","TK":"TOKELAU","TO":"TONGA","TT":"TRINIDAD AND TOBAGO","TN":"TUNISIA","TR":"TURKEY","TM":"TURKMENISTAN","TC":"TURKS AND CAICOS ISLANDS","TV":"TUVALU","UG":"UGANDA","UA":"UKRAINE","AE":"UNITED ARAB EMIRATES","GB":"UNITED KINGDOM","US":"UNITED STATES","UM":"UNITED STATES MINOR OUTLYING ISLANDS","UY":"URUGUAY","UZ":"UZBEKISTAN","VU":"VANUATU","VE":"VENEZUELA, BOLIVARIAN REPUBLIC OF","VN":"VIET NAM","VG":"VIRGIN ISLANDS, BRITISH","VI":"VIRGIN ISLANDS, U.S.","WF":"WALLIS AND FUTUNA","EH":"WESTERN SAHARA","YE":"YEMEN","ZM":"ZAMBIA","ZW":"ZIMBABWE"}};

// Adjust some tags using js

var wrap_link=function(it,url,cc)
{
	it.wrap("<a href=\""+url+"\" class=\""+cc+"\" target=\"_blank\" ></a>");
}

var wrapInner_link=function(it,url,cc)
{
	it.wrapInner("<a href=\""+url+"\" class=\""+cc+"\" target=\"_blank\" ></a>");
}

$("value").each(function(i){var it=$(this);
	var c=it.attr("currency");
	if(!c) { c=it.parents("iati-activity").attr("default-currency"); } // use default?
	if(c)
	{
		c=c.toUpperCase();
		it.html( commafy( it.html() ) +"<span>"+c+"</span>" );
	}
});

$("transaction").each(function(i){var it=$(this);
	var needed=["transaction-date","transaction-type","description","provider-org","receiver-org","value"];
	needed.forEach(function(n){
		if( it.children(n).length==0 )
		{
			it.append("<"+n+" />"); // just add a blank tag
		}
	});

});

$("activity-date,transaction-date,period-start,period-end").each(function(i){var it=$(this);
	it.html( it.attr("iso-date") );
});

$("activity-status").each(function(i){var it=$(this);
	var tc=it.attr("code");
	tc=codes_lookup.activity_status[tc] || tc;
	if(tc)
	{
		it.html(tc);
	}
});

$("sector").each(function(i){var it=$(this);

	var tp=it.attr("percentage") || 100;
	var tc=it.attr("code");
	tc=codes_lookup.sector[tc] || tc;	
	if(tc)
	{
		it.html("<span>"+tc+"</span><span>"+tp+"</span>");
	}

});

$("transaction-type").each(function(i){var it=$(this);

	var tc=it.attr("code").toUpperCase();
	tc=codes_lookup.transaction_type[tc] || tc;
	if(tc)
	{
		it.html(tc);
	}

});

$("recipient-country").each(function(i){var it=$(this);

	var tc=it.attr("code").toUpperCase();
	tc=codes_lookup.country[tc] || tc;
	if(tc)
	{
		it.html(tc);
	}

});

$("transaction").each(function(i){var it=$(this);
	
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

$("iati-activity").each(function(i){var it=$(this);
	
	var sortlist=[
		"transaction-date",
		"iati-identifier",
		"activity-date",
		"recipient-country",
		"title",
		"activity-website",
		"activity-status",
		"sector",
		"description",
		"budget",
		"transaction",
		"participating-org",
		"related-activity",
		"contact-info",
	0];
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

		return ret;
	});
	it.append(aa);

});


$("document-link").each(function(i){var it=$(this);
	wrap_link(it,it.attr("url"),"a_"+this.tagName.toLowerCase());
});

$("activity-website").each(function(i){var it=$(this);
	wrap_link(it,it.html(),"a_"+this.tagName.toLowerCase());
});

$("iati-identifier").each(function(i){var it=$(this);
	wrap_link(it,"http://dev.ctrack.iatistandard.org:5000/api/1/access/activity.xml?iati-identifier="+it.html(),"a_"+this.tagName.toLowerCase());
});

$("provider-org[provider-activity-id]").each(function(i){var it=$(this);
	var id=it.attr("receiver-activity-id");
	if(id)
	{
		wrapInner_link(it,"http://dev.ctrack.iatistandard.org:5000/api/1/access/activity.xml?iati-identifier="+id,"a_"+this.tagName.toLowerCase());
	}
});

$("receiver-org[receiver-activity-id]").each(function(i){var it=$(this);
	var id=it.attr("receiver-activity-id");
	if(id)
	{
		wrapInner_link(it,"http://dev.ctrack.iatistandard.org:5000/api/1/access/activity.xml?iati-identifier="+id,"a_"+this.tagName.toLowerCase());
	}
});

$("related-activity").each(function(i){var it=$(this);
	var id=it.attr("ref");
	if(id)
	{
		wrap_link(it,"http://dev.ctrack.iatistandard.org:5000/api/1/access/activity.xml?iati-identifier="+id,"a_"+this.tagName.toLowerCase());
	}
});

$("iati-activity").each(function(i){var it=$(this);

	var aa=it.children("sector[vocabulary=\"DAC\"]");
	if(aa.length>0)
	{
	
		var av=[];
		var an=[];
		aa.each(function(i,v){
			var name=$(this).children("span").first().html();
			var value=$(this).attr("percentage") || "100";
			av.push(value);
			an.push(name);
		});
		
		var url="http://chart.googleapis.com/chart?chco=0099ff,888888&chdls=444444,16&chs=880x275&cht=p&chds=a";
		url=url+"&chd=t:"+av.join(",")+"&chdl="+an.join("|")

		aa.first().before("<img src=\""+url+"\" style=\"width:880px;height:275px\" class=\"sector_pie\" />");
	}
});


});
