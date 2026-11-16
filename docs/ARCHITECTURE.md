# Architecture

Fashion marketplace backend: Express 4 + TypeScript (CommonJS) on PostgreSQL via Prisma, with Redis, BullMQ and Socket.IO. See [STRUCTURE.md](STRUCTURE.md) for the file layout.

## Process model

One Node process runs everything (`src/server.ts`):
- HTTP API on `PORT` (Express app from `src/index.ts`, mounted at `/api`).
- A **separate** Socket.IO server on `SOCKET_PORT` (not attached to the HTTP port).
- BullMQ workers, started as a side effect of `import "./workers/index"` in `src/index.ts`.
- Redis connected after listeners start (`connectRedis`). The io instance is exported from `server.ts` and set on `global.socketio` so services can emit.

## Request lifecycle

`routs.ts` → module router → middleware chain → controller → service → Prisma.

Typical chain: `rateLimiter()` → `auth(...roles)` / `PublicAuth()` → multer (`utils/s3`) → `parseData()` (parses JSON fields in multipart bodies) → validator → `req_validator()` → controller.

- Controllers use `catchAsync` and `sendResponse`; failures throw `AppError`, normalised by `middleware/globalErrorhandler`.
- `auth` verifies the bearer JWT (`JWT_ACCESS_SECRET`), loads user + `auth`, and rejects missing, unverified or deleted accounts. Roles are the Prisma `Role` enum; `allRoles` is exported from `modules/user/user.rout.ts`. Some routes exclude charity roles (`excludedCharityRoles` in `product.rout.ts`).
- Socket auth is separate (`socket/middleware/auth.socket.ts`); each socket joins room `user::<userId>`.

## Data layer

- Prisma schema is multi-file under `prisma/schema/` (`prisma.config.ts` points at the directory). The client is generated to `generated/prisma` and imported from there (`generated/prisma/client`, enums from `generated/prisma/enums`). Run `npx prisma generate` after schema edits.
- `src/shared/prisma.ts` is the only client instance (60s transaction timeout).

## Async jobs (BullMQ)

- Producers: `src/queues/*.queue.ts`; job names in `queues/jobs.name.ts`.
- Consumers: `src/workers/*.worker.ts`. Queue defaults: 3 attempts, exponential backoff, `removeOnComplete`.
- Topics: email, notification/push, badge, stock update, withdraw, balance, donation (sell + extra distribution), refund, order creation, payment completion/distribution.
- A worker only runs if imported. `workers/index.ts` imports Refund, Notification, Badge, StockUpdate, Withdraw, email, balance, donation. `makeOrder.worker.ts` and `payment.worker.ts` are **not imported anywhere** — verify before relying on `makeOrder` / payment jobs.
- BullMQ connects through `connectionInfo` in `src/redis/index.ts` (`maxRetriesPerRequest: null` is mandatory).

## Redis usage

`src/redis/keys.ts` builds keys for OTPs and for **version-based cache invalidation** of product listings (`products:version`, per-user `buyer-products:<id>:version`). When a mutation changes product data, bump the version (`incrementProductsVersion`) rather than deleting keys.

## Core domain flows

- **Products & offers**: listing, buyer/seller views, bundle discounts; offer make/accept/counter/decline in `product` routes, logic in `modules/offer/offer.service.ts`.
- **Checkout**: cart (with charity donation choices) → Stripe payment (`modules/payments`) → async order creation, payment completion, stock update, then distribution of seller balance, sell-donation and extra-donation shares.
- **Orders/returns/refunds**: Order + OrderItem with cancel/auth-status enums; `Return` with evidence; `Refund` handled by the refund worker.
- **Shipping**: Easyship integration (`modules/shipment`, parcel suggestions, cloth-donation shipping cost).
- **Wallet/withdraw**: `Wallet` + `WalletTransaction`; withdrawals via the withdraw worker and Stripe connected accounts (`modules/ConnectAccount`).
- **Donations**: direct and cloth donations (status lifecycle, photos, thanks messages).
- **Chat**: Socket.IO events (`my-chat-list`, `join-chat`, `seen`, `typing`, `stopTyping`, online/offline) persisted in Chat/Message tables.
- **Roles/profiles**: `roleExtra.prisma` holds per-role profiles with approval status.

## Configuration & deployment

- All env vars are read in `src/config/index.ts` (Stripe, Easyship, Twilio, S3/Spaces, Redis, JWT, mail, URLs). `.env` is gitignored.
- Uploads go to S3-compatible storage (`utils/s3.ts`); Firebase Admin is used for push notifications.
- Docker: `Dockerfile` + `docker-compose.yml` (backend 4000/4001, Postgres 17, Redis 7, one-shot seed). The backend runs `prisma migrate deploy` before `npm start`.
- CORS origins are hardcoded in `src/index.ts`; Socket.IO allows `*`.
