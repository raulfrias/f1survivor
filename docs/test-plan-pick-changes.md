# Test Plan: Pick Change Functionality (MVP)

## Test Environment Setup
1. Open the application at http://localhost:8000
2. Open browser developer console to monitor for errors
3. Clear localStorage before testing: Run `clearAllPicksData()` in console

## Test Scenarios

### 1. Initial Pick Flow (No Changes)
**Steps:**
1. Navigate to the homepage
2. Verify button shows "MAKE YOUR PICK"
3. Click the button
4. Verify modal title shows "Pick Your Driver for Monaco GP"
5. Verify no current pick display section is shown
6. Select a driver (e.g., Max Verstappen)
7. Click "Confirm Pick"
8. Verify confirmation modal shows "Confirm Your Pick"
9. Click "Confirm Pick" in confirmation modal

**Expected Results:**
- Button should update to "PICKED: VERSTAPPEN (CHANGE)"
- Pick should be saved in localStorage
- Modal should close

### 2. Pick Change Flow (Before Deadline)
**Prerequisites:** Complete Test Scenario 1

**Steps:**
1. Verify button shows "PICKED: VERSTAPPEN (CHANGE)"
2. Click the button
3. Verify modal title shows "Change Your Pick for Monaco GP"
4. Verify current pick display shows "Currently selected: Max Verstappen"
5. Verify Max Verstappen card has "CURRENT PICK" badge
6. Select a different driver (e.g., Lewis Hamilton)
7. Click "Confirm Change" button (should be orange)
8. Verify confirmation modal shows "Confirm Pick Change"
9. Verify warning shows "You are changing from Max Verstappen to Lewis Hamilton"
10. Click "Confirm Pick"

**Expected Results:**
- Button should update to "PICKED: HAMILTON (CHANGE)"
- localStorage should show updated pick (not a new one)
- Original pick should be replaced

### 3. Multiple Pick Changes
**Prerequisites:** Complete Test Scenario 2

**Steps:**
1. Change pick again to another driver (e.g., Charles Leclerc)
2. Verify all UI elements update correctly
3. Check localStorage to ensure only one pick exists for the race

**Expected Results:**
- Each change should replace the previous pick
- No pick history should be created (MVP requirement)
- Button should always show current driver

### 4. Deadline Enforcement
**Setup:** Modify race deadline to be in the past

**Steps:**
1. In console, set deadline to past: 
   ```javascript
   const raceData = JSON.parse(localStorage.getItem('nextRaceData'));
   raceData.pickDeadline = new Date(Date.now() - 3600000).toISOString();
   localStorage.setItem('nextRaceData', JSON.stringify(raceData));
   ```
2. Refresh the page
3. Verify button shows "PICKED: LECLERC" (no CHANGE text)
4. Click the button
5. Verify button is disabled

**Expected Results:**
- Button should not show "(CHANGE)" when deadline passed
- Clicking should do nothing
- Pick should remain locked

### 5. Invalid Change Attempts
**Setup:** Reset deadline to future, make a pick

**Steps:**
1. Make initial pick (e.g., George Russell)
2. Click to change pick
3. Try to select a previously picked driver (grayed out)
4. Verify you cannot select them

**Expected Results:**
- Previously picked drivers remain unselectable
- Current pick is highlighted differently than previously picked
- Error handling prevents invalid selections

### 6. UI State Validation
**Test all visual states:**

1. **Button States:**
   - "MAKE YOUR PICK" - no pick made
   - "PICKED: [DRIVER] (CHANGE)" - pick made, can change
   - "PICKED: [DRIVER]" - pick made, deadline passed

2. **Modal States:**
   - Title: "Pick Your Driver" vs "Change Your Pick"
   - Current pick display visibility
   - Confirm button: "Confirm Pick" vs "Confirm Change"

3. **Driver Card States:**
   - Normal selectable
   - Previously picked (grayed out)
   - Current pick (red border with badge)
   - Selected for change (highlighted)

### 7. Data Integrity Tests
**In browser console:**

```javascript
// Check pick structure
const picks = JSON.parse(localStorage.getItem('f1survivor_user_picks'));
console.log('Picks:', picks);

// Verify pick has all required fields
const currentPick = picks.picks.find(p => p.raceId === 'monaco-gp-2025');
console.log('Current pick:', currentPick);
// Should have: driverId, driverName, teamName, timestamp, raceId, isAutoPick

// Verify only one pick per race
const monacoPicksCount = picks.picks.filter(p => p.raceId === 'monaco-gp-2025').length;
console.log('Monaco picks count:', monacoPicksCount); // Should be 1
```

### 8. Edge Cases

1. **Rapid Clicking:**
   - Click change button multiple times rapidly
   - Should not create duplicate modals or corrupt data

2. **Browser Back/Forward:**
   - Make a pick, navigate away, come back
   - Pick state should persist correctly

3. **Multiple Tabs:**
   - Open app in two tabs
   - Make pick in one tab
   - Refresh other tab - should show same pick

## Performance Checks
- Modal opening should be instant (<100ms)
- Pick saving should complete quickly (<500ms)
- No memory leaks from repeated pick changes

## Cross-Browser Testing
Test on:
- Chrome (latest)
- Safari (latest)
- Firefox (latest)
- Mobile Safari (iOS)
- Chrome Mobile (Android)

## Validation Checklist
- [ ] No console errors during any flow
- [ ] All animations smooth and complete
- [ ] localStorage data structure correct
- [ ] Deadline enforcement works correctly
- [ ] UI states match implementation plan
- [ ] Pick changes work as simple replacements
- [ ] No pick history is created (MVP requirement)

## Known Limitations (MVP)
- No pick change history tracking
- No undo functionality
- No change reason tracking
- No email notifications for changes

---
**Test Date:** May 24, 2025  
**Tester:** _____________  
**Results:** _____________ 