Content Editing Limitations - Analysis
Below is the to-the-point summary of what is implemented in the Library module (Milestone 2).

What is Done
1. Backend updateContent Endpoint: Accepts thumbnailKey, posterKey, and bannerKey, and updates thumbnailUrl, posterUrl, and bannerUrl in the database.
2. Initial Upload capabilities: Full R2 direct uploads and indexing for movies, episodes, seasons, thumbnails, poster images, banner images, and trailers during the initial upload workflow (/admin/content/upload).
3. Basic Metadata Edit UI: The edit page (/admin/content/[id]/edit) allows editing title, content type, release year, age rating, duration, category, description, and published status.
4. Thumbnail & Poster Editing:
   - File selectors added on the frontend edit page to replace the Thumbnail image (landscape Card artwork) and the Poster image (portrait Banner artwork) of a content item.
5. Movie / Short Video Editing:
   - Replaced / re-uploaded video file on the edit page for Movies and Shorts (which are stored in a single episode under the hood).
6. Seasons & Episodes CRUD:
   - Backend routes implemented: Added update and delete routes for episodes (PATCH/DELETE /admin/episodes/:id) and seasons (PATCH/DELETE /admin/seasons/:id).
   - Frontend UI: The edit page lists seasons and episodes with Edit and Delete buttons, displaying modals and forms to edit details (title, number, duration, thumbnail, video file) or delete them.
7. Transcoding:
   - Replacing an episode/movie video file nullifies `hlsUrl` in the database and re-triggers background HLS transcoding automatically.
8. Trailer Editing:
   - Added UI to edit a trailer's title, duration, video file, or artwork, and support for attaching a trailer if one doesn't exist yet.