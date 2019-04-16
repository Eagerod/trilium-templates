class ToDo {
    constructor(todoString) {
        this.ignore = false;

        const checkbox = todoString.substring(0, 5);
        if (checkbox === "- [ ]") {
            this.isToDo = true;
        } else if (checkbox === "- [x]") {
            this.isToDo = false;
        } else {
            this.ignore = true;
        }

        this.toDoText = todoString.substring(5, todoString.length);
    }

    html() {
        if (this.ignore) {
            return "";
        }
        return `<input type="checkbox" ${this.isToDo ? "" : "checked"}>${this.toDoText}<br/>`;
    }
}

const $todos = $("#todos");
const $dones = $("#dones");
const $sourceLink = $("#source-link");

(async () => {
    const sourceNote = await api.runOnServer(async (srcNoteId) => {
        const note = await api.getNote(srcNoteId);
        const sourceNoteAttribute = await note.getAttributeValue("relation", "sourceNote");
        return await api.getNote(sourceNoteAttribute);
    }, [api.currentNote.noteId]);

    const toDos = sourceNote.content.trim().split("\n");

    $.each(toDos, (i, v) => {
        const todo = new ToDo(v);
        const $list = todo.isToDo ? $todos : $dones;
        $list.append(todo.html());
    });

    const sourceNoteLink = await api.createNoteLink(sourceNote.noteId);
    $sourceLink.append(sourceNoteLink);
})();
