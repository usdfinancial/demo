#!/usr/bin/env node
// Build dependency checker for USD Financial
// This script checks if all required files exist before build

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking build dependencies for USD Financial...\n');

// Check if key directories exist
const requiredDirs = [
  'src',
  'src/components',
  'src/components/ui',
  'src/lib',
  'src/app'
];

console.log('📁 Checking directories:');
requiredDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`✅ ${dir}`);
  } else {
    console.log(`❌ ${dir} - MISSING!`);
  }
});

// Check UI components
const requiredUIComponents = [
  'src/components/ui/button.tsx',
  'src/components/ui/card.tsx',
  'src/components/ui/badge.tsx',
  'src/components/ui/input.tsx',
  'src/components/ui/tabs.tsx',
  'src/components/ui/select.tsx',
  'src/components/ui/progress.tsx',
  'src/components/ui/switch.tsx',
  'src/components/ui/slider.tsx'
];

console.log('\n🧩 Checking UI components:');
requiredUIComponents.forEach(component => {
  if (fs.existsSync(component)) {
    console.log(`✅ ${component}`);
  } else {
    console.log(`❌ ${component} - MISSING!`);
  }
});

// Check lib files
const requiredLibFiles = [
  'src/lib/data.ts',
  'src/lib/utils.ts'
];

console.log('\n📚 Checking lib files:');
requiredLibFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING!`);
  }
});

// Check config files
const configFiles = [
  'package.json',
  'next.config.js',
  'tsconfig.json',
  'tailwind.config.js',
  'postcss.config.js'
];

console.log('\n⚙️  Checking config files:');
configFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING!`);
  }
});

// Check for potential issues
console.log('\n🔬 Checking for potential issues:');

// Check for case sensitivity issues
const uiFiles = fs.readdirSync('src/components/ui').filter(f => f.endsWith('.tsx'));
console.log(`📊 Found ${uiFiles.length} UI components:`, uiFiles.join(', '));

// Check package.json dependencies
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const hasTailwind = packageJson.dependencies?.tailwindcss || packageJson.devDependencies?.tailwindcss;
const hasClsx = packageJson.dependencies?.clsx || packageJson.devDependencies?.clsx;
const hasTailwindMerge = packageJson.dependencies?.['tailwind-merge'] || packageJson.devDependencies?.['tailwind-merge'];

console.log(`📦 TailwindCSS: ${hasTailwind ? '✅' : '❌'}`);
console.log(`📦 clsx: ${hasClsx ? '✅' : '❌'}`);
console.log(`📦 tailwind-merge: ${hasTailwindMerge ? '✅' : '❌'}`);

// Check imports in a sample file
try {
  const earnPageContent = fs.readFileSync('src/app/accounts/earn/page.tsx', 'utf8');
  const imports = earnPageContent.match(/import.*from\s+['"]@\/.*['"]/g) || [];
  console.log(`\n📥 Sample imports in earn page:`, imports.length);
  imports.forEach(imp => console.log(`   ${imp}`));
} catch (error) {
  console.log('❌ Could not read sample file');
}

console.log('\n✨ Build dependency check complete!');