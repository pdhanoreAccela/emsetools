/*------------------------------------------------------------------------------------------------------/
| BEGIN Event Specific Variables
/------------------------------------------------------------------------------------------------------*/

// template name
var templateName = "NOTICE OF EXAM SITE CHANGE";
//Mail From
var mailFrom = "ethan.mo@achievo.com";
//Mail CC
var mailCC = "devin.ou@achievo.com";     

/*------------------------------------------------------------------------------------------------------/
| END Event Specific Variables
/------------------------------------------------------------------------------------------------------*/

function main()
{
	var examSiteModel = aa.env.getValue("ExaminationSiteModel");
	var oldExamSiteModel = aa.env.getValue("OldExaminationSiteModel");
	var examList = aa.env.getValue("ExamModelList");
        
	var newAddress = getAddressByExamSiteModel(examSiteModel);
	var oldAddress = getAddressByExamSiteModel(oldExamSiteModel);

        if(examList == null || examList == "")
	{
		return false;
	}

	var it = examList.iterator();

        while(it.hasNext())
	{
		var examModel = it.next();
		var capIDModel = constructCapIDScriptModel(examModel);
		var emailAddress = getCapPrimaryContact(capIDModel);
		var examName = examModel.getExamName();
		var providerName = examModel.getProviderName();

		var examStartTime =  aa.util.formatDate(examModel.getStartTime(),'yyy-MM-dd hh:mm a');
		var examEndTime = aa.util.formatDate(examModel.getEndTime(),'yyy-MM-dd hh:mm a');
		var examDate = aa.util.formatDate(examModel.getStartTime(),'yyy-MM-dd');

		var emailParameters = aa.util.newHashtable();
		addParameter(emailParameters, "$$PrimaryContactName$$", getCapPrimaryContactName(capIDModel));
		addParameter(emailParameters, "$$ExaminationDate$$", examDate);
		addParameter(emailParameters, "$$ExaminationComment$$", examModel.getComments());
		addParameter(emailParameters, "$$DrivingDirections$$", examSiteModel.getDrivingDirections());
		addParameter(emailParameters, "$$AccessibilityDescription$$", examSiteModel.getHandicapAccessible());
		    
		addParameter(emailParameters, "$$oldAddress$$", oldAddress);
		addParameter(emailParameters, "$$ExaminationSite$$", newAddress);

		addParameter(emailParameters, "$$ExaminationName$$", examName);
		addParameter(emailParameters, "$$providerName$$", providerName);

		addParameter(emailParameters, "$$ExaminationStartTime$$", examStartTime);
		addParameter(emailParameters, "$$ExaminationEndTime$$", examEndTime);

		if(emailAddress != "")
		{
			 var isSuccessResult = aa.document.sendEmailAndSaveAsDocument(mailFrom, emailAddress, 
			 mailCC, templateName, emailParameters, capIDModel, null); 
		}
		
	}       
}

function getAddressByExamSiteModel(examSiteModel)
{
	var address = "";
	if(examSiteModel == null || examSiteModel == "")
	{
	   return address;
	}
	if (examSiteModel.getAddress1() != null && examSiteModel.getAddress1() != "")
	{
		address = examSiteModel.getAddress1() + ", ";
	}
	if (examSiteModel.getAddress2() != null && examSiteModel.getAddress2() != "")
	{
		address = address + examSiteModel.getAddress2() + ", ";
	}
	if (examSiteModel.getAddress3() != null && examSiteModel.getAddress3() != "")
	{
		address = address + examSiteModel.getAddress3() + ", ";
	}
	
	if (examSiteModel.getCity() != null && examSiteModel.getCity() !="")
	{
		address = address + examSiteModel.getCity() + ", ";
	}
	if (examSiteModel.getState() != null && examSiteModel.getState() != "")
	{
		address = address + examSiteModel.getState() + ", ";
	}
	if (examSiteModel.getZip() != null && examSiteModel.getZip() != "")
	{
		address = address + examSiteModel.getZip() + ", ";
	}
	return address;
}


//Construct CapIDModel from CapPKModel.
function constructCapIDScriptModel(examModel)
{
	var b1PerId1 = examModel.getB1PerId1().toString();
	var b1PerId2 = examModel.getB1PerId2().toString();
	var b1PerId3 = examModel.getB1PerId3().toString();
	var capIDScriptModel = aa.cap.createCapIDScriptModel(b1PerId1, b1PerId2, b1PerId3);

	return capIDScriptModel;
}

//get contact primary person email address by roster ID.
function getCapPrimaryContact(capIDModel)
{
	var capContactResult = aa.cap.getCapPrimaryContact(capIDModel);
	if (capContactResult.getSuccess())
	{
		var capContact = capContactResult.getOutput();
		if (capContact != null && capContact.getPeople() != null && capContact.getPeople().getEmail())
		{
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

main();