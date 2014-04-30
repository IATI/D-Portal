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
	var blogs={};
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
	
	var find_pages=function(dir,blog)
	{
		var dirs=dir.split("/"); while( dirs[dirs.length-1]=="" ) { dirs.pop(); }
		var ff=fs.readdirSync("html/"+dir);

		plate.reset_namespace();
		plate.push_namespace(chunkopts);
		plate.push_namespace(chunks);
		
//		console.log("namespace /");
		plate.push_namespace( get_page_chunk("index.html") );
		for(var i=0;i<dirs.length;i++)
		{
			var dd=[];
			for(var j=0;j<=i;j++) { dd.push(dirs[j]); }
			var ds=dd.join("/");
			if(ds!="") // skip ""
			{
//				console.log("namespace /"+dd);
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
			chunkopts.tongue_root=chunkopts.root+tonguedir;
			
			try { fs.mkdirSync("static/"+tonguedir+dir); } catch(e){}
			for(var i=0;i<ff.length;i++) //parse
			{
				var name=ff[i];
				if( ! fs.lstatSync("html/"+dir+name).isDirectory() )
				{
					var blogdate=false;
					var namedash = name.split('-');
					if(namedash[0]&&namedash[1]&&namedash[2]&&namedash[3]) // looks like a date?
					{
						blogdate=Date(namedash[0], namedash[1]-1, namedash[2]);
					}
					if( (!blog) || (blog && blogdate) ) // in blogmode, only parse files with a date at the start
					{
						console.log("parseing "+tonguedir+dir+name+(blog?" as blogpost":""));
						var page=get_page_chunk(dir+name);
						page._extension=name.split('.').pop();;
						page._filename=name;
						page._fullfilename=dir+name;
						if(blog)
						{
							page._date=namedash[0]+"-"+namedash[1]+"-"+namedash[2];
							page._name="";for(var pi=3;pi<namedash.length;pi++) { page._name+=" "+namedash[pi]; }
							blogs[ dir+name ]=page;
						}
						else
						{
							page.it=page;
							var html=plate.replace("{"+page._extension+"}",page);
							fs.writeFileSync("static/"+tonguedir+dir+name,html);
						}
					}
				}
			}
		}

		if(tongues.eng) { plate.push_namespace(tongues.eng); }
		dodir("eng");
		if(tongues.eng) { plate.pop_namespace(); }
		
		if(!blog) // not on blog scan
		{
			for(var n in tongues)
			{
				if(n!="eng") // english is special default dealt with above
				{
					try { fs.mkdirSync("static/"+n); } catch(e){}
					plate.push_namespace(tongues[n]);
					dodir(n);
					plate.pop_namespace();
				}
			}
		}
		
		for(var i=0;i<ff.length;i++) // recurse
		{
			var name=ff[i];
			
			if( fs.lstatSync("html/"+dir+name).isDirectory() )
			{
//				console.log("scan  "+dir+name);
				find_pages(dir+name+"/",blog);
			}
		}

	}

	find_pages("",true); // find blogs first, blogs begin with a 2000-12-31-title.html style 
	
	var bloglist=[];
	for(var n in blogs)
	{
		bloglist.push(blogs[n]);
	}
	bloglist.sort(function(a,b){return a._fullfilename>b._fullfilename?1:-1;});
	
	var b5=[];
	for(var i=bloglist.length-1; (i>=0) && (i>=(bloglist.length-5)) ;i--)
	{
		if(bloglist[i])
		{
			b5.push(bloglist[i])
		}
	}

	chunkopts["bloglist"]=bloglist;
	chunkopts["bloglist_last5"]=b5;
	
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

