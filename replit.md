# Savage Gentlemen Web Application

## Overview
The Savage Gentlemen web application is a mobile-first platform designed to foster Caribbean-American community engagement. Its primary purpose is to facilitate event discovery, offer advanced authentication, and provide robust ticketing solutions. The project aims to empower users with seamless access to community events and services, while offering administrators powerful tools for event management, user interaction, and analytics.

## User Preferences
- Focus on functionality over aesthetics
- Ensure all payment processing works correctly
- Maintain proper email delivery with QR codes
- Admin tools must be fully functional

## Soca Passport 1.0 - Credit Ledger & Loyalty System (November 2025)

**Backend-Complete MVP ✅ Delivered:**
- **Transaction-Safe Credit Ledger**: Atomic check-in flow ensures stamps, credits, and profile stats update together or rollback (no orphaned records)
- **Database Schema**: 7 new tables - credit transactions, achievements, redemptions, QR check-ins, social shares
- **Credit Calculation**: Standard events award 50 credits, premium events (`isPremiumPassport` flag) award 75 credits
- **Achievement Engine**: Auto-unlocks 12 seeded achievements based on events attended, countries visited, credits earned
- **Redemption Marketplace**: 10 offerings including ticket discounts ($5/$10 off), VIP access, merch rewards with tier requirements
- **Idempotency**: Unique constraint on `passport_qr_checkins (user_id, event_id)` prevents duplicate credits
- **API Routes Ready**: `/api/passport/credits`, `/achievements`, `/redemptions/offers`, `/redemptions/:id/claim`, `/share`
- **Tier Progression**: Bronze (0-499), Silver (500-1,499), Gold (1,500-3,499), Elite (3,500+) credits

**Transaction Architecture:**
- `passportService.awardStamp()` uses `db.transaction()` for atomicity
- Inside transaction: idempotency check, QR check-in, stamp creation, credit ledger entry, profile update (points + stats)
- Stats (totalEvents, totalCountries) computed atomically via SQL within transaction
- Achievement unlocks and tier checks run after transaction with fresh profile data

**Frontend Pending**: Dashboard, QR scanner, marketplace, public profiles, social sharing

## System Architecture
The application is built with a **React (TypeScript)** frontend utilizing **Tailwind CSS** for a mobile-first responsive design. The backend is powered by **Express.js** and interacts with a **PostgreSQL** database via **Drizzle ORM**.

## Security Enhancements (September 2025)
**CRITICAL PAYMENT SECURITY FIXES IMPLEMENTED:**
- **Payment Price Manipulation Protection**: All payment amounts now validated server-side from database records, eliminating client-controlled pricing vulnerabilities
- **Authentication Bypass Prevention**: Removed insecure header fallbacks (user-id/x-user-data) for all payment, admin, and ticket routes - strict Firebase token authentication required
- **PayPal Order Integrity**: Added custom_id validation to prevent order switching attacks where users pay for cheap events but claim expensive tickets
- **Comprehensive Payment Security**: Both Stripe (/api/payment/create-intent, /payment/create-intent) and PayPal endpoints now use authoritative database pricing with proper validation

Key architectural decisions and features include:
- **Authentication**: HMAC-signed token-based system with `localStorage` persistence, supporting user and admin roles. Tokens are signed with a secure TOKEN_SECRET environment variable and validated on each admin request. Admins must log out and log back in if TOKEN_SECRET changes to get fresh tokens.
- **UI/UX**: Mobile-first design principles, modern aesthetics with glassmorphism effects, gradient text, enhanced animations, and improved typography (Inter font family). Includes loading skeletons, shimmer loading states, and micro-interactions for improved user experience.
- **Event Management**: Comprehensive system for creating, managing, and displaying events, including accurate pricing, location-based currency detection, and review functionality.
- **Ticketing System**: Robust ticket generation, distribution, and scanning. Supports free tickets, paid tickets via Stripe/PayPal, QR code delivery (inline attachments), and a secure ticket scanner with haptic and visual feedback. Includes duplicate prevention and a database synchronization mechanism for ticket inventory.
- **Livestreaming**: Functional live page with current and upcoming streams, real-time WebSocket chat, and multi-platform video player support (YouTube, Twitch, custom streams).
- **Product Shop**: Integration with Etsy for merchandise display, featuring authentic product listings, image proxy handling, and direct links to the official Etsy store.
- **Music Mixes Marketplace** (October 2025): Monetized music mix platform with $1.99 pricing. Features include:
  - Audio preview streaming before purchase with download prevention
  - Secure Stripe payment processing
  - Post-purchase download tracking
  - Admin upload interface with full/preview file support
  - Purchase history tracking per user
  - File storage in uploads/mixes/ directory
  - **Download Security (October 2025)**: Multi-layer protection preventing unauthorized downloads:
    - Frontend: Audio player with `controlsList="nodownload"` and context menu prevention
    - Backend: Preview files served through protected streaming endpoint (`/api/music/mixes/:id/preview`)
    - Direct file access to `/uploads/mixes/` blocked with 403 error
    - API responses never expose direct file paths
    - Path traversal protection with uploads directory boundary checks
- **Profile Management**: User profile management including avatar uploads (with validation), and secure display of payment information.
- **Admin Dashboard**: Centralized dashboard for user management (search, filter, statistics, deletion protection for main admin), comprehensive analytics (real-time metrics, charts, trending indicators), livestream controls, music mix management, and integrated ticket scanner (October 2025) for validating event tickets with manual entry, live camera QR scanning, and photo upload support.
- **Image Handling**: Static file serving for uploaded images with proper MIME types, caching, and normalized URL handling. Additional images for events are stored as JSON arrays in the database.
- **Pricing System**: Corrected site-wide pricing conversion to allow natural input (e.g., "20" for $20.00 USD) and proper display across all forms and event listings.
- **Soca Passport 1.0 - Promoter Subscriptions** (November 2025): 4-tier subscription system for event promoters with production-grade security:
  - **Subscription Tiers**: FREE ($0), STARTER ($39/event or $299/year), PRO ($99/event or $899/year), ENTERPRISE (custom pricing)
  - **Early Adopter Program**: First 5 STARTER subscribers get 90-day free trial + lifetime 50% discount
  - **Database Schema**: Separate tables for plans, billing options, and subscriptions with proper FK relationships. Metadata JSONB for flexible tracking.
  - **Security Hardening**: Infinite trial prevention via Stripe subscription verification, early adopter slot protection via metadata tracking (earlyAdopterSlotConfirmed flag), payment-confirmed slot increment only (prevents slot exhaustion attacks), defensive validation for missing Stripe IDs
  - **MVP Implementation**: Beautiful pricing page at /socapassport/promoters with annual/monthly billing toggle, tier comparison cards, early adopter messaging. All tiers use "Contact Sales" flow (email info@savgent.com) for manual subscription setup during beta
  - **Backend APIs**: GET /api/promoter-subscriptions/plans (public), GET /api/promoter-subscriptions/status (authenticated), POST /api/promoter-subscriptions/create (authenticated, Firebase token required), POST /api/promoter-subscriptions/cancel (authenticated), POST /api/promoter-subscriptions/stripe-webhook (Stripe webhook handler)
  - **Future Automation**: Backend infrastructure ready for full Stripe Checkout automation when manual setup phase completes

## External Dependencies
- **Payment Gateways**: Stripe, PayPal
- **Email Services**: SendGrid, Brevo, MailerSend (with automatic failover)
- **Analytics**: Google Analytics
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Frontend Framework**: React
- **Styling**: Tailwind CSS
- **QR Code Scanning**: `html5-qrcode` library
- **Image Hosting/Product Source**: Etsy
- **Authentication**: Firebase (for environment variables)