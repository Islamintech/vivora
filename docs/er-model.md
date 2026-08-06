# Vivora - ER model

> To build the diagram without typing 10 collections in by hand, run
> `docs/er-model.mongo.js` and reverse-engineer the database it creates.
> See [Importing into Moon Modeler](#importing-into-moon-modeler) at the bottom.

Everything below is taken from the Mongoose schemas in `backend/src/schemas/`
and cross-checked against the live `restaurant-platform` database, so the types
are what Mongo actually stores, not just what the decorators declare.

10 collections. `_id` is `objectId NN` on every one of them and is left out of
the field tables. Every collection uses `@Schema({ timestamps: true })`, so
`createdAt` and `updatedAt` are `date NN` everywhere and are also left out.

> **Read this before drawing the relations.** Most of the foreign keys are
> stored as **strings**, not ObjectIds - see [Reference types](#reference-types).
> Draw the relationships anyway; just set the column type to `string` where the
> table says so, or the model will not describe the real data.

---

## users

The login account. A restaurant owner, one of their staff, or the platform's
super admin.

| Field | Type | NN | Default | Notes |
|---|---|---|---|---|
| name | string | NN | - | |
| email | string | NN | - | unique, lowercased |
| password | string | NN | - | bcrypt hash |
| role | enum | NN | RESTAURANT_ADMIN | SUPER_ADMIN, RESTAURANT_ADMIN, STAFF |
| restaurantId | string | | null | -> restaurants; null for SUPER_ADMIN |
| isActive | bool | NN | true | |

Indexes: `restaurantId`, `role`

## restaurants

One tenant. Everything else in the system hangs off this.

| Field | Type | NN | Default | Notes |
|---|---|---|---|---|
| name | string | NN | - | |
| slug | string | NN | - | unique; the public URL `/{slug}` |
| ownerId | string | | null | -> users |
| description | string | | '' | |
| address | string | | '' | |
| phone | string | | '' | |
| logo | string | | '' | uploaded image URL |
| coverImage | string | | '' | wide header photo on the customer menu |
| currency | string | | 'KRW' | |
| telegramChatId | string | | '' | staff alert group |
| printerEnabled | bool | | false | drives the local print-agent |
| printerIp | string | | '' | |
| printerPort | int | | 9100 | |
| openingTime | string | | '09:00' | "HH:mm" in `timezone` |
| closingTime | string | | '22:00' | <= openingTime means it runs past midnight |
| alwaysOpen | bool | | true | skips the hours check |
| timezone | string | | 'Asia/Seoul' | IANA zone |
| isActive | bool | | true | suspend toggle, separate from `status` |
| status | enum | NN | PENDING_REVIEW | PENDING_REVIEW, APPROVED, REJECTED |
| rejectionReason | string | | '' | shown to the owner |
| reviewedAt | date | | null | |

Indexes: `ownerId`, `(isActive, createdAt-)`, `(status, createdAt-)`

## menucategories

| Field | Type | NN | Default | Notes |
|---|---|---|---|---|
| restaurantId | string | NN | - | -> restaurants |
| name | string | NN | - | Uzbek original, canonical |
| translations | object | | {} | keyed by language: `{ en: { name }, ru: …, ko: … }` |
| order | int | | 0 | display order |
| isActive | bool | | true | |

Indexes: `(restaurantId, order)`, `(restaurantId, isActive)`

## menuitems

| Field | Type | NN | Default | Notes |
|---|---|---|---|---|
| restaurantId | string | NN | - | -> restaurants |
| categoryId | string | NN | - | -> menucategories |
| name | string | NN | - | Uzbek original; kitchen tickets read this |
| description | string | | '' | |
| translations | object | | {} | `{ en: { name, description }, ru: …, ko: … }` |
| price | double | NN | - | min 0 |
| imageUrl | string | | '' | first of `images`, kept for older read paths |
| images | array | | [] | array of string |
| allergens | array | | [] | array of string |
| tags | array | | [] | array of string |
| isAvailable | bool | | true | |
| isPopular | bool | | false | |
| trackQuantity | bool | | false | when true, `quantity` is portions prepped today |
| quantity | int | | 0 | min 0; hits 0 -> auto unavailable |

Indexes: `(restaurantId, categoryId)`, `(restaurantId, isAvailable)`

## tables

| Field | Type | NN | Default | Notes |
|---|---|---|---|---|
| restaurantId | string | NN | - | -> restaurants |
| number | int | NN | - | |
| name | string | NN | - | |
| qrCodeDataUrl | string | | '' | generated QR, base64 data URL |
| capacity | int | | 4 | |
| isActive | bool | | true | |

Indexes: **unique** `(restaurantId, number)`, `(restaurantId, isActive)`

## tablesessions

One dine-in visit - the running tab. Opened on the first scan, closed when the
bill is settled.

| Field | Type | NN | Default | Notes |
|---|---|---|---|---|
| restaurantId | objectId | NN | - | -> restaurants |
| tableId | objectId | NN | - | -> tables |
| tableNumber | int | NN | - | denormalized for the dashboard |
| status | enum | NN | OPEN | OPEN, CLOSED |
| totalAmount | double | | 0 | snapshotted on close; live while OPEN |
| lastOrderAt | date | | now | |
| closedAt | date | | null | |

Indexes: `(restaurantId, status)`, `(restaurantId, tableNumber, status)`,
**unique partial** `tableId` where `status = OPEN` - at most one open tab per
table, so concurrent orders cannot split one visit into two.

## orders

| Field | Type | NN | Default | Notes |
|---|---|---|---|---|
| restaurantId | string | NN | - | -> restaurants |
| tableId | objectId | | null | -> tables; null for a phone/collection order |
| sessionId | objectId | | null | -> tablesessions; null for pre-sessions orders |
| tableNumber | int | | null | |
| items | array | NN | - | array of embedded **OrderItem**, below |
| status | enum | NN | PENDING | PENDING, PREPARING, READY, SERVED, CANCELLED |
| orderType | enum | NN | DINE_IN | DINE_IN, TAKE_OUT |
| totalAmount | double | NN | - | min 0 |
| customerNote | string | | '' | |
| language | string | | 'en' | language the guest ordered in |
| customerName | string | | '' | phone orders |
| customerPhone | string | | '' | phone orders |
| scheduledFor | date | | null | when the caller said they'd arrive |
| isPaid | bool | | false | staff tap on the kitchen board |
| paidAt | date | | null | |
| servedAt | date | | null | own stamp; `updatedAt` moves on any edit |

Indexes: `(restaurantId, status)`, `(restaurantId, isPaid, createdAt-)`,
`(restaurantId, createdAt-)`, `(tableId, createdAt-)`, `sessionId`

### OrderItem (embedded in `orders.items`)

Not a collection. In Moon Modeler make it a nested/embedded object under
`items`, the way an array of documents is drawn.

| Field | Type | NN | Notes |
|---|---|---|---|
| menuItemId | objectId | NN | -> menuitems |
| name | string | NN | copied at order time, so later menu edits don't rewrite history |
| price | double | NN | likewise a snapshot |
| quantity | int | NN | |
| notes | string | | per-item request |

## feedbacks

| Field | Type | NN | Default | Notes |
|---|---|---|---|---|
| restaurantId | string | NN | - | -> restaurants |
| orderId | objectId | | null | -> orders; always null in practice today |
| rating | int | NN | - | 1-5 |
| comment | string | | '' | |
| language | string | | 'en' | |
| tableNumber | int | | 0 | |

Indexes: `(restaurantId, createdAt-)`

## billinginvoices

The 0.3% monthly service fee.

| Field | Type | NN | Default | Notes |
|---|---|---|---|---|
| restaurantId | string | NN | - | -> restaurants |
| period | string | NN | - | billing month, 'YYYY-MM' |
| revenue | double | NN | - | non-cancelled order value in the period |
| feeRate | double | NN | - | rate snapshot, e.g. 0.003 |
| amountDue | double | NN | - | min 0 |
| currency | string | | 'KRW' | |
| status | enum | NN | PENDING | PENDING, AWAITING_REVIEW, PAID |
| paidReportedAt | date | | null | owner reported the transfer |
| confirmedAt | date | | null | super admin confirmed receipt |

Indexes: **unique** `(restaurantId, period)`, `(period, status)`

## errorlogs

| Field | Type | NN | Default | Notes |
|---|---|---|---|---|
| restaurantId | objectId | | null | -> restaurants; null for platform-level errors |
| level | enum | NN | ERROR | ERROR, WARN, INFO |
| message | string | NN | - | |
| stack | string | | '' | |
| context | string | | '' | |
| meta | object | | {} | free-form |

Indexes: `createdAt-`, `(restaurantId, createdAt-)`

---

## Relationships

| # | Parent | Child | Foreign key | Cardinality | Optional |
|---|---|---|---|---|---|
| 1 | restaurants | users | users.restaurantId | 1 : N | yes (super admin has none) |
| 2 | users | restaurants | restaurants.ownerId | 1 : 1 | yes |
| 3 | restaurants | menucategories | menucategories.restaurantId | 1 : N | no |
| 4 | restaurants | menuitems | menuitems.restaurantId | 1 : N | no |
| 5 | menucategories | menuitems | menuitems.categoryId | 1 : N | no |
| 6 | restaurants | tables | tables.restaurantId | 1 : N | no |
| 7 | restaurants | tablesessions | tablesessions.restaurantId | 1 : N | no |
| 8 | tables | tablesessions | tablesessions.tableId | 1 : N | no (1:1 while OPEN) |
| 9 | restaurants | orders | orders.restaurantId | 1 : N | no |
| 10 | tables | orders | orders.tableId | 1 : N | yes (phone orders) |
| 11 | tablesessions | orders | orders.sessionId | 1 : N | yes (legacy orders) |
| 12 | menuitems | orders.items[] | items[].menuItemId | 1 : N | no |
| 13 | restaurants | feedbacks | feedbacks.restaurantId | 1 : N | no |
| 14 | orders | feedbacks | feedbacks.orderId | 1 : N | yes (unused today) |
| 15 | restaurants | billinginvoices | billinginvoices.restaurantId | 1 : N | no |
| 16 | restaurants | errorlogs | errorlogs.restaurantId | 1 : N | yes |

`restaurants` is the hub: 7 of the 16 relations start there. Relations 2 and 8
are the only non-plain-1:N shapes - a restaurant has exactly one owner, and a
table has at most one OPEN session at a time (enforced by the partial unique
index) even though it accumulates many closed ones.

## Reference types

The schemas declare most foreign keys as `Types.ObjectId` with a `ref`, but
Mongoose treats `@Prop({ type: Types.ObjectId })` as **Mixed** and does not cast
the value, so whatever the resolver passed in - a string from a GraphQL
variable - is what gets stored. Verified against the live database:

| Field | Declared | Actually stored |
|---|---|---|
| users.restaurantId | ObjectId ref | **string** |
| restaurants.ownerId | ObjectId ref | **string** |
| menucategories.restaurantId | ObjectId ref | **string** |
| menuitems.restaurantId / categoryId | ObjectId ref | **string** |
| tables.restaurantId | ObjectId ref | **string** |
| feedbacks.restaurantId | ObjectId ref | **string** |
| billinginvoices.restaurantId | plain string | **string** |
| tablesessions.restaurantId / tableId | `SchemaTypes.ObjectId` | objectId |
| orders.tableId / sessionId | `SchemaTypes.ObjectId` | objectId |
| orders.restaurantId | ObjectId ref | **string** |
| orders.items[].menuItemId | inside a Mixed array | objectId |

The fields typed with `SchemaTypes.ObjectId` are the ones Mongoose does cast -
that is exactly why those two schemas use it. This is why aggregation `$match`
stages on `restaurantId` must compare against strings.

## Importing into Moon Modeler

Moon Modeler builds a MongoDB model by reverse-engineering a live database, so
the quickest route is to give it one that already looks like this model.
`docs/er-model.mongo.js` creates exactly that.

1. Run the script. It only ever writes to a database called `vivora_ermodel`,
   drops that database first so re-running is safe, and never touches
   `restaurant-platform`.

   With mongosh:

   ```
   mongosh "mongodb://localhost:27017" --file docs/er-model.mongo.js
   ```

   Without mongosh: open MongoDB Compass, connect, open the `_MONGOSH` tab at
   the bottom, and paste the file's contents in.

2. In Moon Modeler: **File -> Reverse engineer** (or *Import from database*),
   connect to the same server, and pick `vivora_ermodel`. All 10 collections
   come in with their fields, types, required flags and indexes, plus the
   embedded `items[]` document under `orders`.

3. Draw the 16 relations from the table above by hand. No MongoDB tool records
   foreign keys - there is nothing in the database for an importer to read - so
   this part is manual in any workflow.

4. Drop `vivora_ermodel` when you're done; the model lives in the Moon Modeler
   project file from then on.

Each collection carries a `$jsonSchema` validator and one realistic sample
document, since Moon Modeler infers types from sampled documents as well as
from the validator. The sample documents use the real stored types, strings
included, so the imported model matches the section above.

## Note on the database

The live database also contains an empty `member` collection with 0 documents.
It is not part of this model - nothing in the codebase reads or writes it, and
it can be dropped.
