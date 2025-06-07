# Architecture Decision Records

## 2024-xx-xx Framework Standardisation

After evaluating the frameworks used across services, we found that **user-service** was the only service implemented with NestJS while the remaining services were built with Express. Migrating all existing Express services to NestJS would involve significant refactoring effort and changes to shared utilities that already rely on Express. Conversely, converting the user-service to Express aligns it with the majority of the codebase and simplifies maintenance.

**Decision:** Standardise on **Express** for all services. The user-service will be converted from NestJS to Express.

Rationale:
- Most services already use Express and share common middleware implementations.
- Shared logging and monitoring utilities are built around Express.
- Converting a single service is lower effort than migrating several others.

The bootstrap code of the user-service has been updated accordingly and NestJS specific scripts removed.
