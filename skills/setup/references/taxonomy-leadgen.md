# Lead Generation & B2B Taxonomy Reference

Event taxonomy for agencies, consultancies, B2B services, and enterprise conversion funnels.

## Event Sequence

1. `view_service` / `view_case_study` - Inspects credibility assets.
2. `click_cta` - Interacts with "Book Consultation" or "Contact Us" buttons.
3. `open_contact_form` - Reaches contact / quote form.
4. `submit_lead_form` - Successfully submits form (`form_id`, `service_interest`).
5. `book_meeting` - Completes calendar schedule (Calendly / HubSpot).

## Golden Rules
- Distinguish between micro-conversions (opening a form) and macro-conversions (form submission / booking).
- Send clean `form_id` parameters so marketing channels can distinguish high-intent RFP forms from newsletter signups.
