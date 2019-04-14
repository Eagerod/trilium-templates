async (noteId, attribute) => {
    const note = await api.getNote(noteId);
    await note.setAttribute(attribute.type, attribute.name, attribute.value);
}
