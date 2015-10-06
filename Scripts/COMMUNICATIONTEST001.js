// sending message starts.+++++++++++++++++++++++++++++++++++++++++++++++++++++++
var messageModel = aa.communication.getEmailMessageScriptModel().getOutput();

// Set title and content.
var title = aa.env.getValue('Title')+'[from script]';
messageModel.setTitle(title);

var content = aa.env.getValue('Content')+'[from script].';
messageModel.setContent(content);

var contacts = formContacts();
messageModel.setContacts(contacts);

// Call the api to sent message.
var result = aa.communication.sendMessageByMessageModel(messageModel);
aa.print((result.getOutput() != null)?'email sent successfully.': 'email sent failed.');

// Send message ends.+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

// Predefined functions.
// log meesage.
function logMessage(msg)
{
	aa.print("MESSAGE: " + msg);
}

// Log error.
function logError(errorMsg)
{
	aa.print("ERROR: " + errorMsg);
}

// form contacts.
function formContacts()
{
	// Define some constants used in params.
	var from = 'FROM',
		to = 'TO',
		bcc = 'BCC',
		cc = 'CC';
	
	// Build to contacts.
	var params = [
					['Tom Liang', 'tom.liang@achievo.com', to], 
					['Bruin li', 'bruin.li@achievo.com', to], 
					['Austin wang', 'austin.wang@achievo.com', to],
					['Bruin Li', 'bruin.li@achievo.com', from]
				];
	var contacts = aa.communication.getContactList(params).getOutput();
	
	return contacts;
}
