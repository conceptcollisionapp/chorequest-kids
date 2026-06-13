# Build Decisions

### What was built
The ChoreQuest Kids application was significantly enhanced with a fully functional "Parent Mode." This new mode allows parents to:
*   Add new customizable chores (name, point value).
*   Add new customizable rewards (name, coin cost).
*   Delete existing chores and rewards.
A simple math challenge (7x8=56) was implemented as a gate to prevent children from easily accessing and manipulating Parent Mode. Underlying architectural changes ensure the integrity of historical data for points and completion rates, even when chores or rewards are modified by parents.

### Key Technical Decisions
1.  **State Management & Persistence:** All critical application states, including `chores`, `rewards`, `completed`, `dayCounts`, `spent`, `nextChoreId`, and `nextRewardId`, are managed with `useState` and `useEffect` hooks and persisted to `localStorage`. `try...catch` blocks safeguard `localStorage` operations.
2.  **Completion Data Structure & Point Snapshotting:**
    *   The `completed` state was refactored from a flat `date-id` composite key string to a nested object structure: `{ [date]: { [choreId]: pointsEarned } }`. This critical change ensures that the points awarded for a chore are snapshotted at the time of completion, making historical point totals immutable to subsequent changes in chore point values or deletion of chores.
    *   A separate `spent` state accurately tracks redeemed points, allowing the displayed `points` balance to always reflect `(total earned lifetime) - (total spent lifetime)`.
3.  **Completion Rate Calculation:**
    *   The 30-day completion rate is calculated based on a window spanning up to 30 days, starting from the date of the user's first recorded completion.
    *   A new, separate `dayCounts` state (a map `{ [date]: choreCount }`) was introduced. This map records the total number of *active* chores at the moment the *first* chore of a given day is completed. This addresses the retroactivity problem where adding/deleting chores would unfairly alter past completion rates.
    *   The `calculateStats` function now determines both `done` (actual completions for a day) and `total` (assignable chores for a day) exclusively from the stored `completed` and `dayCounts` data, no longer relying on the live `chores` array for historical days.
    *   A clamping mechanism, `total += Math.max(dayCount, actual)`, was integrated into the rate calculation. `actual` represents `Object.keys(dayData).length` (the number of chores actually completed on a day). This ensures that the denominator (`total`) is never smaller than the numerator (`done`) for any given day, preventing rates from exceeding 100% (e.g., if chores were added mid-day after `dayCount` was snapshotted).
4.  **Parent Mode Functionality:**
    *   A mathematical question (`7×8=56`) is presented via a `prompt` for access to Parent