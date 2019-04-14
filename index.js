const fs = require("fs");
const url = require("url");

const request = require("request-promise-native");

const notes = require("./notes.json")

const triliumUrl = url.parse(process.env.TRILIUM_URL);
const {protocol, host, auth} = triliumUrl;

const API_HOST = protocol + "//" + host;
const USERNAME = auth.split(":")[0];
const PASSWORD = auth.split(":")[1];

// Scripts that will be pushed to the backend that will create and update notes
//   as needed.
const NOTE_BY_ID = fs.readFileSync("remote-scripts/note-by-id.js").toString();
const CREATE_NOTE = fs.readFileSync("remote-scripts/create-note.js").toString();
const UPDATE_NOTE_CONTENT = fs.readFileSync("remote-scripts/update-note-content.js").toString();

class TriliumNote {
    constructor(noteJson) {
        this._id = noteJson.id;
        this._path = noteJson.note;
        this._parent = noteJson.parent;
        this._name = noteJson.name;
    }
}


class TriliumApiSender {
    constructor(username, password, hostname) {
        this._username = username;
        this._password = password;
        this._hostname = hostname;
        this._authCookie = null;
    }

    // Use the login route to get an authCookie.
    async login() {
        const requestObj = {
            uri: this._hostname + "/login",
            method: "POST",
            form: {
                username: this._username,
                password: this._password
            },
            resolveWithFullResponse: true
        };

        try {
           const response = await request(requestObj);
        } catch(err) {
            // I don't know why this is an actual error. This should just be
            //   an http response with the 302 status code?
            if (err.response && err.response.headers && err.response.headers["set-cookie"]) {
                this._authCookie = err.response.headers["set-cookie"][0];
                return;
            }

            throw err;
        }
    }

    async runScriptOnBackend(scriptString, params = []) {
        if (!this._authCookie) {
            await this.login(USERNAME, PASSWORD)
        }

        const requestObj = {
            uri: this._hostname + "/api/script/exec",
            method: "POST",
            headers: {
                "Cookie": this._authCookie,
                "Content-Type": "application/json"
            },
            json: {
                // Using root may be unsafe. Maybe create a dummy note in
                //   advance?
                currentNoteId: "root",
                params: params,
                script: scriptString,
                originEntityName: "notes"
            },
            resolveWithFullResponse: true
        };

        const response = await request(requestObj);

        if (response.statusCode != 200) {
            console.log("Failed to execute script on backend.");
            console.log(response.body);
        }

        return response.body && response.body.executionResult;
    }
}

(async function() {
    const apiClient = new TriliumApiSender(USERNAME, PASSWORD, API_HOST);

    // Iterate over scripts in notes.json, and write notes to the trilium
    //   instance.
    for (var i = 0; i < notes.length; ++i) {
        const note = notes[i];
        if (!note.id) {
            console.error(`Failed to find an id for a note in notes.json. Please fix to continue. (${JSON.stringify(note)}`);
            process.exit(-1);
        }

        const existingNote = await apiClient.runScriptOnBackend(NOTE_BY_ID, [note.id]);
        const noteContent = fs.readFileSync(note.note).toString();

        // If the note already exists, update it. If it doesn't, create one
        //   with the provided ID.
        if (existingNote == null) {
            const attributes = [
                {
                    type: "label",
                    name: NOTE_ID_LABEL,
                    value: note.id
                }
            ];
            await apiClient.runScriptOnBackend(CREATE_NOTE, [note.parent, note.title, noteContent, {attributes: attributes}]);
            console.log("Created a note.");
        } else {
            console.log(await apiClient.runScriptOnBackend(UPDATE_NOTE_CONTENT, [existingNote.noteId, noteContent]));
            console.log(`Updated note: ${existingNote.noteId}.`);
        }
    }
})();