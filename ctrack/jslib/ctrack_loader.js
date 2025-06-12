
ctrack_loader=async function(args){
	
	var root=args.root 	  || "/ctrack/";
	var qroot=args.qroot  || "/"; // use current site by default

	// local test with data on main server
	let domtest=(window.location.host.split(".")[0]).split(":")[0]
	if( ( domtest=="localhost") ) { qroot="//d-portal.org/" }

	args.jslib=args.jslib 	|| root+"jslib/";
	args.art=args.art 		|| root+"art/";
	args.q=args.q			|| qroot+"q";
	args.dquery=args.dquery	|| qroot+"dquery";
	
	args.mapkey=args.mapkey || "AIzaSyDPrMTYfR7XcA3PencDS4dhovlILuumB_w"

	window.ctrack = (await import(root+"jslib/ctrack.js"))["default"]
	window.ctrack.setup(args);
};
