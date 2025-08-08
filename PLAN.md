E-1 (Epic 1)  Onboard & Verify
1.⁠ ⁠As a patient I can sign up on the web with e-mail + SMS code.
2.⁠ ⁠I can complete optional selfie/ID check to unlock future features.
3.⁠ ⁠I see a progress timer that counts down from 5 min so I know I’m on track.

E-2  Connect a Data Source
1.⁠ ⁠I can enter a provider’s portal e-mail address and click “Send my record” (C-CDA via Direct).
2.⁠ ⁠I can upload a PDF or photo of a lab result or note.
3.⁠ ⁠I receive a notification when each source finishes ingesting.

E-3  AI Ingest & Structure
1.⁠ ⁠As the system I parse C-CDAs into FHIR resources.
2.⁠ ⁠I OCR PDFs/JPEGs, extract labs & clinical notes, and map to simplified vocab (LOINC for labs, plain text for notes).
3.⁠ ⁠If model confidence < 70 %, I route the item to the Data Validation queue.

E-4  Review & Confirm Record
1.⁠ ⁠As a patient I can see a human-readable timeline of imported items.
2.⁠ ⁠I can hide or delete any item before sharing (“blanket toggle” consent applies by default).

E-5  Generate Share Package
1.⁠ ⁠I click “Share with my dentist” and the system bundles all current resources + an AI one-page summary.
2.⁠ ⁠The package is sent via Direct secure e-mail to the address I enter.
3.⁠ ⁠I get a confirmation that the send succeeded.

E-6  Nightly Refresh
1.⁠ ⁠Each night the system polls the Direct inbox for new C-CDAs and re-runs ingest.
2.⁠ ⁠If new items appear, I get an e-mail saying “Your record was updated.”

E-7  Dentist Landing Experience
1.⁠ ⁠As a dentist I receive an e-mail with the summary in the body and the C-CDA attached.
2.⁠ ⁠I can reply to the patient or download the file—no portal login required.

E-8  Usage Analytics
1.⁠ ⁠As PM I can see MAU and “time-to-first-share” in a dashboard.
2.⁠ ⁠I can filter by clinic to measure Appointment Attendance & Follow-up Rate.