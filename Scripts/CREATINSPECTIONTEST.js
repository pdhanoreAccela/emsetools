aa.print("Schedule Inspection start."); 
var capId1="14CAP"; 
var capId2="00000"; 
var capId3="00B8N"; 
aa.print(capId3); 
var scheduleDateStr="07/17/2014"; //format: "MM/dd/yyyy" 
var comment="test scheduling pending inspection"; 
var scheduledDate = aa.date.transToJavaUtilDate(new Date(scheduleDateStr)); 
capIDModel= aa.cap.getCapID(capId1, capId2, capId3).getOutput(); 
inspectionScriptModel = aa.inspection.getInspectionScriptModel().getOutput(); 
inspectionModel = inspectionScriptModel.getInspection(); 
//sysUserModel=aa.person.getCurrentUser().getOutput(); 
sysUserModel=aa.person.getUser("ADMIN").getOutput(); 
activityModel = inspectionModel.getActivity(); 
activityModel.setCapIDModel(capIDModel); 
activityModel.setSysUser(sysUserModel); 
activityModel.setActivityDate(scheduledDate); 
activityModel.setInspectionGroup("bunni2"); //inspection group 
activityModel.setActivityType("3333"); //inspection type 
commentModel = inspectionModel.getRequestComment(); 
commentModel.setText(comment); 
inspectionModel.setActivity(activityModel); 
inspectionModel.setRequestComment(commentModel); 
result = aa.inspection.scheduleInspection(inspectionModel,sysUserModel); 
if(result.getSuccess()) 
{ 
 aa.print("Schedule inspection sucessfully."); 
} 
else 
{ 
 aa.print("Schedule inspection sucessfully."); 
 aa.print(result.getErrorMessage()); 
} 
aa.print("Schedule Inspection end.");