	
console.log("Prepare xml");


var sortweight={
	"activity-date"			:10,
	"title"					:20,
	"activity-status"		:30,
	"description"			:40,
	0						:50
};
var acts=document.getElementsByTagName("iati-activity");
for(var a=0;a<acts.length;a++)
{
	var list = acts.item(a);
	
	var items = list.children;
	var itemsArr = [];
	for (var i =0 ; i<items.length; i++) {
			itemsArr.push(items.item(i));
	}
	
	itemsArr.forEach(function(it)
	{
		if(it.tagName=="activity-date")
		{
			it.innerHTML=it.getAttribute("iso-date");
		}
	});

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
