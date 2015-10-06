/**
 * Accela Automation
 *
 * Accela, Inc.
 * Copyright (C): 2014
 *
 * Description:
 * ApplicationSubmitAfter.js the EMSE Script that related to EMSE EVENT ApplicationSubmitAfter
 *
 * Notes:
 *
 * Revision History:
 * 2014-10-24     Vernon Crandall	Initial Version
 */
function getCapId() {
	var s_id1 = aa.env.getValue("PermitId1");
	var s_id2 = aa.env.getValue("PermitId2");
	var s_id3 = aa.env.getValue("PermitId3");
	var s_capResult = aa.cap.getCapID(s_id1, s_id2, s_id3);
	if (s_capResult.getSuccess())
		return s_capResult.getOutput();
	else {
		aa.print("ERROR: Failed to get capId: " + s_capResult.getErrorMessage());
		return null;
	}
}
											
var capId = getCapId();
var cap = aa.cap.getCap(capId).getOutput();
var sysDate = aa.date.getCurrentDate();
var	altID = capId.getCustomID();
var currentUserID = aa.env.getValue("CurrentUserID");

function createReferenceLP(bizname1, bizname2) {
	if(bizname1 == "" || bizname2 == "")
	{
		return;
	}
	
	var newLic = aa.licenseScript.createLicenseScriptModel();
	newLic.setBusinessName(bizname1);
	newLic.setBusinessName2(bizname2); // available only on 6.6.1i patch i
	newLic.setAgencyCode(aa.getServiceProviderCode());
	newLic.setAuditDate(sysDate);
	newLic.setAuditID(currentUserID);
	newLic.setAuditStatus("A");
	newLic.setLicenseType("TRADE NAME");
	newLic.setLicState("LA");
	newLic.setStateLicense(altID);//parseInt(Math.random(1)*80000000)
	myResult = aa.licenseScript.createRefLicenseProf(newLic);
	if (!myResult.getSuccess()) {
		aa.print("**ERROR: can't create ref lic prof: " + myResult.getErrorMessage());
		return;
	}
	lpsmResult = aa.licenseScript.getRefLicenseProfBySeqNbr(capId.getServiceProviderCode(),myResult.getOutput())
	if (!lpsmResult.getSuccess()) {
		aa.print("**WARNING error retrieving the LP just created "+ lpsmResult.getErrorMessage());
		return;
	}
	lpsm = lpsmResult.getOutput();
	// Now add the LP to the CAP
	asCapResult = aa.licenseScript.associateLpWithCap(capId, lpsm)
	if (!asCapResult.getSuccess()) {
		aa.print("**WARNING error associating CAP to LP: "+ asCapResult.getErrorMessage())
	}
	
	// Create Licensee and record relationship
	if(lpsm)
	{
		createRelationshipResult = aa.licenseProfessional.createLicenseeAndRecordRelationship(lpsm.getLicenseModel(), capId, currentUserID);
		if (!createRelationshipResult.getSuccess()) {
			aa.print("**WARNING error associating CAP to licensee: "+ createRelationshipResult.getErrorMessage())
		} 
	}
}

/**
 * Retrieve trade name data from CAP ASI fields
 * 
 * @return
 */
var english_trade_name = "";
var arb_trade_name = "";
function retrieveSearchDataFromASI(){
	var scriptResult=aa.appSpecificInfo.getByCapID(capId);
	aa.debug("---------------------------scriptResult.success=",scriptResult.success);
	if(scriptResult.success){
		var asiFields=scriptResult.getOutput();
		aa.debug("---------------------------asiFields.length=",asiFields.length);
		if(asiFields.length > 1)
		{
			var english_asiModel=asiFields[0];
			var arb_asiModel = asiFields[1];
			aa.debug("---------------------------english_trade_name=",english_trade_name);
			aa.debug("---------------------------arb_trade_name=",english_trade_name);
			english_trade_name = english_asiModel.getChecklistComment();
			arb_trade_name = arb_asiModel.getChecklistComment();
		}
	}	
}

function doSave()
{
		retrieveSearchDataFromASI();
		createReferenceLP(english_trade_name, arb_trade_name);		
}

var result=doSave();
var message="";
if(result=="0"){
	message="ApplicationSubmitAfter successful"
}else{
	message="ApplicationSubmitAfter failed"
}
aa.env.setValue("ScriptReturnCode",result);
aa.env.setValue("ScriptReturnMessage",message);