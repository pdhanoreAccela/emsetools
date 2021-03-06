sendEmailByModel('Title', 'Content');

function getCapID()
{
	var id1 = aa.env.getValue("PermitId1");
	var id2 = aa.env.getValue("PermitId2");
	var id3 = aa.env.getValue("PermitId3");
	var capIDResult = aa.cap.getCapID(id1, id2, id3);
	if(capIDResult.getSuccess())
	{
		return capIDResult.getOutput();
	}
	return null;
}

function getCapContactByCapID(capID)
{
	var contactModelList = aa.people.getCapContactByCapID(capID).getOutput();
	if(contactModelList != null)
	{
		// Define some constants used in params.
                var from = 'FROM', to = 'TO', bcc = 'BCC', cc = 'CC';               
		// Build to contacts.
		// This params is used for building contacts.
		// It is a two dimensional array, with each item being the contanct to be specified.
		// In each contact item, the configuration will be something similar to [contact name string, contact email string, contact type string].
		// Note that in the contact type string only string defined above could be used, which are "FROM", "TO", "BCC" and "CC".
		var params = new Array(contactModelList.length);
		for (var i=0; i<contactModelList.length; i++)
		{
			var name = contactModelList[i].getFirstName() + " " + contactModelList[i].getLastName();
			var email = contactModelList[i].getEmail();
			aa.print(name + ":" + email);
			params[i] = [name, email, to];
		}
		//var params = [['Cindy Qin', 'cindy.qin@achievo.com', to], ['Cindy Qin', 'cindy.qin@achievo.com', from]];
		var contacts = getContactList4Email(params).getOutput();
                                
        return contacts;
	}
	return null;
}

function getContactList4Email(params)
{
         return aa.communication.getContactList(params, 'EMAIL');
}

function sendMessageByMessageModel(messageModel)
{
        return aa.communication.sendMessage(messageModel);
}

function sendEmailByModel(pTitle, pContent)
{
	var messageModel = aa.communication.getEmailMessageScriptModel().getOutput();
	//Set title and content.
	var title = pTitle+'[from script]';
        messageModel.setTitle(title);

        var content = pContent+'[Test about Condition from script].';
        messageModel.setContent(content);
	//get cap ID.
	var capID = getCapID();
	//get contact list. 
	var contacts = getCapContactByCapID(capID);
	if (contacts != null)
	{
		aa.print("contacts != null");
		messageModel.setContacts(contacts);
	}
	//(CommunicationReceivingEmailBefore,CommunicationReceivingEmailAfter,CommunicationSendingEmailBefore,CommunicationSendingEmailAfter);
	messageModel.setTriggerEvent('CommunicationReceivingEmailAfter');

        // Call the api to sent message.
        var result = sendMessageByMessageModel(messageModel);
        aa.print((result.getOutput() != null)?'email sent successfully.': 'email sent failed.');	
}
