//ENABLE_MULTIPLE_CONDITION_GROUP_FOR_TYPE
var error = "";
var message = "";
var br = "<br>";

var capModel = aa.env.getValue("CapModel");
var capId = capModel.capID;

//Set single standard condition number
//var singleStdConNumVar = "8156";
//createSingleCapConditionByConNum(capId,singleStdConNumVar);


//Set single group name
//var groupNameVar = "National Transportation Authority";
//createCapConditionsByGroupName(capId,groupNameVar);

//Set Multiple group name 
//National Transportation Authority
var groupNamesStr = "['James Cond Group']";
var groupNameArray = eval(groupNamesStr);
createCapConditionsByGroupNames(capId,groupNameArray);

if (error && error.length > 0)
{
	aa.env.setValue("ScriptReturnCode", "1");
	aa.env.setValue("ScriptReturnMessage", error);
}
else
{
	aa.env.setValue("ScriptReturnCode", "0");
	aa.env.setValue("ScriptReturnMessage", message);
}
aa.print(message);
aa.print(error);

function createCapConditionsByGroupNames(capId,groupNames)
{
	if (groupNames.length == 0)
	{
		return;
	}
	for(var i=0;i<groupNames.length;i++)
	{
		var groupName = groupNames[i];
		createCapConditionsByGroupName(capId,groupName);
	}

}

function createCapConditionsByGroupName(capId,groupName)
{
                var standardConditions = aa.capCondition.getStandardConditionsByGroup(groupName).getOutput();
                if (standardConditions)
                {
                                for(i = 0; i<standardConditions.length;i++)
                                {
                                                var stdCon = standardConditions[i];
                                                var stdConNum = stdCon.getConditionNbr();
                                                var capStdConds = aa.capCondition.getCapConditionByStdConditionNum(capId, stdConNum).getOutput();
                                                if (capStdConds.length <= 0)
                                                {
                                                                var conditionResult = aa.capCondition.createCapConditionFromStdCondition(capId, stdConNum);
                                                                if (!conditionResult.getSuccess())
                                                                {
                                                                                logError("Create CAP condition for CAP("+ capId +") from STD condition(" + stdConNum + ") faild!");
                                                                }
                                                                logMessage("CAP condition(" + conditionResult.getOutput() + ") for CAP(" + capId + ") is created successful.");
                                                }
                                }
                }
}


function createSingleCapConditionByConNum(capId,stdConNum)
{
	var conditionResult = aa.capCondition.createCapConditionFromStdCondition(capId, stdConNum);
	if (!conditionResult.getSuccess())
	{
		logError("Create CAP condition for CAP("+ capId +") from STD condition(" + stdConNum + ") faild!");
		return;
	}
	logMessage("CAP condition(" + conditionResult.getOutput() + ") for CAP(" + capId + ") is created successful.");
}

function logError(str)
{
	error += str + br;
}

function logMessage(str)
{
	message += str + br;
}