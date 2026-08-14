---
name: dual-billing-gateways
description: "Architecture guidelines for PostMind's unified billing system integrating Stripe (International) and SSLCommerz (Bangladesh), handling webhooks, IPN validation, and entitlement checks."
---

# Dual Billing Gateways: Stripe & SSLCommerz

## 1. Unified Billing Architecture

PostMind uses a strategy pattern to abstract the underlying payment processor:

```typescript
export interface PaymentGatewayProvider {
  createCheckoutSession(store: Store, plan: Plan, cycle: 'MONTHLY' | 'ANNUAL'): Promise<CheckoutResult>;
  handleWebhook(payload: any, signature: string): Promise<WebhookResult>;
  cancelSubscription(subscriptionId: string): Promise<boolean>;
}
```

## 2. Gateway Capabilities

### Stripe (International / USD)
- Supports automated recurring card charges, Apple Pay, Google Pay, and Customer Portal.
- Webhooks to listen for:
  - `checkout.session.completed`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`

### SSLCommerz (Bangladesh / BDT)
- Supports bKash, Nagad, Rocket, Upay, local Visa/Mastercard/Amex in BDT.
- Uses **IPN (Instant Payment Notification)** POST listener:
  - Validates `val_id` with SSLCommerz Order Validation API (`validation.php`).
  - Verifies status `VALID` or `VALIDATED`.
  - Computes next billing date based on the purchased cycle and stores invoice records.

## 3. Centralized Entitlement Layer

Domain features (e.g., AI generations, post scheduling, connected accounts) must only query the unified entitlement service:

```typescript
canPerformAction(storeId: string, feature: 'AI_GENERATION' | 'POST_PUBLISH' | 'CONNECT_ACCOUNT'): Promise<boolean>;
```
Never check gateway-specific logic in application controllers or UI.
