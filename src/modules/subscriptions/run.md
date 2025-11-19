# تسجيل الدخول

stripe login

# توجيه webhooks مباشرة لـ localhost

stripe listen --forward-to localhost:3000/api/subscriptions/webhook

```

ستحصل على webhook secret جديد مثل:
```

> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxxxxxxxxx
> ضعه في .env:
> STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxx
