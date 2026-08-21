# Technical Portfolio & Peer Engagement Tracking Taxonomy Reference

Event taxonomy optimized for senior engineers, technical leaders, and personal developer records.

## Interaction Categories

### 1. Section Attention & Engagement
- `section_viewed` - Triggered via `IntersectionObserver` when a section (`roles`, `enterprise_projects`, `builds`, `stack`, `certifications`, `contact`) enters the viewport for $\ge 2$ seconds.
- Metric goal: Understand which technical depth areas peer readers inspect before taking action.

### 2. High-Intent Conversion Signals
- `contact_form_started` - Triggered when the user focuses on the contact message or email input.
- `contact_form_submitted` - Fired on API response (`form_id`, `success: true|false`).
- `credential_verified` - Fired when a reader clicks an Anthropic/Skilljar credential verification badge.
- `external_project_clicked` - Fired on clicks to production or open-source GitHub repositories (`LetsGoBatanes`, `sentinel-agent-poc`, `gtm-tag-architect`).
- `social_channel_clicked` - Fired on clicks to GitHub, LinkedIn, or email mailto links.

### 3. Content Reading & Code Inspection
- `article_reading_milestone` - Fired at 25%, 50%, 75%, and 100% scroll depth on technical posts.
- `article_code_copied` - Fired when a user copies code samples or terminal commands from code blocks.
- `back_to_top_clicked` - Fired when a user hits the back-to-top floating control.

## Best Practices
- Never send personal contact form messages or email text to analytics. Only send `success: boolean` and `form_id`.
- Use passive event listeners and debounced scroll/intersection observers to ensure zero main-thread jank.
