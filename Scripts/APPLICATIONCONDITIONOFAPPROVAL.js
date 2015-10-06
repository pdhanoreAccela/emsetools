var conditions = aa.env.getValue("UpdatedConditionList");
var message = "";
for (loopk in conditions)
{
	var condition = conditions[loopk];
	message += condition.getConditionDescription() + " update successfully.";
}
aa.env.setValue("ScriptReturnMessage",message);