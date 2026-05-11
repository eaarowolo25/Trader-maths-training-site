Build a fully functional local web app called “TraderMath Prep” designed specifically for junior trading interview preparation.

The purpose of the app is to train:
- mental arithmetic speed
- auditory arithmetic
- verbal maths
- concentration under pressure
- decimal fluency
- multiplication decomposition
- trading-style numerical cognition

The UI/UX should feel:
- minimal
- ultra fast
- keyboard-first
- dark mode
- professional proprietary trading firm aesthetic
- similar responsiveness to Zetamac but more configurable and analytics-focused

Tech stack:
- Next.js
- TypeScript
- Tailwind CSS
- Local browser storage only (no backend required)
- Clean modular architecture
- Mobile responsive but optimized for desktop

CORE REQUIREMENTS
=================

The app should have:

1. HOME DASHBOARD
2. CUSTOM PRACTICE GENERATOR
3. LIVE SPEED MODE
4. AUDITORY MODE
5. FATIGUE MODE
6. PERFORMANCE ANALYTICS
7. SETTINGS PANEL

==================================================
1. HOME DASHBOARD
==================================================

Show:
- Today’s average score
- Best score
- Current streak
- Accuracy %
- Average response time
- Weakest arithmetic category
- Daily practice time
- Trend graph over time

Also display:
- Last 10 session summaries
- Error heatmap by arithmetic type

==================================================
2. CUSTOM PRACTICE GENERATOR
==================================================

Allow users to fully customize arithmetic generation.

User can toggle ON/OFF:
- addition
- subtraction
- multiplication
- division
- percentages
- fractions
- decimal arithmetic
- negative numbers

MULTIPLICATION CONFIGURATION:
- choose digit length for left number
- choose digit length for right number
- examples:
  - 1 digit × 2 digit
  - 2 digit × 2 digit
  - 3 digit × 2 digit
  - 4 digit × 1 digit

DECIMAL CONFIGURATION:
- choose decimal places
- examples:
  - 1 decimal place
  - 2 decimal places
  - mixed decimal precision

DIVISION CONFIGURATION:
- exact integer division only
- decimal answers allowed
- repeating decimals allowed

NEGATIVE NUMBER CONFIG:
- disable negatives
- allow single negative
- allow double negatives

PERCENTAGE CONFIG:
- percentage increase
- percentage decrease
- percentage of number

FRACTION CONFIG:
- simplify fractions
- fraction of integer
- decimal to fraction

DIFFICULTY CONTROLS:
- question timer
- global speed mode
- adaptive difficulty
- sudden difficulty spikes

==================================================
3. LIVE SPEED MODE
==================================================

Replicate Zetamac flow but more advanced.

Features:
- endless rapid-fire questions
- instant next question after answer
- keyboard-only interaction
- large centered question display
- score counter
- timer
- streak counter
- combo multiplier
- accuracy tracking

Behavior:
- no mouse needed
- Enter submits answer
- auto-focus input
- ultra low latency transitions

Add:
- smooth micro animations
- sound toggle
- pressure mode visuals

QUESTION GENERATION MUST:
- avoid repetitive patterns
- intelligently rotate categories
- scale difficulty dynamically

==================================================
4. AUDITORY MODE
==================================================

This is critical.

The app should verbally read arithmetic questions aloud using browser speech synthesis.

Features:
- adjustable speech speed
- British English voice preferred
- replay question button
- delay before answer input unlocks
- optional hidden question text
- verbal-only mode

User flow:
1. Question spoken aloud
2. User mentally computes
3. User types answer
4. Instant feedback

Modes:
- spoken multiplication
- spoken decimal arithmetic
- spoken multi-step arithmetic
- memory retention mode

MULTI-STEP EXAMPLES:
“47 times 8, then subtract 19”
“13.7 plus 8.92, divided by 2”

==================================================
5. FATIGUE MODE
==================================================

Simulate trading assessment fatigue.

Create:
- continuous mixed arithmetic streams
- timed cognitive endurance rounds
- progressively harder pacing
- distraction mode
- pressure mode

Add optional:
- screen flashes
- countdown pressure
- random category switching

Include:
- cognitive endurance score
- fatigue breakdown analytics

==================================================
6. PERFORMANCE ANALYTICS
==================================================

Track EVERYTHING.

Analytics:
- average response time by category
- error frequency by arithmetic type
- hesitation tracking
- accuracy decay over time
- fatigue performance curves
- improvement charts

Visualize:
- line graphs
- heatmaps
- response distributions

Track specific weaknesses:
- decimal division
- carrying errors
- multiplication hesitation
- place-value mistakes

Store all data locally.

==================================================
7. SETTINGS PANEL
==================================================

Allow:
- dark/light mode
- sound toggle
- keyboard shortcuts
- custom session lengths
- speech synthesis controls
- font scaling
- pressure effects toggle

==================================================
DESIGN REQUIREMENTS
==================================================

Visual style:
- modern prop trading desk aesthetic
- black/dark charcoal background
- subtle neon accents
- minimalist typography
- very fast UI

Inspiration:
- Zetamac
- IMC/Optiver style assessments
- Bloomberg terminal minimalism
- quant dashboard feel

==================================================
ADVANCED FEATURES
==================================================

Include:
- adaptive AI difficulty scaling
- spaced repetition for weak areas
- custom arithmetic playlists
- interview simulation mode
- recovery score after mistakes

==================================================
INTERVIEW SIMULATION MODE
==================================================

This mode should:
- ask spoken questions
- enforce time pressure
- simulate real assessment center pacing

Include:
- final score
- stress score
- hesitation metrics
- consistency metrics

==================================================
TECHNICAL REQUIREMENTS
==================================================

Code requirements:
- modular architecture
- reusable components
- proper typing
- maintainable structure
- clean state management

Prefer:
- Zustand or Context API
- Framer Motion for subtle animations
- Recharts for analytics

==================================================
DELIVERABLES
==================================================

Generate:
- complete codebase
- setup instructions
- package.json
- responsive UI
- sample arithmetic engine
- local storage persistence
- polished production-ready frontend

The final app should feel like:
“A proprietary trading firm cognitive training terminal.”