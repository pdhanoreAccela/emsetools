aa.env.setValue("ScriptReturnCode","0");
aa.env.setValue("ScriptReturnMessage", "AddressSelectOnSpearFormBefore Message");

var addressList = aa.env.getValue("SelectedAddressList");
if (addressList != null && addressList.size() > 0)
{
	for(var i = 0;i<addressList.size();i++)
	{
		var refAddressId = addressList.get(i).getRefAddressId();
		var conditions = aa.addressCondition.getAddressConditions(refAddressId);
			if(conditions != null && conditions.output != null)
			{
				for (var j=0; j<conditions.output.length; j++)
				{
					var condition = conditions.output[j];
					if (condition.getImpactCode()&&condition.getImpactCode()=='Hold')
					{
						aa.print("There is a Hold condition on the selected address: " + refAddressId);
						aa.env.setValue("ScriptReturnCode","-1");
					}
				}
			}
	}
	aa.print("\n");
}
aa.print("End of Event");