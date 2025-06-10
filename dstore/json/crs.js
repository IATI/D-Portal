
// this file is now the only place you need to update the CRS year for new data

const crs={}
export default crs

import donors from "./crs_2019.json"
import sectors from "./crs_2019_sectors.json"

crs.year=2019
crs.donors=donors
crs.sectors=sectors
