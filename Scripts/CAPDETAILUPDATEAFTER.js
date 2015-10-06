/*
* The demo script is show how to create a Record condition 
* from standard condition with tempalte (ASI) by master script.
*
* Script Name: addStdCondition
*/

var SCRIPT_VERSION = 2.0;
eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS"));
eval(getScriptText("INCLUDES_ACCELA_GLOBALS"));
eval(getScriptText("INCLUDES_CUSTOM"));

function getScriptText(vScriptName){
	vScriptName = vScriptName.toUpperCase();
	var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
	var emseScript = emseBiz.getMasterScript(aa.getServiceProviderCode(),vScriptName);
	return emseScript.getScriptText() + "";	
}

//var id1 = "14CAP";
//var id2 = "00000";
//var id3 = "005HB";


var id1 = aa.env.getValue('PermitId1');
var id2 = aa.env.getValue('PermitId2');
var id3 = aa.env.getValue('PermitId3');

var capID = aa.cap.getCapID(id1, id2, id3).getOutput();
var stdConditionType = 'levi';
var stdConditionName = 'levi';

// Add cap condition from standard condition by master script
addStdCondition(stdConditionType, stdConditionName, capID);

