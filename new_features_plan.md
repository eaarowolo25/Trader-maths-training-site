# New Feature Specifications: Probability & Concentration Grid Updates

## 1. Probability Questions Page
- **Purpose:** Provide a dedicated training section for probability-based mental math, essential for trading decisions.
- **Features:**
    - **Question Bank:**
        - **Basic:** Coin flips, dice rolls, card draws.
        - **Intermediate:** Combinations, permutations, marbles in a bag.
        - **Advanced:** Conditional probability, Bayes' Theorem basics, expected value calculations.
    - **Question Formats:**
        - Multiple-choice (4 options).
        - Numerical input with tolerance for decimal rounding.
    - **Difficulty Levels:**
        - **Easy:** Single-event probability (e.g., "Probability of rolling a 4 or 5 on a 6-sided die").
        - **Medium:** Independent multi-event probability (e.g., "Probability of 2 heads in 3 coin flips").
        - **Hard:** Dependent events and expected value (e.g., "EV of a game where you win $10 with 30% and lose $5 with 70%").
    - **Session Tracking:**
        - Accuracy percentage.
        - Average response time.
        - Streak counter.
    - **Feedback:**
        - Instant feedback on submission.
        - "Show Solution" button providing a step-by-step breakdown of the math.

## 2. Concentration Grid: Random Number Finder Mode
- **Purpose:** Enhance cognitive tracking, peripheral vision, and reaction speed under specific targets.
- **Core Workflow:**
    1. **Configuration:**
        - Grid Size (e.g., 10x10).
        - "Concurrent Numbers" (N): Number of sequential targets per round (1-5).
        - Timer option (Count up vs. Count down).
    2. **Gameplay:**
        - **Target Display:** A prominent UI element shows the current target sequence (e.g., "Find: 42, 43, 44").
        - **Sequential Logic:** User must click 42, then 43, then 44. Clicking out of order or a wrong number provides visual/audio error feedback.
        - **Continuity:** Once 44 is clicked, the UI instantly updates with a new random target sequence (e.g., "Find: 12, 13, 14").
    3. **Finish:** A "Finish" button is always visible to end the session and view results.
- **End of Session Analytics:**
    - **Performance Summary:**
        - Total sets completed.
        - Average time per set.
        - Best/Worst set times.
    - **Hesitation Heatmap:**
        - Visualize the grid with colors (Green to Red) representing the time taken to find each number.
        - List the "Top 5 Hesitation Numbers" (numbers that took the longest to locate).
        - **Hesitation Calculation:** Time between the appearance of the target and the first click, and time between sequential clicks.
    - **Trend Analysis:** Graph showing if speed increased or decreased over the course of the session.

## 3. UI/UX Considerations
- **Navigation:** Add "Probability" and "Grid: Random Mode" to the main site navigation.
- **Responsiveness:** Ensure the grid remains usable on tablets/laptops with touch or mouse.
- **Minimalism:** Keep the focus on the numbers and questions to minimize distraction.

## 4. Technical Implementation Notes (Internal)
- **State Management:** Use a robust state to track current target, click sequence, and timestamped history of every click for hesitation analysis.
- **Randomization Algorithm:** Ensure new targets don't overlap too frequently or go out of grid bounds (e.g., if target is 99 and concurrent is 3, handle the overflow or cap the target).
- **Data Persistence:** Optionally store session results in local storage for long-term progress tracking.
