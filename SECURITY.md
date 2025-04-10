# Security Policy

## Supported Versions

This project is currently in active development. We provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| main    | :white_check_mark: |

## Reporting a Vulnerability

We take the security of this project seriously. If you discover a security vulnerability, please follow these steps:

1. **Do NOT disclose the vulnerability publicly** on GitHub Issues, Discord, or any other public forum.
2. Email [security@verista.com](mailto:security@verista.com) with details about the vulnerability.
3. Include the following in your report:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to expect:

- We will acknowledge receipt of your vulnerability report within 48 hours.
- We will provide a detailed response about the vulnerability and our plans to address it within 7 days.
- We will keep you informed about our progress on fixing the vulnerability.
- After the vulnerability is fixed, we will publicly acknowledge your responsible disclosure (unless you request anonymity).

## Security Measures

This project implements several security measures:

1. **Automated Dependency Updates**: We use GitHub Dependabot to regularly check for and update vulnerable dependencies.
2. **Code Scanning**: We use GitHub CodeQL to scan for potential security issues in our codebase.
3. **Regular Security Audits**: We perform weekly npm audits across the project.
4. **Vulnerability Disclosure**: We follow responsible disclosure practices.

## Security Scripts

We've included scripts to help maintain security:

- `fix-security-vulnerabilities.sh`: For general vulnerability fixes
- `update-vulnerable-deps.sh`: For updating specific known vulnerable dependencies

## Best Practices for Contributors

If you're contributing to this project, please follow these security best practices:

1. Keep dependencies up to date
2. Follow secure coding guidelines
3. Never commit sensitive information (tokens, keys, passwords)
4. Use environment variables for sensitive configuration
5. Run `npm audit` before submitting pull requests