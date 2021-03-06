var examModelList = aa.env.getValue("ExaminationModelList");
var from = "ethan.mo@achievo.com";
var cc = "ethan.mo@achievo.com";
var dateFormat = "yyyy-MM-dd";
var timeFormat = "hh:mm:ss a";
var templateName;

if(examModelList != null && examModelList != "")
{
    	var providerNo = null;
    	for(var i=0; i<examModelList.length; i++)
    	{
    		var exam = examModelList[i];
    		providerNo = exam.getProviderNo();
    		var capID = getCapID(exam);
    		var to = getCapPrimaryContactEmail(capID);
    		var templateName = "NOTICE OF FAILED EXAM";
    		var fileNames = [];
    		if(isPass(examModelList[i]))
    		{
    			templateName = "NOTICE OF PASSED EXAMINATION";
    		}
    		if(to != null && to != "")
    		{
    			aa.document.sendEmailAndSaveAsDocument(from, to, cc, templateName, getParams(exam), capID, fileNames);
    		}
    		else
    		{
    			aa.print("No email address found.");
    		}
    	}
    	
    	var licenseResult = aa.licenseScript.getRefLicenseProfByProviderNo(providerNo);
    	if(licenseResult.getSuccess())
    	{
    		var license = licenseResult.getOutput();
    		var to = license.getEMailAddress();
    		var templateName = "NOTICE OF UPDATE SCORE FOR PROVIDER";
    		var capID = aa.cap.createCapIDScriptModel("", "", "");
    		aa.document.sendEmailAndSaveAsDocument(from, to, cc, templateName, getParamForLicenseProf(license), capID, fileNames);
    	}
    	
}

function getParamForLicenseProf(license)
{
	var params = aa.util.newHashtable();
	addParameter(params, "$$PrimaryContactName$$", getLicenseProfName(license));
	addParameter(params, "$$DocumentName$$", getDocumentNames());
	return params;
}

function getDocumentNames()
{
	var documentNames = aa.env.getValue("FileName");
	var documentNameStr = "";
	if(documentNames != "")
	{
		for(var i=0; i<documentNames.length; i++)
		{
			if(documentNames[i] != null && documentNames[i] != "")
			{
				if(documentNameStr != "")
				{
					documentNameStr = documentNameStr + " " + documentNames[i];
				}
				else
				{
					documentNameStr = documentNames[i];
				}
			}
		}
	}
	return documentNameStr;
}

function getLicenseProfName(license)
{
	var name = "";
	if(license.getContactFirstName() != null)
	{
		name += license.getContactFirstName();
	}
	if(license.getContactMiddleName() != null)
	{
		if(name != "")
		{
			name = name + " " + license.getContactMiddleName();
		}
		else
		{
			name = license.getContactMiddleName();
		}
	}
	if(license.getContactLastName() != null)
	{
		if(name != "")
		{
			name = name + " " + license.getContactLastName();
		}
		else
		{
			name = license.getContactLastName();
		}
	}
	return name;
}

function getParams(exam)
{
	var params = aa.util.newHashtable();
	var examName = exam.getExamName();
	var providerName = exam.getProviderName();
	var examDate = formatDate(exam.getExamDate(), dateFormat);
	var startTime = formatDate(exam.getStartTime(), timeFormat);
	var endTime = formatDate(exam.getEndTime(), timeFormat);
	var finalScore = "";
	if("passfail".equalsIgnoreCase(exam.getGradingStyle().trim()))
	{
		if(isPass(exam))
		{
			finalScore = "Pass";
		}
		else
		{
			finalScore = "Fail";
		}
	}
	else if("percentage".equalsIgnoreCase(exam.getGradingStyle().trim()))
	{
		finalScore = exam.getFinalScore() + "%";
	}
	else if(exam.getFinalScore() != null)
	{
		finalScore = exam.getFinalScore();
	}
	
	addParameter(params, "$$PrimaryContactName$$", getCapPrimaryContactName(capID));
	addParameter(params, "$$RecordType$$", getCapType(capID));
	addParameter(params, "$$AlternateID$$", getAltID(capID));
	addParameter(params, "$$ExaminationName$$", examName);
	addParameter(params, "$$ProviderName$$", providerName);
	addParameter(params, "$$ExaminationScore$$", finalScore);
	addParameter(params, "$$PassingScore$$", getPassingScore(exam));
	addParameter(params, "$$ExaminationDate$$", examDate);
	addParameter(params, "$$ExaminationStartTime$$", startTime);
	addParameter(params, "$$ExaminationEndTime$$", endTime);
	addParameter(params, "$$ExaminationComments$$", exam.getComments());
	addParameter(params, "$$ExaminationSite$$", getExamSite(exam));

	return params;
}

function formatDate(date, dateFormat)
{
	var dateStr = "";
	if(date != null)
	{
		dateStr = aa.util.formatDate(date, dateFormat);
	}
	return dateStr;
}

function appendAddress(addressStr, newAddress)
{
	var address = "";
	if(newAddress != null && newAddress != "")
	{
		if(addressStr != null && addressStr != "")
		{
			address = addressStr + ", " + newAddress;
		}
		else
		{
			address = newAddress;
		}
	}
	else
	{
		address = addressStr;
	}
	return address;
}

function getExamSite(exam)
{
	var examSite = aa.examination.getExamSiteByExamModel(exam);
	var site = "";
	if(examSite.getSuccess() && examSite.getOutput() != null)
	{
		var location = examSite.getOutput();
		site = appendAddress(site, location.getAddress1());
		site = appendAddress(site, location.getAddress2());
		site = appendAddress(site, location.getAddress3());
		site = appendAddress(site, location.getCity());
		site = appendAddress(site, location.getState());
	}

	return site;
}

function getCapPrimaryContactEmail(capIDModel)
{
	var capContactResult = aa.cap.getCapPrimaryContact(capIDModel);
	if (capContactResult.getSuccess() && capContactResult.getOutput() != null)
	{
		var capContact = capContactResult.getOutput();
		if (capContact != null && capContact.getPeople() != null && capContact.getPeople().getEmail())
		{
			return capContact.getPeople().getEmail();
		}
	}
	return "";
}

//get contact primary person email address.
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
	if (capContactResult.getSuccess() && capContactResult.getOutput() != null)
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
		}
	}
	return contactName;
}

function getCapType(capIDModel)
{
	var capType = "";
	var capScriptModel = aa.cap.getCap(capIDModel.getCapID());
	if(capScriptModel.getSuccess() && capScriptModel.getOutput() != null && capScriptModel.getOutput().getCapType() != null)
	{
		capType = capScriptModel.getOutput().getCapType().toString();
	}
	return capType;
}

function getAltID(capIDModel)
{
	var altID = "";
	var capScriptModel = aa.cap.getCap(capIDModel.getCapID());
	if(capScriptModel.getSuccess() && capScriptModel.getOutput() != null && capScriptModel.getOutput().getCapModel() != null)
	{
		altID = capScriptModel.getOutput().getCapModel().getAltID();
	}
	return altID;
}
//Judge the user passed this exam or not.
function isPass(examModel)
{
	var gradeingStyle = examModel.getGradingStyle().trim();
	var finalScore = examModel.getFinalScore();
	var passScore = examModel.getPassingScore();
	var result = true;
	if(passScore != null && !"none".equalsIgnoreCase(gradeingStyle) && finalScore < passScore)
	{
		result = false;
	}
	return result;
}

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

//Get the corresponding passing score with grading style.
function getPassingScore(examModel)
{
	var passingScore;
	var passScore = "";
	if(examModel.getPassingScore() != null)
	{
		passScore = examModel.getPassingScore();
	}
	var gradeingStyle = examModel.getGradingStyle().trim();
	if("score".equalsIgnoreCase(gradeingStyle))
	{
		passingScore = passScore;
	}
	else if("percentage".equalsIgnoreCase(gradeingStyle))
	{
		passingScore = passScore + "%";
	}
	else if("passfail".equalsIgnoreCase(gradeingStyle))
	{
		passingScore = "Pass";
	}
	else
	{
		passingScore = "";
	}
	return passingScore;
}

function getCapID(exam)
{
   return aa.cap.createCapIDScriptModel(exam.getB1PerId1(), exam.getB1PerId2(), exam.getB1PerId3());
}

aa.env.setValue("ScriptReturnCode","0");
aa.env.setValue("ScriptReturnMessage","Update scores successful");