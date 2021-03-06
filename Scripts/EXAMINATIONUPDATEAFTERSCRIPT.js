var examModelList = aa.env.getValue("ExaminationModelList");
var isSuccess = aa.env.getValue("isExamUpdatedSuccessfully");
var action = aa.env.getValue("Action");
var capID = getCapID();
var from = "ethan.mo@achievo.com";
var to = getCapPrimaryContactEmail(capID);
var cc = "lucher.hu@missionsky.com";
var templateName;
var capIDString = getCapIDString();
var dateFormat = "yyyy-MM-dd";
var timeFormat = "hh:mm:ss a";
var acaWebServiceSite = "http://aa-demo.achievo.com/710/DEMO";


if(to != null)
{
	var fileNames = [];
	if("update" == action && examModelList != null)
	{
		for(var i=0; i<examModelList.size(); i++)
		{
			if(isPass(examModelList.get(i)))
			{
				templateName = "NOTICE OF PASSED EXAMINATION";
			}
			else
			{
				templateName = "NOTICE OF FAILED EXAM";
			}
			aa.document.sendEmailAndSaveAsDocument(from, to, cc, templateName, getParamsForUpdate(examModelList.get(i)), capID, fileNames);
		}
	}
	else if(isSuccess && "schedule" == action)
	{
		templateName = "NOTICE OF EXAM SCHEDULED";
		aa.document.sendEmailAndSaveAsDocument(from, to, cc, templateName, getParamsForSchedule(), capID, fileNames);
	}
	else if(isSuccess && "reschedule" == action)
	{
		templateName = "NOTICE OF EXAM RESCHEDULED";
		aa.document.sendEmailAndSaveAsDocument(from, to, cc, templateName, getParamsForReschedule(), capID, fileNames);
	}
	else if(isSuccess && "unschedule" == action)
	{
		templateName = "NOTICE OF EXAM CANCELLED";
		aa.document.sendEmailAndSaveAsDocument(from, to, cc, templateName, getParamsForUnschedule(), capID, fileNames);
	}
	else
	{
		aa.print("No email sent.");
	}
}

function getCapIDString()
{
	if(capID != null)
	{
		return capID.getCapID().toString();
	}
	else
	{
		return "";
	}
}

function getParamsForUnschedule()
{
	var params = aa.util.newHashtable();
	var exam = aa.env.getValue("OriginalExamModel");
	if(exam == null)
	{
		return params;
	}
	var examDate = formatDate(exam.getExamDate(), dateFormat);
	var startTime = formatDate(exam.getStartTime(), timeFormat);
	var endTime = formatDate(exam.getEndTime(), timeFormat);
	addParameter(params, "$$PrimaryContactName$$", getCapPrimaryContactName(capID));
	addParameter(params, "$$ExaminationName$$", exam.getExamName());
	addParameter(params, "$$ExaminationProvider$$", exam.getProviderName());
	addParameter(params, "$$ProviderName$$", exam.getProviderName());
	addParameter(params, "$$ExaminationDate$$", examDate);
	addParameter(params, "$$ExaminationStartTime$$", startTime);
	addParameter(params, "$$ExaminationEndTime$$", endTime);
	addParameter(params, "$$ExaminationSite$$", getExamSite(exam));
	addParameter(params, "$$RecordType$$", getCapType(capID));
	addParameter(params, "$$AlternateID$$", getAltID(capID));
	addParameter(params, "$$ExaminationComments$$", exam.getComments());
	addParameter(params, "$$Url$$", getACAUrl());
	return params;
}

function getParamsForReschedule()
{
	var oldExam = aa.env.getValue("OriginalExamModel");
	var params = aa.util.newHashtable();
	if(oldExam == null)
	{
		return params;
	}
	var oldExamName = oldExam.getExamName();
	var oldProviderName = oldExam.getProviderName();
	var oldExamDate = formatDate(oldExam.getExamDate(), dateFormat);
	var oldStartTime = formatDate(oldExam.getStartTime(), timeFormat);
	var oldEndTime = formatDate(oldExam.getEndTime(), timeFormat);
	var oldExamSiteModel = aa.examination.getExamSiteByExamModel(oldExam);
	addParameter(params, "$$PrimaryContactName$$", getCapPrimaryContactName(capID));
	addParameter(params, "$$RecordType$$", getCapType(capID));
	addParameter(params, "$$AlternateID$$", getAltID(capID));
	addParameter(params, "$$Url$$", getACAUrl());
	
	addParameter(params, "$$OldExaminationName$$", oldExamName);
	addParameter(params, "$$OldProviderName$$", oldProviderName);
	addParameter(params, "$$OldExaminationDate$$", oldExamDate);
	addParameter(params, "$$OldExaminationStartTime$$", oldStartTime);
	addParameter(params, "$$OldExaminationEndTime$$", oldEndTime);
	addParameter(params, "$$OldExaminationComments$$", oldExam.getComments());
	addParameter(params, "$$OldExaminationSite$$", getExamSite(oldExam));
	if(oldExamSiteModel.getSuccess() && oldExamSiteModel.getOutput() != null)
	{
		addParameter(params, "$$OldDrivingDirections$$", oldExamSiteModel.getOutput().getDrivingDirections());
		addParameter(params, "$$OldAccessibilityDescription$$", oldExamSiteModel.getOutput().getHandicapAccessible());
	}
	else
	{
		addParameter(params, "$$OldDrivingDirections$$", "");
		addParameter(params, "$$OldAccessibilityDescription$$", "");
	}
	
	var newExam = aa.env.getValue("ExaminationModel");
	if(newExam == null)
	{
		return params;
	}
	var newExamName = newExam.getExamName();
	var newProviderName = newExam.getProviderName();
	var newExamDate = formatDate(newExam.getExamDate(), dateFormat);
	var newStartTime = formatDate(newExam.getStartTime(), timeFormat);
	var newEndTime = formatDate(newExam.getEndTime(), timeFormat);
	var newExamSiteModel = aa.examination.getExamSiteByExamModel(newExam);
	addParameter(params, "$$ExaminationName$$", newExamName);
	addParameter(params, "$$ProviderName$$", newProviderName);
	addParameter(params, "$$ExaminationDate$$", newExamDate);
	addParameter(params, "$$ExaminationStartTime$$", newStartTime);
	addParameter(params, "$$ExaminationEndTime$$", newEndTime);
	addParameter(params, "$$ExaminationComments$$", newExam.getComments());
	if(newExamSiteModel.getSuccess() && newExamSiteModel.getOutput()!= null)
	{
		addParameter(params, "$$DrivingDirections$$", newExamSiteModel.getOutput().getDrivingDirections());
		addParameter(params, "$$AccessibilityDescription$$", newExamSiteModel.getOutput().getHandicapAccessible());
	}
	else
	{
		addParameter(params, "$$DrivingDirections$$", "");
		addParameter(params, "$$AccessibilityDescription$$", "");
	}
	addParameter(params, "$$ExaminationSite$$", getExamSite(newExam));
	return params;
}

function getParamsForSchedule()
{
	var params = aa.util.newHashtable();
	var exam = aa.env.getValue("ExaminationModel");
	if(exam == null || exam == "")
	{
		return params;
	}
	var examDate = formatDate(exam.getExamDate(), dateFormat);
	var startTime = formatDate(exam.getStartTime(), timeFormat);
	var endTime = formatDate(exam.getEndTime(), timeFormat);
	var examSiteModel = aa.examination.getExamSiteByExamModel(exam);
	addParameter(params, "$$PrimaryContactName$$", getCapPrimaryContactName(capID));
	addParameter(params, "$$RecordType$$", getCapType(capID));
	addParameter(params, "$$AlternateID$$", getAltID(capID));
	addParameter(params, "$$ExaminationName$$", exam.getExamName());
	addParameter(params, "$$ProviderName$$", exam.getProviderName());
	addParameter(params, "$$ExaminationDate$$", examDate);
	addParameter(params, "$$ExaminationStartTime$$", startTime);
	addParameter(params, "$$ExaminationEndTime$$", endTime);
	addParameter(params, "$$ExaminationComments$$", exam.getComments());
	addParameter(params, "$$Url$$", getACAUrl());
	
	if(examSiteModel.getSuccess() && examSiteModel.getOutput() != null)
	{
		addParameter(params, "$$DrivingDirections$$", examSiteModel.getOutput().getDrivingDirections());
		addParameter(params, "$$AccessibilityDescription$$", examSiteModel.getOutput().getHandicapAccessible());
	}
	else
	{
		addParameter(params, "$$DrivingDirections$$", "");
		addParameter(params, "$$AccessibilityDescription$$", "");
	}
	if(exam.getExaminationPKModel() != null)
	{
		addParameter(params, "$$ExaminationSite$$", getExamSite(exam));
	}
	else
	{
		addParameter(params, "$$ExaminationSite$$", "");
	}
	return params;
}

function getParamsForUpdate(exam)
{
	var params = aa.util.newHashtable();
	var examName = exam.getExamName();
	var providerName = exam.getProviderName();
	var examDate = "";
	var startTime = "";
	var endTime = "";
	var finalScore;
	if(exam.getExamDate() != null)
	{
		examDate = formatDate(exam.getExamDate(), dateFormat);
		startTime = formatDate(exam.getStartTime(), timeFormat);
		endTime = formatDate(exam.getEndTime(), timeFormat);
	}
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
	else
	{
		finalScore = exam.getFinalScore();
	}
	
	addParameter(params, "$$PrimaryContactName$$", getCapPrimaryContactName(capID));
	addParameter(params, "$$RecordType$$", getCapType(capID));
	addParameter(params, "$$AlternateID$$", getAltID(capID));
	addParameter(params, "$$Url$$", getACAUrl());
	addParameter(params, "$$ExaminationName$$", examName);
	addParameter(params, "$$ProviderName$$", providerName);
	addParameter(params, "$$ExaminationScore$$", finalScore);
	addParameter(params, "$$PassingScore$$", getPassingScore(exam));
	addParameter(params, "$$ExaminationDate$$", examDate);
	addParameter(params, "$$ExaminationStartTime$$", startTime);
	addParameter(params, "$$ExaminationEndTime$$", endTime);
	addParameter(params, "$$ExaminationSite$$", getExamSite(exam));
	addParameter(params, "$$ExaminationComments$$", exam.getComments());

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
		site = appendAddress(site, location.getZip());
	}

	return site;
}

function getCapPrimaryContactEmail(capIDModel)
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
		}
	}
  return contactName;
}

function getACAUrl()
{
	var acaUrl = "";
	var id1 = aa.env.getValue("PermitId1");
  var id2 = aa.env.getValue("PermitId2");
  var id3 = aa.env.getValue("PermitId3");
  var capResult = aa.cap.getCap(id1, id2, id3);
  if(!capResult.getSuccess())
  {
  	return acaUrl;
  }
  var cap = capResult.getOutput().getCapModel();
	acaUrl = acaWebServiceSite + "/urlrouting.ashx?type=1000";	
	acaUrl += "&Module=" + cap.getModuleName();
	acaUrl += "&capID1=" + id1 + "&capID2=" + id2 + "&capID3=" + id3;
	acaUrl += "&agencyCode=" + aa.getServiceProviderCode();
	return acaUrl;
}

function getCapType(capIDModel)
{
	var capType = "";
	var capScriptModel = aa.cap.getCap(capIDModel.getCapID());
	if(capScriptModel.getSuccess() && capScriptModel.getOutput() != null)
	{
		capType = capScriptModel.getOutput().getCapType().toString();
	}
	return capType;
}

function getAltID(capIDModel)
{
	var altID = "";
	var capScriptModel = aa.cap.getCap(capIDModel.getCapID());
	if(capScriptModel.getSuccess() && capScriptModel.getOutput() != null)
	{
		altID = capScriptModel.getOutput().getCapModel().getAltID();
	}
	return altID;
}

function isPass(examModel)
{
	var gradeingStyle = examModel.getGradingStyle().trim();
	var finalScore = examModel.getFinalScore();
	var passScore = examModel.getPassingScore();
	var result = true;
	if(!"none".equalsIgnoreCase(gradeingStyle) && finalScore < passScore)
	{
		result = false;
	}
	return result;
}

function getPassingScore(examModel)
{
	var passingScore;
	var passScore = examModel.getPassingScore();
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

function getCapID()
{
    var id1 = aa.env.getValue("PermitId1");
    var id2 = aa.env.getValue("PermitId2");
    var id3 = aa.env.getValue("PermitId3");
    return aa.cap.createCapIDScriptModel(id1, id2, id3);
}

aa.env.setValue("ScriptReturnCode","0");
aa.env.setValue("ScriptReturnMessage","Examination available.");
