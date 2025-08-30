update playlist service with endpoint and functionality is based on this:
1. post /playlist/{userCode}
param: userCode
create a playlist based on userCode and req body is playlistname with optional is songs id if the user create playlist based on add song to new playlist, after create it, it will pass a response 
{
  "playlist_name": "My New Playlist",
  "songs": [],
  "sharable_link": null,
  "playlist_team_id": null
}

2. get /playlist/{userCode}
param: userCode
fetch all playlist that connect to userCode with pagination like on song service
response 
{
  "code": 200,
  "message": "List of playlists retrieved successfully",
  "data": [
    {
      "id": "1",
      "playlist_name": "Favorite Playlist"
    },
    {
      "id": "2,
      "playlist_name": "Favorite Playlist 2"
    }
  ]
}

3. put /playlist/{userCode}/{playlist_id}
param: playlist_id, usercode
update playlist with req body is 
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

and response 
{
  "code": 200,
  "message": "Playlist updated successfully",
  "data": {
    "id": "playlist_abc",
    "playlist_name": "Updated Playlist"
  }
}

4. delete playlist/{userCode}/{playlist_id}
param: userCode, playlist_id
remove playlist