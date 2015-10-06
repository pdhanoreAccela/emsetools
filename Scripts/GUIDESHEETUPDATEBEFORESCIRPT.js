// **********  function description ***********
// The inspector completes the guidesheet.  
// If the inspector gives a status of Fail to the item which name is "Check activities eligibility"
// and Pass to the item which name is "Check for illegal street peddlers",
// the script executes and displays a message to the inspector about the error. 
// **********        end            ***********

// the name of a guide sheet item. 
var failItemName = "Check activities eligibility";
// the name of a guide sheet item. 
var passItemName = "Check for illegal street peddlers";
// save the status of the item which name assigned by failItemName.
var failStatus = "";
// save the status of the item which name assigned by passItemName.
var passStatus = "";
//Get the parameter -- Guidesheet model.
var guidesheetModel = aa.env.getValue("GuidesheetModel");
if(guidesheetModel != null)
{
	 //Get the guidesheet items.
   var guidesheetItems = guidesheetModel.getItems();
	 if(guidesheetItems != null)
	 {
			var it=guidesheetItems.iterator();
			while(it.hasNext())
		  {
				 var guidesheetItem =it.next();
				 if(failItemName.equals(guidesheetItem.getGuideItemText()))
				 {
				 		failStatus = guidesheetItem.getGuideItemStatus();
				 }
				 if(passItemName.equals(guidesheetItem.getGuideItemText()))
				 {
				 		passStatus = guidesheetItem.getGuideItemStatus();
				 }
		  }
		  //If the failStatus is "Fail" and the passStatus is "Pass", it displays a message to the inspector about the error.
		  if("Fail".equals(failStatus)&&"Pass".equals(passStatus))
		  {
			        aa.env.setValue("ScriptReturnCode","1");
  		        aa.env.setValue("ScriptReturnMessage", "Change the status of a guide sheet item failed."); 			
      }
	 }
}
else
{
	  aa.print("ERROR: Cannot find the parameter 'GuidesheetModel'.");
}