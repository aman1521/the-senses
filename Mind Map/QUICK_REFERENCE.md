# E-Commerce Admin Dashboard - Quick Reference Guide

## 📚 Table of Contents

1. [Module Overview](#module-overview)
2. [Key Features by Module](#key-features-by-module)
3. [Business Logic Summary](#business-logic-summary)
4. [API Endpoints Reference](#api-endpoints-reference)
5. [Database Tables Reference](#database-tables-reference)
6. [Common Workflows](#common-workflows)
7. [Configuration Guide](#configuration-guide)

---

## 1. Module Overview

| Module | Purpose | Key Features | Priority |
|--------|---------|--------------|----------|
| **Dashboard** | Overview & Analytics | Stats, Charts, Recent Orders | ⭐⭐⭐⭐⭐ |
| **Products** | Product Management | CRUD, Pricing, Tax, Images | ⭐⭐⭐⭐⭐ |
| **Orders** | Order Processing | View, Edit, Status, Invoice | ⭐⭐⭐⭐⭐ |
| **Users** | Customer Management | View, Wallet, Rewards, Roles | ⭐⭐⭐⭐ |
| **Categories** | Product Organization | Hierarchical Categories | ⭐⭐⭐⭐ |
| **Coupons** | Discount Management | Create, Edit, Track Usage | ⭐⭐⭐⭐ |
| **Currency** | Multi-Currency | Exchange Rates, Conversion | ⭐⭐⭐⭐ |
| **Tax** | Tax Management | Country Rates, Overrides | ⭐⭐⭐⭐ |
| **Analytics** | Business Intelligence | Revenue, Reports, Charts | ⭐⭐⭐⭐ |
| **Rewards** | Loyalty Program | Points, Tiers, Campaigns | ⭐⭐⭐ |
| **Health Benefits** | Product Features | Benefits, Icons, Marketing | ⭐⭐⭐ |
| **Product Packs** | Bundle Products | Packs, Pricing, Inventory | ⭐⭐⭐ |
| **Invoices** | Invoice Management | Generate, Download, Email | ⭐⭐⭐⭐ |
| **Payments** | Payment Processing | Gateway, Status, Refunds | ⭐⭐⭐⭐⭐ |
| **Settings** | System Configuration | General, Email, SMS, Admin | ⭐⭐⭐⭐ |
| **Sessions** | User Tracking | Session Duration, Analytics | ⭐⭐⭐ |
| **Activity Log** | Action Tracking | User Actions, Timestamps | ⭐⭐⭐ |
| **Auth** | Security | Login, JWT, Password Reset | ⭐⭐⭐⭐⭐ |
| **Search** | Discovery | Global Search, Filters | ⭐⭐⭐⭐ |
| **UI/UX** | User Interface | Themes, Components, Responsive | ⭐⭐⭐⭐⭐ |

---

## 2. Key Features by Module

### Dashboard Module

```
✓ Real-time Statistics (Orders, Sales, Products, Users)
✓ Sales Revenue Trend Chart (Line Chart)
  - Time Periods: 7/14/30/60/90/180/365 days
  - Custom Date Range
  - View Modes: Daily/Weekly/Monthly
✓ Products Sold Chart (Bar Chart)
✓ Recent Orders Table (Latest 10)
✓ Percentage Change Indicators
✓ Multi-Currency Display
```

### Products Module

```
✓ Product CRUD Operations
✓ Product Types: Simple, Variable, Grouped
✓ Multi-Image Upload (5 images per product)
✓ SKU Generation & Management
✓ Category Assignment
✓ Health Benefits Association
✓ Key Ingredients Mapping
✓ FAQ Management (5 FAQs)
✓ Feature Cards with Images
✓ Regional Pricing Overrides
✓ Tax Rate Configuration
✓ Stock Management
✓ Bulk Operations
✓ Search & Filter
```

### Orders Module

```
✓ Order Listing with Search & Filter
✓ Order Details View
✓ Status Management (Pending → Processing → Delivered)
✓ Payment Status Tracking
✓ PDF Invoice Generation
✓ Export to CSV/Excel
✓ Bulk Operations
✓ Multi-Currency Display
✓ Customer Information
✓ Product Line Items
✓ Pricing Breakdown (Subtotal, Tax, Total)
```

### Users Module

```
✓ Customer Listing
✓ User Details View
✓ Wallet Balance Management
✓ Reward Points Tracking
✓ Account Activation/Deactivation
✓ Email Verification Status
✓ Role Assignment
✓ Country & Currency Preferences
✓ Registration Date Tracking
```

### Currency Module

```
✓ 50+ Global Currencies Support
✓ Exchange Rate Management
✓ Base Currency: INR
✓ Automatic Conversion
✓ Currency Symbols & Formatting
✓ Enable/Disable Currencies
✓ Default Currency Selection
```

### Tax Module

```
✓ Country-Specific Tax Rates
✓ Product-Specific Tax Overrides
✓ Regional Tax Variations
✓ Tax-Inclusive/Exclusive Pricing
✓ Automatic Tax Calculation
✓ Tax Reporting
✓ Priority-Based Tax Resolution
```

---

## 3. Business Logic Summary

### Order Processing Flow

```
1. Customer places order
2. System checks inventory (stock availability)
3. Validates coupon (if applied)
4. Calculates tax (based on customer country)
5. Calculates total (subtotal + tax - discount)
6. Processes payment
7. Confirms order
8. Deducts inventory
9. Allocates reward points
10. Sends email notification
```

### Pricing Calculation

```javascript
// Step-by-step pricing calculation
1. base_price = Product.base_price (in INR)
2. sale_price = Product.sale_price || base_price
3. regional_price = check_regional_override(product_id, country_code)
4. converted_price = convert_currency(price, from_currency, to_currency)
5. tax_rate = get_tax_rate(product_id, country_code)
6. tax_amount = (converted_price × tax_rate) / 100
7. price_with_tax = converted_price + tax_amount
8. discount = apply_coupon(coupon_code, price_with_tax)
9. final_price = price_with_tax - discount
```

### Tax Calculation Priority

```
Priority Order (First match wins):
1. Product Regional Tax Override (ProductRegionalOverride table)
2. Regional Tax Rate (TaxCountry table)
3. Country Default Tax Rate (Country table)
4. Product Default Tax Rate (Product.tax_rate)
5. 0% (No tax)

Formula:
tax_amount = (base_price × tax_rate) / 100
price_with_tax = base_price + tax_amount
```

### Reward Points Allocation

```javascript
// Points calculation
order_points = (order_total / 100) × points_multiplier
product_bonus = sum(product.reward_points for each item)
tier_multiplier = user.tier.multiplier || 1.0
total_points = (order_points + product_bonus) × tier_multiplier

// Allocation
user.reward_points += total_points
log_reward_transaction(user_id, points, 'order_completion')
```

---

## 4. API Endpoints Reference

### Authentication APIs

```
POST   /api/auth/login              - User login
POST   /api/auth/logout             - User logout
POST   /api/auth/forgot-password    - Request password reset
POST   /api/auth/reset-password     - Reset password with token
GET    /api/auth/profile            - Get current user profile
PUT    /api/auth/profile            - Update user profile
```

### Dashboard APIs

```
GET    /api/dashboard/stats         - Get dashboard statistics
       Query: ?days=30 or ?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
       
GET    /api/dashboard/sales-chart   - Get sales chart data
       Query: ?days=30&view=daily (view: daily|weekly|monthly)
       
GET    /api/dashboard/top-products  - Get top selling products
       Query: ?limit=10&days=30
       
GET    /api/dashboard/recent-orders - Get recent orders
       Query: ?limit=10
```

### Product APIs

```
GET    /api/products                - List all products
       Query: ?page=1&limit=20&search=keyword&category_id=1
       
GET    /api/products/:id            - Get product details
POST   /api/products                - Create new product
PUT    /api/products/:id            - Update product
DELETE /api/products/:id            - Delete product

GET    /api/products/categories     - List all categories
POST   /api/products/regional-tax   - Set regional tax override
       Body: { product_id, country_code, tax_rate }
```

### Order APIs

```
GET    /api/orders                  - List all orders
       Query: ?page=1&limit=20&status=pending&search=keyword
       
GET    /api/orders/:id              - Get order details
PUT    /api/orders/:id              - Update order
DELETE /api/orders/:id              - Delete order
PUT    /api/orders/:id/status       - Update order status
       Body: { status: 'pending'|'processing'|'delivered'|'cancelled' }
```

### User APIs

```
GET    /api/users                   - List all users
GET    /api/users/:id               - Get user details
PUT    /api/users/:id               - Update user
DELETE /api/users/:id               - Delete user
PUT    /api/users/:id/wallet        - Update wallet balance
PUT    /api/users/:id/rewards       - Update reward points
```

### Currency APIs

```
GET    /api/currencies              - List all currencies
POST   /api/currencies              - Add new currency
PUT    /api/currencies/:id          - Update currency
DELETE /api/currencies/:id          - Delete currency
GET    /api/currencies/convert      - Convert amount
       Query: ?amount=100&from=INR&to=USD
```

### Tax APIs

```
GET    /api/tax/countries           - List tax rates by country
POST   /api/tax/countries           - Add country tax rate
PUT    /api/tax/countries/:id       - Update country tax rate
DELETE /api/tax/countries/:id       - Delete country tax rate
GET    /api/tax/calculate           - Calculate tax for product
       Query: ?product_id=1&country_code=IND
```

### Coupon APIs

```
GET    /api/coupons                 - List all coupons
GET    /api/coupons/:id             - Get coupon details
POST   /api/coupons                 - Create coupon
PUT    /api/coupons/:id             - Update coupon
DELETE /api/coupons/:id             - Delete coupon
POST   /api/coupons/validate        - Validate coupon code
       Body: { code, order_total, user_id }
```

### Analytics APIs

```
GET    /api/analytics/revenue       - Get revenue analytics
       Query: ?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&group_by=day|week|month
       
GET    /api/analytics/products      - Get product analytics
GET    /api/analytics/customers     - Get customer analytics
GET    /api/analytics/export        - Export analytics data
       Query: ?format=csv|pdf&type=revenue|orders|products
```

---

## 5. Database Tables Reference

### Core Tables

**admin_users** - Admin user accounts

```sql
id, username, email, password_hash, full_name, role, 
is_active, last_login, created_at, updated_at
```

**users** - Customer accounts

```sql
id, email, password_hash, full_name, phone, country_code,
preferred_currency, wallet_balance, reward_points, is_active,
email_verified, role, created_at, updated_at
```

**products** - Product catalog

```sql
id, name, slug, sku, description, short_description, category_id,
product_type, base_price, sale_price, base_currency, stock_quantity,
min_order_quantity, max_order_quantity, color_name, color_shade,
is_taxable, tax_rate, is_active, featured, is_grouped_product,
image1, image2, image3, image4, image5, reward_points,
created_at, updated_at
```

**categories** - Product categories

```sql
id, name, slug, description, parent_id, is_active,
display_order, created_at, updated_at
```

**orders** - Customer orders

```sql
id, order_number, user_id, total_amount, subtotal, tax_amount,
discount_amount, status, payment_status, payment_method,
shipping_address, billing_address, notes, created_at, updated_at
```

**order_items** - Order line items

```sql
id, order_id, product_id, quantity, price, tax_amount,
discount_amount, created_at
```

**coupons** - Discount coupons

```sql
id, code, discount_type, discount_value, min_order_amount,
max_discount, start_date, end_date, usage_limit, used_count,
is_active, created_at, updated_at
```

**currencies** - Currency definitions

```sql
id, code, name, symbol, exchange_rate, is_active,
created_at, updated_at
```

**tax_countries** - Tax rates by country

```sql
id, country_code, country_name, default_tax_rate, is_active,
created_at, updated_at
```

**product_regional_override** - Regional pricing/tax overrides

```sql
id, product_id, country_code, price_override, tax_rate_override,
use_country_default_tax, is_active, created_at, updated_at
```

**health_benefits** - Product health benefits

```sql
id, name, description, icon, is_active, created_at
```

**product_health_benefits** - Product-benefit mapping

```sql
product_id, health_benefit_id
```

**key_ingredients** - Product ingredients

```sql
id, name, slug, description, image_url, thumbnail_url,
is_active, created_at, updated_at
```

**product_key_ingredients** - Product-ingredient mapping

```sql
product_id, key_ingredient_id, display_order, created_at
```

---

## 6. Common Workflows

### Workflow 1: Creating a New Product

```
1. Navigate to Products → Add Product
2. Fill in basic information:
   - Product name
   - SKU (auto-generated or manual)
   - Description
   - Category
3. Set pricing:
   - Base price (INR)
   - Sale price (optional)
   - Tax settings
4. Upload images (up to 5)
5. Add health benefits (optional)
6. Add key ingredients (optional)
7. Add FAQs (optional)
8. Add feature cards (optional)
9. Set stock quantity
10. Save product
11. Configure regional pricing (if needed)
12. Activate product
```

### Workflow 2: Processing an Order

```
1. Navigate to Orders
2. Find order (search or filter)
3. Click "View" to see details
4. Verify order information
5. Update status:
   - Pending → Processing (when preparing)
   - Processing → Shipped (when dispatched)
   - Shipped → Delivered (when received)
6. Update payment status if needed
7. Generate invoice (PDF)
8. Send invoice to customer (email)
9. Track order completion
```

### Workflow 3: Setting Up Regional Pricing

```
1. Navigate to Products
2. Select product
3. Click "Regional Tax" action
4. Select country
5. Set tax rate override OR
   Check "Use country default tax"
6. Save configuration
7. Verify pricing calculation
```

### Workflow 4: Creating a Coupon

```
1. Navigate to Coupons → Add Coupon
2. Enter coupon code
3. Select discount type:
   - Percentage
   - Fixed amount
   - Free shipping
4. Set discount value
5. Set validity period (start/end dates)
6. Set usage limits:
   - Total usage limit
   - Per-user limit
7. Set minimum order amount
8. Set maximum discount cap
9. Activate coupon
10. Test coupon validation
```

### Workflow 5: Viewing Analytics

```
1. Navigate to Dashboard or Analytics
2. Select time period:
   - Preset (7/14/30/60/90/180/365 days)
   - Custom date range
3. Select view mode:
   - Daily
   - Weekly
   - Monthly
4. Review charts:
   - Revenue trend
   - Products sold
   - Order statistics
5. Export data (if needed):
   - PDF
   - CSV
   - Excel
```

---

## 7. Configuration Guide

### Frontend Configuration

**Environment Variables** (`.env`)

```bash
PORT=4600
DISABLE_ESLINT_PLUGIN=true
BROWSER=none
REACT_APP_API_URL=/api
```

**Proxy Configuration** (`package.json`)

```json
"proxy": "http://localhost:8800"
```

**Start Command**

```bash
npm start
# Runs on http://localhost:4600
```

### Backend Configuration

**Environment Variables** (`.env`)

```python
SECRET_KEY=your-secret-key-change-in-production
JWT_SECRET_KEY=jwt-secret-key-change-in-production
JWT_ACCESS_TOKEN_EXPIRES=24  # hours
DATABASE_URL=mysql+pymysql://user:password@host:port/database
```

**Database Connection**

```python
# Connection Pool Settings
POOL_SIZE = 10
MAX_OVERFLOW = 20
POOL_RECYCLE = 3600  # 1 hour
POOL_PRE_PING = True
CONNECT_TIMEOUT = 10  # seconds
READ_TIMEOUT = 30  # seconds
WRITE_TIMEOUT = 30  # seconds
```

**Start Command**

```bash
python pythonFlask_MySQL.py
# Runs on http://localhost:8800
```

### Database Setup

**Create Database**

```sql
CREATE DATABASE ecommerce_admin CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**Run Migrations** (if using Alembic)

```bash
alembic upgrade head
```

**Seed Data** (optional)

```bash
python seed_data.py
```

### Email Configuration (MSG91)

**Template IDs**

```
TEMPLATE_1: Revenue Alert
TEMPLATE_2: Test Email
TEMPLATE_3: Password Reset
```

**Configuration**

```python
MSG91_API_KEY=your-msg91-api-key
MSG91_SENDER_ID=your-sender-id
MSG91_ROUTE=4  # Transactional route
```

---

## 📊 Quick Stats

| Metric | Value |
|--------|-------|
| Total Modules | 20+ |
| Total Features | 200+ |
| API Endpoints | 50+ |
| Database Tables | 25+ |
| UI Components | 30+ |
| Supported Currencies | 50+ |
| Authentication | JWT (24h expiry) |
| Frontend Port | 4600 |
| Backend Port | 8800 |
| Database | MySQL |
| Frontend Framework | React 18.2.0 |
| Backend Framework | Flask (Python) |

---

## 🔗 Quick Links

- **Dashboard Analysis:** `DASHBOARD_ANALYSIS.md`
- **Functionality List:** `FUNCTIONALITY_LIST.md`
- **Mind Map:** `MINDMAP.md`
- **Quick Reference:** `QUICK_REFERENCE.md` (this file)

---

## 📝 Notes

- All prices are stored in base currency (INR) and converted on-the-fly
- Tax calculations follow a priority-based system
- Session tokens expire after 24 hours
- Connection pool maintains 10 active connections with 20 overflow
- All timestamps are stored in UTC
- Multi-tenancy features have been removed
- Dark/Light theme preference is stored in localStorage

---

**Document Version:** 1.0  
**Last Updated:** February 10, 2026  
**Maintained By:** Development Team
