var publicUserModel= aa.env.getValue("PublicUserModel");

var mailFrom = "creajoy.xu@beyondsoft.com";
var mailCC = "grady.lu@achievo.com";
var mailTo = "ashley.zou@beyondsoft.com";

if(publicUserModel != null)
{
	var templateName = "SEND_EMAIL_AFTER_CREATE_CONTACT";
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
		addParameter(params, "$$userFullName$$", getUserFullName(publicUserModel));
		
		if(peopleModel != null)
		{
			addParameter(params, "$$contactName$$", peopleModel.getContactName());
			addParameter(params, "$$businessName$$", peopleModel.getBusinessName());
		}
	}
	return params;
}

/*
 * Get full name from PublicUserModel.
 */
function getUserFullName(publicUser) {
    var emptyString = /^\s*$/;
    var result = '';

    if (publicUser != null) {
        result = publicUser.getFullName();

        if (!result || emptyString.test(result)) {
            var firstName = publicUser.getFirstName();
            var middleName = publicUser.getMiddleName();
            var lastName = publicUser.getLastName();

            if (firstName && !emptyString.test(firstName)) {
                result = firstName;
            }

            if (middleName && !emptyString.test(middleName)) {
                if (result && !emptyString.test(result)) {
                    result += ' ';
                }

                result += middleName;
            }

            if (lastName && !emptyString.test(lastName)) {
                if (result && !emptyString.test(result)) {
                    result += ' ';
                }

                result += lastName;
            }
        }
    }

    return result;
}


/*
 * Send notification
 */
function sendNotification(userEmailTo,templateName)
{
	var params = getParamsForPublish(publicUserModel);
	
	var result = aa.people.sendEmailAfterCreateContact(mailFrom, userEmailTo, mailCC, templateName, params);
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
