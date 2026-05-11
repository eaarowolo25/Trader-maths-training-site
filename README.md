
# TraderMath Prep | Elite Cognitive Terminal

TraderMath Prep is a high-performance mental arithmetic and auditory cognition training platform designed specifically for junior trading interview preparation (Optiver, IMC, Akuna, Jane Street style assessments). It prioritizes zero-latency interaction, keyboard-first UX, and granular performance analytics.

## 🚀 Key Features

### 1. Core Arithmetic Engine
- **Multi-Category Support:** Addition, Subtraction, Multiplication, Division, Decimals, Percentages, and Indices.
- **Granular Range Control:** Calibrate operand ranges precisely (e.g., specialized 13-19x practice).
- **Trivial Filter:** Automatically excludes "easy" questions (like *1 or +0) to maintain high cognitive load.

### 2. Live Speed Mode (Zetamac+)
- **Keyboard-First Design:** Auto-focus inputs and instant transitions for maximum questions-per-minute (QPM).
- **Auditory Transmission:** Optional Web Speech API integration to practice verbal arithmetic common in floor trading.
- **Fatigue Simulation:** Visual pressure triggers (screen pulses/flashes) on mistakes to simulate high-stress environments.

### 3. Multi-Ladder Flashcards (Intelligence Mode)
- **Sequential Learning:** Systematically master multipliers from 1 to 100.
- **Correction Intelligence:** High-fidelity 3D flashcards that flip to reveal correct answers and mental math shortcuts (e.g., x11, x15, squaring ends-in-5).
- **Neural Feedback Loop:** Tracks response latency per operand. Slower combinations are automatically re-inserted into the deck to force optimization.
- **Precision Countdown:** High-accuracy timers for rapid-fire execution.

### 4. Performance Telemetry
- **Elite Benchmarking:** Real-time comparison against "Elite Junior Trader" standards (Target: 40 QPM / 98% Accuracy).
- **Tactical Advisory:** Dynamic improvement tips based on latest session data (Accuracy vs. Latency focus).
- **Analytics Dashboard:** Visualization of accuracy trends and category-specific volume.

## 🎨 UI/UX
- **Terminal Aesthetics:** Professional "Prop Firm" dark mode or high-contrast "Bloomberg Light" themes.
- **Zero Latency:** Optimized React renders and `requestAnimationFrame` timers for a seamless feel.
- **Local-First:** All data is persisted in browser local storage; no backend required.

## 🛠 Tech Stack
- **Framework:** Next.js 15+ (App Router)
- **Language:** TypeScript
- **State Management:** Zustand (with Persistence)
- **Animations:** Framer Motion
- **Charts:** Recharts
- **Styling:** Tailwind CSS

## 🚦 Getting Started

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Launch Terminal:**
   ```bash
   npm run dev
   ```

3. **Navigate to:** `http://localhost:3000`

---
*Developed for elite trading performance.*
