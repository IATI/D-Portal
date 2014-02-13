//create a nodejs or clientjs module
if(typeof required === "undefined") { required={}; }
var exs=exports;
if(typeof exs  === "undefined") { exs ={}; }
required["exs"]=exs;

var util=require('util');
var fs = require('fs');

var ls=function(a) { console.log(util.inspect(a,{depth:null})); }

var years=[];


// import the CSV, just call once on intialization
exs.load_csv=function()
{
	var csv=fs.readFileSync( __dirname + '/exs.csv', "utf8");
	var lines=csv.split("\n");
	var head;
	lines.map(function(line){
		var cs=line.split(",");
		if(head)
		{
			var v={}
			for(var i=0;i<head.length;i++)
			{
				var n=head[i];
				if(cs[i]=="")
				{
				}
				else
				{
					v[n]=Number(cs[i]);
				}
			}
			years.push(v);
		}
		else
		{
			head=cs;
		}
	})
	
//	console.log(years);
}

// exchange at the given years rate into usd
exs.exchange_year=function(year,ex,val)
{
	if("number"!=typeof val) { val=1; } // default of 1
	ex=ex.toUpperCase();
	var last;
	var ret;
	years.map(function(v){
		if(ret) { return; }
		if(v[ex]) // currency is available
		{
			if(v.year<=year) // aim for the right year or a future year
			{
				ret=v;
			}
			last=v; // remember
		}
	});
	ret=ret || last; // but try a previous year as a last resort
	if(ret)
	{
		return Math.floor(100*val/last[ex])/100;
	}
}

// download all vlaues from the IMF and create a CSV file that can later be loaded


exs.create_csv = function(){

	var http_getbody=function(url,cb)
	{
		http.get(url, function(res) {
			res.setEncoding('utf8');
			var s="";
			res.on('data', function (chunk) {
				s=s+chunk;
			});
			res.on('end', function() {
				cb(null,s);
			});
		}).on('error', function(e) {
			cb(e,null);
		});

	};

	var xes={"ALGERIAN DINAR":"DZD","Australian dollar":"AUD","Austrian schilling":"ATS","Bahrain dinar":"BHD","Belgian franc":"BEF","Brazilian real":"BRL","Canadian dollar":"CAD","Chilean peso":"CLP","Chinese yuan":"CNY","Colombian peso":"COP","Danish krone":"DKK","deutsche mark":"DEM","euro":"EUR","Finnish markka":"FIM","French franc":"FRF","Greek drachma":"GRD","Icelandic krona":"ISK","Indian rupee":"INR","Indonesian rupiah":"IDR","Iranian rial":"IRR","Irish pound":"IEP","Italian lira":"ITL","Japanese yen":"JPY","Korean won":"KRW","KROON":"EEK","Kuwaiti dinar":"KWD","Libyan dinar":"LYD","Luxembourg franc":"LUF","Malaysian ringgit":"MYR","Maltese lira":"MTL","Mexican peso":"MXN","Nepalese rupee":"NPR","Netherlands guilder":"NLG","New Zealand dollar":"NZD","Norwegian krone":"NOK","NUEVO SOL":"PEN","Pakistani rupee":"PKR","PESO URUGUAYO":"UYU","PHILIPPINE PESO":"PHP","Polish zloty":"PLN","Portuguese escudo":"PTE","Qatar riyal":"QAR","rial Omani":"OMR","Saudi Arabian riyal":"SAR","Singapore dollar":"SGD","South African rand":"ZAR","Spanish peseta":"ESP","Sri Lanka rupee":"LKR","Swedish krona":"SEK","Swiss franc":"CHF","Thai baht":"THB","Trinidad and Tobago dollar":"TTD","TUNISIAN DINAR":"TND","U.A.E. dirham":"AED","U.K. pound sterling":"GBP","U.S. dollar":"USD","Venezuelan bolivar":"VEB","Bolivar Fuerte":"VEF"};
	var exs={};
	for(var n in xes) { exs[ n.toLowerCase() ]=xes[n]; } //fix case
	

	var years={
	}
	
	exs.map(function(v){
		ls(v);
		var csv=wait.for(http_getbody,"http://www.imf.org/external/np/fin/data/rms_mth.aspx?SelectDate=2014-01-31&reportType=SDRCV&tsvflag=Y");
		if(csv)
		{
			csv.split("\n").map(function(line){
				var l=line.split("\t");
				if(l[1])
				{
					console.log(l[0]);
				}
			});
		}
	});

}


exs.hack_exs = function(){
	
	var http_getbody=function(url,cb)
	{
		http.get(url, function(res) {
			res.setEncoding('utf8');
			var s="";
			res.on('data', function (chunk) {
				s=s+chunk;
			});
			res.on('end', function() {
				cb(null,s);
			});
		}).on('error', function(e) {
			cb(e,null);
		});

	};

	var exs=["AED","AFN","ALL","AMD","ANG","AOA","ARS","AUD","AWG","AZN","BAM","BBD","BDT","BGN","BHD","BIF","BMD","BND","BOB","BOV","BRL","BSD","BTN","BWP","BYR","BZD","CAD","CDF","CHF","CLF","CLP","CNY","COP","COU","CRC","CUC","CUP","CVE","CZK","DJF","DKK","DOP","DZD","EEK","EGP","ERN","ETB","EUR","FJD","FKP","GBP","GEL","GHS","GIP","GMD","GNF","GTQ","GYD","HKD","HNL","HRK","HTG","HUF","IDR","ILS","INR","IQD","IRR","ISK","JMD","JOD","JPY","KES","KGS","KHR","KMF","KPW","KRW","KWD","KYD","KZT","LAK","LBP","LKR","LRD","LSL","LTL","LVL","LYD","MAD","MDL","MGA","MKD","MMK","MNT","MOP","MRO","MUR","MVR","MWK","MXN","MXV","MYR","MZN","NAD","NGN","NIO","NOK","NPR","NZD","OMR","PAB","PEN","PGK","PHP","PKR","PLN","PYG","QAR","RON","RSD","RUB","RWF","SAR","SBD","SCR","SDG","SEK","SGD","SHP","SLL","SOS","SRD","STD","SVC","SYP","SZL","THB","TJS","TMT","TND","TOP","TRY","TTD","TWD","TZS","UAH","UGX","USD","USN","USS","UYI","UYU","UZS","VEF","VND","VUV","WST","XAF","XCD","XOF","XPF","YER","ZAR","ZMK","ZWL"];

	var years={
	};
	
	exs.map(function(v){
		ls(v);
		var csv=wait.for(http_getbody,"http://www.oanda.com/currency/average?amount=1&start_month=1&start_year=1990&end_month=1&end_year=2014&base=USD&avg_type=Year&Submit=1&exchange="+v+"&interbank=0&format=CSV");
		if(csv){csv=csv.split("<pre>")[2];}
		if(csv){csv=csv.split("</PRE>")[0];} // hacks to grab the csv part of the page...
		if(csv)
		{
			csv.split("\n").map(function(line){
				var l=line.split(",");
				if(l[1])
				{
					if(l[0][0]=="*"){ l[0]=l[0].split("*")[1]; } // remove leading * (marks incomplete data)
					var year=parseInt(l[0]);
					var val=Number(l[1]);
					
					years[year]=years[year] || {};
					years[year][v]=val;
				}
			});
		}
	});

	var p=[];
	p.push("year");
	exs.map(function(v){
		p.push("\t");
		p.push(v);
	});
	p.push("\n");
	
	for(y in years)
	{
		p.push(""+y);
		exs.map(function(v){
			p.push("\t");
			if(years[y][v] && years[y][v]>0)
			{
				p.push(""+years[y][v]);
			}
		});
		p.push("\n");
	}
	console.log(p.join(""));
//	ls(years);
// http://www.oanda.com/currency/average?amount=1&start_month=1&start_year=1990&end_month=1&end_year=2014&base=USD&avg_type=Year&Submit=1&exchange=GBP&interbank=0&format=CSV

}


// load the exchange rates from a csv
exs.load_csv();



