const $templateElement = $("#todo-template").remove();
const $todoLists = $("#todo-lists");

// Create a Done section for anything found in subsections. Insert at end.
const $done = $templateElement.clone();
$done.find("h6")[0].innerHTML = "Done";
var anyDone = false;

// Create a Generic list as well, but only insert it if needed.
const $general = $templateElement.clone();
$general.find("h6")[0].innerHTML = "General";
var generalNeeded = false;

const existingSections = {};

(async () => {
    // Have to get the noteIds from the server, and fetch the notes themselves
    //   on the front end.
    // Need to actually have the ORM-ed notes, rather than pure JS objects.
    const noteIds = await api.runOnServer(async (srcNoteId) => {
        const note = await api.getNote(srcNoteId);
        const listSourceAttribute = await note.getAttributeValue("relation", "listSource");

        const sourceNote = await api.getNote(listSourceAttribute);
        const children = await sourceNote.getChildNotes();

        return children.map((child) => child.noteId);
    }, [api.currentNote.noteId]);

    const notes = await api.getNotes(noteIds);

    for (const note of notes) {
        const noteAttributes = await note.getAttributes();

        var $noteSection = null;
        var completedAt = null;

        for (const attribute of noteAttributes) {
            const {type, name, value} = attribute;

            if (type !== "label") {
                continue;
            }

            switch(name) {
            case "category":
                if (!existingSections.hasOwnProperty(value)) {
                    $noteSection = $templateElement.clone();
                    $noteSection.find("h6")[0].innerHTML = value;
                    $todoLists.append($noteSection);
                    existingSections[value] = $noteSection;
                }
                else {
                    $noteSection = existingSections[value];
                }
                break;
            case "completedAt":
                completedAt = value;
                break;
            }
        }

        if ($noteSection === null) {
            $noteSection = $general;
            generalNeeded = true;
        }

        // Have to manually set some CSS, so the links looks innocuous.
        const $noteLink = await api.createNoteLink(note.noteId);
        $noteLink.css("text-decoration", "none");
        $noteLink.css("color", $("button").css("color"));

        if (completedAt === null) {
            $noteSection.append("<input type='checkbox'> ");
            $noteSection.append($noteLink);
            $noteSection.append("<br/>");
        }
        else {
            $done.append("<input type='checkbox' checked> ");
            $done.append($noteLink);
            $done.append("<br/>");
            anyDone = true;
        }
    }

    if (generalNeeded) {
        $todoLists.prepend($general);
    }

    if (anyDone) {
        $todoLists.append($done);
    }
})();
