# Phase 1 Testing Guide - Advanced League Customization (Multiple Lives System)

## 🎯 Overview

This guide provides comprehensive testing scenarios for validating Phase 1 implementation of the Advanced League Customization feature with Multiple Lives System & Admin Controls.

## 📋 Testing Checklist

### ✅ Core Features Implemented
- [x] Database schema with lives tracking (LeagueMember + LifeEvent models)
- [x] Lives configuration in league creation (1-5 lives)
- [x] Lives indicators in UI (♥ symbols)
- [x] Lives-based elimination logic
- [x] Admin controls for lives management
- [x] Backward compatibility with single-life leagues

---

## 🧪 Test Scenarios

### **Test Section 1: Database Schema Validation**

#### **1.1 LeagueMember Model Enhancement**
**Objective**: Verify that LeagueMember model has new lives tracking fields

**Test Steps**:
1. Open browser developer tools
2. Navigate to `tests/integration/test-lives-system-phase1.html`
3. Click "Test Schema" button
4. Verify output shows required fields

**Expected Results**:
- ✅ `remainingLives` field exists (integer, default: 1)
- ✅ `livesUsed` field exists (integer, default: 0)
- ✅ `maxLives` field exists (integer, default: 1)
- ✅ `eliminationHistory` field exists (JSON array)

**Validation**: Check AWS Amplify schema deployment

#### **1.2 LifeEvent Model Creation**
**Objective**: Verify that LifeEvent model exists for audit trail

**Test Steps**:
1. Check `amplify/data/resource.ts` for LifeEvent model
2. Verify model has required fields

**Expected Results**:
- ✅ Model has `eventType` enum: 'LIFE_LOST', 'LIFE_RESTORED', 'FINAL_ELIMINATION'
- ✅ Model has `livesRemaining` field
- ✅ Model has `adminUserId` and `adminReason` for admin actions
- ✅ Model has proper authorization rules

---

### **Test Section 2: League Creation with Lives System**

#### **2.1 Lives Configuration UI**
**Objective**: Test league creation modal with lives configuration

**Test Steps**:
1. Open main application
2. Click "Create League" button
3. Enable "Multiple Lives System" checkbox
4. Select different lives options (1-5)
5. Create league

**Expected Results**:
- ✅ Lives configuration section appears when checkbox enabled
- ✅ Dropdown shows options: 1-5 lives
- ✅ Default selection is 3 lives
- ✅ Explanation text appears below options
- ✅ League creation includes lives settings

**Edge Cases to Test**:
- Disable/enable lives checkbox multiple times
- Create league without enabling lives (backward compatibility)
- Try creating league with invalid data

#### **2.2 Lives Validation**
**Objective**: Test that lives configuration validation works

**Test Steps**:
1. Test valid lives values: 1, 2, 3, 4, 5
2. Test invalid values would be rejected (0, 6, negative numbers)

**Expected Results**:
- ✅ Only 1-5 lives allowed
- ✅ Error messages for invalid values
- ✅ Form prevents submission with invalid data

#### **2.3 Backward Compatibility**
**Objective**: Ensure existing single-life functionality continues

**Test Steps**:
1. Create league without enabling lives system
2. Verify default behavior matches original system
3. Join league and verify member initialization

**Expected Results**:
- ✅ Single-life leagues work as before
- ✅ Members get 1 life by default
- ✅ Elimination logic functions normally

---

### **Test Section 3: Lives Indicators & Visual System**

#### **3.1 Lives Display Components**
**Objective**: Test visual lives indicators

**Test Steps**:
1. Open `tests/integration/test-lives-system-phase1.html`
2. Click "Test Display" button
3. View lives indicator examples

**Expected Results**:
- ✅ Remaining lives show as green hearts (♥)
- ✅ Lost lives show as faded/gray hearts
- ✅ Lives display properly in member lists
- ✅ Eliminated members show all lives lost

**Test Scenarios**:
```
Player 1: ♥♥♥ (3/3 lives) - All green
Player 2: ♥♥♡ (2/3 lives) - 2 green, 1 gray  
Player 3: ♡♡♡ (0/3 lives) - All gray, eliminated
```

#### **3.2 League Settings Modal**
**Objective**: Test lives management in league settings

**Test Steps**:
1. Create a league with lives enabled
2. Open league settings as owner
3. Modify lives configuration
4. Test settings as non-owner

**Expected Results**:
- ✅ Lives settings section appears
- ✅ Current configuration displayed
- ✅ Lives modification controls work
- ✅ Non-owners cannot modify lives
- ✅ Settings lock after season starts (if implemented)

#### **3.3 Mobile Responsiveness**
**Objective**: Test lives indicators on mobile devices

**Test Steps**:
1. Open test page on mobile device or use browser dev tools
2. Test lives indicators at various screen sizes
3. Verify touch interactions work

**Expected Results**:
- ✅ Lives indicators scale properly
- ✅ Touch interactions work correctly
- ✅ No horizontal scrolling issues
- ✅ Text remains readable

---

### **Test Section 4: API & Backend Functionality**

#### **4.1 Lives Configuration Management**
**Objective**: Test API methods for managing lives settings

**Test Steps**:
1. Open browser console
2. Run: `new LivesSystemAPITester().runAllAPITests()`
3. Review API test results

**Expected Results**:
- ✅ `updateLeagueLivesSettings()` method works
- ✅ `getLeagueLivesConfiguration()` method works
- ✅ Settings validation prevents invalid configurations
- ✅ Owner permissions enforced

#### **4.2 Member Lives Management**
**Objective**: Test API methods for managing individual member lives

**Test Steps**:
1. Test `getMemberLivesStatus()` method
2. Test `updateMemberLives()` method (admin only)
3. Verify audit trail creation

**Expected Results**:
- ✅ Member lives status retrieved correctly
- ✅ Admin can adjust member lives
- ✅ Operations create audit trail entries
- ✅ Non-admins cannot adjust lives

#### **4.3 League Join with Lives Initialization**
**Objective**: Test that joining leagues properly initializes member lives

**Test Steps**:
1. Create league with 3 lives
2. Join league with different user
3. Verify member initialization

**Expected Results**:
- ✅ New member gets `maxLives` from league settings
- ✅ `remainingLives` equals `maxLives` initially
- ✅ `livesUsed` starts at 0
- ✅ `eliminationHistory` starts empty

---

### **Test Section 5: Lives-Based Elimination Logic**

#### **5.1 Life Loss Processing**
**Objective**: Test that lives are lost when drivers finish outside top 10

**Test Steps**:
1. Open `tests/unit/test-lives-system-api.js` in console
2. Run elimination simulation
3. Review mock race results processing

**Expected Race Results**:
```
P1-P10: Drivers finish in top 10 → No life lost ✅
P11+:   Drivers finish outside top 10 → Life lost ❌
```

**Expected Results**:
- ✅ P1-P10 finishes don't affect lives
- ✅ P11+ finishes result in life loss
- ✅ Elimination history updated
- ✅ Member status updated correctly

#### **5.2 Final Elimination**
**Objective**: Test final elimination when all lives are lost

**Test Scenarios**:
```
Scenario A: Member with 1 life loses final life
Scenario B: Member with multiple lives loses last life
Scenario C: Multiple members eliminated in same race
```

**Expected Results**:
- ✅ Member status changes to 'ELIMINATED'
- ✅ `eliminatedAt` timestamp set
- ✅ Final elimination event created
- ✅ Member cannot make future picks

#### **5.3 Elimination Engine Processing**
**Objective**: Test race result processing engine

**Test Steps**:
1. Use mock race data from test files
2. Process results through elimination engine
3. Verify multiple leagues handled correctly

**Expected Results**:
- ✅ All league picks processed
- ✅ Lives updated based on results
- ✅ Audit trail created for all events
- ✅ League statistics updated

---

### **Test Section 6: Admin Controls & Management**

#### **6.1 Admin Life Adjustment**
**Objective**: Test admin ability to manually adjust member lives

**Test Operations**:
```javascript
// SET operation: Set lives to specific value
{ operation: 'SET', value: 3, reason: 'Error correction' }

// ADD operation: Add lives (up to maxLives)
{ operation: 'ADD', value: 1, reason: 'Bonus life' }

// SUBTRACT operation: Remove lives (minimum 0)
{ operation: 'SUBTRACT', value: 1, reason: 'Penalty' }
```

**Expected Results**:
- ✅ Lives adjusted correctly within limits
- ✅ Audit trail created with admin reason
- ✅ Member status updated if needed
- ✅ Only league owners can perform operations

#### **6.2 Audit Trail**
**Objective**: Test that all life events are properly logged

**Test Steps**:
1. Perform various life operations
2. Check LifeEvent records created
3. Verify audit data completeness

**Expected Results**:
- ✅ All operations create LifeEvent records
- ✅ Events include complete context (race, driver, reason)
- ✅ Admin actions properly attributed
- ✅ Timestamps accurate

#### **6.3 Permission Validation**
**Objective**: Test that only authorized users can manage lives

**Test Scenarios**:
```
League Owner → Manage lives: ALLOWED ✅
Regular Member → Manage lives: DENIED ❌
Non-Member → Manage lives: DENIED ❌
```

**Expected Results**:
- ✅ Permission checks enforced at API level
- ✅ Error messages clear and helpful
- ✅ UI controls hidden for unauthorized users

---

## 🚨 Critical Test Cases

### **High Priority Tests**

1. **Data Integrity**: Lives never exceed maxLives or go below 0
2. **Elimination Logic**: P11+ always results in life loss
3. **Admin Controls**: Only owners can adjust lives
4. **Backward Compatibility**: Single-life leagues still work
5. **Mobile Responsiveness**: Lives indicators work on all devices

### **Edge Cases**

1. **Empty Leagues**: Leagues with no members
2. **Single Member**: League with only owner
3. **All Eliminated**: League where all members eliminated
4. **Race Results Missing**: Handle missing driver results gracefully
5. **Network Issues**: API failures handled properly

### **Performance Tests**

1. **Large Leagues**: 50+ members with lives processing
2. **Multiple Races**: Season-long elimination tracking
3. **Concurrent Operations**: Multiple admin operations simultaneously

---

## ✅ Acceptance Criteria

### **Phase 1 Complete When**:

- [ ] All database schema changes deployed successfully
- [ ] League creation with lives configuration works
- [ ] Lives indicators display correctly in all contexts
- [ ] Elimination logic processes race results accurately
- [ ] Admin controls function properly with permissions
- [ ] Backward compatibility maintained
- [ ] Mobile experience is responsive
- [ ] API methods handle errors gracefully
- [ ] Audit trail captures all operations
- [ ] Test suite passes at 95%+ success rate

### **Ready for Phase 2 When**:

- [ ] Phase 1 acceptance criteria met
- [ ] No critical bugs identified
- [ ] Performance acceptable for target user load
- [ ] Code review completed
- [ ] Documentation updated

---

## 🔧 Test Environment Setup

### **Local Testing**:
1. Open `tests/integration/test-lives-system-phase1.html` in browser
2. Open browser developer console
3. Run individual test sections
4. Review results and logs

### **API Testing**:
1. Load `tests/unit/test-lives-system-api.js` in console
2. Execute: `new LivesSystemAPITester().runAllAPITests()`
3. Review test results and mock data

### **Manual Testing**:
1. Use main application to create leagues
2. Test with multiple user accounts
3. Simulate real-world usage scenarios

---

## 📊 Test Reporting

### **Test Results Format**:
```javascript
{
  timestamp: "2025-01-XX",
  summary: {
    total: 18,
    passed: 17,
    failed: 1
  },
  details: {
    testName: { status: 'pass', message: 'Success' }
  }
}
```

### **Bug Reporting**:
Include:
- Test scenario that failed
- Expected vs actual behavior
- Steps to reproduce
- Browser/device information
- Console errors or logs

---

**Ready to test Phase 1! 🚀** 