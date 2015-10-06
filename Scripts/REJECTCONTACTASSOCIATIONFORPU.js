var publicUserModel= aa.env.getValue("PublicUserModel");

var mailFrom = "bruin.li@achievo.com";
var mailCC = "martha.liu@achievo.com";
var mailTo = publicUserModel.getEmail();
var email = publicUserModel.getEmail();
var currentDate = aa.util.formatDate(aa.util.now(),"MM/dd/yyyy");

var comments = "rejects the ACA user account association."

if(publicUserModel != null)
{
	var templateName = "SEND_EMAIL_AFTER_REJECT_CONTACT";
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
		addParameter(params, "$$comments$$", comments);
		
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

	var result = aa.people.sendEmailAfterRejectContact(mailFrom, mailTo, mailCC, templateName, params);
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