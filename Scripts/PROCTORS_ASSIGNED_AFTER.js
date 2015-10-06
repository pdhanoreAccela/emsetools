/*---- User intial parameters ----*/
var templateName_Assign ="INVITATION TO PROCTOR";
var templateName_Unassign ="NOTICE OF UNASSIGNMENT";
var from ="frederick.zhang@achievo.com";
var cc = "frederick.zhang@achievo.com";
var acaWebServiceSite = "https://qa-server22.achievo.com/";
var dateFormat ="yyyy-MM-dd HH:mm:ss";
/*---- User intial parameters end----*/

/*---- Inital environment parameters ----*/
var removedEvtProctors = aa.env.getValue("removedEvtProctors");
var assignProcotors = aa.env.getValue("createdEvtProctors");
var examName = aa.env.getValue("examinationName");
var providerName = aa.env.getValue("providerName");
var cc;
/*---- Inital environment parameters end----*/

function main()
{
	if(assignProcotors == null && removedEvtProctors == null)
	{
		aa.print("No email sent.");
		return;
	}
	
	
	if(removedEvtProctors != null && removedEvtProctors != "")
	{
		var itc = removedEvtProctors.iterator();
		while(itc.hasNext())
		{
			var proctor =  itc.next();
			if(proctor.getEventID() != null && proctor.getEventID() != "" && proctor.getProctorID() != "" &&  proctor.getProctorID() != null)
			{
				var removedEvtResult = aa.examination.getProviderEventModel(proctor.getEventID());
				var removedPeopleResult = aa.people.getPeople(proctor.getProctorID());
				if(removedEvtResult != null && removedPeopleResult != null)
				{
					var eventModel = removedEvtResult.getOutput();
					var peopleModel = removedPeopleResult.getOutput();
					if(eventModel != null)
					{
						aa.print("startTime: " + aa.util.formatDate(eventModel.getStartTime(),dateFormat));
						aa.print("endTime: " + aa.util.formatDate(eventModel.getEndTime(),dateFormat));
					}
					if(peopleModel != null) 
					{
						aa.print("ProctorName: " + peopleModel.getFullName());
					}
				}
				sendMail(eventModel, peopleModel, templateName_Unassign, getUnassignParams(eventModel , peopleModel));
			}
		}
	
	}	
	
	
	
	
	
	if(assignProcotors != null && assignProcotors != "")
	{
		var itc = assignProcotors.iterator();
		while(itc.hasNext())
		{
			var proctor =  itc.next();
			if(proctor.getEventID() != null && proctor.getEventID() != "" && proctor.getProctorID() != "" &&  proctor.getProctorID() != null)
			{
				var createdEvtResult = aa.examination.getProviderEventModel(proctor.getEventID());
				var createdPeopleResult = aa.people.getPeople(proctor.getProctorID());
				if(createdEvtResult != null && createdPeopleResult != null)
				{
					var eventModel = createdEvtResult.getOutput();
					var peopleModel = createdPeopleResult.getOutput();
					if(eventModel != null)
					{
						aa.print("startTime: " + aa.util.formatDate(eventModel.getStartTime(),dateFormat));
						aa.print("endTime: " + aa.util.formatDate(eventModel.getEndTime(),dateFormat));
					}
					if(peopleModel != null) 
					{
						aa.print("ProctorName: " + peopleModel.getFullName());
					}
				}
				sendMail(eventModel, peopleModel, templateName_Assign, getAssignParams(eventModel , peopleModel, proctor));
			}
		}
	
	}	
	
	
}

function sendMail(eventModel , peopleModel, templateName, templateParams)
{	
	to = peopleModel.getEmail();
	var fileNames = [];
	if(to != "")
	{
		var isSuccess = aa.document.sendEmailByTemplateName(from, to, cc, templateName, templateParams, fileNames);
		if(isSuccess.getSuccess())
		{
			aa.print("Sent email successfully.");
		}
		else
		{
			aa.print("Sent email failed.");
		}
	}
	else
	{
		aa.print("Email address is empty.");
	}
	
}



function getAssignParams(eventModel , peopleModel, proctorModel)
{
	var params = aa.util.newHashtable();
	
	addParameter(params, "$$examName$$", examName);
	addParameter(params, "$$providerName$$",providerName);
	addParameter(params, "$$proctorName$$", getProctorName(peopleModel));
	addParameter(params, "$$startTime$$", aa.util.formatDate(eventModel.getStartTime(),dateFormat));
	addParameter(params, "$$endTime$$", aa.util.formatDate(eventModel.getEndTime(),dateFormat));
	addParameter(params, "$$Accept$$", getURL(proctorModel, 'Y'));
	addParameter(params, "$$Reject$$", getURL(proctorModel, 'N'));
	addParameter(params, "$$examSite$$", getAddressByExamSiteModel(eventModel.getrProviderLocationModel()));
	addParameter(params, "$$serviceProviderCode$$", eventModel.getProviderEventPKModel().getServiceProviderCode());

	return params;
}

function getUnassignParams(eventModel , peopleModel)
{
	var params = aa.util.newHashtable();
	
	addParameter(params, "$$startTime$$", aa.util.formatDate(eventModel.getStartTime(),dateFormat));
	addParameter(params, "$$endTime$$", aa.util.formatDate(eventModel.getEndTime(),dateFormat));
	addParameter(params, "$$ProctorName$$", getProctorName(peopleModel) );
	addParameter(params, "$$examSite$$", getAddressByExamSiteModel(eventModel.getrProviderLocationModel()));
	addParameter(params, "$$examName$$", examName );
	addParameter(params, "$$ProviderName$$", providerName );
	addParameter(params, "$$serviceProviderCode$$", eventModel.getProviderEventPKModel().getServiceProviderCode() );

	return params;
}

function getProctorName(peopleModel)
{
	var name = "";
	if(peopleModel.getFullName() != null)
	{
		name = peopleModel.getFullName();
	}
	else
	{	
		var first = "";
		var middle = "";
		var last = "";
		if(peopleModel.getFirstName()!=null) 
		{
			first = peopleModel.getFirstName();
		}
		if(peopleModel.getMiddleName() != null)
		{
			middle = peopleModel.getMiddleName() ;
		}
		if(peopleModel.getLastName())
		{
			last = peopleModel.getLastName();
		}
		
		name = first + middle + last;
		
	}
	return name;
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

function getURL(proctorModel, isAccept)
{
	var url = acaWebServiceSite + '/Announcement/ProctorEmailResponse.aspx' + '?agencyCode=' + proctorModel.getrProviderEventProctorPKModel().getServiceProviderCode() +'&proctorSeq=' + proctorModel.getrProviderEventProctorPKModel().getResId() + '&isAccept=' + isAccept + '&uuid=' + proctorModel.getEmailUUID();
	
	return url;
}

function getAddressByExamSiteModel(examSiteModel)
{
	var address = "";
	
	if(examSiteModel == null || examSiteModel == "")
	{
	   return address;
	}
	else
	{
		return examSiteModel.getAddress1();
	}
	
}

aa.env.setValue("ScriptReturnCode","0");
aa.env.setValue("ScriptReturnMessage", "successful");
main();