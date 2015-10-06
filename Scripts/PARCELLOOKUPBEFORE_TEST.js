aa.env.setValue("ScriptReturnCode","0");
aa.env.setValue("ScriptReturnMessage", "ParcelSelectOnSpearFormBefore Message");

var parcelList = aa.env.getValue("SelectedParcelList");
if (parcelList != null && parcelList.size() > 0)
{
	for(var i = 0;i<parcelList.size();i++)
	{
		var parcelNumber = parcelList.get(i).getParcelNo();
		var conditions = aa.parcelCondition.getParcelConditions(parcelNumber);
	
			if(conditions != null && conditions.output != null)
			{
				for (var j=0; j<conditions.output.length; j++)
				{
					var condition = conditions.output[j];
					if (condition.getImpactCode()&&condition.getImpactCode()=='Hold')
					{
						aa.print("There is a Hold condition on the selected parcel: " + parcelNumber);
						aa.env.setValue("ScriptReturnCode","-1");
					}
				}
			}
	}
	aa.print("\n");
}
aa.print("End of Event");