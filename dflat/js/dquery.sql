
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

