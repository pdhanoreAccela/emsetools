//Description:
//This sample script is used to send the document to all meeting attendees after uploading meeting attachment successfully.
//Event Name: DocumentUploadAfter
//-----------------------------------------------------------------------------------------------------------
var docList = aa.env.getValue("DocumentModelList");
if (aa.env.getValue("calendarID") != "" && aa.env.getValue("meetingID") != "")
{
	  var calendarID = parseInt(aa.env.getValue("calendarID"));
    var meetingID = parseInt(aa.env.getValue("meetingID"));
    
    aa.print("CalendarID:" + calendarID);
    aa.print("MeetingID:" + meetingID);
    
    var result = sendEmailForMeeting(calendarID, meetingID, "Test Email", "Hello World",  docList);
    
    if (result && result.getSuccess())
    {
    	aa.print("Successful");
    	aa.env.setValue("ScriptReturnMessage", "Send Email document successful");
    	aa.env.setValue("ScriptReturnCode", "0");
    }
    else
    {
    	aa.print("Failed");
    	aa.env.setValue("ScriptReturnMessage", "Send Email document failed");
    	aa.env.setValue("ScriptReturnCode", "-1");
    }
}

function sendEmailForMeeting(calendarID, meetingID, emailSubject, emailContent,  docList)
{
	var resultAttendees = aa.meeting.getMeetingAttendees(calendarID, meetingID);
  var attendeeList = resultAttendees.getOutput();
  if (attendeeList && attendeeList.size() > 0)
  {
	   aa.print("Follow attendee will recieve email");
	   var objList = attendeeList.toArray();
	   var to = new Array();
     for (var i = 0; i < attendeeList.size(); i++)
     {
     	  var attendee = attendeeList.get(i);
     	  to.push(attendee.getEmail());
     	  aa.print(attendee.getName() + ":" + attendee.getEmail());
     }
     var result = aa.meeting.sendEmail(emailSubject, emailContent, "", to, "", docList);
     return result;
  }
  return null;
}