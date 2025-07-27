#!/usr/bin/env node

const MigrationCommand = require("./src/commands/MigrationCommand");
const SeederCommand = require("./src/commands/SeederCommand");
const ControllerCommand = require("./src/commands/ControllerCommand");
const ModelCommand = require("./src/commands/ModelCommand");
const SwaggerCommand = require("./src/commands/SwaggerCommand");

class CommandRunner {
  constructor() {
    this.commands = {
      "migration:create": new MigrationCommand(),
      "seeder:create": new SeederCommand(),
      "controller:create": new ControllerCommand(),
      "model:create": new ModelCommand(),
      "swagger:generate": new SwaggerCommand(),
    };
  }

  run() {
    const command = process.argv[2];
    const name = process.argv[3];

    if (!command || !this.commands[command]) {
      this.showHelp();
      return;
    }

    try {
      if (command === "swagger:generate") {
        this.commands[command].execute();
      } else {
        this.commands[command].execute(name);
      }
    } catch (error) {
      console.error(`Error executing command: ${error.message}`);
      process.exit(1);
    }
  }

  showHelp() {
    console.log("Available commands:");
    console.log("  migration:create <name>   - Create new migration");
    console.log("  seeder:create <name>      - Create new seeder");
    console.log("  controller:create <name>  - Create new controller");
    console.log("  model:create <name>       - Create new model");
    console.log(
      "  swagger:generate          - Generate Swagger documentation from models and controllers"
    );
  }
}

if (require.main === module) {
  const runner = new CommandRunner();
  runner.run();
}

module.exports = CommandRunner;
