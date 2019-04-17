const NOTD_MINIMUM_LENGTH = 100;
const NOTE_OF_THE_DAY_LABEL = "noteOfTheDayRoot";

(async () => {
    const randomNote = await api.runOnServer(async (minLength, label) => {
        function hashStr(str) {
            var hash = 0;
            if (str.length === 0) {
                return hash;
            }
            for (var i = 0; i < str.length; i++) {
                var chr = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + chr;
                hash |= 0; // Convert to 32bit integer
            }
            return hash;
        }
        
        const notes = await api.getNotesWithLabel(label);
        var allDescendants = "";
        for (const note of notes) {
            const descendants = await note.getDescendantNoteIds();
            // Remove the root note.
            // Also, I don't know why this just becomes a string after slicing
            //   it, but it must have something to do with the backed eval
            //   engine.
            allDescendants += descendants.slice(1) + ",";
        }
        
        if (allDescendants.length > 0) {
            allDescendants = allDescendants.substring(0, allDescendants.length - 1);
        }
        
        const today = new Date().toISOString().split("T")[0];
        var descendants = allDescendants.split(",");
        while (descendants.length > 0) {
            const todaysRandomVal = hashStr(today) % descendants.length;

            const tempNote = await api.getNote(descendants[todaysRandomVal]);
            
            if (tempNote.content.length >= minLength) {
                return tempNote;
            }
            
            descendants.splice(todaysRandomVal, 1);
        }
       
        return null;
    }, [NOTD_MINIMUM_LENGTH, NOTE_OF_THE_DAY_LABEL]);

    if (!randomNote) {
        console.log("Failed to find note of the day root nodes");
        return;
    }

    const $noteLink = await api.createNoteLink(randomNote.noteId);
    $noteLink.css("text-decoration", "none");
    $noteLink.css("color", $("button").css("color"));

    const $linkHeader = $("<h1></h1>").append($noteLink);

    $("#content").empty().append($linkHeader);
    if (randomNote.type === "code") {
        const $preContent = $("<pre>" + randomNote.content + "</pre>");
        $preContent.css("color", $("button").css("color"));
        $("#content").append($preContent);
    }
    else {
        $("#content").append(randomNote.content);
    }
})();
