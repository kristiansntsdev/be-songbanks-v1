const BaseGenerator = require('./BaseGenerator');
const path = require('path');

class ControllerGenerator extends BaseGenerator {
    /**
     * Generate a controller file
     * @param {string} controllerName 
     * @param {object} options 
     */
    generate(controllerName, options = {}) {
        // Ensure it ends with Controller
        let name = controllerName;
        if (!name.endsWith('Controller')) {
            name += 'Controller';
        }

        const filename = `${name}.js`;
        const targetPath = path.join(process.cwd(), 'app/controllers', filename);
        
        if (this.fileExists(targetPath)) {
            throw new Error(`Controller ${name} already exists at ${targetPath}`);
        }

        let template, replacements;

        if (options.resource) {
            // Generate resource controller
            const modelName = name.replace('Controller', '');
            const resource = modelName.toLowerCase();
            const pluralResource = this.pluralize(resource);
            const capitalizedResource = this.capitalize(resource);
            const capitalizedPlural = this.capitalize(pluralResource);

            template = this.loadTemplate('resource-controller.stub');
            replacements = {
                name: name,
                modelName: modelName,
                resource: resource,
                pluralResource: pluralResource,
                capitalizedResource: capitalizedResource,
                capitalizedPlural: capitalizedPlural
            };
        } else {
            // Generate basic controller
            template = this.loadTemplate('controller.stub');
            replacements = {
                name: name
            };
        }

        const finalContent = this.replaceTemplate(template, replacements);
        this.writeFile(targetPath, finalContent);
        
        return {
            path: targetPath,
            name: name,
            modelName: options.resource ? replacements.modelName : null
        };
    }
}

module.exports = ControllerGenerator;