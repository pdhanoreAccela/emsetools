var startTime = aa.env.getValue("startTime");
var endTime = aa.env.getValue("endTime");
var examSite = aa.env.getValue("ExamSiteLabelValue");
var peopleID = aa.env.getValue("PeopleID");
var scheduleDate = aa.env.getValue("PageScheduleDate");
var examName = aa.env.getValue("examinationName");
var providerName =aa.env.getValue("providerName");
var proctorName = "";
/*---- User intial parameters ----*/
var templateName ="AA_UNASSIGN_PROCTOR";
var from ="frederick.zhang@achievo.com";
var cc = "";
var acaWebServiceSite = "http://10.50.70.90:3080";
var aaWebSite = "https://frederick-zhang.achievo.com:5443";
/*---- User intial parameters end----*/

function sendMail()
{
	var peopleReturn = aa.people.getPeople(peopleID);
	var to = "";
	var fileNames = [];
	if(peopleReturn != null)
	{
		var people = peopleReturn.getOutput();
		to = people.getEmail();
		proctorName = people.getFullName();
		if(to != "")
		{
			var isSuccess = aa.document.sendEmailByTemplateName(from, to, cc, templateName, getParams(), fileNames);
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
}

function getParams()
{
	var params = aa.util.newHashtable();
	addParameter(params, "$$ProctorName$$",proctorName );
	addParameter(params, "$$startTime$$",startTime );
	addParameter(params, "$$endTime$$",endTime );
	addParameter(params, "$$Location$$", examSite);
	addParameter(params, "$$ExaminationName$$",examName );
	addParameter(params, "$$ProviderName$$",providerName );
	return params;
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


function main()
{
	 sendMail();	
}

aa.env.setValue("ScriptReturnCode","0");
aa.env.setValue("ScriptReturnMessage", "successful");
main();