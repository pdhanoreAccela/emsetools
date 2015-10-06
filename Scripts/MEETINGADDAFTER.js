aa.print("--------------Meeting Field---------------");
aa.print("-------------------START--------");
var meetings = aa.env.getValue("MeetingModelList");
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
aa.print(meeting.template.size);

}