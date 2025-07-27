const { Factory, FactoryTypes } = require("../../package/src/engine/factories");

class NoteFactory extends Factory {
  /**
   * Define the model's default state.
   * Based on Note model fillable: ['user_id', 'song_id', 'notes']
   *
   * @return {Object} Default attributes
   */
  definition() {
    const noteTypes = [
      "Great song for worship service",
      "Remember to play this in G major",
      "Perfect for acoustic guitar",
      "Congregation loves this one",
      "Good for special occasions",
      "Easy chord progression for beginners",
      "Beautiful harmony opportunities",
      "Traditional hymn arrangement",
      "Modern contemporary style",
      "Great for small group settings",
    ];

    return {
      user_id: null, // Will be set by relationship
      song_id: null, // Will be set by relationship
      notes: FactoryTypes.randomElement(noteTypes),
    };
  }

  /**
   * Indicate that the note should be musical content.
   */
  musical() {
    const musicalNotes = [
      "Capo on 3rd fret sounds perfect",
      "Try the jazz chord progression",
      "Slow down the tempo for impact",
      "Add a key change in the final chorus",
      "Beautiful fingerpicking pattern",
      "Great for guitar duet arrangement",
      "Piano accompaniment works well",
      "Simple but effective chord structure",
    ];

    return this.state({
      notes: FactoryTypes.randomElement(musicalNotes),
    });
  }

  /**
   * Indicate that the note should be personal content.
   */
  personal() {
    const personalNotes = [
      "This song has special meaning to me",
      "Learned this from my grandfather",
      "Perfect for family gatherings",
      "Always requested at events",
      "One of my all-time favorites",
      "Brings back wonderful memories",
      "Great for teaching new players",
      "Never fails to inspire",
    ];

    return this.state({
      notes: FactoryTypes.randomElement(personalNotes),
    });
  }

  /**
   * Indicate that the note should be technical content.
   */
  technical() {
    const technicalNotes = [
      "Watch the timing in measure 16",
      "Difficult chord change at bar 32",
      "Remember the ritardando ending",
      "Key signature has 3 sharps",
      "Tempo marking is moderato",
      "Dynamic marking: mp to f",
      "Watch for accidentals in bridge",
      "Time signature changes to 3/4",
    ];

    return this.state({
      notes: FactoryTypes.randomElement(technicalNotes),
    });
  }

  /**
   * Indicate that the note should be performance content.
   */
  performance() {
    const performanceNotes = [
      "Great for Sunday morning service",
      "Perfect for evening worship",
      "Works well for small groups",
      "Congregation participation encouraged",
      "Ideal for special occasions",
      "Good for youth group events",
      "Suitable for all ages",
      "Creates a peaceful atmosphere",
    ];

    return this.state({
      notes: FactoryTypes.randomElement(performanceNotes),
    });
  }

  /**
   * Indicate that the note should be short content.
   */
  short() {
    const shortNotes = [
      "Love this!",
      "Amazing song",
      "Perfect",
      "Beautiful",
      "Classic",
      "Inspiring",
      "Powerful",
      "Wonderful",
    ];

    return this.state({
      notes: FactoryTypes.randomElement(shortNotes),
    });
  }

  /**
   * Indicate that the note should be detailed content.
   */
  detailed() {
    return this.state({
      notes: FactoryTypes.content(),
    });
  }

  /**
   * Set specific content for the note.
   */
  withContent(content) {
    return this.state({
      notes: content,
    });
  }

  /**
   * Set specific user and song IDs for the note.
   */
  forUserAndSong(userId, songId) {
    return this.state({
      user_id: userId,
      song_id: songId,
    });
  }

  /**
   * Configure default relationships.
   * Based on Note model: belongsTo User and Song
   */
  configure() {
    return this.for(() => require("./UserFactory"), "user").for(
      () => require("./SongFactory"),
      "song"
    );
  }
}

// Set the model name for auto-resolution (matches Note model class name)
NoteFactory.modelName = "Note";

module.exports = NoteFactory;
