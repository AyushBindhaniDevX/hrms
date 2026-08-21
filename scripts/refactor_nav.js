const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');

function traverse(dir, callback) {
  fs.readdirSync(dir).forEach(file => {
    let fullPath = path.join(dir, file);
    if (fs.lstatSync(fullPath).isDirectory()) {
      traverse(fullPath, callback);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      callback(fullPath);
    }
  });
}

const HR_NAV_REGEX = /const HR_NAV = \[\s*(?:\{[^\}]+\},?\s*)+\];/g;
const ADMIN_NAV_REGEX = /const ADMIN_NAV = \[\s*(?:\{[^\}]+\},?\s*)+\];/g;

traverse(srcDir, (file) => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  if (HR_NAV_REGEX.test(content)) {
    content = content.replace(HR_NAV_REGEX, '');
    if (!content.includes("import { HR_NAV")) {
      content = "import { HR_NAV } from '@/constants/navigation';\n" + content;
    }
    changed = true;
  }

  if (ADMIN_NAV_REGEX.test(content)) {
    content = content.replace(ADMIN_NAV_REGEX, '');
    if (!content.includes("import { ADMIN_NAV")) {
      content = "import { ADMIN_NAV } from '@/constants/navigation';\n" + content;
    }
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated', file);
  }
});
