const BaseGenerator = require('./BaseGenerator');
const path = require('path');

class ModelGenerator extends BaseGenerator {
    /**
     * Generate a model file
     * @param {string} modelName 
     * @param {object} options 
     */
    generate(modelName, options = {}) {
        const filename = `${modelName}.js`;
        const targetPath = path.join(process.cwd(), 'app/models', filename);
        
        if (this.fileExists(targetPath)) {
            throw new Error(`Model ${modelName} already exists at ${targetPath}`);
        }

        const template = options.resource ? 'resource-model.stub' : 'model.stub';
        const content = this.loadTemplate(template);
        
        const replacements = {
            name: modelName,
            tableName: this.getTableName(modelName)
        };

        const finalContent = this.replaceTemplate(content, replacements);
        this.writeFile(targetPath, finalContent);
        
        return {
            path: targetPath,
            tableName: replacements.tableName
        };
    }
}

module.exports = ModelGenerator;