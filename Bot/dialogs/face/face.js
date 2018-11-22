// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.


// Face.js defines the Face dialog

// Import required Bot Builder
const { ComponentDialog, WaterfallDialog } = require('botbuilder-dialogs');
const { ActivityTypes } = require('botbuilder');
const Client = require('azure-iothub').Client;
const Message = require('azure-iot-device').Message;
const uuid = require('uuid');
const rp = require('request-promise');
// Dialog IDs
const FACE_DIALOG = 'faceDialog';

const VALIDATION_SUCCEEDED = true;

/**
 * Demonstrates the following concepts:
 *  Use a subclass of ComponentDialog to implement a multi-turn conversation
 *  Use a Waterfall dialog to model multi-turn conversation flow
 *  Use custom prompts to validate user input
 *  Store conversation and user state
 *
 * @param {String} dialogId unique identifier for this dialog instance
 */
class Face extends ComponentDialog {
  constructor(dialogId, connectionString) {
    super(dialogId);

    // validate what was passed in
    if (!dialogId) throw new Error('Missing parameter.  dialogId is required');
    if (!connectionString) throw new Error('Missing parameter.  connectionString is required');

    // Add a water fall dialog with 4 steps.
    // The order of step function registration is importent
    // as a water fall dialog executes steps registered in order
    this.addDialog(new WaterfallDialog(FACE_DIALOG, [
      this.checkFaceStep.bind(this),
    ]));
    this.connectionString = connectionString;
  }
  
  getInternetAttachment(pictureName, imageUrl) {
    return {
        name: pictureName,
        contentType: 'image/png',
        contentUrl: imageUrl}
  }
  /**
   * Waterfall Dialog step functions.
   *
   * Initialize our state.  See if the WaterfallDialog has state pass to it
   * If not, then just new up an empty UserProfile object
   *
   * @param {WaterfallStepContext} step contextual information for the current step being executed
   */
  async checkFaceStep(step) {
    await step.context.sendActivity(`Checking for face now...`);

    // IoT Stuff
    //var targetdevice = 'mobile-MoCaDeSyMo01';
    var targetdevice = 'mock_iot_device';
    var serviceClient = Client.fromConnectionString(this.connectionString);

    var guid = uuid.v1(); 
    var pictureName = guid + "_face.jpeg";
    /*
        var pictureName = "16e6fb50-ec08-11e8-9981-338b7412aa78_face.jpeg";
    */

    var cmd = "pic#" + pictureName;
    serviceClient.open(function (err) {
            
            if (err) {
                
            } else {
                var message = new Message(cmd);
                message.ack = 'full';
                message.messageId = "My Message ID";
                serviceClient.send(targetdevice, message);
            }
        });

        
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
    //await delay(20000);
    let body = await this.sendIoTMessage(pictureName);
    const delay2 = ms => new Promise(resolve => setTimeout(resolve, ms));
    await delay2(10000);
    console.log('Body:', body);
    var faceAttributes = await body[0].faceAttributes;
    var age = faceAttributes.age;
    console.log(age);

    var ageStr = "The age of the detected person's face is: " + age;
    var imageUrl = "https://lunchbellbot.blob.core.windows.net/lunchbell-images/" + pictureName;
    const reply = { type: ActivityTypes.Message };
    reply.attachments = [this.getInternetAttachment(pictureName, imageUrl)];
    reply.text = ageStr;
    // Send the activity to the user.
    await step.context.sendActivity(reply);

    //await step.context.sendActivity(ageStr);
    return await step.endDialog();
  }

  async sendIoTMessage(pictureName) {
    console.log("sendIotMessage");
    var imageUrl = "https://lunchbellbot.blob.core.windows.net/lunchbell-images/" + pictureName;
    // Make sure you pick the correct URI for the Face API
    var options = {
        method: 'POST',
        uri: "https://westeurope.api.cognitive.microsoft.com/face/v1.0/detect?returnFaceId=false&returnFaceLandmarks=false&returnFaceAttributes=age,gender",
        headers: {
            "Ocp-Apim-Subscription-Key": "yourFaceApiKey"
        },
        body: {
            "Url": imageUrl
        },
        json: true // Automatically stringifies the body to JSON
    };

    var body = await rp.post(options);
    return body;
  }
  
}

exports.FaceDialog = Face;