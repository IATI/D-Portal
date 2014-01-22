	
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

