//This script support administrator to indicate specific condition group and type

var error = "";
var message = "";
var br = "<br>";

var capModel = aa.env.getValue("CapModel");
var capId = capModel.capID;

//Set single standard condition number
//var singleStdConNumVar = "8156";
//createSingleCapConditionByConNum(capId,singleStdConNumVar);

//Set single group name
//var groupNameVar = "test group1";
//addStdConditionByGroupName(groupNameVar);

//Set Multiple group name
//var groupNamesStr = "['National Media Council']";
//var groupNameArray = eval(groupNamesStr);
//addStdConditionsByGroupNames(groupNameArray);

//Add standard condition with specific group and type
var conditionGroup = "Abu Dhabi Food Control Authority";
var conditionType = "1-Cred";
var conditionName = "123123";
addStdConditionByGroupType(conditionGroup, conditionType, conditionName);

//Add Standard Condition with random group and specific type
//var conditionType = "Cond-26";
//var conditionName = "Hold the Fee";
//addStdCondition(conditionType, conditionName);

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

//Add Standard Condition with specific group and type
function addStdConditionByGroupType(cGroup, cType, cDesc)
{
	if (!aa.capCondition.getStandardConditions)
	{
		aa.print("addStdCondition function is not available in this version of Accela Automation.");
	}
	else
	{
		standardConditions = aa.capCondition.getStandardConditions(cType,cDesc).getOutput();
		for(i = 0; i<standardConditions.length;i++)
		{
			standardCondition = standardConditions[i]			
			standardCondition.setConditionGroup(cGroup);
			aa.capCondition.createCapConditionFromStdCondition(capId, standardCondition)
		}
	}
}

//Add Standard Condition with random group and specific type
function addStdConditionByType(cType, cDesc)
{
	if (!aa.capCondition.getStandardConditions)
	{
		aa.print("addStdCondition function is not available in this version of Accela Automation.");
	}
	else
	{
		standardConditions = aa.capCondition.getStandardConditions(cType,cDesc).getOutput();
		for(i = 0; i<standardConditions.length;i++)
		{
			standardCondition = standardConditions[i]
			aa.capCondition.createCapConditionFromStdCondition(capId, standardCondition.getConditionNbr())
		}
	}
}

//Add Standard Condition with specific groups
function addStdConditionsByGroupNames(groupNames)
{
	if (groupNames.length == 0)
	{
		return;
	}
	for(var i=0;i<groupNames.length;i++)
	{
		var groupName = groupNames[i];
		addStdConditionByGroupName(groupName);
	}

}

//Add Standard Condition specific group
function addStdConditionByGroupName(groupName)
{
	var standardConditions = aa.capCondition.getStandardConditionsByGroup(groupName).getOutput();
	for(i = 0; i<standardConditions.length;i++)
	{
		var stdCon = standardConditions[i];
		var stdConNum = stdCon.getConditionNbr();
		
		var result = aa.capCondition.getCapConditionByStdConditionNum(capId, stdConNum);
		
		if(result.getSuccess())
		{
			var existingCapConditions = result.getOutput()
			for(j= 0 ; j< existingCapConditions.length; j++)
			{
				var capConditionID = existingCapConditions[j].getConditionNumber();
				aa.capCondition.deleteCapCondition(capId, capConditionID);
			}
			
		}
		
		var conditionResult = aa.capCondition.createCapConditionFromStdCondition(capId, stdCon);
		if (!conditionResult.getSuccess())
		{
			logError("Create CAP condition for CAP("+ capId +") from STD condition(" + stdConNum + ") faild!");
		}
		logMessage("CAP condition(" + conditionResult.getOutput() + ") for CAP(" + capId + ") is created successful.");
	}
}

// Add Standard Condition by condition number. 
// The condition group is random value, if administrator enable standard choice ENABLE_MULTIPLE_CONDITION_GROUP_FOR_TYPE
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
