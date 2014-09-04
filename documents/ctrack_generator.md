How to create a widget
==========================================

By using iframes, the Generator allows you to embed sections of d-portal in any html-enabled publishing platform; ie. Wordpress blog post, Tumblr post, a website etc.

Please note that Wordpress does not allow iframes unless it is self-hosted so this may not work if you have a free Wordpress site. (Read more - http://en.support.wordpress.com/code/)

Visit http://d-portal.org/ctrack.html#view=generator to get started.

More views are still being added.


| Options  | Meaning  |
| :------------ |:---------------|
| VIEW      | Sections of d-portal you can embed |
| SKIN      | Flavas and Colourthemes available |
| RECIPIENT      | Choose a Recipient's data to display |
| PUBLISHER      | Choose a Publisher's data to display |
| SIZE      | Choose a blog-friendly size |



Make sure to pick a Publisher if you choose a Publisher-specific view or a Recipient for a Recipient-specific view.

Click on **Fix Size** to resize the widget appropriately.

Once you have created your widget, copy and paste the <iframe> code into the portion of your Wordpress blog post or website to embed it; eg.
```
<iframe scrolling="no" src="http://d-portal.org/ctrack.html?flava=original&amp;rgba=mustard&amp;country=AO&amp;publisher=30001&amp;#view=frame&amp;frame=publisher_countries" style="width: 960px; height: 528px; overflow: hidden;"></iframe>
```

You can also edit the iframe to include other options like scrollbars, different widths, different heights etc.

Depending on the quality of the data published, some sections may be empty as we do not filter those out.




