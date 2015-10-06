associate();
aa.env.setValue("ScriptReturnCode","0");
aa.env.setValue("ScriptReturnMessage",'The output below:');

function parseCmIdFromContent(content)
{
	var rcmId = /[\w\d]{5}-\d{8}/;
	var result = rcmId.exec(content);
	if(result){
		return result;
	}
	aa.print('No record id has been parsed from content.');
}

// log meesage.
function logMessage(msg){
	aa.print("MESSAGE: " + msg);
}

// Log error.
function logError(errorMsg){
	aa.print("ERROR: " + errorMsg);
}

function associate(){
	var messages = aa.env.getValue('EmailMessageList');	
	if(messages){
		var i = 0;  var len = messages.length; 
		while(i < len){
			var message = messages[i];
			var content = message.getContent();
			var cmId = message.getCmId();
			var altId = parseCmIdFromContent(content);
			aa.communication.associateEnities(cmId, altId, 'RECORD');
			i++;
			
			logMessage('content: ' + content);
			logMessage('cmId: ' + cmId);
			logMessage('CapId: ' +altId);
			
		}
	}
}

