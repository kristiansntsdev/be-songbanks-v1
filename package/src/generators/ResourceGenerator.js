const BaseGenerator = require('./BaseGenerator');
const ModelGenerator = require('./ModelGenerator');
const ControllerGenerator = require('./ControllerGenerator');

class ResourceGenerator extends BaseGenerator {
    constructor() {
        super();
        this.modelGenerator = new ModelGenerator();
        this.controllerGenerator = new ControllerGenerator();
    }

    /**
     * Generate complete resource (Model + Controller)
     * @param {string} resourceName 
     * @param {object} options 
     */
    generate(resourceName, options = {}) {
        const modelName = resourceName;
        const controllerName = `${resourceName}Controller`;
        const resource = resourceName.toLowerCase();
        const pluralResource = this.pluralize(resource);
        const capitalizedResource = this.capitalize(resource);
        const capitalizedPlural = this.capitalize(pluralResource);

        console.log(`🔍 Generating complete resource: ${resourceName}`);
        console.log(`📦 Model: ${modelName}`);
        console.log(`🎮 Controller: ${controllerName}`);
        console.log(`🛣️  Routes: /${pluralResource}/`);

        const results = {
            model: null,
            controller: null,
            resourceName: resourceName,
            routes: {
                resource: resource,
                plural: pluralResource,
                capitalizedResource: capitalizedResource,
                capitalizedPlural: capitalizedPlural
            }
        };

        try {
            // Generate Model
            console.log(`📦 Creating model: ${modelName}`);
            results.model = this.modelGenerator.generate(modelName, { resource: true });
            console.log(`   ✅ Model created: ${results.model.path}`);

            // Generate Controller
            console.log(`🎮 Creating controller: ${controllerName}`);
            results.controller = this.controllerGenerator.generate(controllerName, { 
                resource: true,
                modelName: modelName 
            });
            console.log(`   ✅ Controller created: ${results.controller.path}`);

            console.log(`\n✅ Successfully generated ${resourceName} resource!`);
            this.showNextSteps(results);

            return results;

        } catch (error) {
            console.error(`❌ Error generating resource: ${error.message}`);
            throw error;
        }
    }

    /**
     * Show next steps after generation
     * @param {object} results 
     */
    showNextSteps(results) {
        const { resourceName, routes } = results;
        
        console.log(`\n📋 Generated files:`);
        console.log(`   • ${results.model.path}`);
        console.log(`   • ${results.controller.path}`);
        
        console.log(`\n💡 Next steps:`);
        console.log(`   1. Create migration: sequelize-cli migration:generate --name create-${routes.plural}`);
        console.log(`   2. Update migration with model fields`);
        console.log(`   3. Run migration: npm run migrate`);
        console.log(`   4. Add routes to routes/api.js`);
        console.log(`   5. Generate Swagger docs: npm run swagger:controller generate ${resourceName}Controller`);
    }
}

module.exports = ResourceGenerator;