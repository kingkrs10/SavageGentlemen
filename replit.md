# Savage Gentlemen Web Application

## Overview
A comprehensive mobile-first web application for Savage Gentlemen, empowering Caribbean-American community engagement through advanced authentication and event discovery.

## Project Architecture
- **Frontend**: React with TypeScript, Tailwind CSS, mobile-first responsive design
- **Backend**: Express.js with PostgreSQL database using Drizzle ORM
- **Authentication**: Token-based system with localStorage persistence
- **Email System**: SendGrid with QR code attachments for ticket delivery
- **Payment Processing**: Stripe and PayPal integration
- **Analytics**: Comprehensive tracking with Google Analytics

## Recent Changes
- **June 27, 2025**: Verified and sent ticket confirmations to all recent purchasers (SavageGentlemen, Apryl, Natalie)
- **June 27, 2025**: Enhanced ticket scanner camera initialization with proper video element loading
- **June 27, 2025**: Added comprehensive scan data viewer at /scan-data for tracking all ticket scans
- **June 26, 2025**: Fixed QR code display in ticket emails using inline attachments
- **June 26, 2025**: Resolved Stripe payment disconnection issues for June 20 purchases
- **June 26, 2025**: Enhanced admin ticket management system authentication
- **June 26, 2025**: Fixed image loading across entire site with proper static file serving
- **June 26, 2025**: Added additional images display functionality for events
- **June 26, 2025**: Updated frontend authentication to handle nested user data structure

## Current Issues
- Event creation with pricing and calendar functionality
- Advanced ticket options vs general ticket creation
- Database connectivity for new events

## User Preferences
- Focus on functionality over aesthetics
- Ensure all payment processing works correctly
- Maintain proper email delivery with QR codes
- Admin tools must be fully functional

## Technical Decisions
- QR codes embedded as inline email attachments (not data URLs)
- Token-based authentication with fallback mechanisms
- Mobile-first design approach
- Real-time analytics tracking
- Static file serving with proper MIME types and caching headers
- Additional images stored as JSON arrays in database
- Normalized image URL handling for consistent display