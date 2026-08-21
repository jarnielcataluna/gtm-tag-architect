# Google Consent Mode v2 Reference

Google Consent Mode v2 introduces two new consent signals on top of the original two.

## 4 Core Consent Signals

1. `analytics_storage` - Enables analytics cookies and measurement.
2. `ad_storage` - Enables advertising cookies (Google Ads, Meta).
3. `ad_user_data` - **(v2 Required)** Consents to sending user data to Google for advertising purposes.
4. `ad_personalization` - **(v2 Required)** Consents to personalized advertising and remarketing.

## Implementation Pattern

```html
<!-- Default snippet executed before GTM container loads -->
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('consent', 'default', {
    'ad_storage': 'denied',
    'analytics_storage': 'denied',
    'ad_user_data': 'denied',
    'ad_personalization': 'denied',
    'wait_for_update': 500
  });
</script>
```

When the user accepts cookies in your CMP (Cookiebot, OneTrust, custom banner), push the update:

```javascript
gtag('consent', 'update', {
  'ad_storage': 'granted',
  'analytics_storage': 'granted',
  'ad_user_data': 'granted',
  'ad_personalization': 'granted'
});
```
