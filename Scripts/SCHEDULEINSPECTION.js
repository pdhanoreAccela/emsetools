assignUnassigned()

function assignUnassigned()
{
var Today = new Date();
var todaysdate=Today.getFullYear() + "-" + (Today.getMonth() + 1) + "-" + Today.getDate(); 
var tomorrowsdate=Today.getFullYear() + "-" + (Today.getMonth() + 1) + "-" + (Today.getDate()+1);

insps = aa.inspection.getUnassignedInspections(todaysdate,tomorrowsdate);

if(insps.getSuccess())
	{
		var inspArray=insps.getOutput();
	}	
	else
	{
	aa.print("**ERROR retrieving unassigned inspections " + insps.getErrorMessage());
	return false;
	}

	
for (each in inspArray)
	{
	var capId=inspArray[each].getCapID();
	var result=autoAssignInspection(inspArray[each].getIdNumber() ,capId);
	}




function autoAssignInspection(iNumber, capId) {
    // updates the inspection and assigns to a new user
    // requires the inspection id
    //
    aa.print(capId);
    iObjResult = aa.inspection.getInspection(capId, iNumber);
    if (!iObjResult.getSuccess())
   {
    aa.print("**ERROR retrieving inspection " + iNumber + " : " + iObjResult.getErrorMessage());
	return false;
	}


   
    var iObj = iObjResult.getOutput();
	if (iObj.getInspectionType() == 'Ad Permits') inspGroup = 'Ad Permits'
	if (iObj.getInspectionType() == 'License Inspection') inspGroup = 'License Insp'
	if (iObj.getInspectionType() == 'Amendment') inspGroup = 'Amend'
	if (iObj.getInspectionType() == 'Pre-Inspection') inspGroup = 'Pre-Inspect'
    inspTypeResult = aa.inspection.getInspectionType(inspGroup, iObj.getInspectionType())

    if (!inspTypeResult.getSuccess())
   {
   	aa.print("**ERROR retrieving inspection Type " + inspTypeResult.getErrorMessage());
	return false;
	}

    inspTypeArr = inspTypeResult.getOutput();
	

	
    if (inspTypeArr == null || inspTypeArr.length == 0)
   
   {
   	aa.print("**ERROR no inspection type found");
	return false;
	}
	

    inspType = inspTypeArr[0]; // assume first
    inspSeq = inspType.getSequenceNumber();
    inspSchedDate = iObj.getScheduledDate().getYear() + "-" + iObj.getScheduledDate().getMonth() + "-" + iObj.getScheduledDate().getDayOfMonth()

    iout = aa.inspection.autoAssignInspector(capId.getID1(), capId.getID2(), capId.getID3(), inspSeq, inspSchedDate)

    if (!iout.getSuccess())
   {
   	aa.print("**ERROR retrieving auto assign inspector " + iout.getErrorMessage());
	return false;
	}

    inspectorArr = iout.getOutput();

    if (inspectorArr == null || inspectorArr.length == 0)
 
   {
    aa.print("**WARNING no auto-assign inspector found");
	return false;
	}

    inspectorObj = inspectorArr[Math.floor(Math.random()*(inspectorArr.length))];
	
    iObj.setInspector(inspectorObj);
	
    assignResult = aa.inspection.editInspection(iObj);

    if (!assignResult.getSuccess())   {
	return false;
	}
    else
	{
	aa.print("Successfully reassigned inspection " + iObj.getInspectionType() + " to user " + inspectorObj.getUserID());
	return true;
	}
	
     

}
}

