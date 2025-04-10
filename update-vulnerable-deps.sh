#!/bin/bash
# Script to update specific known vulnerable dependencies

echo "Updating known vulnerable dependencies in Verista project..."

# Go to frontend directory
cd "$(dirname "$0")/frontend" || exit 1

# Update packages with known vulnerabilities (common security issues in JavaScript projects)
echo "Updating frontend packages..."

npm install --save-dev postcss@^8.4.31
npm install --save-exact @babel/traverse@7.23.2 browserslist@4.22.2
npm install --save-dev glob-parent@6.0.2 semver@7.5.4 word-wrap@1.2.4
npm install --save crypto-js@4.2.0 follow-redirects@1.15.4 axios@1.6.2

# Go to backend directory
cd ../backend || exit 1

echo "Updating backend packages..."
npm install --save-exact json5@2.2.3 semver@7.5.4
npm install --save express@4.18.2 jsonwebtoken@9.0.2

# Return to project root
cd .. || exit 1

# Update root packages
echo "Updating root packages..."
npm install --save-dev semver@7.5.4 glob-parent@6.0.2

# Run audit fix to handle any remaining vulnerabilities
echo "Running audit fix for remaining vulnerabilities..."
npm audit fix --prefix frontend
npm audit fix --prefix backend
npm audit fix

echo "Dependency update complete!"
echo "Run 'git add package*.json **/package*.json' to stage changes"
echo "Then 'git commit -m \"Update vulnerable dependencies\"' to commit them"