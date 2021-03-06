// Enter your script here...
var message = "condition update successfully";
var conditionComment = aa.env.getValue("ConditionComment");
var conditionId = aa.env.getValue("ConditionId");
var conditionSeverity = aa.env.getValue("ConditionSeverity");

var conditionStatus = aa.env.getValue("ConditionStatus");
var conditionType = aa.env.getValue("ConditionType");
var conditionSeverity = aa.env.getValue("ConditionSeverity");

var capID1 = aa.env.getValue("PermitId1");
var capID2 = aa.env.getValue("PermitId2");
var capID3 = aa.env.getValue("PermitId3");
message ="Record " + capID1 + "-" + capID2 + "-" + capID3 + message;

output("ConditionApplyDate",aa.env.getValue("ConditionApplyDate"));
output("ConditionComment",aa.env.getValue("ConditionComment"));
output("ConditionId",aa.env.getValue("ConditionId"));
output("ConditionSeverity",aa.env.getValue("ConditionSeverity"));
output("ConditionStatus",aa.env.getValue("ConditionStatus"));
output("ConditionType",aa.env.getValue("ConditionType"));
output("ConditionGroup",aa.env.getValue("ConditionGroup"));
output("DisplayNoticeOnACA",aa.env.getValue("DisplayNoticeOnACA"));
output("DisplayNoticeOnACAFee",aa.env.getValue("DisplayNoticeOnACAFee"));
output("Priority",aa.env.getValue("Priority"));
output("LongDescripton",aa.env.getValue("LongDescripton"));
output("DisplayConditionNotice",aa.env.getValue("DisplayConditionNotice"));
output("AdditionalInformation",aa.env.getValue("AdditionalInformation"));

aa.nevs;
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