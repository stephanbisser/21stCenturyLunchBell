// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.


// Joke.js defines the Joke dialog

// Import required Bot Builder
const { ComponentDialog, WaterfallDialog, TextPrompt } = require('botbuilder-dialogs');
const rp = require('request-promise');
// Dialog IDs
const JOKE_DIALOG = 'jokeDialog';

const VALIDATION_SUCCEEDED = true;
const VALIDATION_FAILED = !VALIDATION_SUCCEEDED;

/**
 * Demonstrates the following concepts:
 *  Use a subclass of ComponentDialog to implement a multi-turn conversation
 *  Use a Waterfall dialog to model multi-turn conversation flow
 *  Use custom prompts to validate user input
 *  Store conversation and user state
 *
 * @param {String} dialogId unique identifier for this dialog instance
 */
class Joke extends ComponentDialog {
  constructor(dialogId) {
    super(dialogId);

    // validate what was passed in
    if (!dialogId) throw new Error('Missing parameter.  dialogId is required');

    // Add a water fall dialog with 4 steps.
    // The order of step function registration is importent
    // as a water fall dialog executes steps registered in order
    this.addDialog(new WaterfallDialog(JOKE_DIALOG, [
      this.jokeStep.bind(this),
    ]));

  }
  /**
   * Waterfall Dialog step functions.
   *
   * Initialize our state.  See if the WaterfallDialog has state pass to it
   * If not, then just new up an empty UserProfile object
   *
   * @param {WaterfallStepContext} step contextual information for the current step being executed
   */
  async jokeStep(step) {
    let body = await this.getJoke();
    console.log(body.value);
    await step.context.sendActivity(body.value);
    return await step.endDialog();
  }
  async getJoke() {
    console.log("getting joke");
    var options = {
        method: 'GET',
        uri: "https://api.chucknorris.io/jokes/random",
        json: true // Automatically stringifies the body to JSON
    };

    var body = await rp.get(options);
    return body;
  }
}

exports.JokeDialog = Joke;