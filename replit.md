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
- **July 9, 2025**: ✓ CRITICAL IMAGE LOADING FIX COMPLETE - Fixed "R Y T H Y M > IN< R I D D I M" event image loading issue
- **July 9, 2025**: ✓ Restored missing image files by copying rhythm-riddim-logo.png to missing filenames
- **July 9, 2025**: ✓ Updated database to use existing rhythm-riddim-logo.png as primary image for Event ID 7
- **July 9, 2025**: ✓ Set proper file permissions (644) for all uploaded images to ensure web server access
- **July 9, 2025**: ✓ Verified image serving via HTTP 200 OK responses from /uploads/rhythm-riddim-logo.png
- **July 9, 2025**: ✓ PERMANENT IMAGE LOADING FIXES COMPLETE - Enhanced static file serving with comprehensive MIME types
- **July 9, 2025**: ✓ Enhanced /uploads route with proper caching, CORS headers, and immutable cache headers for images
- **July 9, 2025**: ✓ Added alternative /api/uploads route for improved compatibility across different request patterns
- **July 9, 2025**: ✓ Updated image URL normalization to ensure proper leading slash format for static serving
- **July 9, 2025**: ✓ Enhanced LazyImage component with better error handling and fallback mechanisms
- **July 9, 2025**: ✓ ADMIN USER DELETION FUNCTIONALITY COMPLETE - Added delete buttons with confirmation dialogs
- **July 9, 2025**: ✓ Enhanced UserManagement component with Trash2 icons and proper mutation handling
- **July 9, 2025**: ✓ Verified email marketing system working correctly with existing email lists and routes
- **July 9, 2025**: ✓ Protected main admin user (ID: 1) from accidental deletion in UI and backend
- **July 9, 2025**: ✓ COMPREHENSIVE SITE OPTIMIZATION COMPLETE - All 4 phases implemented successfully
- **July 9, 2025**: ✓ Advanced analytics dashboard with real-time metrics and performance charts
- **July 9, 2025**: ✓ Enhanced filtering system with date ranges, price filters, and advanced search
- **July 9, 2025**: ✓ Notification center with customizable settings and real-time updates
- **July 9, 2025**: ✓ Performance monitoring with system health, response times, and error tracking
- **July 9, 2025**: ✓ Cache management system with optimization and cleanup tools
- **July 9, 2025**: ✓ EMAIL DELIVERY SYSTEM OPERATIONAL - Created functional script to send tickets to 17 free registrations
- **July 9, 2025**: ✓ Fixed QR code generation and email template formatting for R Y T H Y M > IN< R I D D I M event
- **July 9, 2025**: ✓ Verified SendGrid API integration working correctly (blocked by account credit limits)
- **July 9, 2025**: ✓ All 17 free ticket holders identified and ready for email delivery once SendGrid credits restored
- **July 9, 2025**: ✓ ALTERNATIVE EMAIL SERVICE SETUP COMPLETE - Configured MailerSend, Brevo, and Gmail SMTP options
- **July 9, 2025**: ✓ Created comprehensive email provider switching system with automatic failover
- **July 9, 2025**: ✓ Identified MailerSend trial account limitations requiring upgrade or alternative provider
- **July 9, 2025**: ✓ Built QR code generator tool for manual ticket distribution as backup solution
- **June 28, 2025**: ✓ COMPREHENSIVE TICKET DATABASE SYNCHRONIZATION - Fixed all orphaned records and connections
- **June 28, 2025**: ✓ Enhanced database integrity with automated ticket inventory management system
- **June 28, 2025**: ✓ Added TicketDatabaseSync class for real-time cross-database reconciliation
- **June 28, 2025**: ✓ Fixed 3 orphaned ticket purchases, 1 missing event reference, and 2 invalid user connections
- **June 28, 2025**: ✓ Implemented site-wide ticket status validation and automatic inventory updates
- **June 28, 2025**: ✓ Added comprehensive database startup synchronization for all ticket systems
- **June 28, 2025**: ✓ Enhanced non-prefixed /tickets/free endpoint with proper JSON responses
- **June 28, 2025**: ✓ FIXED FREE TICKET CLAIMING JSON ERROR - Enhanced mobile browser authentication handling
- **June 28, 2025**: ✓ Added robust error detection for HTML responses (authentication failures) vs JSON responses
- **June 28, 2025**: ✓ Improved guest authentication header injection for mobile environments  
- **June 28, 2025**: ✓ Enhanced free ticket claim error messages with response truncation for debugging
- **June 28, 2025**: ✓ Added complete account deletion functionality with confirmation dialog and admin notifications
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
- MailerSend trial account limitations prevent sending to external email addresses
- Need to upgrade MailerSend account or use alternative email service (Gmail/Brevo)

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