---
name: prisma-multitenant-patterns
description: "Data modeling standards, strict storeId tenant isolation, indexing rules, and transaction safety for PostMind using Prisma ORM with PostgreSQL."
---

# Prisma Multi-Tenant Patterns for PostMind

## 1. Golden Rule of Tenant Isolation

Every store-owned resource must strictly verify the ownership chain:
```text
authenticatedUser -> ownsStore -> ownsResource
```
**NEVER** trust a client-provided `storeId` without validating that `authenticatedUser.id` has ownership/access to that `storeId`.

## 2. Model Indexing Rules

- Every table belonging to a store MUST have a `storeId` foreign key.
- Index `storeId` on all tenant-scoped tables:
  ```prisma
  @@index([storeId])
  ```
- Composite indexes for frequent query paths (e.g., store products filtered by status or category):
  ```prisma
  @@index([storeId, status])
  @@index([storeId, createdAt])
  ```

## 3. Safe Mutation Patterns

- Always use Prisma transactions (`prisma.$transaction`) when mutating multiple records that must stay atomic (e.g. creating a post and its scheduled dispatch job, or updating quota upon AI generation).
- Soft deletes should use `deletedAt DateTime?` where historical audit is required.
