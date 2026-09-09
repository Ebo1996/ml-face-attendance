# Contributing to Face Recognition Attendance System

First off, thank you for considering contributing to Face Recognition Attendance System! It's people like you that make this project such a great tool.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

* Use a clear and descriptive title
* Describe the exact steps which reproduce the problem
* Provide specific examples to demonstrate the steps
* Describe the behavior you observed after following the steps
* Explain which behavior you expected to see instead and why
* Include screenshots if possible
* Include your environment details (OS, Python version, Node version, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

* Use a clear and descriptive title
* Provide a step-by-step description of the suggested enhancement
* Provide specific examples to demonstrate the steps
* Describe the current behavior and explain which behavior you expected to see instead
* Explain why this enhancement would be useful

### Pull Requests

* Fill in the required template
* Do not include issue numbers in the PR title
* Follow the Python and TypeScript style guides
* Include thoughtfully-worded, well-structured tests
* Document new code
* End all files with a newline

## Development Process

1. Fork the repo
2. Create a new branch from `main`
3. Make your changes
4. Run tests
5. Commit your changes (use conventional commits)
6. Push to your fork
7. Create a Pull Request

### Branch Naming Convention

* `feature/` - New features
* `bugfix/` - Bug fixes
* `hotfix/` - Critical fixes
* `docs/` - Documentation updates
* `refactor/` - Code refactoring

### Commit Message Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

## Style Guides

### Python Style Guide

* Follow PEP 8
* Use 4 spaces for indentation
* Maximum line length: 100 characters
* Use type hints where possible
* Write docstrings for all functions and classes

### TypeScript Style Guide

* Follow Airbnb style guide
* Use 2 spaces for indentation
* Use functional components with hooks
* Use TypeScript strict mode
* Write JSDoc comments for exported functions

### Git Commit Messages

* Use the present tense ("Add feature" not "Added feature")
* Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
* Limit the first line to 72 characters or less
* Reference issues and pull requests liberally after the first line

## Testing

* Write tests for all new features
* Ensure all tests pass before submitting PR
* Aim for high code coverage

### Running Tests

Backend:
```bash
cd backend
python manage.py test apps
```

Frontend:
```bash
cd frontend
npm test
```

## Documentation

* Update README.md if needed
* Add inline comments for complex logic
* Update API documentation for new endpoints
* Keep CHANGELOG.md up to date

## Questions?

Feel free to open an issue with your question or contact the maintainer directly.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing! 🎉
