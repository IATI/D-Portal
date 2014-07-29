How to create a News post
==========================================

Create a new file in the news folder.

https://github.com/devinit/D-Portal/tree/master/dportal/html/news

Make sure you name the file with a date, a title and .html so it knows it is a blog post.

For example:

	2014-05-28-Current-plans.html
	
We will need to include the template so it shows up in the post.

	#blog_title trim=ends
	Add the title of the post under this.


	#blog_body form=markdown
	Add the post itself under this.

The easiest way to make sure the title and body of the post is picked up is to copy and paste an old post and write over it.

We use Github Markdown for styling.

	Bold with **asterisks**
	
	Italics with *asterisks*
	
	Lists starts with +
	
	<a href="http://linkaddress.com">Links</a>
