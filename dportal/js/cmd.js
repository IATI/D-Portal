// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

var cmd=exports;

var fs = require('fs');
var util=require('util');
var path=require('path');

var plate=require("../../ctrack/js/plate.js");

var ls=function(a) { console.log(util.inspect(a,{depth:null})); }

cmd.run=function(argv)
{
	if( argv._[0]=="build" )
	{
		return cmd.build();
	}


	// help text
	console.log(
		"\n"+
		">	dportal build \n"+
		"Build all output into static.\n"+
		"Use --root=/dirname/ to set a diferent rootdir than / eg for github pages."+
		"\n"+
		"\n"+
	"");
}

cmd.build=function()
{

deleteFolderRecursive = function(path) {
    var files = [];
    if( fs.existsSync(path) ) {
        files = fs.readdirSync(path);
        files.forEach(function(file,index){
            var curPath = path + "/" + file;
            if(fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};

//	deleteFolderRecursive("static");


	try { fs.mkdirSync("static"); } catch(e){}

	var tongues=[];
	var chunks={};
	var chunkopts={};
	
	chunkopts.root="/";  //

	if( argv.root ) { chunkopts.root=argv.root; }


	var dirname="text";
	var ff=fs.readdirSync(dirname);
	for(var i=0;i<ff.length;i++)
	{
		var v=ff[i];
		if( v.length==7 && ( v.slice(-4)==".txt") ) // xxx.txt tongue files
		{
			var t=v.slice(0,3);
			tongues[t]=tongues[t] || {};
			plate.fill_chunks( fs.readFileSync(dirname+"/"+t+".txt",'utf8'),tongues[t]);
			console.log("Adding "+t+" tongue");
		}
		else // normal chunks
		{
			console.log("Reading "+"/"+v);
			plate.fill_chunks(fs.readFileSync(dirname+"/"+v,'utf8'),chunks);
		}
	}
	var pages={};
	var get_page_chunk=function(fname)
	{
		if(pages[fname]) { return pages[fname]; }
		var s
		try { s=fs.readFileSync("html/"+fname,'utf8'); } catch(e){}
		if(s)
		{
			pages[fname]=plate.fill_chunks(s);
		}
		return pages[fname];
	}
	
	var find_pages=function(dir)
	{
		var dirs=dir.split("/");
		var ff=fs.readdirSync("html/"+dir);

		plate.reset_namespace();
		plate.push_namespace(chunkopts);
		plate.push_namespace(chunks);
		
		plate.push_namespace( get_page_chunk("index.html") );
		for(var i=0;i<dirs.length;i++)
		{
			var dd=[];
			for(var j=0;j<=i;j++) { dd.push(dirs[j]); }
			var ds=dd.join("/");
			if(ds!="") // skip ""
			{
				plate.push_namespace( get_page_chunk(dd+"/index.html") );
			}
		}


		var dodir=function(tongue)
		{
			var tonguedir=tongue;

			if(tongue=="eng")
			{
				tonguedir="";
			}
			else
			{
				tonguedir=tongue+"/";
			}

			chunkopts.tongue=tongue;
			chunkopts.tonguedir=chunkopts.root+tonguedir;
			
			try { fs.mkdirSync("static/"+tonguedir+dir); } catch(e){}
			for(var i=0;i<ff.length;i++) //parse
			{
				var name=ff[i];
				if( ! fs.lstatSync("html/"+dir+name).isDirectory() )
				{
					console.log("parse "+tonguedir+dir+name);
					var html=plate.replace("{html}",get_page_chunk(dir+name));
					fs.writeFileSync("static/"+tonguedir+dir+name,html);
				}
			}
		}

		if(tongues.eng) { plate.push_namespace(tongues.eng); }
		dodir("eng");
		if(tongues.eng) { plate.pop_namespace(); }
		
		for(var n in tongues)
		{
			if(n!="eng") // english is special default dealt with above
			{
				plate.push_namespace(tongues[n]);
				dodir(n);
				plate.pop_namespace();
			}
		}
		
		for(var i=0;i<ff.length;i++) // recurse
		{
			var name=ff[i];
			
			if( fs.lstatSync("html/"+dir+name).isDirectory() )
			{		
				console.log("scan  "+dir+name);
				find_pages(dir+name+"/");
			}
		}

	}

	find_pages("")

// create some symlinks to other datas

	try { fs.symlinkSync("../../ctrack/art", "static/art" ); } catch(e){}
	try { fs.symlinkSync("../../ctrack/jslib", "static/jslib" ); } catch(e){}

}

// if global.argv is set then we are inside another command so do nothing
if(!global.argv)
{
	var argv = require('yargs').argv; global.argv=argv;
	cmd.run(argv);
}

