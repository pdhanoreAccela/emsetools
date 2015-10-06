var meetingID= aa.env.getValue("MeetingID");
var meetingGroupID= aa.env.getValue("MeetingGroupID");
var meetingType= aa.env.getValue("MeetingType");
var capIDList= aa.env.getValue("CapIDList");
var message = '';
var meetingAttendees = aa.util.newArrayList();
//Get record attendee.
if(capIDList != null && capIDList.size() >0)
{
	for (var i=0; i < capIDList.size(); i++)
	{
		var capIDModel = convertModel(capIDList.get(i));   // must convert model
		var contactResult = aa.people.getCapContactByCapID(capIDModel);
		var contacts = contactResult.getOutput();
		if(contacts != null && contacts.length > 0)
		{
			message = message+contacts.length;
			for (var j=0; j < contacts.length; j++)
			{
				var contact = contacts[j].getCapContactModel();
				var contactSeqNumber = contact.getRefContactNumber();
				var email = contact.getEmail();
				var name=getContactName(contact);
				var attendee = aa.meeting.createMeetingAttendeeModel(meetingID, meetingGroupID, capIDModel, contactSeqNumber, name, email);
				meetingAttendees.add(attendee.getOutput());
			}
		}
	}
}
//Get notification model.
var notificationModel = aa.meeting.getMeetingNotificationModel(meetingID, meetingGroupID, meetingType, null);

//Send notification.
var notificationRsult = aa.meeting.sendNotification(notificationModel.getOutput(), meetingAttendees, 'New Meeting');

aa.env.setValue("ScriptReturnMessage",notificationRsult.getOutput()+'test');

function convertModel(capIDModel)
{
	return aa.cap.createCapIDScriptModel(capIDModel.getID1(),capIDModel.getID2(),capIDModel.getID3()).getCapID();
}

function getContactName(contactModel)
{
	var name = '';
	var sb = '';
	var pm = contactModel.getPeople();
	if ('Organization'.equals(contactModel.getContactTypeFlag()))
	{
		name = contactModel.getBusinessName();
	}
	else
	{
		name = pm.getFirstName();
		if (name != null)
		{
			sb = sb+name+' ';
		}
		name = pm.getMiddleName();
		if (name != null)
		{
			sb = sb+name+' ';
		}
		name = pm.getLastName();
		if (name != null)
		{
			sb = sb+name+' ';
		}
		name = sb;
	}
	aa.print(name);
	return name;
}