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

const $templateElement = $("#todo-template").remove();
const $todoLists = $("#todo-lists");
const $sourceLink = $("#source-link");

// Create a Done section for anything found in subsections. Insert at end.
const $dones = $templateElement.clone();
$dones.find("h6")[0].innerHTML = "Done";

// Create a Generic list as well, but only insert it if needed.
const $general = $templateElement.clone();
$general.find("h6")[0].innerHTML = "General";
var generalNeeded = false;


(async () => {
    const sourceNote = await api.runOnServer(async (srcNoteId) => {
        const note = await api.getNote(srcNoteId);
        const sourceNoteAttribute = await note.getAttributeValue("relation", "sourceNote");
        return await api.getNote(sourceNoteAttribute);
    }, [api.currentNote.noteId]);

    const toDos = sourceNote.content.trim().split("\n");

    for (var i = 0; i < toDos.length; ++i) {
        const v = toDos[i];

        if (v[0] === "#") {
            const sectionName = v.substring(1).trim();
            
            const $todos = $templateElement.clone();
            $todos.find("h6")[0].innerHTML = sectionName;
            $todoLists.append($todos);
     
            for (var ii = i+1; ii < toDos.length; ++ii, ++i) {
                const vv = toDos[ii];

                if (vv[0] === "#") {
                    break;
                }

                const todo = new ToDo(vv);
                const $list = todo.isToDo ? $todos : $dones;
                $list.append(todo.html());
            }
        }
        else {
            generalNeeded = true;
            const todo = new ToDo(v);
            const $list = todo.isToDo ? $general : $dones;
            $list.append(todo.html());
        }
    }

    if (generalNeeded) {
        $todoLists.prepend($general);
    }

    $todoLists.append($dones);

    const sourceNoteLink = await api.createNoteLink(sourceNote.noteId);
    $sourceLink.append(sourceNoteLink);
})();
