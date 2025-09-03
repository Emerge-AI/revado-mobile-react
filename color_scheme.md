  Based on the project's configuration and usage, here's the color
  hierarchy:

  Primary Colors (Blue)

  - Main brand color: Blue shades from primary palette
    - blue-600 (#0284c7) - Primary actions, CTAs, key UI elements
    - blue-700 (#0369a1) - Hover states for primary buttons
    - blue-50 (#f0f9ff) - Light backgrounds, subtle highlights
    - blue-100 (#e0f2fe) - Icon backgrounds, accent areas

  Secondary Colors (Purple/Violet)

  - Defined in config but not actively used in components
  - Purple scale from secondary palette (violet-50 to violet-950)

  Neutral Colors (Gray)

  - Text hierarchy:
    - gray-900 (#111827) - Main headings
    - gray-800 (#1f2937) - Body text default
    - gray-700 (#374151) - Secondary text
    - gray-600 (#4b5563) - Tertiary text
    - gray-500 (#6b7280) - Muted/inactive text
  - Backgrounds: white, gray-50 for sections

  Semantic Colors

  - Success: Green tones
    - green-100 background with green-800 text for status badges
  - Info: Blue tones (overlaps with primary)
    - blue-100 background with blue-800 text for info badges

  Usage Hierarchy

  1. Primary actions: bg-blue-600, hover:bg-blue-700
  2. Secondary actions: Border variants with border-blue-600
  3. Backgrounds: White primary, blue-50 for highlighted sections
  4. Text: Gray scale for content hierarchy
  5. Accents: blue-100 for icon containers and subtle highlights

  Icon System (Lucide React)

  - Primary icons: text-blue-600 on blue-100 backgrounds
  - Icon containers: w-12 h-12 or w-14 h-14 rounded-full bg-blue-100
  - Icon sizes: w-6 h-6 (small), w-7 h-7 (medium), w-10 h-10 (large)
  - Consistent usage across components for visual harmony
  - Common icons:
    - Shield: Security/HIPAA compliance
    - Zap: Speed/instant service
    - Activity: Health monitoring
    - MessageCircle: Chat/communication
    - Search: Analysis/discovery
    - Navigation: Guidance/triage
    - Users: Network/community
    - AlertTriangle: Warnings/emergencies

  Component Patterns

  - Cards: bg-white rounded-xl shadow-lg border border-gray-100
  - Hover states: hover:shadow-xl transition-shadow
  - Gradients: from-blue-100 to-blue-200 for subtle depth
  - Status indicators: CheckCircle in green-600 for active/compliant