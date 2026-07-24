const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'src', 'pages');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            processDir(fullPath);
        } else if (file === 'index.tsx') {
            let content = fs.readFileSync(fullPath, 'utf8');
            
            // Check if it's a list view by looking for DataTable
            if (!content.includes('<DataTable')) continue;
            
            // Skip gold-categories because we already did it
            if (fullPath.includes('gold-categories')) continue;

            let modified = false;

            // Replace header flex column layout with strict flex row
            const headerRegex = /<div className="flex flex-col[^"]*justify-between[^"]*">\s*<div>\s*<CardTitle className="[^"]*">\s*([^<]+)\s*<\/CardTitle>\s*<CardDescription className="[^"]*">\s*([^<]+)\s*<\/CardDescription>\s*<\/div>/s;
            
            if (headerRegex.test(content)) {
                content = content.replace(headerRegex, (match, title, desc) => {
                    return `<div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm sm:text-base font-semibold truncate">
                ${title.trim()}
              </CardTitle>
              <CardDescription className="text-[10px] sm:text-xs truncate">
                ${desc.trim()}
              </CardDescription>
            </div>`;
                });
                modified = true;
            }

            // Also replace button class names
            const buttonRegex = /className="h-12 lg:h-9 text-sm lg:text-sm w-full lg:w-auto"/g;
            if (buttonRegex.test(content)) {
                content = content.replace(buttonRegex, 'className="h-9 shrink-0 rounded-lg"');
                modified = true;
            }
            
            // And for other variants
            const buttonRegex2 = /className="h-12 sm:h-9 text-sm sm:text-sm w-full sm:w-auto"/g;
            if (buttonRegex2.test(content)) {
                content = content.replace(buttonRegex2, 'className="h-9 shrink-0 rounded-lg"');
                modified = true;
            }

            const buttonRegex3 = /className="h-12 sm:h-9 text-sm sm:text-sm flex-1 sm:flex-none"/g;
            if (buttonRegex3.test(content)) {
                content = content.replace(buttonRegex3, 'className="h-9 flex-1 sm:flex-none rounded-lg"');
                modified = true;
            }

            const buttonRegex4 = /className="h-12 sm:h-9 text-sm sm:text-sm"/g;
            if (buttonRegex4.test(content)) {
                content = content.replace(buttonRegex4, 'className="h-9 rounded-lg"');
                modified = true;
            }

            if (modified) {
                fs.writeFileSync(fullPath, content);
                console.log('Updated header layout in', fullPath);
            }
        }
    }
}

processDir(pagesDir);
