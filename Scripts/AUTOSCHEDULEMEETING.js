//Description:
//This sample script is used to auto create a meeting when update the workflow to a certain status. 
//It is configured in Admin side, we can associate the workflow task and status with a meeting type.
//It means when the workflow task update to the status, it will auto create a meeting with the meeting type.
//Event Name: WorkflowTaskUpdateAfter
//-----------------------------------------------------------------------------------------------------------
//Get the step number
var stepNumber = aa.env.getValue("SD_STP_NUM");
//Get the workflow group
var processCode = aa.env.getValue("PROCESSCODE");
//Get the workflow status
var workflowStatus = aa.env.getValue("WorkflowStatus");
//Get cap ID
var capID1 = aa.env.getValue("PermitId1");
var capID2 = aa.env.getValue("PermitId2");
var capID3 = aa.env.getValue("PermitId3");
var capIDModel = aa.cap.createCapIDScriptModel(capID1, capID2, capID3).getCapID();
var capTypeResult = aa.cap.getCapTypeModelByCapID(capIDModel);
var capType;
if(capTypeResult.getSuccess() || capTypeResult.getOutput() != null)
{
	capType = capTypeResult.getOutput();
}
//Meeting duration(min).
var duration = 30;
//Schedule Reason & Comment.
var reason = "Meeting Reason";
var comment = "Workflow task is approved.";
//This sample script uses the hard code calendar name -- Meeting Calendar
//If there is no need to assign calendar name, we can use null instead.
var calendarName = "Meeting Calendar";
var meetingCalendars = aa.meeting.getMeetingCalendars(calendarName);
if(!meetingCalendars.getSuccess() || meetingCalendars.getOutput() == null  || meetingCalendars.getOutput().length == 0)
{
	aa.print("Cannot find out the meeting calendar.");
}
//If find out the meetings.
else
{
	//Get the available meetings after today(include today's meetings) by workload task and status.
	var currentDate = aa.date.getCurrentDate();
	var result = aa.meeting.getAvailableMeetingsByWorkflow(processCode, stepNumber, workflowStatus, calendarName, currentDate, null, duration, 			capType.toString());
	//If no need to filter unavailable meeting(or no need to validate the meeting duration), there is another function.
	//var result = aa.meeting.getMeetingsByWorkflow(processCode, stepNumber, workflowStatus, calendarName, currentDate, endDate);
	//If cannot find out any meetings.
	if(!result.getSuccess() || result.getOutput() == null  || result.getOutput().size() == 0)
	{
		aa.print("Cannot find out any meetings.");
	}
	//If find out the meetings.
	else
	{
		var meetingList = result.getOutput();
		if(meetingList != null && !meetingList.isEmpty())
		{
			var meetingIterator = meetingList.iterator();
			var meeting;
			//Get the first one.
			if(meetingIterator.hasNext())
			{
				meeting = meetingIterator.next();
			}
			//Schedule the meeting to the record.
			var scheduleResult = aa.meeting.scheduleMeeting(capIDModel, meeting.getMeetingGroupId(), meeting.getMeetingId(), 
				duration, reason, comment);
			if(result.getSuccess())
			{
				//Output the meeting information.
				aa.print("Meeting scheduled successfully.\n");
				aa.print("Meeting Name: " + meeting.getMeetingName() + "\n");
				var dateFormat = "MM/dd/yyyy";
				var timeFormat = "hh:mm aa";
				var meetingDate = aa.util.formatDate(meeting.getStartDate(), dateFormat);
				var startTime = aa.util.formatDate(meeting.getStartDate(), timeFormat);
				var endTime = aa.util.formatDate(meeting.getEndDate(), timeFormat);
				aa.print("Date: " + meetingDate + "\n");
				aa.print("Time: " + startTime + " -- " + endTime);
			}
			else
			{
				//Schedule failed.
				aa.print("Meeting scheduled failed.\n");
			}
		}
	}
}

