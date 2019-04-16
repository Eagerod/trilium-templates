const sourceNote = await api.runOnServer(async (srcNoteId) => {
    const note = await api.getNote(srcNoteId);
    const sourceNoteAttribute = await note.getAttributeValue("relation", "sourceNote");
    return await api.getNote(sourceNoteAttribute);
}, [api.currentNote.noteId]);

const toDos = sourceNote.content.trim().split("\n");

$.each(toDos, (i, v) => {
    if (v.substring(0, 5) === "- [ ]") {
        $("#todos").append("<input type='checkbox'>" + v.substring(5, v.length) + "<br/>");
    }
    else if (v.substring(0, 5) === "- [x]") {
        $("#dones").append("<input type='checkbox' checked>" + v.substring(5, v.length) + "<br/>");
    }
});

const sourceNoteLink = await api.createNoteLink(sourceNote.noteId);
$("#source-link").append(sourceNoteLink);
