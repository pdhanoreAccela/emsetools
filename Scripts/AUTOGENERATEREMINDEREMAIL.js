/*------------------------------------------------------------------------------------------------------/
| BEGIN Event Specific Variables
/------------------------------------------------------------------------------------------------------*/
var eventIDValue = aa.env.getValue("Exam_Session_ID");//eventID
var emailTemplateName = aa.env.getValue("Notification_Template");//templateType

var mailFrom = "Auto_Sender@Accela.com";
//Mail CC
var mailCC = "ethan.mo@achievo.com";     
var examName;
var providerName;

/*------------------------------------------------------------------------------------------------------/
| END Event Specific Variables
/------------------------------------------------------------------------------------------------------*/

function main()
{
	if(eventIDValue == "" || emailTemplateName == "")
	{
		return false;
	}

	var eventID = aa.util.parseLong(eventIDValue);
	var rosterModelResult = aa.examination.getRosterModelListByEventID(eventID);

	// get Exam Name and Provider Name
	setExamNameAndProviderName(eventID);

	var successEmailNum = 0;
	var failEmailNum = 0;
	var EmailAddressEmtpyNum = 0;
	if(rosterModelResult.getSuccess())
	{
	  var rosterModelList = rosterModelResult.getOutput();
	  var it = rosterModelList.iterator();
	  while(it.hasNext())
	  {
			var rosterModel = it.next();
			
			var rosterID = rosterModel.getProviderRosterPKModel().getRosterNbr();
			var capPKModel = rosterModel.getCapPK();
			serviceProviderCode = capPKModel.getServProvCode();
			var b1PerId1 = capPKModel.getB1PerId1();
			var b1PerId2 = capPKModel.getB1PerId2();
			var b1PerId3 = capPKModel.getB1PerId3();
			var altID = rosterModel.getAltID();
			var capIDModel = aa.cap.createCapIDScriptModel(b1PerId1, b1PerId2, b1PerId3);
			
			var eventModel = rosterModel.getProviderEventModel();
			var examDate = aa.util.formatDate(eventModel.getStartTime(),'dd\MM\yyyy');
			var examStartTime = aa.util.formatDate(eventModel.getStartTime(),'hh:mm aa');
			var examEndTime = aa.util.formatDate(eventModel.getEndTime(),'hh:mm aa');
			var address = eventModel.getrProviderLocationModel().getAddress1();
			//aa.print("Exam address:" + address +"\n");
			
			var emailParameters = aa.util.newHashtable();
		  
			addParameter(emailParameters, "$$PrimaryContactName$$", getCapPrimaryContactName(capIDModel));
			addParameter(emailParameters, "$$ExaminationName$$", examName);
			addParameter(emailParameters, "$$ExaminationDate$$", examDate);
			addParameter(emailParameters, "$$ExaminationStartTime$$", examStartTime);
			addParameter(emailParameters, "$$ExaminationEndTime$$", examEndTime);
			addParameter(emailParameters, "$$ExaminationSite$$", address);
			var examModelResult = aa.examination.getExaminationModelByRosterID(rosterID);
			if(examModelResult.getSuccess() && examModelResult.getOutput() != null)
			{
				var examModel = examModelResult.getOutput();
				addParameter(emailParameters, "$$ExaminationComment$$", examModel.getComments());
				var examSiteModel = aa.examination.getExamSiteByExamSeq(examModel.getExaminationPKModel().getExamNbr());
				if(examSiteModel.getSuccess() && examSiteModel.getOutput() != null)
				{
					addParameter(emailParameters, "$$DrivingDirections$$", examSiteModel.getOutput().getDrivingDirections());
					addParameter(emailParameters, "$$AccessibilityDescription$$", examSiteModel.getOutput().getHandicapAccessible());
				}
				else
				{
					addParameter(emailParameters, "$$DrivingDirections$$", "");
					addParameter(emailParameters, "$$AccessibilityDescription$$", "");
				}
			}
			else
			{
				addParameter(emailParameters, "$$ExaminationComment$$", "");
				addParameter(emailParameters, "$$DrivingDirections$$", "");
				addParameter(emailParameters, "$$AccessibilityDescription$$", "");
			}
			
			var email = getEmailbyRosterID(capIDModel);
			
			if(email != "")
			{
			   var isSuccess = sendEmail(mailFrom, email, mailCC, emailTemplateName, emailParameters); 
			   if(isSuccess == true)
			   {
				  successEmailNum++;
			   }
			   else
			   {
				  failEmailNum++;
			   }
			}
			else
			{
			   aa.log("Send email address empty!");
			   EmailAddressEmtpyNum++;
			}  
	  }
	   aa.log("Send E-mail successful" + successEmailNum +" "
			  +"Send E-mail fail" + failEmailNum +", "
			  +"Send E-mail address empty " + EmailAddressEmtpyNum);
	}
}

//
function getEmailbyRosterID(capIDModel)
{
	var capContactResult = aa.cap.getCapPrimaryContact(capIDModel);
	if (capContactResult.getSuccess && capContactResult.getOutput() != null)
	{
		var capContact = capContactResult.getOutput();
		if (capContact != null && capContact.getPeople() != null && capContact.getPeople().getEmail())
		{
			//aa.print(capContact.getPeople().getEmail());
                        return capContact.getPeople().getEmail();
		}
	}
        return "";
}

function getCapPrimaryContactName(capIDModel)
{
	var capContactResult = aa.cap.getCapPrimaryContact(capIDModel);
	var contactName = "";
	if (capContactResult.getSuccess())
	{
		var capContact = capContactResult.getOutput();
		if (capContact != null)
		{
			if(capContact.getFirstName() != null)
			{
				contactName += capContact.getFirstName() + " ";		
			}
			if(capContact.getMiddleName() != null)
			{
				contactName += capContact.getMiddleName() + " ";
			}
			if(capContact.getLastName() != null)
			{
				contactName += capContact.getLastName();
			}
			return contactName;			
		}
	}
  return "";
}

  
//Add value to map.
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
  
function sendEmail(from, to, cc, emailTemplateName, emailParameters)
{
	var subject = aa.util.getCustomDescAsSubjectByType(emailTemplateName, emailParameters);
	var content = aa.util.getCustomContentByType(emailTemplateName, emailParameters);
	result = aa.sendMail(from, to, cc, subject, content);
	if(result.getSuccess())
	{
		aa.log("Send email "+to+" successfully!");
		return true;
	}
	else
	{
		aa.log("Fail to send mail.");
		return false;
	}
}

function setExamNameAndProviderName(eventID)
{
	var examMapResult = aa.examination.getExamNameAndProviderName(eventID);
	if(examMapResult.getSuccess() && examMapResult.getOutput() != null)
	{
	   var examMap = examMapResult.getOutput();
	   examName = examMap.get("examName");
	   providerName = examMap.get("providerName");
	}
}

main();