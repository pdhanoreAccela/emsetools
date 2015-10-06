/*------------------------------------------------------------------------------------------------------/
| Accela Automation
| Accela, Inc.
| Copyright (C): 2012
|
| Program : REFCONTACTEDITAFTER.js
| Event   : REFCONTACTEDITAFTER
|
| Client  : N/A
| Action# : N/A
|
| Notes   :
|
|
/------------------------------------------------------------------------------------------------------*/
/*------------------------------------------------------------------------------------------------------/
| START Configurable Parameters
|	The following script code will attempt to read the assocaite event and invoker the proper standard choices
|    
/------------------------------------------------------------------------------------------------------*/
var SCRIPT_VERSION = 2.0
var capId = null;

eval(getCustomScriptText("INCLUDES_ACCELA_FUNCTIONS"));
eval(getCustomScriptText("INCLUDES_CUSTOM"));
eval(getCustomScriptText("INCLUDES_REBUILD_TAGS"));

function getCustomScriptText(vScriptName) {
    vScriptName = vScriptName.toUpperCase();
    var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
    var emseScript = emseBiz.getScriptByPK(aa.getServiceProviderCode(), vScriptName, "ADMIN");
    return emseScript.getScriptText() + "";
}

function getLastAnnaulFulfilmentRunDate() {
    var svalue = lookup("DEC_CONFIG", "LIFETIME_LASTRUNDATE_BATCH_NUM");
    var d = new Date()
    if (isNull(svalue, '') != '' && isNull(svalue, '') != 'null') {
        d = new Date(lookup("DEC_CONFIG", "LIFETIME_LASTRUNDATE_BATCH_NUM").toString());
    }
    return d;
}

function getStringOfDate(ipDate) {
    logDebug(ipDate)
    var fvMonth = ipDate.getMonth() + 1;
    var fvDay = ipDate.getDate();
    var fvYear = ipDate.getFullYear();
    var fvString = fvMonth.toString() + "/" + fvDay.toString() + "/" + fvYear.toString();
    return fvString;
}

function buildTagsforNextYear(vContactSeqNum) {
    var fvLastRunDate = getLastAnnaulFulfilmentRunDate();
    var sRunDate = getStringOfDate(fvLastRunDate);
    var dToDate = new Date();
    var diff = dateDiff(dToDate, new Date(sRunDate));
    if (diff < 0) {
        var currDate = new Date();
        var seasonPeriod = GetDateRange(DEC_CONFIG, LICENSE_SEASON, fvLastRunDate.getFullYear());
        diff = dateDiff(dToDate, seasonPeriod[0]);
        if (diff > 0) {
            var vEffday = seasonPeriod[0];
            vEffday.setHours(0);
            vEffday.setMinutes(0);
            vEffday.setSeconds(0);

            rebuildAllTagsforaRefContact(vContactSeqNum, vEffday);
        }
    }
}

var vToday = new Date();
vToday.setHours(0);
vToday.setMinutes(0);
vToday.setSeconds(0);

var vRefContact = aa.env.getValue("ContactModel");
var vContactSeqNum = vRefContact.contactSeqNumber;
var contactType = vRefContact.getContactType();
var emailText = "";
var maxSeconds = 4.5 * 60; 	    // number of seconds allowed for batch processing, usually < 5*60
var message = "";
var br = "<br>";
var servProvCode = aa.getServiceProviderCode();
var systemUserObj = aa.person.getUser("ADMIN").getOutput();
var sysDate = aa.date.getCurrentDate();
var currentUser = aa.person.getCurrentUser().getOutput();
var useAppSpecificGroupName = false;
var isPartialSuccess = false;
var timeExpired = false;
var sysDateMMDDYYYY = dateFormatted(sysDate.getMonth(), sysDate.getDayOfMonth(), sysDate.getYear(), "");
var currentUserID = currentUser == null ? "ADMIN" : currentUser.getUserID().toString();
var debug = "";

var showDebug = false;
var showMessage = false;

if (contactType == "Individual" && !vRefContact.getDeceasedDate()) {
    updateDecID(vContactSeqNum);
    rebuildAllTagsforaRefContact(vContactSeqNum, vToday);
    buildTagsforNextYear(vContactSeqNum);

}
if (contactType == "DEC Agent")
    callWebServiceForANS(vContactSeqNum);

if (debug.indexOf("**ERROR") > 0) {
    aa.env.setValue("ScriptReturnCode", "1");
    aa.env.setValue("ScriptReturnMessage", debug);
}
else {
    aa.env.setValue("ScriptReturnCode", "0");
    if (showMessage) aa.env.setValue("ScriptReturnMessage", message);
    if (showDebug) aa.env.setValue("ScriptReturnMessage", debug);
}
