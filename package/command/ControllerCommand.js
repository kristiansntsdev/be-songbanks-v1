const fs = require('fs');
const path = require('path');

class ControllerCommand {
    constructor() {
        this.stubPath = path.join(__dirname, '../stub');
    }

    execute(name) {
        if (!name) {
            console.error('Error: name parameter is required for controller:create');
            console.error('Usage: node package/commands.js controller:create <name>');
            process.exit(1);
        }

        const filename = `${name}.js`;
        const targetPath = path.join(process.cwd(), 'app/controllers', filename);
        
        this.ensureDirectoryExists(path.dirname(targetPath));
        
        const template = this.loadTemplate('controller.stub');
        const content = template.replace(/{{name}}/g, name);
        
        fs.writeFileSync(targetPath, content);
        console.log(`Controller created: ${targetPath}`);
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

module.exports = ControllerCommand;