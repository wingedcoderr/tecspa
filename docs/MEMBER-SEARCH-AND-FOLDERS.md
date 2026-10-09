# Member search and organization folders

This update adds client-side member search and single-level organization folders to the Members directory.

## Search

- Search updates immediately as the query changes.
- Matching is case-insensitive and checks name, aliases, pronouns, role, status, about text, interests, and fronting triggers.
- Search combines with the selected folder filter.
- Clearing search or choosing “show all members” restores the directory.

## Folders

- A member can belong to one folder, or remain Unfiled.
- Folder assignment is stored in the member record itself. On the web build, member records are written through the encrypted vault and folder assignment is therefore included in that encrypted record.
- Create a folder by naming it and choosing a member to place in it. This model does not keep empty folders; a folder exists while at least one member is assigned to it.
- Rename updates every currently assigned member. Delete moves members to Unfiled and does not delete profiles.
- Folder operations use the existing data adapter, so the directory UI supports the web and desktop adapter implementations.

## Limitations

- Folders are single-level, and each member can be assigned to only one folder.
- There are no standalone empty folders, nested folders, drag-and-drop, or multi-select operations.
- Rename/delete operations save member records sequentially. If an operation fails partway through, the UI reports that some assignments may still need updating; review the directory before retrying.
- This feature does not complete TECSPA's broader E2EE migration or remove legacy plaintext endpoints.
