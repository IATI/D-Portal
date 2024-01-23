
#^sql_select_count
--/* Display the total number of activities in the database

SELECT

count(*) AS count

FROM xson WHERE root='/iati-activities/iati-activity'

LIMIT 1;


#^sql_select_activity
--/* Display a selection of 10 activities

SELECT

*

FROM xson WHERE root='/iati-activities/iati-activity'

LIMIT 10;


#^sql_display_org_names
--/* Display all the names for a participating-org published by reporting-org

SELECT

xson->>'@ref' AS "@ref" ,
xson->'/narrative'->0->>'' AS "/narrative" ,
pid as "reporting-org",
count(*) AS count

FROM xson WHERE root='/iati-activities/iati-activity/participating-org' 
AND xson->>'@ref'='XM-DAC-47066'

GROUP BY 1,2,3


#^sql_select_organisation
--/* Select an organisation by their @ref identifier

SELECT

*

FROM xson WHERE root='/iati-organisations/iati-organisation'

AND pid = 'GB-GOV-1'

LIMIT 1;


#^sql_select_activity_top_level
--/* Display top level elements and attributes for an activity by removing a selection of elements

SELECT

root,
aid,
pid,
( xson - '
    {
        "/budget",
        "/sector",
        "/transaction",
        "/description",
        "/related-activity",
        "/activity-date",
        "/participating-org",
        "/recipient-country",
        "/planned-disbursement",
        "/country-budget-items/budget-item",
        "/location",
        "/contact-info",
        "/document-link",
        "/default-aid-type",
        "/policy-marker",
        "/crs-add/other-flags",
        "/result",
        "/other-identifier",
        "/conditions/condition",
        "/recipient-region"
        
    }'::TEXT[]
) AS xson

FROM xson WHERE root='/iati-activities/iati-activity'

LIMIT 1;


#^sql_select_subarray
--/* Display elements within elements that can occur multiple times
--/* This example lists all titles of document links in an activity

SELECT

*

FROM
(
    SELECT
    aid ,
    jsonb_array_elements(xson->'/title/narrative') AS xson
    
    FROM
    (
        SELECT
        aid ,
        jsonb_array_elements(xson->'/document-link') AS xson
        
        FROM xson WHERE root='/iati-activities/iati-activity'
        AND aid='CA-3-S061266PRG'
    
    ) AS xson2
    
) AS xson3

LIMIT 100;


#^sql_select_documents_title_and_url
--/* Display elements within elements that can occur multiple times
--/* This example lists the titles and url of document links found in activities

SELECT

*

FROM
(
    SELECT
    aid ,
    jsonb_array_elements(xson->'/title/narrative')->'' AS title ,
    xson->'@url' AS url

    FROM
    (
        SELECT
        aid ,
        jsonb_array_elements(xson->'/document-link') AS xson
    
        FROM xson WHERE root='/iati-activities/iati-activity'
    
    ) AS xson2
    
) AS xson3

LIMIT 100;


#^sql_count_document_links
--/* Find activities with most document links at top level
--/* Does not include document links in transactions

SELECT

aid AS "Activity",

( 
    SELECT count(*) AS "Document Links"
    FROM jsonb_array_elements(xson->'/document-link')
)

FROM xson WHERE root='/iati-activities/iati-activity'

AND xson->'/document-link' IS NOT NULL

ORDER BY 2 DESC

LIMIT 20;


#^sql_top_organic_tags
--/* Display the list of codes used in the tag element ordered by the most

SELECT

xson->>'@code' AS "@code",
count(*) AS count

FROM xson WHERE root='/iati-activities/iati-activity/tag'
AND xson->>'@vocabulary' = '99'
AND xson->>'@vocabulary-uri' IS NULL

GROUP BY 1
ORDER BY 2 DESC

limit 1000;


#^sql_covid_19
--/* COVID-19 search

SELECT DISTINCT aid FROM xson WHERE
(
	root='/iati-activities/iati-activity/humanitarian-scope' AND
	xson->>'@type'='1' AND
	xson->>'@vocabulary'='1-2' AND
	xson->>'@code'='EP-2020-000012-001'
)OR(
	root='/iati-activities/iati-activity/humanitarian-scope' AND
	xson->>'@type'='2' AND
	xson->>'@vocabulary'='2-1' AND
	xson->>'@code'='HCOVD20'
)OR(
	root='/iati-activities/iati-activity/tag' AND
	xson->>'@vocabulary'='99' AND
	xson->>'@vocabulary-uri' IS NULL AND
	UPPER(xson->>'@code')='COVID-19'
)OR(
	root='/iati-activities/iati-activity/title/narrative' AND
	to_tsvector('simple', xson->>'') @@ to_tsquery('simple','COVID-19')
)OR(
	root='/iati-activities/iati-activity/description/narrative' AND
	to_tsvector('simple', xson->>'') @@ to_tsquery('simple','COVID-19')
)OR(
	root='/iati-activities/iati-activity/transaction/description/narrative' AND
	to_tsvector('simple', xson->>'') @@ to_tsquery('simple','COVID-19')
)OR(
	root='/iati-activities/iati-activity/sector' AND
	xson->>'@vocabulary'='1' AND
	xson->>'@code'='12264'
)


#^sql_root_list
--/* Display the number of instances for elements that occur multiple times

SELECT root , count(*) AS count

FROM xson

GROUP BY 1 ORDER BY 2 DESC

LIMIT 1000;

