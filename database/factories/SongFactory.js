const { Factory, FactoryTypes } = require("../../package/src/engine/factories");

class SongFactory extends Factory {
  /**
   * Define the model's default state.
   * Based on Song model fillable: ['title', 'artist', 'base_chord', 'lyrics_and_chords']
   *
   * @return {Object} Default attributes
   */
  definition() {
    return {
      title: FactoryTypes.title(),
      artist: FactoryTypes.name(),
      base_chord: FactoryTypes.randomElement([
        "C",
        "G",
        "Am",
        "F",
        "D",
        "Em",
        "A",
        "Dm",
        "E",
        "Bm",
      ]),
      lyrics_and_chords: FactoryTypes.computed(() => {
        const chords = ["C", "G", "Am", "F", "D", "Em"];
        const lines = Array.from(
          { length: 4 },
          () =>
            `[${FactoryTypes.randomElement(chords)}] ${FactoryTypes.sentence(6)}`
        );
        return lines.join("\n");
      }),
    };
  }

  /**
   * Indicate that the song should be rock genre.
   */
  rock() {
    return this.state({
      artist: FactoryTypes.randomElement([
        "AC/DC",
        "Led Zeppelin",
        "Queen",
        "The Beatles",
      ]),
      base_chord: FactoryTypes.randomElement(["E", "A", "D", "G"]),
    });
  }

  /**
   * Indicate that the song should be folk genre.
   */
  folk() {
    return this.state({
      artist: FactoryTypes.randomElement([
        "Bob Dylan",
        "Joni Mitchell",
        "Neil Young",
        "Joan Baez",
      ]),
      base_chord: FactoryTypes.randomElement(["G", "C", "D", "Am"]),
    });
  }

  /**
   * Indicate that the song should be gospel genre.
   */
  gospel() {
    return this.state({
      artist: FactoryTypes.randomElement([
        "Mahalia Jackson",
        "Kirk Franklin",
        "CeCe Winans",
      ]),
      base_chord: FactoryTypes.randomElement(["C", "F", "G", "Am"]),
      lyrics_and_chords: FactoryTypes.computed(() => {
        const chords = ["C", "F", "G", "Am"];
        const lines = [
          `[${FactoryTypes.randomElement(chords)}] Amazing grace how sweet the sound`,
          `[${FactoryTypes.randomElement(chords)}] That saved a wretch like me`,
          `[${FactoryTypes.randomElement(chords)}] I once was lost but now I'm found`,
          `[${FactoryTypes.randomElement(chords)}] Was blind but now I see`,
        ];
        return lines.join("\n");
      }),
    });
  }

  /**
   * Indicate that the song should be blues genre.
   */
  blues() {
    return this.state({
      artist: FactoryTypes.randomElement([
        "B.B. King",
        "Muddy Waters",
        "Robert Johnson",
      ]),
      base_chord: FactoryTypes.randomElement(["E", "A", "B", "Em"]),
    });
  }

  /**
   * Indicate that the song should be country genre.
   */
  country() {
    return this.state({
      artist: FactoryTypes.randomElement([
        "Johnny Cash",
        "Dolly Parton",
        "Hank Williams",
      ]),
      base_chord: FactoryTypes.randomElement(["G", "C", "D", "Em"]),
    });
  }

  /**
   * Set a specific title for the song.
   */
  withTitle(title) {
    return this.state({
      title,
    });
  }

  /**
   * Set a specific artist for the song.
   */
  withArtist(artist) {
    return this.state({
      artist,
    });
  }

  /**
   * Set a specific base chord for the song.
   */
  withChord(baseChord) {
    return this.state({
      base_chord: baseChord,
    });
  }

  /**
   * Set custom lyrics and chords for the song.
   */
  withLyrics(lyricsAndChords) {
    return this.state({
      lyrics_and_chords: lyricsAndChords,
    });
  }

  /**
   * Create the song with tags relationship.
   * Based on Song model: belongsToMany(models.Tag, { through: 'song_tags', as: 'tags' })
   */
  withTags(count = 3) {
    return this.hasAttached(require("./TagFactory"), "tags", count);
  }

  /**
   * Create the song with notes relationship.
   * Based on Song model: hasMany(models.Note, { foreignKey: 'song_id', as: 'notes' })
   */
  withNotes(count = 2) {
    return this.has(require("./NoteFactory"), "notes", count);
  }

  /**
   * Create the song with genre-specific tags.
   */
  withGenreTags() {
    return this.afterCreating(async (song) => {
      const TagFactory = require("./TagFactory");
      await TagFactory.new()
        .genre()
        .count(2)
        .create()
        .then((tags) => {
          // Attach tags to song (many-to-many relationship)
          if (song.addTags && typeof song.addTags === "function") {
            return song.addTags(tags);
          }
        });
    });
  }

  /**
   * Create the song with musical notes.
   */
  withMusicalNotes(count = 2) {
    return this.afterCreating(async (song) => {
      const NoteFactory = require("./NoteFactory");
      await NoteFactory.new().musical().for(song).count(count).create();
    });
  }
}

// Set the model name for auto-resolution (matches Song model class name)
SongFactory.modelName = "Song";

module.exports = SongFactory;
