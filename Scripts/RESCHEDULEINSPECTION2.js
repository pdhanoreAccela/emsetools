//reschedule inspection//reschedule(CapIDModel capId, long inspectionId, SysUserModel inspector, ScriptDateTime scheduledDate, // 				String scheduledTime,String requestComment)//--------------------------------------------------------------------------------------------------------------------aa.print("ReSchedule Inspection start.");aa.print("Schedule Inspection start.");var capId1="09CAP";var capId2="00000";var capId3="002BW";var inspTypeNumber=84003066;  //Inspection Type sequence numbervar sequenceNumber=123896420; //schedule sequence numbervar scheduleDateStr="12/20/2009"; //format: "MM/dd/yyyy"var comment="reschedule by emse";var scheduledDate = aa.date.transToJavaUtilDate(new Date(scheduleDateStr));var scriptScheduledDate = aa.date.getScriptDateTime(scheduledDate);// construct cap id modelresult=aa.cap.getCapID(capId1, capId2, capId3);if(result.getSuccess()){    aa.print("Get getCapID sucessfully.");    capIDModel= aa.cap.getCapID(capId1, capId2, capId3).getOutput();}else{		aa.print("Get getCapID fail.");}// reschedule the inspection//reschedule(CapIDModel capId, long inspectionId, SysUserModel inspector, ScriptDateTime scheduledDate, //						String scheduledTime,String requestComment)result = aa.inspection.reschedule(capIDModel, sequenceNumber, null, scriptScheduledDate, "", comment);if(result.getSuccess()){     aa.print("ReSchedule inspection sucessfully."); }else{   aa.print("ReSchedule inspection sucessfully.");   aa.print(result.getErrorMessage());}   aa.print("ReSchedule Inspection end.");