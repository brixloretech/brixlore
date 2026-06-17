Content Editing Limitations - Analysis
Below is the to-the-point summary of what is currently done (implemented) and what is remaining (missing) in the Library module.

What is Done
Backend updateContent Endpoint: Already accepts thumbnailKey and posterKey and updates thumbnailUrl and posterUrl in the database.
Initial Upload capabilities: Full R2 direct uploads and indexing for movies, episodes, seasons, thumbnails, poster images, and trailers during the initial upload workflow (/admin/content/upload).
Basic Metadata Edit UI: The edit page (/admin/content/[id]/edit) already allows editing title, content type, release year, age rating, duration, category, description, and published status.
What is Remaining
Thumbnail & Poster Editing:
The frontend edit page lacks file selectors to replace the Thumbnail image (landscape Card artwork) and the Poster image (portrait Banner artwork) of a content item.
Movie / Short Video Editing:
Movies and Shorts have their video file stored in a single episode under the hood. There is currently no way to replace/re-upload this video file on the edit page.
Seasons & Episodes CRUD:
Backend routes missing: There are no update or delete routes for episodes (PATCH/DELETE /admin/episodes/:id) or seasons (PATCH/DELETE /admin/seasons/:id).
Frontend UI missing: The edit page lists seasons and episodes but has no buttons, modals, or forms to edit details (title, number, duration, thumbnail, video file) or delete them.
Transcoding: Replacing an episode/movie video file must nullify hlsUrl in the database and re-trigger background HLS transcoding.
Trailer Editing:
Trailers are separate hidden content items. The edit page has no UI to edit a trailer's title, duration, video file, or artwork, nor to attach a trailer if one doesn't exist yet.