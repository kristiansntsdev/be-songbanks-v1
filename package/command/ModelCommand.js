const fs = require('fs');
const path = require('path');

class ModelCommand {
    constructor() {
        this.stubPath = path.join(__dirname, '../stub');
    }

    execute(name) {
        if (!name) {
            console.error('Error: name parameter is required for model:create');
            console.error('Usage: node package/commands.js model:create <name>');
            process.exit(1);
        }

        const filename = `${name}.js`;
        const targetPath = path.join(process.cwd(), 'app/models', filename);
        
        this.ensureDirectoryExists(path.dirname(targetPath));
        
        const template = this.loadTemplate('model.stub');
        const tableName = this.getTableName(name);
        const content = template.replace(/{{name}}/g, name).replace(/{{tableName}}/g, tableName);
        
        fs.writeFileSync(targetPath, content);
        console.log(`Model created: ${targetPath}`);
        console.log(`Table name: ${tableName}`);
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

    getTableName(modelName) {
        return modelName
            .replace(/([A-Z])/g, '_$1')
            .toLowerCase()
            .replace(/^_/, '') + 's';
    }
}

module.exports = ModelCommand;