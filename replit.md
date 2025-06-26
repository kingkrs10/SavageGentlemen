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
- **June 26, 2025**: Fixed QR code display in ticket emails using inline attachments
- **June 26, 2025**: Sent ticket confirmations to all recent purchasers with working QR codes
- **June 26, 2025**: Resolved Stripe payment disconnection issues for June 20 purchases
- **June 26, 2025**: Enhanced admin ticket management system authentication

## Current Issues
- Admin ticket management authentication needs fixing
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