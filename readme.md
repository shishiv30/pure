# Pure UI

A lightweight, high-performance UI framework focused on delivering exceptional user experiences with pure JavaScript and CSS.

## Features

- ⚡ High Performance
- 🎨 Modern UI Components
- 🎯 Responsive Design
- 🔧 Easy to Customize
- 🛠️ Developer Friendly
- 🌐 Progressive Web App (PWA) Support
- 📊 Built-in Data Management
- 🗺️ Map Integration Support

## Components

Pure UI provides a set of ready-to-use components that can be easily integrated into your project. Here are some commonly used components:

### Understanding data-role

The `data-role` attribute is a core concept in Pure UI that connects HTML elements with their corresponding JavaScript behaviors. It serves as a declarative way to initialize components and their functionality.

#### Common data-role Values:

1. **tab**
   - Initializes tab functionality
   - Requires matching `data-target` attributes on tab buttons
   - Example:
   ```html
   <div data-role="tab">
       <button data-target="tab1">Tab 1</button>
   </div>
   ```

2. **collapse**
   - Creates collapsible content sections
   - Requires matching `data-target` attribute pointing to the content
   - Example:
   ```html
   <button data-role="collapse" data-target="#content">Toggle</button>
   <div id="content" class="collapse-panel">Content</div>
   ```

3. **dialog**
   - Initializes modal dialog functionality
   - Requires `data-target` pointing to the dialog template
   - Optional `data-theme` for different styles (default, fullscreen, dropdown)
   - Example:
   ```html
   <button data-role="dialog" data-target="#dialog1">Open Dialog</button>
   <script id="dialog1" type="text/template">Content</script>
   ```

4. **form**
   - Enables form validation and submission handling
   - Can include `data-onsubmit` for custom submission behavior
   - Example:
   ```html
   <form data-role="form" data-onsubmit="submit">
       <input data-role="validate" data-type="required">
   </form>
   ```

5. **player**
   - Initializes image player/slider
   - Requires `data-images` array of image paths
   - Example:
   ```html
   <div data-role="player" data-images='["img1.jpg", "img2.jpg"]'>
   ```

6. **album**
   - Creates image album/gallery
   - Similar to player but with different layout
   - Example:
   ```html
   <div data-role="album" data-images='["img1.jpg", "img2.jpg"]'>
   ```

7. **textbox**
   - Enhanced input field with validation
   - Can include `data-validate` for validation rules
   - Example:
   ```html
   <div data-role="textbox">
       <input data-validate="required,email">
   </div>
   ```

#### data-role Attributes and Modifiers:

1. **data-target**
   - Links elements together (e.g., tab buttons to content)
   - Can be an ID or a custom identifier
   ```html
   <button data-target="content1">Show Content 1</button>
   <div data-id="content1">Content</div>
   ```

2. **data-validate**
   - Specifies validation rules
   - Multiple rules can be comma-separated
   ```html
   <input data-validate="required,email,phone">
   ```

3. **data-type**
   - Specifies the type of validation or behavior
   - Common values: required, email, phone, number
   ```html
   <input data-type="required,email">
   ```

4. **data-theme**
   - Modifies the appearance of components
   - Common values: default, fullscreen, dropdown
   ```html
   <div data-role="dialog" data-theme="fullscreen">
   ```

5. **data-images**
   - JSON array of image paths for media components
   ```html
   <div data-role="player" data-images='["img1.jpg", "img2.jpg"]'>
   ```

#### Best Practices:

1. **Component Initialization**
   - Always include the appropriate `data-role` attribute
   - Ensure all required attributes are present
   - Follow the component's HTML structure

2. **Validation**
   - Use appropriate validation rules
   - Combine multiple rules with commas
   - Include required attributes for validation

3. **Event Handling**
   - Use `data-onsubmit` for form submission
   - Use `data-onclick` for custom click handlers
   - Follow the event naming convention

4. **Accessibility**
   - Include appropriate ARIA labels
   - Maintain proper HTML structure
   - Ensure keyboard navigation support

### Tab Component
```html
<div data-role="tab">
    <button type="button" class="tab default active" data-target="tab1">Tab1</button>
    <button type="button" class="tab default" data-target="tab2">Tab2</button>
    <button type="button" class="tab default" data-target="tab3">Tab3</button>
</div>
<div class="panel inline default tab-panel">
    <div data-id="tab1">Tab1 Content</div>
    <div data-id="tab2" class="hide">Tab2 Content</div>
    <div data-id="tab3" class="hide">Tab3 Content</div>
</div>
```

### Button Component
```html
<button type="button" class="btn default small active">
    <i class="icon-plus"></i> Apply
</button>
<button type="button" class="btn gray active">Gray Button</button>
<button type="button" class="btn danger active">Danger Button</button>
<button type="button" class="btn minor active">Minor Button</button>
<button type="button" class="btn major active">Major Button</button>
<button type="button" class="btn safe active">Safe Button</button>
```

### Tag Component
```html
<button type="button" class="tag default"><i class="icon-plus"></i> Tag</button>
<button type="button" class="tag gray">Gray Tag</button>
<button type="button" class="tag danger">Danger Tag</button>
<button type="button" class="tag minor">Minor Tag</button>
<button type="button" class="tag major">Major Tag</button>
<button type="button" class="tag safe">Safe Tag</button>
```

### Collapse Component
```html
<button type="button" data-role="collapse" data-target="#collapsePanel">
    <span>Show Content</span>
    <i class="icon-angle-left"></i>
</button>
<div id="collapsePanel" class="collapse-panel">
    Collapsible content goes here...
</div>
```

### Dialog Component
```html
<a class="btn default small" href="javascript:;" data-role="dialog" data-target="#dialogPanel">
    Open Dialog
</a>
<script id="dialogPanel" type="text/template">
    <div class="grid grid-xs-1 large">
        <div class="h4">Dialog Title</div>
        <div>Dialog content goes here...</div>
    </div>
</script>
```

### Form Components
```html
<form class="grid grid-xs-1" data-role="form" data-onsubmit="submit">
    <!-- Text Input -->
    <div class="input left">
        <i class="icon-user"></i>
        <input name="username" placeholder="Username" data-role="validate" data-type="required" />
    </div>
    
    <!-- Select Box -->
    <div class="selectbox">
        <select name="option" data-validate="required">
            <option value="" selected disabled>Select an option</option>
            <option value="1">Option 1</option>
            <option value="2">Option 2</option>
        </select>
        <i class="icon-angle-down"></i>
    </div>
    
    <!-- Radio Buttons -->
    <div class="radio">
        <label>
            <input type="radio" name="gender" value="male" />
            <span>Male</span>
        </label>
        <label>
            <input type="radio" name="gender" value="female" />
            <span>Female</span>
        </label>
    </div>
    
    <!-- Checkboxes -->
    <div class="checkbox">
        <label>
            <input type="checkbox" name="hobby" value="reading" />
            <span>Reading</span>
        </label>
        <label>
            <input type="checkbox" name="hobby" value="sports" />
            <span>Sports</span>
        </label>
    </div>
</form>
```

### Player Component
```html
<div class="player" data-role="player" data-index="0"
    data-images='["img1.jpg", "img2.jpg", "img3.jpg"]'>
    <img src="img1.jpg" alt="Player Image One">
    <img src="img2.jpg" alt="Player Image Two">
</div>
```

### Album Component
```html
<div class="album" data-role="album" data-index="0"
    data-images='["img1.jpg", "img2.jpg", "img3.jpg"]'>
    <div class="album-list">
        <img src="img1.jpg" loading="lazy" alt="album photos">
    </div>
</div>
```

## Installation

```bash
npm install
```

## Development

### Client-Side Development
Start the development server with hot-reload:
```bash
npm run dev
```

### Server-Side Development
Start the backend server with auto-reload:
```bash
npm run server
```

### API Documentation
After starting the server, you can access:
- API Documentation: `http://localhost:3000/api-docs`
- Search Page: `http://localhost:3000/demo/ca/san-jose`

## Building

### Development Build
```bash
npm run build
```

### Production Build
```bash
npm run prod
```

## Deployment

To deploy a new version:
```bash
npm run prod    # Build for production
npm run deploy  # Deploy to GitHub Pages
```

## Project Structure

```
├── client/         # Frontend source code
│   ├── js/        # JavaScript source files
│   ├── pages/     # Page templates
│   └── assets/    # Static assets
├── server/         # Backend source code
│   ├── routes/    # API routes
│   ├── models/    # Data models
│   └── config/    # Server configuration
├── dist/          # Build output
├── helpers/       # Utility functions
└── data/          # Data files
```

## Core Concepts

The framework uses a simple but powerful set of concepts:

- **Layout System**:
  - `flex`: For single-item layouts (object with fields)
  - `grid`: For multiple-item layouts (arrays)
  - `horizontal/vertical`: Direction settings
  - `gap`: Spacing between elements

- **Responsive Design**:
  - `xs`: Phone devices
  - `sm`: Tablet devices
  - `md`: Desktop devices
  - `lg`: Large desktop devices

- **Spacing**:
  - `large`: Preset large gap
  - `small`: Preset small gap
  - `normal`: Default gap size

- **Color System**:
  - Scale from 0-9 (lowest to highest)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## Author

Created by [conjee zou](https://github.com/shishiv30)

## Support

If you encounter any issues or have questions, please [open an issue](https://github.com/shishiv30/pure/issues).
