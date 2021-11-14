
#^sql_select_count

select

count(*)
as count

from xson where root='/iati-activities/iati-activity'

limit 10;

#^sql_select_activity

select

*

from xson where root='/iati-activities/iati-activity'

limit 10;


#^sql_select_organisation

select

*

from xson where root='/iati-organisations/iati-organisation'

limit 10;


#^sql_select_activity_top_level

select

root,aid,pid,
(xson - '{"/budget","/sector","/transaction","/description","/related-activity","/activity-date","/participating-org","/recipient-country","/planned-disbursement","/country-budget-items/budget-item","/location","/contact-info","/document-link","/default-aid-type","/policy-marker","/crs-add/other-flags","/result","/other-identifier","/conditions/condition","/recipient-region"}'::text[] )
as xson

from xson where root='/iati-activities/iati-activity'

limit 10;

#^sql_select_subarray

select

*

from ( select aid , jsonb_array_elements(xson->'/title/narrative') as xson 
from ( select aid , jsonb_array_elements(xson->'/document-link') as xson
from xson where root='/iati-activities/iati-activity'
) as xson2
) as xson3

limit 10;

#^sql_select_documents_title_and_url

select

*

from ( select aid , jsonb_array_elements(xson->'/title/narrative')->'' as title , xson->'@url'as url
from ( select aid , jsonb_array_elements(xson->'/document-link') as xson
from xson where root='/iati-activities/iati-activity'
) as xson2
) as xson3

limit 100;


#^sql_count_document_links

select

aid , ( select count(*) from jsonb_array_elements(xson->'/document-link') )

from xson where root='/iati-activities/iati-activity' and xson->'/document-link' is not null

order by 2 desc

limit 20;


#^sql_top_organic_tags

select

xson->>'@code' as code , count(*)

from xson where root='/iati-activities/iati-activity/tag' and xson->>'@vocabulary' = '99' and xson->>'@vocabulary-uri' is null

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
