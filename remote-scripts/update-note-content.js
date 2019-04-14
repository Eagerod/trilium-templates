async (noteId, content) => {
    const note = await api.getNote(noteId);
    // Note, in newer versions of the trilium backend, setContent is async, and
    //   saves the note. In 0.28.3, it only updates the property, and note.save
    //   still needs to be called to actually persist the change.
    note.setContent(content);
    await note.save();
}
