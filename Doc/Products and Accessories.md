# Products & Accessories Documentation

## Table of Contents

1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [API Architecture](#api-architecture)
4. [Products Module](#products-module)
5. [Accessories Module](#accessories-module)
6. [Business Logic](#business-logic)
7. [Calculations & Analytics](#calculations--analytics)
8. [Security & Access Control](#security--access-control)
9. [API Reference](#api-reference)

---

## Overview

### Purpose

This documentation covers the **Products** and **Accessories** modules of the Multi-Company Filter & AC Management System. These modules handle inventory management, stock tracking, and related business operations for water filters, air conditioners, and their accessories.

### Key Features

- Multi-company data isolation
- Role-based access control (Developer, Manager, Employee)
- Inventory tracking and stock management
- Supplier relationship management
- Product-Accessory relationships
- Low stock alerts and analytics
- Comprehensive statistics and reporting

### Technology Stack

- **Database**: PostgreSQL with Prisma ORM
- **Backend**: Node.js with Fastify
- **Validation**: Custom schema validation
- **Authentication**: JWT-based authentication

---

## Database Schema

### Products Table (`products`)

```prisma
model Product {
  id         Int     @id @default(autoincrement())
  name       String  @db.VarChar(255)
  category   String  @db.VarChar(100)
  price      Decimal @db.Decimal(10, 2)
  stock      Int     @default(0)
  supplierId Int
  companyId  Int
}
```

**Columns:**

- `id` - Primary key, auto-increment
- `name` - Product name (2-255 characters)
- `category` - Product category (e.g., "فلاتر المياه", "تكييفات")
- `price` - Product price (decimal with 2 decimal places)
- `stock` - Current stock quantity (integer, default: 0)
- `supplierId` - Foreign key to Supplier
- `companyId` - Foreign key to Company

**Relations:**

- `company` - Belongs to Company (Cascade delete)
- `supplier` - Belongs to Supplier (Restrict delete)
- `productAccessories` - Many-to-many with Accessories
- `maintenances` - One-to-many with Maintenance
- `invoiceItems` - One-to-many with InvoiceItem

**Indexes:**

- `companyId` - For company-specific queries
- `supplierId` - For supplier filtering
- `category` - For category-based searches

---

### Accessories Table (`accessories`)

```prisma
model Accessory {
  id         Int     @id @default(autoincrement())
  name       String  @db.VarChar(255)
  category   String  @db.VarChar(100)
  price      Decimal @db.Decimal(10, 2)
  stock      Int     @default(0)
  supplierId Int
  companyId  Int
}
```

**Columns:**

- `id` - Primary key, auto-increment
- `name` - Accessory name (2-255 characters)
- `category` - Accessory category (e.g., "فلاتر المياه", "تكييفات")
- `price` - Accessory price (decimal with 2 decimal places)
- `stock` - Current stock quantity (integer, default: 0)
- `supplierId` - Foreign key to Supplier
- `companyId` - Foreign key to Company

**Relations:**

- `company` - Belongs to Company (Cascade delete)
- `supplier` - Belongs to Supplier (Restrict delete)
- `productAccessories` - Many-to-many with Products
- `invoiceItems` - One-to-many with InvoiceItem

**Indexes:**

- `companyId` - For company-specific queries
- `supplierId` - For supplier filtering

---

### ProductAccessory Junction Table (`product_accessories`)

```prisma
model ProductAccessory {
  id          Int @id @default(autoincrement())
  productId   Int
  accessoryId Int

  @@unique([productId, accessoryId])
}
```

**Purpose:** Links products with their compatible accessories

**Constraints:**

- Unique combination of `productId` and `accessoryId`
- Cascade delete when product or accessory is deleted

---

## API Architecture

### Layer Structure

```
┌─────────────────────────────────────┐
│         Routes Layer                │
│  (HTTP endpoints, middleware)       │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│       Controller Layer              │
│  (Request/Response handling)        │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│        Service Layer                │
│  (Business logic, validation)       │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Repository Layer               │
│  (Database operations)              │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│         Database (Prisma)           │
└─────────────────────────────────────┘
```

### File Organization

**Products Module:**

```
products/
├── products.routes.js       # Route definitions
├── products.controller.js   # HTTP handlers
├── products.service.js      # Business logic
├── products.repository.js   # Database queries
├── products.schema.js       # Validation schemas
└── products.calculations.js # Analytics functions
```

**Accessories Module:**

```
accessories/
├── accessories.routes.js       # Route definitions
├── accessories.controller.js   # HTTP handlers
├── accessories.service.js      # Business logic
├── accessories.repository.js   # Database queries
├── accessories.schema.js       # Validation schemas
└── accessories.calculations.js # Analytics functions
```

---

## Products Module

### Routes (`products.routes.js`)

#### GET /api/products

**Description:** Get all products with optional filters

**Access:** All authenticated users

**Middleware:**

- `authenticate` - Verify JWT token
- `checkCompanyAccess()` - Filter by company

**Query Parameters:**

- `search` (string) - Search in name/category
- `category` (string) - Filter by category
- `lowStock` (boolean) - Show low stock items only
- `status` (string) - Filter by status: "available", "lowStock", "outOfStock"

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "فلتر مياه 7 مراحل",
      "category": "فلاتر المياه",
      "price": 3500.00,
      "stock": 50,
      "supplierId": 1,
      "companyId": 1,
      "supplier": {
        "id": 1,
        "name": "مورد الفلاتر المصرية"
      },
      "company": {
        "id": 1,
        "name": "شركة الندى للفلاتر"
      },
      "productAccessories": [...]
    }
  ],
  "count": 1
}
```

---

#### GET /api/products/search

**Description:** Search products by name or category

**Access:** All authenticated users

**Query Parameters:**

- `q` (string, required) - Search term (minimum 2 characters)

**Response:**

```json
{
  "success": true,
  "data": [...],
  "count": 5
}
```

**Validation:**

- Search term must be at least 2 characters
- Returns 400 error if validation fails

---

#### GET /api/products/categories

**Description:** Get all unique product categories

**Access:** All authenticated users

**Response:**

```json
{
  "success": true,
  "data": ["فلاتر المياه", "تكييفات"]
}
```

---

#### GET /api/products/stats

**Description:** Get products statistics

**Access:** Manager, Developer

**Response:**

```json
{
  "success": true,
  "data": {
    "totalProducts": 3,
    "totalStock": 155,
    "averagePrice": 4833.33,
    "lowStockCount": 1,
    "outOfStockCount": 0
  }
}
```

---

#### GET /api/products/low-stock

**Description:** Get low stock products

**Access:** Manager, Developer

**Query Parameters:**

- `threshold` (number, optional) - Stock threshold (default: 10)

**Response:**

```json
{
  "success": true,
  "data": [...],
  "count": 2
}
```

---

#### GET /api/products/:id

**Description:** Get product by ID with full details

**Access:** All authenticated users

**URL Parameters:**

- `id` (number, required) - Product ID

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "فلتر مياه 7 مراحل",
    "category": "فلاتر المياه",
    "price": 3500.0,
    "stock": 50,
    "supplier": {
      "id": 1,
      "name": "مورد الفلاتر المصرية",
      "email": "supplier1@example.com",
      "phone": "01555123456"
    },
    "productAccessories": [
      {
        "accessory": {
          "id": 1,
          "name": "شمعة فلتر",
          "price": 150.0,
          "stock": 200
        }
      }
    ]
  }
}
```

**Errors:**

- 404: Product not found or access denied

---

#### POST /api/products

**Description:** Create new product

**Access:** Manager, Developer

**Request Body:**

```json
{
  "name": "فلتر مياه 5 مراحل",
  "category": "فلاتر المياه",
  "price": 2500.0,
  "stock": 75,
  "supplierId": 1,
  "companyId": 1,
  "relatedItems": [1, 2]
}
```

**Validation Rules:**

- `name` - Required, 2-255 characters
- `category` - Required, 2-100 characters
- `price` - Required, non-negative number
- `stock` - Optional, non-negative integer (default: 0)
- `supplierId` - Required, positive integer
- `companyId` - Optional for developers, auto-set for managers
- `relatedItems` - Optional array of accessory IDs

**Business Rules:**

- Employees cannot create products
- Manager can only create for their company
- Supplier must exist and belong to same company (for managers)
- Product name must be unique within company
- Related accessories are linked automatically

**Response:**

```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {...}
}
```

**Errors:**

- 400: Validation error or company ID required
- 403: Insufficient permissions
- 404: Supplier not found
- 409: Product name already exists

---

#### PUT /api/products/:id

**Description:** Update product

**Access:** Manager, Developer

**Request Body:** (All fields optional)

```json
{
  "name": "فلتر مياه 7 مراحل محدث",
  "category": "فلاتر المياه",
  "price": 3600.0,
  "stock": 45,
  "supplierId": 1,
  "relatedItems": [1, 2, 3]
}
```

**Business Rules:**

- Employees cannot update products
- Manager can only update products in their company
- Name uniqueness checked if changed
- Supplier validation if changed
- Related accessories are replaced (not merged)

**Response:**

```json
{
  "success": true,
  "message": "Product updated successfully",
  "data": {...}
}
```

**Errors:**

- 403: Insufficient permissions or wrong company
- 404: Product or supplier not found
- 409: Product name already exists

---

#### PATCH /api/products/:id/stock

**Description:** Update only product stock

**Access:** Manager, Developer

**Request Body:**

```json
{
  "stock": 100
}
```

**Validation:**

- `stock` - Required, non-negative integer

**Response:**

```json
{
  "success": true,
  "message": "Stock updated successfully",
  "data": {...}
}
```

---

#### DELETE /api/products/:id

**Description:** Delete product

**Access:** Developer only

**Business Rules:**

- Only developers can delete products
- Cannot delete if used in any invoices
- Product-accessory relations are deleted first

**Response:**

```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

**Errors:**

- 403: Only developers can delete
- 400: Product is used in invoices

---

### Service Layer (`products.service.js`)

#### getAllProducts(prisma, currentUser, filters)

**Purpose:** Retrieve all products with filtering

**Parameters:**

- `prisma` - Prisma client instance
- `currentUser` - User object with role and companyId
- `filters` - Object with search, category, lowStock, status

**Logic:**

- Developers see all products (no company filter)
- Managers and employees see only their company's products
- Applies search and status filters

**Returns:** Array of product objects with relations

---

#### getProductById(prisma, id, currentUser)

**Purpose:** Get single product by ID

**Authorization:**

- Developers can access any product
- Others can only access products in their company

**Returns:** Product object or throws 404 error

---

#### createProduct(prisma, data, currentUser)

**Purpose:** Create new product with validation

**Validation Steps:**

1. Check role permissions (employee blocked)
2. Determine target company ID
3. Validate supplier exists and belongs to company
4. Check for duplicate product name
5. Create product
6. Link related accessories if provided

**Returns:** Created product with full relations

---

#### updateProduct(prisma, id, data, currentUser)

**Purpose:** Update existing product

**Validation Steps:**

1. Check role permissions
2. Verify product exists and access
3. Check name uniqueness if changed
4. Validate supplier if changed
5. Update product data
6. Replace related accessories if provided

**Returns:** Updated product with full relations

---

#### deleteProduct(prisma, id, currentUser)

**Purpose:** Delete product with safety checks

**Safety Checks:**

1. Only developers allowed
2. Check for invoice usage
3. Delete product-accessory relations first
4. Delete product

**Returns:** Success object

---

### Repository Layer (`products.repository.js`)

#### findAll(prisma, companyId, filters)

**Purpose:** Query products with filters

**Filters Applied:**

- Company ID (if provided)
- Search (name or category, case-insensitive)
- Category (exact match)
- Low stock (stock <= 10)
- Status-based stock filters

**Includes:**

- Supplier (id, name)
- Company (id, name)
- Product accessories with accessory details

**Ordering:** Descending by ID (newest first)

---

#### findById(prisma, id, companyId)

**Purpose:** Query single product with full details

**Includes:**

- Supplier with contact info
- Company details
- Product accessories with full accessory data

---

#### searchByName(prisma, searchTerm, companyId)

**Purpose:** Search products by name or category

**Features:**

- Case-insensitive search
- Searches in both name and category
- Limited to 50 results
- Ordered alphabetically

---

#### getCategories(prisma, companyId)

**Purpose:** Get distinct categories

**Returns:** Array of unique category strings, sorted alphabetically

---

#### getStats(prisma, companyId)

**Purpose:** Calculate aggregate statistics

**Calculations:**

- Total product count
- Total stock sum
- Average price
- Low stock count (stock > 0 and <= 10)
- Out of stock count (stock = 0)

**Uses:** Promise.all for parallel queries

---

#### findLowStock(prisma, companyId, threshold)

**Purpose:** Find products below stock threshold

**Ordering:** Ascending by stock (lowest first)

---

#### findByNameAndCompany(prisma, name, companyId, excludeId)

**Purpose:** Check for duplicate product names

**Features:**

- Case-insensitive name comparison
- Company-specific check
- Option to exclude specific ID (for updates)

---

#### create(prisma, data)

**Purpose:** Insert new product

**Includes in response:**

- Supplier summary
- Company summary

---

#### update(prisma, id, data)

**Purpose:** Update product fields

---

#### deleteById(prisma, id)

**Purpose:** Delete product record

---

#### linkAccessories(prisma, productId, accessoryIds)

**Purpose:** Create product-accessory relationships

**Features:**

- Batch creation with createMany
- skipDuplicates option to prevent errors

---

### Validation Schema (`products.schema.js`)

#### createProductSchema

**Fields:**

- `name` - String, required, 2-255 chars
- `category` - String, required, 2-100 chars
- `price` - Number, required, >= 0
- `stock` - Number, optional, integer >= 0
- `supplierId` - Number, required, positive integer
- `companyId` - Number, optional, positive integer
- `relatedItems` - Array, optional, positive integers

#### updateProductSchema

Same as create but all fields optional

#### updateStockSchema

**Fields:**

- `stock` - Number, required, integer >= 0

#### productIdSchema

**Fields:**

- `id` - Number, required, positive integer

---

## Accessories Module

### Routes (`accessories.routes.js`)

#### GET /api/accessories

**Description:** Get all accessories with optional filters

**Access:** All authenticated users

**Query Parameters:**

- `search` (string) - Search in name
- `lowStock` (boolean) - Show low stock items only
- `status` (string) - Filter by status: "available", "lowStock", "outOfStock"

**Response:** Same structure as products

---

#### GET /api/accessories/search

**Description:** Search accessories by name

**Access:** All authenticated users

**Query Parameters:**

- `q` (string, required) - Search term (minimum 2 characters)

---

#### GET /api/accessories/stats

**Description:** Get accessories statistics

**Access:** Manager, Developer

**Response:**

```json
{
  "success": true,
  "data": {
    "totalAccessories": 3,
    "totalStock": 350,
    "averagePrice": 250.0,
    "lowStockCount": 0,
    "outOfStockCount": 0
  }
}
```

---

#### GET /api/accessories/low-stock

**Description:** Get low stock accessories

**Access:** Manager, Developer

**Query Parameters:**

- `threshold` (number, optional) - Stock threshold (default: 20)

---

#### GET /api/accessories/:id

**Description:** Get accessory by ID with full details

**Access:** All authenticated users

---

#### POST /api/accessories

**Description:** Create new accessory

**Access:** Manager, Developer

**Request Body:**

```json
{
  "name": "شمعة فلتر",
  "category": "فلاتر المياه",
  "price": 150.0,
  "stock": 200,
  "supplierId": 1,
  "companyId": 1
}
```

**Validation Rules:**

- `name` - Required, 2-255 characters
- `category` - Optional, 2-100 characters
- `price` - Required, non-negative number
- `stock` - Optional, non-negative integer (default: 0)
- `supplierId` - Required, positive integer
- `companyId` - Optional for developers

---

#### PUT /api/accessories/:id

**Description:** Update accessory

**Access:** Manager, Developer

---

#### PATCH /api/accessories/:id/stock

**Description:** Update only accessory stock

**Access:** Manager, Developer

---

#### DELETE /api/accessories/:id

**Description:** Delete accessory

**Access:** Developer only

**Business Rules:**

- Cannot delete if used in invoices
- Cannot delete if linked to products

---

### Service Layer (`accessories.service.js`)

Functions mirror the products service with these differences:

#### Key Differences:

1. **Low stock threshold:** 20 for accessories vs 10 for products
2. **Category:** Optional field for accessories
3. **Deletion checks:** Also checks product-accessory links

#### getAllAccessories(prisma, currentUser, filters)

Same logic as products

#### getAccessoryById(prisma, id, currentUser)

Same authorization logic

#### createAccessory(prisma, data, currentUser)

**Validation:**

- Category is optional
- Name uniqueness per company
- Supplier validation

#### deleteAccessory(prisma, id, currentUser)

**Additional Check:**

- Checks `productAccessory` table for links
- Prevents deletion if linked to products

---

### Repository Layer (`accessories.repository.js`)

#### findAll(prisma, companyId, filters)

**Filter Differences:**

- Low stock threshold: 20 instead of 10
- Includes `productAccessories` with product details

#### findLowStock(prisma, companyId, threshold)

**Default threshold:** 20

**Other functions:** Mirror products repository

---

### Validation Schema (`accessories.schema.js`)

#### createAccessorySchema

**Differences from products:**

- `category` is optional (can be null)
- No `relatedItems` field

#### updateAccessorySchema

Same structure with all fields optional

---

## Business Logic

### Multi-Company Isolation

#### Role-Based Data Access

**Developer:**

- Can access ALL companies' data
- `targetCompanyId = null` in queries
- No company restrictions

**Manager:**

- Can only access their own company's data
- `targetCompanyId = currentUser.companyId`
- Cannot see other companies

**Employee:**

- Can only VIEW their company's data
- Cannot create, update, or delete
- Read-only access

---

### Stock Management

#### Stock Status Definitions

**Available:**

- Products: stock > 10
- Accessories: stock > 20

**Low Stock:**

- Products: 0 < stock <= 10
- Accessories: 0 < stock <= 20

**Out of Stock:**

- stock = 0

#### Stock Updates

- Only managers and developers can update stock
- Validation ensures non-negative integers
- Stock changes tracked implicitly (consider audit log)

---

### Supplier Validation

#### Business Rules:

1. Supplier must exist in database
2. For managers: Supplier must belong to same company
3. For developers: Any supplier allowed
4. Suppliers cannot be deleted if products/accessories exist (Restrict constraint)

---

### Product-Accessory Relationships

#### Linking Process:

1. Products can have multiple accessories
2. Accessories can belong to multiple products
3. Links created via `ProductAccessory` junction table
4. `relatedItems` array in create/update automatically creates links
5. Update operation REPLACES all links (not merge)

#### Example Usage:

```javascript
// Create product with accessories
{
  "name": "فلتر مياه 7 مراحل",
  "relatedItems": [1, 2] // Accessory IDs
}

// Update - replace all accessories
{
  "relatedItems": [1, 2, 3] // Old links deleted, new ones created
}

// Update - remove all accessories
{
  "relatedItems": [] // All links deleted
}
```

---

### Deletion Safety

#### Products:

1. Check if used in any `invoiceItems`
2. If yes: Reject deletion (400 error)
3. If no: Delete `productAccessories` first, then product

#### Accessories:

1. Check if used in any `invoiceItems`
2. Check if linked in `productAccessories`
3. If any exist: Reject deletion (400 error)
4. If clear: Delete accessory

**Rationale:** Preserve invoice integrity and prevent orphaned data

---

## Calculations & Analytics

### Products Calculations (`products.calculations.js`)

#### calculateTotalValue(products)

**Purpose:** Calculate total inventory value

**Formula:** `Σ(price × stock)`

**Returns:** Number (total value)

---

#### calculateAveragePrice(products)

**Purpose:** Get average product price

**Formula:** `Σ(price) / count`

**Returns:** Number (average)

---

#### calculateTotalStock(products)

**Purpose:** Sum all stock quantities

**Formula:** `Σ(stock)`

**Returns:** Number (total units)

---

#### getLowStockProducts(products, threshold = 10)

**Purpose:** Filter products below threshold

**Returns:** Array of low stock products

---

#### getOutOfStockProducts(products)

**Purpose:** Filter products with zero stock

**Returns:** Array of out-of-stock products

---

#### groupByCategory(products)

**Purpose:** Group products by category with aggregates

**Returns:**

```javascript
{
  "فلاتر المياه": {
    category: "فلاتر المياه",
    items: [...],
    totalStock: 125,
    totalValue: 437500,
    count: 2
  },
  "تكييفات": {
    category: "تكييفات",
    items: [...],
    totalStock: 30,
    totalValue: 255000,
    count: 1
  }
}
```

---

#### groupBySupplier(products)

**Purpose:** Group products by supplier

**Returns:** Similar structure with supplier info

---

#### calculateProfitability(product, costPercentage = 0.6)

**Purpose:** Estimate product profitability

**Assumptions:**

- Cost = price × 0.6 (60% of price)
- Profit = price - cost
- Profit margin = (profit / price) × 100

**Returns:**

```javascript
{
  cost: 2100.00,
  profit: 1400.00,
  profitMargin: 40.00,
  totalProfit: 70000.00  // profit × stock
}
```

---

#### calculateStockTurnover(product, soldQuantity, period = "month")

**Purpose:** Calculate inventory turnover rate

**Formula:**

```
Average Stock = (Current Stock + Sold Quantity) / 2
Turnover Rate = Sold Quantity / Average Stock
Annual Turnover = Turnover Rate × Period Multiplier
```

**Period Multipliers:**

- day: 365
- week: 52
- month: 12
- quarter: 4
- year: 1

**Returns:** Number (annualized turnover rate)

---

#### calculateReorderPoint(averageDailyUsage, leadTimeDays, safetyStock = 0)

**Purpose:** Calculate when to reorder

**Formula:**

```
Reorder Point = (Average Daily Usage × Lead Time Days) + Safety Stock
```

**Example:**

```javascript
calculateReorderPoint(5, 7, 10);
// Returns: 45 (reorder when stock reaches 45 units)
```

---

#### calculateEOQ(annualDemand, orderCost, holdingCost)

**Purpose:** Calculate economic order quantity

**Formula:**

```
EOQ = √((2 × Annual Demand × Order Cost) / Holding Cost)
```

**Returns:** Optimal order quantity

---

#### getStatisticsSummary(products)

**Purpose:** Comprehensive statistics overview

**Returns:**

```javascript
{
  totalProducts: 3,
  totalValue: 692500.00,
  totalStock: 155,
  averagePrice: 4833.33,
  lowStockCount: 1,
  outOfStockCount: 0,
  categoriesCount: 2,
  suppliersCount: 2
}
```

---

#### calculatePriceStatistics(products)

**Purpose:** Price distribution analysis

**Returns:**

```javascript
{
  min: 2500.00,
  max: 8500.00,
  average: 4833.33,
  median: 3500.00,
  total: 14500.00
}
```

---

#### calculateStockStatistics(products)

**Purpose:** Stock distribution analysis

**Returns:** Same structure as price statistics

---

#### getTopProductsByValue(products, limit = 10)

**Purpose:** Find highest value products

**Calculation:** price × stock

**Returns:** Sorted array with `totalValue` added

---

#### getTopProductsByStock(products, limit = 10)

**Purpose:** Find highest stock products

**Returns:** Sorted array by stock descending

---

#### calculateProductWithAccessoriesCost(product)

**Purpose:** Calculate total cost including accessories

**Returns:**

```javascript
{
  productValue: 175000.00,
  accessoriesValue: 50000.00,
  totalValue: 225000.00,
  accessoriesCount: 2
}
```

---

#### calculateStockHealthScore(product, optimalStock = 100, turnoverRate = 0)

**Purpose:** Assess inventory health (0-100 score)

**Scoring:**

- **Stock Level (0-40 points):**

  - 0 stock: 0 points
  - < 30% optimal: 10 points
  - < 50% optimal: 20 points
  - <= optimal: 40 points
  - <= 150% optimal: 30 points
  - > 150% optimal: 20 points

- **Turnover (0-30 points):**

  - > 12/year: 30 points
  - > 6/year: 25 points
  - > 3/year: 20 points
  - > 1/year: 10 points
  - < 1/year: 5 points

- **Value (0-30 points):**
  - Has value: 30 points
  - No value: 0 points

**Returns:** Number (0-100)

---

#### compareProductsPerformance(products, salesData = {})

**Purpose:** Comparative analysis across products

**Input salesData format:**

```javascript
{
  1: 50,  // Product ID 1 sold 50 units
  2: 30   // Product ID 2 sold 30 units
}
```

**Returns:**

```javascript
[
  {
    id: 1,
    name: "فلتر مياه 7 مراحل",
    category: "فلاتر المياه",
    price: 3500.0,
    stock: 50,
    sales: 50,
    revenue: 175000.0,
    stockValue: 175000.0,
    turnover: 12.5,
    profitability: {
      cost: 2100.0,
      profit: 1400.0,
      profitMargin: 40.0,
      totalProfit: 70000.0,
    },
  },
];
```

---

### Accessories Calculations (`accessories.calculations.js`)

**Note:** Accessories calculations are identical to products calculations with these naming differences:

- `calculateTotalValue(accessories)`
- `getLowStockAccessories(accessories, threshold = 10)`
- `getOutOfStockAccessories(accessories)`
- `groupByCategory(accessories)`
- `groupBySupplier(accessories)`
- etc.

**All formulas and logic remain the same.**

---

## Security & Access Control

### Authentication Middleware

#### authenticate

**Purpose:** Verify JWT token and extract user

**Process:**

1. Extract token from Authorization header
2. Verify JWT signature
3. Decode user information
4. Attach `request.user` object

**User object:**

```javascript
{
  id: 1,
  email: "manager@alnada.com",
  role: "manager",
  companyId: 1
}
```

---

### Authorization Middleware

#### authorize(roles)

**Purpose:** Restrict access by user role

**Usage:**

```javascript
authorize(["manager", "developer"]);
```

**Roles:**

- `developer` - Full system access
- `manager` - Company-level access
- `employee` - Read-only access

**Behavior:**

- Returns 403 if role not in allowed list

---

### Company Access Middleware

#### checkCompanyAccess()

**Purpose:** Enforce company isolation

**Logic:**
