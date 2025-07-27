const { Factory, FactoryTypes } = require("../../package/src/engine/factories");
const bcrypt = require("bcrypt");

class UserFactory extends Factory {
  /**
   * The current password being used by the factory.
   */
  static password = null;

  /**
   * Define the model's default state.
   * Based on User model fillable: ['email', 'password', 'role', 'status']
   *
   * @return {Object} Default attributes
   */
  definition() {
    return {
      email: FactoryTypes.uniqueEmail(),
      password: UserFactory.password ?? bcrypt.hashSync("password", 10),
      role: FactoryTypes.randomElement(["admin", "member", "guest"]),
      status: FactoryTypes.randomElement([
        "active",
        "pending",
        "request",
        "suspend",
      ]),
    };
  }

  /**
   * Indicate that the user should be an admin.
   */
  admin() {
    return this.state({
      role: "admin",
      status: "active",
    });
  }

  /**
   * Indicate that the user should be a member.
   */
  member() {
    return this.state({
      role: "member",
      status: "active",
    });
  }

  /**
   * Indicate that the user should be a guest.
   */
  guest() {
    return this.state({
      role: "guest",
      status: "pending",
    });
  }

  /**
   * Indicate that the user should be active.
   */
  active() {
    return this.state({
      status: "active",
    });
  }

  /**
   * Indicate that the user should be pending.
   */
  pending() {
    return this.state({
      status: "pending",
    });
  }

  /**
   * Indicate that the user should be suspended.
   */
  suspended() {
    return this.state({
      status: "suspend",
    });
  }

  /**
   * Indicate that the user status should be request.
   */
  requested() {
    return this.state({
      status: "request",
    });
  }

  /**
   * Set a specific email for the user.
   */
  withEmail(email) {
    return this.state({
      email,
    });
  }

  /**
   * Set a specific password for the user.
   */
  withPassword(password) {
    return this.state({
      password: bcrypt.hashSync(password, 10),
    });
  }

  /**
   * Set a specific role for the user.
   */
  withRole(role) {
    return this.state({
      role,
    });
  }

  /**
   * Create the user with notes relationship.
   * Based on User model: hasMany(models.Note, { foreignKey: 'user_id', as: 'notes' })
   */
  withNotes(count = 3) {
    return this.has(require("./NoteFactory"), "notes", count);
  }

  /**
   * Create the user with musical notes.
   */
  withMusicalNotes(count = 2) {
    return this.afterCreating(async (user) => {
      const NoteFactory = require("./NoteFactory");
      await NoteFactory.new().musical().for(user).count(count).create();
    });
  }

  /**
   * Create the user with personal notes.
   */
  withPersonalNotes(count = 2) {
    return this.afterCreating(async (user) => {
      const NoteFactory = require("./NoteFactory");
      await NoteFactory.new().personal().for(user).count(count).create();
    });
  }

  /**
   * Configure default relationships and behaviors.
   */
  configure() {
    return this.afterMaking((user) => {
      // Ensure password is never exposed (following model's hidden: ['password'])
      if (user.toJSON && typeof user.toJSON === "function") {
        const originalToJSON = user.toJSON;
        user.toJSON = function () {
          const json = originalToJSON.call(this);
          delete json.password;
          return json;
        };
      }
    });
  }
}

// Set the model name for auto-resolution (matches User model class name)
UserFactory.modelName = "User";

module.exports = UserFactory;
