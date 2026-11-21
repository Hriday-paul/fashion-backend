# Project Structure

```
src/
  server.ts          Starts HTTP app + separate Socket.IO listener, connects Redis
  index.ts           Express app: middleware, CORS allowlist, /api mount, imports workers
  routs.ts           moduleRoutes[] — module routers are registered here
  config/            Single place that reads process.env (dotenv)
  constants/         aws, pagination constants
  error/             AppError + Cast/Duplicate/Multer/Validation error mappers
  helper/            pagination.helper
  interface/         shared TS interfaces
  middleware/        auth (JWT + role), RateLimiter, parseData, req_validation,
                     globalErrorhandler, notfound
  modules/<name>/    Feature modules (see below)
  queues/            BullMQ producers (*.queue.ts) + jobs.name.ts
  workers/           BullMQ consumers (*.worker.ts); index.ts imports the active ones
  redis/             index.ts (clients, BullMQ connectionInfo), keys.ts (key builders, cache versioning)
  socket/            index.ts, handlers/ (Chat, Message, Status), middleware/auth.socket, utils/OnlineUser
  shared/            prisma.ts (PrismaClient singleton), pick.ts
  utils/             catchAsync, sendResponse, s3 (multer upload), mailSender, smsSender, otp helpers
prisma/
  schema/            Multi-file Prisma schema (entry: schema.prisma, holds generator + User/Auth/Role)
  migrations/        SQL migrations
  seeds/             badge, category, keyword, user seeds (index.ts is the entry)
generated/prisma/    Generated Prisma client (output of `prisma generate`) — import from here
types/express/       Express request type augmentation
public/              Static files served by Express
```

## Module layout

Each `src/modules/<name>/` follows:

| File | Role |
|------|------|
| `<name>.rout.ts` | Route definitions and middleware chain (some use `.route.ts` / `.routes.ts`) |
| `<name>.controler.ts` / `.controller.ts` | Thin handlers wrapped in `catchAsync`, reply via `sendResponse` (both spellings exist) |
| `<name>.service.ts` | Business logic and Prisma access |
| `<name>.validator.ts` | express-validator chains (paired with `req_validator()`) |
| `<name>.interface.ts` | Types (optional) |

Modules: auth, user, ConnectAccount, chat, messages, notification, settings, category, brand, material, size, keyword, product, offer, favourite, cart, order, payments, wallet, return, review, question, folow, donation, clothDonation, shipment, package, parcelSuggestion, sellCountries, assistentSell, dashboard, otp.

Quirks:
- `offer` has only a service (no router); offer routes live in `product`.
- `meterial/` is an empty typo directory; the real one is `material/`.
- `package`, `otp` and `wallet` have no import in `routs.ts` at the time of writing — verify before assuming their routes are mounted.

## Prisma schema files (`prisma/schema/`)

- `schema.prisma` — generator, User, Auth, Role, Notification, Setting
- `product` — Product, Cart, Offer, Question, BundleDiscount
- `order` — Order, OrderItem, SellDonation, ExtraDonation, cancel enums
- `payment` — Payment, Refund
- `wallet`, `shipment`, `return`, `review`, `folow`, `badge`, `assistentSell`
- `donation` — DirectDonation, ClothDonation
- `catalog` — Category, Brand, Material, Size, Keyword, ParcelSuggestion
- `message` — Chat, Message
- `roleExtra` — CharitableOrganization, CharityShop, EcoFriendlyStore, Celebrity, Ambassador, ProfessionalSeller
