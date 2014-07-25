// Copyright (c) 2014 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT


var csvw=exports;
exports.name="csvw";

csvw.del = ','; // CSV Delimiter
csvw.enc = '"'; // CSV Enclosure

// Convert Object to CSV column
csvw.escapeCol = function (col) {
	if(isNaN(col)) {
		// is not boolean or numeric
		if (!col) {
			// is null or undefined
			col = '';
		} else {
			// is string or object
			col = String(col);
			if (col.length > 0) {
								
				// escape inline enclosure
				col = col.split( csvw.enc ).join( csvw.enc + csvw.enc );
			
				// wrap with enclosure
				col = csvw.enc + col + csvw.enc;
			}
		}
	}
	return col;
};

// Convert an Array of columns into an escaped CSV row
csvw.arrayToRow = function (arr) {
	var arr2 = arr.slice(0);
	
	var i, ii = arr2.length;
	for(i = 0; i < ii; i++) {
		arr2[i] = csvw.escapeCol(arr2[i]);
	}
	return arr2.join(csvw.del);
};

// Convert a two-dimensional Array into an escaped multi-row CSV 
csvw.arrayToCSV = function (arr) {
	var arr2 = arr.slice(0);
	
	var i, ii = arr2.length;
	for(i = 0; i < ii; i++) {
		arr2[i] = csvw.arrayToRow(arr2[i]);
	}
	return arr2.join("\r\n");
};

