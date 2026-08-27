# Contributing to OSS Contributor

Thank you for your interest in contributing to OSS Contributor! This document provides guidelines and information for contributors.

## 🎯 Ways to Contribute

- **Bug Reports** - Report issues you find
- **Feature Requests** - Suggest new features
- **Code Contributions** - Submit pull requests
- **Documentation** - Improve docs and guides
- **Testing** - Help test new features

## 🚀 Getting Started

### 1. Fork the Repository

```bash
# Click the "Fork" button on GitHub, then:
git clone https://github.com/your-username/oss-contributor.git
cd oss-contributor
```

### 2. Set Up Development Environment

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your credentials

# Set up database
npx prisma generate
npx prisma db push

# Start development
npm run dev
```

### 3. Create a Branch

```bash
git checkout -b feat/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

## 📝 Development Guidelines

### Code Style

- Use TypeScript for all new code
- Follow existing code patterns
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new feature
fix: resolve bug
docs: update documentation
style: formatting changes
refactor: code restructuring
test: add tests
chore: maintenance tasks
```

### Pull Request Process

1. **Update documentation** if needed
2. **Add tests** for new features
3. **Ensure all tests pass**: `npm test`
4. **Update the README** if adding features
5. **Request review** from maintainers

## 🐛 Reporting Bugs

Use GitHub Issues with this template:

```markdown
## Bug Description
Clear description of the bug

## Steps to Reproduce
1. Step one
2. Step two
3. Step three

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: [e.g., macOS, Windows]
- Browser: [e.g., Chrome, Firefox]
- Node.js version: [e.g., 18.19.1]
```

## 💡 Feature Requests

Use GitHub Issues with this template:

```markdown
## Feature Description
Clear description of the feature

## Use Case
Why is this feature needed?

## Proposed Solution
How you think it should work

## Alternatives Considered
Other solutions you considered
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run type checking
npm run typecheck

# Run linting
npm run lint
```

## 📚 Documentation

- Update README.md for new features
- Add JSDoc comments to new functions
- Update inline code comments

## 🎨 UI/UX Guidelines

- Follow the existing design system
- Use Tailwind CSS classes
- Ensure responsive design
- Test on multiple screen sizes
- Follow accessibility best practices

## 🔒 Security

If you find a security vulnerability, please report it responsibly:

1. **Do NOT** open a public issue
2. Email security@osscontributor.dev (or use GitHub's private vulnerability reporting)
3. Include details about the vulnerability
4. Allow time for a fix before public disclosure

## ❓ Questions?

- Open a [GitHub Discussion](https://github.com/your-username/oss-contributor/discussions)
- Join our [Discord community](https://discord.gg/osscontributor)

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing! 🎉
