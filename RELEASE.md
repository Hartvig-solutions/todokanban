# Release Process for ToDoKanban

Follow these steps to release a new version of the extension to the VS Code Marketplace and Open VSX.

## 1. Pre-Release Checklist
- [ ] Update version in `package.json`.
- [ ] Update `CHANGELOG.md` with new features and fixes.
- [ ] Run `npm run lint` to ensure code quality.
- [ ] Run `npm test` to ensure no regressions (if tests are implemented).
- [ ] Verify the extension works in your local environment (F5).

## 2. Git Tagging
Once the code is ready and pushed to the `main` branch:

```bash
# Create a new tag (replace 0.1.0 with your version)
git tag -a v0.1.0 -m "Release version 0.1.0"

# Push the tag to GitHub
git push origin v0.1.0
```

## 3. Automated Publishing
GitHub Actions is configured to automatically publish when a **Release** is created in GitHub.

1. Go to the **Releases** section on GitHub.
2. Click **Draft a new release**.
3. Choose the tag you just pushed (e.g., `v0.1.0`).
4. Set the title to `Release v0.1.0`.
5. Copy the entries from `CHANGELOG.md` into the description.
6. Click **Publish release**.

The GitHub Action will then:
- Package the extension into a `.vsix` file.
- Publish it to the **Visual Studio Marketplace**.
- Publish it to the **Open VSX Registry**.

## 4. Troubleshooting
- If the Marketplace publish fails, check your `VSCE_PAT` secret on GitHub.
- If the Open VSX publish fails, check your `OVSX_PAT` secret and ensure the namespace `hartvig-solutions` is claimed on [open-vsx.org](https://open-vsx.org).
