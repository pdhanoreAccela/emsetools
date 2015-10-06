aa.env.setValue("ScriptReturnCode","0");
aa.env.setValue("ScriptReturnMessage", "OWNERSELECTONSPEARFORMAFTER successful");

aa.print("---Sample EMSE script to get Added Owner condition info---");

var ownerList = aa.env.getValue("AddedOwnerList");
aa.print("Total Added Owner: " + ownerList.size() + "\n");

for(var i = 0;i<ownerList.size();i++)
{
	var ownerNumber = ownerList.get(i).toOwnerModel().getOwnerNumber();
	aa.print("Owner Number Of This Record: " + ownerNumber);
	var conditions = aa.ownerCondition.getOwnerConditions(ownerNumber);

		if(conditions != null && conditions.output != null)
		{
			
	    aa.print("Total Condition: " + conditions.output.length);
			for (var j=0; j<conditions.output.length; j++)
			{
				var condition = conditions.output[j];
				aa.print("Condition Name: "+condition.getConditionDescription());
			}
		}
		else
		{
			aa.print("No Condition! ");
		}
		aa.print("\n");
}
aa.print("End of Event");