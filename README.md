# Trilium Templates

This repo holds templates for my [Trilium](https://github.com/zadam/trilium) instance.

There are a few general formats that certain notes tend to follow, so in the interest of keeping those relatively organized, and version controlled, notes and their relationships with others lives here.

Since Trilium is scriptable, many of the scripts I include in my notes are included in this repo.
As I build up a larger and larger suite of scripted notes, I'll add them to this repo.

## notes.json

`notes.json` is the JSON file that holds all of the structural information on how notes relate to each other.
Here's one commented example describing how an item in `notes.json` may appear.

```
{
    // The title of the note that's shown in Trilium. If the provided note is
    //   an archive that will be uploaded, this is ignored, I think.
    "title": "Templates",

    // An unused field that I keep just to keep track of what a specific note
    //   is actually doing, since their contents are stored elsewhere.
    "comment_description": "This is the root note that will hold all templates.",

    // Path relative to the script directory that contains the note's contents.
    //   If this points to a directory, the script assumes the directory in
    //   question contains a valid Trilium note export, and will archive the
    //   provided directory, and upload it verbatim.
    "note": "notes/templates.html",

    // The parent note of this one. Although Trilium does support multiple
    //   parents, I don't really use them for this tool.
    // The parent can either be one of Trilium's own `noteId`s, or the UUID of
    //   a note that's created using this script. If it's an ID of a note that
    //   this script creates, the created script must appear earlier in the
    //   notes.json list.
    "parent": "root",

    // The UUID for this note. Can be used by other notes to reference the note
    //   created by this entity in the list.
    "id": "7688af4d-cabb-4601-8a02-05258070bcf5"
}
```
