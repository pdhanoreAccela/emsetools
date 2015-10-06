//Description:
//This sample script is used to send notification to all contacts in records.
//For certain types of records they may need to send out a notification to all contacts on the records 
//for a given meeting notifying that something is happening;
//Event Name: AddAgendaAfter
//-----------------------------------------------------------------------------------------------------------

//For AddAgendaAfter, get cap id by "CapIDList" parameter

var userIDs = aa.env.getValue("UserIDs");
var firstNames = aa.env.getValue("FirstNames");
var middleNames = aa.env.getValue("MiddleNames");
var lastNames = aa.env.getValue("LastNames");
var emails = aa.env.getValue("Emails");
var phoneNumbers = aa.env.getValue("PhoneNumbers");
var taskNames = aa.env.getValue("TaskNames");
var taskComments = aa.env.getValue("TaskComments");
var assignDates = aa.env.getValue("AssignDates");
var dueDates = aa.env.getValue("DueDates");

for (var i=0; i < userIDs.length; i++)
{
	 var userID = userIDs[i];
	 var firstName = firstNames[i];
	 var middleName = middleNames[i];
	 var lastName = lastNames[i];
	 var email = emails[i];
	 var phoneNumber = phoneNumbers[i];
	 var taskName = taskNames[i];
	 var taskComment = taskComments[i];
	 var assignDate = assignDates[i];
	 var dueDate = dueDates[i];
	 
	 //var subjectParameters = aa.util.newHashtable();
	 //subjectParameters.put("$$UserID$$", userID);
	 
	 var contentParameters = aa.util.newHashtable();
	 contentParameters.put("$$UserID$$", userID);
	 contentParameters.put("$$FirstName$$", firstName);
	 contentParameters.put("$$MiddleName$$", middleName);
	 contentParameters.put("$$LastName$$", lastName);
	 contentParameters.put("$$TaskName$$", taskName);
	 contentParameters.put("$$PhoneNumber$$", phoneNumber);
	 contentParameters.put("$$TaskComment$$", taskComment);
	 contentParameters.put("$$AssignDate$$", aa.util.formatDate(assignDate, "MM/dd/yyyy"));
	 contentParameters.put("$$DueDate$$", aa.util.formatDate(dueDate, "MM/dd/yyyy"));
	 var from = "alvin.li@missionsky.com";
	 var to = "feng.xuan@missionsky.com";
	 var cc = "alvin.li@missionsky.com";
	 var templateName = "LEVI_TEST";
	 aa.document.sendEmailByTemplateName(from, to, cc, templateName, contentParameters, null);
	 var subject = "Test Alert";
	 alertMessage(subject, templateName, contentParameters);
	 //sendEmail("demo3@szgroup.com", email, "", null, null, );
}

function alertMessage(subject, templateName, contentParameters)
{
	 var currentUserID = aa.env.getValue('CurrentUserID');
	 var content = aa.util.getCustomContentByType(templateName, contentParameters);
	 aa.alert.createAlertMessage(subject,content,currentUserID);
}

function sendEmail(from, to, cc, subjectTempKey, subjectParameters, contentTempKey, contentParameters)
{
	aa.log("Start to send email using tempalte: " + subjectTempKey + " " + contentTempKey);
	var subject = aa.util.getCustomContentByType(subjectTempKey, subjectParameters);
	var content = aa.util.getCustomContentByType(contentTempKey, contentParameters);
	aa.sendMail(from, to, cc, subject, content);
	aa.log("Send email successful.");
}
