var publicUserModel= aa.env.getValue("PublicUserModel");
var isFromACA= aa.env.getValue("isFromACA");

var mailFrom = "";
var mailCC = "rita.yin@achievo.com";
var mailTo = "austin.wang@achievo.com";

if(publicUserModel != null)
{
	var templateName = "SEND_EMAIL_AFTER_APPROVE_CONTACT";
	sendNotification(mailTo,templateName);
}


/*
 * get params for resubmit
 */
function getParamsForPublish(publicUserModel)
{
	var params = aa.util.newHashtable();
	if(publicUserModel != null)
	{
		var peopleList = publicUserModel.getPeoples();
		var peopleModel = null;
		
		if(peopleList != null || peopleList.length > 0)
		{
			var it = peopleList.iterator();
     	                while(it.hasNext())
     	                {
				peopleModel = it.next();
				break;
			}
		}
		
		addParameter(params, "$$userID$$", publicUserModel.getUserID());
		
		if(peopleModel != null)
		{
			addParameter(params, "$$contactName$$", peopleModel.getContactName());
			addParameter(params, "$$businessName$$", peopleModel.getBusinessName());
		}
	}
	return params;
}

/*
 * Send notification
 */
function sendNotification(userEmailTo,templateName)
{	
	var result = aa.people.sendEmailAfterCreateContact(mailFrom, userEmailTo, mailCC, templateName, null);
	if(result.getSuccess())
	{
		aa.log("Send email successfully!");
		return true;
	}
	else
	{
		aa.log("Fail to send mail.");
		return false;
	}
}

/*
 * add parameter
 */
function addParameter(pamaremeters, key, value)
{
	if(key != null)
	{
		if(value == null)
		{
			value = "";
		}
		pamaremeters.put(key, value);
	}
}
