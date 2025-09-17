#!/usr/bin/env node
// Import fixer for Netlify builds
// This script can help debug import resolution issues

const fs = require('fs');
const path = require('path');

console.log('🔧 Checking for import resolution issues...\n');

// Check if this is a Netlify build environment
const isNetlifyBuild = process.env.NETLIFY === 'true';

console.log(`Environment: ${isNetlifyBuild ? 'Netlify Build' : 'Local Build'}`);
console.log(`Node Version: ${process.version}`);
console.log(`Working Directory: ${process.cwd()}`);

// Check if problematic files exist
const problematicFiles = [
  'src/app/accounts/earn/page.tsx',
  'src/components/ui/button.tsx',
  'src/components/ui/card.tsx',
  'src/components/ui/badge.tsx',
  'src/components/ui/input.tsx',
  'src/lib/data.ts'
];

console.log('\n📁 File existence check:');
problematicFiles.forEach(file => {
  const exists = fs.existsSync(file);
  const stat = exists ? fs.statSync(file) : null;
  console.log(`${exists ? '✅' : '❌'} ${file} ${stat ? `(${stat.size} bytes)` : ''}`);
});

// Check tsconfig paths
if (fs.existsSync('tsconfig.json')) {
  const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
  console.log('\n⚙️  TSConfig paths:');
  console.log(JSON.stringify(tsconfig.compilerOptions?.paths || {}, null, 2));
}

// Check next.config.js
if (fs.existsSync('next.config.js')) {
  console.log('\n⚙️  Next.js config exists');
}

console.log('\n🎯 Debug check complete!');