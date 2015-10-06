//#########################################Mimic Calling methods start.################################################
var id = sendEmailByModel('Test association title', 'Test association content');
var altId = getCapAltId();
associate(id, altId+',RECORD;13CAP-00000136,RECORD');

aa.print('Cap AltID: ' + altId);
aa.print('Communication Id ' + id);

aa.env.setValue("ScriptReturnCode","0");
aa.env.setValue("ScriptReturnMessage",'');
//##########################################Mimic Calling methods end###############################################

// ####################################Supported methods start.##############################
function sendMessageByMessageModel(messageModel){
	return aa.communication.sendMessage(messageModel);
}

function sendMessageByNotificationTemplate(templateName, variables, triggerEvent){
	return aa.communication.sendMessages(templateName, variables, triggerEvent);
}

function associateEnities(communicationId, entityId, entityType){
	return aa.communication.associateEnities(communicationId, entityId, entityType);
}

function getEmailMessageScriptModel(){
	return aa.communication.getEmailMessageScriptModel();
}

function getSMSMessageScriptModel(){
	return aa.communication.getSMSMessageScriptModel();
}

function getContactList4Email(params){
	return aa.communication.getContactList(params, 'EMAIL');
}

function getContactList4SMS(params){
	return aa.communication.getContactList(params, 'SMS');
}

function resendFailedMessages(typeArray){
	return aa.communication.resendFailedMessages(typeArray);
}

function getI18nVariables(){
	return aa.communication.getI18nVariables();
}
// ####################################Supported methods end.###################################





// ####################################Util methods start.#######################################
// Get custom Id.
function getCapAltId()
{
	var s_id1 = aa.env.getValue("PermitId1");
	var s_id2 = aa.env.getValue("PermitId2");
	var s_id3 = aa.env.getValue("PermitId3");
	var capIDModel = aa.cap.getCapIDModel(s_id1, s_id2, s_id3).getOutput();
	return capIDModel.getCustomID();
}
// log meesage.
function logMessage(msg){
	aa.print("MESSAGE: " + msg);
}

// Log error.
function logError(errorMsg){
	aa.print("ERROR: " + errorMsg);
}

// ####################################Util methods end.#########################################

//####################################Example of what could be done start.#############################################################
function sendEmailByModel(pTitle, pContent){

	// Form contacts.
	function formContacts(){
		// Define some constants used in params.
		var from = 'FROM',
			to = 'TO',
			bcc = 'BCC',
			cc = 'CC';
		
		
		// Build to contacts.
		// This params is used for building contacts.
		// It is a two dimensional array, with each item being the contanct to be specified.
		// In each contact item, the configuration will be something similar to [contact name string, contact email string, contact type string].
		// Note that in the contact type string only string defined above could be used, which are "FROM", "TO", "BCC" and "CC".
		var params = [
						['Tom Liang', 'tom.liang@achievo.com', to], 
						['Bruin li', 'bruin.li@achievo.com', to], 
						['Austin wang', 'austin.wang@achievo.com', to],
						['Bruin Li', 'bruin.li@achievo.com', from]
					];
		var contacts = getContactList4Email(params).getOutput();
		
		return contacts;
	}
	
	// sending message starts.+++++++++++++++++++++++++++++++++++++++++++++++++++++++
	var messageModel = getEmailMessageScriptModel().getOutput();

	// Set title and content.
	var title = pTitle+'[from script]';
	messageModel.setTitle(title);

	var content = pContent+'[from script].';
	messageModel.setContent(content);

	var contacts = formContacts();
	messageModel.setContacts(contacts);

	// Set the parameter with appropriate event type, which could be one of those listed below.
	// (CommunicationReceivingEmailBefore,CommunicationReceivingEmailAfter,CommunicationSendingEmailBefore,CommunicationSendingEmailAfter;);
	messageModel.setTriggerEvent('CommunicationReceivingEmailAfter');

	// Call the api to sent message.
	var result = sendMessageByMessageModel(messageModel);
	aa.print((result.getOutput() != null)?'email sent successfully.': 'email sent failed.');
	
	return result.getOutput();
}


function sendSMSByModel(pTitle, pContent){

	// Form contacts.
	function formContacts(){
		// Define some constants used in params.
		var from = 'FROM',
			to = 'TO';
		
		
		// Build to contacts.
		// This params is used for building contacts.
		// It is a two dimensional array, with each item being the contanct to be specified.
		// In each contact item, the configuration will be something similar to [contact name string, contact phone number string, contact type string].
		// Note that in the contact type string only string defined above could be used, which are "FROM", "TO";
		var params = [
						['','+8613922800454', to]
					];
		var contacts = getContactList4SMS(params).getOutput();
		
		return contacts;
	}
	
	// sending message starts.+++++++++++++++++++++++++++++++++++++++++++++++++++++++
	var messageModel = getSMSMessageScriptModel().getOutput();

	// Set content.
	var content = pContent+'[from script].';
	messageModel.setContent(content);

	var contacts = formContacts();
	messageModel.setContacts(contacts);

	// Set the parameter with appropriate event type, which could be one of those listed below.
	// (CommunicationReceivingEmailBefore,CommunicationReceivingEmailAfter,CommunicationSendingEmailBefore,CommunicationSendingEmailAfter;);
	messageModel.setTriggerEvent('CommunicationReceivingEmailAfter');

	// Call the api to sent message.
	var result = sendMessageByMessageModel(messageModel);
	aa.print((result.getOutput() != null)?'SMS sent successfully.': 'SMS sent failed.');
        aa.env.setValue("ScriptReturnCode","0");
	aa.env.setValue("ScriptReturnMessage","Sent successfully.");
}

function sendMessageByTemplate(){
	// The third parameter could be one of these
	// (CommunicationReceivingEmailBefore,CommunicationReceivingEmailAfter,CommunicationSendingEmailBefore,CommunicationSendingEmailAfter;);
	var result = sendMessageByNotificationTemplate('EMAIL_TOM_TEST', null, 'CommunicationReceivingEmailAfter');
	aa.print(result.getOutput()?'message sent successfully':'error in sending message.');
}

function resendFailed(){
	// Alternatively, the combination of EMAIL, SMS, MEETING could be used.
	// so the params could be but not limited to what are listed below.
	// var params = ['SMS'];
	// var params = ['MEETING'];
	// var params = ['SMS', 'EMAIL'];
	var params = ['EMAIL'];
	resendFailedMessages(params);
}

// Note for type parameter, only "EMAIL" and "SMS" are supported.
function associate(id, recordItems){
	// Mock content.
	// The content can be retrieved via the call to aa.env.getValue('content');
	// Or, any other exposed parameters could be used, from which the association will start.
	// Please notice the form of the string, which are something similiar to [communicationId:<entityId1,entityType1,entityId2,entityType2>]
	// In the "<", ">" any number of entities could be given.
	var content = '['+id+':<'+recordItems+'>]'; 
	var rcmId = /^\s*\[\s*(\d{1,})\s*:/;
	var rEntity = /\s*<(.*)>\s*/g;
	var SEPERATOR_ENTITY = ',';
	var SEPERATOR_ENTITIES = ';';

	// Real execution.
	associateEntities(content);


	//**********************************functions def starts.***************************************
	// Get communication Id.
	function parseCmId(content){	
		var result = rcmId.exec(content);
		if(result && result[1]){
			return result[1];
		}
	}

	// Get Entities.
	function parseEntities(content){
		var result = rEntity.exec(content);
		if(result != null) {
			var matched = result[1];
			if(matched.indexOf(SEPERATOR_ENTITIES)){
				return entities = matched.split(SEPERATOR_ENTITIES);
			}
		}
	}

	// Associate the entities.
	function associateEntities(content){
		var cmId = parseCmId(content);
		aa.print(cmId);
		var entities = parseEntities(content) || [];
		aa.print(entities);
		
		var i = 0;
		var l = entities.length;
		var entityId; 
		var	entityType;
		var	entity;
		var	parts;
		while(i < l){
			entity = entities[i];
			if(entity){
				if(entity.indexOf(SEPERATOR_ENTITY)){
				parts = entity.split(SEPERATOR_ENTITY);
				entityId = parts[0];
				entityType = parts[1];
			}
			associateEnities(cmId, entityId, entityType);
			i++;
			}
		}
	}
}

function listAvailableEnvs(){
	var message = '';
	message = message + 'Title: ' + getTitle() + '\n';
	message = message + 'Content: ' + getContent() + '\n';
	message = message + 'From: ' + getFrom() + '\n';
	message = message + 'To: ' + getTo() + '\n';
	message = message + 'Cc: ' + getCc() + '\n';
	message = message + 'Bcc: ' + getBcc() + '\n';
	message = message + 'Comments: ' + getComments() + '\n';
	message = message + 'Communication Id: ' + getCommunicationId() + '\n';
	
	aa.env.setValue("ScriptReturnCode","0");
	aa.env.setValue("ScriptReturnMessage",message);

}
//#########################################Example of what could be done end.########################################################

// ##########################################Retrieving environment variables start######################################################
function getTitle(){
	return aa.env.getValue('Title');
}
function getContent(){
	return aa.env.getValue('Content');
}
function getCc(){
	return aa.env.getValue('Cc');
}
function getBcc(){
	return aa.env.getValue('Bcc');
}
function getTo(){
	return aa.env.getValue('To');
}
function getFrom(){
	return aa.env.getValue('From');
}
function getComments(){
	return aa.env.getValue('Comments');
}
function getCommunicationId(){
	return aa.env.getValue('CommunicationId');
}
// ############################################Retrieving environment variables end####################################################