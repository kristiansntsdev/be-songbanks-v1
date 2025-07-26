# API Documentation

This documentation describes the API endpoints for managing USER, SONG, TAG, NOTES, PLAYLIST, and PLAYLIST_TEAM based on the provided ER schema with normalized pivot tables.

Each endpoint will follow the general format: [HTTP_METHOD] /api/[role]/[resource]/[:optional-id].
[role] will be adjusted based on the authenticated user's role:

admin: Has limited access to users (viewing, managing status), and full access to managing songs and tags. Admins do not directly interact with playlists or playlist teams.

vol_user: Has access to view songs and tags, and manage their own notes. Has full access to manage playlists and playlist teams. A vol_user can request vol_user access if they don't already have it and can update their own profile data.

## 0. Authentication

### 0.1. User Login
POST /api/auth/login

Description: Authenticates a user and returns an authorization token and profile data.

Request:

No Bearer token for this endpoint.

req.body:

```json
{
    "email": "user@example.com",
    "password": "userpassword"
}
```

Response (If Admin):

```json
{
    "code": 200,
    "message": "Login successful",
    "data": {
        "token": "your_jwt_token_here",
        "user": {
            "id": "admin001",
            "email": "admin@example.com",
            "role": "admin",
            "is_admin": true,
            "status": "active"
        }
    }
}
```

Response (If Vol_User or Regular User):

```json
{
    "code": 200,
    "message": "Login successful",
    "data": {
        "token": "your_jwt_token_here",
        "user": {
            "id": "user123",
            "email": "user1@example.com",
            "role": "member",
            "is_admin": false,
            "status": "active"
        }
    }
}
```

## 1. User Endpoints

### 1.1. Manage User Access (Admin Only)
GET /api/admin/user-access

Description: Retrieves a list of all users who have vol_user status or request status (who have requested access). This data is used by admins to update user status.

Request:

Bearer token (Admin)

Response:

```json
{
    "code": 200,
    "message": "User access list retrieved successfully",
    "data": [
        {
            "id": "user123",
            "email": "user1@example.com",
            "role": "member",
            "is_admin": false,
            "status": "active"
        },
        {
            "id": "user789",
            "email": "pendinguser@example.com",
            "role": "member",
            "is_admin": false,
            "status": "request"
        }
    ]
}
```

### 1.2. Update User Access (Admin Only)
PUT /api/admin/user-access/:user_id

Description: Admin can update the status for a specific user.

Request:

Bearer token (Admin)

req.body:

```json
{
    "status": "active" // Change status to active
}
```

OR

```json
{
    "status": "suspend" // Change status to suspend
}
```

Response:

```json
{
    "code": 200,
    "message": "User access updated successfully",
    "data": {
        "id": "user123",
        "status": "active" // Or the updated status
    }
}
```

### 1.3. Request Vol_User Access (Vol_User Only)
POST /api/vol_user/request-vol-access

Description: Allows users who do not have vol_user status to send a request to an admin to change their status to vol_user. This will change the user's status to request.

Request:

Bearer token (User who does not have vol_user status)

req.body:

```json
{
    "message": "I would like to get access as a vol_user."
}
```

Response:

```json
{
    "code": 202,
    "message": "Vol_user access request sent successfully. Awaiting admin approval.",
    "data": {
        "user_id": "user_requesting_id",
        "status": "request"
    }
}
```

## 2. Song Endpoints

### 2.1. Retrieve All Songs (Public Access)
GET /api/songs

Request:

Bearer token (Admin or Vol_User)

Response:

```json
{
    "code": 200,
    "message": "List of songs retrieved successfully",
    "data": [
        {
            "id": "song001",
            "title": "Song Title 1",
            "artist": "Artist A",
            "tags": [
                {
                    "id": "tag001",
                    "name": "pop",
                    "description": "Pop music genre"
                },
                {
                    "id": "tag002", 
                    "name": "rock",
                    "description": "Rock music genre"
                }
            ],
            "base_chord": "C",
            "lyrics_and_chords": "Lyrics and chords..."
        }
    ]
}
```

### 2.2. Retrieve Song By ID (Public Access)
GET /api/songs/:id

Request:

Bearer token (Admin or Vol_User)

Response:

```json
{
    "code": 200,
    "message": "Song details retrieved successfully",
    "data": {
        "id": "song001",
        "title": "Song Title 1",
        "artist": "Artist A",
        "tags": [
            {
                "id": "tag001",
                "name": "pop",
                "description": "Pop music genre"
            },
            {
                "id": "tag002",
                "name": "rock", 
                "description": "Rock music genre"
            }
        ],
        "base_chord": "C",
        "lyrics_and_chords": "Lyrics and chords..."
    }
}
```

### 2.3. Create New Song (Admin Only)
POST /api/admin/songs

Request:

Bearer token (Admin)

req.body:

```json
{
    "title": "New Song Title",
    "artist": "Artist B", 
    "tag_ids": ["tag003"],
    "base_chord": "Am",
    "lyrics_and_chords": "New song lyrics..."
}
```

Response:

```json
{
    "code": 201,
    "message": "Song created successfully",
    "data": {
        "id": "song002",
        "title": "New Song Title"
    }
}
```

### 2.4. Update Song (Admin Only)
PUT /api/admin/songs/:id

Request:

Bearer token (Admin)

req.body:

```json
{
    "title": "Updated Song Title",
    "tag_ids": ["tag003", "tag004"]
}
```

Response:

```json
{
    "code": 200,
    "message": "Song updated successfully",
    "data": {
        "id": "song001",
        "title": "Updated Song Title"
    }
}
```

### 2.5. Delete Song (Admin Only)
DELETE /api/admin/songs/:id

Request:

Bearer token (Admin)

Response:

```json
{
    "code": 200,
    "message": "Song deleted successfully",
    "data": {
        "id": "song001"
    }
}
```

## 3. Tag Endpoints

### 3.1. Retrieve All Tags (Public Access)
GET /api/tags

Description: Retrieves a list of all available tags for song categorization.

Request:

Bearer token (Admin or Vol_User)

Response:

```json
{
    "code": 200,
    "message": "List of tags retrieved successfully",
    "data": [
        {
            "id": "tag001",
            "name": "rock",
            "description": "Rock music genre"
        },
        {
            "id": "tag002",
            "name": "worship",
            "description": "Worship and praise songs"
        }
    ]
}
```

### 3.2. Retrieve Tag By ID (Public Access)
GET /api/tags/:id

Request:

Bearer token (Admin or Vol_User)

Response:

```json
{
    "code": 200,
    "message": "Tag details retrieved successfully",
    "data": {
        "id": "tag001",
        "name": "rock",
        "description": "Rock music genre"
    }
}
```

### 3.3. Create New Tag (Admin Only)
POST /api/admin/tags

Request:

Bearer token (Admin)

req.body:

```json
{
    "name": "blues",
    "description": "Blues music genre"
}
```

Response:

```json
{
    "code": 201,
    "message": "Tag created successfully",
    "data": {
        "id": "tag003",
        "name": "blues"
    }
}
```

### 3.4. Update Tag (Admin Only)
PUT /api/admin/tags/:id

Request:

Bearer token (Admin)

req.body:

```json
{
    "name": "blues-rock",
    "description": "Blues rock fusion genre"
}
```

Response:

```json
{
    "code": 200,
    "message": "Tag updated successfully",
    "data": {
        "id": "tag003",
        "name": "blues-rock"
    }
}
```

### 3.5. Delete Tag (Admin Only)
DELETE /api/admin/tags/:id

Description: Deletes a tag and removes all song-tag relationships.

Request:

Bearer token (Admin)

Response:

```json
{
    "code": 200,
    "message": "Tag deleted successfully",
    "data": {
        "id": "tag003"
    }
}
```

### 3.6. Add Tag to Song (Admin Only)
POST /api/admin/songs/:song_id/tags/:tag_id

Description: Associates a tag with a song using the pivot table.

Request:

Bearer token (Admin)

Response:

```json
{
    "code": 201,
    "message": "Tag added to song successfully",
    "data": {
        "song_id": "song001",
        "tag_id": "tag001"
    }
}
```

### 3.7. Remove Tag from Song (Admin Only)
DELETE /api/admin/songs/:song_id/tags/:tag_id

Description: Removes a tag association from a song.

Request:

Bearer token (Admin)

Response:

```json
{
    "code": 200,
    "message": "Tag removed from song successfully",
    "data": {
        "song_id": "song001",
        "tag_id": "tag001"
    }
}
```

## 4. Notes Endpoints

### 4.1. Add Note to Song (Vol_User Only)
POST /api/notes/:user_id/:song_id

Description: A vol_user can add a new note to a song. The user_id in the path must match the user ID from the authentication token.

Request:

Bearer token (Vol_User)

req.body:

```json
{
    "notes": "New note added by vol_user."
}
```

Response:

```json
{
    "code": 201,
    "message": "Note added successfully",
    "data": {
        "id": "note_id_xyz",
        "user_id": "user123",
        "song_id": "song001",
        "notes": "New note added by vol_user."
    }
}
```

### 4.2. Retrieve All My Notes (Vol_User Only)
GET /api/notes/:user_id

Description: Retrieves all notes created by the logged-in vol_user. The user_id in the path must match the user ID from the authentication token.

Request:

Bearer token (Vol_User)

Response:

```json
{
    "code": 200,
    "message": "List of notes retrieved successfully",
    "data": [
        {
            "id": "note_id_xyz",
            "user_id": "user123",
            "song_id": "song001",
            "notes": "My first note."
        },
        {
            "id": "note_id_abc",
            "user_id": "user123",
            "song_id": "song002",
            "notes": "My second note."
        }
    ]
}
```

### 4.3. Retrieve Note By ID (Vol_User Only)
GET /api/notes/:user_id/:id

Description: Retrieves details of a specific note created by the logged-in vol_user. The user_id in the path must match the user ID from the authentication token.

Request:

Bearer token (Vol_User)

Response:

```json
{
    "code": 200,
    "message": "Note details retrieved successfully",
    "data": {
        "id": "note_id_xyz",
        "user_id": "user123",
        "song_id": "song001",
        "notes": "My first note."
    }
}
```

### 4.4. Update Note on Song (Vol_User Only)
PUT /api/notes/:user_id/:id

Description: A vol_user can update their existing note on a song. The user_id in the path must match the user ID from the authentication token.

Request:

Bearer token (Vol_User)

req.body:

```json
{
    "notes": "Updated note by vol_user."
}
```

Response:

```json
{
    "code": 200,
    "message": "Note updated successfully",
    "data": {
        "id": "note_id_xyz",
        "notes": "Updated note by vol_user."
    }
}
```

### 4.5. Delete Note (Vol_User Only)
DELETE /api/notes/:user_id/:id

Description: Deletes a note created by the logged-in vol_user. The user_id in the path must match the user ID from the authentication token.

Request:

Bearer token (Vol_User)

Response:

```json
{
    "code": 200,
    "message": "Note deleted successfully",
    "data": {
        "id": "note_id_xyz"
    }
}
```

## 5. Playlist Endpoints

### 5.1. Retrieve All Playlists (Vol_User Only)
GET /api/playlists

Request:

Bearer token (Vol_User)

Note: A vol_user can only retrieve playlists they own or are a member of the team for.

Response:

```json
{
    "code": 200,
    "message": "List of playlists retrieved successfully",
    "data": [
        {
            "id": "playlist_abc",
            "playlist_name": "Favorite Playlist",
            "songs": [
                {
                    "id": "song001",
                    "title": "Song Title 1",
                    "artist": "Artist A",
                    "order_index": 0
                },
                {
                    "id": "song003",
                    "title": "Song Title 3", 
                    "artist": "Artist C",
                    "order_index": 1
                }
            ],
            "sharable_link": "http://example.com/share/playlist_abc",
            "playlist_team_id": "team_xyz"
        }
    ]
}
```

### 5.2. Retrieve Playlist By ID (Vol_User Only)
GET /api/playlists/:id

Request:

Bearer token (Vol_User)

Note: A vol_user can only retrieve details of playlists they own or are a member of the team for.

Response:

```json
{
    "code": 200,
    "message": "Playlist details retrieved successfully",
    "data": {
        "id": "playlist_abc",
        "playlist_name": "Favorite Playlist",
        "songs": [
            {
                "id": "song001",
                "title": "Song Title 1",
                "artist": "Artist A",
                "order_index": 0
            },
            {
                "id": "song003",
                "title": "Song Title 3",
                "artist": "Artist C", 
                "order_index": 1
            }
        ],
        "sharable_link": "http://example.com/share/playlist_abc",
        "playlist_team_id": "team_xyz"
    }
}
```

### 5.3. Create New Playlist (Vol_User Only)
POST /api/playlists

Request:

Bearer token (Vol_User)

req.body:

```json
{
    "playlist_name": "My New Playlist",
    "songs": [
        {
            "song_id": "song002",
            "order_index": 0
        }
    ],
    "sharable_link": null,
    "playlist_team_id": null
}
```

Response:

```json
{
    "code": 201,
    "message": "Playlist created successfully",
    "data": {
        "id": "playlist_def",
        "playlist_name": "My New Playlist"
    }
}
```

### 5.4. Update Playlist (Vol_User Only)
PUT /api/playlists/:id

Request:

Bearer token (Vol_User)

Note: A vol_user can only update playlists they own.

req.body:

```json
{
    "playlist_name": "Updated Playlist",
    "songs": [
        {
            "song_id": "song001",
            "order_index": 0
        },
        {
            "song_id": "song002", 
            "order_index": 1
        },
        {
            "song_id": "song003",
            "order_index": 2
        }
    ],
    "sharable_link": "http://example.com/share/updatedplaylist",
    "playlist_team_id": "team_xyz"
}
```

Response:

```json
{
    "code": 200,
    "message": "Playlist updated successfully",
    "data": {
        "id": "playlist_abc",
        "playlist_name": "Updated Playlist"
    }
}
```

### 5.5. Delete Playlist (Vol_User Only)
DELETE /api/playlists/:id

Request:

Bearer token (Vol_User)

Note: A vol_user can only delete playlists they own.

Response:

```json
{
    "code": 200,
    "message": "Playlist deleted successfully",
    "data": {
        "id": "playlist_abc"
    }
}
```

### 5.6. Generate Shareable Link (Vol_User Only)
POST /api/playlists/:id/share

Description: Generate a shareable link for a playlist. This automatically creates a hidden playlist team that becomes visible when users join via the link. The playlist becomes locked from other users joining once someone uses the shareable link.

Request:

Bearer token (Vol_User - playlist owner)

Response:

```json
{
    "code": 201,
    "message": "Shareable link generated successfully",
    "data": {
        "id": "playlist_abc",
        "sharable_link": "https://songbanks-v1-1.vercel.app/share/playlist_abc_xyz123",
        "team_id": "team_hidden_abc",
        "is_shared": true,
        "is_locked": false
    }
}
```

### 5.7. Join Playlist via Shareable Link (Vol_User Only)
POST /api/playlists/join/:share_token

Description: Join a playlist using a shareable link token. This adds the user to the playlist team and locks the playlist from further joins unless invited by the team leader.

Request:

Bearer token (Vol_User)

Response:

```json
{
    "code": 200,
    "message": "Successfully joined playlist",
    "data": {
        "playlist_id": "playlist_abc",
        "team_id": "team_hidden_abc",
        "role": "member",
        "is_locked": true
    }
}
```

### 5.8. Get Shared Playlist Details (Public Access via Link)
GET /api/playlists/shared/:share_token

Description: Get playlist details using shareable link without authentication (for preview). Shows basic playlist info and songs.

Request:

No Bearer token required

Response:

```json
{
    "code": 200,
    "message": "Shared playlist details retrieved successfully",
    "data": {
        "id": "playlist_abc",
        "playlist_name": "Awesome Worship Songs",
        "owner_email": "owner@example.com",
        "songs_count": 12,
        "songs": [
            {
                "id": "song001",
                "title": "Song Title 1",
                "artist": "Artist A",
                "order_index": 0
            }
        ],
        "is_locked": true,
        "created_at": "2024-01-15T10:30:00Z"
    }
}
```

## 6. Playlist Team Endpoints

### 6.1. Retrieve All Playlist Teams (Vol_User Only)
GET /api/playlist-teams

Request:

Bearer token (Vol_User)

Note: A vol_user can only retrieve playlist teams they are a member or leader of.

Response:

```json
{
    "code": 200,
    "message": "List of playlist teams retrieved successfully",
    "data": [
        {
            "id": "team_xyz",
            "playlist_id": "playlist_abc",
            "members": [
                {
                    "user_id": "user123",
                    "email": "user1@example.com",
                    "role": "admin"
                },
                {
                    "user_id": "user456",
                    "email": "user2@example.com", 
                    "role": "member"
                }
            ],
            "lead_id": "user123"
        }
    ]
}
```

### 6.2. Retrieve Playlist Team By ID (Vol_User Only)
GET /api/playlist-teams/:id

Request:

Bearer token (Vol_User)

Note: A vol_user can only retrieve details of playlist teams they are a member or leader of.

Response:

```json
{
    "code": 200,
    "message": "Playlist team details retrieved successfully",
    "data": {
        "id": "team_xyz",
        "playlist_id": "playlist_abc",
        "members": [
            {
                "user_id": "user123",
                "email": "user1@example.com",
                "role": "admin"
            },
            {
                "user_id": "user456",
                "email": "user2@example.com",
                "role": "member"
            }
        ],
        "lead_id": "user123"
    }
}
```

### 6.3. Create New Playlist Team (Vol_User Only)
POST /api/playlist-teams

Request:

Bearer token (Vol_User)

req.body:

```json
{
    "playlist_id": "playlist_def",
    "members": [
        {
            "user_id": "user789",
            "role": "member"
        }
    ],
    "lead_id": "user789"
}
```

Response:

```json
{
    "code": 201,
    "message": "Playlist team created successfully",
    "data": {
        "id": "team_ghi",
        "playlist_id": "playlist_def"
    }
}
```

### 6.4. Delete Playlist Team (Vol_User Lead Only)
DELETE /api/playlist-teams/:id

Request:

Bearer token (Vol_User who is the team leader)

Response:

```json
{
    "code": 200,
    "message": "Playlist team deleted successfully",
    "data": {
        "id": "team_xyz"
    }
}
```

### 6.5. Remove Member from Playlist Team (Vol_User Lead Only)
DELETE /api/playlist-teams/:team_id/members/:user_id

Request:

Bearer token (Vol_User who is the team leader)

Response:

```json
{
    "code": 200,
    "message": "Team member removed successfully",
    "data": {
        "team_id": "team_xyz",
        "removed_user_id": "user456"
    }
}
```

### 6.6. Leave Playlist Team (Vol_User Member Only)
POST /api/playlist-teams/:team_id/leave

Request:

Bearer token (Vol_User who is a team member)

Note: This endpoint uses POST because it's an action (leaving), not a specific resource deletion.

Response:

```json
{
    "code": 200,
    "message": "Successfully left the playlist team",
    "data": {
        "team_id": "team_xyz",
        "user_id": "user789"
    }
}
```

### 6.7. Invite Member to Playlist Team (Vol_User Lead Only)
POST /api/playlist-teams/:team_id/invite

Description: Team leader can invite new members to a locked playlist team. This bypasses the sharing lock restriction.

Request:

Bearer token (Vol_User who is the team leader)

req.body:

```json
{
    "user_email": "newmember@example.com",
    "role": "member"
}
```

Response:

```json
{
    "code": 201,
    "message": "Member invited successfully",
    "data": {
        "team_id": "team_xyz",
        "invited_user_id": "user_new123",
        "role": "member"
    }
}
```

### 6.8. Update Team Visibility (Vol_User Lead Only)
PUT /api/playlist-teams/:team_id/visibility

Description: Team leader can toggle team visibility. Hidden teams are created when sharing links are generated.

Request:

Bearer token (Vol_User who is the team leader)

req.body:

```json
{
    "is_hidden": false
}
```

Response:

```json
{
    "code": 200,
    "message": "Team visibility updated successfully",
    "data": {
        "team_id": "team_xyz",
        "is_hidden": false
    }
}
```