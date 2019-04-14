const url = require("url");

const request = require("request-promise-native");

class TriliumApi {
    constructor(triliumUrl) {
        triliumUrl = url.parse(triliumUrl);
        const {protocol, host, auth} = triliumUrl;

        this._username = auth.split(":")[0];
        this._password = auth.split(":")[1];
        this._hostname = protocol + "//" + host;
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
            await request(requestObj);
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
            await this.login();
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

module.exports = TriliumApi;