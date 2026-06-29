# Requirements Document

## Introduction

The Seller Home Dashboard serves as the central control center for sellers in the Ethiopian fashion marketplace. It provides a comprehensive overview of business performance, pending actions, inventory status, and growth opportunities. The dashboard must enable sellers to understand their business health in less than 10 seconds and take immediate action on critical tasks.

The marketplace supports three business models:
1. **Product Sales** - Traditional one-time purchase transactions
2. **Product Rentals** - Time-based rentals with return logistics management
3. **Custom-Made Orders** - Bespoke fashion items created to customer specifications

The dashboard is optimized for Ethiopian users with support for local language (Amharic), currency (ETB), cultural events, and connectivity constraints (3G networks, mobile-first design).

## Glossary

- **Seller_Dashboard**: The web application interface providing business overview and management capabilities to sellers
- **Business_Health_Indicator**: A composite score (0-100) reflecting listing quality, response time, and fulfillment rate
- **KPI_Card**: A visual component displaying a key performance indicator with value, trend, and context
- **Pending_Action**: A task requiring seller attention with urgency classification (Critical, Important, Info)
- **Listing**: A product or service offered for sale, rent, or custom order
- **Active_Listing**: A listing with status "active" and visible to buyers
- **Rental_Item**: A product available for time-based rental with return logistics
- **Custom_Order**: A bespoke fashion item request with design approval workflow
- **Utilization_Rate**: Percentage of time rental items are booked vs idle (booked days / total available days)
- **Response_Time**: Average duration between buyer message and seller reply
- **Fulfillment_Rate**: Percentage of orders successfully completed vs total orders
- **Ethiopian_Calendar**: The traditional Ethiopian calendar system (13 months)
- **ETB**: Ethiopian Birr, the local currency
- **Socket_Connection**: Real-time bidirectional connection for live updates
- **Analytics_Service**: Backend service providing dashboard metrics with 5-minute refresh interval
- **Notification_Service**: Backend service managing alerts and notifications
- **Design_System**: The @marketplace/ui component library with reusable UI components

## Requirements

### Requirement 1: Dashboard Layout and Information Architecture

**User Story:** As a seller, I want to see the most critical business information above the fold, so that I can assess my business health in less than 10 seconds.

#### Acceptance Criteria

1. THE Seller_Dashboard SHALL display KPI_Cards in the first visible viewport section
2. THE Seller_Dashboard SHALL organize content using F-pattern reading flow (left-to-right, top-to-bottom)
3. WHERE the viewport width is ≥1024px, THE Seller_Dashboard SHALL render a three-column grid layout
4. WHERE the viewport width is ≥640px AND <1024px, THE Seller_Dashboard SHALL render a two-column grid layout
5. WHERE the viewport width is <640px, THE Seller_Dashboard SHALL render a single-column layout
6. THE Seller_Dashboard SHALL use progressive disclosure pattern with summary data visible and details accessible on-demand
7. THE Seller_Dashboard SHALL position Pending_Actions section within the first two scrolls of content
8. THE Seller_Dashboard SHALL load critical above-fold content within 2 seconds on 3G connection

### Requirement 2: Welcome and Onboarding Experience

**User Story:** As a new seller with no listings, I want clear guidance on getting started, so that I can create my first listing quickly and understand the platform.

#### Acceptance Criteria

1. WHERE the seller has 0 Active_Listings, THE Seller_Dashboard SHALL display an educational onboarding section
2. WHERE the seller has 0 Active_Listings, THE Seller_Dashboard SHALL provide a "Create First Listing" call-to-action button
3. WHERE the seller has 0 Active_Listings, THE Seller_Dashboard SHALL display a setup checklist with tasks (Add photos, Write description, Set price)
4. WHERE the seller has 0 Active_Listings, THE Seller_Dashboard SHALL provide a link to a quick tutorial video (<3 minutes)
5. WHERE the seller has ≥1 Active_Listings, THE Seller_Dashboard SHALL display a personalized greeting with time-of-day awareness
6. WHERE the seller has ≥1 Active_Listings AND the current hour is 5-11, THE Seller_Dashboard SHALL display "እንደምን አደሩ" (Good morning) in Amharic mode OR "Good morning" in English mode
7. WHERE the seller has ≥1 Active_Listings AND the current hour is 12-17, THE Seller_Dashboard SHALL display appropriate afternoon greeting
8. WHERE the seller has ≥1 Active_Listings AND the current hour is 18-4, THE Seller_Dashboard SHALL display appropriate evening greeting
9. WHERE the seller has ≥1 Active_Listings AND Pending_Actions count >0, THE Seller_Dashboard SHALL highlight urgent actions in the welcome section

### Requirement 3: Business Summary Cards

**User Story:** As a seller, I want to see my key performance metrics at a glance, so that I can quickly understand my business performance.

#### Acceptance Criteria

1. THE Seller_Dashboard SHALL display a "Today's Revenue" KPI_Card showing total ETB earned today
2. THE Seller_Dashboard SHALL display percentage change in Today's Revenue compared to yesterday
3. THE Seller_Dashboard SHALL display a visual trend indicator (up arrow for positive, down arrow for negative, dash for zero change)
4. THE Seller_Dashboard SHALL display a "Pending Actions" KPI_Card with count of items requiring attention
5. WHERE Pending_Actions count >0, THE Seller_Dashboard SHALL display a red dot notification badge on the Pending_Actions KPI_Card
6. THE Seller_Dashboard SHALL display an "Active Products" KPI_Card showing count of all Active_Listings across sales, rentals, and custom orders
7. THE Seller_Dashboard SHALL display a "Total Messages" KPI_Card with unread message count
8. THE Seller_Dashboard SHALL display a preview of the most recent message in the Total Messages KPI_Card
9. THE Seller_Dashboard SHALL display a "This Week's Performance" KPI_Card with revenue, orders fulfilled, and conversion rate
10. THE Seller_Dashboard SHALL format currency values as "ETB X,XXX" with no decimal places for whole numbers
11. THE Seller_Dashboard SHALL use comma separators for numbers ≥1000
12. THE Seller_Dashboard SHALL calculate percentage changes with 1 decimal place precision

### Requirement 4: Sales Overview Module

**User Story:** As a seller, I want to visualize my revenue trends and sales metrics, so that I can understand my sales performance over time.

#### Acceptance Criteria

1. THE Seller_Dashboard SHALL display a revenue chart with time-series data
2. THE Seller_Dashboard SHALL provide time range selectors for 7 days, 30 days, 90 days, 1 year, and custom range
3. WHEN a seller selects a time range, THE Seller_Dashboard SHALL update the revenue chart within 500ms
4. THE Seller_Dashboard SHALL display total sold count, average order value, and top-selling items in the Sales Overview Module
5. THE Seller_Dashboard SHALL display category breakdown showing which product categories perform best
6. THE Seller_Dashboard SHALL display payment status summary (completed vs pending payments)
7. THE Seller_Dashboard SHALL provide a filter to view by product type (all, sale, rent, custom)
8. WHEN a seller applies a product type filter, THE Seller_Dashboard SHALL update all Sales Overview metrics accordingly
9. THE Seller_Dashboard SHALL retrieve sales data from Analytics_Service with 5-minute cache
10. THE Seller_Dashboard SHALL aggregate revenue by date for chart visualization

### Requirement 5: Rental Overview Module

**User Story:** As a seller with rental products, I want to track active rentals and upcoming returns, so that I can manage my rental inventory effectively.

#### Acceptance Criteria

1. WHERE the seller has ≥1 Rental_Item, THE Seller_Dashboard SHALL display a Rental Overview Module
2. THE Seller_Dashboard SHALL display a list of currently rented items with customer name (masked), rental period, and expected return date
3. WHERE a Rental_Item return date is <3 days away, THE Seller_Dashboard SHALL highlight it with a yellow warning indicator
4. WHERE a Rental_Item return date has passed, THE Seller_Dashboard SHALL highlight it with a red overdue indicator
5. THE Seller_Dashboard SHALL display a calendar view of expected returns for the current week
6. THE Seller_Dashboard SHALL calculate and display rental revenue split (recurring vs one-time)
7. THE Seller_Dashboard SHALL calculate Utilization_Rate as (total booked days / total available days) × 100
8. THE Seller_Dashboard SHALL display Utilization_Rate for each Rental_Item with color coding (green ≥70%, yellow 40-69%, red <40%)
9. THE Seller_Dashboard SHALL display items needing inspection or maintenance after return
10. WHEN a Rental_Item is returned, THE Seller_Dashboard SHALL provide a quick action to mark condition status (Good, Damaged, Needs Cleaning)

### Requirement 6: Custom Order Overview Module

**User Story:** As a seller accepting custom orders, I want to visualize my order pipeline and urgent deadlines, so that I can prioritize production work.

#### Acceptance Criteria

1. WHERE the seller accepts Custom_Orders, THE Seller_Dashboard SHALL display a Custom Order Overview Module
2. THE Seller_Dashboard SHALL display an order pipeline visualization with stages: New Requests → In Production → Ready → Delivered
3. THE Seller_Dashboard SHALL display count of Custom_Orders in each pipeline stage
4. WHERE a Custom_Order delivery deadline is <3 days away, THE Seller_Dashboard SHALL display it in an "Urgent Deadlines" section with red highlight
5. THE Seller_Dashboard SHALL display count of Custom_Orders awaiting customer design approval
6. THE Seller_Dashboard SHALL display count of Custom_Orders waiting for materials/fabric supplies
7. THE Seller_Dashboard SHALL calculate average production time as mean duration from "In Production" to "Ready" status
8. THE Seller_Dashboard SHALL display average production time with comparison to previous period
9. WHEN a seller clicks on a pipeline stage, THE Seller_Dashboard SHALL navigate to filtered Custom_Orders list for that stage
10. THE Seller_Dashboard SHALL provide quick action buttons to update Custom_Order status from the dashboard

### Requirement 7: Pending Actions Module

**User Story:** As a seller, I want to see all tasks requiring my attention prioritized by urgency, so that I can address critical issues first.

#### Acceptance Criteria

1. THE Seller_Dashboard SHALL display a Pending_Actions module with urgency-based classification
2. THE Seller_Dashboard SHALL classify Pending_Actions as Critical (red), Important (yellow), or Info (blue)
3. THE Seller_Dashboard SHALL classify new orders awaiting confirmation >24 hours as Critical
4. THE Seller_Dashboard SHALL classify unanswered messages >12 hours as Critical
5. THE Seller_Dashboard SHALL classify Rental_Items overdue for return as Critical
6. THE Seller_Dashboard SHALL classify Listings pending admin approval as Important
7. THE Seller_Dashboard SHALL classify Custom_Order designs awaiting customer approval as Important
8. THE Seller_Dashboard SHALL classify low stock alerts (inventory <5 units) as Important
9. THE Seller_Dashboard SHALL classify expired Listings (auto-expire after 60 days) as Info
10. THE Seller_Dashboard SHALL display Pending_Actions sorted by urgency (Critical first, then Important, then Info)
11. THE Seller_Dashboard SHALL display inline action buttons for each Pending_Action (Confirm Order, Reply to Message, Renew Listing)
12. WHEN a seller clicks an inline action button, THE Seller_Dashboard SHALL execute the action without navigating away from the dashboard
13. THE Seller_Dashboard SHALL provide a dismiss button for each Pending_Action
14. THE Seller_Dashboard SHALL provide a snooze functionality allowing sellers to defer a Pending_Action for 1 hour, 4 hours, or 1 day
15. WHEN a Pending_Action is dismissed or completed, THE Seller_Dashboard SHALL update the count and list in real-time

### Requirement 8: Inventory Alerts Module

**User Story:** As a seller, I want to receive proactive alerts about my inventory status, so that I can maintain optimal stock levels and listing quality.

#### Acceptance Criteria

1. THE Seller_Dashboard SHALL display an Inventory Alerts Module showing stock and listing issues
2. WHERE a Listing has inventory <5 units, THE Seller_Dashboard SHALL display a low stock warning
3. THE Seller_Dashboard SHALL allow sellers to configure low stock threshold (default 5 units)
4. WHERE a Listing has 0 inventory AND has received inquiries in the last 7 days, THE Seller_Dashboard SHALL display an out-of-stock alert
5. WHERE a Listing has been active for >60 days, THE Seller_Dashboard SHALL display an expiration warning
6. THE Seller_Dashboard SHALL provide seasonal recommendations based on Ethiopian calendar events
7. WHERE the current date is <14 days before Ethiopian New Year (Enkutatash), THE Seller_Dashboard SHALL suggest stocking festive clothing
8. WHERE the current date is <30 days before Timkat, THE Seller_Dashboard SHALL suggest promoting traditional white clothing
9. WHERE a Listing has <3 photos, THE Seller_Dashboard SHALL display a photo quality alert
10. WHERE a Listing is missing description OR price OR category, THE Seller_Dashboard SHALL display an incomplete listing alert
11. WHEN a seller clicks on an Inventory Alert, THE Seller_Dashboard SHALL navigate to the relevant Listing edit page

### Requirement 9: Recent Orders Section

**User Story:** As a seller, I want to see my most recent orders with their current status, so that I can quickly respond to order updates.

#### Acceptance Criteria

1. THE Seller_Dashboard SHALL display the 5 most recent orders in the Recent Orders Section
2. THE Seller_Dashboard SHALL display order status with color-coded badges (New: blue, Confirmed: green, Shipped: purple, Delivered: gray, Completed: gold)
3. THE Seller_Dashboard SHALL display order type icons (Sale, Rent, Custom) with consistent color coding
4. THE Seller_Dashboard SHALL mask customer names for privacy displaying only first name and last initial (e.g., "Abebe K.")
5. THE Seller_Dashboard SHALL display customer location (city), order value in ETB, and order date
6. THE Seller_Dashboard SHALL provide quick action buttons: View Details, Message Customer, Update Status
7. WHEN a seller clicks "View Details", THE Seller_Dashboard SHALL navigate to the full order detail page
8. WHEN a seller clicks "Message Customer", THE Seller_Dashboard SHALL open a message panel as overlay without page navigation
9. WHEN a seller clicks "Update Status", THE Seller_Dashboard SHALL display a status update dropdown with valid next states
10. THE Seller_Dashboard SHALL display a "View all orders" link navigating to the full order management page
11. THE Seller_Dashboard SHALL sort orders by creation date (most recent first)
12. THE Seller_Dashboard SHALL refresh Recent Orders data every 5 minutes via Analytics_Service

### Requirement 10: Messages Module

**User Story:** As a seller, I want to see unread messages and respond quickly, so that I can maintain good communication with buyers.

#### Acceptance Criteria

1. THE Seller_Dashboard SHALL display unread message count with a red notification badge
2. THE Seller_Dashboard SHALL display previews of the last 3 conversations including customer name, last message snippet (50 characters max), and time elapsed
3. THE Seller_Dashboard SHALL calculate and display average Response_Time with format "You typically respond within X hours"
4. WHEN a seller clicks a message preview, THE Seller_Dashboard SHALL open a message panel as overlay
5. THE Seller_Dashboard SHALL provide a quick reply button opening the message panel without page navigation
6. THE Seller_Dashboard SHALL provide filter options: All, Inquiries, Orders, Rentals, Custom Requests
7. WHEN a seller applies a message filter, THE Seller_Dashboard SHALL update the message preview list accordingly
8. THE Seller_Dashboard SHALL receive new message notifications via Socket_Connection in real-time
9. WHEN a new message arrives, THE Seller_Dashboard SHALL increment unread count and prepend message to preview list
10. THE Seller_Dashboard SHALL display relative time format (e.g., "2m ago", "3h ago", "1d ago")
11. WHERE Response_Time is <2 hours, THE Seller_Dashboard SHALL display a positive indicator (green checkmark)
12. WHERE Response_Time is >6 hours, THE Seller_Dashboard SHALL display a warning (yellow alert icon)

### Requirement 11: Notifications System

**User Story:** As a seller, I want to receive and manage notifications about important events, so that I stay informed about my business activity.

#### Acceptance Criteria

1. THE Seller_Dashboard SHALL display a notification bell icon in the top navigation bar
2. WHERE unread notifications exist, THE Seller_Dashboard SHALL display a red badge with unread count on the notification bell
3. WHEN a seller clicks the notification bell, THE Seller_Dashboard SHALL display a dropdown panel with the last 10 notifications
4. THE Seller_Dashboard SHALL categorize notifications as: Orders, Messages, Listing Updates, System Alerts, Performance Milestones
5. THE Seller_Dashboard SHALL display order notifications for new orders, cancelled orders, and completed orders
6. THE Seller_Dashboard SHALL display message notifications for new messages and follow-up messages
7. THE Seller_Dashboard SHALL display listing update notifications for approved, rejected, and expired listings
8. THE Seller_Dashboard SHALL display system alert notifications for policy updates and feature announcements
9. THE Seller_Dashboard SHALL display performance milestone notifications (e.g., "You've reached 100 sales!")
10. THE Seller_Dashboard SHALL provide "Mark as read" and "Mark as unread" actions for individual notifications
11. THE Seller_Dashboard SHALL provide a "Clear all" action to mark all notifications as read
12. THE Seller_Dashboard SHALL provide a link to notification preferences page
13. THE Seller_Dashboard SHALL receive notification events via Socket_Connection in real-time
14. WHEN a new notification arrives, THE Seller_Dashboard SHALL increment the badge count and prepend notification to the list
15. WHEN a seller clicks a notification, THE Seller_Dashboard SHALL mark it as read and navigate to the relevant page

### Requirement 12: Quick Actions Widget

**User Story:** As a seller, I want quick access to frequently used actions, so that I can navigate the platform efficiently.

#### Acceptance Criteria

1. THE Seller_Dashboard SHALL display a Quick Actions Widget with primary and secondary actions
2. THE Seller_Dashboard SHALL display "New Listing" as a large primary action button
3. THE Seller_Dashboard SHALL display "Manage Inventory" as a large primary action button
4. THE Seller_Dashboard SHALL display secondary actions in a compact grid: View Orders, View Analytics, Seller Settings, Promote Listings, View Reviews, Download Reports
5. WHEN a seller clicks "New Listing", THE Seller_Dashboard SHALL navigate to the listing creation flow
6. WHEN a seller clicks "Manage Inventory", THE Seller_Dashboard SHALL navigate to the listings management page
7. THE Seller_Dashboard SHALL allow sellers to customize and pin their 4 most-used secondary actions
8. THE Seller_Dashboard SHALL persist customized quick actions in user preferences
9. THE Seller_Dashboard SHALL provide a "Customize" button to enter quick action edit mode
10. WHERE the seller is in edit mode, THE Seller_Dashboard SHALL display all available actions with drag-and-drop reordering

### Requirement 13: Performance Insights Module

**User Story:** As a seller, I want personalized insights about my performance, so that I can improve my selling effectiveness.

#### Acceptance Criteria

1. THE Seller_Dashboard SHALL display a Performance Insights Module with data-driven recommendations
2. THE Seller_Dashboard SHALL calculate a Business_Health_Indicator score from 0 to 100
3. THE Seller_Dashboard SHALL calculate Business_Health_Indicator using weighted formula: Listing Quality (40%) + Response_Time (30%) + Fulfillment_Rate (30%)
4. THE Seller_Dashboard SHALL display Business_Health_Indicator with color coding (green ≥80, yellow 60-79, red <60)
5. THE Seller_Dashboard SHALL display Business_Health_Indicator breakdown showing contribution of each factor
6. WHERE Response_Time >4 hours, THE Seller_Dashboard SHALL display a tip: "Your response time (X hours) is slower than average (2 hours) - faster responses increase sales by 30%"
7. WHERE a Listing has <5 photos, THE Seller_Dashboard SHALL display a tip: "Listings with 5+ photos get 2x more views"
8. WHERE a Listing has no price, THE Seller_Dashboard SHALL display a tip: "You have X listings with no price - add prices to increase conversion"
9. THE Seller_Dashboard SHALL provide peer comparison showing seller's percentile ranking (e.g., "Top 25% of sellers in your category")
10. THE Seller_Dashboard SHALL anonymize peer comparison data ensuring no individual seller identification
11. THE Seller_Dashboard SHALL update Performance Insights daily at midnight UTC
12. THE Seller_Dashboard SHALL display insights in order of impact priority (highest impact first)

### Requirement 14: Sales Growth Recommendations

**User Story:** As a seller, I want AI-powered suggestions to grow my sales, so that I can optimize my pricing and inventory strategy.

#### Acceptance Criteria

1. THE Seller_Dashboard SHALL display a Sales Growth Recommendations section with actionable suggestions
2. WHERE a Listing price is >20% higher than similar items, THE Seller_Dashboard SHALL suggest a price optimization (e.g., "Consider lowering price on Item X by 10% - similar items sell 3x faster at ETB 450")
3. THE Seller_Dashboard SHALL identify cross-sell opportunities based on buyer search patterns (e.g., "Customers who bought A also searched for B - add B to your inventory")
4. WHERE clothing Listings lack measurements, THE Seller_Dashboard SHALL suggest adding measurements with impact statement ("reduces return rate by 40%")
5. THE Seller_Dashboard SHALL identify untapped categories where similar sellers succeed (e.g., "Habesha Kemis sellers also succeed with accessories - explore this category")
6. THE Seller_Dashboard SHALL analyze listing performance by creation time and suggest optimal posting times (e.g., "Post new listings on Thursday evenings for 25% more views")
7. THE Seller_Dashboard SHALL limit recommendations to 5 items displayed at once
8. THE Seller_Dashboard SHALL provide a "Dismiss" action for each recommendation
9. THE Seller_Dashboard SHALL provide a "View Details" action expanding recommendation with supporting data
10. THE Seller_Dashboard SHALL refresh recommendations weekly
11. THE Seller_Dashboard SHALL track recommendation acceptance rate and adjust suggestion algorithms accordingly

### Requirement 15: Seasonal and Cultural Event Suggestions

**User Story:** As a seller in the Ethiopian market, I want recommendations based on upcoming cultural events, so that I can stock appropriate inventory and maximize seasonal sales.

#### Acceptance Criteria

1. THE Seller_Dashboard SHALL display seasonal suggestions based on Ethiopian_Calendar events
2. WHERE the current date is <14 days before Ethiopian New Year (Enkutatash on September 11), THE Seller_Dashboard SHALL display alert: "Ethiopian New Year in X days - stock festive clothing"
3. WHERE the current date is <30 days before Timkat (January 19), THE Seller_Dashboard SHALL display alert: "Timkat approaching - promote traditional white clothing"
4. WHERE the current date is <45 days before Easter (Fasika), THE Seller_Dashboard SHALL display alert: "Easter - custom order demand will spike for new dresses"
5. WHERE the current month is June, July, or August, THE Seller_Dashboard SHALL display alert: "Wedding season - highlight bridal collections"
6. WHERE the current date is in rainy season (June-September), THE Seller_Dashboard SHALL suggest promoting jackets, sweaters, and rain-appropriate clothing
7. WHERE the current date is <30 days before major shopping events (Black Friday, Christmas), THE Seller_Dashboard SHALL suggest creating sales/discounts
8. THE Seller_Dashboard SHALL display both Gregorian and Ethiopian_Calendar dates for event suggestions
9. THE Seller_Dashboard SHALL provide a "Create Sale" quick action button in seasonal suggestions
10. THE Seller_Dashboard SHALL allow sellers to dismiss seasonal suggestions
11. THE Seller_Dashboard SHALL track which seasonal suggestions lead to listing creation or updates
12. THE Seller_Dashboard SHALL prioritize seasonal suggestions based on seller's product categories

### Requirement 16: Empty State Handling

**User Story:** As a seller, I want helpful guidance when I have no data in a section, so that I understand what actions to take.

#### Acceptance Criteria

1. WHERE the seller has 0 Listings, THE Seller_Dashboard SHALL display empty state: "Start selling in 5 minutes" with video tutorial, template listing, and FAQ links
2. WHERE the seller has ≥1 Listing AND 0 orders, THE Seller_Dashboard SHALL display empty state: "Boost your first sale" with checklist (Add 5 photos, Write detailed descriptions, Price competitively)
3. WHERE the seller has 0 messages, THE Seller_Dashboard SHALL display empty state: "Buyers message active sellers" with encouragement to enable quick responses
4. WHERE the seller has 0 Rental_Items, THE Seller_Dashboard SHALL display empty state: "Unlock rental income - Learn how" with guide link
5. WHERE the seller has not enabled Custom_Orders, THE Seller_Dashboard SHALL display empty state: "Accept custom orders to increase revenue by 40%" with setup wizard button
6. THE Seller_Dashboard SHALL use friendly, encouraging tone in all empty state messages
7. THE Seller_Dashboard SHALL provide clear call-to-action buttons in every empty state
8. THE Seller_Dashboard SHALL include relevant illustrations or icons in empty states
9. WHERE an empty state is for an optional feature (rentals, custom orders), THE Seller_Dashboard SHALL provide a "Not interested" option to hide the suggestion
10. THE Seller_Dashboard SHALL persist empty state dismissals in user preferences

### Requirement 17: Loading and Error State Management

**User Story:** As a seller, I want clear feedback when data is loading or errors occur, so that I understand the system status and can take corrective action.

#### Acceptance Criteria

1. WHILE dashboard data is loading, THE Seller_Dashboard SHALL display skeleton screens matching the final layout structure
2. THE Seller_Dashboard SHALL use skeleton screens to prevent layout shift during loading
3. IF a dashboard section fails to load, THE Seller_Dashboard SHALL display loaded sections and show inline error message for failed section
4. IF a dashboard section fails to load, THE Seller_Dashboard SHALL provide a "Retry" button for the failed section
5. IF the entire dashboard fails to load, THE Seller_Dashboard SHALL display a friendly error illustration with message "Something went wrong"
6. IF the entire dashboard fails to load, THE Seller_Dashboard SHALL provide "Retry" and "Contact Support" action buttons
7. WHERE the user's network connection is offline, THE Seller_Dashboard SHALL display banner: "You're offline - showing cached data"
8. WHERE the user's network connection is offline, THE Seller_Dashboard SHALL enable read-only mode preventing data modifications
9. WHEN network connection is restored, THE Seller_Dashboard SHALL automatically refresh data and remove offline banner
10. THE Seller_Dashboard SHALL display loading indicators within 100ms of user action (button clicks, filter changes)
11. THE Seller_Dashboard SHALL timeout API requests after 30 seconds and display error state
12. THE Seller_Dashboard SHALL log all errors to monitoring service for debugging

### Requirement 18: Accessibility Compliance

**User Story:** As a seller with disabilities, I want the dashboard to be fully accessible, so that I can manage my business independently.

#### Acceptance Criteria

1. THE Seller_Dashboard SHALL support full keyboard navigation with logical tab order matching visual hierarchy
2. THE Seller_Dashboard SHALL provide skip links to main content sections (Skip to KPIs, Skip to Pending Actions)
3. THE Seller_Dashboard SHALL include ARIA labels on all interactive elements (buttons, links, form controls)
4. THE Seller_Dashboard SHALL announce dynamic content updates to screen readers using ARIA live regions
5. THE Seller_Dashboard SHALL maintain minimum 4.5:1 color contrast ratio for all text content
6. THE Seller_Dashboard SHALL maintain minimum 3:1 color contrast ratio for UI components and graphical objects
7. THE Seller_Dashboard SHALL display visible focus indicators on all focusable elements with minimum 2px outline
8. THE Seller_Dashboard SHALL provide descriptive alternative text for all images, icons, and charts
9. THE Seller_Dashboard SHALL associate form error messages with their input fields using aria-describedby
10. THE Seller_Dashboard SHALL provide clear, descriptive error messages for validation failures
11. WHERE a modal or overlay is opened, THE Seller_Dashboard SHALL trap focus within the modal until closed
12. WHERE a modal is opened, THE Seller_Dashboard SHALL move focus to the modal's first interactive element
13. WHEN a modal is closed, THE Seller_Dashboard SHALL return focus to the triggering element
14. THE Seller_Dashboard SHALL support screen reader testing with NVDA, JAWS, and VoiceOver
15. THE Seller_Dashboard SHALL achieve WCAG 2.1 Level AA compliance as measured by automated testing tools

### Requirement 19: Ethiopian Market Localization

**User Story:** As an Ethiopian seller, I want the dashboard to support my language, currency, and cultural context, so that I can work comfortably in my native environment.

#### Acceptance Criteria

1. THE Seller_Dashboard SHALL provide a language toggle supporting Amharic and English
2. WHEN a seller selects Amharic, THE Seller_Dashboard SHALL display all UI text, labels, and messages in Amharic script
3. WHEN a seller selects English, THE Seller_Dashboard SHALL display all UI text, labels, and messages in English
4. THE Seller_Dashboard SHALL persist language preference in user settings
5. THE Seller_Dashboard SHALL display all currency values with "ETB" prefix (e.g., "ETB 1,500")
6. THE Seller_Dashboard SHALL format whole number currency amounts without decimal places
7. THE Seller_Dashboard SHALL format currency amounts with decimals using 2 decimal places (e.g., "ETB 1,500.50")
8. THE Seller_Dashboard SHALL use comma separators for thousands (e.g., "ETB 10,000")
9. WHERE displaying dates, THE Seller_Dashboard SHALL show Gregorian calendar date as primary
10. WHERE displaying dates for cultural events, THE Seller_Dashboard SHALL show both Gregorian and Ethiopian_Calendar dates
11. THE Seller_Dashboard SHALL display time in 12-hour format with AM/PM indicators
12. THE Seller_Dashboard SHALL support Ethiopian naming conventions allowing long patronymic names without character limits
13. THE Seller_Dashboard SHALL provide Ethiopian city dropdown including: Addis Ababa, Dire Dawa, Bahir Dar, Mekelle, Gondar, Hawassa, Jimma, Adama
14. THE Seller_Dashboard SHALL implement aggressive caching strategy for 3G network optimization
15. THE Seller_Dashboard SHALL use optimistic UI updates showing changes immediately before server confirmation
16. THE Seller_Dashboard SHALL lazy load images below the fold to reduce initial page load time
17. THE Seller_Dashboard SHALL serve images in WebP format with JPEG fallback
18. THE Seller_Dashboard SHALL compress images to <100KB for 3G network performance
19. THE Seller_Dashboard SHALL support local payment method integrations (Chapa, Telebirr, CBE Birr) in payment-related displays
20. THE Seller_Dashboard SHALL be optimized for low-end Android devices with ≥2GB RAM

### Requirement 20: Interaction Design and Microinteractions

**User Story:** As a seller, I want smooth, responsive interactions and clear feedback, so that I have a pleasant and efficient user experience.

#### Acceptance Criteria

1. WHEN a user hovers over a button, THE Seller_Dashboard SHALL apply scale transformation (1.02x) and elevation shadow within 200ms ease-out transition
2. WHEN a user hovers over a card, THE Seller_Dashboard SHALL change border color and apply subtle lift effect with cursor pointer
3. WHEN a user hovers over a link, THE Seller_Dashboard SHALL display underline and shift color
4. WHEN a user focuses on an interactive element via keyboard, THE Seller_Dashboard SHALL display a visible focus ring with minimum 2px width
5. WHEN a user presses a button, THE Seller_Dashboard SHALL apply scale transformation (0.98x) for active state feedback
6. THE Seller_Dashboard SHALL maintain minimum 44×44px touch targets for all interactive elements on mobile
7. THE Seller_Dashboard SHALL maintain minimum 8px spacing between adjacent interactive elements
8. THE Seller_Dashboard SHALL use friendly, action-oriented microcopy (e.g., "Create your first listing" not "Add product")
9. WHERE displaying counts, THE Seller_Dashboard SHALL use contextual phrasing (e.g., "You have 3 new messages" not "3 unread")
10. WHERE prompting action, THE Seller_Dashboard SHALL use encouraging language (e.g., "Reply now to stay responsive" not "Respond to message")
11. WHERE viewport width <640px, THE Seller_Dashboard SHALL use collapsible accordion pattern for dense content sections
12. WHERE viewport width <640px, THE Seller_Dashboard SHALL use bottom sheet pattern for action menus
13. WHERE viewport width <640px, THE Seller_Dashboard SHALL implement sticky header with key actions visible during scroll
14. WHERE viewport width <640px, THE Seller_Dashboard SHALL support swipe gestures on order cards to reveal action buttons
15. WHERE viewport width <640px, THE Seller_Dashboard SHALL implement pull-to-refresh gesture on dashboard
16. WHEN a user clicks an action button, THE Seller_Dashboard SHALL display loading spinner on the button during processing
17. WHEN an action completes successfully, THE Seller_Dashboard SHALL display success toast notification with confirmation message
18. WHEN an action fails, THE Seller_Dashboard SHALL display error toast notification with clear error description and retry option
19. THE Seller_Dashboard SHALL provide tooltips on hover/tap explaining unfamiliar terms (e.g., "What is utilization rate?")
20. THE Seller_Dashboard SHALL dismiss tooltips after 5 seconds or on user click outside

### Requirement 21: Real-Time Data Updates

**User Story:** As a seller, I want the dashboard to update automatically when new events occur, so that I always see current information without manual refreshing.

#### Acceptance Criteria

1. THE Seller_Dashboard SHALL establish Socket_Connection to Notification_Service on component mount
2. WHEN a new order is created, THE Seller_Dashboard SHALL receive real-time notification via Socket_Connection
3. WHEN a new order notification is received, THE Seller_Dashboard SHALL increment "Pending Actions" count and prepend order to Recent Orders list
4. WHEN a new message arrives, THE Seller_Dashboard SHALL receive real-time notification via Socket_Connection
5. WHEN a new message notification is received, THE Seller_Dashboard SHALL increment unread message count and update Messages Module
6. WHEN a Listing status changes, THE Seller_Dashboard SHALL receive real-time notification via Socket_Connection
7. WHEN a Listing status notification is received, THE Seller_Dashboard SHALL update relevant KPI_Cards and status counts
8. THE Seller_Dashboard SHALL reconnect Socket_Connection automatically if connection is lost
9. THE Seller_Dashboard SHALL display connection status indicator (connected: green dot, reconnecting: yellow dot, disconnected: red dot)
10. WHERE Socket_Connection is disconnected >30 seconds, THE Seller_Dashboard SHALL display banner: "Live updates paused - reconnecting..."
11. THE Seller_Dashboard SHALL refresh Analytics_Service data every 5 minutes using polling
12. THE Seller_Dashboard SHALL display last updated timestamp for analytics data (e.g., "Updated 3 minutes ago")
13. THE Seller_Dashboard SHALL provide manual refresh button to force immediate data reload
14. WHEN manual refresh is triggered, THE Seller_Dashboard SHALL display loading indicator and fetch latest data from Analytics_Service

### Requirement 22: Performance Optimization

**User Story:** As a seller on a slow network, I want the dashboard to load quickly and respond smoothly, so that I can manage my business efficiently.

#### Acceptance Criteria

1. THE Seller_Dashboard SHALL achieve First Contentful Paint (FCP) <1.5 seconds on 3G connection
2. THE Seller_Dashboard SHALL achieve Largest Contentful Paint (LCP) <2.5 seconds on 3G connection
3. THE Seller_Dashboard SHALL achieve Time to Interactive (TTI) <3.5 seconds on 3G connection
4. THE Seller_Dashboard SHALL achieve Cumulative Layout Shift (CLS) <0.1
5. THE Seller_Dashboard SHALL implement code splitting to load only critical dashboard code initially
6. THE Seller_Dashboard SHALL lazy load chart components below the fold
7. THE Seller_Dashboard SHALL prefetch Quick Actions widget data during idle time
8. THE Seller_Dashboard SHALL cache Analytics_Service responses for 5 minutes in browser
9. THE Seller_Dashboard SHALL use React Query for automatic background refetching and cache management
10. THE Seller_Dashboard SHALL debounce filter and search inputs with 300ms delay
11. THE Seller_Dashboard SHALL virtualize long lists (>20 items) to render only visible items
12. THE Seller_Dashboard SHALL implement intersection observer for lazy loading images and components
13. THE Seller_Dashboard SHALL minimize JavaScript bundle size to <200KB gzipped for initial load
14. THE Seller_Dashboard SHALL use Next.js Image component for automatic image optimization
15. THE Seller_Dashboard SHALL serve critical CSS inline and defer non-critical CSS

### Requirement 23: Data Privacy and Security

**User Story:** As a seller, I want my business data to be secure and customer information to be protected, so that I maintain trust and comply with privacy regulations.

#### Acceptance Criteria

1. THE Seller_Dashboard SHALL mask customer full names displaying only first name and last initial
2. THE Seller_Dashboard SHALL mask customer email addresses showing only first 3 characters and domain
3. THE Seller_Dashboard SHALL mask customer phone numbers showing only last 4 digits
4. THE Seller_Dashboard SHALL require authentication token for all API requests to Analytics_Service
5. THE Seller_Dashboard SHALL validate authentication token on every page load
6. IF authentication token is invalid or expired, THE Seller_Dashboard SHALL redirect to login page
7. THE Seller_Dashboard SHALL transmit all data over HTTPS encrypted connection
8. THE Seller_Dashboard SHALL not store sensitive business data in browser localStorage
9. THE Seller_Dashboard SHALL store only non-sensitive user preferences (language, theme) in localStorage
10. THE Seller_Dashboard SHALL implement Content Security Policy (CSP) headers to prevent XSS attacks
11. THE Seller_Dashboard SHALL sanitize all user-generated content before rendering to prevent injection attacks
12. THE Seller_Dashboard SHALL implement rate limiting on API requests (60 requests per minute per seller)
13. THE Seller_Dashboard SHALL log all data access events to audit trail
14. THE Seller_Dashboard SHALL comply with data retention policies deleting cached data after 24 hours
15. THE Seller_Dashboard SHALL provide data export functionality allowing sellers to download their business data

### Requirement 24: Analytics and Monitoring

**User Story:** As a platform administrator, I want to monitor dashboard performance and user behavior, so that I can identify issues and improve the seller experience.

#### Acceptance Criteria

1. THE Seller_Dashboard SHALL track page load time metrics (FCP, LCP, TTI, CLS) and send to analytics service
2. THE Seller_Dashboard SHALL track user interactions including clicks, hovers, and navigation events
3. THE Seller_Dashboard SHALL track API response times and error rates for all backend calls
4. THE Seller_Dashboard SHALL track Socket_Connection stability (connection time, disconnections, reconnection attempts)
5. THE Seller_Dashboard SHALL track feature usage rates (which modules are viewed, which actions are clicked)
6. THE Seller_Dashboard SHALL implement error boundary to catch React rendering errors
7. WHEN a rendering error occurs, THE Seller_Dashboard SHALL display fallback UI and log error to monitoring service
8. THE Seller_Dashboard SHALL track filter and search usage patterns
9. THE Seller_Dashboard SHALL track empty state impression rates
10. THE Seller_Dashboard SHALL track recommendation acceptance rates (which suggestions lead to action)
11. THE Seller_Dashboard SHALL implement session replay for debugging user-reported issues
12. THE Seller_Dashboard SHALL track device and browser distribution (mobile vs desktop, browser versions)
13. THE Seller_Dashboard SHALL track network speed distribution (4G, 3G, 2G) for performance optimization
14. THE Seller_Dashboard SHALL send performance and usage metrics to monitoring service without blocking user interactions
15. THE Seller_Dashboard SHALL respect user privacy preferences opting out of analytics if requested

### Requirement 25: Mobile-Specific Optimizations

**User Story:** As a seller primarily using mobile devices, I want a dashboard optimized for small screens and touch interaction, so that I can manage my business on the go.

#### Acceptance Criteria

1. WHERE viewport width <640px, THE Seller_Dashboard SHALL prioritize above-fold content showing KPI_Cards and Pending_Actions first
2. WHERE viewport width <640px, THE Seller_Dashboard SHALL collapse chart legend to icon-only mode to save space
3. WHERE viewport width <640px, THE Seller_Dashboard SHALL display revenue chart with vertical scrolling for long time series
4. WHERE viewport width <640px, THE Seller_Dashboard SHALL use bottom navigation pattern for primary actions
5. WHERE viewport width <640px, THE Seller_Dashboard SHALL implement floating action button (FAB) for "Create Listing" accessible from all scroll positions
6. WHERE viewport width <640px AND orientation is landscape, THE Seller_Dashboard SHALL adjust layout for horizontal viewing
7. THE Seller_Dashboard SHALL prevent zoom on input focus by using minimum 16px font size for form inputs
8. THE Seller_Dashboard SHALL use native mobile date picker for date range selection on mobile devices
9. THE Seller_Dashboard SHALL implement touch-friendly dropdown menus with large touch targets
10. THE Seller_Dashboard SHALL support pinch-to-zoom gesture on charts for detailed viewing
11. WHERE viewport width <640px, THE Seller_Dashboard SHALL hide non-essential secondary actions behind "More" menu
12. THE Seller_Dashboard SHALL implement haptic feedback on action button taps (where supported by device)
13. THE Seller_Dashboard SHALL optimize image loading for mobile bandwidth using srcset and sizes attributes
14. THE Seller_Dashboard SHALL reduce animation complexity on mobile to improve performance
15. THE Seller_Dashboard SHALL test on Android devices with ≥2GB RAM and iOS devices ≥iPhone 8

## Technical Constraints

1. THE Seller_Dashboard SHALL integrate with existing API contracts without requiring backend changes
2. THE Seller_Dashboard SHALL use components from the @marketplace/ui Design_System
3. THE Seller_Dashboard SHALL support both seller-only users and buyer-seller hybrid users with role-based content
4. THE Seller_Dashboard SHALL use Socket.IO client library for real-time Socket_Connection
5. THE Seller_Dashboard SHALL use React Query for data fetching, caching, and synchronization
6. THE Seller_Dashboard SHALL use Zustand for client-side state management
7. THE Seller_Dashboard SHALL use Next.js 14 App Router architecture
8. THE Seller_Dashboard SHALL use TypeScript for type safety
9. THE Seller_Dashboard SHALL use TailwindCSS for styling following the existing theme configuration
10. THE Seller_Dashboard SHALL be compatible with NestJS backend service running on port 3001

## Success Metrics

1. Time to understand business health SHALL be <10 seconds (measured via user testing with ≥20 sellers)
2. Pending action completion rate SHALL be >80% within 24 hours of action appearing
3. Mobile usability score SHALL be >90 as measured by Google Lighthouse
4. Accessibility score SHALL be 100 as measured by automated testing (axe, Lighthouse, WAVE)
5. Seller satisfaction rating SHALL be >4.5 out of 5 on question "Dashboard helps me manage my business"
6. Dashboard load time on 3G SHALL be <3 seconds for First Contentful Paint
7. Feature adoption rate for Rental Overview and Custom Order Overview SHALL be >60% of eligible sellers
8. Real-time update delivery latency SHALL be <2 seconds from event occurrence to UI update
9. Error rate for API calls SHALL be <1% during normal operation
10. Session duration SHALL increase by >20% compared to previous dashboard version
