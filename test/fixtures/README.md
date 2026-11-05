# Test fixtures

`activity-standard-example-annotated.xml` is IATI's example activity for
version 2.03 of the standard, unchanged, from
https://github.com/IATI/IATI-Extra-Documentation/blob/802936baa721749e59e2ded84a8a2eb97ddbc274/en/activity-standard/activity-standard-example-annotated.xml
(branch `version-2.03`, last changed 2020-01-07). The data is fictional.

`test/import.test.js` imports it, and its expected values are worked out
from this file. If you replace it, recheck them.

`dflat/test/` holds an older 2.01 copy of the same example; it is not used
by the tests.
