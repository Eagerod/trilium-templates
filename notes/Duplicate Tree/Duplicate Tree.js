// Duplicate the tree located at the provided noteId and place the result in
//   DEST_TREE note.
// Note: It may be more effective to tar and import existing note trees, since
//   that will preserve and duplicate relations as well.
const SOURCE_TREE = "2QA2RYpmzoGW";
const DEST_TREE = "root";

(async () => {
    const newNote = await api.runOnServer(async (sourceTree, destTree) => {
        async function doIt(destNote, sourceNote) {
            var sourceAttributes = [];
            for (const attribute of await sourceNote.getAttributes()) {
                sourceAttributes.push({type: attribute.type, name: attribute.name, value: attribute.value});
            }

            const {note} = await api.createNote(destNote.noteId, sourceNote.title, sourceNote.content, {type: sourceNote.type, attributes: sourceAttributes});
            
            const childNotes = await sourceNote.getChildNotes();
            for (const childNote of childNotes) {
                await doIt(note, childNote);
            }

            return note;
        }

        return doIt(await api.getNote(destTree), await api.getNote(sourceTree));
    }, [SOURCE_TREE, DEST_TREE]);

    await api.activateNewNote(newNote.noteId);
    api.showMessage("Note cloned. Some relations may need adjusting.");
})();