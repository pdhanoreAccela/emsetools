var publicUserModel= aa.env.getValue("PublicUserModel");

var mailFrom = "rita.yin@achievo.com";
var mailCC = "tom.liang@achievo.com;austin.wang@achievo.com;rita.yin@achievo.com";
var mailTo = publicUserModel.getEmail();
var email = publicUserModel.getEmail();
var currentDate = aa.util.formatDate(aa.util.now(),"MM/dd/yyyy");

aa.print('mail from: ' + mailFrom);
aa.print('mail cc: ' + mailCC);
aa.print('mail to: ' + mailTo);
aa.print('mail email: ' + email);
aa.print('mail currentData: ' + currentDate);

aa.env.setValue("ScriptReturnCode","0");
aa.env.setValue("ScriptReturnMessage",'');

if(publicUserModel != null)
{
	var templateName = "SEND_EMAIL_AFTER_APPROVE_CONTACT";
	sendNotification(mailTo,templateName);
}


/*
 * get params for resubmit
 */
function getParamsForPublic(publicUserModel)
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
		addParameter(params, "$$currentDate$$", currentDate);
		
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
function sendNotification(mailTo,templateName)
{
	var params = getParamsForPublic(publicUserModel);
     
        aa.print("sending email");
	
	var result = aa.people.sendEmailAfterApproveContact(mailFrom, mailTo, mailCC, templateName, params);
	if(result.getSuccess())
	{
		aa.log("Sent email successfully!");
		return true;
	}
	else
	{
		aa.log("Failed to send mail.");
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
