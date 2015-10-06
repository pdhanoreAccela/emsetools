// Enter your script here...
var message = "'s condition update successfully";

var cap_Id1 = aa.env.getValue("PermitId1");
var cap_Id2 = aa.env.getValue("PermitId2");
var cap_Id3 = aa.env.getValue("PermitId3");

var conditionComment = aa.env.getValue("ConditionComment");
var conditionId = aa.env.getValue("ConditionId");
var conditionStatus = aa.env.getValue("ConditionStatus");
var conditionType = aa.env.getValue("ConditionType");
var LongDescripton = aa.env.getValue("LongDescripton");
var additionalInformation = aa.env.getValue("AdditionalInformation");


output("ConditionApplyDate",aa.env.getValue("ConditionApplyDate"));
output("ConditionComment",aa.env.getValue("ConditionComment"));
output("ConditionId",aa.env.getValue("ConditionId"));
output("ConditionType",aa.env.getValue("ConditionType"));
output("Priority",aa.env.getValue("Priority"));
output("LongDescripton",aa.env.getValue("LongDescripton"));
output("AdditionalInformation",aa.env.getValue("AdditionalInformation"));


var capIDModel = aa.cap.getCapIDModel(cap_Id1, cap_Id2, cap_Id3).getOutput();

var additionalInformation = getAdditionalInformation();

message ="Record :" + cap_Id1 + "-" + cap_Id2 + "-" + cap_Id3 + "-" + additionalInformation + message;


function getAdditionalInformation()
{
	var capCondition = aa.capCondition.getCapCondition(capIDModel, conditionId);
	if (capCondition.getSuccess())
	{
		var conditionArr = capCondition.getOutput();
		if(conditionArr.size()>0)
		{
			 var iterator = conditionArr.iterator();
			 while(iterator.hasNext())
			 {
				var conditionScriptModel = iterator.next();
				return conditionScriptModel.getConditionModel().getAdditionalInformation();
			 }
		}
	}
	return "";
}
output("AdditionalInformation1",additionalInformation);

aa.env.setValue("ScriptReturnMessage",message);

function output(name, value)
{
         var val = "";
         if(value != null)
         {
                   val = value;
         }
         if(name != null)
         {
                   aa.print(name + ": " + val);
         }
         else
         {
                   aa.print(val);
         }
}