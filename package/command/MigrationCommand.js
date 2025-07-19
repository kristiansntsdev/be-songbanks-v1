const fs = require('fs');
const path = require('path');

class MigrationCommand {
    constructor() {
        this.stubPath = path.join(__dirname, '../stub');
    }

    execute(name) {
        if (!name) {
            console.error('Error: name parameter is required for migration:create');
            console.error('Usage: node package/commands.js migration:create <name>');
            process.exit(1);
        }

        const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
        const filename = `${timestamp}-${name}.js`;
        const targetPath = path.join(process.cwd(), 'database/migrations', filename);
        
        this.ensureDirectoryExists(path.dirname(targetPath));
        
        const template = this.loadTemplate('migration.stub');
        const content = template.replace(/{{name}}/g, name);
        
        fs.writeFileSync(targetPath, content);
        console.log(`Migration created: ${targetPath}`);
    }

    loadTemplate(templateName) {
        const templatePath = path.join(this.stubPath, templateName);
        if (!fs.existsSync(templatePath)) {
            throw new Error(`Template not found: ${templatePath}`);
        }
        return fs.readFileSync(templatePath, 'utf8');
    }

    ensureDirectoryExists(dirPath) {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    }
}

module.exports = MigrationCommand;