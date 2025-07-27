const { Factory, FactoryTypes } = require("../../package/src/engine/factories");

class TagFactory extends Factory {
  /**
   * Define the model's default state.
   * Based on Tag model fillable: ['name', 'description']
   *
   * @return {Object} Default attributes
   */
  definition() {
    return {
      name: FactoryTypes.randomElement([
        "Rock",
        "Pop",
        "Folk",
        "Blues",
        "Country",
        "Jazz",
        "Gospel",
        "Acoustic",
        "Electric",
        "Alternative",
        "Indie",
        "Classic",
      ]),
      description: FactoryTypes.computed((attributes) => {
        const descriptions = {
          Rock: "Energetic and powerful rock music",
          Pop: "Popular mainstream music",
          Folk: "Traditional acoustic folk songs",
          Blues: "Soulful blues compositions",
          Country: "Country and western music",
          Jazz: "Jazz and swing standards",
          Gospel: "Spiritual and religious songs",
          Acoustic: "Acoustic guitar arrangements",
          Electric: "Electric guitar focused",
          Alternative: "Alternative rock and pop",
          Indie: "Independent alternative music",
          Classic: "Classic timeless pieces",
        };
        return descriptions[attributes.name] || FactoryTypes.shortDescription();
      }),
    };
  }

  /**
   * Indicate that the tag should be a music genre.
   */
  genre() {
    return this.state({
      name: FactoryTypes.randomElement([
        "Rock",
        "Pop",
        "Folk",
        "Blues",
        "Country",
        "Jazz",
        "Gospel",
      ]),
      description: FactoryTypes.computed(
        (attributes) => `${attributes.name} music category`
      ),
    });
  }

  /**
   * Indicate that the tag should be a mood category.
   */
  mood() {
    const moodNames = [
      "Happy",
      "Sad",
      "Energetic",
      "Relaxing",
      "Romantic",
      "Spiritual",
    ];
    const moodDescriptions = {
      Happy: "Uplifting and joyful songs",
      Sad: "Melancholic and emotional pieces",
      Energetic: "High-energy motivational music",
      Relaxing: "Calm and peaceful melodies",
      Romantic: "Love songs and romantic ballads",
      Spiritual: "Faith-based and worship music",
    };

    return this.state({
      name: FactoryTypes.randomElement(moodNames),
      description: FactoryTypes.computed(
        (attributes) =>
          moodDescriptions[attributes.name] || `${attributes.name} themed music`
      ),
    });
  }

  /**
   * Indicate that the tag should be an instrument category.
   */
  instrument() {
    const instrumentNames = ["Guitar", "Piano", "Vocals", "Harmonica", "Drums"];
    const instrumentDescriptions = {
      Guitar: "Guitar-focused arrangements",
      Piano: "Piano-driven compositions",
      Vocals: "Vocal-centric performances",
      Harmonica: "Harmonica featured music",
      Drums: "Percussion-heavy tracks",
    };

    return this.state({
      name: FactoryTypes.randomElement(instrumentNames),
      description: FactoryTypes.computed(
        (attributes) =>
          instrumentDescriptions[attributes.name] ||
          `${attributes.name} featured music`
      ),
    });
  }

  /**
   * Indicate that the tag should be a tempo category.
   */
  tempo() {
    return this.state({
      name: FactoryTypes.randomElement(["Fast", "Slow", "Moderate", "Ballad"]),
      description: FactoryTypes.computed(
        (attributes) => `${attributes.name} tempo songs`
      ),
    });
  }

  /**
   * Indicate that the tag should be an era category.
   */
  era() {
    return this.state({
      name: FactoryTypes.randomElement([
        "Classic",
        "Modern",
        "Vintage",
        "Contemporary",
      ]),
      description: FactoryTypes.computed(
        (attributes) => `${attributes.name} era music`
      ),
    });
  }

  /**
   * Set a specific name for the tag.
   */
  withName(name) {
    return this.state({
      name,
      description: `Music tagged as ${name}`,
    });
  }

  /**
   * Set a specific description for the tag.
   */
  withDescription(description) {
    return this.state({
      description,
    });
  }

  /**
   * Indicate that the tag should be popular.
   */
  popular() {
    return this.state({
      name: FactoryTypes.randomElement([
        "Top 40",
        "Popular",
        "Hit",
        "Chart-topper",
      ]),
      description: "Popular and well-known songs",
    });
  }

  /**
   * Create the tag with songs relationship.
   * Based on Tag model: belongsToMany(models.Song, { through: 'song_tags', as: 'songs' })
   */
  withSongs(count = 5) {
    return this.hasAttached(require("./SongFactory"), "songs", count);
  }

  /**
   * Create rock genre tag with rock songs.
   */
  rockWithSongs(songCount = 3) {
    return this.state({
      name: "Rock",
      description: "Energetic and powerful rock music",
    }).afterCreating(async (tag) => {
      const SongFactory = require("./SongFactory");
      const songs = await SongFactory.new().rock().count(songCount).create();

      // Attach songs to tag (many-to-many relationship)
      if (tag.addSongs && typeof tag.addSongs === "function") {
        await tag.addSongs(songs);
      }
    });
  }

  /**
   * Create gospel genre tag with gospel songs.
   */
  gospelWithSongs(songCount = 3) {
    return this.state({
      name: "Gospel",
      description: "Spiritual and religious songs",
    }).afterCreating(async (tag) => {
      const SongFactory = require("./SongFactory");
      const songs = await SongFactory.new().gospel().count(songCount).create();

      // Attach songs to tag (many-to-many relationship)
      if (tag.addSongs && typeof tag.addSongs === "function") {
        await tag.addSongs(songs);
      }
    });
  }
}

// Set the model name for auto-resolution (matches Tag model class name)
TagFactory.modelName = "Tag";

module.exports = TagFactory;
