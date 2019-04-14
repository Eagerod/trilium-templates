async (noteId, content) => {
    const note = await api.getNote(noteId);
    note.setContent(content);
    await note.save();
}
