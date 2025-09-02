# Base Chord Selection for Playlists - Full Implementation Guide

## 1. Database Changes (MySQL Commands)

```sql
-- Add playlist_notes column to playlists table
ALTER TABLE playlists ADD COLUMN playlist_notes JSON DEFAULT NULL;

-- Check if column was added successfully
DESCRIBE playlists;

-- Example of how the data will be stored:
-- playlist_notes: [{"song_id": 1, "base_chord": "E"}, {"song_id": 2, "base_chord": "Am"}]
```

## 2. Model Updates

**File: `/app/models/Playlist.js`**

```javascript
// Add playlist_notes to schema
playlist_notes: {
  type: DataTypes.JSON,
  defaultValue: null,
},

// Add playlist_notes to fillable array
static get fillable() {
  return [
    "playlist_name",
    "sharable_link", 
    "share_token",
    "user_id",
    "playlist_team_id",
    "is_shared",
    "is_locked", 
    "songs",
    "playlist_notes", // Add this line
  ];
}
```

## 3. Service Layer Updates

**File: `/app/services/PlaylistService.js`**

```javascript
// Add new helper method for managing playlist notes
static parsePlaylistNotesField(notesData) {
  if (!notesData) return [];
  
  // If it's already an array, return it
  if (Array.isArray(notesData)) {
    return notesData;
  }
  
  // If it's a string, try to parse it
  if (typeof notesData === "string") {
    try {
      const parsed = JSON.parse(notesData);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (e) {
      console.warn("Failed to parse playlist_notes field:", notesData);
    }
  }
  
  return [];
}

// Add new method for adding song with base chord
static async addSongToPlaylistWithBaseChord(userId, playlistId, songId, baseChord) {
  const numericPlaylistId = parseInt(playlistId);
  const numericSongId = parseInt(songId);

  if (isNaN(numericSongId) || numericSongId <= 0) {
    const error = new Error("Invalid song ID provided");
    error.statusCode = 400;
    throw error;
  }

  if (!baseChord || typeof baseChord !== "string" || baseChord.trim() === "") {
    const error = new Error("Base chord is required");
    error.statusCode = 400;
    throw error;
  }

  // Check if song exists
  const existingSong = await Song.findByPk(numericSongId);
  if (!existingSong) {
    const error = new Error("Song not found");
    error.statusCode = 404;
    throw error;
  }

  // Find playlist
  const playlist = await Playlist.findOne({
    where: { id: numericPlaylistId, user_id: userId },
  });

  if (!playlist) {
    const error = new Error("Playlist not found or access denied");
    error.statusCode = 404;
    throw error;
  }

  // Get current songs and playlist notes
  let currentSongs = this.parseSongsField(playlist.songs);
  let currentNotes = this.parsePlaylistNotesField(playlist.playlist_notes);

  // Check if song is already in playlist
  if (currentSongs.includes(numericSongId)) {
    const error = new Error("Song is already in the playlist");
    error.statusCode = 409;
    throw error;
  }

  // Add song to playlist
  const updatedSongs = [...currentSongs, numericSongId];

  // Add or update base chord note
  const noteIndex = currentNotes.findIndex(note => note.song_id === numericSongId);
  if (noteIndex >= 0) {
    // Update existing note
    currentNotes[noteIndex].base_chord = baseChord.trim();
  } else {
    // Add new note
    currentNotes.push({
      song_id: numericSongId,
      base_chord: baseChord.trim()
    });
  }

  // Update playlist with new songs array and notes
  const rawQuery = `UPDATE playlists SET songs = ?, playlist_notes = ?, updatedAt = NOW() WHERE id = ? AND user_id = ?`;
  await sequelize.query(rawQuery, {
    replacements: [
      JSON.stringify(updatedSongs),
      JSON.stringify(currentNotes),
      numericPlaylistId,
      userId
    ],
  });

  await playlist.reload();

  return {
    code: 200,
    message: "Song added to playlist with base chord successfully",
    data: {
      id: playlist.id.toString(),
      playlist_name: playlist.playlist_name,
      user_id: playlist.user_id,
      songs: this.parseSongsField(playlist.songs),
      playlist_notes: this.parsePlaylistNotesField(playlist.playlist_notes),
      songs_count: this.parseSongsField(playlist.songs).length,
      added_song_id: numericSongId,
      base_chord: baseChord.trim(),
      createdAt: playlist.createdAt,
      updatedAt: playlist.updatedAt,
    },
  };
}

// Update existing methods to include playlist_notes in responses
// In getPlaylistById method, add:
playlist_notes: this.parsePlaylistNotesField(playlist.playlist_notes),

// In getAllPlaylists method, add to the mapped data:
playlist_notes: this.parsePlaylistNotesField(playlist.playlist_notes),
```

## 4. Controller Layer Updates

**File: `/app/controllers/PlaylistController.js`**

```javascript
/**
 * @Summary Add song to playlist with base chord
 * @Description Add a song to playlist with a chosen base chord. The base chord selection will be stored in playlist_notes.
 * @Tags Playlist
 * @Accept application/json
 * @Produce application/json
 * @Param id path string true "Playlist ID"
 * @Param songId path string true "Song ID to add to playlist"
 * @Body {object} AddSongWithBaseChordRequest "Base chord selection for the song"
 * @Success 200 {object} AddSongWithBaseChordResponse "Song added to playlist with base chord successfully"
 * @Failure 400 {object} BadRequestError "Invalid song ID or base chord not provided"
 * @Failure 401 {object} UnauthorizedError "Authentication required"
 * @Failure 404 {object} NotFoundError "Playlist not found or song not found"
 * @Failure 409 {object} ConflictError "Song is already in the playlist"
 * @Failure 500 {object} InternalServerError "Internal server error"
 * @Router /playlists/{id}/songs/{songId} [post]
 * @auth
 */
static addSongToPlaylistWithBaseChord = ErrorHandler.asyncHandler(async (req, res) => {
  const { id, songId } = req.params;
  const { base_chord } = req.body;
  const userId = req.user.userId;

  const result = await PlaylistService.addSongToPlaylistWithBaseChord(
    userId,
    id,
    songId,
    base_chord
  );

  res.json(result);
});
```

## 5. Route Configuration

**File: `/routes/api.js`**

```javascript
// Add this route after the existing playlist routes (around line 76)
router.post(
  "/playlists/:id/songs/:songId",
  authenticateToken,
  PlaylistController.addSongToPlaylistWithBaseChord
);
```

## 6. Schema Updates

**File: `/schemas/requests/AddSongWithBaseChordRequest.js`**

```javascript
import { BaseRequestSchema } from "../../package/src/engine/index.js";

class AddSongWithBaseChordRequest extends BaseRequestSchema {
  static get schema() {
    return {
      type: "object",
      properties: {
        base_chord: {
          type: "string",
          description: "The base chord chosen by the user for this song",
          example: "E",
          minLength: 1,
          maxLength: 10,
        },
      },
      required: ["base_chord"],
      additionalProperties: false,
    };
  }
}

export default AddSongWithBaseChordRequest;
```

**File: `/schemas/responses/AddSongWithBaseChordResponse.js`**

```javascript
import { BaseResponseSchema } from "../../package/src/engine/index.js";

class AddSongWithBaseChordResponse extends BaseResponseSchema {
  static get schema() {
    return {
      type: "object",
      properties: {
        code: {
          type: "integer",
          example: 200,
        },
        message: {
          type: "string",
          example: "Song added to playlist with base chord successfully",
        },
        data: {
          type: "object",
          properties: {
            id: {
              type: "string",
              example: "1",
            },
            playlist_name: {
              type: "string",
              example: "My Favorite Songs",
            },
            user_id: {
              type: "integer",
              example: 1,
            },
            songs: {
              type: "array",
              items: {
                type: "integer",
              },
              example: [1, 2, 3],
            },
            playlist_notes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  song_id: {
                    type: "integer",
                    example: 1,
                  },
                  base_chord: {
                    type: "string",
                    example: "E",
                  },
                },
                required: ["song_id", "base_chord"],
              },
              example: [
                { song_id: 1, base_chord: "E" },
                { song_id: 2, base_chord: "Am" }
              ],
            },
            songs_count: {
              type: "integer",
              example: 3,
            },
            added_song_id: {
              type: "integer",
              example: 1,
            },
            base_chord: {
              type: "string",
              example: "E",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
            },
          },
          required: [
            "id",
            "playlist_name",
            "user_id",
            "songs",
            "playlist_notes",
            "songs_count",
            "added_song_id",
            "base_chord",
            "createdAt",
            "updatedAt",
          ],
        },
      },
      required: ["code", "message", "data"],
    };
  }
}

export default AddSongWithBaseChordResponse;
```

**Update existing schemas to include playlist_notes:**

**File: `/schemas/responses/PlaylistResponse.js`** - Add to data properties:
```javascript
playlist_notes: {
  type: "array",
  items: {
    type: "object",
    properties: {
      song_id: {
        type: "integer",
        example: 1,
      },
      base_chord: {
        type: "string", 
        example: "E",
      },
    },
    required: ["song_id", "base_chord"],
  },
  example: [
    { song_id: 1, base_chord: "E" },
    { song_id: 2, base_chord: "Am" }
  ],
},
```

## 7. API Usage Examples

### Add Song to Playlist with Base Chord

**Request:**
```
POST /api/playlists/1/songs/5
Authorization: Bearer <your_jwt_token>
Content-Type: application/json

{
  "base_chord": "E"
}
```

**Response:**
```json
{
  "code": 200,
  "message": "Song added to playlist with base chord successfully",
  "data": {
    "id": "1",
    "playlist_name": "My Favorite Songs",
    "user_id": 1,
    "songs": [1, 2, 5],
    "playlist_notes": [
      { "song_id": 1, "base_chord": "Am" },
      { "song_id": 2, "base_chord": "G" },
      { "song_id": 5, "base_chord": "E" }
    ],
    "songs_count": 3,
    "added_song_id": 5,
    "base_chord": "E",
    "createdAt": "2025-09-01T10:30:00.000Z",
    "updatedAt": "2025-09-01T14:22:00.000Z"
  }
}
```

## 8. Data Structure

The `playlist_notes` field stores an array of objects with the following structure:

```json
[
  {
    "song_id": 1,
    "base_chord": "E"
  },
  {
    "song_id": 2,  
    "base_chord": "Am"
  },
  {
    "song_id": 3,
    "base_chord": "G"
  }
]
```

## 9. Build Process

After implementing all changes:

1. Run build command: `npm run build`
2. Update API documentation: `npm run swagpress:generate-api`
3. Test the new endpoint with valid authentication

This implementation follows the established development flow: Model → Service → Controller → Schema → Build process, and maintains consistency with existing codebase patterns.