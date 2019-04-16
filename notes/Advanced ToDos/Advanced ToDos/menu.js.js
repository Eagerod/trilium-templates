// Creates the context bar item to create a new full blown to-do item.
(async () => {
    const {TEMPLATE_SOURCE, LIST_SOURCE} = await api.runOnServer(async (srcNoteId) => {
        const note = await api.getNote(srcNoteId);
        const templateSourceAttribute = await note.getAttributeValue("relation", "templateSource");
        const listSourceAttribute = await note.getAttributeValue("relation", "listSource");
        return {TEMPLATE_SOURCE: templateSourceAttribute, LIST_SOURCE: listSourceAttribute};
    }, [api.currentNote.noteId]);

    api.addButtonToToolbar({
        title: "ToDo",
        icon: "check",
        shortcut: "alt+t",
        action: async () => {
            const taskNoteId = await api.runOnServer(async (templateSource, listSource) => {
                const sourceNote = await api.getNote(templateSource);
                const sourceAttributes = [];
     
                // Copy attributes, but if it's the created attribute, set it to today.
                for (var attribute of await sourceNote.getAttributes()) {
                    const {type, name, value} = attribute;
                    sourceAttributes.push({type, name, value});
                }
                
                const today = (new Date()).toISOString().split("T")[0];
                sourceAttributes.push({type: "label", name: "createdAt", value: today});
                const {note} = await api.createNote(listSource, "To Do", "", {type: sourceNote.type, attributes: sourceAttributes});

                return note.noteId;
            }, [TEMPLATE_SOURCE, LIST_SOURCE]);

            // we got an ID of newly created note and we want to immediately display it
            await api.activateNewNote(taskNoteId);
        }
    });
})();
