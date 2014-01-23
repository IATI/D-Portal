<?xml version="1.0" encoding="ISO-8859-1"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
<xsl:output omit-xml-declaration="yes" indent="yes"/>
<xsl:template match="*">
	<html>
		<head>
			<link rel="stylesheet" type="text/css" href="/static/ctrack/art/activities.css" />
		</head>
		<body>
			<xsl:copy-of select="/*"/>
		</body>
		<script src="/static/ctrack/art/activities.js" />
	</html>
</xsl:template>
</xsl:stylesheet>
