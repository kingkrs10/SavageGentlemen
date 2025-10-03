# Savage Gentlemen Web Application

## Overview
The Savage Gentlemen web application is a mobile-first platform designed to foster Caribbean-American community engagement. Its primary purpose is to facilitate event discovery, offer advanced authentication, and provide robust ticketing solutions. The project aims to empower users with seamless access to community events and services, while offering administrators powerful tools for event management, user interaction, and analytics.

## User Preferences
- Focus on functionality over aesthetics
- Ensure all payment processing works correctly
- Maintain proper email delivery with QR codes
- Admin tools must be fully functional

## System Architecture
The application is built with a **React (TypeScript)** frontend utilizing **Tailwind CSS** for a mobile-first responsive design. The backend is powered by **Express.js** and interacts with a **PostgreSQL** database via **Drizzle ORM**.

## Security Enhancements (September 2025)
**CRITICAL PAYMENT SECURITY FIXES IMPLEMENTED:**
- **Payment Price Manipulation Protection**: All payment amounts now validated server-side from database records, eliminating client-controlled pricing vulnerabilities
- **Authentication Bypass Prevention**: Removed insecure header fallbacks (user-id/x-user-data) for all payment, admin, and ticket routes - strict Firebase token authentication required
- **PayPal Order Integrity**: Added custom_id validation to prevent order switching attacks where users pay for cheap events but claim expensive tickets
- **Comprehensive Payment Security**: Both Stripe (/api/payment/create-intent, /payment/create-intent) and PayPal endpoints now use authoritative database pricing with proper validation

Key architectural decisions and features include:
- **Authentication**: Token-based system with `localStorage` persistence, supporting user and admin roles.
- **UI/UX**: Mobile-first design principles, modern aesthetics with glassmorphism effects, gradient text, enhanced animations, and improved typography (Inter font family). Includes loading skeletons, shimmer loading states, and micro-interactions for improved user experience.
- **Event Management**: Comprehensive system for creating, managing, and displaying events, including accurate pricing, location-based currency detection, and review functionality.
- **Ticketing System**: Robust ticket generation, distribution, and scanning. Supports free tickets, paid tickets via Stripe/PayPal, QR code delivery (inline attachments), and a secure ticket scanner with haptic and visual feedback. Includes duplicate prevention and a database synchronization mechanism for ticket inventory.
- **Livestreaming**: Functional live page with current and upcoming streams, real-time WebSocket chat, and multi-platform video player support (YouTube, Twitch, custom streams).
- **Product Shop**: Integration with Etsy for merchandise display, featuring authentic product listings, image proxy handling, and direct links to the official Etsy store.
- **Music Mixes Marketplace** (October 2025): Monetized music mix platform with $1.99 pricing. Features include:
  - Audio preview streaming before purchase
  - Secure Stripe payment processing
  - Post-purchase download tracking
  - Admin upload interface with full/preview file support
  - Purchase history tracking per user
  - File storage in uploads/mixes/ directory
- **Profile Management**: User profile management including avatar uploads (with validation), and secure display of payment information.
- **Admin Dashboard**: Centralized dashboard for user management (search, filter, statistics, deletion protection for main admin), comprehensive analytics (real-time metrics, charts, trending indicators), livestream controls, and music mix management.
- **Image Handling**: Static file serving for uploaded images with proper MIME types, caching, and normalized URL handling. Additional images for events are stored as JSON arrays in the database.
- **Pricing System**: Corrected site-wide pricing conversion to allow natural input (e.g., "20" for $20.00 USD) and proper display across all forms and event listings.

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