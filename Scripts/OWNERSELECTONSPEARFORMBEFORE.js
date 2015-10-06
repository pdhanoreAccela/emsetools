aa.env.setValue("ScriptReturnCode","0");
aa.env.setValue("ScriptReturnMessage", "OwnerSelectOnSpearFormBefore Message");

var ownerList = aa.env.getValue("SelectedOwnerList");
if (ownerList != null && ownerList.size() > 0)
{
	for(var i = 0;i<ownerList.size();i++)
	{
		var ownerNumber = ownerList.get(i).toOwnerModel().getOwnerNumber();
		var conditions = aa.ownerCondition.getOwnerConditions(ownerNumber);
	
			if(conditions != null && conditions.output != null)
			{
				for (var j=0; j<conditions.output.length; j++)
				{
					var condition = conditions.output[j];
					if (condition.getImpactCode()&&condition.getImpactCode()=='Hold')
					{
						aa.print("There is a Hold condition on the selected owner: " + ownerNumber);
						aa.env.setValue("ScriptReturnCode","-1");
					}
				}
			}
	}
	aa.print("\n");
}
aa.print("End of Event");