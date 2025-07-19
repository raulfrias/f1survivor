# F1 Survivor - Project Structure Guide

**Last Updated:** July 19, 2025  
**Version:** 2.0 (Post-Reorganization)

## Overview

This guide provides developers with a comprehensive understanding of the F1 Survivor project structure after the complete reorganization. The new modular architecture improves maintainability, scalability, and developer experience.

## Directory Structure

```
f1survivor-new/
├── index.html                  # Main entry point (redirects to src/pages/index.html)
├── vite.config.js              # Build configuration with path aliases
├── package.json                # Dependencies and scripts
├── src/                        # Frontend source code
│   ├── app.js                  # Core application logic
│   ├── components/             # Reusable UI components
│   │   ├── auth/              # Authentication components
│   │   ├── dashboard/         # Dashboard components
│   │   ├── elimination/       # Elimination zone components
│   │   └── league/            # League management components
│   ├── services/              # Business logic and API calls
│   │   ├── auth/              # Authentication services
│   │   ├── aws/               # AWS Amplify integration
│   │   ├── league/            # League management services
│   │   ├── pick/              # Pick management services
│   │   ├── race/              # Race-related services
│   │   ├── elimination/       # Elimination logic services
│   │   └── api/               # External API integrations
│   ├── utils/                 # Utility functions
│   ├── styles/                # CSS stylesheets
│   │   ├── global/            # Global styles
│   │   ├── pages/             # Page-specific styles
│   │   ├── components/        # Component-specific styles
│   │   ├── auth/              # Authentication styles
│   │   └── league/            # League management styles
│   ├── pages/                 # HTML pages
│   └── data/                  # Static data files
├── tests/                     # Test files
│   ├── integration/           # Integration tests (HTML + JS)
│   └── unit/                  # Unit tests (JS only)
├── docs/                      # Documentation
│   ├── testing/               # Testing guides
│   ├── implementation-plans/  # Feature implementation plans
│   └── development/           # Developer guides
├── scripts/                   # Build and utility scripts
├── public/                    # Static assets
├── config/                    # Configuration files
├── amplify/                   # AWS Amplify backend (unchanged)
└── dist/                      # Build output
```

## Key Architectural Principles

### 1. Separation of Concerns
- **Components:** UI-only logic, no business logic
- **Services:** Business logic and API calls
- **Utils:** Pure utility functions
- **Styles:** Organized by feature/component

### 2. Feature-Based Organization
- Each feature has its own directory under `components/` and `services/`
- Related files are grouped together (e.g., all league files in `league/`)
- CSS files mirror the component structure

### 3. Import Path Aliases
The project uses Vite path aliases for clean imports:

```javascript
// Instead of relative paths like:
import AuthManager from '../../../services/auth/AuthManager.js'

// Use clean aliases:
import AuthManager from '@/services/auth/AuthManager.js'
```

**Available Aliases:**
- `@` → `src/`
- `@components` → `src/components/`
- `@services` → `src/services/`
- `@utils` → `src/utils/`
- `@styles` → `src/styles/`
- `@pages` → `src/pages/`
- `@assets` → `src/assets/`
- `@tests` → `tests/`
- `@docs` → `docs/`
- `@scripts` → `scripts/`
- `@config` → `config/`

## Development Workflow

### Adding New Components
1. Create component in appropriate `src/components/` subdirectory
2. Create corresponding CSS file in `src/styles/` matching the structure
3. Use path aliases for imports
4. Add tests in `tests/integration/` or `tests/unit/`

### Adding New Services
1. Create service in appropriate `src/services/` subdirectory
2. Follow the existing service patterns (singleton, async/await)
3. Add error handling and logging
4. Create corresponding tests

### Adding New Pages
1. Create HTML file in `src/pages/`
2. Create corresponding CSS in `src/styles/pages/`
3. Update `vite.config.js` if needed for multi-page setup
4. Add navigation links

## File Naming Conventions

### Components
- **PascalCase:** `LeagueSelector.js`, `AuthUI.js`
- **Descriptive names:** Indicate purpose clearly
- **Consistent suffixes:** `Manager.js`, `UI.js`, `Handler.js`

### Services
- **PascalCase:** `AuthManager.js`, `LeagueIntegration.js`
- **Action-oriented names:** Describe what the service does
- **Consistent patterns:** `*Manager.js`, `*Service.js`, `*Handler.js`

### Utilities
- **PascalCase:** `DashboardUtils.js`, `StorageUtils.js`
- **Function-focused names:** Describe the utility functions
- **Consistent suffixes:** `Utils.js`, `Helper.js`

### Styles
- **kebab-case:** `auth-modal.css`, `league-selector.css`
- **Component-specific:** Match the component name
- **Organized by feature:** Group related styles together

## Testing Structure

### Integration Tests (`tests/integration/`)
- HTML files with embedded JavaScript
- Test complete user workflows
- Include UI interactions and API calls
- Examples: `test-league-system.html`, `test-multi-user-scenarios.html`

### Unit Tests (`tests/unit/`)
- Pure JavaScript files
- Test individual functions and services
- No DOM dependencies
- Examples: `test-elimination-scenarios.js`, `test-lives-system-api.js`

## Build Configuration

### Vite Configuration
- **Multi-page setup:** Supports both index and dashboard pages
- **Path aliases:** Clean import paths
- **Development server:** Serves from root directory
- **Production build:** Optimized output in `dist/`

### Development Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

## AWS Amplify Integration

### Backend Structure
- **`amplify/` directory:** Must remain unchanged (AWS requirement)
- **Backend services:** Auth, data, storage configured in `amplify/`
- **Local development:** Use `npx ampx sandbox` for backend testing

### Frontend Integration
- **AWS services:** Located in `src/services/aws/`
- **Authentication:** Integrated via Cognito
- **Data persistence:** DynamoDB via GraphQL
- **Real-time updates:** AppSync subscriptions

## Common Patterns

### Service Pattern
```javascript
// Singleton pattern for services
class AuthManager {
    constructor() {
        if (AuthManager.instance) {
            return AuthManager.instance;
        }
        AuthManager.instance = this;
        this.initialize();
    }
    
    async initialize() {
        // Service initialization
    }
}

export const authManager = new AuthManager();
```

### Component Pattern
```javascript
// Component with lifecycle management
class LeagueSelector {
    constructor() {
        this.initialize();
    }
    
    initialize() {
        // DOM setup and event listeners
    }
    
    destroy() {
        // Cleanup event listeners
    }
}
```

### Utility Pattern
```javascript
// Pure functions with clear inputs/outputs
export function formatDriverName(firstName, lastName) {
    return `${firstName} ${lastName}`;
}
```

## Migration Notes

### From Old Structure
- All files have been moved to new locations
- Import paths updated to use aliases
- Build configuration optimized
- Documentation updated

### Breaking Changes
- **Import paths:** Must use new alias-based paths
- **File locations:** All files moved to new structure
- **Build process:** Updated Vite configuration

### Compatibility
- **AWS Amplify:** Backend unchanged, fully compatible
- **Browser support:** Same as before
- **Development workflow:** Improved with better organization

## Best Practices

### Code Organization
1. **Keep components focused:** One responsibility per component
2. **Use services for business logic:** Don't put business logic in components
3. **Leverage utilities:** Extract common functions to utils
4. **Organize styles:** Match CSS structure to component structure

### Development
1. **Use path aliases:** Avoid relative imports
2. **Follow naming conventions:** Consistent file and function names
3. **Add tests:** Include tests for new features
4. **Update documentation:** Keep guides current

### Performance
1. **Lazy load components:** Use dynamic imports for large components
2. **Optimize imports:** Only import what you need
3. **Use build optimization:** Leverage Vite's built-in optimizations

## Troubleshooting

### Common Issues
1. **Import errors:** Check path aliases and file locations
2. **Build failures:** Verify Vite configuration
3. **Missing styles:** Check CSS file locations and imports
4. **Test failures:** Update test file paths

### Debugging
1. **Check console errors:** Browser dev tools for import issues
2. **Verify file paths:** Ensure files are in correct locations
3. **Test build process:** Run `npm run build` to catch issues
4. **Check documentation:** Refer to this guide for structure

## Future Considerations

### Scalability
- **Modular structure:** Easy to add new features
- **Clear separation:** Prevents code duplication
- **Testable architecture:** Supports comprehensive testing
- **Documentation:** Maintains developer onboarding

### Maintenance
- **Consistent patterns:** Reduces cognitive load
- **Clear organization:** Makes debugging easier
- **Comprehensive testing:** Catches issues early
- **Updated documentation:** Keeps team aligned

This structure provides a solid foundation for continued development while maintaining code quality and developer productivity. 