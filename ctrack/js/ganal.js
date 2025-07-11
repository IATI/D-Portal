// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

const ganal={}
export default ganal

import ctrack from "./ctrack.js"

import * as util from "util"


var ls=function(a) { console.log(util.inspect(a,{depth:null})); }

ganal.setup=function()
{
	if(!ctrack.args.ga) { return; } // no google analytics code



	(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
	(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
	m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
	})(window,document,'script','//www.google-analytics.com/analytics.js','ga');

	window.ga('create', ctrack.args.ga, { 'storage': 'none' } );

//	window.ga('send', 'pageview');
};

ganal.view=function()
{
	if(window.plausible)
	{
		var args=( window.location.search.substring(1)+"&"+(window.location.href.split('#')[1]||"") ).split("&").sort()
		plausible('pageview', { u: (window.location.href.split("#")[0])+"#"+args.join("&") })
	}
	
	if(!ctrack.args.ga) { return; } // no google analytics code
	
	if(!window.ga) // auto setup
	{
		ganal.setup();
	}

	window.ga('send', 'pageview', window.location.pathname + window.location.search + document.location.hash );
}


