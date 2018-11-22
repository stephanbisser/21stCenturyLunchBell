// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.


// Predict.js defines the Predict dialog

// Import required Bot Builder
const { ComponentDialog, WaterfallDialog, TextPrompt } = require('botbuilder-dialogs');
const { ActionTypes, ActivityTypes, CardFactory } = require('botbuilder');
// Dialog IDs
const PREDICT_DIALOG = 'predictDialog';



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
 * @param {PropertyStateAccessor} userProfileAccessor property accessor for user state
 */
class Predict extends ComponentDialog {
  constructor(dialogId) {
    super(dialogId);

    // validate what was passed in
    if (!dialogId) throw new Error('Missing parameter.  dialogId is required');

    // Add a water fall dialog with 4 steps.
    // The order of step function registration is importent
    // as a water fall dialog executes steps registered in order
    this.addDialog(new WaterfallDialog(PREDICT_DIALOG, [
      this.predictStep.bind(this),
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
  async predictStep(step) {
    const reply = { type: ActivityTypes.Message };
    // build buttons to display.
    const buttons = [
      { type: ActionTypes.ImBack, title: 'Tell me a joke', value: 'Tell me a joke' }
    ];
    
    // construct hero card.
    const card = CardFactory.heroCard('Sorry', CardFactory.images(['https://i.imgflip.com/nf5rh.jpg']),
    buttons, { text: 'Unfortunately I\'m still learning to predict the arrival time - do you want to hear a joke in the meantime?' });

    // add card to Activity.
    reply.attachments = [card];

    // Send hero card to the user.
    await step.context.sendActivity(reply);

    return await step.endDialog();
  }
}

exports.PredictDialog = Predict;