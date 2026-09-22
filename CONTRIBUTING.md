# Contributing to Udemy Transcript & Caption Downloader

Thank you for your interest in contributing! This project is open source and community-driven.

## How to Contribute

1. **Fork the repository** on GitHub.
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/udemy-transcript-downloader.git
   cd udemy-transcript-downloader
   ```
3. **Create a branch** for your feature or bugfix:
   ```bash
   git checkout -b feature/my-new-feature
   ```
4. **Make your changes** following the code standards:
   - Always use **Manifest V3** conventions.
   - Use `async/await` (avoid chained promises).
   - Ensure permissions in `manifest.json` remain minimal.
   - If adding a parser feature, update `utils/parser.js` and add unit tests to `tests/test-parser.js`.
5. **Run the test suite**:
   ```bash
   npm test
   ```
6. **Commit your changes**:
   ```bash
   git commit -m "Add feature: ..."
   ```
7. **Push to your fork** and submit a **Pull Request**.

## Guidelines
- Please keep PRs focused on a single change.
- Follow existing formatting and commenting conventions.
- All contributions are licensed under the MIT License.
