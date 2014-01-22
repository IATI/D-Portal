	
console.log("Prepare xml");


// Adjust some tags using js

var list=document.getElementsByTagName("activity-date"); for (var i = 0; i < list.length; ++i) { var it = list.item(i);

	it.innerHTML=it.getAttribute("iso-date");

}
var list=document.getElementsByTagName("transaction-date"); for (var i = 0; i < list.length; ++i) { var it = list.item(i);

	it.innerHTML=it.getAttribute("iso-date");

}
var list=document.getElementsByTagName("period-start"); for (var i = 0; i < list.length; ++i) { var it = list.item(i);

	it.innerHTML=it.getAttribute("iso-date");

}
var list=document.getElementsByTagName("period-end"); for (var i = 0; i < list.length; ++i) { var it = list.item(i);

	it.innerHTML=it.getAttribute("iso-date");

}

var transaction_type_lookup={
"C":	"Commitment",
"D":	"Disbursement",
"E":	"Expenditure",
"IF":	"Incoming Funds",
"IR":	"Interest Repayment",
"LR":	"Loan Repayment",
"R":	"Reimbursement",
"QP":	"Purchase of Equity",
"QS":	"Sale of Equity",
"CG":	"Credit Guarantee"
}

var list=document.getElementsByTagName("transaction-type"); for (var i = 0; i < list.length; ++i) { var it = list.item(i);

	var t=it.getAttribute("code");
	it.innerHTML=transaction_type_lookup[t] || it.innerHTML ;

}

var country_codes_back={"AFGHANISTAN":"AF","ÅLAND ISLANDS":"AX","ALBANIA":"AL","ALGERIA":"DZ","AMERICAN SAMOA":"AS","ANDORRA":"AD","ANGOLA":"AO","ANGUILLA":"AI","ANTARCTICA":"AQ","ANTIGUA AND BARBUDA":"AG","ARGENTINA":"AR","ARMENIA":"AM","ARUBA":"AW","AUSTRALIA":"AU","AUSTRIA":"AT","AZERBAIJAN":"AZ","BAHAMAS":"BS","BAHRAIN":"BH","BANGLADESH":"BD","BARBADOS":"BB","BELARUS":"BY","BELGIUM":"BE","BELIZE":"BZ","BENIN":"BJ","BERMUDA":"BM","BHUTAN":"BT","BOLIVIA, PLURINATIONAL STATE OF":"BO","BONAIRE, SINT EUSTATIUS AND SABA":"BQ","BOSNIA AND HERZEGOVINA":"BA","BOTSWANA":"BW","BOUVET ISLAND":"BV","BRAZIL":"BR","BRITISH INDIAN OCEAN TERRITORY":"IO","BRUNEI DARUSSALAM":"BN","BULGARIA":"BG","BURKINA FASO":"BF","BURUNDI":"BI","CAMBODIA":"KH","CAMEROON":"CM","CANADA":"CA","CAPE VERDE":"CV","CAYMAN ISLANDS":"KY","CENTRAL AFRICAN REPUBLIC":"CF","CHAD":"TD","CHILE":"CL","CHINA":"CN","CHRISTMAS ISLAND":"CX","COCOS (KEELING) ISLANDS":"CC","COLOMBIA":"CO","COMOROS":"KM","CONGO":"CG","CONGO, THE DEMOCRATIC REPUBLIC OF THE":"CD","COOK ISLANDS":"CK","COSTA RICA":"CR","CÔTE D'IVOIRE":"CI","CROATIA":"HR","CUBA":"CU","CURAÇAO":"CW","CYPRUS":"CY","CZECH REPUBLIC":"CZ","DENMARK":"DK","DJIBOUTI":"DJ","DOMINICA":"DM","DOMINICAN REPUBLIC":"DO","ECUADOR":"EC","EGYPT":"EG","EL SALVADOR":"SV","EQUATORIAL GUINEA":"GQ","ERITREA":"ER","ESTONIA":"EE","ETHIOPIA":"ET","FALKLAND ISLANDS (MALVINAS)":"FK","FAROE ISLANDS":"FO","FIJI":"FJ","FINLAND":"FI","FRANCE":"FR","FRENCH GUIANA":"GF","FRENCH POLYNESIA":"PF","FRENCH SOUTHERN TERRITORIES":"TF","GABON":"GA","GAMBIA":"GM","GEORGIA":"GE","GERMANY":"DE","GHANA":"GH","GIBRALTAR":"GI","GREECE":"GR","GREENLAND":"GL","GRENADA":"GD","GUADELOUPE":"GP","GUAM":"GU","GUATEMALA":"GT","GUERNSEY":"GG","GUINEA":"GN","GUINEA-BISSAU":"GW","GUYANA":"GY","HAITI":"HT","HEARD ISLAND AND MCDONALD ISLANDS":"HM","HOLY SEE (VATICAN CITY STATE)":"VA","HONDURAS":"HN","HONG KONG":"HK","HUNGARY":"HU","ICELAND":"IS","INDIA":"IN","INDONESIA":"ID","IRAN, ISLAMIC REPUBLIC OF":"IR","IRAQ":"IQ","IRELAND":"IE","ISLE OF MAN":"IM","ISRAEL":"IL","ITALY":"IT","JAMAICA":"JM","JAPAN":"JP","JERSEY":"JE","JORDAN":"JO","KAZAKHSTAN":"KZ","KENYA":"KE","KIRIBATI":"KI","KOREA, DEMOCRATIC PEOPLE'S REPUBLIC OF":"KP","KOREA, REPUBLIC OF":"KR","KUWAIT":"KW","KYRGYZSTAN":"KG","LAO PEOPLE'S DEMOCRATIC REPUBLIC":"LA","LATVIA":"LV","LEBANON":"LB","LESOTHO":"LS","LIBERIA":"LR","LIBYA":"LY","LIECHTENSTEIN":"LI","LITHUANIA":"LT","LUXEMBOURG":"LU","MACAO":"MO","MACEDONIA, THE FORMER YUGOSLAV REPUBLIC OF":"MK","MADAGASCAR":"MG","MALAWI":"MW","MALAYSIA":"MY","MALDIVES":"MV","MALI":"ML","MALTA":"MT","MARSHALL ISLANDS":"MH","MARTINIQUE":"MQ","MAURITANIA":"MR","MAURITIUS":"MU","MAYOTTE":"YT","MEXICO":"MX","MICRONESIA, FEDERATED STATES OF":"FM","MOLDOVA, REPUBLIC OF":"MD","MONACO":"MC","MONGOLIA":"MN","MONTENEGRO":"ME","MONTSERRAT":"MS","MOROCCO":"MA","MOZAMBIQUE":"MZ","MYANMAR":"MM","NAMIBIA":"NA","NAURU":"NR","NEPAL":"NP","NETHERLANDS":"NL","NEW CALEDONIA":"NC","NEW ZEALAND":"NZ","NICARAGUA":"NI","NIGER":"NE","NIGERIA":"NG","NIUE":"NU","NORFOLK ISLAND":"NF","NORTHERN MARIANA ISLANDS":"MP","NORWAY":"NO","OMAN":"OM","PAKISTAN":"PK","PALAU":"PW","PALESTINE, STATE OF":"PS","PANAMA":"PA","PAPUA NEW GUINEA":"PG","PARAGUAY":"PY","PERU":"PE","PHILIPPINES":"PH","PITCAIRN":"PN","POLAND":"PL","PORTUGAL":"PT","PUERTO RICO":"PR","QATAR":"QA","RÉUNION":"RE","ROMANIA":"RO","RUSSIAN FEDERATION":"RU","RWANDA":"RW","SAINT BARTHÉLEMY":"BL","SAINT HELENA, ASCENSION AND TRISTAN DA CUNHA":"SH","SAINT KITTS AND NEVIS":"KN","SAINT LUCIA":"LC","SAINT MARTIN (FRENCH PART)":"MF","SAINT PIERRE AND MIQUELON":"PM","SAINT VINCENT AND THE GRENADINES":"VC","SAMOA":"WS","SAN MARINO":"SM","SAO TOME AND PRINCIPE":"ST","SAUDI ARABIA":"SA","SENEGAL":"SN","SERBIA":"RS","SEYCHELLES":"SC","SIERRA LEONE":"SL","SINGAPORE":"SG","SINT MAARTEN (DUTCH PART)":"SX","SLOVAKIA":"SK","SLOVENIA":"SI","SOLOMON ISLANDS":"SB","SOMALIA":"SO","SOUTH AFRICA":"ZA","SOUTH GEORGIA AND THE SOUTH SANDWICH ISLANDS":"GS","SOUTH SUDAN":"SS","SPAIN":"ES","SRI LANKA":"LK","SUDAN":"SD","SURINAME":"SR","SVALBARD AND JAN MAYEN":"SJ","SWAZILAND":"SZ","SWEDEN":"SE","SWITZERLAND":"CH","SYRIAN ARAB REPUBLIC":"SY","TAIWAN, PROVINCE OF CHINA":"TW","TAJIKISTAN":"TJ","TANZANIA, UNITED REPUBLIC OF":"TZ","THAILAND":"TH","TIMOR-LESTE":"TL","TOGO":"TG","TOKELAU":"TK","TONGA":"TO","TRINIDAD AND TOBAGO":"TT","TUNISIA":"TN","TURKEY":"TR","TURKMENISTAN":"TM","TURKS AND CAICOS ISLANDS":"TC","TUVALU":"TV","UGANDA":"UG","UKRAINE":"UA","UNITED ARAB EMIRATES":"AE","UNITED KINGDOM":"GB","UNITED STATES":"US","UNITED STATES MINOR OUTLYING ISLANDS":"UM","URUGUAY":"UY","UZBEKISTAN":"UZ","VANUATU":"VU","VENEZUELA, BOLIVARIAN REPUBLIC OF":"VE","VIET NAM":"VN","VIRGIN ISLANDS, BRITISH":"VG","VIRGIN ISLANDS, U.S.":"VI","WALLIS AND FUTUNA":"WF","WESTERN SAHARA":"EH","YEMEN":"YE","ZAMBIA":"ZM","ZIMBABWE":"ZW"};
var country_codes={};
for(var n in country_codes_back) { country_codes[ country_codes_back[n] ]=n; }

var list=document.getElementsByTagName("recipient-country"); for (var i = 0; i < list.length; ++i) { var it = list.item(i);

	var t=it.getAttribute("code");
	if(t)
	{
		t=t.toUpperCase();
		it.innerHTML=country_codes[t] || it.innerHTML ;
	}
}

// sort each transaction using this list of tag names as basic prefered order

var sortlist=[
	"transaction-date",
	"transaction-type",
	"description",
	"provider-org",
	"receiver-org",
	"value",
	0
];
var sortweight={}; for(var i=0; i<sortlist.length; i++) { sortweight[ sortlist[i] ]=i+1; }
var its=document.getElementsByTagName("transaction");
for(var a=0;a<its.length;a++)
{
	var list = its.item(a);	
	var items = list.children;
	var itemsArr = [];
	for (var i =0 ; i<items.length; i++) {
			itemsArr.push(items.item(i));
	}

	itemsArr.sort(function(a, b) {
		var ret=0;
		var aw=sortweight[a.tagName] || sortweight[0];
		var bw=sortweight[b.tagName] || sortweight[0];	
		if(ret===0)
		{
			if(aw > bw ) { ret= 1; }
			if(aw < bw ) { ret=-1; }
		}
		if(ret===0)
		{
			if(a.tagName > b.tagName ) { ret= 1; }
			if(a.tagName < b.tagName ) { ret=-1; }
		}
		return ret;
	});

	for(var i = 0; i < itemsArr.length; ++i) {
		list.appendChild(itemsArr[i]);
	}
}

// sort each activity using this list of tag names as basic prefered order

var sortlist=[
	"iati-identifier",
	"activity-date",
	"title",
	"activity-status",
	"description",
	"budget",
	"transaction",
	0
];
var sortweight={}; for(var i=0; i<sortlist.length; i++) { sortweight[ sortlist[i] ]=i+1; }

var acts=document.getElementsByTagName("iati-activity");
for(var a=0;a<acts.length;a++)
{
	var list = acts.item(a);
	
	var items = list.children;
	var itemsArr = [];
	for (var i =0 ; i<items.length; i++) {
			itemsArr.push(items.item(i));
	}

	itemsArr.sort(function(a, b) {
		var ret=0;
		
		var aw=sortweight[a.tagName] || sortweight[0];
		var bw=sortweight[b.tagName] || sortweight[0];

		if(ret===0)
		{
			if(aw > bw ) { ret= 1; }
			if(aw < bw ) { ret=-1; }
		}

		if(ret===0)
		{
			if(a.tagName > b.tagName ) { ret= 1; }
			if(a.tagName < b.tagName ) { ret=-1; }
		}
		
		if(ret===0)
		{
			if(a.tagName=="activity-date")
			{
				var at=a.getAttribute("type");
				var bt=b.getAttribute("type");
				if(at<bt) { ret=1; } else if(at>bt) { ret=-1; }
			}
		}
		
		return ret;
	});

	for(var i = 0; i < itemsArr.length; ++i) {
		list.appendChild(itemsArr[i]);
	}

}


