// Enter your script here...
var examTime = aa.env.getValue("ExamTimeLabelValue");
var examSite = aa.env.getValue("ExamSiteLabelValue");
var peopleID = aa.env.getValue("PeopleID");
var scheduleDate = aa.env.getValue("PageScheduleDate");
var from ='vicky.yi@beyondsoft.com';
var templateName ='AA_UNASSIGN_PROCOTRS';
var to ="";
function main()
{
  aa.print(examTime); 
  aa.print(examSite);
  aa.print(peopleID); 
  aa.print(scheduleDate); 
  var people = aa.people.getPeople(peopleID);
  if(people != null && people.getEmail() != null && people.getEmail() != "")
  {
	to = people.getEmail();
	sendMessage();
  }
  
}

function sendMessage()
{
			var emailParameters = aa.util.newHashtable();
			addParameter(emailParameters,"$$ProctorName$$",peopleModel.getFullName() );
			addParameter(emailParameters,"$$ScheduleDate$$",scheduleDate );
			addParameter(emailParameters,"$$ExamTimeLabelValue$$",examTime );
			addParameter(emailParameters,"$$ExamSiteLabelValue$$", examSite);
			aa.document.sendEmailByTemplateName(from, to,"", templateName,emailParameters, null);		
		}
	}
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
aa.env.setValue("ScriptReturnCode","0");
aa.env.setValue("ScriptReturnMessage", "successful");



//var mailFROM="demo11@szgroup.com";
//var mailTO="demo12@szgroup.com";
//var mailCC="demo13@szgroup.com";
//var mailSUBJECT="UnAssign Exam Proctor";
//var mailCONTENT="You have been unassign from this exam proctor list.";

//aa.sendMail(mailFROM,mailTO,mailCC,mailSUBJECT,mailCONTENT);
