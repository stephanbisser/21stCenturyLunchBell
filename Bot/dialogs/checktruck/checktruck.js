// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.


// greeting.js defines the greeting dialog

// Import required Bot Builder
const { ComponentDialog, WaterfallDialog } = require('botbuilder-dialogs');
const { ActivityTypes } = require('botbuilder');
const Client = require('azure-iothub').Client;
const Message = require('azure-iot-device').Message;
const uuid = require('uuid');
const rp = require('request-promise');
// Dialog IDs
const CHECKTRUCK_DIALOG = 'checkTruckDialog';

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
class CheckTruck extends ComponentDialog {
  constructor(dialogId, connectionString) {
    super(dialogId);

    // validate what was passed in
    if (!dialogId) throw new Error('Missing parameter.  dialogId is required');
    if (!connectionString) throw new Error('Missing parameter.  connectionString is required');

    // Add a water fall dialog with 4 steps.
    // The order of step function registration is importent
    // as a water fall dialog executes steps registered in order
    this.addDialog(new WaterfallDialog(CHECKTRUCK_DIALOG, [
      this.checkTruckStep.bind(this),
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
  async checkTruckStep(step) {
    await step.context.sendActivity(`Checking for food truck now...`);
    var demoImageUrl = "https://lunchbellbot.blob.core.windows.net/res/Lunchbell_Demo.png?st=2018-10-22T10%3A21%3A49Z&se=2022-10-23T10%3A21%3A00Z&sp=rl&sv=2018-03-28&sr=b&sig=%2Buu%2BMiFMcD1jMqPRarLJ70lQb96l%2BIha3d%2BcPK6mymg%3D";
    const infoMsg = { type: ActivityTypes.Message };
    infoMsg.attachments = [this.getInternetAttachment("Lunchbell_Demo.png", demoImageUrl)];
    infoMsg.text = "I will now send the command to the IoT Hub for further processing - (2)";
    // Send the activity to the user.
    await step.context.sendActivity(infoMsg);
    // IoT Stuff
    //var targetdevice = 'mobile-MoCaDeSyMo01';
    var targetdevice = 'mock_iot_device';
    var serviceClient = Client.fromConnectionString(this.connectionString);

    var guid = uuid.v1(); 
    var pictureName = guid + "_face.jpeg";
    /*
    var pictureName = '06743a30-d9f7-11e8-ae6c-393ddd48f0a4.jpeg';
    */
    
    var cmd = "pic#" + pictureName;
    
    serviceClient.open(function (err) {   
      if (err) {
          console.log(err);
      } else {
          var message = new Message(cmd);
          message.ack = 'full';
          message.messageId = "My Message ID";
          serviceClient.send(targetdevice, message);
      }
    });
    await step.context.sendActivity(`The IoT Hub is now sending the command to the device and the device will upload the picture to the Azure Storage - (3 + 4)`);

        
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
    //await delay(20000);
    let body = await this.sendIoTMessage(pictureName);
    const delay2 = ms => new Promise(resolve => setTimeout(resolve, ms));
    await delay2(10000);
    console.log('Body:', body);
    
    var probability = await body.predictions[0].probability;
    console.log(probability);

    var probabilityStr = "The probability that the car has been detected is: " + probability;
    
    var imageUrl = "https://lunchbellbot.blob.core.windows.net/lunchbell-images/" + pictureName;
    const reply = { type: ActivityTypes.Message };
    reply.attachments = [this.getInternetAttachment(pictureName, imageUrl)];
    reply.text = probabilityStr;
    // Send the activity to the user.
    await step.context.sendActivity(reply);

    return await step.endDialog();
  }
  
  async sendIoTMessage(pictureName) {
    console.log("sendIotMessage");
    var imageUrl = "https://lunchbellbot.blob.core.windows.net/lunchbell-images/" + pictureName;
    // Make sure you pick the correct URI for the CustomVision API
    var options = {
        method: 'POST',
        uri: "https://southcentralus.api.cognitive.microsoft.com/customvision/v2.0/Prediction/4968e8c6-afd9-4502-8176-fede44631ba4/url",
        headers: {
          "Prediction-Key": "yourCustomVisionKey"
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

exports.CheckTruckDialog = CheckTruck;