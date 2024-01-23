
#^sql_select_count

SELECT

count(*)
as count

FROM xson where root='/iati-activities/iati-activity'

limit 10;

#^sql_select_activity

SELECT

*

FROM xson where root='/iati-activities/iati-activity'

limit 10;


#^sql_select_organisation

SELECT

*

from xson where root='/iati-organisations/iati-organisation'

and pid = 'GB-GOV-1'

limit 1;


#^sql_select_activity_top_level

SELECT

root,aid,pid,
(xson - '{"/budget","/sector","/transaction","/description","/related-activity","/activity-date","/participating-org","/recipient-country","/planned-disbursement","/country-budget-items/budget-item","/location","/contact-info","/document-link","/default-aid-type","/policy-marker","/crs-add/other-flags","/result","/other-identifier","/conditions/condition","/recipient-region"}'::text[] )
as xson

from xson where root='/iati-activities/iati-activity'

limit 10;

#^sql_select_subarray

SELECT

*

from ( SELECT aid , jsonb_array_elements(xson->'/title/narrative') as xson 
from ( SELECT aid , jsonb_array_elements(xson->'/document-link') as xson
from xson where root='/iati-activities/iati-activity'
) as xson2
) as xson3

limit 10;

#^sql_select_documents_title_and_url

SELECT

*

from ( SELECT aid , jsonb_array_elements(xson->'/title/narrative')->'' as title , xson->'@url'as url
from ( SELECT aid , jsonb_array_elements(xson->'/document-link') as xson
from xson where root='/iati-activities/iati-activity'
) as xson2
) as xson3

limit 100;


#^sql_count_document_links
--/* Find activities with most document links at top level

SELECT

aid AS "Activity Identifier",

( 
    SELECT count(*) AS "Document Links"
    FROM jsonb_array_elements(xson->'/document-link')
)

FROM xson WHERE root='/iati-activities/iati-activity'

AND xson->'/document-link' IS NOT NULL

ORDER BY 2 DESC

LIMIT 20;


#^sql_top_organic_tags

SELECT

xson->>'@code' as code , count(*)

FROM xson where root='/iati-activities/iati-activity/tag' and xson->>'@vocabulary' = '99' and xson->>'@vocabulary-uri' is null

group by 1 order by 2 desc

limit 1000;


#^sql_covid_19

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

SELECT root , count(*)

FROM xson

GROUP BY 1 ORDER BY 2 DESC

LIMIT 1000;
