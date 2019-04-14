async (parent, title, content, options) => {
    return await api.createNote(parent, title, content, options);
}
