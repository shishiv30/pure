# Event Handling System Documentation

## Overview

The client implements a robust event handling system through the `event.js` module, which provides a flexible and powerful way to manage events throughout the application. The system supports both custom events and DOM events, with namespace support for better event organization.

## Core Event Functions

### 1. Event Registration (`on`)
```javascript
on(eventName, callback, options)
```
- Registers event listeners for custom events or DOM events
- Supports space-separated multiple events
- Supports namespaced events (e.g., 'event.namespace')
- Options parameter for DOM events (e.g., { once: true })

### 2. One-time Event Registration (`once`)
```javascript
once(eventName, callback)
```
- Registers an event listener that will be automatically removed after first execution
- Wrapper around `on` with `{ once: true }` option

### 3. Event Removal (`off`)
```javascript
off(eventName)
```
- Removes event listeners for specified events
- Supports space-separated multiple events
- Handles both custom events and DOM events

### 4. Event Emission (`emit`)
```javascript
emit(eventName, data)
```
- Triggers custom events with optional data
- Supports space-separated multiple events
- Data can be a single value or an array of values

### 5. Event Trigger (`trigger`)
```javascript
trigger(name, ...params)
```
- Versatile function that can:
  - Call a function directly
  - Call a global function by name
  - Emit a custom event

## Event Namespaces

The event system supports namespacing to better organize and manage events:
- Events can be namespaced using dot notation (e.g., 'user.login', 'data.update')
- Default namespace is 'DEFAULT' if not specified
- Namespaces help prevent event name collisions
- Allows for more granular event handling and cleanup

## Usage Examples

### 1. Basic Event Handling
```javascript
// Register event listener
on('user.login', (userData) => {
  console.log('User logged in:', userData);
});

// Emit event
emit('user.login', { id: 1, name: 'John' });
```

### 2. Multiple Events
```javascript
// Register multiple events
on('data.update data.delete', (data) => {
  console.log('Data changed:', data);
});

// Emit multiple events
emit('data.update data.delete', { id: 1 });
```

### 3. One-time Events
```javascript
// Register one-time event
once('initial.load', () => {
  console.log('Initial load complete');
});
```

### 4. Namespaced Events
```javascript
// Register namespaced event
on('user.profile.update', (profile) => {
  console.log('Profile updated:', profile);
});

// Remove specific namespaced event
off('user.profile.update');
```

## Event System Integration

### 1. Plugin System
- Plugins can emit and listen to events
- Events are used for plugin lifecycle management
- Cross-plugin communication through events

### 2. Page Management
- Page transitions and lifecycle events
- Component state changes
- User interaction events

### 3. Data Management
- Data update notifications
- Cache invalidation events
- State synchronization events

## Best Practices

### 1. Event Naming
- Use descriptive, action-oriented names
- Follow consistent naming patterns
- Use namespaces for better organization

### 2. Event Cleanup
- Always remove event listeners when components are destroyed
- Use `off()` to clean up specific events
- Consider using `once()` for one-time events

### 3. Event Data
- Keep event data minimal and relevant
- Use consistent data structures
- Document expected event data formats

### 4. Error Handling
- Implement error handling in event callbacks
- Use try-catch blocks for critical operations
- Log errors appropriately

## Common Event Patterns

### 1. Component Lifecycle Events
```javascript
// Component initialization
on('component.init', (component) => {
  // Initialize component
});

// Component destruction
on('component.destroy', (component) => {
  // Cleanup component
});
```

### 2. State Management Events
```javascript
// State changes
on('state.update', (newState) => {
  // Update UI based on new state
});

// State synchronization
on('state.sync', (data) => {
  // Synchronize state across components
});
```

### 3. User Interaction Events
```javascript
// User actions
on('user.action', (action) => {
  // Handle user action
});

// Form submissions
on('form.submit', (formData) => {
  // Process form submission
});
```

## Event Debugging

### 1. Event Logging
```javascript
// Log all events
on('*', (eventName, data) => {
  console.log(`Event: ${eventName}`, data);
});
```

### 2. Event Tracing
```javascript
// Trace event flow
const originalEmit = emit;
emit = function(eventName, data) {
  console.log(`Emitting: ${eventName}`, data);
  return originalEmit.apply(this, arguments);
};
```

## Performance Considerations

### 1. Event Listener Management
- Remove unused event listeners
- Use `once()` for one-time events
- Implement proper cleanup in component destruction

### 2. Event Data Size
- Keep event data payloads small
- Avoid sending unnecessary data
- Consider using references for large objects

### 3. Event Frequency
- Throttle high-frequency events
- Debounce rapid event sequences
- Batch related events when possible

## Data Attribute Integration

The event system can be triggered through HTML data attributes, providing a declarative way to handle events. This integration allows for easy event binding directly in the markup.

### Data Attribute Syntax
```html
<button data-trigger="user.login" data-params='{"id": 1, "name": "John"}'>
  Login
</button>
```

### Supported Data Attributes

1. **data-trigger**
   - Specifies the event name or function to trigger
   - Can be a function name or event name
   - Example: `data-trigger="user.login"`

2. **data-params**
   - JSON string containing parameters to pass
   - Used when triggering functions or events
   - Example: `data-params='{"id": 1, "name": "John"}'`

### Usage Examples

1. **Triggering Events**
```html
<!-- Trigger a simple event -->
<button data-trigger="user.logout">Logout</button>

<!-- Trigger event with parameters -->
<button data-trigger="user.login" data-params='{"id": 1, "name": "John"}'>
  Login
</button>
```

2. **Triggering Functions**
```html
<!-- Trigger a global function -->
<button data-trigger="handleClick">Click Me</button>

<!-- Trigger function with parameters -->
<button data-trigger="updateUser" data-params='{"id": 1, "name": "John"}'>
  Update User
</button>
```

## Trigger Function Behavior

The `trigger` function provides a versatile way to handle both function calls and event emissions. Its behavior depends on the type of the first argument:

### Function Call Behavior
```javascript
// If the name is a function, it will be called directly
trigger(function() {
  console.log('Function called');
}, arg1, arg2);

// If the name is a string and matches a global function
trigger('globalFunction', arg1, arg2);
// Equivalent to: window.globalFunction(arg1, arg2);
```

### Event Emission Behavior
```javascript
// If the name is a string and no matching global function exists
trigger('custom.event', arg1, arg2);
// Equivalent to: emit('custom.event', [arg1, arg2]);
```

### Implementation Details
```javascript
const trigger = function(name, ...params) {
  if (typeof name === 'function') {
    // Direct function call
    name.apply(this, params);
  } else if (typeof name === 'string') {
    if (typeof window[name] === 'function') {
      // Call global function
      window[name].apply(this, params);
    } else {
      // Emit event
      emit.apply(this, [name, params]);
    }
  }
};
```

### Usage Examples

1. **Direct Function Call**
```javascript
// Call a function directly
trigger(() => {
  console.log('Direct function call');
}, 'arg1', 'arg2');
```

2. **Global Function Call**
```javascript
// Define a global function
window.handleClick = function(param1, param2) {
  console.log('Global function called:', param1, param2);
};

// Call the global function
trigger('handleClick', 'arg1', 'arg2');
```

3. **Event Emission**
```javascript
// Emit an event
trigger('custom.event', 'arg1', 'arg2');
```

4. **Combined Usage**
```javascript
// Can be used in event handlers
on('button.click', (event) => {
  trigger('handleClick', event.target);
});

// Can be used with data attributes
<button data-trigger="handleClick" data-params='{"id": 1}'>
  Click Me
</button>
```

### Best Practices

1. **Function Naming**
   - Use clear, descriptive names for global functions
   - Avoid naming conflicts between functions and events
   - Follow consistent naming conventions

2. **Parameter Handling**
   - Keep parameter lists consistent
   - Document expected parameters
   - Handle missing or invalid parameters gracefully

3. **Error Handling**
   - Implement proper error handling for function calls
   - Log errors appropriately
   - Provide fallback behavior when needed 