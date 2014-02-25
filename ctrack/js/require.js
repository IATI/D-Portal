// setup a simple "require" function that just assumes module is
// already loaded
var require=function(n)
{
	var aa=n.split("/"); n=aa[aa.length]; // last part of path
	n=n.split(".")[0]; // first part of filename
	return exports[n];
}
