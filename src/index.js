const fs = require("fs");
const path = require("path");

const tar = require("tar");

const TriliumApi = require("./trilium-api");
const notes = require("../notes.json");

// Scripts that will be pushed to the backend that will create and update notes
//   as needed.
const NOTE_ID_LABEL = "autogenerated-note-id";
const NOTE_BY_ID = fs.readFileSync("remote-scripts/note-by-id.js").toString();
const NOTE_BY_AUTO_ID = fs.readFileSync("remote-scripts/note-by-auto-id.js").toString();
const CREATE_NOTE = fs.readFileSync("remote-scripts/create-note.js").toString();
const UPDATE_NOTE_CONTENT = fs.readFileSync("remote-scripts/update-note-content.js").toString();

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;


// Since ids in the notes listing can either be provided as uuids from within
//   the notes listing itself, resolve the provided noteId to a note.
async function getNote(apiClient, noteId) {
    if (UUID_REGEX.test(noteId)) {
        const note = await apiClient.runScriptOnBackend(NOTE_BY_AUTO_ID, [noteId]);
        return note;
    }

    const note = await apiClient.runScriptOnBackend(NOTE_BY_ID, [noteId]);
    return note;
}


// Handle a single note that needs to be updated.
async function processSingleNote(apiClient, note) {
    const existingNote = await getNote(apiClient, note.id);
    const noteContent = fs.readFileSync(note.note).toString();

    // If the note already exists, update it. If it doesn't, create one
    //   with the provided ID.
    if (existingNote == null) {
        console.log(`No existing note found for ID: ${note.id}. Creating`);
        const attributes = [
            {
                type: "label",
                name: NOTE_ID_LABEL,
                value: note.id
            }
        ];
        await apiClient.runScriptOnBackend(CREATE_NOTE, [note.parent, note.title, noteContent, {attributes: attributes}]);
        console.log("Created a note.");
    } else {
        console.log(`Updating note: ${note.id} (${existingNote.noteId})`);
        await apiClient.runScriptOnBackend(UPDATE_NOTE_CONTENT, [existingNote.noteId, noteContent]);
    }
}


// Handle a tree of notes, that was exported from Trilium.
async function processTreeNote(apiClient, note) {
    // This is implemented by dropping the entire note, rather than trying to
    //   recursively update notes. This may actually be the more performant way
    //   of doing this, but given the number of notes I have to deal with, even
    //   benchmarking isn't really worth the time.
    const existingNote = await getNote(apiClient, note.id);

    if (existingNote) {
        console.log(`Found existing note for id: ${note.id} -- ${existingNote.noteId}. Deleting to recreate tree.`);
        await apiClient.deleteNote(existingNote.noteId)
    }

    // Get the parent note, since its id needs to be provided.
    const parentNote = await getNote(apiClient, note.parent);
    if (!parentNote) {
        console.error(`Parent ${note.parent} not found.`);
        process.exit(3);
    }

    const tarOptions = {
        cwd: note.note,
        // This could probably look at something like an ignore file, rather
        //   than just having one filename listed out. Will consider this if it
        //   becomes an issue.
        filter: (filename, stat) => filename.indexOf('.DS_Store') === -1
    };

    // Tar and upload.
    const tarStream = await tar.c(tarOptions, fs.readdirSync(note.note));
    const tarContent = [];
    for await (const d of tarStream) {
        tarContent.push(d);
    }

    const tarBuffer = Buffer.concat(tarContent);
    // fs.writeFileSync("./test.tar", tarBuffer);

    console.log('Creating new note tree from tar import.');
    await apiClient.importNote(parentNote.noteId, tarBuffer);    
}


async function processNote(apiClient, note) {
    if (!note.id) {
        console.error(`Failed to find an id for a note in notes.json. Please fix to continue. (${JSON.stringify(note)}`);
        process.exit(1);
    }
    if (!note.parent) {
        console.error("Cannot create a note without a parent. Did you mean to make the parent `root`?");
        process.exit(2);
    }

    const sourceStat = fs.lstatSync(note.note);
    if (sourceStat.isDirectory()) {
        await processTreeNote(apiClient, note);
    } else {
        await processSingleNote(apiClient, note);
    }
};


module.exports = async function(triliumUrl) {
    const apiClient = new TriliumApi(triliumUrl);

    // Iterate over scripts in notes.json, and write notes to the trilium
    //   instance.
    for (var i = 0; i < notes.length; ++i) {
        const note = notes[i];
        await processNote(apiClient, note);
    }
};
