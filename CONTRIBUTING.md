# Contributing to HFT Causal Platform

Thank you for your interest in contributing! This document provides guidelines for participating in the project.

## Code of Conduct

- Be respectful and constructive in all interactions
- Focus on the code and ideas, not personal attributes
- Help create an inclusive environment for all contributors

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 16+
- Docker & Docker Compose
- Familiarity with async Python patterns

### Setup for Development

1. **Fork & clone** the repository
2. **Create a feature branch**: `git checkout -b feature/your-feature-name`
3. **Set up backend**:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```
4. **Set up frontend**:
   ```bash
   cd frontend
   npm install
   ```
5. **Configure environment**:
   ```bash
   cp backend/.env.example backend/.env
   # Add your API keys
   ```

## Development Workflow

### For Backend Changes

1. **Write tests** before implementing features
2. **Follow async patterns**: Use `asyncio` for I/O operations
3. **Type hints**: All functions must have type annotations
4. **Docstrings**: Google-style docstrings for all modules/functions
5. **Linting**: Run `pylint` and `black` before committing

```bash
cd backend
black .
pylint app/
pytest tests/
```

### For Frontend Changes

1. **Follow React conventions**: Functional components with hooks
2. **Component testing**: Unit tests for all components
3. **Styling**: Use Tailwind CSS classes
4. **TypeScript**: Strong typing preferred

```bash
cd frontend
npm run lint
npm run test
npm run build
```

## Commit Guidelines

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add PC algorithm optimization for sparse graphs
fix: resolve queue overflow on high-throughput tickers
docs: clarify DML residualization process
refactor: extract rate limiter to separate module
test: add integration tests for Finnhub stream
```

## Pull Request Process

1. **Create descriptive PR title** following conventional commits
2. **Link related issues**: "Closes #123"
3. **Describe changes**: What, why, and any trade-offs
4. **Request reviews** from relevant maintainers
5. **Address feedback** promptly
6. **Ensure CI passes**: All tests must pass before merge

### PR Template

```markdown
## Description
Brief summary of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring

## Testing
- [ ] Unit tests added
- [ ] Integration tests added
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Type hints added (backend)
- [ ] Docstrings updated
- [ ] Tests pass locally
- [ ] No new warnings introduced
```

## Areas for Contribution

### High Priority
- 🔴 **Causal Engine Optimization**: Improve PC algorithm performance on large DAGs
- 🔴 **Agent Orchestration**: Implement new agent types (Portfolio Manager, Risk Analyst)
- 🔴 **Backtesting Engine**: Add Monte Carlo simulation support

### Medium Priority
- 🟡 **Frontend Enhancement**: Improve dashboard responsiveness
- 🟡 **Documentation**: Expand API docs and tutorials
- 🟡 **Testing**: Increase test coverage (target: >80%)

### Low Priority
- 🟢 **Examples**: Add more usage examples
- 🟢 **Performance**: Optimize non-critical paths
- 🟢 **Logging**: Enhance observability

## Reporting Issues

### Bug Reports
Include:
- Expected behavior
- Actual behavior
- Steps to reproduce
- Error logs/traceback
- Environment (OS, Python version, etc.)

### Feature Requests
Include:
- Clear use case
- Proposed solution
- Alternative solutions considered
- Any relevant research/links

## Code Review Process

Reviews focus on:
- **Correctness**: Does it solve the problem correctly?
- **Performance**: Any obvious inefficiencies?
- **Maintainability**: Is it clear and testable?
- **Security**: Any vulnerabilities or risky patterns?

**Response time**: 48-72 hours for reviews

## Documentation

### Update docs if you:
- Add new APIs or modules
- Change default behavior
- Add configuration options
- Modify project structure

**Documentation formats**:
- Markdown for guides
- Docstrings for code
- Inline comments for complex logic

## Release Process

Versions follow [Semantic Versioning](https://semver.org/):
- `v0.1.0` → `v0.2.0` (minor features)
- `v0.1.0` → `v0.1.1` (bug fixes)
- `v0.1.0` → `v1.0.0` (breaking changes)

---

## Questions?

- **GitHub Discussions**: For general questions
- **GitHub Issues**: For bugs and feature requests
- **Documentation**: Check [README.md](README.md) first

**Thank you for contributing!** 🎉
