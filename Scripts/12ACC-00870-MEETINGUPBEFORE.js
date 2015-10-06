aa.print("--------------Meeting Field---------------");
aa.print("--------------START--------");
var meetings = aa.env.getValue("MeetingModelList");
var events = aa.env.getValue("CalendarEventModelList");
aa.print("--------------MeetingModel-------------");
for(var i = 0; i < meetings.size(); i++)
{
	var meeting = meetings.get(i);
	aa.print(meeting.startDate);
	aa.print(meeting.meetingType);
	aa.print(meeting.meetingName);	
	aa.print(meeting.meetingBody);
	aa.print(meeting.meetingLocation);
	aa.print(meeting.meetingNoticeDate);
	aa.print(meeting.meetingStatus);
	aa.print(meeting.meetingStatusType);
	aa.print(meeting.meetingComment);
	aa.print(meeting.emailNotification);
}
aa.print("--------------CalendarEventModel-------------");
for(var i = 0; i < events.size(); i++)
{
var event = events.get(i);
	aa.print(event.startDate);
	aa.print(event.endDate);
	aa.print(event.eventType);
	aa.print(event.eventName);	
	aa.print(event.hearingBody);
	aa.print(event.eventLocation);
	aa.print(event.eventNoticeDate);
	aa.print(event.eventStatus);
	aa.print(event.eventStatusType);
	aa.print(event.comment);
	aa.print(event.emailNotification);	
}
aa.env.setValue("ScriptReturnCode","0");
aa.env.setValue("ScriptReturnMessage", "successful");