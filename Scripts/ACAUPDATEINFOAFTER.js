var b1 = aa.env.getValue("PermitId1");
var b2 = aa.env.getValue("PermitId2");
var b3 = aa.env.getValue("PermitId3");

if(b1 != null && b1 != '')
{
   
	// get values from enviroment
	var capId = aa.cap.getCapID(b1,b2,b3).getOutput();
	
	if(capId != null)
	{
	
		var capModel = aa.cap.getCap(capId).getOutput();
		var capDetailModel = aa.cap.getCapDetail(capId).getOutput();

		if(capModel.getCapModel().getCreatedByACA()=='Y' && capModel.getCapModel().getCapClass()=='EDITABLE')
		{
			aa.cap.sendMailForUpdateRecord(capId,"Received Update on Record Notification");
		}
			// create a new activity model
			var activityModel = aa.activity.getNewActivityModel().getOutput();
			activityModel.setCapID(capId);   
			activityModel.setServiceProviderCode(capId.getServiceProviderCode());   
			activityModel.setInternalOnly("Y"); // must have a value: Y/N
			activityModel.setActivityName("activity about update record");  
			activityModel.setActivityDescription("create a activity for updating record");
			
			activityModel.setAuditID("ADMIN");
			activityModel.setPriority("Normal");  // Normal, Low, High
			var actDate = aa.date.parseDate("2015-03-16");  // task start date, yyyy-MM-dd or MM/dd/yyyy	
			activityModel.setActDate(transToJavaUtilDate(actDate));   // must set a value	
			activityModel.setActivityType("activity about update record");


			// create V360 activity data
		if(capModel.getCapModel().getCreatedByACA()=='Y' && capModel.getCapModel().getCapClass()=='EDITABLE')
		{
			aa.activity.createActivity(activityModel);
		}
	}
}


/**
* convert to java Date
*/
function transToJavaUtilDate(scriptDateTime)
{
	return aa.date.transToJavaUtilDate(scriptDateTime.getEpochMilliseconds());
}