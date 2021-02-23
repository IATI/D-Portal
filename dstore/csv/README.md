## Public Spreadsheet (CSV)
Data here is not easily available anywhere else and have been manually provided and updated by the IATI Tech Team.  
Originally, these were stored on [Google Sheets](https://docs.google.com/spreadsheets/d/1jpXHDNmJ1WPdrkidEle0Ig13zLlXw4eV6WkbSy6kWk4/) but have been moved here so be aware that the Google Sheet access is out of date and no longer in use.

*As far as we can tell - funder, donor and publisher are synonyms of each other.*  
The inconsistencies of naming convention stems from the creation of these csvs from separate individuals at the beginning of d-portal development, then known as the Country Tracker.  

CRS data is published retrospectively, so is between **12 and 23 months out of date**.  
The data provided is the annual **total disbursements (spend)** for the publisher.  
The values are in current **US dollars**.

> CRS (Creditor Reporting System) data should include Official Development Assistance (ODA), Other Official Flows (OOFs) and private grants as they are reported to IATI and we are trying to make that comparison.

**crs_year.csv** is yearly CRS data.  
Only data that matches exactly the column and row labels defined is used in d-portal.

**crs_year_sectors.csv** is the raw sector data published by CRS.  
This data is unedited and published on d-portal as is.

**iati_funders.csv** maps IATI publishers to their CRS identifiers.  
*It contains a mapping of IATI organisation codes into a shared "funder code".*  
Multiple IATI codes may map to a single funder code.  

```IATI-code``` is the IATI Identifier of the publisher  
```Funder-code``` is the CRS Identifier

**crs_funders.csv** maps CRS publishers to their IATI identifiers.  
*It contains a mapping of the EXACT CRS column header names to shared "funder code".*   

```exact label``` is mapped to ```funder code``` using CRS data  
```iati publisher``` shows if the publisher does not report to IATI *(We indicate these publishers with "-" in tables)*  
```display name``` is the publisher names displayed in d-portal  
```number``` is the CRS donor code used in all **crs_year.csv**  

**crs_countries.csv** maps recipients to the 2 Letter Country Codes  
*A mapping of the EXACT CRS row header names (countries) to a country code.*  
```exact label``` is derived from ```recipient_name``` in CRS data 

**imf_currencies.csv** is a list of currency codes used by the [IMF](http://www.imf.org/external/np/fin/data/rms_mth.aspx) and the names to display for each currency.  

**local_currency.csv** maps each country to their local currency, or the most relevant currency.  
2 letter country code, 3 letter currency.  

**exchange.csv**	lists curated exchange rates for all currencies.  
These values are replaced by data from the IMF where available so this is just used to fill in the gaps.  

**sector_categories.csv** maps CRS 3-digit Sector codes to their names.  
**sector_groups.csv**	maps IATI sector codes into easier to understand groups for display in the sectors view.  
**sector_codes.csv**	maps CRS Sector headers to IATI sector codes.  


