#!/usr/bin/env node

import ResourceGenerator from "../generators/ResourceGenerator.js";

class ResourceCommand {
  constructor() {
    this.generator = new ResourceGenerator();
  }

  execute() {
    // Get all arguments after --
    const allArgs = process.argv.slice(2);

    // Find --name= argument
    const nameArg = allArgs.find((arg) => arg.startsWith("--name="));

    if (!nameArg) {
      console.error("❌ --name parameter is required");
      this.showUsage();
      return;
    }

    const resourceName = nameArg.replace("--name=", "");

    if (!resourceName.trim()) {
      console.error("❌ Resource name cannot be empty");
      this.showUsage();
      return;
    }

    try {
      this.generator.generate(resourceName.trim());
    } catch (error) {
      console.error(`❌ ${error.message}`);
      process.exit(1);
    }
  }

  showUsage() {
    console.log(`
🔧 Complete Resource Generator

Usage:
  npm run swaggerpress:resource -- --name=<ResourceName>

Examples:
  npm run swaggerpress:resource -- --name=Song
  npm run swaggerpress:resource -- --name=Product
  npm run swaggerpress:resource -- --name=Category

This generates a complete resource with:
  📦 Model with name & description fields
  🎮 Controller with 5 CRUD methods:
     • Get{Resources}() - GET /{resource}/
     • Get{Resource}ById() - GET /{resource}/:id  
     • Create{Resource}() - POST /{resource}/
     • Update{Resource}() - PUT /{resource}/:id
     • Delete{Resource}() - DELETE /{resource}/:id

Based on TagController pattern with Sequelize ORM integration.
`);
  }
}

// Run the command if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = new ResourceCommand();
  command.execute();
}

export default ResourceCommand;
