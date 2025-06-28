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
- **June 28, 2025**: ✓ COMPLETE GUEST FREE TICKET SYSTEM - Fixed database constraint and enabled guest email collection
- **June 28, 2025**: ✓ Made ticket_id nullable in ticket_purchases table to support free events without specific ticket types
- **June 28, 2025**: ✓ Guest users can now successfully claim free tickets by providing email addresses
- **June 28, 2025**: ✓ Verified end-to-end flow: guest access → email collection → ticket generation → QR scanning
- **June 28, 2025**: ✓ Fixed Rhythm in Riddim event image - replaced incorrect image with proper Savage Gentlemen logo
- **June 28, 2025**: ✓ Preserved site structure while correcting event branding for featured event
- **June 28, 2025**: ✓ Confirmed Shenell.whyte@gmail.com account setup as moderator with ticket scanning access
- **June 27, 2025**: ✓ CRITICAL SECURITY FIX: Added sold out validation to free ticket endpoints - prevents bypassing sold out status
- **June 27, 2025**: ✓ Enhanced ticket purchase protection with comprehensive status validation (sold_out, off_sale, staff_only)
- **June 27, 2025**: ✓ RESOLVED: Jaytapper@hotmail.com missing ticket email - manually resent via API endpoint
- **June 27, 2025**: ✓ CRITICAL FIX: Fixed scan data recording system - live scans now appear in cross-reference table
- **June 27, 2025**: ✓ Enhanced scan record creation with proper user ID tracking for scanner identification
- **June 27, 2025**: ✓ Unified scan logic: replaced duplicate implementation with centralized storage layer method
- **June 27, 2025**: ✓ Verified scan data table functionality: new scans immediately appear in /scan-data cross-reference
- **June 27, 2025**: ✓ Confirmed duplicate scan prevention working correctly with proper visual feedback
- **June 27, 2025**: ✓ CRITICAL FIX: Resolved QR code scanning failures at events
- **June 27, 2025**: ✓ Fixed QR scanner validation logic to properly handle EVENT-{eventId}-ORDER-{orderId}-{timestamp} format
- **June 27, 2025**: ✓ Updated backend storage scanTicket method to support both new EVENT format and legacy SGX format
- **June 27, 2025**: ✓ Removed duplicate scanning endpoints causing format conflicts
- **June 27, 2025**: ✓ Enhanced duplicate prevention system using firstScanAt/lastScanAt/scanCount fields
- **June 27, 2025**: ✓ Verified ticket scanning working: Jaytapper's ticket (EVENT-6-ORDER-MANUAL-1751038715755) ✓
- **June 27, 2025**: ✓ Verified ticket scanning working: Bello's ticket (EVENT-6-ORDER-67-1750996460) ✓
- **June 27, 2025**: ✓ Confirmed duplicate scan prevention: already scanned tickets return proper status
- **June 27, 2025**: ✓ RESOLVED Bello's payment issue - created Order #67 and Ticket #62 for $40 USD payment
- **June 27, 2025**: ✓ Confirmed Bello's bank statement payment: $40 USD converted to $56.31 CAD (ref: 517723839496)
- **June 27, 2025**: ✓ RiddemRiot men's tickets now process in CAD currency (Event ID 6, Ticket ID 11)
- **June 27, 2025**: ✓ Updated RiddemRiot location to "Toronto, ON" for proper Canadian currency detection
- **June 27, 2025**: ✓ Verified complete CAD pricing system: location detection → currency display → payment processing
- **June 27, 2025**: ✓ Updated organizer email to info@savgent.com across all events and admin forms
- **June 27, 2025**: ✓ Enhanced mobile camera support for ticket scanning with fallback photo mode
- **June 27, 2025**: ✓ Improved QR scanner initialization with better error handling for mobile devices
- **June 27, 2025**: ✓ URGENT: Manually resent ticket confirmations to all today's purchasers (Marshajjg, Sav, Bello)
- **June 27, 2025**: ✓ Verified email delivery system working correctly for ticket confirmations
- **June 27, 2025**: ✓ RESOLVED: Jaytapper@hotmail.com missing ticket - manually created and sent ticket confirmation
- **June 27, 2025**: ✓ Added Jaytapper ticket to database with QR code: EVENT-6-ORDER-MANUAL-1751038715755
- **June 27, 2025**: ✓ Payment flow verified: Intent creation → Payment success → Webhook processing → Order completion
- **June 27, 2025**: ✓ Comprehensive Stripe integration testing confirms all components working
- **June 27, 2025**: Verified complete ticketing system functionality for bellomoyosoreoluwa@yahoo.com
- **June 27, 2025**: Confirmed email delivery, ticket generation, QR code scanning, and duplicate prevention working correctly
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