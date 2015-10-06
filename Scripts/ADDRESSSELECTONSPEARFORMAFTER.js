aa.env.setValue("ScriptReturnCode","0");
aa.env.setValue("ScriptReturnMessage", "ADDRESSSELECTONSPEARFORMAFTER successful");

aa.print("---Sample EMSE script to get Added Address condition info---");

var addressList = aa.env.getValue("AddedAddressList");
aa.print("Total Added Addresses: " + addressList.size() + "\n");

for(var i = 0;i<addressList.size();i++)
{
	var refAddressId = addressList.get(i).getRefAddressId();
	var conditions = aa.addressCondition.getAddressConditions(refAddressId);
	aa.print("Condition Info of " + refAddressId + "\n");
		if(conditions != null && conditions.output != null)
		{
			for (var j=0; j<conditions.output.length; j++)
			{
				var condition = conditions.output[j];
				aa.print(condition.getConditionDescription());
			}
		}
		else
		{
			aa.print("There is no Condition attached to current address");
		}
		aa.print("\n");
}