How to customise d-portal
==========================================

There are various ways and sections where customisation is possible.



Skins - Flava and Colourtheme
==========================================

We have flava and colourtheme to fully customise d-portal to look as unique or as similar to your current website and branding.


###Flava

For more advanced users, this is a complete customisation option where you can supply the icons, images and edit the CSS to suit your needs.

There are currently 2 flavas available; Original and High Visibility.

**Original** is the intended design for d-portal.
**High Visibility** is a printer-friendly mode and a high contrast design for functional access.

Flavas are kept in separated individual folders under the art directory so can you create as many flavas as possible.

You can access different flavas from the dropdown menu from the main website.


###Colourtheme

For simple colour themeing, you can edit or create CSS files in the **rgba folder**.

There are currently 3 colourthemes available; mustard, inspire and grey.

The original CSS file acts as the base for your new colourthemes and has been simplified to only include sections that can be recoloured.

Edit this CSS with your preferred colours accordingly and rename the file as your new colourtheme.

For now, adding ***&rgba=yourcolourtheme*** to the url will allow you to see your new colourtheme; eg. http://d-portal.org/ctrack.html?publisher=GB-1&tongue=eng&rgba=inspire#view=publisher


You can also create a new base easily by typing this in command line. You will need to be in the ctrack directory.

```
ctrack tint red 255 0 0 
```

Create art/rgba/red.css with a 255,0,0 rgb tint using art/rgba/original.css as the template.

In this case, **red** is the filename for the new colourtheme. Running this command again will overwrite the current file. Additionally, any new class properties will override the original CSS so you can do small visual edits as well as large edits.


Chart.js
==========================================

We have created a simple javascript graph (**chart.js**) to display the top sectors, donors and countries.

You can find the source here - https://github.com/devinit/D-Portal/blob/master/ctrack/js/chart.js

There are several options for customisation that have been kept simple but these can be expanded to more complex options if needed.

**All stylings are in pixels.**

| Options  | Meaning  |
| :------------ |:---------------|
| style      | Style of chart - there is only donut flavour for now |
| layout      | Caption placement - left, right, five |
| width      | Width of entire chart div |
| height      | Height of entire chart div |
| center_x      | Center of chart in div from the left |
| center_y      | Center of chart in div from the top |
| radius      | Size of chart |
| hole      | Size of hole in chart - how big is your donut? |
| color      | Add as many colours as you want for pie slices (5 max for now) |
| caption_css      | Styling for the caption div (Information fields) |
| caption_edge      | Margin of caption div from the edge of entire chart div depending on layout (left/right) |
| stroke_width      | Thickness of chart border |
| line_width      | Thickness of lines from caption to chart |
| tints      | Changing the numbers below apart from [1,1,1,1] gives experimental effects |
| fill      | Background color of chart - [1,1,1,1] gets you slice colors |
| line      | Color of line from caption to chart - [1,1,1,1] gets you slice colors |
| stroke      | Border color of chart - [2,2,2,2] gets you #FFF (white) border |
| text      | Color of caption fonts |
| back      | Background color of caption div |
| border      | Border color of caption div |



Image charts
==========================================

https://developers.google.com/chart/image/docs/making_charts

We currently use Google's image charts to display SAVi sectors as pie charts due to its really simple and straightforward options. Although this is now deprecated, there is no limit to the number of calls per day you can make to the Google Chart API.

We will replace this if no longer supported with chart.js

