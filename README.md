# PennyPilot

A lightweight, personal finance management application built with vanilla HTML, CSS, and JavaScript. Track your expenses, manage your money, and take control of your financial life—no frameworks, no dependencies, just pure web technologies.

## Features

- 💳 **Expense Tracking** - Log and categorize your daily expenses
- 👤 **User Authentication** - Secure login and signup system
- 📊 **Expense Dashboard** - View your spending at a glance
- 🔍 **Search & Filter** - Find expenses by date, category, or amount
- 💾 **Local Storage** - Your data persists in your browser automatically
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- 🎨 **Clean UI** - Simple and intuitive user interface
- 🔐 **Privacy First** - All data stays on your device

### Coming Soon
- 📅 **Budgeting** - Set spending limits and track progress against your budget

## Tech Stack

- **HTML5** - Semantic markup
- **CSS3** - Responsive styling
- **Vanilla JavaScript** - Pure JS with no frameworks or build tools

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- No installation or build process required

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Yusuf-Kamaldeen21/pennypilot.git
   cd pennypilot
   ```

2. **Open the application**
   - Simply open `index.html` in your web browser
   - Or use a local server:
     ```bash
     # Using Python 3
     python -m http.server 8000
     
     # Using Node.js (if you have http-server installed)
     npx http-server
     ```
   - Visit `http://localhost:8000` in your browser

### First Time Setup

1. Visit the authentication page (`auth.html`)
2. Create a new account with your email and password
3. Log in to access the dashboard
4. Start adding your expenses!

## Usage

### Adding an Expense

1. Log in to your account
2. Click on "Add Expense" button
3. Enter the expense details:
   - Amount
   - Category
   - Description
   - Date
4. Click "Save" to add it to your tracker

### Viewing Your Expenses

- Navigate to the dashboard to see all your expenses
- Use the search feature to find specific transactions
- Filter by category or date range to analyze spending patterns

### Managing Your Account

- View your profile settings on the dashboard
- Update your account information as needed
- Log out when you're done

## Project Structure

```
pennypilot/
├── index.html          # Main dashboard page
├── auth.html           # Authentication page (login/signup)
├── style.css           # Global styles and responsive design
├── script.js           # Main application logic
└── README.md           # This file
```

### File Descriptions

- **index.html** - The main dashboard where users view and manage their expenses
- **auth.html** - Authentication page with login and signup forms
- **style.css** - Centralized styling for all pages, includes responsive breakpoints
- **script.js** - Core application logic including:
  - Expense management (add, edit, delete)
  - Local storage operations
  - UI interactions and event handling
  - Data filtering and searching

## How It Works

### Data Storage

PennyPilot uses the browser's `localStorage` API to persist your data:
- All expenses are stored locally on your device
- Data survives browser refreshes and restarts
- No server or internet connection required for basic functionality
- Each user's data is isolated by their login session

### Authentication Flow

1. User registers with email and password
2. Account credentials stored securely in localStorage
3. User logs in with their credentials
4. Session validated for each page visit
5. User logged out clears session data

## Development

### Project Workflow

1. **Clone and navigate** to the project directory
2. **Open `auth.html`** in your browser to start (or `index.html` if already logged in)
3. **Edit files** directly:
   - Modify HTML structure in `.html` files
   - Update styles in `style.css`
   - Add features in `script.js`
4. **Refresh browser** to see changes
5. **Test** across different devices and browsers

### Browser DevTools

Use your browser's developer tools to:
- Inspect the DOM and CSS
- Debug JavaScript in the console
- Monitor localStorage data in the Application/Storage tab
- Test responsive design with device emulation

## Browser Compatibility

- ✅ Chrome/Chromium 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## Contributing

We welcome contributions from everyone! Here's how you can help:

1. **Fork the repository**
   ```bash
   git clone https://github.com/Yusuf-Kamaldeen21/pennypilot.git
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Keep code clean and readable
   - Follow existing code style
   - Add comments for complex logic
   - Test thoroughly in multiple browsers

4. **Commit your changes**
   ```bash
   git commit -m "Add: description of your feature"
   ```

5. **Push to your fork and submit a pull request**
   ```bash
   git push origin feature/your-feature-name
   ```

### Code Style Guidelines

- Use meaningful variable and function names
- Keep functions focused and single-purpose
- Add comments for non-obvious logic
- Format code consistently (2-space indentation)
- Test on mobile devices before submitting

## Troubleshooting

### Application won't load
- Clear your browser cache and localStorage
- Try opening in a different browser
- Check browser console for errors (F12 or right-click → Inspect)

### Data not persisting
- Ensure localStorage is enabled in your browser
- Check if you're in private/incognito mode (localStorage may be disabled)
- Verify browser storage limits haven't been exceeded

### Login issues
- Clear cookies and site data for the domain
- Try resetting your password
- Ensure JavaScript is enabled

## Future Roadmap

- 📅 **Budgeting Feature** - Set and track spending budgets
- 📈 **Advanced Analytics** - Charts and graphs for expense trends
- 🏷️ **Custom Categories** - Create your own expense categories
- 📤 **Export Data** - Download expenses as CSV
- 🌙 **Dark Mode** - Dark theme for comfortable viewing
- 📵 **Offline Support** - Full functionality without internet

## Support

- 📧 **Issues** - Report bugs on [GitHub Issues](https://github.com/Yusuf-Kamaldeen21/pennypilot/issues)
- 💬 **Discussions** - Ask questions on [GitHub Discussions](https://github.com/Yusuf-Kamaldeen21/pennypilot/discussions)
- 📝 **Documentation** - Check this README for common questions

## License

This project is open source and available under the [MIT License](LICENSE).

---

**Made with ❤️ by [Yusuf-Kamaldeen21](https://github.com/Yusuf-Kamaldeen21)**

Have a question or suggestion? Feel free to open an issue or start a discussion!
