SAVi
==========================================

SAVi is a Simple Activity Viewer for IATI xml.

SAVi is xml that has been hacked to not look like xml and is slightly massaged for legibility.

This means SAVi is still an xml file that you can still download if you right click and "Save as..."

Each SAVi XML should download as the actual project title; ie. "*ActivityGB1.xml*".



Display rules
==========================================

The objective of creating SAVi was so that xml files read easier for casual users who would otherwise be overwhelmed by raw xml.

For this to work, data included in the xml has been curated so that only the most useful fields are displayed. Of course, what is most useful remains subjective so this will depend on user feedback. As such, due to the loose schema of what data can be included in an IATI xml and until we get more feedback from regular use, we have chosen the most common fields we have encountered to display in SAVi.

If more than one language is provided, English is displayed first.
All fields are provided with titles to show context of data.

For any lookups, we refer to IATI Registry or the ctrack spreadsheet data (https://docs.google.com/spreadsheet/ccc?key=0AmauX4JNk0rJdHRWY1dRTkQ3dXJaeDk4RFZFWElaSHc&usp=sharing).

Rules are applied when codelists are available in the xml.


###reporting-org
- Displayed as ref lookup from IATI Registry or ctrack spreadsheet data.


###participating-org
- Displayed as ref lookup next to role lookup from IATI Registry or ctrack spreadsheet data.


###recipient-country
- Displayed as code lookup from IATI Registry or ctrack spreadsheet data.
- Percentages are included per country. Otherwise, percentages are divided equally to add up to 100%.
- Displayed as a list with highest percentage at the top.

###activity-date
- start-actual and end-actual have priority over start-planned and end-planned.
- iso-date is displayed over user input.

###activity-status
- Displayed as code lookup from IATI Registry or ctrack spreadsheet data.

###iati-identifier
- Displayed as an actual link next to IATI xml link and IATI Registry link.

###title
- Project title is displayed prominently at the top of every SAVi.

###description
- All type is displayed.

###activity-website
- Displayed as a link that opens in a new window.

###contact-info
- All information provided is displayed; ie. organisation, person-name, email, telephone, mailing-address.
- Email is not displayed as a link.

###sector
- Only DAC vocabulary is displayed.
- Percentages are included per sector. Otherwise, percentages are divided equally to add up to 100%.
- Percentages are displayed as a pie chart that can be downloaded as a PNG image.
- Percentages are also displayed as a table with highest percentage at the top.
- Sector names are overwritten by code lookup from IATI Registry or ctrack spreadsheet data.

###transaction
- All fields displayed as a table.
- value is displayed with currency.
- transaction-type follows code.
- iso-date is displayed over user input.
- provider-org follows ref over user input.
- receiver-org follows ref over user input.
- provider-org and receiver-org ref is converted to d-portal activity links that open in a new window.
- description is displayed as user input.

###budget
- All fields displayed as a table.
- iso-date is displayed over user input for period-start and period-end.
- value is displayed with currency.

###document-link
- title is converted to actual links that open in a new window.
- Links are displayed as a list.

###related-activity
- ref is converted to d-portal activity links that open in a new window.
- Links are displayed next to type.
- Links are displayed as a list.


Fields that are not displayed but may be included in the future (incomplete due to loose schema)
==========================================

- iati-activities generated-datetime
- query (total-count / start / limit)
- iati-activity (last-updated-datetime / xml:lang / default-currency / hierarchy)
- other-identifier
- participating-org type
- reporting-org type
- collaboration-type
- sector vocabulary not DAC
- default-aid-type
- default-tied-status
- recipient-region
- budget (type / value-date)
- transaction (flow-type / finance-type / value-date)
- policy-marker (code / vocab /significance)
- capital-spend
- country-budget-item (budget-item-code / percentage)
- document-link category code
- legacy data name
- location (name / coordinates / location-type / administrative / gazetteer-entry)
- conditions
