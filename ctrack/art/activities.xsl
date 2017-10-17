<?xml version="1.0" encoding="ISO-8859-1"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
<xsl:output omit-xml-declaration="yes" indent="yes"/>
<xsl:template match="*">
	<html>
		<head>
			<meta name="viewport" content="width=device-width" />
			<link rel="stylesheet" type="text/css" href="/ctrack/art/original/ctrack.css" />
			<link rel="stylesheet" type="text/css" href="/ctrack/art/original/activities.css" />
			<script src="/ctrack/jslib/jquery.js" />
			<script src="/ctrack/jslib/ctrack.js" />
			<script>
				$(function(){
					require("ctrack").savi_fixup();
				})
			</script>
		</head>
		<body>
			<xsl:copy-of select="/*"/>
		</body>
	</html>
</xsl:template>
</xsl:stylesheet>
