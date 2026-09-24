# Requirements Document

## 1. Application Overview

**Application Name:** Temo-Thuo AI
**Subtitle:** Botswana's National Agricultural Operating System
**Prepared By:** Simon Vevongaune Keeja
**Organization:** SY-TECH AI SYSTEMS
**Document Reference:** SDRS-001, Version 1.0
**Version:** 1.0 (Web Application)
**Language Support:** English and Setswana

**Description:**
Temo-Thuo AI is a large-scale, responsive web application that serves as Botswana's unified national agricultural operating system. It connects farmers, veterinary officers, agricultural extension officers, feedlot operators, abattoirs, financial institutions, insurance providers, and government agencies across the full agricultural value chain. The platform integrates AI, IoT, GIS, cloud computing, and real-time analytics to improve livestock traceability, crop productivity, disease surveillance, marketplace operations, and national food security.

---

## 2. User Roles and Authentication

### 2.1 User Roles (RBAC)

1. **Farmer** — farm, livestock, crop, and marketplace management
2. **Veterinary Officer** — animal health, disease surveillance, vaccination, treatment
3. **Agricultural Extension Officer** — farmer support, inspections, advisory
4. **Feedlot Operator** — livestock procurement and feedlot management
5. **Abattoir Officer** — animal processing, traceability, Bio-Sentinel microchip recovery
6. **Insurance Officer / Claims Assessor** — insurance administration and claims
7. **Financial Institution Officer** — payments, financing, escrow
8. **Ministry Official (Ministry of Lands and Agriculture)** — national oversight, policy, reporting
9. **System Administrator** — full system administration, configuration, security
10. **Temo-Thuo AI Operations Team** — customer support, platform monitoring, maintenance

### 2.2 Authentication
- Login: email/password + OTP (WhatsApp/SMS)
- Role-based dashboard displayed after successful login
- Multi-Factor Authentication (MFA) required for admin accounts
- Account lockout after configurable failed login attempts
- New device login alerts
- Session management with configurable timeout

### 2.3 Registration
- User accounts created by System Administrator or via self-registration (Farmer role)
- Farmer self-registration requires National ID/Omang verification
- All other roles provisioned by System Administrator with role assignment

---

## 3. Page Structure and Functional Modules

### 3.1 Page Hierarchy

```
Temo-Thuo AI Web Application
├── Landing / Login Page
├── Role-Specific Dashboard (post-login)
├── Farmer Management (FRM)
├── Farm Management (FAM)
├── Livestock Management (LIV)
├── Bio-Sentinel Microchip Management (BIO)
├── Crop Management (CRM)
├── Crop-Guardian Sensor Management (CGS)
├── Veterinary Services (VET)
├── Device Asset Management System (DAMS)
├── IoT Management (IOT)
├── GIS Map
├── Digital Marketplace (MKT)
├── Insurance Management (INS)
├── Payment Management (PAY)
├── Reporting and Analytics (REP)
├── National Situation Room (NSR)
├── Administration Portal (ADM)
├── AI Insights Dashboard
├── Notifications Center
└── User Profile and Settings
```

---

### 3.2 Landing / Login Page
- Platform branding and description
- Email/password login form with OTP verification
- Language selector (English / Setswana)
- After login, redirect to role-specific dashboard

---

### 3.3 Role-Specific Dashboards (DASH)

Each role sees a dedicated dashboard upon login:

- **Farmer Dashboard:** farm profile summary, livestock count, crop fields, marketplace activity, upcoming vet visits, weather summary, notifications
- **Veterinary Dashboard:** upcoming visits, animals due for vaccination, disease cases, active outbreaks, recent treatments
- **Extension Officer Dashboard:** assigned farmers, upcoming inspections, farm status, advisory tasks
- **Marketplace Dashboard:** active listings, recent orders, pending orders, completed transactions, service bookings
- **Insurance Dashboard:** active policies, policies due renewal, open claims, approved/rejected claims, claims awaiting assessment
- **Admin Dashboard:** total users, active users online, system health, audit log activity, security alerts
- **AI Dashboard:** active AI alerts, disease risk map, crop health summary, livestock risk summary, yield forecasts, weather impact, national performance indicators
- **IoT Dashboard:** total connected devices, online/offline counts, communication failures, real-time device activity
- **GIS Dashboard:** interactive national map with all layers
- **Ministry/NSR Dashboard:** links to National Situation Room and national reporting

---

### 3.4 Farmer Management (FRM)

**Pages:** Farmer List, Create Farmer, View Farmer Profile, Edit Farmer Profile

**Functions:**
- Farmer registration: National ID/Omang, name, DOB, gender, mobile, email, address, district, village, GPS coordinates, language preference
- Unique Farmer ID auto-generation
- Farmer profile management: update contact info, change password, upload profile photo
- Farmer verification by authorized admin: National ID, mobile, farm ownership
- Farmer search: by Farmer ID, National ID, name, mobile, district, village
- Account status management: Active, Pending Verification, Suspended, Inactive
- Notifications: registration confirmation, verification result, profile changes, new device login

---

### 3.5 Farm Management (FAM)

**Pages:** Farm List, Create Farm, View Farm Profile, Edit Farm Profile, Farm Map View

**Functions:**
- Farm registration: Farmer ID, farm name, type, size (hectares), district, village, address, GPS coordinates, ownership type
- Unique Farm ID auto-generation
- Farm profile management: update info, upload farm photos
- Farm mapping: GPS coordinates displayed on interactive map, store farm boundaries
- Multiple farm ownership per farmer supported
- Farm search: by Farm ID, farm name, farmer, district, village
- Farm status management: Active, Pending Verification, Suspended, Archived
- Farm verification by authorized officers

---

### 3.6 Livestock Management (LIV)

**Pages:** Animal List, Register Animal, View Animal Profile, Edit Animal Profile, Animal Health Records, Animal Movements

**Functions:**
- Animal registration: Farm ID, Farmer ID, species, breed, sex, DOB/estimated age, coat colour, identification marks, Bio-Sentinel Microchip ID, ear tag number
- Unique Animal ID auto-generation
- Animal profile management: update details, photos, weight, body condition, reproductive status
- Ownership tracking and full transfer history
- Animal movement recording: farm-to-farm, feedlot, market, abattoir, quarantine — with date, origin, destination, reason, authorized officer
- Animal health records: vaccination history, disease history, treatments, lab results, vet visits, health status
- Animal status management: Active, Missing, Sick, Quarantined, Sold, Slaughtered, Deceased
- Livestock search: by Animal ID, Microchip ID, ear tag, Farmer ID, Farm ID, species, breed
- Multiple animal photos supported

---

### 3.7 Bio-Sentinel AI Microchip Management (BIO)

**Pages:** Microchip Inventory, Register Microchip, Microchip Detail, Scan Microchip, Microchip Lifecycle

**Functions:**
- Microchip inventory management: Microchip ID, batch number, manufacturing date, expiry date, status, location
- Microchip registration before issuance
- Microchip activation when assigned to animal: links to Animal ID, Farmer ID, Farm ID, ear tag number
- Smartphone + RFID reader scanning to retrieve animal record
- Ear tag OCR pairing: photograph ear tag → OCR reads number → permanently associates with microchip and animal profile
- Microchip verification: registered status, active status, correct animal association, ear tag match
- Microchip lifecycle tracking: Manufactured → Received → In Inventory → Issued → Activated → In Use → Recovered → Retired
- Microchip recovery recording at abattoir during processing
- Microchip search: by Microchip ID, Animal ID, ear tag, Farmer ID, Farm ID, batch number

---

### 3.8 Crop Management (CRM)

**Pages:** Field List, Register Field, View Field, Planting Records, Harvest Records, Crop Health

**Functions:**
- Crop field registration: Farm ID, field name, field size, crop type, GPS boundaries
- Planting records: crop type, planting date, seed variety, area planted
- Harvest records: harvest date, yield, quality grade, storage location
- Crop health monitoring: observations, disease/pest identification
- Irrigation management records
- Field status management
- Crop and field search

---

### 3.9 Crop-Guardian AI Sensor Management (CGS)

**Pages:** Sensor List, Register Sensor, Sensor Detail, Real-Time Readings, Sensor Alerts, Historical Charts

**Functions:**
- Sensor registration: Device ID, serial number, sensor type, installation location, assigned field
- Sensor types: soil moisture, temperature, humidity, rainfall, soil pH, CO2
- Real-time sensor readings display
- Threshold-based alerts: moisture, temperature, humidity, pH, CO2 breaches
- Sensor maintenance records
- Sensor status monitoring: Online, Offline, Fault
- Historical sensor data charts

---

### 3.10 Veterinary Services (VET)

**Pages:** Visit Records, Vaccination Management, Treatment Records, Lab Tests, Disease Cases, Quarantine Management

**Functions:**
- Veterinary visit records: visit date, vet officer, farm, animals examined, findings, treatment prescribed
- Vaccination management: vaccine type, batch, date administered, next due date, animals vaccinated
- Treatment records: diagnosis, treatment type, medication, dosage, duration
- Laboratory test management: test type, sample collected, lab results, date
- Disease case management: disease name, affected animals, outbreak area, status (Active / Contained / Resolved)
- Vaccination due alerts
- Disease surveillance and reporting
- Quarantine management

---

### 3.11 Device Asset Management System (DAMS)

**Pages:** Device Inventory, Register Device, Device Detail, Device Assignments, Maintenance Records

**Functions:**
- Device inventory: Device ID, type, serial number, manufacturer, model, purchase date, warranty expiry
- Device assignment to farms, fields, or users
- Device status tracking: Active, Inactive, Under Maintenance, Faulty, Retired
- Maintenance records: scheduled, completed, upcoming
- Firmware version tracking and update records
- Device search
- Warranty expiry alerts

---

### 3.12 IoT Management (IOT)

**Pages:** IoT Device List, Register IoT Device, Device Connectivity, Real-Time Data, Event Logs

**Functions:**
- IoT device registration: Device ID, type, serial number, communication protocol, installation location, assigned farm/field
- Device connectivity monitoring: connection status, last communication time, signal strength, communication errors
- Real-time data collection display from connected devices
- Remote device configuration: settings update, restart, reporting intervals, firmware updates
- Connectivity alerts: device offline, communication interrupted, data transmission failure, unauthorized activity
- IoT event logging: connections, disconnections, config changes, errors
- Device search

---

### 3.13 GIS Map

**Pages:** Interactive National Map, Layer Management

**Functions:**
- Interactive map displaying: farms, crop fields, livestock locations, IoT devices, disease hotspots, weather overlays
- Farm mapping with GPS coordinates and boundaries
- Crop field boundaries display
- Disease mapping: geographic visualization of livestock and crop disease cases
- Weather information overlay
- Spatial search: by Farm ID, Farmer ID, district, village, Animal ID, Field ID, Device ID
- Map layer management: toggle layers — Farms, Crop Fields, Livestock, Sensors, Disease Incidents, Weather, Administrative Boundaries

---

### 3.14 Digital Marketplace (MKT)

**Pages:** Product Listings, Service Listings, Order Management, Service Bookings, Messaging

**Functions:**
- Product listings: livestock, crops, animal feed, farm equipment, agricultural inputs — with name, description, quantity, price, availability, farm location, images
- Service listings by Certified Agricultural Service Providers: AI services, veterinary services, livestock transportation, soil testing, equipment rental, irrigation installation, consultancy
- Product search: by type, category, district, village, price range, seller, availability
- Order management: place, cancel, view status, track history
- Service bookings: request, select date/time, confirm, cancel
- Seller verification status display
- Ratings and reviews (only after completed transaction)
- In-platform messaging between buyers and sellers

---

### 3.15 Insurance Management (INS)

**Pages:** Policy List, Register Policy, Policy Detail, Claims List, Submit Claim, Claim Assessment

**Functions:**
- Insurance policy registration: livestock, crops, farms, equipment — with policy number, type, provider, holder, coverage, premium, effective date, expiry date
- Policy management: view, update, renew, cancel, amendments
- Insurance claims submission: policy number, claim type, incident date, description, supporting documents, photos
- Claim assessment workflow: review, request additional info, record findings, approve/reject, determine compensation
- Claim status tracking: Submitted → Under Review → Approved/Rejected → Paid → Closed
- Policy and claim search
- Renewal notifications

---

### 3.16 Payment Management (PAY)

**Pages:** Transaction List, Payment Detail, Receipts, Refund Management

**Functions:**
- Payment processing for: marketplace purchases, services, device purchases, subscriptions
- Supported payment methods: Mobile Money, Debit/Credit Cards, EFT, Bank Transfers
- Escrow payment support: funds held until transaction conditions are satisfied
- Payment status tracking: Pending, Successful, Failed, Cancelled, Refunded
- Digital receipt generation: receipt number, transaction ID, date, amount, method, payer, payee
- Refund management: initiate, approve, track
- Complete transaction history per user
- Financial reconciliation support
- Payment search

---

### 3.17 Reporting and Analytics (REP)

**Pages:** Report Catalog, Report Generation, Scheduled Reports, Export

**Functions:**
- Standard reports for all modules: Farmers, Farms, Livestock, Crops, Veterinary, Marketplace, Insurance, Payments, Devices, IoT, AI
- Report scheduling: daily, weekly, monthly
- Export to PDF and Excel
- Custom date range filtering
- District/village-level filtering

---

### 3.18 National Situation Room (NSR)

**Pages:** Full-Screen Command Center View

**Functions:**
- Large-screen national command center interface for Ministry of Lands and Agriculture
- Real-time national agricultural performance indicators
- Live livestock population by district
- Live crop production status by district
- Active disease outbreak visualization
- Food security indicators at national and district level
- National alert issuance and broadcasting
- AI national forecasts and predictive analytics
- GIS national map with all overlays
- Policy implementation monitoring

---

### 3.19 Administration Portal (ADM)

**Pages:** User Management, Role and Permission Management, System Settings, Integration Management, Security Monitoring, Audit Log, Platform Monitoring

**Functions:**
- User management: create, edit, suspend, deactivate, assign roles
- Role and permission management: RBAC configuration
- System settings and configuration
- Integration management: payment gateways, SMS, WhatsApp Business, weather services
- Platform performance monitoring
- Security monitoring: failed logins, suspicious activity
- Audit log viewer: filterable, searchable, exportable
- AI service configuration
- IoT device management
- Backup and restore management
- Software update deployment tracking

---

### 3.20 AI Insights Dashboard

**Pages:** AI Dashboard, Predictions, Recommendations, Anomaly Alerts

**Functions:**
- Livestock health prediction: based on vaccination history, medical history, age, breed, environmental conditions, disease trends
- Crop health analysis: water stress, nutrient deficiencies, pest risks, disease risks
- Yield prediction: crop type, historical production, weather, soil info, sensor data
- Disease outbreak prediction: veterinary records, geography, historical outbreaks, weather
- Intelligent recommendations: vaccination reminders, irrigation scheduling, fertilizer, pest management, harvest timing, livestock management
- Anomaly detection: abnormal mortality, disease clusters, sensor failures, unusual conditions
- National analytics: livestock population trends, crop production trends, disease trends, food security indicators
- AI recommendations displayed as advisory (not mandatory actions)
- AI confidence scores and contributing factors visible

---

### 3.21 Notifications Center (NOT)

**Pages:** Notification Inbox, Notification Preferences

**Functions:**
- In-app notifications
- WhatsApp Business notifications
- SMS notifications
- Email notifications (where available)
- Notification categories: livestock alerts, health reminders, marketplace activity, payment confirmations, system alerts
- Notification preferences management per user

---

### 3.22 User Profile and Settings

**Functions:**
- View and update personal profile information
- Change password
- Upload profile photo
- Manage notification preferences
- Language preference (English / Setswana)
- View active sessions and connected devices

---

## 4. Business Rules and Logic

### 4.1 Farmer and Farm Rules
- Each farmer receives a unique Farmer ID upon registration
- Each farm receives a unique Farm ID upon registration
- A farmer may own multiple farms
- Farm and farmer records require verification by an authorized officer before status changes to Active

### 4.2 Livestock and Microchip Rules
- Each animal receives a unique Animal ID upon registration
- Each Bio-Sentinel Microchip must be registered in inventory before issuance
- Microchip activation permanently links: Microchip ID, ear tag number, Animal ID, Farmer ID, Farm ID, GPS location, registration date
- Ear tag OCR pairing is permanent and cannot be changed after activation
- Microchip lifecycle must follow the defined sequence: Manufactured → Received → In Inventory → Issued → Activated → In Use → Recovered → Retired
- Microchip recovery must be recorded at abattoir during processing
- Animal status must be updated upon movement, sale, slaughter, or death

### 4.3 Marketplace and Payment Rules
- Ratings and reviews may only be submitted after a transaction is marked as completed
- Escrow payments are held until transaction conditions are satisfied before release to seller
- Seller verification status must be displayed on all listings

### 4.4 Insurance Rules
- Claims may only be submitted against active policies
- Claim status must follow the defined workflow: Submitted → Under Review → Approved/Rejected → Paid → Closed

### 4.5 AI Rules
- All AI outputs are advisory only and are not mandatory actions
- AI confidence scores and contributing factors must be displayed alongside all recommendations

### 4.6 Security Rules
- All API endpoints require JWT authentication
- RBAC enforced across all modules
- MFA required for all System Administrator and Ministry Official accounts
- Complete audit log maintained for all security events
- Account lockout triggered after configurable number of failed login attempts

---

## 5. Non-Functional Requirements

- Response time: login page ≤ 3 seconds, dashboard load ≤ 5 seconds, report generation ≤ 30 seconds
- Support 10,000+ concurrent users
- 99.5% annual uptime
- English and Setswana language support
- Supports modern browsers: Chrome, Edge, Firefox, Safari
- Modular architecture for future expansion
- PostgreSQL database normalized to 3NF
- Daily incremental backups, weekly full backups
- GDPR-equivalent data privacy compliance aligned with Botswana regulations
- Responsive web design with future mobile app support

---

## 6. Database Key Tables

The following tables form the core data model:

- users, roles, permissions, user_roles, user_sessions
- farmers, farmer_contacts, farmer_documents
- farms, farm_ownership, farm_images
- animals, animal_breeds, animal_movements, animal_health, animal_weight_history, animal_ownership
- microchips, microchip_assignments, chip_scans, chip_status_history
- fields, crops, planting_records, harvest_records
- sensors, sensor_readings, sensor_alerts, sensor_maintenance
- veterinary_visits, vaccinations, treatments, laboratory_tests, disease_cases
- marketplace_products, orders, order_items, service_listings, service_bookings, reviews
- insurance_policies, claims, claim_assessments
- payments, payment_receipts, refunds
- devices, device_assignments, device_maintenance
- notifications, notification_history
- ai_predictions, ai_recommendations
- audit_logs
- gis_locations, farm_boundaries, field_boundaries

---

## 7. API Architecture

- RESTful APIs with JSON payloads
- Base URL: /api/v1/
- JWT authentication required on all protected endpoints
- Standard response format: { success, data, message, timestamp }
- HTTP status codes used: 200, 201, 400, 401, 403, 404, 409, 422, 500, 503
- Versioned endpoints

---

## 8. Acceptance Criteria

Core user journey — Farmer registers, manages livestock, and completes a marketplace transaction:

1. User navigates to the landing page and logs in with email, password, and OTP
2. System displays the Farmer Dashboard with farm summary, livestock count, and notifications
3. Farmer registers a new animal, scans the Bio-Sentinel Microchip via RFID reader, and completes ear tag OCR pairing
4. System generates a unique Animal ID and links Microchip ID, ear tag, Farmer ID, Farm ID, and GPS location
5. Farmer creates a product listing for the animal in the Digital Marketplace
6. A buyer places an order; escrow payment is initiated and held
7. Transaction is completed; escrow payment is released to the farmer; buyer submits a rating and review
8. Farmer views the completed transaction in Payment Management and downloads the digital receipt

---

## 9. Out of Scope (Version 1.0)

- Drone fleet management
- Satellite image analysis
- Autonomous agricultural robotics
- Blockchain-based produce traceability
- Carbon credit management
- Regional deployment outside Botswana
- Native mobile application (iOS/Android) — planned for future release
- WhatsApp Business Assistant conversational interface — planned for future release
- BAITS integration — subject to approved integration arrangements, deferred to future release
- Offline mode for field operations