
#^sql_select_count

select

count(*)
as count

from xson where root='/iati-activities/iati-activity'

limit 10;

#^sql_select_activity

select

xson
as xson 

from xson where root='/iati-activities/iati-activity'

limit 10;

#^sql_select_activity_top_level

select

(xson - '{"/budget","/sector","/transaction","/description","/related-activity","/activity-date","/participating-org","/recipient-country","/planned-disbursement","/country-budget-items/budget-item","/location","/contact-info","/document-link","/default-aid-type","/policy-marker","/crs-add/other-flags","/result","/other-identifier","/conditions/condition","/recipient-region"}'::text[] )
as xson 

from xson where root='/iati-activities/iati-activity'

limit 10;

#^sql_select_activity_subarray

select

*

from ( select aid , jsonb_array_elements(xson->'/title/narrative') as xson 
from ( select aid , jsonb_array_elements(xson->'/document-link') as xson
from xson where root='/iati-activities/iati-activity'
) as xson2
) as xson3

limit 10;
