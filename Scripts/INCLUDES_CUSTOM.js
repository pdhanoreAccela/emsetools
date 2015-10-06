/*------------------------------------------------------------------------------------------------------/
| Program : INCLUDES_CUSTOM.js
| Event   : N/A
|
| Usage   : Custom Script Include.  Insert custom EMSE Function below and they will be 
|           available to all master scripts
|
| Notes   : 01/02/2013,     Lalit S Gawad (LGAWAD),     Initial Version 
|           10/10/2013,     Laxmikant Bondre (LBONDRE), Fixed Defect - 1922.
|                           Active Holdings are not shown because expiry date was wrong.
|                           Fixed Expiry Date.
|           10/10/2013,     Laxmikant Bondre (LBONDRE), Fixed Defect - 1922.
|                           Expiry date is calculated 1 day before.
|           10/18/2013,     Laxmikant Bondre (LBONDRE), 
|                           Add Fulfillment Condition for Education Updated..

|           10/29/2013      Roland VonSchoech, Accela - Add modified copyFees() function to include additional debug statements.
|           10/29/2013      Raj Koul, commented out the logDebug function for workflow tasks Line #2026
|           10/29/2013      Raj Koul, commented out the unnecessary message displaying  ref seq #2943


/------------------------------------------------------------------------------------------------------*/
var frm;

eval(getScriptText("INCLUDES_RAJ_TEST"));
eval(getScriptText("INCLUDES_ACCELA_CONTACT_ASI"));
eval(getScriptText("INCLUDES_DEC_MANAGE_STD_CHOICE"));
eval(getScriptText("INCLUDES_DEC_RULES"));
eval(getScriptText("INCLUDES_DEC_APP_OBJECT"));
eval(getScriptText("INCLUDES_DEC_DRAW"));
eval(getScriptText("INCLUDES_DEC_HARVEST"));
eval(getScriptText("INCLUDES_REBUILD_TAGS"));

var dictTags = null;
var peopTemplateAttribute = aa.util.newHashMap();
var salesAgentInfoArray = null;
var hmfulfilmmentCond = aa.util.newHashMap();
var CONTACT_LINK = '<a href="/dec/Report/ReportParameter.aspx?module=Licenses&reportID=4023&reportType=LINK_REPORT_LIST" target=_blank>Print Contact DEC Tag </a>';
//var MSG_SUSPENSION = 'License to buy privileges are suspended. Please contact DEC Sales. ' + CONTACT_LINK;        //...Raj  JIRA 16753  [Change of message] see below 
var MSG_SUSPENSION = 'License purchases are not available to the customer. This issue can only be resolved by contacting DEC during business hours at 518-402-8821. ' + CONTACT_LINK;
var MSG_NO_AGENT_SALES = 'Sales privileges are suspended. Please contact DEC Revenue 518-402-9365.'; //+ CONTACT_LINK; //... Muhammad Hanif JIRA NYELS-48821
var MSG_TOO_MANY_ADDR = 'Please enter only one address of each type.';
var MSG_DEC_ID_EDITED = 'DEC ID Can Not be Edited.';
var MSG_DECEASED = 'Cannot continue sale, the selected applicant is deceased.';

//Override function - added/updated debug statements
function copyFees(sourceCapId, targetCapId) {
    logDebug("ENTER: copyFees");
    var feeSeqArray = new Array();
    var invoiceNbrArray = new Array();
    var feeAllocationArray = new Array();

    logDebug("Load Fees from Source Record");
    var feeA = loadFees(sourceCapId)

    logDebug("If Fees found, enter loop (each Fee Code found will be displayed if any)...");
    for (x in feeA) {
        thisFee = feeA[x];

        logDebug("Found Fee Code " + thisFee.code + " with status: " + thisFee.status);

        if (thisFee.status == "INVOICED") {
            logDebug("Fee Status is INVOICED.  Add fee to Target Record. Call addFee for: " + thisFee.code);
            addFee(thisFee.code, thisFee.sched, thisFee.period, thisFee.unit, "Y", targetCapId)

            var feeSeqArray = new Array();
            var paymentPeriodArray = new Array();

            logDebug("Attempt to create an Invoice on Source Record.");
            feeSeqArray.push(thisFee.sequence);
            paymentPeriodArray.push(thisFee.period);
            var invoiceResult_L = aa.finance.createInvoice(sourceCapId, feeSeqArray, paymentPeriodArray);

            if (!invoiceResult_L.getSuccess())
                logMessage("**ERROR: Invoicing the fee items voided " + thisFee.code + " was not successful.  Reason: " + invoiceResult_L.getErrorMessage());
        }

        if (thisFee.status == "NEW") {
            logDebug("Fee Status is NEW.  Add fee to Target Record.  Call addFee for: " + thisFee.code);
            addFee(thisFee.code, thisFee.sched, thisFee.period, thisFee.unit, "N", targetCapId)
        }

    }

    logDebug("EXIT: copyFees");
}
//code started
function isValidNumber(inputValue) {
    var isValid = true;
    var retMsg = '';
    if (inputValue != null || inputValue != '') {
        var Pattern = /^\d{9}$/;
        isValid = Pattern.test(inputValue);
        if (isValid) {
            retMsg += "Please enter 9 digit number.";
            retMsg += '<Br />';
            return retMsg;
        }
    }
    return retMsg;
}
//code ended
function getScriptText(vScriptName) {
    vScriptName = vScriptName.toUpperCase();
    var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
    var emseScript = emseBiz.getScriptByPK(aa.getServiceProviderCode(), vScriptName, "ADMIN");
    return emseScript.getScriptText() + "";
}
function TargetCAPAttrib(targetCapId, targetFeeInfo, isForceComboCharge) {
    this.targetCapId = targetCapId;
    this.targetFeeInfo = targetFeeInfo;
    this.isForceComboCharge = isForceComboCharge;
    if (this.isForceComboCharge == null) {
        this.isForceComboCharge = false;
    }
}
function NewLicDef(fldname, val) {
    this.FieldName = fldname;
    this.Value = val;

    var subgroupname = null;
    if (arguments.length > 2) {
        subgroupname = arguments[2];
    }
    this.SubGroupName = subgroupname;
}
function setSalesItemASI(newCap, recordType, decCode, quantity, wmuResult, wmu2Result) {
    logDebug("ENTER: setSalesItemASI");

    var ats = recordType;
    var ata = ats.split("/");

    var newAInfo = new Array();
    //Common ASI fields respect TAG_INFO
    if (appTypeString == 'Licenses/Other/Sales/Application' || appTypeString == 'Licenses/Other/Sportsmen/DMV ID Request') {
        var seasonPeriod = GetLicenseSeasonPeriod();
        var sYear = seasonPeriod[0].getFullYear();
        var sYearDesc = GetLicenseYearDescByYear(sYear);

        newAInfo.push(new NewLicDef("Year", sYear));
        newAInfo.push(new NewLicDef("Year Description", sYearDesc));
        newAInfo.push(new NewLicDef("Item Code", decCode));
    } else {
        newAInfo.push(new NewLicDef("Year", AInfo["License Year"]));
        newAInfo.push(new NewLicDef("Year Description", AInfo["License Year Description"]));
        newAInfo.push(new NewLicDef("Item Code", decCode));
    }


    if (ats == AA05_DEER_MANAGEMENT_PERMIT) {
        if (arguments.length > 3) {
            var wmu1Result = wmuResult;
            //Update Resut in asit
            var newAsitArray = GetWmuAsitTableArray(wmu1Result, wmu2Result);
            //asitModel = newCap.getAppSpecificTableGroupModel();
            //new_asit = addASITable4ACAPageFlow(asitModel, "DRAW RESULT", newAsitArray);

            if (newAsitArray && newAsitArray.length > 0) {
                addASITable("DRAW RESULT", newAsitArray, newCap)
                //Update Contact Attribute
                peopTemplateAttribute.put("PREFERENCE POINTS", wmu1Result.RemainingPreferencePoints + "");
                AInfo["CODE.PREFERENCE POINTS"] = wmu1Result.RemainingPreferencePoints;
            }
        }
    }
    //ser ASI fields respect TAG_INFO
    else if (ata[1] == "Tag") {
        newAInfo.push(new NewLicDef("Tag Type", AInfo["CODE.TAG_TYPE"]));
        //is From DMP Tage
        if (wmuResult != null) {
            newAInfo.push(new NewLicDef("WMU", wmuResult.WMU));
            newAInfo.push(new NewLicDef("Draw Type", wmuResult.DrawType));
            newAInfo.push(new NewLicDef("Choice", wmuResult.ChoiceNum));
            newAInfo.push(new NewLicDef("PreferencePoints", wmuResult.PreferencePoints));
            newAInfo.push(new NewLicDef("Landowner", wmuResult.Landowner));
            newAInfo.push(new NewLicDef("Military Disabled", wmuResult.DisabledVet));
            newAInfo.push(new NewLicDef("Resident", wmuResult.Resident));
        }
        if (ats == AA54_TAG_PRIV_PANEL) {
            newAInfo.push(new NewLicDef("PrintConsignedLines", AInfo["A_PrintConsignedLines"]));
        }
    }
    else if (ats == AA45_LIFETIME_INSCRIPTION) {
        newAInfo.push(new NewLicDef("Quantity", quantity));
        newAInfo.push(new NewLicDef("Effective Date", AInfo["CODE.Effective Date"]));
        newAInfo.push(new NewLicDef("Inscription", AInfo["Inscription"]));

        //Update Contact Attribute
        peopTemplateAttribute.put("LIFETIME INSCRIPTION", AInfo["Inscription"]);
    }
    else if (ats == AA20_CONSERVATIONIST_MAGAZINE) {
        newAInfo.push(new NewLicDef("Quantity", quantity));
        newAInfo.push(new NewLicDef("Effective Date", AInfo["CODE.Effective Date"]));
        newAInfo.push(new NewLicDef("Is magzine subscription a gift?", AInfo["Is magzine subscription a gift?"]));
        newAInfo.push(new NewLicDef("First Name", AInfo["First Name"]));
        newAInfo.push(new NewLicDef("Last Name", AInfo["Last Name"]));
        newAInfo.push(new NewLicDef("Middle Name", AInfo["Middle Name"]));
        newAInfo.push(new NewLicDef("Address Line 1", AInfo["Address Line 1"]));
        newAInfo.push(new NewLicDef("Address Line 2", AInfo["Address Line 2"]));
        newAInfo.push(new NewLicDef("City", AInfo["City"]));
        newAInfo.push(new NewLicDef("State", AInfo["State"]));
        newAInfo.push(new NewLicDef("Zip", AInfo["Zip"]));
        newAInfo.push(new NewLicDef("Zip + 4", AInfo["Zip + 4"]));
    }
    else {
        newAInfo.push(new NewLicDef("Quantity", quantity));
        newAInfo.push(new NewLicDef("Effective Date", AInfo["CODE.Effective Date"]));
    }

    copyLicASI(newCap, newAInfo);

    logDebug("EXIT: setSalesItemASI");
}
function GetWmuAsitTableArray(wmu1Result, wmu2Result) {
    logDebug("ENTER: GetWmuAsitTableArray");

    var readOnly = "N";
    var tempObject = new Array();
    var tempObject2 = new Array();
    var tempArray = new Array();

    tempObject = new Array();
    //Choice 1 Result

    if (wmu1Result) {
        var fieldInfo = new asiTableValObj("DRAW TYPE", wmu1Result.DrawType, "Y");
        tempObject["DRAW TYPE"] = fieldInfo;
        fieldInfo = new asiTableValObj("WMU", wmu1Result.WMU, "Y");
        tempObject["WMU"] = fieldInfo;
        fieldInfo = new asiTableValObj("Choice Number", "1", "Y");
        tempObject["Choice Number"] = fieldInfo;
        fieldInfo = new asiTableValObj("Result", wmu1Result.Result(), "Y");
        tempObject["Result"] = fieldInfo;
        fieldInfo = new asiTableValObj("Apply Land Owner", wmu1Result.Landowner ? "CHECKED" : "UNCHECKED", "Y");
        tempObject["Apply Land Owner"] = fieldInfo;
        fieldInfo = new asiTableValObj("Preference Points Given", wmu1Result.GivenPreferencePoints + "", "Y");
        tempObject["Preference Points Given"] = fieldInfo;
        fieldInfo = new asiTableValObj("Preference Points After", wmu1Result.RemainingPreferencePoints + "", "Y");
        tempObject["Preference Points After"] = fieldInfo;
        fieldInfo = new asiTableValObj("Preference Bucket", wmu1Result.PreferenceBucket ? wmu1Result.PreferenceBucket + "" : "" + "", "Y");
        tempObject["Preference Bucket"] = fieldInfo;
        fieldInfo = new asiTableValObj("Land Owner?", "", "N");
        tempObject["Land Owner?"] = fieldInfo;
        fieldInfo = new asiTableValObj("Correct?", "", "N");
        tempObject["Correct?"] = fieldInfo;
        fieldInfo = new asiTableValObj("New?", "", "N");
        tempObject["New?"] = fieldInfo;
        fieldInfo = new asiTableValObj("WMU To Correct", "", "N");
        tempObject["WMU To Correct"] = fieldInfo;
        fieldInfo = new asiTableValObj("Preference Points Corrected", "", "N");
        tempObject["Preference Points Corrected"] = fieldInfo;
        fieldInfo = new asiTableValObj("Corrected", "N", "N");
        tempObject["Corrected"] = fieldInfo;
        tempArray.push(tempObject);
    }
    //Choice 2 Result

    if (wmu2Result) {
        fieldInfo = new asiTableValObj("DRAW TYPE", wmu2Result.DrawType, "Y");
        tempObject2["DRAW TYPE"] = fieldInfo;
        fieldInfo = new asiTableValObj("WMU", wmu2Result.WMU, "Y");
        tempObject2["WMU"] = fieldInfo;
        fieldInfo = new asiTableValObj("Choice Number", "2", "Y");
        tempObject2["Choice Number"] = fieldInfo;
        fieldInfo = new asiTableValObj("Result", wmu2Result.Result(), "Y");
        tempObject2["Result"] = fieldInfo;
        fieldInfo = new asiTableValObj("Apply Land Owner", wmu2Result.Landowner ? "CHECKED" : "UNCHECKED", "Y");
        tempObject2["Apply Land Owner"] = fieldInfo;
        fieldInfo = new asiTableValObj("Preference Points Given", wmu2Result.GivenPreferencePoints + "", "Y");
        tempObject2["Preference Points Given"] = fieldInfo;
        fieldInfo = new asiTableValObj("Preference Points After", wmu2Result.RemainingPreferencePoints + "", "Y");
        tempObject2["Preference Points After"] = fieldInfo;
        fieldInfo = new asiTableValObj("Preference Bucket", wmu2Result.PreferenceBucket ? wmu2Result.PreferenceBucket + "" : "", "Y");
        tempObject2["Preference Bucket"] = fieldInfo;
        fieldInfo = new asiTableValObj("Land Owner?", "", "N");
        tempObject2["Land Owner?"] = fieldInfo;
        fieldInfo = new asiTableValObj("Correct?", "", "N");
        tempObject2["Correct?"] = fieldInfo;
        tempArray.push(tempObject2);
    }
    logDebug("EXIT: GetWmuAsitTableArray");

    return tempArray;
}

function copyLicASI(newCap, newAInfo) {
    logDebug("ENTER: copyLicASI");
    var ignoreArr = new Array();
    var limitCopy = false;
    if (arguments.length > 1) {
        ignoreArr = arguments[1];
        limitCopy = true;
    }
    for (var item in newAInfo) {
        //Check list
        if (limitCopy) {
            var ignore = false;
            for (var i = 0; i < ignoreArr.length; i++)
                if (ignoreArr[i] == newAInfo[item].FieldName) {
                    ignore = true;
                    break;
                }
            if (ignore)
                continue;
        }
        //editAppSpecific(newAInfo[item].FieldName, newAInfo[item].Value, newCap);
	var scriptName = "COPYLICASI";
	var envParameters = aa.util.newHashMap();
	envParameters.put("cap",newCap);
	envParameters.put("item",newAInfo[item].FieldName);
	envParameters.put("value",newAInfo[item].Value);
	aa.runAsyncScript(scriptName, envParameters);
	logDebug("Setting " + newCap.getCustomID() + " ASI field " + newAInfo[item].FieldName + " to " + newAInfo[item].Value);
    }
    logDebug("EXIT: copyLicASI");
}

function updateContacts() {
    logDebug("ENTER: updateContacts");
    //logDebug("Elapsed Time: " + elapsed());

    var peopleSequenceNumber = null;
    var contactSeqNumber = null;

    //var capContact = getOutput(aa.people.getCapContactByCapID(capId));
    var xArray = getApplicantArrayEx(capId);
    for (ca in xArray) {
        var thisContact = xArray[ca];
        if (thisContact["contactType"] == "Individual") {
            contactSeqNumber = thisContact["contactSeqNumber"];
            break;
        }
    }

    //xArray = new Array();

    // JHS 10/9/2013 added test for null on contactSeqNumber
    var capContactArray = new Array();

    if (!contactSeqNumber) {
        logDebug("**WARNING updateContacts could not fund an applicant/individual");
    }
    else {
        capContactArray = getOutput(aa.people.getCapContactByContactID(contactSeqNumber));
    }

    if (capContactArray) {
        for (yy in capContactArray) {
            //First One is always Applicant else check for contact type
            //var aArray = getApplicantInfoArray(capContactArray[yy], capId);
            //xArray.push(aArray);
            peopleSequenceNumber = capContactArray[yy].getCapContactModel().getRefContactNumber();
            break;
        }
    }

    //logDebug(peopleSequenceNumber);
    if (appTypeString == 'Licenses/Annual/Application/NA' || appTypeString == "Licenses/Other/Sportsmen/Profile") {
        if (peopleSequenceNumber != null) {
            //Set contact ASI using cap asi
            var newAInfo = new Array();
            var subGroupName = "ADDITIONAL INFO";
            newAInfo.push(new NewTblDef("Parent Driver License Number", AInfo["A_Parent_Driver_License_Number"], subGroupName));
            newAInfo.push(new NewTblDef("NY Resident Proof Document", AInfo["A_NY_Resident_Proof_Document"], subGroupName));
            newAInfo.push(new NewTblDef("Are You New York Resident?", AInfo["A_IsNYResident"], subGroupName));

            //JIRA-50289
            if (isNull(peopTemplateAttribute.get("PREFERENCE POINTS"), '') != '') {
                newAInfo.push(new NewTblDef("Preference Points", isNull(peopTemplateAttribute.get("PREFERENCE POINTS"), ''), subGroupName));
            }
            if (isNull(peopTemplateAttribute.get("LIFETIME INSCRIPTION"), '') != '') {
                newAInfo.push(new NewTblDef("Lifetime Inscription", peopTemplateAttribute.get("LIFETIME INSCRIPTION"), subGroupName));
            }

            subGroupName = "APPEARANCE";
            newAInfo.push(new NewTblDef("Height", AInfo["Height"], subGroupName));
            newAInfo.push(new NewTblDef("Height - inches", AInfo["Height - inches"], subGroupName));
            newAInfo.push(new NewTblDef("Eye Color", AInfo["Eye Color"], subGroupName));
            if (AInfo["Legally Blind"] == "Yes") {
                newAInfo.push(new NewTblDef("Legally Blind", 'Y', subGroupName));
            }
            if (AInfo["Legally Blind"] == "No") {
                newAInfo.push(new NewTblDef("Legally Blind", 'N', subGroupName));
            }
            if (AInfo["Permanent Disability"] == "Yes") {
                newAInfo.push(new NewTblDef("Permanent Disability", 'Y', subGroupName));
            }
            if (AInfo["Permanent Disability"] == "No") {
                newAInfo.push(new NewTblDef("Permanent Disability", 'N', subGroupName));
            }
            newAInfo.push(new NewTblDef("Permanent Disability Number", AInfo["Permanent Disability Number"], subGroupName));
            if (AInfo["Native American?"] == "Yes") {
                newAInfo.push(new NewTblDef("Native American?", 'Y', subGroupName));
            }
            if (AInfo["Native American?"] == "No") {
                newAInfo.push(new NewTblDef("Native American?", 'N', subGroupName));
            }

            subGroupName = "MILITARY ACTIVE SERVICE STATUS";
            if (AInfo["Military Serviceman"] == "Yes") {
                newAInfo.push(new NewTblDef("Military Serviceman", 'Y', subGroupName));
            }
            if (AInfo["Military Serviceman"] == "No") {
                newAInfo.push(new NewTblDef("Military Serviceman", 'N', subGroupName));
            }
            newAInfo.push(new NewTblDef("NY Organized Militia", AInfo["NY Organized Militia"], subGroupName));
            newAInfo.push(new NewTblDef("NY Organized Militia Type", AInfo["NY Organized Militia Type"], subGroupName));
            newAInfo.push(new NewTblDef("U.S. Reserve Member", AInfo["U.S. Reserve Member"], subGroupName));
            newAInfo.push(new NewTblDef("U.S. Reserve Member Type", AInfo["U.S. Reserve Member Type"], subGroupName));
            newAInfo.push(new NewTblDef("Full-time U.S. Armed Service", AInfo["Full-time U.S. Armed Service"], subGroupName));
            newAInfo.push(new NewTblDef("Full-time U.S. Armed Service Type", AInfo["Full-time U.S. Armed Service Type"], subGroupName));
            newAInfo.push(new NewTblDef("Grade / Rank", AInfo["Grade / Rank"], subGroupName));
            newAInfo.push(new NewTblDef("Unit Name", AInfo["Unit Name"], subGroupName));
            newAInfo.push(new NewTblDef("Location", AInfo["Location"], subGroupName));
            newAInfo.push(new NewTblDef("Name of Commanding Officer", AInfo["Name of Commanding Officer"], subGroupName));
            newAInfo.push(new NewTblDef("Phone of Commanding Officer", AInfo["Phone of Commanding Officer"], subGroupName));
            newAInfo.push(new NewTblDef("Affirmation", AInfo["Affirmation"], subGroupName));
            newAInfo.push(new NewTblDef("Affidavit Date", AInfo["Affidavit Date"], subGroupName));

            //SANVI
            var peopleModel = getOutput(aa.people.getPeople(peopleSequenceNumber), "");
            setContactASI(peopleModel.getTemplate(), newAInfo);

            createEducUpdCond(peopleModel);

            //Set contact ASIT using cap asit: assumption is both are identical
            var groupName = "ASIT_APPLCNT";
            copyCapASIT(peopleModel, groupName, "LAND OWNER INFORMATION");
            copyCapASIT(peopleModel, groupName, "ANNUAL DISABILITY");
            //JIRA-49638
            deleteContactASIT(peopleModel, groupName, "ANNUAL DISABILITY");
            copyCapASIT(peopleModel, groupName, "SPORTSMAN EDUCATION");
            copyCapASIT(peopleModel, groupName, "PREVIOUS LICENSE");

            //Set DEC ID/passport number
            if (isNull(peopleModel.getPassportNumber(), '') == '') {
                peopleModel.setPassportNumber(peopleSequenceNumber);
            }

            aa.people.editPeople(peopleModel);

            //var subGroupArray = getTemplateValueByFormArrays(peopleModel.getTemplate(), null, null);
            //GetAllASI(subGroupArray);
            //var gArray = getTemplateValueByTableArrays(peopleModel.getTemplate());
            //GetAllASIT(gArray);

            //Set people templateFields 
            if (peopTemplateAttribute != null || peopTemplateAttribute.size() > 0) {
                var aKeys = peopTemplateAttribute.keySet().toArray();
                for (var i = 0; i < aKeys.length; i++) {
                    editContactPeopleTemplateAttribute(peopleSequenceNumber, aKeys[i], peopTemplateAttribute[aKeys[i]]);
                }
            }
        }
    }
    if (isExpressFlow()) {
        if (peopleSequenceNumber != null) {
            //Set contact ASI using cap asi
            var newAInfo = new Array();
            var subGroupName = "ADDITIONAL INFO";
            newAInfo.push(new NewTblDef("Parent Driver License Number", AInfo["A_Parent_Driver_License_Number"], subGroupName));
            newAInfo.push(new NewTblDef("NY Resident Proof Document", AInfo["A_NY_Resident_Proof_Document"], subGroupName));
            newAInfo.push(new NewTblDef("Are You New York Resident?", AInfo["A_IsNYResident"], subGroupName));

            var peopleModel = getOutput(aa.people.getPeople(peopleSequenceNumber), "");
            setContactASI(peopleModel.getTemplate(), newAInfo);

            //Set DEC ID/passport number
            if (isNull(peopleModel.getPassportNumber(), '') == '') {
                peopleModel.setPassportNumber(peopleSequenceNumber);
            }

            aa.people.editPeople(peopleModel);

            //Set people templateFields 
            if (peopTemplateAttribute != null || peopTemplateAttribute.size() > 0) {
                var aKeys = peopTemplateAttribute.keySet().toArray();
                for (var i = 0; i < aKeys.length; i++) {
                    editContactPeopleTemplateAttribute(peopleSequenceNumber, aKeys[i], peopTemplateAttribute[aKeys[i]]);
                }
            }
        }
    }

    //logDebug("Elapsed Time: " + elapsed());
    logDebug("EXIT: updateContacts");
}
function editContactPeopleTemplateAttribute(peopleSequenceNumber, pAttributeName, pNewAttributeValue) {
    var peopAttrResult = aa.people.getPeopleAttributeByPeople(peopleSequenceNumber, "Individual");

    if (!peopAttrResult.getSuccess())
    { logDebug("**WARNING retrieving reference license professional attribute: " + peopAttrResult.getErrorMessage()); return false }

    var peopAttrArray = peopAttrResult.getOutput();
    var attrfound = false;
    for (i in peopAttrArray) {
        if (pAttributeName.equals(peopAttrArray[i].getAttributeName())) {
            var oldValue = peopAttrArray[i].getAttributeValue()
            attrfound = true;
            break;
        }
    }

    if (attrfound) {
        peopAttrArray[i].setAttributeValue(pNewAttributeValue);
    }
    else {
        logDebug("**WARNING attribute: " + pAttributeName + " not found for people seq " + peopleSequenceNumber);
    }

}
function copyCapASIT(peopleModel, groupName, subGroupName) {
    var appSpecificTableScript = aa.appSpecificTableScript.getAppSpecificTableModel(capId, subGroupName).getOutput();

    if (appSpecificTableScript) {
        var appSpecificTable = appSpecificTableScript.getAppSpecificTableModel();
        var tableFields = appSpecificTable.getTableFields();
        //var groupName = appSpecificTable.getGroupName();
        //Contact ASIT subGroupName is equal to cap ASIT subGroupName

        if (tableFields.size() > 0) {
            copyCapASITtoContactASITTableRow(peopleModel.getTemplate(), subGroupName, groupName, tableFields);
        }
    }
    else {
        logDebug("copyCapASIT: Can't copy table " + subGroupName + " because it doesn't exist on the record");
    }
}
function CreateTags(tagsArray, ruleParams, decCode, fullfilmentCondition) {
    logDebug("ENTER: CreateTags");

    var itemCap = capId;
    var wmuResult = null;
    if (arguments.length > 4) wmuResult = arguments[4]; // use wmuresult specified in args
    if (arguments.length > 5) itemCap = arguments[5]; // use cap ID specified in args

    var seasonPeriod = GetDateRange(DEC_CONFIG, LICENSE_SEASON, ruleParams.Year);
    var diff = dateDiff(new Date(), seasonPeriod[0]);

    if (tagsArray != null) {
        //Maintain Tag creation dictinary.
        if (dictTags == null) {
            dictTags = new DecMapper('Tags');
        }

        for (var item in tagsArray) {
            var tagProp = tagsArray[item];
            logDebug("CreateTags: Tag item " + tagProp.RecordType);
            if (tagProp != null) {
                logDebug("NOT NULL TAG PROP");
                logDebug("CreateTags:  dictTags.Lookup(" + tagProp.TagType + ") = " + dictTags.Lookup(tagProp.TagType));
                // JHS 12/4/2013 defect 16941:  we can have more than one DMP added at a time
                if ((tagProp.TagType == TAG_TYPE_4_DMP_DEER_TAG && wmuResult && wmuResult.WMU) || dictTags.Lookup(tagProp.TagType) == null) {
                    var isOkToCreate = checkRuletoCreateTag(ruleParams, tagProp, dictTags);
                    logDebug("isOkToCreate: " + isOkToCreate);
                    if (isOkToCreate) {
                        var ats = tagProp.RecordType;
                        var ata = ats.split("/");
                        for (var idx = 0; idx < tagProp.issuecount; idx++) {
                            if (ata.length != 4) {
                                logDebug("**ERROR in CreateTags.  The following Application Type String is incorrectly formatted: " + ats);
                            } else {
                                var newLicId = issueSubLicense(ata[0], ata[1], ata[2], ata[3], "Active", itemCap);
                                var tagCodeDescription = GetTagTypedesc(tagProp.TagType);
                                editAppName(tagCodeDescription, newLicId);

                                var effectiveDt;
                                var clacFromDt;
                                if (diff > 0) {
                                    AInfo["CODE.Effective Date"] = jsDateToMMDDYYYY(seasonPeriod[0]);
                                    editFileDate(newLicId, seasonPeriod[0]);
                                    clacFromDt = dateAdd(convertDate(seasonPeriod[1]), 0);
                                    setLicExpirationDate(newLicId, "", clacFromDt);
                                } else {
                                    AInfo["CODE.Effective Date"] = jsDateToMMDDYYYY(new Date());
                                    editFileDate(newLicId, new Date());
                                    clacFromDt = dateAdd(convertDate(seasonPeriod[1]), 0);
                                    setLicExpirationDate(newLicId, "", clacFromDt);
                                }

                                AInfo["CODE.TAG_TYPE"] = tagProp.TagType;
                                var newDmpTagArray = new Array();
                                if (AInfo["CODE.NEW_DOC_CAP_ID"]) {
                                    newDmpTagArray = AInfo["CODE.NEW_DOC_CAP_ID"];
                                }
                                newDmpTagArray.push(newLicId);
                                AInfo["CODE.NEW_DOC_CAP_ID"] = newDmpTagArray;
                                setSalesItemASI(newLicId, tagProp.RecordType, decCode, 1, wmuResult, null);

                                var newDecDocId = GenerateDocumentNumber(newLicId.getCustomID());
                                updateDocumentNumber(newDecDocId, newLicId);
                                AInfo["CODE.NEW_DEC_DOCID"] = newDecDocId;
                            }
                        }
                        dictTags.Add(tagProp.TagType, tagProp);
                    }
                }
            } else {
                logDebug("NULL TAGPROP");
            }
        }
    }

    logDebug("EXIT: CreateTags");
}
function issueSubLicense(typeLevel1, typeLevel2, typeLevel3, typeLevel4, initStatus) {
    logDebug("ENTER: issueSubLicense");
    //logDebug("Elapsed Time: " + elapsed());

    //typeLevel3 - record status to set the license to initially                        
    //typeLevel4 - copy ASI from Application to License? (true/false)                       
    //createRefLP - create the reference LP (true/false)                        
    //licHolderSwitch - switch the applicant to license holder                      

    var itemCap = capId
    if (arguments.length > 5) itemCap = arguments[5]; // use cap ID specified in args

    var newLic = null;
    var newLicId = null;
    var newLicIdString = null;

    //create the license record                     
    newLicId = createChildForDec(typeLevel1, typeLevel2, typeLevel3, typeLevel4, null, itemCap);
    newLicIdString = newLicId.getCustomID();

    //updateTask("Issuance", "Active", "", "", "", newLicId);
    closeTaskForRec("Issuance", "Active", "", "", "", newLicId);
    updateAppStatus(initStatus, "Active", newLicId);
    activateTaskForRec("Report Game Harvest", "", newLicId);
    activateTaskForRec("Void Document", "", newLicId);
    activateTaskForRec("Revocation", "", newLicId);
    activateTaskForRec("Suspension", "", newLicId);

    //logDebug("Elapsed Time: " + elapsed());
    logDebug("EXIT: issueSubLicense");
    return newLicId;
}

function issueSelectedSalesItems(frm) {
    logDebug("ENTER: issueSelectedSalesItems");
    //logDebug("Elapsed Time: " + elapsed());
    //var feeArr = frm.getAllFeeToAdd();
    //    removeAllFees(capId);
    //    for (item in feeArr) {
    //        logDebug(feeArr[item].feeCode);
    //        addFeeWithVersion(feeArr[item].feeCode, feeArr[item].feeschedule, feeArr[item].version, "FINAL", feeArr[item].feeUnit, "Y");
    //    }

    //balanceDue == 0 ^ 
    closeTask("Issuance", "Approved", "", "");

    //if (appMatch("Licenses/Annual/Application/NA")) {
    if (appTypeString == 'Licenses/Annual/Application/NA' || isExpressFlow()) {
        var seasonPeriod = GetDateRange(DEC_CONFIG, LICENSE_SEASON, frm.Year);
        clacFromDt = dateAdd(convertDate(seasonPeriod[1]), 0);
        setLicExpirationDate(capId, "", clacFromDt);
    }
    var arryTargetCapAttrib = new Array();
    var arryAccumTags = new Array();

    var uObj = new USEROBJ(publicUserID);
    salesAgentInfoArray = getAgentInfo(publicUserID, uObj);
    attachAgent(uObj);
    if (appTypeString == 'Licenses/Other/Sales/Application') {
        attachedContacts();
    }

    //Mark Fullfillment
    var fullfillCond = '';
    var isPublicUser = (uObj.acctType == 'CITIZEN');

    var condFulfill = new COND_FULLFILLMENT();
    if (isPublicUser) {
        fullfillCond = condFulfill.Condition_DailyInternetSales;
    } else {
        var isCallcenter = (salesAgentInfoArray["Agent Group"] == "Call Center" || salesAgentInfoArray["Agent Group"] == "Call Centre");
        var isCampsite = (salesAgentInfoArray["Agent Group"] == "Campsite");
        var isMunicipality = (salesAgentInfoArray["Agent Group"] == "Municipality");
        var isNYSDEC_HQ = (salesAgentInfoArray["Agent Group"] == "NYSDEC HQ");
        var isNYSDEC_Regional_Office = (salesAgentInfoArray["Agent Group"] == "NYSDEC Regional Office");
        var isNative_American_Agency = (salesAgentInfoArray["Agent Group"] == "Native American Agency");
        var isRetail = (salesAgentInfoArray["Agent Group"] == "Retail");

        if (isCallcenter) {
            fullfillCond = condFulfill.Condition_DailyCallCenterSales;
        }
    }

    //logDebug("Elapsed Time: " + elapsed());

    var allDecCodes = frm.getAllDecCodes();
    var recArr = frm.licObjARRAY;
    var ruleParams = frm.getRulesParam();
    ruleParams.AgeLookAhead30Days = frm.getAge(dateAdd(new Date(frm.DOB), -30));
    var seasonPeriod = GetDateRange(DEC_CONFIG, LICENSE_SEASON, frm.Year);
    var diff = dateDiff(new Date(), seasonPeriod[0]);

    // sort the license object array

    var sortedRecArray = [];
    for (var key in recArr) sortedRecArray.push(recArr[key]);

    sortedRecArray.sort(function (a, b) { return (a.sortOrder - b.sortOrder); });

    for (var idx = 0; idx < sortedRecArray.length; idx++) {
        var oLic = sortedRecArray[idx];
        var wmu1Result;
        var wmu2Result;

        if (oLic.IsSelected) {
            //If DMP Application is selected then Run Lottery
            //Add Conditions for each WMU selection
            var ats = oLic.RecordType;
            logDebug("issueSelectedSalesItems item : " + ats);
            if (isNull(oLic.RecordType, '') != '') {
                var ata = ats.split("/");
                if (ata.length != 4) {
                    logDebug("**ERROR in issueSelectedSalesItems.  The following Application Type String is incorrectly formatted: " + ats);
                } else {
                    var newfd = new FeeDef();

                    if (appTypeString == 'Licenses/Other/Sales/ApplicationX') {
                        newfd.feeschedule = oLic.feeschedule;
                        newfd.version = oLic.feeversion;
                        newfd.feeCode = oLic.feecode;
                        newfd.formula = oLic.formula;
                        newfd.feeUnit = oLic.feeUnit;
                        newfd.feeDesc = oLic.feeDesc;
                        newfd.comments = oLic.comments;
                        newfd.Code3commission = oLic.Code3commission;
                    } else {
                        newfd.feeschedule = oLic.feeschedule;
                        newfd.version = oLic.feeversion;
                        //newfd.feeCode = oLic.feecode;
                        //newfd.formula = oLic.formula;
                        //newfd.feeUnit = oLic.feeUnit;
                        //newfd.feeDesc = oLic.feeDesc;
                        //newfd.comments = oLic.comments;
                        //newfd.Code3commission = oLic.Code3commission;

                        if ((typeof (FEESTOTRANSFER) == "object")) {
                            for (var y in FEESTOTRANSFER) {
                                if (FEESTOTRANSFER[y]["feeschedule"] == oLic.feeschedule) {
                                    newfd.feeCode = FEESTOTRANSFER[y]["feecode"];
                                    newfd.formula = FEESTOTRANSFER[y]["formula"];
                                    newfd.feeUnit = FEESTOTRANSFER[y]["feeUnit"];
                                    newfd.feeDesc = FEESTOTRANSFER[y]["feeDesc"];
                                    newfd.comments = FEESTOTRANSFER[y]["comments"];
                                    newfd.Code3commission = FEESTOTRANSFER[y]["Code3commission"];
                                    //JIRA-47359
                                    oLic.feeUnit = newfd.feeUnit;
                                    break;
                                }
                            }
                        }
                    }
                    //JIRA - 18274
                    if (ats == AA27_CONSERVATION_LEGACY) {
                        newfd.formula = 5.28;
                        newfd.Code3commission = getComboComission(newfd.Code3commission, 100);
                    }
                    if (ats == AA21_CONSERVATION_PATRON) {
                        newfd.formula = 0.66;
                        newfd.Code3commission = getComboComission(newfd.Code3commission, 100);
                    }
                    //

                    oLic.DecCode = GetItemCode(newfd.Code3commission + "");
                    oLic.CodeDescription = GetItemCodedesc(oLic.DecCode);

                    //Get Tgs
                    var TagsArray = null;
                    if (isNull(oLic.FNTagsArray, '') != '') {
                        eval("TagsArray = " + oLic.FNTagsArray + "(ruleParams);");
                    }
                    oLic.TagsArray = TagsArray;

                    if (exists(TAG_TYPE_19_DEER_OF_EITHER_SEX_TAG, oLic.TagsArray)) {
                        ruleParams.SetEitherOrAntler(4);
                    }

                    if (exists(TAG_TYPE_20_ANTLERLESS_DEER_TAG, oLic.TagsArray)) {
                        ruleParams.SetEitherOrAntler(8);
                    }

                    var isDMPApp = (oLic.RecordType == AA05_DEER_MANAGEMENT_PERMIT);
                    if (isDMPApp) {
                        var wmu1 = AInfo["WMU Choice 1"];
                        var wmu1ApplyLO = AInfo["Apply Land Owner for Choice1"];
                        var wmu2 = AInfo["WMU Choice 2"];
                        var wmu2ApplyLO = AInfo["Apply Land Owner for Choice2"];
                        var syear = AInfo["License Year"];
                        var activeHoldings = frm.ActiveHoldingsInfo;
                        var applyIBPCond = false;
                        var tagPropArray = new Array();
                        for (var t in oLic.TagsArray) {
                            //var tagProp = tagsMap.get(arryAccumTags[t]);
                            var tagProp = tagsMap.get(oLic.TagsArray[t]);
                            tagPropArray.push(tagProp);
                        }

                        if (wmu1 != null && wmu1 != 'NA') {
                            wmu1Result = RunDMPLottery(frm, syear, wmu1, 1, wmu1ApplyLO, activeHoldings, frm.PreferencePoints);
                            if (wmu1Result.Selected) {
                                CreateTags(tagPropArray, ruleParams, allDecCodes, "", wmu1Result);

                                addStdConditionWithComments("DMP Application Result", "WMU Choice 1", " - " + wmu1 + ":  SELECTED", AInfo["CODE.NEW_DEC_DOCID"]);
                            } else {
                                addStdConditionWithComments("DMP Application Result", "WMU Choice 1", " - " + wmu1 + ":  NOT SELECTED", "1 Preference Point");
                                applyIBPCond = true;
                            }
                        }
                        if (wmu2 != null && wmu1 != 'NA' && (wmu1 != wmu2 || wmu1Result.Selected == true)) {
                            wmu2Result = RunDMPLottery(frm, syear, wmu2, 2, wmu2ApplyLO, activeHoldings, wmu1Result.PreferencePoints);
                            if (wmu2Result.Selected) {
                                CreateTags(tagPropArray, ruleParams, allDecCodes, "", wmu2Result);
                                addStdConditionWithComments("DMP Application Result", "WMU Choice 2", " - " + wmu2 + ":  SELECTED", AInfo["CODE.NEW_DEC_DOCID"]);
                            } else {
                                addStdConditionWithComments("DMP Application Result", "WMU Choice 2", " - " + wmu2 + ":  NOT SELECTED");
                                applyIBPCond = true;
                            }
                        }
                    }

                    var newLicId = issueSubLicense(ata[0], ata[1], ata[2], ata[3], "Active");
                    editAppName(oLic.CodeDescription, newLicId);

                    var effectiveDt;
                    var clacFromDt;
                    if (ats == AA24_NONRESIDENT_1_DAY_FISHING || ats == AA03_ONE_DAY_FISHING_LICENSE) {
                        effectiveDt = AInfo["Effective Date One Day Fishing"];
                        editFileDate(newLicId, effectiveDt);
                        AInfo["CODE.Effective Date"] = effectiveDt;
                        clacFromDt = dateAdd(convertDate(effectiveDt), -1);
                        setLicExpirationDate(newLicId, clacFromDt);
                    }
                    else if (ats == AA25_NONRESIDENT_7_DAY_FISHING || ats == AA26_SEVEN_DAY_FISHING_LICENSE) {
                        effectiveDt = AInfo["Effective Date Seven Day Fishing"];
                        editFileDate(newLicId, effectiveDt);
                        AInfo["CODE.Effective Date"] = effectiveDt;
                        clacFromDt = dateAdd(convertDate(effectiveDt), -1);
                        setLicExpirationDate(newLicId, clacFromDt);
                        //} else if (ats == AA23_NONRES_FRESHWATER_FISHING || ats == AA22_FRESHWATER_FISHING || ats == AA66_FRESHWATER_FISHING_3Y || ats == AA67_FRESHWATER_FISHING_5Y) {
                    } else if (ats == AA23_NONRES_FRESHWATER_FISHING || ats == AA22_FRESHWATER_FISHING) {
                        //JIRA: 21268
                        if (frm.isAfterSwitchDate()) {
                            effectiveDt = AInfo["Effective Date Fishing"];
                            editFileDate(newLicId, effectiveDt);
                            AInfo["CODE.Effective Date"] = effectiveDt;
                            clacFromDt = dateAdd(convertDate(effectiveDt), -1);
                            setLicExpirationDate(newLicId, clacFromDt);
                        } else {
                            if (diff > 0) {
                                AInfo["CODE.Effective Date"] = jsDateToMMDDYYYY(seasonPeriod[0]);
                                editFileDate(newLicId, seasonPeriod[0]);
                                clacFromDt = dateAdd(convertDate(seasonPeriod[1]), 0);
                                setLicExpirationDate(newLicId, "", clacFromDt);
                            } else {
                                AInfo["CODE.Effective Date"] = jsDateToMMDDYYYY(new Date());
                                editFileDate(newLicId, new Date());
                                clacFromDt = dateAdd(convertDate(seasonPeriod[1]), 0);
                                setLicExpirationDate(newLicId, "", clacFromDt);
                            }
                        }
                        //
                    } else if (ats == AA02_MARINE_REGISTRY) {
                        //JIRA: 21269
                        effectiveDt = AInfo["Effective Date Marine"];
                        editFileDate(newLicId, effectiveDt);
                        AInfo["CODE.Effective Date"] = effectiveDt;
                        //JIRA: 48336
                        //clacFromDt = dateAdd(convertDate(effectiveDt), 0);
                        clacFromDt = dateAdd(convertDate(effectiveDt), -1);
                        setLicExpirationDate(newLicId, clacFromDt);
                        //
                    }
                    else if (ata[1] == "Other") {
                        AInfo["CODE.Effective Date"] = jsDateToMMDDYYYY(new Date());
                        //JIRA-18322
                        editFileDate(newLicId, new Date());
                        clacFromDt = dateAdd(convertDate(seasonPeriod[1]), 0);
                        setLicExpirationDate(newLicId, "", clacFromDt);
                        //
                    }
                    else if (ata[1] == "Lifetime") {
                        setLicExpirationDate(newLicId, dateAdd(null, 0));
                        AInfo["CODE.Effective Date"] = jsDateToMMDDYYYY(new Date());
                    } else {
                        if (diff > 0) {
                            AInfo["CODE.Effective Date"] = jsDateToMMDDYYYY(seasonPeriod[0]);
                            editFileDate(newLicId, seasonPeriod[0]);
                            clacFromDt = dateAdd(convertDate(seasonPeriod[1]), 0);
                            setLicExpirationDate(newLicId, "", clacFromDt);
                        } else {
                            AInfo["CODE.Effective Date"] = jsDateToMMDDYYYY(new Date());
                            editFileDate(newLicId, new Date());
                            clacFromDt = dateAdd(convertDate(seasonPeriod[1]), 0);
                            setLicExpirationDate(newLicId, "", clacFromDt);
                        }
                    }

                    if (ats == AA05_DEER_MANAGEMENT_PERMIT) {
                        //connect tag to DMP record
                        if (AInfo["CODE.NEW_DOC_CAP_ID"]) {
                            var newDmpTagArray = AInfo["CODE.NEW_DOC_CAP_ID"];
                            for (y in newDmpTagArray) {
                                var newTagRecId = newDmpTagArray[y];
                                if (newTagRecId != undefined && isNull(newTagRecId, '') != '') {
                                    logDebug("---");
                                    logDebug(newTagRecId)
                                    logDebug("-----");
                                    var result = aa.cap.createAppHierarchy(newLicId, newTagRecId);
                                    if (result.getSuccess()) {
                                        logDebug("Parent DMP successfully linked");
                                    }
                                    else {
                                        logDebug("Could not link DMP" + result.getErrorMessage());
                                    }
                                }
                            }
                        }

                        if (applyIBPCond) {
                            addStdConditionWithComments("DMP Application Result", "Set for IBP Choice", "Set for IBP Choice", "", newLicId);
                        }

                    }
                    setSalesItemASI(newLicId, oLic.RecordType, oLic.DecCode, oLic.feeUnit, wmu1Result, wmu2Result);
                    var newDecDocId = GenerateDocumentNumber(newLicId.getCustomID());
                    updateDocumentNumber(newDecDocId, newLicId);

                    //maintain array for later actions
                    if (ats == AA21_CONSERVATION_PATRON || ats == AA27_CONSERVATION_LEGACY) {
                        arryTargetCapAttrib.push(new TargetCAPAttrib(newLicId, newfd, true));
                    } else {
                        arryTargetCapAttrib.push(new TargetCAPAttrib(newLicId, newfd));
                    }
                    if (oLic.TagsArray != null) {
                        var arraytmp = arrayUnique(arryAccumTags.concat(oLic.TagsArray));
                        arryAccumTags = arraytmp;
                    }

                    //JIRA - 18274
                    if (ats == AA27_CONSERVATION_LEGACY) {
                        //Habitat Stamp  79.85 out of 96.00
                        var superSportArray = createComboSuperSportsman(ruleParams, 1, 79.85);
                        arryTargetCapAttrib.push(new TargetCAPAttrib(superSportArray[0], superSportArray[1], true));

                        //Habitat Stamp  4.72 out of 96.00
                        var habitatArray = createComboHabitatStamp(ruleParams, 1, 4.72);
                        arryTargetCapAttrib.push(new TargetCAPAttrib(habitatArray[0], habitatArray[1], true));

                        //Conservationist 6.62 out of 96.00
                        var conservationistArray = createComboConservationist(ruleParams, 1, 6.15);
                        arryTargetCapAttrib.push(new TargetCAPAttrib(conservationistArray[0], conservationistArray[1], true));
                    }
                    if (ats == AA21_CONSERVATION_PATRON) {
                        //Habitat Stamp  4.72 out of 12.00
                        var habitatArray = createComboHabitatStamp(ruleParams, oLic.feeUnit, 4.72);
                        arryTargetCapAttrib.push(new TargetCAPAttrib(habitatArray[0], habitatArray[1], true));

                        //Conservationist 6.62 out of 12.00
                        var conservationistArray = createComboConservationist(ruleParams, oLic.feeUnit, 6.62);
                        arryTargetCapAttrib.push(new TargetCAPAttrib(conservationistArray[0], conservationistArray[1], true));
                    }
                    //
                }
            }
        }
    }

    //Tag Creation
    var tagPropArray = new Array();
    for (var t in arryAccumTags) {
        var tagProp = tagsMap.get(arryAccumTags[t]);
        if (tagProp.TagType != TAG_TYPE_4_DMP_DEER_TAG) {
            tagPropArray.push(tagProp);
        }
    }
    CreateTags(tagPropArray, ruleParams, allDecCodes, fullfillCond);
    createPrivilagePanel(ruleParams);

    distributeFeesAndPayments(capId, arryTargetCapAttrib, salesAgentInfoArray);

    if (appTypeString == 'Licenses/Annual/Application/NA' || isExpressFlow()) {
        updateContacts();
        if (!hmfulfilmmentCond.containsKey(fullfillCond)) {
            hmfulfilmmentCond.put(fullfillCond, fullfillCond);
        }
        addFullfillmentConditionArray(capId, hmfulfilmmentCond.keySet().toArray());
    }
    //logDebug("Elapsed Time: " + elapsed());
    logDebug("EXIT: issueSelectedSalesItems");
}

function createPrivilagePanel(ruleParams) {
    var arryTags_Priv = new Array();
    arryTags_Priv.push(new TagProp(LIC54_TAG_PRIV_PANEL, AA54_TAG_PRIV_PANEL, "", TAG_TYPE_24_PRIV_PANEL, 1));
    CreateTags(arryTags_Priv, ruleParams, null, '');
}
function RunDMPLottery(frm, syear, swmu, schoicenum, isApplyLO, activeHoldings, nPreferencePoints) {
    var currDrawType = getDrawTypeByPeriod(syear, frm);

    var ruleParams = frm.getRulesParam();

    var drw = new Draw_Obj(syear, swmu, schoicenum, currDrawType, isApplyLO);
    drw.IsNyResiDent = ruleParams.IsNyResiDent || ruleParams.HasLifetimelic();
    drw.IsDisableForYear = ruleParams.IsDisableForYear;
    drw.IsMilitaryServiceman = ruleParams.IsMilitaryServiceman;
    drw.PreferencePoints = nPreferencePoints;
    drw.Age = ruleParams.Age;
    drw.Gender = ruleParams.Gender;
    drw.IsMinor = ruleParams.IsMinor;
    drw.IsLegallyBlind = ruleParams.IsLegallyBlind;
    drw.HasBowHunt = ruleParams.HasBowHunt;
    drw.HasTrapEd = ruleParams.HasTrapEd;
    drw.HasHuntEd = ruleParams.HasHuntEd;
    drw.havedefinedItems = hasWmuDefinedItems(activeHoldings);

    var drawResult = drw.RunLottery();
    debugObject(drawResult);
    return drawResult;
}
function SetformForSelectedLics(frm) {
    logDebug("ENTER: SetformForSelectedLics");

    //var frm = new form_OBJECT(GS2_SCRIPT);
    frm.Year = AInfo["License Year"];
    frm.DOB = AInfo["A_birthDate"];
    frm.Email = AInfo["A_email"];
    frm.IsNyResiDent = AInfo["A_IsNYResident"];
    frm.IsMilitaryServiceman = AInfo["Military Serviceman"];
    frm.IsNativeAmerican = AInfo["A_IsNativeAmerican"];
    frm.IsLegallyBlind = AInfo["Legally Blind"];
    frm.PreferencePoints = AInfo["A_Preference_Points"];
    frm.SetAnnualDisability(AInfo["A_Annual_Disability"]);
    frm.SetPriorLicense(AInfo["A_Previous_License"]);
    frm.SetSportsmanEducation(AInfo["A_Sportsman_Education"]);
    frm.SetLandOwnerInfo(AInfo["A_Land_Owner_Information"]);
    frm.SetActiveHoldingsInfo(AInfo["A_ActiveHoldings"]);
    frm.Quantity_Trail_Supporter_Patch = AInfo["Quantity Trail Supporter Patch"];
    frm.Quantity_Venison_Donation = AInfo["Quantity Venison Donation"];
    frm.Quantity_Conservation_Patron = AInfo["Quantity Conservation Patron"];
    frm.Quantity_Conservation_Fund = AInfo["Quantity Conservation Fund"];
    frm.Quantity_Conservationist_Magazine = AInfo["Quantity Conservationist Magazine"];
    frm.Quantity_Habitat_Stamp = AInfo["Quantity Habitat/Access Stamp"];
    frm.Inscription = AInfo["Inscription"];
    frm.IsPermanentDisabled = AInfo["Permanent Disability"];
    frm.DriverLicenseState = AInfo["A_Driver_License_State"];
    frm.DriverLicenseNumber = AInfo["A_Driver_License_Number"];
    frm.NonDriverLicenseNumber = AInfo["A_Non_Driver_License_Number"];

    //ASIT info
    frm.ClearLandOwnerInfo();
    if (typeof (LANDOWNERINFORMATION) == "object") {
        for (y in LANDOWNERINFORMATION) {
            frm.AddLandOwnerInfo(LANDOWNERINFORMATION[y]["License Year"],
                LANDOWNERINFORMATION[y]["SWIS Code"],
                LANDOWNERINFORMATION[y]["Tax Map ID/Parcel ID"],
                LANDOWNERINFORMATION[y]["Check this box to use this landowner parcel for your DMP application"]);
        }
    }

    frm.ClearAnnualDisability();
    if (typeof (ANNUALDISABILITY) == "object") {
        for (y in ANNUALDISABILITY) {
            frm.AddAnnualDisability(ANNUALDISABILITY[y]["Year"],
                ANNUALDISABILITY[y]["Annual Disability Case Number"],
                ANNUALDISABILITY[y]["40%+ Military Disabled"]);
        }
    }

    frm.ClearSportsmanEducation();
    if (typeof (SPORTSMANEDUCATION) == "object") {
        for (y in SPORTSMANEDUCATION) {
            frm.AddSportsmanEducation(SPORTSMANEDUCATION[y]["Sportsman Education Type"],
                SPORTSMANEDUCATION[y]["Certificate Number"],
                SPORTSMANEDUCATION[y]["State"],
                SPORTSMANEDUCATION[y]["Country"],
                SPORTSMANEDUCATION[y]["Other Country"]);
        }
    }

    frm.ClearPriorLicense();
    if (typeof (PREVIOUSLICENSE) == "object") {
        for (y in PREVIOUSLICENSE) {
            frm.AddPriorLicense(PREVIOUSLICENSE[y]["Previous License Type"],
                PREVIOUSLICENSE[y]["License Date"],
                PREVIOUSLICENSE[y]["License Number"],
                PREVIOUSLICENSE[y]["State"],
                PREVIOUSLICENSE[y]["Country"],
                PREVIOUSLICENSE[y]["Other Country"],
                PREVIOUSLICENSE[y]["Verified_By"]);
        }
    }

    frm.SetSelected(LIC01_JUNIOR_HUNTING_TAGS, (AInfo["Junior Hunting Tags"] == "CHECKED"), 1);
    frm.SetSelected(LIC02_MARINE_REGISTRY, (AInfo["Marine Registry"] == "CHECKED"), 1);
    frm.SetSelected(LIC03_ONE_DAY_FISHING_LICENSE, (AInfo["One Day Fishing License"] == "CHECKED"), 1);
    frm.SetSelected(LIC05_DEER_MANAGEMENT_PERMIT, (AInfo["Deer Management Permit"] == "CHECKED"), 1);
    frm.SetSelected(LIC06_HUNTING_LICENSE, (AInfo["Hunting License"] == "CHECKED"), 1);
    frm.SetSelected(LIC08_TURKEY_PERMIT, (AInfo["Turkey Permit"] == "CHECKED"), 1);
    frm.SetSelected(LIC10_LIFETIME_FISHING, (AInfo["Lifetime Fishing"] == "CHECKED"), 1);
    frm.SetSelected(LIC12_LIFETIME_SMALL_AND_BIG_GAME, (AInfo["Lifetime Small & Big Game"] == "CHECKED"), 1);
    frm.SetSelected(LIC13_LIFETIME_SPORTSMAN, (AInfo["Lifetime Sportsman"] == "CHECKED"), 1);
    frm.SetSelected(LIC14_LIFETIME_TRAPPING, (AInfo["Lifetime Trapping"] == "CHECKED"), 1);
    frm.SetSelected(LIC15_TRAPPING_LICENSE, (AInfo["Trapping License"] == "CHECKED"), 1);
    frm.SetSelected(LIC16_HABITAT_ACCESS_STAMP, (AInfo["Habitat/Access Stamp"] == "CHECKED"), 1);
    frm.SetSelected(LIC17_VENISON_DONATION, (AInfo["Venison Donation"] == "CHECKED"), 1);
    frm.SetSelected(LIC18_CONSERVATION_FUND, (AInfo["Conservation Fund"] == "CHECKED"), 1);
    frm.SetSelected(LIC19_TRAIL_SUPPORTER_PATCH, (AInfo["Trail Supporter Patch"] == "CHECKED"), 1);
    frm.SetSelected(LIC20_CONSERVATIONIST_MAGAZINE, (AInfo["Conservationist Magazine"] == "CHECKED"), 1);
    frm.SetSelected(LIC21_CONSERVATION_PATRON, (AInfo["Conservation Patron"] == "CHECKED"), 1);
    frm.SetSelected(LIC18_CONSERVATION_FUND, (AInfo["Conservation Fund"] == "CHECKED"), 1);
    frm.SetSelected(LIC19_TRAIL_SUPPORTER_PATCH, (AInfo["Trail Supporter Patch"] == "CHECKED"), 1);
    frm.SetSelected(LIC20_CONSERVATIONIST_MAGAZINE, (AInfo["Conservationist Magazine"] == "CHECKED"), 1);
    frm.SetSelected(LIC21_CONSERVATION_PATRON, (AInfo["Conservation Patron"] == "CHECKED"), 1);
    frm.SetSelected(LIC22_FRESHWATER_FISHING, (AInfo["Freshwater Fishing"] == "CHECKED"), 1);
    frm.SetSelected(LIC23_NONRES_FRESHWATER_FISHING, (AInfo["NonRes Freshwater Fishing"] == "CHECKED"), 1);
    frm.SetSelected(LIC24_NONRESIDENT_1_DAY_FISHING, (AInfo["Nonresident 1 Day Fishing"] == "CHECKED"), 1);
    frm.SetSelected(LIC25_NONRESIDENT_7_DAY_FISHING, (AInfo["Nonresident 7 Day Fishing"] == "CHECKED"), 1);
    frm.SetSelected(LIC26_SEVEN_DAY_FISHING_LICENSE, (AInfo["Seven Day Fishing License"] == "CHECKED"), 1);
    frm.SetSelected(LIC27_CONSERVATION_LEGACY, (AInfo["Conservation Legacy"] == "CHECKED"), 1);
    frm.SetSelected(LIC31_NONRES_SUPER_SPORTSMAN, (AInfo["NonRes Super Sportsman"] == "CHECKED"), 1);
    frm.SetSelected(LIC32_NONRESIDENT_BEAR_TAG, (AInfo["Nonresident Bear Tag"] == "CHECKED"), 1);
    frm.SetSelected(LIC33_NONRESIDENT_BIG_GAME, (AInfo["Nonresident Big Game"] == "CHECKED"), 1);
    frm.SetSelected(LIC35_NONRESIDENT_SMALL_GAME, (AInfo["Nonresident Small Game"] == "CHECKED"), 1);
    frm.SetSelected(LIC36_NONRESIDENT_TURKEY, (AInfo["Nonresident Turkey"] == "CHECKED"), 1);
    frm.SetSelected(LIC37_SMALL_AND_BIG_GAME, (AInfo["Small and Big Game"] == "CHECKED"), 1);
    frm.SetSelected(LIC38_SMALL_GAME, (AInfo["Small Game"] == "CHECKED"), 1);
    frm.SetSelected(LIC39_SPORTSMAN, (AInfo["Sportsman"] == "CHECKED"), 1);
    frm.SetSelected(LIC40_SUPER_SPORTSMAN, (AInfo["Super Sportsman"] == "CHECKED"), 1);
    frm.SetSelected(LIC41_NONRESIDENT_TRAPPING, (AInfo["Nonresident Trapping"] == "CHECKED"), 1);
    frm.SetSelected(LIC42_TRAPPER_SUPER_SPORTSMAN, (AInfo["Trapper Super Sportsman"] == "CHECKED"), 1);
    frm.SetSelected(LIC43_LIFETIME_CARD_REPLACE, (AInfo["Lifetime Card Replace"] == "CHECKED"), 1);
    frm.SetSelected(LIC44_SPORTSMAN_ED_CERTIFICATION, (AInfo["Sportsman Ed Certification"] == "CHECKED"), 1);
    frm.SetSelected(LIC45_LIFETIME_INSCRIPTION, (AInfo["Lifetime Inscription"] == "CHECKED"), 1);
    frm.SetSelected(LIC56_TAG_DRIV_LIC_IMM, (AInfo["Add Lifetime to Driver License Re-Issue Immediately"] == "CHECKED"), 1);
    frm.SetSelected(LIC57_TAG_DRIV_LIC_REN, (AInfo["Add Lifetime to Driver License on Renewal"] == "CHECKED"), 1);
    //frm.SetSelected(LIC55_TAG_DRIV_LIC, (AInfo["Add Lifetime to Driver License"] == "CHECKED"),1);

    // adding these after the main set in order to set the tag pre-requisites properly  JHS 11/7/2013  issue 14045

    frm.SetSelected(LIC04_BOWHUNTING_PRIVILEGE, (AInfo["Bowhunting Privilege"] == "CHECKED"), 2);
    frm.SetSelected(LIC07_MUZZLELOADING_PRIVILEGE, (AInfo["Muzzleloading Privilege"] == "CHECKED"), 2);
    frm.SetSelected(LIC09_LIFETIME_BOWHUNTING, (AInfo["Lifetime Bowhunting"] == "CHECKED"), 2);
    frm.SetSelected(LIC11_LIFETIME_MUZZLELOADING, (AInfo["Lifetime Muzzleloading"] == "CHECKED"), 2);
    frm.SetSelected(LIC28_JUNIOR_BOWHUNTING, (AInfo["Junior Bowhunting"] == "CHECKED"), 2);
    frm.SetSelected(LIC29_JUNIOR_HUNTING, (AInfo["Junior Hunting"] == "CHECKED"), 2);
    frm.SetSelected(LIC30_NONRES_MUZZLELOADING, (AInfo["NonRes Muzzleloading"] == "CHECKED"), 2);
    frm.SetSelected(LIC34_NONRESIDENT_BOWHUNTING, (AInfo["Nonresident Bowhunting"] == "CHECKED"), 2);
    //3-5 Year
    //frm.SetSelected(LIC58_HUNTING_LICENSE_3Y, (AInfo["3 Year Hunting License"] == "CHECKED"), 1);
    //frm.SetSelected(LIC59_HUNTING_LICENSE_5Y, (AInfo["5 Year Hunting License"] == "CHECKED"), 1);
    //frm.SetSelected(LIC60_BOWHUNTING_PRIVILEGE_3Y, (AInfo["3 Year Bowhunting Privilege"] == "CHECKED"), 1);
    //frm.SetSelected(LIC61_BOWHUNTING_PRIVILEGE_5Y, (AInfo["5 Year Bowhunting Privilege"] == "CHECKED"), 1);
    //frm.SetSelected(LIC62_MUZZLELOADING_PRIVILEGE_3Y, (AInfo["3 Year Muzzleloading Privilege"] == "CHECKED"), 1);
    //frm.SetSelected(LIC63_MUZZLELOADING_PRIVILEGE_5Y, (AInfo["5 Year Muzzleloading Privilege"] == "CHECKED"), 1);
    //frm.SetSelected(LIC64_TRAPPING_LICENSE_3Y, (AInfo["3 Year Trapping License"] == "CHECKED"), 1);
    //frm.SetSelected(LIC65_TRAPPING_LICENSE_5Y, (AInfo["5 Year Trapping License"] == "CHECKED"), 1);
    //frm.SetSelected(LIC66_FRESHWATER_FISHING_3Y, (AInfo["3 Year Freshwater Fishing"] == "CHECKED"), 1);
    //frm.SetSelected(LIC67_FRESHWATER_FISHING_5Y, (AInfo["5 Year Freshwater Fishing"] == "CHECKED"), 1);
    //frm.SetSelected(LIC68_TURKEY_PERMIT_3Y, (AInfo["3 Year Turkey Permit"] == "CHECKED"), 1);
    //frm.SetSelected(LIC69_TURKEY_PERMIT_5Y, (AInfo["5 Year Turkey Permit"] == "CHECKED"), 1);

    frm.ExecuteBoRuleEngine();

    logDebug("EXIT: SetformForSelectedLics");
}

function SetOtherformForSelectedLics(frm) {
    logDebug("ENTER: SetOtherformForSelectedLics");

    //var frm = new form_OBJECT(GS2_SCRIPT);
    frm.Year = 'OTHERSALE';
    frm.Quantity_Trail_Supporter_Patch = AInfo["Quantity Trail Supporter Patch"];
    frm.Quantity_Venison_Donation = AInfo["Quantity Venison Donation"];
    frm.Quantity_Conservation_Patron = AInfo["Quantity Conservation Patron"];
    frm.Quantity_Conservation_Fund = AInfo["Quantity Conservation Fund"];
    frm.Quantity_Conservationist_Magazine = AInfo["Quantity Conservationist Magazine"];
    frm.Quantity_Habitat_Stamp = AInfo["Quantity Habitat/Access Stamp"];


    frm.SetSelected(LIC16_HABITAT_ACCESS_STAMP, (AInfo["Habitat/Access Stamp"] == "CHECKED"), 1);
    frm.SetSelected(LIC17_VENISON_DONATION, (AInfo["Venison Donation"] == "CHECKED"), 1);
    frm.SetSelected(LIC18_CONSERVATION_FUND, (AInfo["Conservation Fund"] == "CHECKED"), 1);
    frm.SetSelected(LIC19_TRAIL_SUPPORTER_PATCH, (AInfo["Trail Supporter Patch"] == "CHECKED"), 1);
    frm.SetSelected(LIC20_CONSERVATIONIST_MAGAZINE, (AInfo["Conservationist Magazine"] == "CHECKED"), 1);
    frm.SetSelected(LIC21_CONSERVATION_PATRON, (AInfo["Conservation Patron"] == "CHECKED"), 1);
    frm.SetSelected(LIC18_CONSERVATION_FUND, (AInfo["Conservation Fund"] == "CHECKED"), 1);
    frm.SetSelected(LIC19_TRAIL_SUPPORTER_PATCH, (AInfo["Trail Supporter Patch"] == "CHECKED"), 1);
    frm.SetSelected(LIC20_CONSERVATIONIST_MAGAZINE, (AInfo["Conservationist Magazine"] == "CHECKED"), 1);
    frm.SetSelected(LIC21_CONSERVATION_PATRON, (AInfo["Conservation Patron"] == "CHECKED"), 1);
    frm.SetSelected(LIC43_LIFETIME_CARD_REPLACE, (AInfo["Lifetime Card Replace"] == "CHECKED"), 1);
    frm.SetSelected(LIC44_SPORTSMAN_ED_CERTIFICATION, (AInfo["Sportsman Ed Certification"] == "CHECKED"), 1);

    frm.ExecuteBoRuleEngine();

    logDebug("EXIT: SetOtherformForSelectedLics");
}


function addFeeAndSetAsitForFeetxfer(frm) {
    logDebug("ENTER: addFeeAndSetAsitForFeetxfer");

    removeAllFees(capId);

    var feeArr = frm.getAllFeeToAdd();

    var tempObject = new Array();
    var newAsitArray = new Array();
    for (item in feeArr) {
        //logDebug(feeArr[item].feeschedule + " " + feeArr[item].feeCode + " " + feeArr[item].version + " " + feeArr[item].feeUnit);
        addFeeWithVersion(feeArr[item].feeCode, feeArr[item].feeschedule, feeArr[item].version, "FINAL", feeArr[item].feeUnit.toString(), "N");

        tempObject = new Array();
        var fieldInfo = new asiTableValObj("feeschedule", feeArr[item].feeschedule, "Y");
        tempObject["feeschedule"] = fieldInfo;
        fieldInfo = new asiTableValObj("feecode", feeArr[item].feeCode, "Y");
        tempObject["feecode"] = fieldInfo;
        fieldInfo = new asiTableValObj("formula", feeArr[item].formula, "Y");
        tempObject["formula"] = fieldInfo;
        fieldInfo = new asiTableValObj("feeUnit", feeArr[item].feeUnit.toString(), "Y");
        tempObject["feeUnit"] = fieldInfo;
        fieldInfo = new asiTableValObj("comments", feeArr[item].comments, "Y");
        tempObject["comments"] = fieldInfo;
        fieldInfo = new asiTableValObj("feeDesc", feeArr[item].feeDesc, "Y");
        tempObject["feeDesc"] = fieldInfo;
        fieldInfo = new asiTableValObj("feeversion", feeArr[item].version, "Y");
        tempObject["feeversion"] = fieldInfo;
        fieldInfo = new asiTableValObj("Code3commission", feeArr[item].Code3commission, "Y");
        tempObject["Code3commission"] = fieldInfo;
        newAsitArray.push(tempObject);  // end of record
    }
    asitModel = cap.getAppSpecificTableGroupModel();
    new_asit = addASITable4ACAPageFlow(asitModel, "FEES TO TRANSFER", newAsitArray);

    logDebug("EXIT: addFeeAndSetAsitForFeetxfer");
}

function getApplicantArrayEx() {
    logDebug("ENTER: getApplicantArrayEx");

    // Returns an array of associative arrays with applicant attributes.
    // optional capid
    // added check for ApplicationSubmitAfter event since the getApplicantModel array is only on pageflow,
    // on ASA it should still be pulled normal way even though still partial cap
    var thisCap = capId;
    if (arguments.length == 1) thisCap = arguments[0];

    var cArray = new Array();
    var aArray;
    // JHS 10/9/2013 added test for convertToRealCapAfter since this is being run on partial caps
    if (arguments.length == 0 && !cap.isCompleteCap() && controlString != "ApplicationSubmitAfter" && controlString != "ConvertToRealCapAfter") // we are in a page flow script so use the capModel to get applicant
    {
        logDebug("getApplicantArrayEx: retrieving from page flow/partial cap");
        var capContact = cap.getApplicantModel();
        if (capContact.getRefContactNumber() == null || capContact.getRefContactNumber() == "") {
            var contactList = cap.getContactsGroup();
            if (contactList != null && contactList.size() > 0) {
                capContact = contactList.get(0);
            }
        }
        aArray = getApplicantInfoArray(capContact);
        cArray.push(aArray);
    }
    else {
        logDebug("getApplicantArrayEx: retrieving from database");
        var capContactResult = aa.people.getCapContactByCapID(thisCap);
        if (capContactResult.getSuccess()) {
            var capContactArray = capContactResult.getOutput();
            if (capContactArray) {
                for (yy in capContactArray) {
                    //First One is always Applicant else check for contact type
                    aArray = getApplicantInfoArray(capContactArray[yy], thisCap);
                    cArray.push(aArray);

                    //Defects 8970 and 8971 - commenting out this break as you cannot assume the applicant/individual is always first
                    //I think when we turned sync off the DEC Agent started being first.
                    //break;
                }
            }
        }
    }
    logDebug("EXIT: getApplicantArrayEx");
    return cArray;
}

function getApplicantInfoArray(capContactObj) {
    var aArray = new Array();
    aArray["lastName"] = capContactObj.getPeople().lastName;
    aArray["firstName"] = capContactObj.getPeople().firstName;
    aArray["middleName"] = capContactObj.getPeople().middleName;
    aArray["businessName"] = capContactObj.getPeople().businessName;
    aArray["contactSeqNumber"] = capContactObj.getPeople().contactSeqNumber;
    if (capContactObj.getCapContactModel == undefined) {
        aArray["refcontactSeqNumber"] = capContactObj.getRefContactNumber();
    } else {
        aArray["refcontactSeqNumber"] = capContactObj.getCapContactModel().getRefContactNumber();
    }
    aArray["contactType"] = capContactObj.getPeople().contactType;
    aArray["relation"] = capContactObj.getPeople().relation;
    aArray["phone1"] = capContactObj.getPeople().phone1;
    aArray["phone2"] = capContactObj.getPeople().phone2;
    aArray["email"] = capContactObj.getPeople().email;
    aArray["addressLine1"] = capContactObj.getPeople().getCompactAddress().getAddressLine1();
    aArray["addressLine2"] = capContactObj.getPeople().getCompactAddress().getAddressLine2();
    aArray["city"] = capContactObj.getPeople().getCompactAddress().getCity();
    aArray["state"] = capContactObj.getPeople().getCompactAddress().getState();
    aArray["zip"] = capContactObj.getPeople().getCompactAddress().getZip();
    aArray["fax"] = capContactObj.getPeople().fax;
    aArray["notes"] = capContactObj.getPeople().notes;
    aArray["country"] = capContactObj.getPeople().getCompactAddress().getCountry();
    aArray["fullName"] = capContactObj.getPeople().fullName;
    aArray["gender"] = capContactObj.getPeople().gender;
    aArray["birthDate"] = capContactObj.getPeople().birthDate;
    aArray["driverLicenseNbr"] = capContactObj.getPeople().driverLicenseNbr;
    aArray["driverLicenseState"] = capContactObj.getPeople().driverLicenseState;
    aArray["deceasedDate"] = capContactObj.getPeople().deceasedDate;
    aArray["passportNumber"] = capContactObj.getPeople().passportNumber;
    aArray["stateIDNbr"] = capContactObj.getPeople().stateIDNbr;


    var pa;
    if (arguments.length == 1 && !cap.isCompleteCap() && controlString != "ApplicationSubmitAfter" && controlString != "ConvertToRealCapAfter") // using capModel to get contacts
    {
        logDebug("getApplicantInfoArray: retrieving ASI from capModel");

        var subGroupArray = getTemplateValueByFormArrays(capContactObj.people.getTemplate(), null, null);
        for (var subGroupName in subGroupArray) {
            var fieldArray = subGroupArray[subGroupName];
            for (var f in fieldArray) {
                aArray[f] = fieldArray[f];
            }
        }
    } else {
        logDebug("getApplicantInfoArray: retrieving from database");

        if (capContactObj.getCapContactModel().getPeople().getAttributes() != null) {
            pa = capContactObj.getCapContactModel().getPeople().getAttributes().toArray();
            for (xx1 in pa) {
                aArray[pa[xx1].attributeName] = pa[xx1].attributeValue;
            }
        }
    }

    return aArray;
}
function GetTableValueArrayByDelimitedString(tableName, delimStr) {
    logDebug("ENTER: GetTableValueArrayByDelimitedString");

    var readOnly = "N";
    var tempObject = new Array();
    var tempArray = new Array();
    var colNames = allTableNames[allTableRefLink[tableName]];

    if (delimStr != null && delimStr != "") {
        var rows = delimStr.split("|");
        for (var irow = 0; irow < rows.length; irow++) {
            tempObject = new Array();
            var colval = rows[irow].split("^");
            for (var idx = 0; idx < colval.length; idx++) {
                var fieldInfo = new asiTableValObj(colNames[idx], colval[idx], readOnly);
                tempObject[colNames[idx]] = fieldInfo;
            }
            tempArray.push(tempObject);  // end of record
        }
    }
    logDebug("EXIT: GetTableValueArrayByDelimitedString");

    return tempArray;
}

function GetASITDelimitedString(tableName, tablevalue) {
    logDebug("ENTER: GetASITDelimitedString");

    var aTable = "";
    var copyStr = " aTable = tablevalue;"
    eval(copyStr);
    var delimitedStr = "";
    if (typeof (aTable) == "object") {
        for (y in aTable) {
            if (y != 0) delimitedStr += "|";

            var currrow = "";
            var colNames = allTableNames[allTableRefLink[tableName]];

            for (var idx = 0; idx < colNames.length; idx++) {
                if (idx != 0) { currrow += "^"; }
                currrow += aTable[y][colNames[idx]];
            }
            delimitedStr += currrow;
        }
    }
    logDebug("EXIT: GetASITDelimitedString");

    return delimitedStr;
}

function copyContactAppSpecificToRecordAppSpecific() {
    logDebug("ENTER: copyContactAppSpecificToRecordAppSpecific");

    if (publicUser) {

        var publicUserID = "" + aa.env.getValue("CurrentUserID");

        if (publicUserID.length > 0) {
            var pUserSeqNum = aa.util.parseLong(publicUserID.substr(10, publicUserID.length - 1));
            var s_publicUserResult = aa.publicUser.getPublicUser(pUserSeqNum);
            if (s_publicUserResult.getSuccess()) {
                var pUserObj = s_publicUserResult.getOutput();
                if (pUserObj.getAccountType() == "CITIZEN") {
                    MSG_SUSPENSION = "Customer privileges are suspended and licenses are not available for purchase. This issue can only be resolved by contacting DEC Law Enforcement during business hours at 518-402-8821.";
                }
            }
        }
    }

    var isNotValidToProceed = MSG_SUSPENSION;

    var xArray = getApplicantArrayEx();
    var peopleSequenceNumber = null;
    var deceasedDate = null;

    for (ca in xArray) {
        var thisContact = xArray[ca];
        //First One is always Applicant

        //Copy People Tempalte Fields.   These are fields that the user may change on field entry, need to make 
        //sure that the new values are used in calculations on the page before they are updated to the reference contact
        editAppSpecific4ACA("A_FromACA", "Yes");
        editAppSpecific4ACA("A_email", thisContact["email"]);
        editAppSpecific4ACA("A_birthDate", formatMMDDYYYY(thisContact["birthDate"]));
        editAppSpecific4ACA("A_IsNYResident", thisContact["Are You New York Resident?"]);
        editAppSpecific4ACA("A_Driver_License_State", thisContact["driverLicenseState"]);
        editAppSpecific4ACA("A_Driver_License_Number", thisContact["driverLicenseNbr"]);
        editAppSpecific4ACA("A_Non_Driver_License_Number", thisContact["stateIDNbr"]);
        editAppSpecific4ACA("A_NY_Resident_Proof_Document", thisContact["NY Resident Proof Document"]);

        var strAnnual = null;
        var strPrev = null;
        var strLand = null;
        var strEduc = null;

        peopleSequenceNumber = thisContact["refcontactSeqNumber"]

        if (peopleSequenceNumber != null) {
            var peopleModel = getOutput(aa.people.getPeople(peopleSequenceNumber), "");

            deceasedDate = peopleModel.getDeceasedDate();

            //Copy All Asi Fields: asumption is identical subgroups are available in cap ASI
            var subGroupArray = getTemplateValueByFormArrays(peopleModel.getTemplate(), null, null);
            GetAllASI(subGroupArray);

            for (var subGroupName in subGroupArray) {
                var fieldArray = subGroupArray[subGroupName];
                if (subGroupName == "ADDITIONAL INFO") {
                    //editAppSpecific4ACA("A_IsNYResident", fieldArray["Are You New York Resident?"]);
                    editAppSpecific4ACA("A_Preference_Points", isNull(fieldArray["Preference Points"], '0'));
                    editAppSpecific4ACA("Preference Points", isNull(fieldArray["Preference Points"], '0'));
                    editAppSpecific4ACA("A_Parent_Driver_License_Number", fieldArray["Parent Driver License Number"]);
                    //editAppSpecific4ACA("A_NY_Resident_Proof_Document", fieldArray["NY Resident Proof Document"]);
                    continue;
                } else {
                    if (subGroupName == "MILITARY ACTIVE SERVICE STATUS") {
                        //JIRA-15754
                        var isCurrentAffidavit = hasCurrentAffidavit(fieldArray["Affidavit Date"]);
                        if (isCurrentAffidavit) {
                            editAppSpecific4ACA("A_Military Serviceman", isNull(fieldArray["Military Serviceman"], '0'));
                            for (var fld in fieldArray) {
                                editAppSpecific4ACA(fld, fieldArray[fld])
                            }
                        }
                    }
                    if (subGroupName == "APPEARANCE") {
                        editAppSpecific4ACA("A_Legally Blind", fieldArray["Legally Blind"]);
                        editAppSpecific4ACA("A_Permanent Disability", fieldArray["Permanent Disability"]);
                        for (var fld in fieldArray) {
                            editAppSpecific4ACA(fld, fieldArray[fld])
                        }
                    }
                }
            }

            //Copy All ASITs : asumption is identical ASITs with subgroups are available in cap ASIT
            subGroupArray = getTemplateValueByTableArrays(peopleModel.getTemplate());
            strAnnual = GetContactASITDelimitedString(subGroupArray["ANNUAL DISABILITY"]);
            strPrev = GetContactASITDelimitedString(subGroupArray["PREVIOUS LICENSE"]);
            strLand = GetContactASITDelimitedString(subGroupArray["LAND OWNER INFORMATION"]);
            strEduc = GetContactASITDelimitedString(subGroupArray["SPORTSMAN EDUCATION"]);
            //strActiveHoldings = GetContactASITDelimitedString(subGroupArray["ACTIVE HOLDINGS"]);
        }

        //----load ASITs
        editAppSpecific4ACA("A_Annual_Disability", strAnnual);
        editAppSpecific4ACA("A_Previous_License", strPrev);
        editAppSpecific4ACA("A_Land_Owner_Information", strLand);
        editAppSpecific4ACA("A_Sportsman_Education", strEduc);
        //editAppSpecific4ACA("A_ActiveHoldings", strActiveHoldings);

        var asitModel;
        var new_asit;

        if (!(typeof (LANDOWNERINFORMATION) == "object")) {
            var newLandOwnerInfo = GetTableValueArrayByDelimitedString("LANDOWNERINFORMATION", strLand)
            asitModel = cap.getAppSpecificTableGroupModel();
            new_asit = addASITable4ACAPageFlow(asitModel, "LAND OWNER INFORMATION", newLandOwnerInfo);
        }
        if (!(typeof (ANNUALDISABILITY) == "object")) {
            var newAnnualDiability = GetTableValueArrayByDelimitedString("ANNUALDISABILITY", strAnnual)
            asitModel = cap.getAppSpecificTableGroupModel();
            new_asit = addASITable4ACAPageFlow(asitModel, "ANNUAL DISABILITY", newAnnualDiability);
        }
        if (!(typeof (SPORTSMANEDUCATION) == "object")) {
            var newSportsmanDucat = GetTableValueArrayByDelimitedString("SPORTSMANEDUCATION", strEduc)
            asitModel = cap.getAppSpecificTableGroupModel();
            new_asit = addASITable4ACAPageFlow(asitModel, "SPORTSMAN EDUCATION", newSportsmanDucat);

        }
        if (!(typeof (PREVIOUSLICENSE) == "object")) {
            var newPreviousLic = GetTableValueArrayByDelimitedString("PREVIOUSLICENSE", strPrev)
            asitModel = cap.getAppSpecificTableGroupModel();
            new_asit = addASITable4ACAPageFlow(asitModel, "PREVIOUS LICENSE", newPreviousLic);
        }

        //Contact Conditions Settings
        var contactCondArray = getContactCondutions(peopleSequenceNumber);
        editAppSpecific4ACA("A_Suspended", (isSuspension(contactCondArray) ? "Yes" : "No"));
        editAppSpecific4ACA("A_Revoked_Hunting", (isRevocationHunting(contactCondArray) ? "Yes" : "No"));
        editAppSpecific4ACA("A_Revoked_Trapping", (isRevocationTrapping(contactCondArray) ? "Yes" : "No"));
        editAppSpecific4ACA("A_Revoked_Fishing", (isRevocationFishing(contactCondArray) ? "Yes" : "No"));
        editAppSpecific4ACA("A_AgedIn", (isMarkForAgedInFulfillment(contactCondArray) ? "Yes" : "No"));
        editAppSpecific4ACA("A_NeedHuntEd", (isMarkForNeedHutEdFulfillment(contactCondArray) ? "Yes" : "No"));

        if (!isSuspension(contactCondArray)) {
            isNotValidToProceed = false;
        }
        break;
    }

    if (deceasedDate) {
        if (isNotValidToProceed) {
            isNotValidToProceed += MSG_DECEASED;
        }
        else {
            isNotValidToProceed = MSG_DECEASED;
        }
    }


    if (!isAgentAbleToSell(publicUserID)) {
        if (isNotValidToProceed) {
            isNotValidToProceed += MSG_NO_AGENT_SALES;
        }
        else {
            isNotValidToProceed = MSG_NO_AGENT_SALES;
        }
    }

    // Defect 13354
    var isMultipleAddresses = false;
    var capContact = cap.getApplicantModel();
    if (capContact) {

        if (capContact.getRefContactNumber()) {
            var passport = isNull(aa.people.getPeople(capContact.getRefContactNumber()).getOutput().getPassportNumber(), null);
            var newpassport = isNull(cap.getApplicantModel().getPeople().getPassportNumber(), null);

            if ((passport && !newpassport) || (!passport && newpassport) || (passport && newpassport && passport != newpassport)) {
                if (isNotValidToProceed) {
                    isNotValidToProceed += MSG_DEC_ID_EDITED;
                }
                else {
                    isNotValidToProceed = MSG_DEC_ID_EDITED + " (" + passport + ") v. (" + newpassport + ")";
                }
            }
        }


        pmcal = capContact.getPeople().getContactAddressList();
        if (pmcal) {
            var addresses = pmcal.toArray();
            if (addresses.length > 1) {
                var addrTypeCount = new Array();
                for (var y in addresses) {
                    var thisAddr = addresses[y];
                    addrTypeCount[thisAddr.addressType] = 0;
                }

                for (var yy in addresses) {
                    thisAddr = addresses[yy];
                    addrTypeCount[thisAddr.addressType] += 1;
                }

                for (var z in addrTypeCount) {
                    if (addrTypeCount[z] > 1)
                        isMultipleAddresses = true;
                }
            }

            if (isMultipleAddresses) {
                if (isNotValidToProceed) {
                    isNotValidToProceed += MSG_TOO_MANY_ADDR
                }
                else {
                    isNotValidToProceed = MSG_TOO_MANY_ADDR;
                }
            }
        }
    }

    logDebug("EXIT: copyContactAppSpecificToRecordAppSpecific");

    return isNotValidToProceed;
}

function GetContactASITDelimitedString(rowsValueArray) {
    logDebug("ENTER: GetASITDelimitedString");

    var delimitedStr = "";
    for (var vv in rowsValueArray) {
        var tempArray = rowsValueArray[vv];
        if (vv != 0) delimitedStr += "|";
        for (var row in tempArray) {
            var currrow = "";
            var tempObject = tempArray[row];
            for (var val in tempObject) {
                var fieldInfo = tempObject[val];
                if (val != 0) { currrow += "^"; }
                currrow += isNull(fieldInfo.fieldValue, '');
            }
            delimitedStr += currrow;
        }
    }
    logDebug("EXIT: GetASITDelimitedString");

    return delimitedStr;
}

function days_between(date1, date2) {

    // The number of milliseconds in one day
    var ONE_DAY = 1000 * 60 * 60 * 24

    // Convert both dates to milliseconds
    var date1_ms = date1.getTime()
    var date2_ms = date2.getTime()

    // Calculate the difference in milliseconds
    var difference_ms = Math.abs(date1_ms - date2_ms)

    // Convert back to days and return
    return Math.round(difference_ms / ONE_DAY)

}

function getDepartmentName(username) {
    var suo = aa.person.getUser(username).getOutput();
    var dpt = aa.people.getDepartmentList(null).getOutput();
    for (var thisdpt in dpt) {
        var m = dpt[thisdpt]
        var n = m.getServiceProviderCode() + "/" + m.getAgencyCode() + "/" + m.getBureauCode() + "/" + m.getDivisionCode() + "/" + m.getSectionCode() + "/" + m.getGroupCode() + "/" + m.getOfficeCode()

        if (n.equals(suo.deptOfUser))
            return (m.getDeptName())
    }
}

function SetTableStringFields() {
    logDebug("ENTER: SetTableStringFields");

    //ASIT info
    var strLand = (typeof (LANDOWNERINFORMATION) == "object") ? GetASITDelimitedString("LANDOWNERINFORMATION", LANDOWNERINFORMATION) : null;
    var strAnnual = (typeof (ANNUALDISABILITY) == "object") ? GetASITDelimitedString("ANNUALDISABILITY", ANNUALDISABILITY) : null;
    var strEduc = (typeof (SPORTSMANEDUCATION) == "object") ? GetASITDelimitedString("SPORTSMANEDUCATION", SPORTSMANEDUCATION) : null;
    var strPrev = (typeof (PREVIOUSLICENSE) == "object") ? GetASITDelimitedString("PREVIOUSLICENSE", PREVIOUSLICENSE) : null;
    //var strAllHolding = (typeof (ACTIVEHOLDINGS) == "object") ? GetASITDelimitedString("ACTIVEHOLDINGS", ACTIVEHOLDINGS) : null;

    //NOT WORKING: Not getting these updates on next page ASI Display
    editAppSpecific4ACA("A_Annual_Disability", strAnnual);
    editAppSpecific4ACA("A_Previous_License", strPrev);
    editAppSpecific4ACA("A_Land_Owner_Information", strLand);
    editAppSpecific4ACA("A_Sportsman_Education", strEduc);
    //editAppSpecific4ACA("A_ActiveHoldings", strAllHolding);
    editAppSpecific4ACA("A_IsNativeAmerican", AInfo["Native American?"]);
    editAppSpecific4ACA("A_Legally Blind", AInfo["Legally Blind"]);
    editAppSpecific4ACA("A_Permanent Disability", AInfo["Permanent Disability"]);
    editAppSpecific4ACA("A_Military Serviceman", AInfo["Military Serviceman"]);

    logDebug("EXIT: SetTableStringFields");
}

function logArgs(args) {
    return;
    if (args) {
        if (args.length > 0) {
            for (var irow = 0; irow < args.length; irow++) {
                logDebug("argument = " + irow + " = " + args[0]);
            }
        } else {
            logDebug("Arguments: NONE");
        }
    } else {
        logDebug("Calling Exception: logArgs expects parameter as arguments");
    }
}

function getCAPModel(capIDModel) {
    aa.log("Init: Find out CAP information.");
    var capModel = aa.cap.getCapViewBySingle4ACA(capIDModel);
    if (capModel == null) {
        aa.log("Fail to get CAP model: " + capIDModel.toString());
        return null;
    }
    return capModel;
}

function editAppSpecific4ACA(itemName, itemValue) {
    var i = cap.getAppSpecificInfoGroups().iterator();

    while (i.hasNext()) {
        var group = i.next();
        var fields = group.getFields();
        if (fields != null) {
            var iteFields = fields.iterator();
            while (iteFields.hasNext()) {
                var field = iteFields.next();
                if ((useAppSpecificGroupName && itemName.equals(field.getCheckboxType() + "." + field.getCheckboxDesc())) || itemName.equals(field.getCheckboxDesc())) {
                    field.setChecklistComment(itemValue);
                }
            }
        }
    }
}

function formatMMDDYYYY(pDate) {
    var dDate = new Date(pDate);

    return (dDate.getMonth() + 1) + "/" + dDate.getDate() + "/" + dDate.getFullYear();
}

function debugObject(object) {
    var output = '';
    for (property in object) {
        output += "<font color=red>" + property + "</font>" + ': ' + "<bold>" + object[property] + "</bold>" + '; ' + "<BR>";
    }
    logDebug(output);
}

function setASIFieldGroupinstruction4ACA(gName, instruction, itemCap) {
    //OBSOLETE
    logDebug("ENTER: setASIFieldGroupinstruction4ACA");
    var asiGroups;
    if (itemCap != null) {
        var appSpecInfoResult = aa.appSpecificInfo.getByCapID(itemCap);
        if (appSpecInfoResult.getSuccess()) {
            //var formGroups = appSpecInfoResult.toArray();
            //aa.print(formGroups);
            var fAppSpecInfoObj = appSpecInfoResult.getOutput();

            for (loopk in fAppSpecInfoObj) {
                if (useAppSpecificGroupName) {
                    aa.print(fAppSpecInfoObj[loopk].getCheckboxType() + "." + fAppSpecInfoObj[loopk].checkboxDesc);
                    aa.print(fAppSpecInfoObj[loopk].checklistComment);
                }
                else {
                    debugObject(fAppSpecInfoObj[loopk]);
                    aa.print(fAppSpecInfoObj[loopk].checkboxDesc);
                    aa.print(fAppSpecInfoObj[loopk].checklistComment);
                }
            }
        }
    } else {
        asiGroups = cap.getAppSpecificInfoGroups()
        for (i = 0; i < asiGroups.size(); i++) {
            logDebug("Lalit");
            debugObject(asiGroups.get(i));
            //logDebug(asiGroups.get(i).getGroupName());
            //logDebug(asiGroups.get(i).getCheckBoxGroup());
            //asiGroups.get(i).getGroupName();
            if (asiGroups.get(i).getGroupName() == gName) {
                //instruction

            }
        }
        //var wf = aa.proxyInvoker.newInstance("com.accela.aa.workflow.workflow.WorkflowBusiness").getOutput();
        //openUrlInNewWindow("www.gcomsoft.com");

    }
    logDebug("EXIT: setASIFieldGroupinstruction4ACA");
    return true;
}
function addFeeWithVersion(fcode, fsched, fversion, fperiod, fqty, finvoice) // Adds a single fee, optional argument: fCap
{
    // Updated Script will return feeSeq number or null if error encountered (SR5112)
    var feeCap = capId;
    var feeCapMessage = "";
    var feeSeq_L = new Array();    // invoicing fee for CAP in args
    var paymentPeriod_L = new Array();   // invoicing pay periods for CAP in args
    var feeSeq = null;
    if (arguments.length > 6) {
        feeCap = arguments[6]; // use cap ID specified in args
        feeCapMessage = " to specified CAP";
    }

    assessFeeResult = aa.finance.createFeeItem(feeCap, fsched, fversion, fcode, fperiod, fqty);
    if (assessFeeResult.getSuccess()) {
        feeSeq = assessFeeResult.getOutput();
        logMessage("Successfully added Fee " + fcode + ", Qty " + fqty + feeCapMessage);
        logDebug("The assessed fee Sequence Number " + feeSeq + feeCapMessage);

        if (finvoice == "Y" && arguments.length == 6) // use current CAP
        {
            feeSeqList.push(feeSeq);
            paymentPeriodList.push(fperiod);
        }
        if (finvoice == "Y" && arguments.length > 6) // use CAP in args
        {
            feeSeq_L.push(feeSeq);
            paymentPeriod_L.push(fperiod);
            var invoiceResult_L = aa.finance.createInvoice(feeCap, feeSeq_L, paymentPeriod_L);
            if (invoiceResult_L.getSuccess())
                logMessage("Invoicing assessed fee items" + feeCapMessage + " is successful.");
            else
                logDebug("**ERROR: Invoicing the fee items assessed" + feeCapMessage + " was not successful.  Reason: " + invoiceResult_L.getErrorMessage());
        }
    }
    else {
        logDebug("**ERROR: assessing fee (" + fcode + "): " + assessFeeResult.getErrorMessage());
        feeSeq = null;
    }

    return feeSeq;
}

function addFeeWithVersionAndReturnfeeSeq(fcode, fsched, fversion, fperiod, fqty, finvoice) // Adds a single fee, optional argument: fCap
{
    // Updated Script will return feeSeq number or null if error encountered (SR5112)
    var feeCap = capId;
    var feeCapMessage = "";
    var feeSeq_L = new Array();    // invoicing fee for CAP in args
    var paymentPeriod_L = new Array();   // invoicing pay periods for CAP in args
    var feeSeq = null;
    var feeSeqAndPeriodArray = new Array();

    if (arguments.length > 6) {
        feeCap = arguments[6]; // use cap ID specified in args
        feeCapMessage = " to specified CAP";
    }

    assessFeeResult = aa.finance.createFeeItem(feeCap, fsched, fversion, fcode, fperiod, fqty);
    if (assessFeeResult.getSuccess()) {
        feeSeq = assessFeeResult.getOutput();
        logMessage("Successfully added Fee " + fcode + ", Qty " + fqty + feeCapMessage);
        logDebug("The assessed fee Sequence Number " + feeSeq + feeCapMessage);

        if (finvoice == "Y" && arguments.length == 6) // use current CAP
        {
            feeSeqList.push(feeSeq);
            paymentPeriodList.push(fperiod);
        }
        if (finvoice == "Y" && arguments.length > 6) // use CAP in args
        {
            feeSeq_L.push(feeSeq);
            feeSeqAndPeriodArray.push(feeSeq)

            paymentPeriod_L.push(fperiod);
            feeSeqAndPeriodArray.push(fperiod)
        }
    }
    else {
        logDebug("**ERROR: assessing fee (" + fcode + "): " + assessFeeResult.getErrorMessage());
        feeSeq = null;
    }

    return feeSeqAndPeriodArray;
}

function createInvoice(feeSeq_L, paymentPeriod_L) {
    var feeCap = capId;
    var feeCapMessage = "";

    if (arguments.length > 2) {
        feeCap = arguments[2]; // use cap ID specified in args
        feeCapMessage = " to specified CAP";
    }

    var invoiceResult_L = aa.finance.createInvoice(feeCap, feeSeq_L, paymentPeriod_L);
    if (invoiceResult_L.getSuccess())
        logMessage("Invoicing assessed fee items" + feeCapMessage + " is successful.");
    else
        logDebug("**ERROR: Invoicing the fee items assessed" + feeCapMessage + " was not successful.  Reason: " + invoiceResult_L.getErrorMessage());
}

function updateFeeWithVersion(fcode, fsched, fversion, fperiod, fqty, finvoice, pDuplicate, pFeeSeq) {
    // Updates an assessed fee with a new Qty.  If not found, adds it; else if invoiced fee found, adds another with adjusted qty.
    // optional param pDuplicate -if "N", won't add another if invoiced fee exists (SR5085)
    // Script will return fee sequence number if new fee is added otherwise it will return null (SR5112)
    // Optional param pSeqNumber, Will attempt to update the specified Fee Sequence Number or Add new (SR5112)
    // 12/22/2008 - DQ - Correct Invoice loop to accumulate instead of reset each iteration

    // If optional argument is blank, use default logic (i.e. allow duplicate fee if invoiced fee is found)
    if (pDuplicate == null || pDuplicate.length == 0)
        pDuplicate = "Y";
    else
        pDuplicate = pDuplicate.toUpperCase();

    var invFeeFound = false;
    var adjustedQty = fqty;
    var feeSeq = null;
    feeUpdated = false;

    if (pFeeSeq == null)
        getFeeResult = aa.finance.getFeeItemByFeeCode(capId, fcode, fperiod);
    else
        getFeeResult = aa.finance.getFeeItemByPK(capId, pFeeSeq);


    var feeList;
    if (getFeeResult.getSuccess()) {
        if (pFeeSeq == null)
            feeList = getFeeResult.getOutput();
        else {
            feeList = new Array();
            feeList[0] = getFeeResult.getOutput();
        }
        for (feeNum in feeList)
            if (feeList[feeNum].getFeeitemStatus().equals("INVOICED")) {
                if (pDuplicate == "Y") {
                    logDebug("Invoiced fee " + fcode + " found, subtracting invoiced amount from update qty.");
                    adjustedQty = adjustedQty - feeList[feeNum].getFeeUnit();
                    invFeeFound = true;
                }
                else {
                    invFeeFound = true;
                    logDebug("Invoiced fee " + fcode + " found.  Not updating this fee. Not assessing new fee " + fcode);
                }
            }

        for (feeNum in feeList)
            if (feeList[feeNum].getFeeitemStatus().equals("NEW") && !feeUpdated)  // update this fee item
            {
                feeSeq = feeList[feeNum].getFeeSeqNbr();
                var editResult = aa.finance.editFeeItemUnit(capId, fqty, feeSeq);
                feeUpdated = true;
                if (editResult.getSuccess()) {
                    logDebug("Updated Qty on Existing Fee Item: " + fcode + " to Qty: " + fqty);
                    if (finvoice == "Y") {
                        feeSeqList.push(feeSeq);
                        paymentPeriodList.push(fperiod);
                    }
                }
                else
                { logDebug("**ERROR: updating qty on fee item (" + fcode + "): " + editResult.getErrorMessage()); break }
            }
    }
    else
    { logDebug("**ERROR: getting fee items (" + fcode + "): " + getFeeResult.getErrorMessage()) }

    // Add fee if no fee has been updated OR invoiced fee already exists and duplicates are allowed
    if (!feeUpdated && adjustedQty != 0 && (!invFeeFound || invFeeFound && pDuplicate == "Y"))
        feeSeq = addFeeWithVersion(fcode, fsched, fversion, fperiod, adjustedQty, finvoice);
    else
        feeSeq = null;

    return feeSeq;
}

function transferReceiptAndApply(receiptCapId, targetCapId) {
    var amtResult = parseFloat(aa.cashier.getSumNotAllocated(receiptCapId).getOutput());

    if (arguments.length == 3) {
        balanceDue = arguments[2];
    }

    if (amtResult < balanceDue) {
        logDebug("insufficient funds to do transfer from receipt record");
        return false;
    }

    var xferResult = aa.finance.makeFundTransfer(receiptCapId, targetCapId, currentUserID, "", "", sysDate, sysDate, "", sysDate, balanceDue, "NA", "Fund Transfer", "NA", "R", null, "", "NA", "");
    if (xferResult.getSuccess())
        logDebug("Successfully transferred $" + balanceDue + " from " + receiptCapId + " to " + targetCapId);
    else
        logDebug("Error transferring funds " + xferResult.getErrorMessage());


    var piresult = aa.finance.getPaymentByCapID(targetCapId, null).getOutput()

    for (ik in piresult) {
        var feeSeqArray = new Array();
        var invoiceNbrArray = new Array();
        var feeAllocationArray = new Array();


        var thisPay = piresult[ik];
        var applyAmt = 0;
        var unallocatedAmt = thisPay.getAmountNotAllocated()

        if (unallocatedAmt > 0) {

            var invArray = aa.finance.getInvoiceByCapID(targetCapId, null).getOutput()

            for (var invCount in invArray) {
                var thisInvoice = invArray[invCount];
                var balDue = thisInvoice.getInvoiceModel().getBalanceDue();
                if (balDue > 0) {
                    feeT = aa.invoice.getFeeItemInvoiceByInvoiceNbr(thisInvoice.getInvNbr()).getOutput();

                    for (targetFeeNum in feeT) {
                        var thisTFee = feeT[targetFeeNum];

                        if (thisTFee.getFee() > unallocatedAmt)
                            applyAmt = unallocatedAmt;
                        else
                            applyAmt = thisTFee.getFee()   // use balance here?

                        unallocatedAmt = unallocatedAmt - applyAmt;

                        feeSeqArray.push(thisTFee.getFeeSeqNbr());
                        invoiceNbrArray.push(thisInvoice.getInvNbr());
                        feeAllocationArray.push(applyAmt);
                    }
                }
            }

            applyResult = aa.finance.applyPayment(targetCapId, thisPay, feeSeqArray, invoiceNbrArray, feeAllocationArray, "PAYSTAT", "INVSTAT", "123")

            if (applyResult.getSuccess())
                logDebug("Successfully applied payment");
            else
                logDebug("**ERROR: applying payment to fee (" + thisTFee.getFeeDescription() + "): " + applyResult.getErrorMessage());

        }
    }
}

function addStdConditionWithComments(cType, cDesc, cShortComment, cLongComment) // optional cap ID
{
    logDebug("ENTER: addStdConditionWithComments: " + cType + "," + cDesc + "," + cShortComment + "," + cLongComment);

    var itemCap = capId;
    if (arguments.length == 5) itemCap = arguments[4]; // use cap ID specified in args

    if (!aa.capCondition.getStandardConditions) {
        logDebug("addStdCondition function is not available in this version of Accela Automation.");
    }
    else {
        standardConditions = aa.capCondition.getStandardConditions(cType, cDesc).getOutput();
        for (i = 0; i < standardConditions.length; i++)
            if (standardConditions[i].getConditionType().toUpperCase() == cType.toUpperCase() && standardConditions[i].getConditionDesc().toUpperCase() == cDesc.toUpperCase()) //EMSE Dom function does like search, needed for exact match
            {
                standardCondition = standardConditions[i];
                if (cShortComment != null && cShortComment != '') {
                    standardCondition.setConditionComment(cShortComment);
                }
                if (cLongComment != null && cLongComment != '') {
                    standardCondition.setLongDescripton(cLongComment);
                }

                var addCapCondResult = aa.capCondition.createCapConditionFromStdCondition(itemCap, standardCondition);
                if (addCapCondResult.getSuccess()) {
                    logDebug("Successfully added condition (" + standardCondition.getConditionDesc() + ")");
                }
                else {
                    logDebug("**ERROR: adding condition (" + standardCondition.getConditionDesc() + "): " + addCapCondResult.getErrorMessage());
                }
            }
    }
    logDebug("EXIT: addStdConditionWithComments");
}

function distributeFeesAndPayments(sourceCapId, arryTargetCapAttrib, pSalesAgentInfoArray) {
    logDebug("ENTER: distributeFeesAndPayments");
    //logDebug("Elapsed Time: " + elapsed());

    //
    // Step 0: Make payment before distribution
    //
    //    logDebug("Step 0: Make payment before distribution");

    //    if (feeSeqList.length) {
    //        invoiceResult = aa.finance.createInvoice(capId, feeSeqList, paymentPeriodList);
    //        if (invoiceResult.getSuccess())
    //            logDebug("Invoicing assessed fee items is successful.");
    //        else
    //            logDebug("**ERROR: Invoicing the fee items assessed to app # " + capIDString + " was not successful.  Reason: " + invoiceResult.getErrorMessage());
    //    }


    //
    // Step 1: Unapply payments from the Source
    //
    logDebug("Step 1: Unapply payments from the Source");

    var piresult = aa.finance.getPaymentByCapID(capId, null).getOutput()

    var feeSeqArray = new Array();
    var invoiceNbrArray = new Array();
    var feeAllocationArray = new Array();

    for (ik in piresult) {
        var thisPay = piresult[ik];
        var pfResult = aa.finance.getPaymentFeeItems(capId, null);
        if (pfResult.getSuccess()) {
            var pfObj = pfResult.getOutput();
            for (ij in pfObj)
                if (pfObj[ij].getPaymentSeqNbr() == thisPay.getPaymentSeqNbr()) {
                    feeSeqArray.push(pfObj[ij].getFeeSeqNbr());
                    invoiceNbrArray.push(pfObj[ij].getInvoiceNbr());
                    feeAllocationArray.push(pfObj[ij].getFeeAllocation());
                }
        }


        if (feeSeqArray.length > 0) {
            z = aa.finance.applyRefund(capId, thisPay, feeSeqArray, invoiceNbrArray, feeAllocationArray, "FeeStat", "InvStat", "123");
            if (z.getSuccess())
                logDebug("Refund applied")
            else
                logDebug("Error applying refund " + z.getErrorMessage());
        }
    }

    //
    // Step 2: void from the source
    //
    logDebug("Step 2:  void from the source");

    feeA = loadFees()

    var feeCapMessage = "";
    for (x in feeA) {
        thisFee = feeA[x];
        logDebug("status is " + thisFee.status)
        if (thisFee.status == "INVOICED") {
            voidResult = aa.finance.voidFeeItem(capId, thisFee.sequence);
            if (voidResult.getSuccess()) {
                logDebug("Fee item " + thisFee.code + "(" + thisFee.sequence + ") has been voided")
            }
            else {
                logDebug("**ERROR: voiding fee item " + thisFee.code + "(" + thisFee.sequence + ") " + voidResult.getErrorMessage());
            }

            var feeSeqArray = new Array();
            var paymentPeriodArray = new Array();

            feeSeqArray.push(thisFee.sequence);
            paymentPeriodArray.push(thisFee.period);
            var invoiceResult_L = aa.finance.createInvoice(capId, feeSeqArray, paymentPeriodArray);

            if (!invoiceResult_L.getSuccess())
                logDebug("**ERROR: Invoicing the fee items voided " + feeCapMessage + " was not successful.  Reason: " + invoiceResult_L.getErrorMessage());
        }
    }

    //
    // Step 3: add the fees to the target and transfer the funds from Source to each Target cap
    //
    logDebug("Step 3: transfer the funds from Source to each Target cap");

    var unapplied = paymentGetNotAppliedTot()
    for (var item in arryTargetCapAttrib) {
        var targetCapId = arryTargetCapAttrib[item].targetCapId;
        var targetfd = arryTargetCapAttrib[item].targetFeeInfo;
        var isForceComboCharge = arryTargetCapAttrib[item].isForceComboCharge;

        var targetfeeSeq_L = new Array();    // invoicing fees
        var targetpaymentPeriod_L = new Array();   // invoicing pay period
        var feeSeqAndPeriodArray = new Array(); //return values for fees and period after added

        var amtAgentCharge = parseFloat(parseFloat(targetfd.feeUnit) * parseFloat(targetfd.formula));
        var cmnsPerc = GetCommissionByUser(targetfd.Code3commission + "", pSalesAgentInfoArray);

        if (cmnsPerc > 0 || isForceComboCharge) {
            //JIRA: 17343. Changed comission calculation. Calculate per unit commision then add it.
            var amtCommission = 0;
            if (parseFloat(targetfd.feeUnit) > 1) {
                var amtPerUnitCommission = cmnsPerc == 0 ? 0 : (cmnsPerc * parseFloat(targetfd.formula)) / 100;
                amtPerUnitCommission = (Math.round(amtPerUnitCommission * 100) / 100);
                amtCommission = (amtPerUnitCommission * parseFloat(targetfd.feeUnit));
                amtAgentCharge = parseFloat(parseFloat(targetfd.feeUnit) * parseFloat(targetfd.formula));
            } else {
                amtCommission = cmnsPerc == 0 ? 0 : (cmnsPerc * amtAgentCharge) / 100;
            }

            amtCommission = (Math.round(amtCommission * 100) / 100);
            amtAgentCharge -= amtCommission;
            feeSeqAndPeriodArray = addFeeWithVersionAndReturnfeeSeq("AGENT_CHARGE", targetfd.feeschedule, targetfd.version, "FINAL", amtAgentCharge, "Y", targetCapId)

            targetfeeSeq_L.push(feeSeqAndPeriodArray[0]);
            targetpaymentPeriod_L.push(feeSeqAndPeriodArray[1]);

            feeSeqAndPeriodArray = addFeeWithVersionAndReturnfeeSeq("COMMISSION", targetfd.feeschedule, targetfd.version, "FINAL", amtCommission, "Y", targetCapId)
            targetfeeSeq_L.push(feeSeqAndPeriodArray[0]);
            targetpaymentPeriod_L.push(feeSeqAndPeriodArray[1]);
        } else {
            feeSeqAndPeriodArray = addFeeWithVersionAndReturnfeeSeq(targetfd.feeCode, targetfd.feeschedule, targetfd.version, "FINAL", targetfd.feeUnit, "Y", targetCapId)
            targetfeeSeq_L.push(feeSeqAndPeriodArray[0]);
            targetpaymentPeriod_L.push(feeSeqAndPeriodArray[1]);
        }

        createInvoice(targetfeeSeq_L, targetpaymentPeriod_L, targetCapId);

        balanceDue = parseFloat(parseFloat(targetfd.feeUnit) * parseFloat(targetfd.formula));

        //No need to check in dec case
        //        if (unapplied < balanceDue) {
        //            logDebug("insufficient funds to do transfer from receipt record");
        //            return false;
        //        }

        var xferResult = aa.finance.makeFundTransfer(capId, targetCapId, currentUserID, "", "", sysDate, sysDate, "", sysDate, balanceDue, "NA", "Fund Transfer", "NA", "R", null, "", "NA", "");
        if (xferResult.getSuccess())
            logDebug("Successfully did fund transfer to : " + targetCapId.getCustomID());
        else
            logDebug("**ERROR: doing fund transfer to (" + targetCapId.getCustomID() + "): " + xferResult.getErrorMessage());

        //
        // Step 4: On the target, loop through payments then invoices to auto-apply
        //

        var piresult = aa.finance.getPaymentByCapID(targetCapId, null).getOutput()

        for (ik in piresult) {
            var feeSeqArray = new Array();
            var invoiceNbrArray = new Array();
            var feeAllocationArray = new Array();


            var thisPay = piresult[ik];
            var applyAmt = 0;
            var unallocatedAmt = thisPay.getAmountNotAllocated()

            if (unallocatedAmt > 0) {

                var invArray = aa.finance.getInvoiceByCapID(targetCapId, null).getOutput()

                for (var invCount in invArray) {
                    var thisInvoice = invArray[invCount];
                    var balDue = thisInvoice.getInvoiceModel().getBalanceDue();
                    if (balDue > 0) {
                        feeT = aa.invoice.getFeeItemInvoiceByInvoiceNbr(thisInvoice.getInvNbr()).getOutput();

                        for (targetFeeNum in feeT) {
                            var thisTFee = feeT[targetFeeNum];

                            if (thisTFee.getFee() > unallocatedAmt)
                                applyAmt = unallocatedAmt;
                            else
                                applyAmt = thisTFee.getFee()   // use balance here?

                            unallocatedAmt = unallocatedAmt - applyAmt;

                            feeSeqArray.push(thisTFee.getFeeSeqNbr());
                            invoiceNbrArray.push(thisInvoice.getInvNbr());
                            feeAllocationArray.push(applyAmt);
                        }
                    }
                }

                applyResult = aa.finance.applyPayment(targetCapId, thisPay, feeSeqArray, invoiceNbrArray, feeAllocationArray, "PAYSTAT", "INVSTAT", "123")

                if (applyResult.getSuccess())
                    logDebug("Successfully applied payment");
                else
                    logDebug("**ERROR: applying payment to fee (" + thisTFee.getFeeDescription() + "): " + applyResult.getErrorMessage());

            }
        }
    }
    //logDebug("Elapsed Time: " + elapsed());
    logDebug("EXIT: distributeFeesAndPayments");
}
function GenerateDocumentNumber(currentID) {
    logDebug("ENTER: GenerateDocumentNumber");

    var agentId = null;
    if (arguments.length > 1) agentId = arguments[1];

    if (agentId == null) {
        if (salesAgentInfoArray != null) {
            agentId = salesAgentInfoArray["Agent Id"];
        }
    }

    if (agentId == null) {
        agentId = '9999'; //Default for Citizen
    }

    logDebug("EXIT: GenerateDocumentNumber");

    return (agentId + currentID);
}
function updateDocumentNumber(altID) {
    logDebug("ENTER: updateDocumentNumber");
    var itemCap = capId;
    if (arguments.length == 2) itemCap = arguments[1]; // use cap ID specified in args

    var uResult = aa.cap.updateCapAltID(itemCap, altID);
    if (uResult.getSuccess()) {
        //Do nothing
    }
    else {
        logDebug("**WARNING: updating cap alt id :  " + uResult.getErrorMessage());
    }

    logDebug("EXIT: updateDocumentNumber to " + altID);
}

function activateTaskForRec(wfstr) // optional process name
{
    var useProcess = false;
    var processName = "";
    if (arguments.length == 2) {
        processName = arguments[1]; // subprocess
        useProcess = true;
    }

    var itemCap = capId;
    if (arguments.length == 3) itemCap = arguments[2]; // use cap ID specified in args

    var workflowResult = aa.workflow.getTasks(capId);
    if (workflowResult.getSuccess())
        var wfObj = workflowResult.getOutput();
    else
    { logMessage("**ERROR: Failed to get workflow object: " + workflowResult.getErrorMessage()); return false; }

    for (i in wfObj) {
        var fTask = wfObj[i];
        if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase()) && (!useProcess || fTask.getProcessCode().equals(processName))) {
            var stepnumber = fTask.getStepNumber();
            var processID = fTask.getProcessID();

            if (useProcess)
                aa.workflow.adjustTask(itemCap, stepnumber, processID, "Y", "N", null, null)
            else
                aa.workflow.adjustTask(itemCap, stepnumber, "Y", "N", null, null)

            logMessage("Activating Workflow Task: " + wfstr);
            logDebug("Activating Workflow Task: " + wfstr);
        }
    }
}

function closeTaskForRec(wfstr, wfstat, wfcomment, wfnote) // optional process name, cap id
{
    var useProcess = false;
    var processName = "";
    if (arguments.length > 4) {
        if (arguments[4] != "") {
            processName = arguments[4]; // subprocess
            useProcess = true;
        }
    }
    var itemCap = capId;
    if (arguments.length == 6) itemCap = arguments[5]; // use cap ID specified in args

    var workflowResult = aa.workflow.getTasks(itemCap);
    if (workflowResult.getSuccess())
        var wfObj = workflowResult.getOutput();
    else
    { logMessage("**ERROR: Failed to get workflow object: " + workflowResult.getErrorMessage()); return false; }

    if (!wfstat) wfstat = "NA";

    for (i in wfObj) {
        var fTask = wfObj[i];
        if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase()) && (!useProcess || fTask.getProcessCode().equals(processName))) {
            var dispositionDate = aa.date.getCurrentDate();
            var stepnumber = fTask.getStepNumber();
            var processID = fTask.getProcessID();
            if (useProcess)
                aa.workflow.handleDisposition(itemCap, stepnumber, processID, wfstat, dispositionDate, wfnote, wfcomment, systemUserObj, "Y");
            else
                aa.workflow.handleDisposition(itemCap, stepnumber, wfstat, dispositionDate, wfnote, wfcomment, systemUserObj, "Y");
            //logMessage("Closing Workflow Task " + wfstr + " with status " + wfstat);
            //logDebug("Closing Workflow Task " + wfstr + " with status " + wfstat);
        }
    }
}


/*------------------------------------------------------------------------------------------------------/
| The FP4 release includes an updated version of the JavaScript interpreter which allow us to use try/catch blocks.   
/------------------------------------------------------------------------------------------------------*/
function doStandardChoiceActions(stdChoiceEntry, doExecution, docIndent) {
    var thisDate = new Date();
    var thisTime = thisDate.getTime();
    var lastEvalTrue = false;
    stopBranch = false;  // must be global scope

    logDebug("Executing (via override function): " + stdChoiceEntry + ", Elapsed Time: " + ((thisTime - startTime) / 1000) + " Seconds")

    var pairObjArray = getScriptAction(stdChoiceEntry);
    if (!doExecution) docWrite(stdChoiceEntry, true, docIndent);
    for (xx in pairObjArray) {
        doObj = pairObjArray[xx];
        if (doExecution) {
            if (doObj.enabled) {

                if (stopBranch) {
                    stopBranch = false;
                    break;
                }

                logDebug(aa.env.getValue("CurrentUserID") + " : " + stdChoiceEntry + " : #" + doObj.ID + " : Criteria : " + doObj.cri, 2)

                try {

                    if (eval(token(doObj.cri)) || (lastEvalTrue && doObj.continuation)) {
                        logDebug(aa.env.getValue("CurrentUserID") + " : " + stdChoiceEntry + " : #" + doObj.ID + " : Action : " + doObj.act, 2)

                        eval(token(doObj.act));
                        lastEvalTrue = true;
                    }
                    else {
                        if (doObj.elseact) {
                            logDebug(aa.env.getValue("CurrentUserID") + " : " + stdChoiceEntry + " : #" + doObj.ID + " : Else : " + doObj.elseact, 2)
                            eval(token(doObj.elseact));
                        }
                        lastEvalTrue = false;
                    }
                }
                catch (err) {
                    showDebug = 3;
                    logDebug("**ERROR An error occured in the following standard choice " + stdChoiceEntry + "#" + doObj.ID + "  Error:  " + err.message);
                }
            }
        }
        else // just document
        {
            docWrite("|  ", false, docIndent);
            var disableString = "";
            if (!doObj.enabled) disableString = "<DISABLED>";

            if (doObj.elseact)
                docWrite("|  " + doObj.ID + " " + disableString + " " + doObj.cri + " ^ " + doObj.act + " ^ " + doObj.elseact, false, docIndent);
            else
                docWrite("|  " + doObj.ID + " " + disableString + " " + doObj.cri + " ^ " + doObj.act, false, docIndent);

            for (yy in doObj.branch) {
                doStandardChoiceActions(doObj.branch[yy], false, docIndent + 1);
            }
        }
    } // next sAction
    if (!doExecution) docWrite(null, true, docIndent);
    var thisDate = new Date();
    var thisTime = thisDate.getTime();
    logDebug("Finished: " + stdChoiceEntry + ", Elapsed Time: " + ((thisTime - startTime) / 1000) + " Seconds")
}

function getCapIDString() {
    if (capID != null) {
        return capID.getCapID().toString();
    }
    else {
        return "";
    }
}

function getOutput(result, object) {
    if (result.getSuccess()) {
        return result.getOutput();
    }
    else {
        logError("ERROR: Failed to get " + object + ": " + result.getErrorMessage());
        return null;
    }
}

function logError(err) {
    logDebug("**" + err);
}

function getCapId(recordNum) {
    var getCapResult = aa.cap.getCapID(recordNum);

    if (getCapResult.getSuccess()) {
        return getCapResult.getOutput();
    } else {
        return null;
    }
}

function getCapIdBycapIDString(capIDString) {
    var capID;
    if (capIDString) {
        var capIDArray = capIDString.split("-");
        if (capIDArray.length == 3) {
            var capIDResult = aa.cap.getCapID(capIDArray[0], capIDArray[1], capIDArray[2]);
            if (capIDResult.getSuccess()) {
                capID = capIDResult.getOutput();
            }
        }
    }
    return capID;
}

function editLookupAuditStatus(stdChoice, stdValue, stdAuditStaus) {
    //check if stdChoice and stdValue already exist; if they do, update;
    var bizDomScriptResult = aa.bizDomain.getBizDomainByValue(stdChoice, stdValue);
    if (bizDomScriptResult.getSuccess()) {
        bds = bizDomScriptResult.getOutput();

        var bd = bds.getBizDomain()
        bd.setAuditStatus(stdAuditStaus);
        var editResult = aa.bizDomain.editBizDomain(bd)

        if (editResult.getSuccess())
            logDebug("Successfully edited Std Choice Audit Status(" + stdChoice + "," + stdValue + ") = " + stdAuditStaus);
        else
            logDebug("**WARNING editing Std Choice  Audit Statu" + editResult.getErrorMessage());
    }
}
function isRevocationTrapping(contactCondArray) {
    return isRevocation('Trapping Revocation', contactCondArray);
}
function isRevocationHunting(contactCondArray) {
    return isRevocation('Hunting Revocation', contactCondArray);
}
function isRevocationFishing(contactCondArray) {
    return isRevocation('Fishing Revocation', contactCondArray);
}
function isRevocation(RrevocationType, contactCondArray) {
    var isRevoked = false;
    var now = new Date();
    for (var conCond in contactCondArray) {
        var r = contactCondArray[conCond];
        if (r.description == RrevocationType && r.type == 'Revocation') {
            if (r.statusType == "Applied") {
                //if ((!r.effiectDate || now >= r.effiectDate) && (!r.expireDate || now <= r.expireDate)) {     //based on customer request ...Raj
                isRevoked = true;
                break;
            }
            //}
        }
    }
    return isRevoked;
}
function isSuspension(contactCondArray) {
    var isSuspension = false;
    var now = new Date();
    for (var conCond in contactCondArray) {
        var r = contactCondArray[conCond];
        if (r.description == "Suspension of Privileges" && r.type == 'Suspension') {
            if (r.statusType == "Applied") {                                                                    //based on customer request ...Raj
                //if (now >= r.effiectDate && now <= r.expireDate) {                                            
                isSuspension = true;
                break;
                //}
            }
        }
    }
    return isSuspension;
}
function isMarkForAgedInFulfillment(contactCondArray) {
    var cnd = new COND_FULLFILLMENT();
    return isFulfillmentCond(cnd.Condition_VerifyAgedIn, contactCondArray);
}
function isMarkForNeedHutEdFulfillment(contactCondArray) {
    var cnd = new COND_FULLFILLMENT();
    return isFulfillmentCond(cnd.Condition_NeedHuntingEd, contactCondArray);
}
function isFulfillmentCond(FulfillmentType, contactCondArray) {
    var isNeedFulfillment = false;
    var now = new Date();
    for (var conCond in contactCondArray) {
        var r = contactCondArray[conCond];
        if (r.description == FulfillmentType && r.type == 'Revocation') {
            //if (now >= r.effiectDate && now <= r.expireDate) {
            isNeedFulfillment = true;
            break;
            //}
        }
    }
    return isNeedFulfillment;
}
function getContactCondutions(peopleSequenceNumber) {
    var lang = "ar_AE";

    var conCondResult = aa.commonCondition.getCommonConditions("CONTACT", peopleSequenceNumber);
    var resultArray = new Array();

    var conCondArray = new Array();
    if (!conCondResult.getSuccess()) {
        logDebug("**WARNING: getting contact Conditions : " + licCondResult.getErrorMessage());
    }
    else {
        conCondArray = conCondResult.getOutput();
    }

    for (var thisConCond in conCondArray) {
        var thisCond = conCondArray[thisConCond];
        var cType = thisCond.getConditionType();
        var cStatus = thisCond.getConditionStatus();
        var cDesc = thisCond.getConditionDescription();
        var cImpact = thisCond.getImpactCode();
        var cComment = thisCond.getConditionComment();
        if (cType == null)
            cType = " ";
        if (cStatus == null)
            cStatus = " ";
        if (cDesc == null)
            cDesc = " ";
        if (cImpact == null)
            cImpact = " ";

        var r = new condMatchObjEx();
        r.objType = "Contact";
        r.contactObj = null;  //conArray[thisCon];
        r.status = cStatus;
        r.type = cType;
        r.impact = cImpact;
        r.description = cDesc;
        r.comment = cComment;
        r.statusType = thisCond.getConditionStatusType();
        if (thisCond.getEffectDate() != null) {
            r.effiectDate = new Date(thisCond.getEffectDate().getYear(), thisCond.getEffectDate().getMonth() - 1, thisCond.getEffectDate().getDayOfMonth());
        }
        if (thisCond.getExpireDate() != null) {
            r.expireDate = new Date(thisCond.getExpireDate().getYear(), thisCond.getExpireDate().getMonth() - 1, thisCond.getExpireDate().getDayOfMonth());
        }

        var langCond = aa.condition.getCondition(thisCond, lang).getOutput();

        r.arObject = langCond;
        r.arDescription = langCond.getResConditionDescription();
        r.arComment = langCond.getResConditionComment();

        resultArray.push(r);
    }
    return resultArray;
}
function condMatchObjEx() {
    this.objType = null;
    this.object = null;
    this.contactObj = null;
    this.addressObj = null;
    this.licenseObj = null;
    this.parcelObj = null;
    this.status = null;
    this.statusType = null;
    this.type = null;
    this.impact = null;
    this.description = null;
    this.comment = null;
    this.arObject = null;
    this.arDescription = null;
    this.arComment = null;
    this.effiectDate = null;
    this.expireDate = null;
}
function attachAgent(uObj) //Add optional capId param for Record to attach to
{
    var itemCap = capId;
    if (arguments.length > 1) itemCap = arguments[1]; // use cap ID specified in args

    if (uObj.authAgentPeopleSequenceNumber != null) {
        var pmpeople = getOutput(aa.people.getPeople(uObj.authAgentPeopleSequenceNumber), "");

        //Create Cap Contact 
        var result = aa.people.createCapContactWithRefPeopleModel(itemCap, pmpeople);
        if (result.getSuccess()) {
            logDebug("Contact successfully added to CAP.");
        } else {
            logDebug("**ERROR: Failed to get Contact Nbr: " + result.getErrorMessage());
        }
    } else {
        //JIRA - 18414
        var peopleSequenceNumber = null;
        var businessName = "Individual Sale";
        var contactType = "DEC Agent";
        var resultPeopleArray = getAgentByBusinessName(contactType, businessName);
        for (var cp in resultPeopleArray) {
            peopleSequenceNumber = resultPeopleArray[cp].getContactSeqNumber();
            break;
        }
        if (peopleSequenceNumber != null) {
            var pmpeople = getOutput(aa.people.getPeople(peopleSequenceNumber), "");

            //Create Cap Contact 
            var result = aa.people.createCapContactWithRefPeopleModel(itemCap, pmpeople);
            if (result.getSuccess()) {
                logDebug("Contact successfully added to CAP.");
            } else {
                logDebug("**ERROR: Failed to get Contact Nbr: " + result.getErrorMessage());
            }
        }
        ////
    }
}
function attachedContacts() {
    var peopleSequenceNumber = null;
    var thisCap = capId;
    if (arguments.length == 1) {
        peopleSequenceNumber = arguments[0];
    }
    if (arguments.length == 2) {
        peopleSequenceNumber = arguments[0];
        thisCap = arguments[1];
    }
    var isForAnonymous = false;
    if (peopleSequenceNumber == null) {
        if (publicUserID == 'PUBLICUSER0') {
            isForAnonymous = true;
        } else {
            var uObj = new USEROBJ(publicUserID);
            peopleSequenceNumber = uObj.peopleSequenceNumber;
            isForAnonymous = uObj.acctType != "CITIZEN";
        }

        if (isForAnonymous) {
            var firstname = 'Anonymous';
            var lastname = 'Anonymous';
            var resultPeopleArray = getPeoplesByFnameLnameDOB(lastname, firstname, null);
            for (var cp in resultPeopleArray) {
                peopleSequenceNumber = resultPeopleArray[cp].getContactSeqNumber();
                break;
            }
        }
    }
    if (peopleSequenceNumber != null) {
        var pmpeople = getOutput(aa.people.getPeople(peopleSequenceNumber), "");

        //Create Cap Contact 
        var result = aa.people.createCapContactWithRefPeopleModel(thisCap, pmpeople);
        if (result.getSuccess()) {
            logDebug("Contact successfully added to CAP.");
        } else {
            logDebug("**ERROR: Failed to get Contact Nbr: " + result.getErrorMessage());
        }
    }
}

function getPeoplesByFnameLnameDOB(lastname, firstname, birthDate) {
    var peopResult = null;
    var vError = null;
    try {
        var qryPeople = aa.people.createPeopleModel().getOutput().getPeopleModel();
        qryPeople.setBirthDate(birthDate)
        qryPeople.setFirstName(firstname)
        qryPeople.setLastName(lastname)

        var r = aa.people.getPeopleByPeopleModel(qryPeople);
        if (r.getSuccess()) {
            peopResult = r.getOutput();
            if (peopResult.length == 0) {
                logDebug("Searched for REF contact, no matches found, returing null");
                peopResult = null
            }
        }
    }
    catch (vError) {
        logDebug("Runtime error occurred: " + vError);
    }
    return peopResult;
}

function isValidBuyRecord(pStep) {
    logDebug("ENTER: isValidBuyRecord");
    var retMsg = '';
    var msg = '';
    //Calller ACA ONSUBMIT BEFORE TBL UPDATE
    if (pStep == 'Step1') {
        logDebug("pStep = Step1...");

        msg = verifyMilitaryServiceType();
        if (msg != '') {
            retMsg += msg;
        }
        msg = verifySportsmanEd();
        if (msg != '') {
            retMsg += msg;
        }
        msg = verifyPreviousLicense();
        if (msg != '') {
            retMsg += msg;
        }
        msg = verifyAnnulaDisability();
        if (msg != '') {
            retMsg += msg;
        }
        msg = verifyNotMilitaryAndDisabled();
        if (msg != '') {
            retMsg += msg;
        }
        msg = ActiveOrReserve();
        if (msg != '') {
            retMsg += msg;
        }
        msg = VerifyFeets();
        if (msg != '') {
            retMsg += msg;
        }
        msg = VerifyInches();
        if (msg != '') {
            retMsg += msg;
        }
    }

    //Called via Pageflow from Standard Choice -> ACA ONSUBMIT BEFORE SALESSELECT
    if (pStep == 'Step3') {
        logDebug("pStep = Step1...");

        logDebug("call verifyAnySalesSelect()...");
        msg = verifyAnySalesSelect();
        retMsg += msg;

        logDebug("Check ASI fields for valid numeric value...");
        var isValid = true;
        if (!isValidIntegerNumber(AInfo["Quantity Trail Supporter Patch"])) {
            retMsg += 'Please enter valid integer number for Quantity Trail Supporter Patch.';
            retMsg += "<Br />";
        }
        if (!isValidIntegerNumber(AInfo["Quantity Habitat/Access Stamp"])) {
            retMsg += 'Please enter valid integer number for Quantity Habitat/Access Stamp.';
            retMsg += "<Br />";
        }
        if (!isValidIntegerNumber(AInfo["Quantity Venison Donation"])) {
            retMsg += 'Please enter valid integer number for Quantity Venison Donation.';
            retMsg += "<Br />";
        }
        if (!isValidIntegerNumber(AInfo["Quantity Conservation Patron"])) {
            retMsg += 'Please enter valid integer number for Quantity Conservation Patron.';
            retMsg += "<Br />";
        }
        if (!isValidIntegerNumber(AInfo["Quantity Conservation Fund"])) {
            retMsg += 'Please enter valid integer number for Quantity Conservation Fund.';
            retMsg += "<Br />";
        }

        logDebug("call validateFishingdates()...");
        msg = validateFishingdates();
        retMsg += msg;

        logDebug("call verifyDMPinfo()...");
        msg = verifyDMPinfo();
        if (msg != '') {
            retMsg += msg;
        }

        logDebug("call verifyLandOwnerInfo()...");
        msg = verifyLandOwnerInfo();
        if (msg != '') {
            retMsg += msg;
        }
    }

    logDebug("Message to return to ACA: " + retMsg);

    logDebug("EXIT: isValidBuyRecord");
    return retMsg;
}
function validateFishingdates() {
    var retMsg = '';
    var msg = '';

    var f = new form_OBJECT(GS2_EXPR, OPTZ_TYPE_CTRC);
    f.Year = AInfo["License Year"];
    f.SetActiveHoldingsInfo(AInfo["A_ActiveHoldings"]);

    if (isNull(AInfo["Effective Date One Day Fishing"], '') == '' && (AInfo["One Day Fishing License"] == "CHECKED" || AInfo["Nonresident 1 Day Fishing"] == "CHECKED")) {
        retMsg += "Please enter One Day Fishing Effective Date.";
        retMsg += "<Br />";
    }
    else if (isNull(AInfo["Effective Date One Day Fishing"], '') != '') {
        if (dateDiff(AInfo["Effective Date One Day Fishing"], new Date()) >= 1) {
            retMsg += "One Day Fishing Effective Date cannot be prior to today's date.";
            retMsg += "<Br />";
        } else {
            if (f.isAfterSwitchDate()) {
                msg = f.isActiveFishingLic(isNull(AInfo["Effective Date One Day Fishing"], ''), '1 Day');
                if (msg != '') {
                    retMsg += msg;
                    retMsg += "<Br />";
                }
            }
        }
    }
    if (isNull(AInfo["Effective Date Seven Day Fishing"], '') == '' && (AInfo["Nonresident 7 Day Fishing"] == "CHECKED" || AInfo["Seven Day Fishing License"] == "CHECKED")) {
        retMsg += "Please enter Seven Day Fishing Effective Date.";
        retMsg += "<Br />";
    }
    else if (isNull(AInfo["Effective Date Seven Day Fishing"], '') != '') {
        if (dateDiff(AInfo["Effective Date Seven Day Fishing"], new Date()) >= 1) {
            retMsg += "Seven Day Fishing Effective Date cannot be prior to today's date.";
            retMsg += "<Br />";
        } else {
            if (f.isAfterSwitchDate()) {
                msg = f.isActiveFishingLic(isNull(AInfo["Effective Date Seven Day Fishing"], ''), '7 Day');
                if (msg != '') {
                    retMsg += msg;
                    retMsg += "<Br />";
                }
            }
        }
    }
    if (isNull(AInfo["Effective Date Fishing"], '') == '' && (AInfo["Freshwater Fishing"] == "CHECKED" || AInfo["NonRes Freshwater Fishing"] == "CHECKED")) {
        retMsg += "Please enter Seven Day Fishing Effective Date.";
        retMsg += "<Br />";
    }
    else if (isNull(AInfo["Effective Date Fishing"], '') != '') {
        if (f.isAfterSwitchDate()) {
            if (dateDiff(AInfo["Effective Date Fishing"], new Date()) >= 1) {
                retMsg += "Fishing Effective Date cannot be prior to today's date.";
                retMsg += "<Br />";
            } else {
                if (f.isAfterSwitchDate()) {
                    msg = f.isActiveFishingLic(isNull(AInfo["Effective Date Fishing"], ''), '');
                    if (msg != '') {
                        retMsg += msg;
                        retMsg += "<Br />";
                    }
                }
            }
        }
    }
    //JIRA-44417
    msg = f.fishdateMap()
    if (msg != '') {
        retMsg += msg;
        retMsg += "<Br />";
    }

    if (isNull(AInfo["Effective Date Marine"], '') == '' && (AInfo["Marine Registry"] == "CHECKED")) {
        retMsg += "Please enter Marine Effective Date.";
        retMsg += "<Br />";
    }
    else if (isNull(AInfo["Effective Date Marine"], '') != '') {
        if (f.isAfterSwitchDate()) {
            if (dateDiff(AInfo["Effective Date Marine"], new Date()) >= 1) {
                retMsg += "Marine Effective Date cannot be prior to today's date.";
                retMsg += "<Br />";
            } else {
                if (f.isAfterSwitchDate()) {
                    //JIRA-44556
                    msg = f.isActiveMarine(isNull(AInfo["Effective Date Marine"], ''), '');
                    if (msg != '') {
                        retMsg += msg;
                        retMsg += "<Br />";
                    }
                }
            }
        }
    }

    return retMsg;

}
function USEROBJ(publicUserID) {
    this.publicUserID = publicUserID;
    this.userId = null;
    this.authAgentID = null;
    this.acctType = null;
    this.userModel = null;
    this.peopleSequenceNumber = null;
    this.authAgentPeopleSequenceNumber = null;

    this.setPublicUserInfo = function () {
        try {
            var pUserID = this.publicUserID;
            if (arguments.length == 1) pUserID = arguments[0];

            if (pUserID != null) {
                this.userId = aa.person.getUser(pUserID).getOutput().getFirstName();
                this.userModel = this.getUserModel();
                this.setUserModelAttributes(this.userModel);
            }
        }
        catch (err) {
            logDebug("Exception in setPublicUserInfo:" + err.message);
        }
    }
    this.setUserModelAttributes = function () {
        var userModel = this.userModel;
        if (arguments.length == 1) userModel = arguments[0];
        if (userModel != null) {
            this.acctType = userModel.getAccountType();
            this.userSeqNum = userModel.getUserSeqNum();
            this.authAgentID = userModel.getAuthAgentID();
            this.peopleSequenceNumber = this.getPeopleSeqNum(this.userSeqNum);
            this.authAgentPeopleSequenceNumber = this.getAuthAgentPeopleSeqNum();
        }
    }
    this.getAuthAgentPeopleSeqNum = function () {
        var peopleSequenceNumber = null;
        try {
            if (this.authAgentID != null) {
                var userModel = this.getUserModel(this.authAgentID);
                if (userModel != null) {
                    peopleSequenceNumber = this.getPeopleSeqNum(userModel.getUserSeqNum());
                }
            } else {
                if (this.acctType != "CITIZEN") {
                    peopleSequenceNumber = this.peopleSequenceNumber;
                }
            }
        }
        catch (err) {
            logDebug("Exception in getAuthAgentPeopleSeqNum:" + err.message);
        }

        return peopleSequenceNumber;
    }

    this.getUserModel = function () {
        var suserId = this.userId;
        if (arguments.length == 1) suserId = arguments[0];

        var userModel = null;
        var getUserResult = aa.publicUser.getPublicUserByUserId(suserId);
        if (getUserResult.getSuccess()) {
            userModel = getUserResult.getOutput();
            if (userModel == null) {
                logDebug("**WARNING: User Id Not fond. " + suserId + " :  " + getUserResult.getErrorMessage());
            }
        }
        else {
            logDebug("**WARNING: User Id Not fond. " + suserId + " :  " + getUserResult.getErrorMessage());
        }
        return userModel;
    }
    this.getPeopleSeqNum = function (userSeqNum) {
        var peopleSequenceNumber = null;
        try {
            var userSeqNumList = aa.util.newArrayList();
            userSeqNumList.add(userSeqNum);

            var ccb = aa.proxyInvoker.newInstance("com.accela.pa.people.ContractorPeopleBusiness").getOutput();
            var t = ccb.getContractorPeopleListByUserSeqNBR(aa.getServiceProviderCode(), userSeqNumList);
            if (t.size() > 0) {
                var aC = t.toArray();
                for (var x in aC) {
                    peopleSequenceNumber = aC[x].getContactSeqNumber();
                }
            }
        }
        catch (err) {
            logDebug("Exception in getPeopleSeqNum:" + err.message);
        }
        return peopleSequenceNumber;
    }
    this.setPublicUserInfo();
}
function getAgentInfo(publicUserID) {
    var returnArray = new Array();
    try {
        var uObj;
        if (arguments.length > 1) {
            uObj = arguments[1];
        } else {
            uObj = new USEROBJ(publicUserID);
        }
        if (uObj.authAgentPeopleSequenceNumber != null) {
            returnArray = getAgentInfoByPeopleSeqNum(uObj.authAgentPeopleSequenceNumber);
        }

    }
    catch (err) {
        logDebug("Exception in getAgentInfo:" + err.message);
    }
    return returnArray;
}
function getAgentInfoByPeopleSeqNum(peopleSequenceNumber) {
    var returnArray = new Array();

    var peopleModel = getOutput(aa.people.getPeople(peopleSequenceNumber), "");
    var subGroupArray = getTemplateValueByFormArrays(peopleModel.getTemplate(), null, null);
    //GetAllASI(subGroupArray);
    for (var subGroupName in subGroupArray) {
        var fieldArray = subGroupArray[subGroupName];
        for (var fld in fieldArray) {
            returnArray[fld] = fieldArray[fld];
        }
    }
    return returnArray;
}

/*------------------------------------------------------------------------------------------------------/
| ContactObj
/------------------------------------------------------------------------------------------------------*/
function getContactObj(itemCap, typeToLoad) {
    // returning the first match on contact type
    var capContactArray = null;
    var cArray = new Array();
    if (itemCap == null) return cArray;

    var capContactArray;
    if (itemCap.getClass() == "com.accela.aa.aamain.cap.CapModel") { // page flow script 
        capContactArray = cap.getContactsGroup().toArray();
    }
    else {
        var capContactResult = aa.people.getCapContactByCapID(itemCap);
        if (capContactResult.getSuccess()) {
            capContactArray = capContactResult.getOutput();
        }
    }

    if (capContactArray) {
        for (var yy in capContactArray) {
            if (capContactArray[yy].getPeople().contactType.toUpperCase().equals(typeToLoad.toUpperCase())) {
                logDebug("getContactObj returned the first contact of type " + typeToLoad + " on record " + itemCap.getCustomID());
                return new contactObj(capContactArray[yy]);
            }
        }
    }

    logDebug("getContactObj could not find a contact of type " + typeToLoad + " on record " + itemCap.getCustomID());
    return false;

}

function getContactObjs(itemCap) // optional typeToLoad, optional return only one instead of Array?
{
    var typesToLoad = false;
    if (arguments.length == 2) typesToLoad = arguments[1];
    var capContactArray = null;
    var cArray = new Array();
    if (itemCap == null) return cArray;

    var capContactArray;
    if (itemCap.getClass() == "com.accela.aa.aamain.cap.CapModel") { // page flow script 
        capContactArray = cap.getContactsGroup().toArray();
    }
    else {
        var capContactResult = aa.people.getCapContactByCapID(itemCap);
        if (capContactResult.getSuccess()) {
            capContactArray = capContactResult.getOutput();
        }
    }

    if (capContactArray) {
        for (var yy in capContactArray) {
            if (!typesToLoad || exists(capContactArray[yy].getPeople().contactType, typesToLoad)) {
                cArray.push(new contactObj(capContactArray[yy]));
            }
        }
    }

    logDebug("getContactObj returned " + cArray.length + " contactObj(s)");
    return cArray;

}

function contactObj(ccsm) {

    this.people = null;         // for access to the underlying data
    this.capContact = null;     // for access to the underlying data
    this.capContactScript = null;   // for access to the underlying data
    this.capId = null;
    this.type = null;
    this.seqNumber = null;
    this.refSeqNumber = null;
    this.asiObj = null;
    this.asi = new Array();    // associative array of attributes
    this.primary = null;
    this.relation = null;
    this.addresses = null;  // array of addresses

    this.capContactScript = ccsm;
    if (ccsm) {
        if (ccsm.getCapContactModel == undefined) {  // page flow
            this.people = this.capContactScript.getPeople();
            this.refSeqNumber = this.capContactScript.getRefContactNumber();
        }
        else {
            this.capContact = ccsm.getCapContactModel();
            this.people = this.capContact.getPeople();
            this.refSeqNumber = this.capContact.getRefContactNumber();
        }

        this.asiObj = this.people.getAttributes().toArray();
        for (var xx1 in this.asiObj) this.asi[this.asiObj[xx1].attributeName] = this.asiObj[xx1].attributeValue;
        //this.primary = this.capContact.getPrimaryFlag().equals("Y");
        this.primary = this.capContact.getPrimaryFlag() && this.capContact.getPrimaryFlag().equals("Y");
        this.relation = this.people.relation;
        this.seqNumber = this.people.contactSeqNumber;
        this.type = this.people.getContactType();
        this.capId = this.capContactScript.getCapID();
        var contactAddressrs = aa.address.getContactAddressListByCapContact(this.capContact);
        if (contactAddressrs.getSuccess()) {
            this.addresses = contactAddressrs.getOutput();
            var contactAddressModelArr = convertContactAddressModelArr(contactAddressrs.getOutput());
            this.people.setContactAddressList(contactAddressModelArr);
        }
    }
    this.toString = function () { return this.capId + " : " + this.type + " " + this.people.getLastName() + "," + this.people.getFirstName() + " (id:" + this.seqNumber + "/" + this.refSeqNumber + ") #ofAddr=" + this.addresses.length + " primary=" + this.primary; }

    this.getEmailTemplateParams = function (params) {
        addParameter(params, "$$LastName$$", this.people.getLastName());
        addParameter(params, "$$FirstName$$", this.people.getFirstName());
        addParameter(params, "$$MiddleName$$", this.people.getMiddleName());
        addParameter(params, "$$BusinesName$$", this.people.getBusinessName());
        addParameter(params, "$$ContactSeqNumber$$", this.seqNumber);
        addParameter(params, "$$ContactType$$", this.type);
        addParameter(params, "$$Relation$$", this.relation);
        addParameter(params, "$$Phone1$$", this.people.getPhone1());
        addParameter(params, "$$Phone2$$", this.people.getPhone2());
        addParameter(params, "$$Email$$", this.people.getEmail());
        addParameter(params, "$$AddressLine1$$", this.people.getCompactAddress().getAddressLine1());
        addParameter(params, "$$AddressLine2$$", this.people.getCompactAddress().getAddressLine2());
        addParameter(params, "$$City$$", this.people.getCompactAddress().getCity());
        addParameter(params, "$$State$$", this.people.getCompactAddress().getState());
        addParameter(params, "$$Zip$$", this.people.getCompactAddress().getZip());
        addParameter(params, "$$Fax$$", this.people.getFax());
        addParameter(params, "$$Country$$", this.people.getCompactAddress().getCountry());
        addParameter(params, "$$FullName$$", this.people.getFullName());
        return params;
    }

    this.replace = function (targetCapId) { // send to another record, optional new contact type

        var newType = this.type;
        if (arguments.length == 2) newType = arguments[1];
        //2. Get people with target CAPID.
        var targetPeoples = getContactObjs(targetCapId, [String(newType)]);
        //3. Check to see which people is matched in both source and target.
        for (var loopk in targetPeoples) {
            var targetContact = targetPeoples[loopk];
            if (this.equals(targetPeoples[loopk])) {
                targetContact.people.setContactType(newType);
                aa.people.copyCapContactModel(this.capContact, targetContact.capContact);
                targetContact.people.setContactAddressList(this.people.getContactAddressList());
                overwriteResult = aa.people.editCapContactWithAttribute(targetContact.capContact);
                if (overwriteResult.getSuccess())
                    logDebug("overwrite contact " + targetContact + " with " + this);
                else
                    logDebug("error overwriting contact : " + this + " : " + overwriteResult.getErrorMessage());
                return true;
            }
        }

        var tmpCapId = this.capContact.getCapID();
        var tmpType = this.type;
        this.people.setContactType(newType);
        this.capContact.setCapID(targetCapId);
        createResult = aa.people.createCapContactWithAttribute(this.capContact);
        if (createResult.getSuccess())
            logDebug("(contactObj) contact created : " + this);
        else
            logDebug("(contactObj) error creating contact : " + this + " : " + createResult.getErrorMessage());
        this.capContact.setCapID(tmpCapId);
        this.type = tmpType;
        return true;
    }

    this.equals = function (t) {
        if (t == null) return false;
        if (!String(this.people.type).equals(String(t.people.type))) { return false; }
        if (!String(this.people.getFirstName()).equals(String(t.people.getFirstName()))) { return false; }
        if (!String(this.people.getLastName()).equals(String(t.people.getLastName()))) { return false; }
        if (!String(this.people.getFullName()).equals(String(t.people.getFullName()))) { return false; }
        return true;
    }

    this.saveBase = function () {
        // set the values we store outside of the models.
        this.people.setContactType(this.type);
        this.capContact.setPrimaryFlag(this.primary ? "Y" : "N");
        this.people.setRelation(this.relation);
        saveResult = aa.people.editCapContact(this.capContact);
        if (saveResult.getSuccess())
            logDebug("(contactObj) base contact saved : " + this);
        else
            logDebug("(contactObj) error saving base contact : " + this + " : " + saveResult.getErrorMessage());
    }

    this.save = function () {
        // set the values we store outside of the models
        this.people.setContactType(this.type);
        this.capContact.setPrimaryFlag(this.primary ? "Y" : "N");
        this.people.setRelation(this.relation);
        saveResult = aa.people.editCapContactWithAttribute(this.capContact);
        if (saveResult.getSuccess())
            logDebug("(contactObj) contact saved : " + this);
        else
            logDebug("(contactObj) error saving contact : " + this + " : " + saveResult.getErrorMessage());
    }

    this.remove = function () {
        var removeResult = aa.people.removeCapContact(this.capId, this.seqNumber)
        if (removeResult.getSuccess())
            logDebug("(contactObj) contact removed : " + this + " from record " + this.capId.getCustomID());
        else
            logDebug("(contactObj) error removing contact : " + this + " : from record " + this.capId.getCustomID() + " : " + removeResult.getErrorMessage());
    }

    this.createPublicUser = function () {

        if (!this.capContact.getEmail())
        { logDebug("(contactObj) Couldn't create public user for : " + this + ", no email address"); return false; }

        if (String(this.people.getContactTypeFlag()).equals("organization"))
        { logDebug("(contactObj) Couldn't create public user for " + this + ", the contact is an organization"); return false; }

        // check to see if public user exists already based on email address
        var getUserResult = aa.publicUser.getPublicUserByEmail(this.capContact.getEmail())
        if (getUserResult.getSuccess() && getUserResult.getOutput()) {
            userModel = getUserResult.getOutput();
            logDebug("(contactObj) createPublicUserFromContact: Found an existing public user: " + userModel.getUserID());
        }

        if (!userModel) // create one
        {
            logDebug("(contactObj) CreatePublicUserFromContact: creating new user based on email address: " + this.capContact.getEmail());
            var publicUser = aa.publicUser.getPublicUserModel();
            publicUser.setFirstName(this.capContact.getFirstName());
            publicUser.setLastName(this.capContact.getLastName());
            publicUser.setEmail(this.capContact.getEmail());
            publicUser.setUserID(this.capContact.getEmail());
            publicUser.setPassword("e8248cbe79a288ffec75d7300ad2e07172f487f6"); //password : 1111111111
            publicUser.setAuditID("PublicUser");
            publicUser.setAuditStatus("A");
            publicUser.setCellPhone(this.people.getPhone2());

            var result = aa.publicUser.createPublicUser(publicUser);
            if (result.getSuccess()) {

                logDebug("(contactObj) Created public user " + this.capContact.getEmail() + "  sucessfully.");
                var userSeqNum = result.getOutput();
                var userModel = aa.publicUser.getPublicUser(userSeqNum).getOutput()

                // create for agency
                aa.publicUser.createPublicUserForAgency(userModel);

                // activate for agency
                var userPinBiz = aa.proxyInvoker.newInstance("com.accela.pa.pin.UserPINBusiness").getOutput()
                userPinBiz.updateActiveStatusAndLicenseIssueDate4PublicUser(aa.getServiceProviderCode(), userSeqNum, "ADMIN");

                // reset password
                var resetPasswordResult = aa.publicUser.resetPassword(this.capContact.getEmail());
                if (resetPasswordResult.getSuccess()) {
                    var resetPassword = resetPasswordResult.getOutput();
                    userModel.setPassword(resetPassword);
                    logDebug("(contactObj) Reset password for " + this.capContact.getEmail() + "  sucessfully.");
                } else {
                    logDebug("(contactObj **WARNING: Reset password for  " + this.capContact.getEmail() + "  failure:" + resetPasswordResult.getErrorMessage());
                }

                // send Activate email
                aa.publicUser.sendActivateEmail(userModel, true, true);

                // send another email
                aa.publicUser.sendPasswordEmail(userModel);
            }
            else {
                logDebug("(contactObj) **WARNIJNG creating public user " + this.capContact.getEmail() + "  failure: " + result.getErrorMessage()); return null;
            }
        }

        //  Now that we have a public user let's connect to the reference contact       

        if (this.refSeqNumber) {
            logDebug("(contactObj) CreatePublicUserFromContact: Linking this public user with reference contact : " + this.refSeqNumber);
            aa.licenseScript.associateContactWithPublicUser(userModel.getUserSeqNum(), this.refSeqNumber);
        }


        return userModel; // send back the new or existing public user
    }

    this.isSingleAddressPerType = function () {
        if (this.addresses.length > 1) {

            var addrTypeCount = new Array();
            for (y in this.addresses) {
                thisAddr = this.addresses[y];
                addrTypeCount[thisAddr.addressType] = 0;
            }

            for (yy in this.addresses) {
                thisAddr = this.addresses[yy];
                addrTypeCount[thisAddr.addressType] += 1;
            }

            for (z in addrTypeCount) {
                if (addrTypeCount[z] > 1)
                    return false;
            }
        }
        else {
            return true;
        }

        return true;

    }

    this.addAKA = function (firstName, middleName, lastName, fullName, startDate, endDate) {
        if (!this.refSeqNumber) {
            logDebug("contactObj: Cannot add AKA name for non-reference contact");
            return false;
        }

        var aka = aa.proxyInvoker.newInstance("com.accela.aa.aamain.people.PeopleAKABusiness").getOutput();
        var args = new Array();
        var akaModel = aa.proxyInvoker.newInstance("com.accela.orm.model.contact.PeopleAKAModel", args).getOutput();
        var auditModel = aa.proxyInvoker.newInstance("com.accela.orm.model.common.AuditModel", args).getOutput();

        var a = aka.getPeopleAKAListByContactNbr(aa.getServiceProviderCode(), String(this.refSeqNumber));
        akaModel.setServiceProviderCode(aa.getServiceProviderCode());
        akaModel.setContactNumber(parseInt(this.refSeqNumber));
        akaModel.setFirstName(firstName);
        akaModel.setMiddleName(middleName);
        akaModel.setLastName(lastName);
        akaModel.setFullName(fullName);
        akaModel.setStartDate(startDate);
        akaModel.setEndDate(endDate);
        auditModel.setAuditDate(new Date());
        auditModel.setAuditStatus("A");
        auditModel.setAuditID("ADMIN");
        akaModel.setAuditModel(auditModel);
        a.add(akaModel);

        aka.saveModels(aa.getServiceProviderCode(), this.refSeqNumber, a);
    }

    this.removeAKA = function (firstName, middleName, lastName) {
        if (!this.refSeqNumber) {
            logDebug("contactObj: Cannot remove AKA name for non-reference contact");
            return false;
        }

        var removed = false;
        var aka = aa.proxyInvoker.newInstance("com.accela.aa.aamain.people.PeopleAKABusiness").getOutput();
        var l = aka.getPeopleAKAListByContactNbr(aa.getServiceProviderCode(), String(this.refSeqNumber));

        var i = l.iterator();
        while (i.hasNext()) {
            var thisAKA = i.next();
            if ((!thisAKA.getFirstName() || thisAKA.getFirstName().equals(firstName)) && (!thisAKA.getMiddleName() || thisAKA.getMiddleName().equals(middleName)) && (!thisAKA.getLastName() || thisAKA.getLastName().equals(lastName))) {
                i.remove();
                logDebug("contactObj: removed AKA Name : " + firstName + " " + middleName + " " + lastName);
                removed = true;
            }
        }

        if (removed)
            aka.saveModels(aa.getServiceProviderCode(), this.refSeqNumber, l);
    }

    this.getCaps = function () { // option record type filter
        if (this.refSeqNumber) {
            //aa.print("ref seq : " + this.refSeqNumber);   - Raj 10/31/2013
            var capTypes = null;
            var resultArray = new Array();
            if (arguments.length == 1) capTypes = arguments[0];

            var pm = aa.people.createPeopleModel().getOutput().getPeopleModel();
            var ccb = aa.proxyInvoker.newInstance("com.accela.aa.aamain.people.CapContactDAOOracle").getOutput();
            pm.setServiceProviderCode(aa.getServiceProviderCode());
            pm.setContactSeqNumber(this.refSeqNumber);

            var cList = ccb.getCapContactsByRefContactModel(pm).toArray();

            for (var j in cList) {
                var thisCapId = aa.cap.getCapID(cList[j].getCapID().getID1(), cList[j].getCapID().getID2(), cList[j].getCapID().getID3()).getOutput();
                if (capTypes && appMatch(capTypes, thisCapId)) {
                    resultArray.push(thisCapId)
                }
            }
        }

        return resultArray;
    }
}
function convertContactAddressModelArr(contactAddressScriptModelArr) {
    var contactAddressModelArr = null;
    if (contactAddressScriptModelArr != null && contactAddressScriptModelArr.length > 0) {
        contactAddressModelArr = aa.util.newArrayList();
        for (loopk in contactAddressScriptModelArr) {
            contactAddressModelArr.add(contactAddressScriptModelArr[loopk].getContactAddressModel());
        }
    }
    return contactAddressModelArr;
}

/*------------------------------------------------------------------------------------------------------/
|  ContactObj (END)
/------------------------------------------------------------------------------------------------------*/
/**
* Create Record Type instance.
*/
function getRecordTypeInstance(group, type, subType, category) {
    var capTypeModelResult = aa.cap.getCapTypeModel();

    var capTypeModel = capTypeModelResult.getOutput();
    capTypeModel.setGroup(group);
    capTypeModel.setType(type);
    capTypeModel.setSubType(subType);
    capTypeModel.setCategory(category);

    return capTypeModel;
}

/*------------------------------------------------------------------------------------------------------/
|   Create set. Last update: 6/18/2013
/------------------------------------------------------------------------------------------------------*/
function createSet(setName, setDescription, setType, setStatus, setComment, setStatusComment) {

    var setScript = aa.set.getSetHeaderScriptModel().getOutput();
    setScript.setSetID(setName);
    setScript.setSetTitle(setDescription);
    setScript.setSetComment(setComment);
    setScript.setSetStatus(setStatus);
    setScript.setSetStatusComment(setStatusComment);
    setScript.setRecordSetType(setType);
    setScript.setServiceProviderCode(aa.getServiceProviderCode());
    setScript.setAuditDate(aa.date.getCurrentDate());
    setScript.setAuditID(currentUserID);

    var setCreateResult = aa.set.createSetHeader(setScript);

    return setCreateResult.getSuccess();
}

/*------------------------------------------------------------------------------------------------------/
|   capSet object. Last update: 10/18/2013
/------------------------------------------------------------------------------------------------------*/

function capSet(desiredSetId) {
    this.refresh = function () {

        var theSet = aa.set.getSetByPK(this.id).getOutput();
        this.status = theSet.getSetStatus();
        this.setId = theSet.getSetID();
        this.name = theSet.getSetTitle();
        this.comment = theSet.getSetComment();
        this.model = theSet.getSetHeaderModel();
        this.statusComment = theSet.getSetStatusComment();
        this.type = theSet.getRecordSetType();

        var memberResult = aa.set.getCAPSetMembersByPK(this.id);

        if (!memberResult.getSuccess()) { logDebug("**WARNING** error retrieving set members " + memberResult.getErrorMessage()); }
        else {
            this.members = memberResult.getOutput().toArray();
            this.size = this.members.length;
            if (this.members.length > 0) this.empty = false;
            logDebug("capSet: loaded set " + this.id + " of status " + this.status + " with " + this.size + " records");
        }
    }

    this.add = function (addCapId) {
        var setMemberStatus;
        if (arguments.length == 2) setMemberStatus = arguments[1];

        var addResult = aa.set.add(this.id, addCapId);

        if (setMemberStatus) this.updateMemberStatus(capId, setMemberStatus);

    }

    this.updateMemberStatus = function (addCapId, setMemberStatus) {

        // Update a SetMember Status for a Record in SetMember List.

        var setUpdateScript = aa.set.getSetDetailsScriptModel().getOutput();
        setUpdateScript.setSetID(this.id);          //Set ID
        setUpdateScript.setID1(addCapId.getID1());
        setUpdateScript.setID2(addCapId.getID2());
        setUpdateScript.setID3(addCapId.getID3());
        setUpdateScript.setSetMemberStatus(setMemberStatus);
        setUpdateScript.setSetMemberStatusDate(aa.date.getCurrentDate());
        setUpdateScript.setServiceProviderCode(aa.getServiceProviderCode());

        var addResult = aa.set.updateSetMemberStatus(setUpdateScript);

        if (!addResult.getSuccess()) {
            logDebug("**WARNING** error adding record to set " + this.id + " : " + addResult.getErrorMessage());
        }
        else {
            logDebug("capSet: updated record " + addCapId + " to status " + setMemberStatus);
        }
    }


    this.remove = function (removeCapId) {
        var removeResult = aa.set.removeSetHeadersListByCap(this.id, removeCapId)
        if (!removeResult.getSuccess()) {
            logDebug("**WARNING** error removing record from set " + this.id + " : " + removeResult.getErrorMessage());
        }
        else {
            logDebug("capSet: removed record " + removeCapId + " from set " + this.id);
        }
    }

    this.update = function () {
        var sh = aa.proxyInvoker.newInstance("com.accela.aa.aamain.cap.SetBusiness").getOutput();
        this.model.setSetStatus(this.status)
        this.model.setSetID(this.setId);
        this.model.setSetTitle(this.name);
        this.model.setSetComment(this.comment);
        this.model.setSetStatusComment(this.statusComment);
        this.model.setRecordSetType(this.type);

        logDebug("capSet: updating set header information");
        try {
            updateResult = sh.updateSetBySetID(this.model);
        }
        catch (err) {
            logDebug("**WARNING** error updating set header failed " + err.message);
        }

    }

    this.id = desiredSetId;
    this.name = desiredSetId;
    this.type = null;
    this.comment = null;

    if (arguments.length > 1 && arguments[1]) this.name = arguments[1];
    if (arguments.length > 2 && arguments[2]) this.type = arguments[2];
    if (arguments.length > 3 && arguments[3]) this.comment = arguments[3];

    this.size = 0;
    this.empty = true;
    this.members = new Array();
    this.status = "";
    this.statusComment = "";
    this.model = null;

    var theSetResult = aa.set.getSetByPK(this.id);

    if (theSetResult.getSuccess()) {
        this.refresh();
    }

    else  // add the set
    {
        theSetResult = aa.set.createSet(this.id, this.name, this.type, this.comment);
        if (!theSetResult.getSuccess()) {
            logDebug("**WARNING** error creating set " + this.id + " : " + theSetResult.getErrorMessage);
        }
        else {
            logDebug("capSet: Created new set " + this.id + " of type " + this.type);
            this.refresh();
        }
    }
}




function createSetbylogic(recordType, name, setType, setComment, setStatus, setStatusComment) {

    var tDate = sysDateMMDDYYYY;
    var flag;
    var setIDForCompleted;
    var id;
    var setResult;
    var result;

    for (var i = 0; ; i++) {
        id = recordType + "_" + tDate + "_" + (i + 1);
        if (name == null) {
            name = id;
        }
        logDebug("Set ID: " + id);
        setResult = aa.set.getSetByPK(id);
        if (setResult.getSuccess()) {
            setResult = setResult.getOutput();
            logDebug("Set Comment: " + setResult.getSetComment());
            if (setResult.getSetComment() == "Processing") //Set exists, status "Pending"
            {
                flag = "P";
                break;
            }
            else if (setResult.getSetComment() == "Initialized") //Set exists, status "Pending"
            {
                flag = "I";
                break;
            }
            else if (setResult.getSetComment() == "Successfully processed") //Set exists, status "Completed"
            {
                setIDForCompleted = setResult.getSetID();
            }
        }
        else  //set does not exist
        {
            flag = "N";
            break;
        }
    }


    if (flag == "P" || flag == "I") {
        //id
        logDebug("Set Exists: " + id);
    }
    else if (flag == "N" && !setIDForCompleted) {
        logDebug("Create new set");
        result = createSet(id, name, setType, setStatus, setComment, setStatusComment);
        logDebug("createSet Result: " + result);
        if (result) {
            setResult = aa.set.getSetByPK(id);
            if (setResult.getSuccess()) {
                setResult = setResult.getOutput();
                logDebug("Result for new set: " + id);
            }
        }
    }
    else if (setIDForCompleted) {
        var tempStr = recordType + "_" + tDate + "_";
        var setNumber = setIDForCompleted.substr(tempStr.length, setIDForCompleted.length());
        setNumber = parseInt(setNumber);
        setNumber = setNumber + 1;
        var newSetId = recordType + "_" + tDate + "_" + setNumber;

        logDebug("New Set ID: " + newSetId);
        id = newSetId;
        if (name == null) {
            name = id;
        }
        result = createSet(id, name, setType, setStatus, setComment, setStatusComment);
        if (result) {
            setResult = aa.set.getSetByPK(newSetId);
            if (setResult.getSuccess()) {
                setResult = setResult.getOutput();
                logDebug("Result for new set: " + id);
            }
        }
    }
    return setResult;
}

//"Completed", "Successfully processed"
function updateSetStatus(setName, setDescription, comment, setStatus, setStatusComment) {
    try {
        var setTest = new capSet(setName, setDescription);
        setTest.status = setStatus;  // update the set header status
        setTest.comment = comment;   // changed the set comment
        setTest.statusComment = setStatusComment; // change the set status comment
        setTest.update();  // commit changes to the set
    }
    catch (err) {
        logDebug("Exception in updateSetStatus:" + err.message);
    }
}

function addCapSetMember(itemCapId, setResult) {
    try {
        var cID = itemCapId.getCustomID();
        var memberCapID = aa.cap.getCapID(cID).getOutput();
        var addResult = aa.set.addCapSetMember((setResult.getSetID()), memberCapID);
    }
    catch (err) {
        logDebug("Exception in addCapSetMember:" + err.message);
    }
}

function getDateCode(ipDate) {
    var fvYear = ipDate.getFullYear().toString();
    var fvMonth = (ipDate.getMonth() + 1).toString();
    var fvDay = ipDate.getDate().toString();
    if (ipDate.getMonth() < 9) fvMonth = "0" + fvMonth;
    if (ipDate.getDate() < 10) fvDay = "0" + fvDay;

    var fvDateCode = fvYear + fvMonth + fvDay;
    return fvDateCode;
}

function getDateString(ipDate) {
    var fvYear = ipDate.getFullYear().toString();
    var fvMonth = (ipDate.getMonth() + 1).toString();
    var fvDay = ipDate.getDate().toString();
    if (ipDate.getMonth() < 9) fvMonth = "0" + fvMonth;
    if (ipDate.getDate() < 10) fvDay = "0" + fvDay;

    var fvDateString = fvMonth + "/" + fvDay + "/" + fvYear;
    return fvDateString;
}

function getParent() {
    // returns the capId object of the parent.  Assumes only one parent!
    //
    var itemcap = capId;
    if (arguments.length == 1) itemcap = arguments[0];
    var getCapResult = aa.cap.getProjectParents(itemcap, 1);
    if (getCapResult.getSuccess()) {
        parentArray = getCapResult.getOutput();
        if (parentArray.length)
            return parentArray[0].getCapID();
        else {
            logDebug("**WARNING: GetParent found no project parent for this application");
            return false;
        }
    }
    else {
        logDebug("**WARNING: getting project parents:  " + getCapResult.getErrorMessage());
        return false;
    }
}
function setLicExpirationStatus(itemCap, newStatus) {
    try {
        //itemCap - license capId
        var licNum = itemCap.getCustomID();
        thisLic = new licenseObject(licNum, itemCap);

        b1ExpResult = aa.expiration.getLicensesByCapID(itemCap);
        if (newStatus != null) {
            thisLic.setStatus(newStatus);
        } else {
            thisLic.setStatus("Active");
        }

        logDebug("Successfully set the expiration status");
    }
    catch (err) {
        logDebug("**WARNING An error occured in setLicExpirationStatus  Error:  " + err.message);
    }
    return true;
}
function setLicExpirationDate(itemCap) {
    try {

        //itemCap - license capId
        //the following are optional parameters
        //calcDateFrom - MM/DD/YYYY - the from date to use in the date calculation
        //dateOverride - MM/DD/YYYY - override the calculation, this date will be used
        //renewalStatus - if other than active override the status

        var licNum = itemCap.getCustomID();
        var isExpDate = false;
        if (arguments.length == 1) {
            calcDateFrom = 0;
            dateOverride = null;
            renewalStatus = null;
        }
        if (arguments.length == 2) {
            calcDateFrom = arguments[1];
            dateOverride = null;
            renewalStatus = null;
        }

        if (arguments.length == 3) {
            calcDateFrom = arguments[1];
            dateOverride = arguments[2];
            renewalStatus = null;
        }

        if (arguments.length == 4) {
            calcDateFrom = arguments[1];
            dateOverride = arguments[2];
            renewalStatus = arguments[3];
        }

        if (arguments.length == 5) {
            calcDateFrom = arguments[1];
            dateOverride = arguments[2];
            renewalStatus = arguments[3];
            isExpDate = arguments[4];
        }

        thisLic = new licenseObject(licNum, itemCap);

        try {
            var tmpNewDate = "";

            b1ExpResult = aa.expiration.getLicensesByCapID(itemCap);
            var expUnit = null;
            var expInterval = null;
            if (b1ExpResult.getSuccess()) {
                this.b1Exp = b1ExpResult.getOutput();
                //Get expiration details
                expUnit = this.b1Exp.getExpUnit();
                expInterval = this.b1Exp.getExpInterval();
                if (expUnit == null) {
                    logDebug("Could not set the expiration date, no expiration unit defined for expiration code: " + this.b1Exp.getExpCode());
                } else {
                    if (expUnit == "Days") {
                        tmpNewDate = dateAdd(calcDateFrom, expInterval);
                    }

                    if (expUnit == "Months") {
                        tmpNewDate = dateAddMonths(calcDateFrom, expInterval);
                    }

                    if (expUnit == "Years") {
                        tmpNewDate = dateAddMonths(calcDateFrom, expInterval * 12);
                    }
                }
            }
            if (dateOverride == null) {
                if (tmpNewDate != '') {
                    thisLic.setExpiration(dateAdd(tmpNewDate, 0));
                }
            } else {
                if (expUnit == "Years" && parseInt(expInterval, 10) > 1) {
                    if (isExpDate) {
                        thisLic.setExpiration(dateAdd(dateOverride, 0));
                    } else {
                        thisLic.setExpiration(dateAddMonths(dateOverride, (parseInt(expInterval, 10) - 1) * 12));
                    }
                } else {
                    thisLic.setExpiration(dateAdd(dateOverride, 0));
                }
            }
        }
        catch (err) {
            logDebug("**WARNING An error occured in setLicExpirationDate  Error1:  " + err.message);
        }

        if (renewalStatus != null) {
            thisLic.setStatus(renewalStatus);
        } else {
            thisLic.setStatus("Active");
        }

        logDebug("Successfully set the expiration date and status");
    }
    catch (err) {
        logDebug("**WARNING An error occured in setLicExpirationDate  Error2:  " + err.message);
    } return true;

}

function editFirstIssuedDate(issuedDate) { // option CapId
    var itemCap = capId

    if (arguments.length > 1) itemCap = arguments[1]; // use cap ID specified in args

    var cdScriptObjResult = aa.cap.getCapDetail(itemCap);

    if (!cdScriptObjResult.getSuccess()) {
        logDebug("**ERROR: No cap detail script object : " + cdScriptObjResult.getErrorMessage()); return false;
    }

    var cdScriptObj = cdScriptObjResult.getOutput();

    if (!cdScriptObj) {
        logDebug("**ERROR: No cap detail script object"); return false;
    }

    cd = cdScriptObj.getCapDetailModel();

    var javascriptDate = new Date(issuedDate);

    var vIssuedDate = aa.date.transToJavaUtilDate(javascriptDate.getTime());

    cd.setFirstIssuedDate(vIssuedDate);

    cdWrite = aa.cap.editCapDetail(cd);

    if (cdWrite.getSuccess()) {
        logDebug("updated first issued date to " + vIssuedDate); return true;
    }
    else {
        logDebug("**ERROR updating first issued date: " + cdWrite.getErrorMessage()); return false;
    }
}
function verifyMilitaryServiceType() {
    var retMsg = ''
    var MilitaryServiceman = (AInfo["Military Serviceman"] == "Yes");
    var isNYOrganizedMilitia = (AInfo["NY Organized Militia"] == "CHECKED");
    var isUSReserveMember = (AInfo["U.S. Reserve Member"] == "CHECKED");
    var isFulltimeUSArmedService = (AInfo["Full-time U.S. Armed Service"] == "CHECKED");
    if (MilitaryServiceman && !(isNYOrganizedMilitia || isUSReserveMember || isFulltimeUSArmedService)) {
        retMsg += "Please select applicable military service type.";
        retMsg += "<Br />";
    }
    return retMsg;
}

function verifyNotMilitaryAndDisabled() {
    var retMsg = ''
    var rowNum = 0;
    if ((typeof (ANNUALDISABILITY) == "object"))
        for (var y in ANNUALDISABILITY) rowNum++;

    var MilitaryServiceman = (AInfo["Military Serviceman"] == "Yes");
    var PermanentDisability = (AInfo["Permanent Disability"] == "Yes");
    var HasAnnualDisability = (rowNum > 0) && !PermanentDisability;

    if ((MilitaryServiceman ? 1 : 0) + (PermanentDisability ? 1 : 0) + (HasAnnualDisability ? 1 : 0) > 1) {
        retMsg += "Please choose only one of Military Service, Permanent Disability, or Annual Disability.";
        retMsg += "<Br />";
    }
    return retMsg;
}


function ActiveOrReserve() {
    var retMsg = ''
    var isUSReserveMember = (AInfo["U.S. Reserve Member"] == "CHECKED");
    var isFulltimeUSArmedService = (AInfo["Full-time U.S. Armed Service"] == "CHECKED");
    if (isFulltimeUSArmedService && isUSReserveMember) {
        retMsg += "Please choose only one: U.S. Reserve Member or Full-time U.S. Armed Service.";
        retMsg += "<Br />";
    }
    return retMsg;

}
function isValidIntegerInches(inputvalue) {
    var isvalid = true;
    if (inputvalue != null && inputvalue != '') {
        var pattern = /^[0-9]+$/;

        isvalid = (pattern.test(inputvalue));
    }
    return isvalid;
}
function VerifyFeets() {
    var retMsg = ''
    var inchVal = AInfo["Height"];
    var isValid = isValidIntegerInches(inchVal);

    if (!isValid) {
        retMsg = 'Please enter valid integer.';
    }
    else {
        if (inchVal != null && (parseInt(inchVal) < 0)) {
            retMsg = "Inches must be greater than 0.";
        }
    }
    return retMsg;
}

function VerifyInches() {
    var retMsg = ''
    var inchVal = AInfo["Height - inches"];
    var isValid = isValidIntegerInches(inchVal);

    if (!isValid) {
        retMsg = 'Please enter valid integer.';
    }
    else {
        if (inchVal != null && (parseInt(inchVal) > 11 || parseInt(inchVal) < 0)) {
            retMsg = "Inches must be between 0 to 11";
        }
    }
    return retMsg;
}
function verifySportsmanEd() {
    var retMsg = ''
    var rowNum = 0;
    if ((typeof (SPORTSMANEDUCATION) == "object")) {
        for (var y in SPORTSMANEDUCATION) {
            rowNum++;
            var certNum = SPORTSMANEDUCATION[y]["Certificate Number"]
            var certState = SPORTSMANEDUCATION[y]["State"]
            if (certState == 'NY') {
                if (!isValidCertificateNum(certNum)) {
                    retMsg += ("Sportsman Education row #" + rowNum + ": Please enter valid certificate number.");
                    retMsg += '<Br />';
                }
            }

            var certDate = SPORTSMANEDUCATION[y]["Certification Date"]
            var diff = dateDiff(new Date(), new Date(certDate));
            if (diff > 0) {
                retMsg += ("Sportsman Education row #" + rowNum + ": Certification Date cannot be after today's date.");
                retMsg += '<Br />';
            }
            //code started
            var asiValDate = new Date(certDate);
            var cDate = new Date();
            cDate.setFullYear(cDate.getFullYear() - 75);
            if (asiValDate <= cDate) {
                retMsg += ("Certification Date is incorrect.");
                retMsg += '<Br />';
            }
            //code ended
        }
    }

    return retMsg;
}

function verifyPreviousLicense() {
    var retMsg = ''
    var rowNum = 0;
    if ((typeof (PREVIOUSLICENSE) == "object")) {
        for (var y in PREVIOUSLICENSE) {
            rowNum++;
            var licNum = PREVIOUSLICENSE[y]["License Number"]
            var licState = PREVIOUSLICENSE[y]["State"]
            if (licState == 'NY') {
                if (!isValidPriorLicense(licNum)) {
                    retMsg += ("Previous License row #" + rowNum + ": Please enter valid prior license number.");
                    retMsg += '<Br />';
                }
            }

            var licDate = PREVIOUSLICENSE[y]["License Date"]
            var diff = dateDiff(new Date(), new Date(licDate));
            if (diff > 0) {
                retMsg += ("Previous License row #" + rowNum + ": License Date cannot be after today's date.");
                retMsg += '<Br />';
            }
        }
    }

    return retMsg;
}

function verifyAnnulaDisability() {
    var retMsg = ''
    var rowNum = 0;
    if ((typeof (ANNUALDISABILITY) == "object")) {
        for (var y in ANNUALDISABILITY) {
            rowNum++;
            var caseNum = ANNUALDISABILITY[y]["Annual Disability Case Number"]
            if (!isValidDisabilityNumber(caseNum)) {
                retMsg += ("Annual disablilty row #" + rowNum + ": Please enter valid annual disability case number.");
                retMsg += '<Br />';
            }

            var sYear = ANNUALDISABILITY[y]["Year"]
            if (!isValidYear(sYear)) {
                retMsg += ("Annual disablilty row #" + rowNum + ": Please enter valid year.");
                retMsg += '<Br />';
            }
        }
    }

    return retMsg;
}

function verifyLandOwnerInfo() {
    var retMsg = ''
    var rowNum = 0;
    if ((typeof (LANDOWNERINFORMATION) == "object")) {
        for (var y in LANDOWNERINFORMATION) {
            rowNum++;
            var sYear = LANDOWNERINFORMATION[y]["License Year"]
            var swissCode = LANDOWNERINFORMATION[y]["SWIS Code"]
            var taxMapId = LANDOWNERINFORMATION[y]["Tax Map ID/Parcel ID"]
            var isUseLO = LANDOWNERINFORMATION[y]["Check this box to use this landowner parcel for your DMP application"]

            if (!isValidTaxMapId(taxMapId)) {
                retMsg += ("Land owner information row #" + rowNum + ": Please enter valid Tax Map ID/Parcel ID.");
                retMsg += '<Br />';
            }
            //JIRA - 44355
            if (!isRequiredSWISCode(AInfo["License Year"], sYear, swissCode)) {
                retMsg += ("Land owner information row #" + rowNum + ": Please enter valid 6 digit SWIS code.");
                retMsg += '<Br />';
            }

            if (!isValidSWISCode(swissCode)) {
                retMsg += ("Land owner information row #" + rowNum + ": Please enter valid 6 digit SWIS code.");
                retMsg += '<Br />';
            }

            if (!isValidYear(sYear)) {
                retMsg += ("Land owner information row #" + rowNum + ": Please enter valid year.");
                retMsg += '<Br />';
            }
        }
    }

    return retMsg;
}

function verifyDMPinfo() {
    var retMsg = ''

    if (!isValidBowHuntWmu(AInfo["WMU Choice 1"], AInfo)) {
        retMsg += ('No Bow hunting education. Selected WMU for choice 1 is valid only for bow hunting.');
        retMsg += '<Br />';
    }

    if (!isValidBowHuntWmu(AInfo["WMU Choice 2"], AInfo)) {
        retMsg += ('No Bow hunting education. Selected WMU for choice 2 is valid only for bow hunting.');
        retMsg += '<Br />';
    }


    var sAppLo1 = AInfo["Apply Land Owner for Choice1"]
    var sAppLo2 = AInfo["Apply Land Owner for Choice2"]
    var isYesApplyLO1 = ((sAppLo1 != null && (sAppLo1.equalsIgnoreCase('YES') || sAppLo1.equalsIgnoreCase('Y') || sAppLo1.equalsIgnoreCase('CHECKED') || sAppLo1.equalsIgnoreCase('SELECTED') || sAppLo1.equalsIgnoreCase('TRUE') || sAppLo1.equalsIgnoreCase('ON'))))
    var isYesApplyLO2 = ((sAppLo2 != null && (sAppLo2.equalsIgnoreCase('YES') || sAppLo2.equalsIgnoreCase('Y') || sAppLo2.equalsIgnoreCase('CHECKED') || sAppLo2.equalsIgnoreCase('SELECTED') || sAppLo2.equalsIgnoreCase('TRUE') || sAppLo2.equalsIgnoreCase('ON'))))

    //11-13-2013 - Cannot select Apply Land Owner if there are no records in the LAND OWNER INFORMATION ASI Table
    var bAllowLandOwnerApplication = true; //By default, don't raise a message
    logDebug("Is one of the Apply Land Owner for Choice ASI boxes checked?");
    if (isYesApplyLO1 || isYesApplyLO2) {
        logDebug("Yes, one of them is checked.  Is the LANDOWNERINFORMATION ASI Table variable an object?");
        if (typeof (LANDOWNERINFORMATION) == "object") {
            logDebug("Yes, it's an Object.  Are there any records? (Is the object length zero)"); //NOTE: I don't believe it can ever be an object without at least one record, but leave as is.
            if (LANDOWNERINFORMATION.length == 0) {
                logDebug("Yes, the length is zero, no records.  Do not allow land owner status without land owner info");
                bAllowLandOwnerApplication = false;
            }
            else
                logDebug("There are " + LANDOWNERINFORMATION.length + " records in the table.");
        }
        else {
            logDebug("No, it is not an Object (so no records in the ASI Table).  Do not allow land owner status without land owner info");
            bAllowLandOwnerApplication = false;
        }
    }

    if (!bAllowLandOwnerApplication) {
        retMsg += 'No Land Owner Information.  Cannot select Apply Land Owner for Choice1 or Choice2 without Land Owner Information.';
        retMsg += '<Br />';
    }

    if ((AInfo["WMU Choice 1"] != AInfo["WMU Choice 2"]) && isYesApplyLO1 && isYesApplyLO2) {
        retMsg += ('Landownership can only be applied to one WMU per license year.');
        retMsg += '<Br />';
    }

    return retMsg;
}
function verifyAnySalesSelect() {
    var retMsg = ''
    var isChecked = false;
    isChecked = isChecked || (AInfo["Junior Hunting Tags"] == "CHECKED");
    isChecked = isChecked || (AInfo["Marine Registry"] == "CHECKED");
    isChecked = isChecked || (AInfo["One Day Fishing License"] == "CHECKED");
    isChecked = isChecked || (AInfo["Bowhunting Privilege"] == "CHECKED");
    isChecked = isChecked || (AInfo["Deer Management Permit"] == "CHECKED");
    isChecked = isChecked || (AInfo["Hunting License"] == "CHECKED");
    isChecked = isChecked || (AInfo["Muzzleloading Privilege"] == "CHECKED");
    isChecked = isChecked || (AInfo["Turkey Permit"] == "CHECKED");
    isChecked = isChecked || (AInfo["Lifetime Bowhunting"] == "CHECKED");
    isChecked = isChecked || (AInfo["Lifetime Fishing"] == "CHECKED");
    isChecked = isChecked || (AInfo["Lifetime Muzzleloading"] == "CHECKED");
    isChecked = isChecked || (AInfo["Lifetime Small & Big Game"] == "CHECKED");
    isChecked = isChecked || (AInfo["Lifetime Sportsman"] == "CHECKED");
    isChecked = isChecked || (AInfo["Lifetime Trapping"] == "CHECKED");
    isChecked = isChecked || (AInfo["Trapping License"] == "CHECKED");
    isChecked = isChecked || (AInfo["Habitat/Access Stamp"] == "CHECKED");
    isChecked = isChecked || (AInfo["Venison Donation"] == "CHECKED");
    isChecked = isChecked || (AInfo["Conservation Fund"] == "CHECKED");
    isChecked = isChecked || (AInfo["Trail Supporter Patch"] == "CHECKED");
    isChecked = isChecked || (AInfo["Conservationist Magazine"] == "CHECKED");
    isChecked = isChecked || (AInfo["Conservation Patron"] == "CHECKED");
    isChecked = isChecked || (AInfo["Freshwater Fishing"] == "CHECKED");
    isChecked = isChecked || (AInfo["NonRes Freshwater Fishing"] == "CHECKED");
    isChecked = isChecked || (AInfo["Nonresident 1 Day Fishing"] == "CHECKED");
    isChecked = isChecked || (AInfo["Nonresident 7 Day Fishing"] == "CHECKED");
    isChecked = isChecked || (AInfo["Seven Day Fishing License"] == "CHECKED");
    isChecked = isChecked || (AInfo["Conservation Legacy"] == "CHECKED");
    isChecked = isChecked || (AInfo["Junior Bowhunting"] == "CHECKED");
    isChecked = isChecked || (AInfo["Junior Hunting"] == "CHECKED");
    isChecked = isChecked || (AInfo["NonRes Muzzleloading"] == "CHECKED");
    isChecked = isChecked || (AInfo["NonRes Super Sportsman"] == "CHECKED");
    isChecked = isChecked || (AInfo["Nonresident Bear Tag"] == "CHECKED");
    isChecked = isChecked || (AInfo["Nonresident Big Game"] == "CHECKED");
    isChecked = isChecked || (AInfo["Nonresident Bowhunting"] == "CHECKED");
    isChecked = isChecked || (AInfo["Nonresident Small Game"] == "CHECKED");
    isChecked = isChecked || (AInfo["Nonresident Turkey"] == "CHECKED");
    isChecked = isChecked || (AInfo["Small and Big Game"] == "CHECKED");
    isChecked = isChecked || (AInfo["Small Game"] == "CHECKED");
    isChecked = isChecked || (AInfo["Sportsman"] == "CHECKED");
    isChecked = isChecked || (AInfo["Super Sportsman"] == "CHECKED");
    isChecked = isChecked || (AInfo["Nonresident Trapping"] == "CHECKED");
    isChecked = isChecked || (AInfo["Trapper Super Sportsman"] == "CHECKED");
    isChecked = isChecked || (AInfo["Lifetime Card Replace"] == "CHECKED");
    isChecked = isChecked || (AInfo["Sportsman Ed Certification"] == "CHECKED");
    isChecked = isChecked || (AInfo["Lifetime Inscription"] == "CHECKED");
    isChecked = isChecked || (AInfo["Add Lifetime to Driver License Re-Issue Immediately"] == "CHECKED");
    isChecked = isChecked || (AInfo["Add Lifetime to Driver License on Renewal"] == "CHECKED");

    //3-5 Year
    //isChecked = isChecked || (AInfo["3 Year Hunting License"] == "CHECKED");
    //isChecked = isChecked || (AInfo["5 Year Hunting License"] == "CHECKED");
    //isChecked = isChecked || (AInfo["3 Year Bowhunting Privilege"] == "CHECKED");
    //isChecked = isChecked || (AInfo["5 Year Bowhunting Privilege"] == "CHECKED");
    //isChecked = isChecked || (AInfo["3 Year Muzzleloading Privilege"] == "CHECKED");
    //isChecked = isChecked || (AInfo["5 Year Muzzleloading Privilege"] == "CHECKED");
    //isChecked = isChecked || (AInfo["3 Year Trapping License"] == "CHECKED");
    //isChecked = isChecked || (AInfo["5 Year Trapping License"] == "CHECKED");
    //isChecked = isChecked || (AInfo["3 Year Freshwater Fishing"] == "CHECKED");
    //isChecked = isChecked || (AInfo["5 Year Freshwater Fishing"] == "CHECKED");
    //isChecked = isChecked || (AInfo["3 Year Turkey Permit"] == "CHECKED");
    //isChecked = isChecked || (AInfo["5 Year Turkey Permit"] == "CHECKED");

    if (!isChecked) {
        retMsg += "Please select sales item.";
        retMsg += "<Br />";
    }
    return retMsg;

}

function createActiveHoldingTable() {
    logDebug("ENTER: createActiveHoldingTable");
    var xArray = getApplicantArrayEx();
    var peopleSequenceNumber = null;
    for (ca in xArray) {
        var thisContact = xArray[ca];
        peopleSequenceNumber = thisContact["refcontactSeqNumber"]
        if (peopleSequenceNumber != null) {
            var asitModel;
            var new_asit;
            var availableActiveItems = getActiveHoldings(peopleSequenceNumber, AInfo["License Year"]);
            var newAsitArray = GetActiveHoldingsAsitTableArray(availableActiveItems);

            asitModel = cap.getAppSpecificTableGroupModel();
            new_asit = addASITable4ACAPageFlow(asitModel, "ACTIVE HOLDINGS", newAsitArray);

            var strAllHolding = GetASITDelimitedString("ACTIVEHOLDINGS", newAsitArray);
            editAppSpecific4ACA("A_ActiveHoldings", strAllHolding);
            editAppSpecific4ACA("A_PrintConsignedLines", isPrivPanleWithConsignedLinesFound(availableActiveItems) ? 'N' : 'Y');
        }
        break;
    }
    logDebug("EXIT: createActiveHoldingTable");
}

function GetActiveHoldingsAsitTableArray(availableActiveItems) {
    logDebug("ENTER: GetActiveHoldingsAsitTableArray");

    var readOnly = "N";
    var tempObject = new Array();
    var tempArray = new Array();

    for (var tidx in availableActiveItems) {
        var tObj = availableActiveItems[tidx];
        if (tObj.RecordType != AA54_TAG_PRIV_PANEL) {
            logDebug(tObj.RecordType);
            tempObject = new Array();
            var fieldInfo = new asiTableValObj("Item Code", (isNull(tObj.IsTag(), false) ? isNull(tObj.TagType, '') : isNull(tObj.ItemCode, '')), "Y");
            tempObject["Item Code"] = fieldInfo;
            fieldInfo = new asiTableValObj("Description", isNull(tObj.Description, ''), "Y");
            tempObject["Description"] = fieldInfo;
            fieldInfo = new asiTableValObj("Tag / Document ID", isNull(tObj.altId, ''), "Y");
            tempObject["Tag / Document ID"] = fieldInfo;
            fieldInfo = new asiTableValObj("From Date", isNull(tObj.FromDate, ''), "Y");
            tempObject["From Date"] = fieldInfo;
            fieldInfo = new asiTableValObj("To Date", isNull(tObj.ToDate, ''), "Y");
            tempObject["To Date"] = fieldInfo;
            fieldInfo = new asiTableValObj("License Year", isNull(tObj.LicenseYear, ''), "Y");
            tempObject["License Year"] = fieldInfo;
            fieldInfo = new asiTableValObj("Tag", (isNull(tObj.IsTag(), false) ? "CHECKED" : ""), "Y");
            tempObject["Tag"] = fieldInfo;
            fieldInfo = new asiTableValObj("RecordType", tObj.RecordType, "Y");
            tempObject["RecordType"] = fieldInfo;

            tempArray.push(tempObject);  // end of record
        }
    }
    logDebug("EXIT: GetActiveHoldingsAsitTableArray");

    return tempArray;
}
function isPrivPanleWithConsignedLinesFound(availableActiveItems) {
    var isFound = false;
    for (var tidx in availableActiveItems) {
        var tObj = availableActiveItems[tidx];
        if (tObj.RecordType == AA54_TAG_PRIV_PANEL) {
            isFound = (tObj.PrintConsignedLines == 'Yes' || tObj.PrintConsignedLines == 'Y');
            if (isFound) {
                break;
            }
        }
    }
    return isFound;
}
function GetActiveHoldingsDelimitedString(availableActiveItems) {
    var delimitedStr = "";

    for (var tidx in availableActiveItems) {
        var tObj = availableActiveItems[tidx];
        if (tidx != 0) delimitedStr += "|";

        var sItemCode = (isNull(tObj.IsTag(), false) ? isNull(tObj.TagType, '') : isNull(tObj.ItemCode, ''));
        delimitedStr += sItemCode;
        delimitedStr += '^';

        var sDescription = isNull(tObj.Description, '');
        delimitedStr += sDescription;
        delimitedStr += '^';

        var sTag_DocumentID = isNull(tObj.altId, '');
        delimitedStr += sTag_DocumentID;
        delimitedStr += '^';

        var sFromDate = isNull(tObj.FromDate, '');
        delimitedStr += sFromDate;
        delimitedStr += '^';

        var sToDate = isNull(tObj.ToDate, '');
        delimitedStr += sToDate;
        delimitedStr += '^';

        var sLicenseYear = isNull(tObj.LicenseYear, '');
        delimitedStr += sLicenseYear;
        delimitedStr += '^';

        var sTag = (isNull(tObj.IsTag(), false) ? "CHECKED" : "");
        delimitedStr += sTag;
        delimitedStr += '^';

        var sRecordType = tObj.RecordType;
        delimitedStr += sRecordType;
        delimitedStr += '^';
    }

    return delimitedStr;
}
function editFileDate(itemCap, fileDate) {
    try {
        var javascriptDate = new Date(fileDate);
        var vfileDate = aa.date.transToJavaUtilDate(javascriptDate.getTime());

        var scriptDt = aa.date.parseDate(dateAdd(vfileDate, 0));
        //logDebug(scriptDt.getMonth() + "/" + scriptDt.getDayOfMonth() + "/" + scriptDt.getYear());

        var thisCapObj = aa.cap.getCap(itemCap).getOutput();
        thisCapObj.setFileDate(scriptDt);
        var capModel = thisCapObj.getCapModel();
        var setFileDateResult = aa.cap.editCapByPK(capModel);
        if (!setFileDateResult.getSuccess()) {
            logDebug("**WARNING: error setting cap name : " + setFileDateResult.getErrorMessage());
            return false;
        }


    }
    catch (err) {
        logDebug("**ERROR An error occured in editFileDate  Error:  " + err.message);
    }
    return true;
}
function isValidIntegerNumber(inputvalue) {
    var isvalid = true;
    if (inputvalue != null && inputvalue != '') {
        var pattern = /^(?!^0)\d{1,9}$/;
        isvalid = (pattern.test(inputvalue));
    }
    return isvalid;
}
function isValidDisabilityNumber(inputvalue) {
    var isvalid = true;
    if (inputvalue != null && inputvalue != '') {
        /*
        var pattern = /^[C0-9]{9}$/;
        isvalid = (pattern.test(inputvalue));
        */
    }
    return isvalid;
}

function isValidYear(inputvalue) {
    var isvalid = true;
    if (inputvalue != null && inputvalue != '') {
        var pattern = /^[0-9]{4}$/;
        isvalid = (pattern.test(inputvalue));
    }
    return isvalid;
}
function isValidSWISCode(inputvalue) {
    var isvalid = true;
    if (inputvalue != null && inputvalue != '') {
        var pattern = /^[0-9]{6}$/;
        isvalid = (pattern.test(inputvalue));
    }
    return isvalid;
}
//JIRA - 44355
function isRequiredSWISCode(currentyear, syear, inputvalue) {
    var isvalid = true;

    var yearplus1 = parseInt(currentyear, 10) + 1;
    var isForCurrYear = ((syear + "" == currentyear + "") || (syear + "" == yearplus1 + ""));

    if (isForCurrYear) {
        if (inputvalue == null || inputvalue == '') {
            isvalid = false;
        }
    }
    return isvalid;
}
function isValidTaxMapId(inputvalue) {
    var isvalid = true;
    if (inputvalue != null && inputvalue != '') {
        //var pattern = /^[a-zA-Z0-9-]+$/;
        //isvalid = (pattern.test(inputvalue));
    }
    return isvalid;
}
function isValidPriorLicense(inputvalue) {
    var isvalid = true;
    if (inputvalue != null && inputvalue != '') {
        /*
        var pattern = /^[0-9]{9}$/;
        isvalid = (pattern.test(inputvalue));
        */
    }
    return isvalid;
}
function isValidCertificateNum(inputvalue) {
    var isvalid = true;
    if (inputvalue != null && inputvalue != '') {
        /*
        var pattern = /^[0-9]{9}$/;
        isvalid = (pattern.test(inputvalue));
        */
    }
    return isvalid;
}

function isAgentAbleToSell(userId) {
    var isvalid = true;

    var uObj = new USEROBJ(userId);
    logDebug(uObj.publicUserID);
    if (uObj.acctType == 'CITIZEN') return true;

    var salesAgentInfoArray = getAgentInfo(uObj.publicUserID, uObj);
    if (salesAgentInfoArray != null) {
        isvalid = (salesAgentInfoArray["Agent Enabled for Sales"] != "N");
    }
    return isvalid;
}

function isValidUserForGameHarvest(userId) {
    var isvalid = false;

    var uObj;
    if (arguments.length > 0) {
        uObj = new USEROBJ();
        uObj.userId = userId;
        uObj.userModel = uObj.getUserModel();
        uObj.setUserModelAttributes();
    } else {
        uObj = new USEROBJ(publicUserID);
    }
    isvalid = (uObj.acctType == 'CITIZEN');

    if (!isvalid) {
        var salesAgentInfoArray = getAgentInfo(uObj.publicUserID, uObj);
        if (salesAgentInfoArray != null) {
            isvalid = (salesAgentInfoArray["Agent Group"] == "Call Center" || salesAgentInfoArray["Agent Group"] == "Call Centre");
        }
    }
    return isvalid;
}
function isValidUserForUpgradeLic(userId) {
    var isvalid = false;

    var uObj;
    if (arguments.length > 0) {
        uObj = new USEROBJ();
        uObj.userId = userId;
        uObj.userModel = uObj.getUserModel();
        uObj.setUserModelAttributes();
    } else {
        uObj = new USEROBJ(publicUserID);
    }
    isvalid = (uObj.acctType != 'CITIZEN');

    if (isvalid) {
        var salesAgentInfoArray = getAgentInfo(uObj.publicUserID, uObj);
        if (salesAgentInfoArray != null) {
            var isCallcenter = (salesAgentInfoArray["Agent Group"] == "Call Center" || salesAgentInfoArray["Agent Group"] == "Call Centre");
            var isCampsite = (salesAgentInfoArray["Agent Group"] == "Campsite");
            var isMunicipality = (salesAgentInfoArray["Agent Group"] == "Municipality");
            var isNYSDEC_HQ = (salesAgentInfoArray["Agent Group"] == "NYSDEC HQ");
            var isNYSDEC_Regional_Office = (salesAgentInfoArray["Agent Group"] == "NYSDEC Regional Office");
            var isNative_American_Agency = (salesAgentInfoArray["Agent Group"] == "Native American Agency");
            var isRetail = (salesAgentInfoArray["Agent Group"] == "Retail");
            isvalid = isNYSDEC_HQ || isCampsite || isMunicipality || isNYSDEC_Regional_Office || isRetail;  //...Raj  JIRA - 15823

        }
    }
    return isvalid;
}
function isValidUserForReprintDocuments(userId) {
    var isvalid = false;

    var uObj;
    if (arguments.length > 0) {
        uObj = new USEROBJ();
        uObj.userId = userId;
        uObj.userModel = uObj.getUserModel();
        uObj.setUserModelAttributes();
    } else {
        uObj = new USEROBJ(publicUserID);
    }
    isvalid = (uObj.acctType != 'CITIZEN');

    if (isvalid) {
        var salesAgentInfoArray = getAgentInfo(uObj.publicUserID, uObj);
        if (salesAgentInfoArray != null) {
            var isCallcenter = (salesAgentInfoArray["Agent Group"] == "Call Center" || salesAgentInfoArray["Agent Group"] == "Call Centre");
            var isCampsite = (salesAgentInfoArray["Agent Group"] == "Campsite");
            var isMunicipality = (salesAgentInfoArray["Agent Group"] == "Municipality");
            var isNYSDEC_HQ = (salesAgentInfoArray["Agent Group"] == "NYSDEC HQ");
            var isNYSDEC_Regional_Office = (salesAgentInfoArray["Agent Group"] == "NYSDEC Regional Office");
            var isNative_American_Agency = (salesAgentInfoArray["Agent Group"] == "Native American Agency");
            var isRetail = (salesAgentInfoArray["Agent Group"] == "Retail");

            isvalid = isNYSDEC_HQ || isCampsite || isMunicipality || isNYSDEC_Regional_Office || isRetail; ;    //...Raj  JIRA - 15823
        }
    }
    return isvalid;
}
function isValidUserForVoidSales(userId) {
    var isvalid = false;

    var uObj;
    if (arguments.length > 0) {
        uObj = new USEROBJ();
        uObj.userId = userId;
        uObj.userModel = uObj.getUserModel();
        uObj.setUserModelAttributes();
    } else {
        uObj = new USEROBJ(publicUserID);
    }
    isvalid = (uObj.acctType != 'CITIZEN');

    if (isvalid) {
        var salesAgentInfoArray = getAgentInfo(uObj.publicUserID, uObj);
        if (salesAgentInfoArray != null) {
            var isCallcenter = (salesAgentInfoArray["Agent Group"] == "Call Center" || salesAgentInfoArray["Agent Group"] == "Call Centre");
            var isCampsite = (salesAgentInfoArray["Agent Group"] == "Campsite");
            var isMunicipality = (salesAgentInfoArray["Agent Group"] == "Municipality");
            var isNYSDEC_HQ = (salesAgentInfoArray["Agent Group"] == "NYSDEC HQ");
            var isNYSDEC_Regional_Office = (salesAgentInfoArray["Agent Group"] == "NYSDEC Regional Office");
            var isNative_American_Agency = (salesAgentInfoArray["Agent Group"] == "Native American Agency");
            var isRetail = (salesAgentInfoArray["Agent Group"] == "Retail");

            isvalid = isNYSDEC_HQ || isCallcenter || isCampsite || isMunicipality || isNYSDEC_Regional_Office || isRetail;       //...Raj  JIRA - 15823
        }
    }
    return isvalid;
}
function addFullfillmentConditionArray(itemCapId, condArray) {
    for (var cnd in condArray) {
        addFullfillmentCondition(itemCapId, condArray[cnd]);
    }
}
function addFullfillmentCondition(itemCapId, fullfillmentCondition) {
    if (fullfillmentCondition != '') {
        addStdConditionWithComments("Fulfillment", fullfillmentCondition, "", "", itemCapId);
    }
}
function removeFullfillmentCapCondition(itemCapId, fullfillmentCondition) {
    if (fullfillmentCondition != '') {
        removeCapCondition("Fulfillment", fullfillmentCondition, itemCapId);
    }
}
function createChildForDec(grp, typ, stype, cat, desc) {
    // optional parent capId
    //
    // creates the new application and returns the capID object
    //

    var itemCap = capId
    if (arguments.length > 5) itemCap = arguments[5]; // use cap ID specified in args

    var appCreateResult = aa.cap.createApp(grp, typ, stype, cat, desc);
    logDebug("creating cap " + grp + "/" + typ + "/" + stype + "/" + cat);
    if (appCreateResult.getSuccess()) {
        var newId = appCreateResult.getOutput();
        logDebug("cap " + grp + "/" + typ + "/" + stype + "/" + cat + " created successfully ");

        // create Detail Record
        capModel = aa.cap.newCapScriptModel().getOutput();
        capDetailModel = capModel.getCapModel().getCapDetailModel();
        capDetailModel.setCapID(newId);
        aa.cap.createCapDetail(capDetailModel);

        var newObj = aa.cap.getCap(newId).getOutput(); //Cap object
        var result = aa.cap.createAppHierarchy(itemCap, newId);
        if (result.getSuccess())
            logDebug("Child application successfully linked");
        else
            logDebug("Could not link applications");

        var contactType = ''
        if (arguments.length > 6) contactType = arguments[6]; // copyContact

        // Copy Contacts
        capContactResult = aa.people.getCapContactByCapID(itemCap);
        if (capContactResult.getSuccess()) {
            Contacts = capContactResult.getOutput();
            for (yy in Contacts) {
                var newContact = Contacts[yy].getCapContactModel();
                if (newContact.getContactType() == contactType || contactType == '') {
                    newContact.setCapID(newId);
                    aa.people.createCapContact(newContact);
                }
            }
        }

        /*
        // Copy Addresses
        capAddressResult = aa.address.getAddressByCapId(itemCap);
        if (capAddressResult.getSuccess()) {
        Address = capAddressResult.getOutput();
        for (yy in Address) {
        newAddress = Address[yy];
        newAddress.setCapID(newId);
        aa.address.createAddress(newAddress);
        logDebug("added address");
        }
        }
        */
        return newId;
    }
    else {
        logDebug("**ERROR: adding child App: " + appCreateResult.getErrorMessage());
    }
}

function afterApplicationPrintFail(itemCapId, numberOfTries) {
    var isVoidAll = (numberOfTries > 2);
    var itemCap = aa.cap.getCap(itemCapId).getOutput();
    //var altId = itemCapId.getCustomID();
    //var status = itemCap.getCapStatus();
    var contactTypeToAttach = ''; //Balnk = All
    appTypeString = itemCap.getCapType();

    if (appTypeString == 'Licenses/Annual/Application/NA' || isExpressFlow()) {

    }
    else if (appTypeString == 'Licenses/Sales/Reprint/Documents') {
        contactTypeToAttach = "Individual"
    }
    else if (appTypeString == 'Licenses/Sales/Upgrade/Lifetime') {
        contactTypeToAttach = "Individual"
    }

    var peopleSequenceNumber = null;
    var capContactResult = aa.people.getCapContactByCapID(itemCapId);
    if (capContactResult.getSuccess()) {
        var Contacts = capContactResult.getOutput();
        for (yy in Contacts) {
            var newContact = Contacts[yy].getCapContactModel();
            if (newContact.getContactType() == "DEC Agent") {
                peopleSequenceNumber = newContact.getRefContactNumber();
                break;
            }
        }
    }

    salesAgentInfoArray = getAgentInfoByPeopleSeqNum(peopleSequenceNumber);

    var searchAppTypeString = "Licenses/*/*/*";
    var capArray = getChildren(searchAppTypeString, itemCapId);
    if (capArray == null) {
        return;
    }

    var appSpecInfoResult = aa.appSpecificInfo.editSingleAppSpecific(itemCapId, "A_numberOfTries", numberOfTries + "", null);

    for (y in capArray) {
        var childCapId = capArray[y];
        var currcap = aa.cap.getCap(childCapId).getOutput();
        appTypeString = currcap.getCapType().toString();
        var ata = appTypeString.split("/");

        if (isVoidAll) {
            if (currcap.getCapStatus() == "Active" || currcap.getCapStatus() == "Returnable") {
                updateAppStatus("Void", "Void", childCapId);
                closeTaskForRec("Void Document", "Void", "", "", "", childCapId);
                closeTaskForRec("Report Game Harvest", "", "", "", "", childCapId);
                closeTaskForRec("Revocation", "", "", "", "", childCapId);
                closeTaskForRec("Suspension", "", "", "", "", childCapId);
            }
        } else {
            if (currcap.getCapStatus() == "Active") {
                //Onlt tags are returnable
                if (ata[1] == 'Tag') {
                    var newLicId = createChildForDec(ata[0], ata[1], ata[2], ata[3], null, childCapId, contactTypeToAttach);
                    activateTaskForRec("Report Game Harvest", "", newLicId);
                    activateTaskForRec("Void Document", "", newLicId);
                    activateTaskForRec("Revocation", "", newLicId);
                    activateTaskForRec("Suspension", "", newLicId);

                    updateAppStatus("Returnable", "Returnable", childCapId);

                    //copyAddresses(childCapId, newLicId);
                    copyASITables(childCapId, newLicId);
                    copyASIFields(childCapId, newLicId);
                    copyCalcVal(childCapId, newLicId);
                    copyFees(childCapId, newLicId);
                    copyConditions(newLicId, childCapId);

                    //SET open date and expiration date
                    var openDt = currcap.getFileDate();
                    var effectiveDt = new Date(openDt.getMonth() + "/" + openDt.getDayOfMonth() + "/" + openDt.getYear());
                    editFileDate(newLicId, jsDateToMMDDYYYY(effectiveDt));
                    var clacFromDt = dateAdd(effectiveDt, -1);
                    setLicExpirationDate(newLicId, "", clacFromDt);

                    //Application name
                    var appName = currcap.getSpecialText();
                    editAppName(appName, newLicId);

                    //Set document number
                    var newDecDocId = GenerateDocumentNumber(newLicId.getCustomID());
                    updateDocumentNumber(newDecDocId, newLicId);

                    //update Staus and workflow tasks
                    closeTaskForRec("Issuance", "Active", "", "", "", newLicId);
                    updateAppStatus("Active", "Active", newLicId);
                    activateTaskForRec("Report Game Harvest", "", newLicId);
                    activateTaskForRec("Void Document", "", newLicId);
                    activateTaskForRec("Revocation", "", newLicId);
                    activateTaskForRec("Suspension", "", newLicId);

                    var result = aa.cap.createAppHierarchy(itemCapId, newLicId);
                    if (result.getSuccess()) {
                        logDebug("Parent application successfully linked");
                    }
                    else {
                        logDebug("Could not link applications" + result.getErrorMessage());
                    }
                }
            }
        }
    }
    //Void Parent Application
    if (isVoidAll) {
        updateAppStatus("Void", "Void", itemCapId);
    }
}

function editCapConditionStatus(pType, pDesc, pStatus, pStatusType) {
    // updates a condition with the pType and   
    // to pStatus and pStatusType, returns true if updates, false if not
    // will not update if status is already pStatus && pStatusType
    // all parameters are required except for pType
    // optional fromStatus for 5th paramater
    // optional capId for 6th parameter

    var itemCap = capId;
    var fromStatus = "";

    if (arguments.length > 4) {
        fromStatus = arguments[4];
    }

    if (arguments.length > 5) {
        itemCap = arguments[5];
    }

    if (pType == null)
        var condResult = aa.capCondition.getCapConditions(itemCap);
    else
        var condResult = aa.capCondition.getCapConditions(itemCap, pType);

    if (condResult.getSuccess())
        var capConds = condResult.getOutput();
    else {
        logDebug("**ERROR: getting cap conditions: " + condResult.getErrorMessage());
        return false;
    }

    var conditionUpdated = false;
    for (cc in capConds) {
        var thisCond = capConds[cc];
        var cStatus = thisCond.getConditionStatus();
        var cStatusType = thisCond.getConditionStatusType();
        var cDesc = thisCond.getConditionDescription();
        var cImpact = thisCond.getImpactCode();
        logDebug(cStatus + ": " + cStatusType);

        if (cDesc.toUpperCase() == pDesc.toUpperCase()) {
            if (fromStatus.toUpperCase().equals(cStatus.toUpperCase()) || fromStatus == "") {
                thisCond.setConditionStatus(pStatus);
                thisCond.setConditionStatusType(pStatusType);
                thisCond.setImpactCode("");
                aa.capCondition.editCapCondition(thisCond);
                conditionUpdated = true; // condition has been found and updated
            }
        }
    }


    if (conditionUpdated) {
        logDebug("Condition has been found and updated to a status of: " + pStatus);
    } else {
        logDebug("ERROR: no matching condition found");
    }

    return conditionUpdated; //no matching condition found
}

function closeTasksForTagAnditems(itemCapId) {
    var capTypesArray = new Array();
    capTypesArray.push("Licenses/Tag/*/*");
    capTypesArray.push("Licenses/Annual/Fishing/*");
    capTypesArray.push("Licenses/Annual/Hunting/*");
    capTypesArray.push("Licenses/Annual/Trapping/*");
    capTypesArray.push("Licenses/Lifetime/Fishing/*");
    capTypesArray.push("Licenses/Lifetime/Hunting/*");
    capTypesArray.push("Licenses/Lifetime/Trapping/*");
    capTypesArray.push("Licenses/Lifetime/Other/*");
    capTypesArray.push("Licenses/Other/Sales/*");

    var tskNameArray = new Array();
    tskNameArray.push("Report Game Harvest");
    tskNameArray.push("Void Document");
    tskNameArray.push("Revocation");
    tskNameArray.push("Suspension");

    var itemCap = aa.cap.getCap(itemCapId).getOutput();

    for (var c in capTypesArray) {
        var capTypes = capTypesArray[c];
        if (appMatch(capTypes, itemCapId) && !appMatch("*/*/*/Application", itemCapId)) {
            for (var t in tskNameArray) {
                var tskName = tskNameArray[t]
                if (isTaskActive(tskName)) {
                    closeTaskForRec(tskName, "", "", "", "", itemCapId);
                }
            }
            break;
        }
    }
}

function isValidBowHuntWmu(wmu, aAInfo) {
    var isValid = true;

    var strControl = 'WMU Bow Only';
    var bizDomScriptResult = aa.bizDomain.getBizDomain(strControl);
    if (bizDomScriptResult.getSuccess()) {
        bizDomScriptArray = bizDomScriptResult.getOutput().toArray()
        for (var i in bizDomScriptArray) {
            if (bizDomScriptArray[i].getBizdomainValue() == wmu) {
                var frm = new form_OBJECT(GS2_EXPR);
                frm.SetPriorLicense(aAInfo["A_Previous_License"]);
                frm.SetSportsmanEducation(aAInfo["A_Sportsman_Education"]);
                isValid = frm.HasBowHunt();
                break;
            }
        }
    }

    return isValid;
}

function addContactStdConditionWithComments(contSeqNum, cType, cDesc) {
    var foundCondition = false;
    var javascriptDate = new Date()
    var javautilDate = aa.date.transToJavaUtilDate(javascriptDate.getTime());

    cStatus = "Applied";
    if (arguments.length > 3)
        cStatus = arguments[3]; // use condition status in args

    var cShortComment = '';
    if (arguments.length > 4)
        cShortComment = arguments[4];
    var cLongComment = '';
    if (arguments.length > 5)
        cLongComment = arguments[5];

    if (!aa.capCondition.getStandardConditions) {
        logDebug("addAddressStdCondition function is not available in this version of Accela Automation.");
    }
    else {
        standardConditions = aa.capCondition.getStandardConditions(cType, cDesc).getOutput();
        for (i = 0; i < standardConditions.length; i++)
            if (standardConditions[i].getConditionType().toUpperCase() == cType.toUpperCase() && standardConditions[i].getConditionDesc().toUpperCase() == cDesc.toUpperCase()) //EMSE Dom function does like search, needed for exact match
            {
                standardCondition = standardConditions[i]; // add the last one found
                foundCondition = true;
                if (!contSeqNum) // add to all reference address on the current capId
                {
                    var capContactResult = aa.people.getCapContactByCapID(capId);
                    if (capContactResult.getSuccess()) {
                        var Contacts = capContactResult.getOutput();
                        for (var contactIdx in Contacts) {
                            var contactNbr = Contacts[contactIdx].getCapContactModel().getPeople().getContactSeqNumber();
                            if (contactNbr) {
                                var newCondition = aa.commonCondition.getNewCommonConditionModel().getOutput();
                                if (cShortComment != null && cShortComment != '') {
                                    newCondition.setConditionComment(cShortComment);
                                } else {
                                    newCondition.setConditionComment(standardCondition.getConditionComment());
                                }
                                if (cLongComment != null && cLongComment != '') {
                                    newCondition.setLongDescripton(cLongComment);
                                } else {
                                    newCondition.setLongDescripton(newCondition.getLongDescripton());
                                }
                                newCondition.setConditionDescription(standardCondition.getConditionDesc());
                                newCondition.setServiceProviderCode(aa.getServiceProviderCode());
                                newCondition.setEntityType("CONTACT");
                                newCondition.setEntityID(contactNbr);
                                newCondition.setConditionGroup(standardCondition.getConditionGroup());
                                newCondition.setConditionType(standardCondition.getConditionType());
                                newCondition.setImpactCode(standardCondition.getImpactCode());
                                newCondition.setConditionStatus(cStatus)
                                newCondition.setAuditStatus("A");
                                newCondition.setIssuedByUser(systemUserObj);
                                newCondition.setIssuedDate(javautilDate);
                                newCondition.setEffectDate(javautilDate);
                                newCondition.setAuditID(currentUserID);
                                if (cLongComment != null && cLongComment != '') {
                                    var langCond = aa.condition.getCondition(newCondition, lang).getOutput();
                                    r.arDescription = langCond.getResConditionDescription();
                                    r.arComment = langCond.getResConditionComment();
                                }
                                var addContactConditionResult = aa.commonCondition.addCommonCondition(newCondition);

                                if (addContactConditionResult.getSuccess()) {
                                    logDebug("Successfully added reference contact (" + contactNbr + ") condition: " + cDesc);
                                }
                                else {
                                    logDebug("**ERROR: adding reference contact (" + contactNbr + ") condition: " + addContactConditionResult.getErrorMessage());
                                }
                            }
                        }
                    }
                }
                else {
                    var newCondition = aa.commonCondition.getNewCommonConditionModel().getOutput();
                    if (cShortComment != null && cShortComment != '') {
                        newCondition.setConditionComment(cShortComment);
                    } else {
                        newCondition.setConditionComment(standardCondition.getConditionComment());
                    }
                    if (cLongComment != null && cLongComment != '') {
                        newCondition.setLongDescripton(cLongComment);
                    } else {
                        newCondition.setLongDescripton(newCondition.getLongDescripton());
                    }
                    newCondition.setConditionDescription(standardCondition.getConditionDesc());
                    newCondition.setServiceProviderCode(aa.getServiceProviderCode());
                    newCondition.setEntityType("CONTACT");
                    newCondition.setEntityID(contSeqNum);
                    newCondition.setConditionGroup(standardCondition.getConditionGroup());
                    newCondition.setConditionType(standardCondition.getConditionType());
                    newCondition.setImpactCode(standardCondition.getImpactCode());
                    newCondition.setConditionStatus(cStatus)
                    newCondition.setAuditStatus("A");
                    newCondition.setIssuedByUser(systemUserObj);
                    newCondition.setIssuedDate(javautilDate);
                    newCondition.setEffectDate(javautilDate);

                    newCondition.setAuditID(currentUserID);
                    var addContactConditionResult = aa.commonCondition.addCommonCondition(newCondition);

                    if (addContactConditionResult.getSuccess()) {
                        logDebug("Successfully added reference contact (" + contSeqNum + ") condition: " + cDesc);
                    }
                    else {
                        logDebug("**ERROR: adding reference contact (" + contSeqNum + ") condition: " + addContactConditionResult.getErrorMessage());
                    }
                }
            }
    }
    if (!foundCondition) logDebug("**WARNING: couldn't find standard condition for " + cType + " / " + cDesc);
}

function arrayUnique(array) {
    var a = array.concat();
    for (var i = 0; i < a.length; ++i) {
        for (var j = i + 1; j < a.length; ++j) {
            if (a[i] === a[j])
                a.splice(j--, 1);
        }
    }

    return a;
}

function elapsed() {
    var thisDate = new Date();
    var thisTime = thisDate.getTime();
    return ((thisTime - startTime) / 1000)
}

function addASITable4ACAPageFlow(destinationTableGroupModel, tableName, tableValueArray) // optional capId
{
    //  tableName is the name of the ASI table
    //  tableValueArray is an array of associative array values.  All elements MUST be either a string or asiTableVal object
    // 

    var itemCap = capId
    if (arguments.length > 3)
        itemCap = arguments[3]; // use cap ID specified in args

    var ta = destinationTableGroupModel.getTablesMap().values();
    var tai = ta.iterator();

    var found = false;

    while (tai.hasNext()) {
        var tsm = tai.next();  // com.accela.aa.aamain.appspectable.AppSpecificTableModel
        if (tsm.getTableName().equals(tableName)) { found = true; break; }
    }


    if (!found) { logDebug("cannot update asit for ACA, no matching table name"); return false; }

    var fld = aa.util.newArrayList();  // had to do this since it was coming up null.
    var fld_readonly = aa.util.newArrayList(); // had to do this since it was coming up null.
    var i = -1; // row index counter

    for (thisrow in tableValueArray) {


        var col = tsm.getColumns()
        var coli = col.iterator();

        while (coli.hasNext()) {
            var colname = coli.next();

            if (typeof (tableValueArray[thisrow][colname.getColumnName()]) == "object")  // we are passed an asiTablVal Obj
            {
                var args = new Array(tableValueArray[thisrow][colname.getColumnName()].fieldValue ? tableValueArray[thisrow][colname.getColumnName()].fieldValue : "", colname);
                var fldToAdd = aa.proxyInvoker.newInstance("com.accela.aa.aamain.appspectable.AppSpecificTableField", args).getOutput();
                fldToAdd.setRowIndex(i);
                fldToAdd.setFieldLabel(colname.getColumnName());
                fldToAdd.setFieldGroup(tableName.replace(/ /g, "\+"));
                fldToAdd.setReadOnly(tableValueArray[thisrow][colname.getColumnName()].readOnly.equals("Y"));
                fld.add(fldToAdd);
                fld_readonly.add(tableValueArray[thisrow][colname.getColumnName()].readOnly);

            }
            else // we are passed a string
            {
                var args = new Array(tableValueArray[thisrow][colname.getColumnName()] ? tableValueArray[thisrow][colname.getColumnName()] : "", colname);
                var fldToAdd = aa.proxyInvoker.newInstance("com.accela.aa.aamain.appspectable.AppSpecificTableField", args).getOutput();
                fldToAdd.setRowIndex(i);
                fldToAdd.setFieldLabel(colname.getColumnName());
                fldToAdd.setFieldGroup(tableName.replace(/ /g, "\+"));
                fldToAdd.setReadOnly(false);
                fld.add(fldToAdd);
                fld_readonly.add("N");

            }
        }

        i--;

        tsm.setTableField(fld);
        tsm.setReadonlyField(fld_readonly); // set readonly field
    }


    tssm = tsm;

    return destinationTableGroupModel;

}

function createEducUpdCond(ipPeopleModel) {
    if (!checkActiveIndividual(capId))
        return;
    var fvSubGroupName = "SPORTSMAN EDUCATION";
    var fvFieldName = "Sportsman Education Type";
    var fvAppSpecificTableScript = aa.appSpecificTableScript.getAppSpecificTableModel(capId, fvSubGroupName).getOutput();
    var fvAppSpecificTable = fvAppSpecificTableScript.getAppSpecificTableModel();
    var fVTableFields = fvAppSpecificTable.getTableFields();

    var fvNewSpEdArray = new Array();
    if (fVTableFields) {
        for (var fvIdx = 0; fvIdx < fVTableFields.size(); fvIdx++) {
            var fvAppSpecificTableField = fVTableFields.get(fvIdx);
            var fVFieldLabel = fvAppSpecificTableField.getFieldLabel();
            if (fVFieldLabel != fvFieldName)
                continue;
            var fvInputValue = fvAppSpecificTableField.getInputValue();
            fvNewSpEdArray.push(fvInputValue);
            break;
        }
    }

    var fvOldSpEdArray = new Array();
    var fvTemplateGroups = ipPeopleModel.getTemplate().getTemplateTables();
    if (fvTemplateGroups && fvTemplateGroups.size() > 0) {
        var fvSubGroups = fvTemplateGroups.get(0).getSubgroups();
        for (var fvSubGroupIndex = 0; fvSubGroupIndex < fvSubGroups.size(); fvSubGroupIndex++) {
            var fvSubGroup = fvSubGroups.get(fvSubGroupIndex);

            if (fvSubGroupName != fvSubGroup.getSubgroupName())
                continue;

            var fvFields = fvSubGroup.getFields();
            if (fvFields) {
                var fvFieldPos = -1;
                for (var fvCounter = 0; fvCounter < fvFields.size(); fvCounter++) {
                    var fvField = fvFields.get(fvCounter);
                    if (fvField.fieldName != fvFieldName)
                        continue;
                    fvFieldPos = fvCounter;
                    break;
                }

                var fvRows = fvSubGroup.getRows();
                if (fvRows) {
                    for (var fvCounter = 0; fvCounter < fvRows.size(); fvCounter++) {
                        var fvRow = fvRows.get(fvCounter);
                        var fvRowValues = fvRow.getValues();
                        var fvValue = fvRowValues.get(fvFieldPos);
                        fvOldSpEdArray.push(fvValue.value);
                    }
                }
            }
            break;
        }
    }

    var fvMismatch = false;
    for (var fvCounter1 in fvOldSpEdArray) {
        var fvOldSpEd = fvOldSpEdArray[fvCounter1];
        var fvFound = false;
        for (var fvCounter2 in fvNewSpEdArray) {
            var fvNewSpEd = fvNewSpEdArray[fvCounter2];
            if (fvOldSpEd == fvNewSpEd) {
                fvFound = true;
                break;
            }
        }
        if (!fvFound) {
            fvMismatch = true;
            break;
        }
    }
    if (!fvMismatch) {
        for (var fvCounter1 in fvNewSpEdArray) {
            var fvNewSpEd = fvNewSpEdArray[fvCounter1];
            var fvFound = false;
            for (var fvCounter2 in fvOldSpEdArray) {
                var fvOldSpEd = fvOldSpEdArray[fvCounter2];
                if (fvOldSpEd == fvNewSpEd) {
                    fvFound = true;
                    break;
                }
            }
            if (!fvFound) {
                fvMismatch = true;
                break;
            }
        }
    }
    var fvCondFulfill = new COND_FULLFILLMENT();
    if (fvMismatch && !appHasCondition("Fulfillment", "Applied", fvCondFulfill.Condition_EducRefContUpd, null))
        addFullfillmentCondition(capId, fvCondFulfill.Condition_EducRefContUpd);
}

function checkActiveIndividual(ipCapID) {
    var opActiveIndividual = false;
    var fvCapContactQry = aa.people.getCapContactByCapID(ipCapID);
    if (fvCapContactQry.getSuccess()) {
        var fvCapContacts = fvCapContactQry.getOutput();
        for (var fvCounter1 in fvCapContacts) {
            var fvCapContact = fvCapContacts[fvCounter1];
            var fvContact = fvCapContact.getCapContactModel();
            var fvRefContactNumber = fvContact.refContactNumber;
            if (!fvRefContactNumber || fvRefContactNumber == "")
                continue;
            var fvRefContactQry = aa.people.getPeople(fvRefContactNumber);
            if (!fvRefContactQry || !fvRefContactQry.getSuccess())
                continue;
            var fvRefContact = fvRefContactQry.getOutput();
            if (!fvRefContact)
                continue;
            if (fvRefContact.contactType != "Individual")
                continue;
            if (fvRefContact.getDeceasedDate())
                continue;
            opActiveIndividual = true;
            break;
        }
    }
    return opActiveIndividual;
}

function processProfileUpdate() {
    var c = getContactObj(capId, "Individual");
    if (c && c.refSeqNumber) {
        var p = aa.people.getPeople(c.refSeqNumber).getOutput();
        logDebug("people is " + p);

        // name change
        if (nameChanged(c.people, p)) {
            c.addAKA(p.getFirstName(), p.getMiddleName(), p.getLastName(), "", new Date(), null);
            logDebug("Name Amendment: added AKA on ref contact " + c.refSeqNumber);
        }

        // address change

        var capContactAdd = [];
        var peopleAdd = [];
        var caSearchModel = aa.address.createContactAddressModel().getOutput();
        caSearchModel.setEntityID(parseInt(c.refSeqNumber));
        caSearchModel.setEntityType("CONTACT");
        var pa = aa.address.getContactAddressList(caSearchModel.getContactAddressModel()).getOutput();

        for (var i in c.addresses) { capContactAdd.push("" + c.addresses[i].getAddressID()); logDebug("ccontact adress : " + c.addresses[i].getAddressID()); }

        for (var i in pa) { peopleAdd.push("" + pa[i].getAddressID()); logDebug("people adress : " + pa[i].getAddressID()); }

        var diff = peopleAdd.filter(function (n) { return capContactAdd.indexOf(n) == -1 });

        for (var i in diff) {
            for (var j in pa) {
                if (String(pa[j].getAddressID()).equals(diff[i])) {
                    var theAdd = pa[j];
                    logDebug("disabling address " + theAdd);
                    //deactivate address on the reference contact
                    theAdd.setAuditStatus("I");
                    theAdd.setExpirationDate(aa.date.getCurrentDate());
                    var cam = theAdd.getContactAddressModel();
                    var editResult = aa.address.editContactAddress(cam);
                }
            }
        }
    }
}

function nameChanged(p1, p2) {
    if (testNameDifferent(p1.getFirstName(), p2.getFirstName())) return true;
    if (testNameDifferent(p1.getLastName(), p2.getLastName())) return true;
    if (testNameDifferent(p1.getMiddleName(), p2.getMiddleName())) return true;
    return false;
}

function testNameDifferent(a, b) {
    if ((!a && b) || (a && !b)) return true;
    if (a && b && !a.toUpperCase().equals(b.toUpperCase())) return true;
    return false;
}

function getTempCapIdFromASB() {
    var arrayList = aa.util.newArrayList();
    arrayList = aa.env.getValue("ContactList");
    var cArray = new Array();
    var count
    var capContactArray = arrayList.toArray();
    if (capContactArray) {
        for (var yy in capContactArray) {
            cArray.push(new contactObj(capContactArray[yy]));
        }
    }

    logDebug("getContactObj returned" + cArray.length + " contactObj(s)");

    for (x in cArray) {
        thisContact = cArray[x];
        if (theContact.refSeqNumber) {
            var conCaps = new Array();
            conCaps = theContact.getCaps(appTypeArray[0] + "/" + appTypeArray[1] + "/" + appTypeArray[2] + "/" + appTypeArray[3]);

            if (conCaps.length > 0) {

                for (var z in conCaps) {
                    var conCap = aa.cap.getCap(conCaps[z]).getOutput();
                    var conCapId = conCaps[z];
                    if (!conCap.isCompleteCap())
                        return conCapId;
                }
            }
        }
    }
}
function getComboComission(commissionCode, commPerc) {
    var delimStr = commissionCode + "";

    var acc = delimStr.split("|");
    acc[2] = commPerc;
    acc[3] = commPerc;

    delimStr = acc.join("|");
    return delimStr;
}
function createComboSuperSportsman(ruleParams, feeUnit, amtToSplit) {
    var ats = AA40_SUPER_SPORTSMAN;

    var newfd = getFeeCodeByRule(ruleParams, FEE_ANL_SUPER_SPORTSMAN_SCHDL, "1", "getAllFeeCodeByRuleFor_SUPER_SPORTSMAN");
    newfd.version = "1";
    newfd.formula = amtToSplit;
    newfd.feeUnit = feeUnit;
    newfd.Code3commission = getComboComission(newfd.Code3commission, 0);

    var newLicId = createComboSubLicense(ats, ruleParams, newfd);

    var infoArray = new Array();
    infoArray.push(newLicId);
    infoArray.push(newfd);

    return infoArray;
}
function createComboHabitatStamp(ruleParams, feeUnit, amtToSplit) {
    var ats = AA16_HABITAT_ACCESS_STAMP;

    var newfd = getFeeCodeByRule(ruleParams, FEE_OTHER_SL_HABITATACES_SCHDL, "1", "getAllFeeCodeByRuleFor_OTHER_SALE_HABITAT_ACCESS_SCHDL");
    newfd.version = "1";
    newfd.formula = amtToSplit;
    newfd.feeUnit = feeUnit;
    newfd.Code3commission = getComboComission(newfd.Code3commission, 0);

    var newLicId = createComboSubLicense(ats, ruleParams, newfd);

    var infoArray = new Array();
    infoArray.push(newLicId);
    infoArray.push(newfd);

    return infoArray;
}
function createComboConservationist(ruleParams, feeUnit, amtToSplit) {
    var ats = AA20_CONSERVATIONIST_MAGAZINE;

    var newfd = getFeeCodeByRule(ruleParams, FEE_OTHER_SL_CONSRVMGZNE_SCHDL, "1", "getAllFeeCodeByRuleFor_OTHER_SALE_CONSERVATION_MAGAZINE");
    newfd.version = "1";
    newfd.formula = amtToSplit;
    newfd.feeUnit = feeUnit;
    newfd.Code3commission = getComboComission(newfd.Code3commission, 0);

    var newLicId = createComboSubLicense(ats, ruleParams, newfd);

    var infoArray = new Array();
    infoArray.push(newLicId);
    infoArray.push(newfd);

    return infoArray;
}
function createComboSubLicense(ats, ruleParams, newfd) {
    var seasonPeriod = GetDateRange(DEC_CONFIG, LICENSE_SEASON, frm.Year);
    var diff = dateDiff(new Date(), seasonPeriod[0]);

    var ata = ats.split("/");
    var decCode = GetItemCode(newfd.Code3commission + "");
    var codeDescription = GetItemCodedesc(decCode);
    var feeUnit = newfd.feeUnit;

    var newLicId = issueSubLicense(ata[0], ata[1], ata[2], ata[3], "Active");
    editAppName(codeDescription, newLicId);

    var effectiveDt;
    var clacFromDt;
    if (ata[1] == "Other") {
        AInfo["CODE.Effective Date"] = jsDateToMMDDYYYY(new Date());
        //JIRA-18322
        editFileDate(newLicId, new Date());
        clacFromDt = dateAdd(convertDate(seasonPeriod[1]), 0);
        setLicExpirationDate(newLicId, "", clacFromDt);
        //
    } else {
        if (diff > 0) {
            AInfo["CODE.Effective Date"] = jsDateToMMDDYYYY(seasonPeriod[0]);
            editFileDate(newLicId, seasonPeriod[0]);
            clacFromDt = dateAdd(convertDate(seasonPeriod[1]), 0);
            setLicExpirationDate(newLicId, "", clacFromDt);
        } else {
            AInfo["CODE.Effective Date"] = jsDateToMMDDYYYY(new Date());
            editFileDate(newLicId, new Date());
            clacFromDt = dateAdd(convertDate(seasonPeriod[1]), 0);
            setLicExpirationDate(newLicId, "", clacFromDt);
        }
    }

    setSalesItemASI(newLicId, ats, decCode, feeUnit, null, null);
    var newDecDocId = GenerateDocumentNumber(newLicId.getCustomID());
    updateDocumentNumber(newDecDocId, newLicId);

    return newLicId;
}
//JIRA - 18414
function getAgentByBusinessName(contactType, businessName) {
    var peopResult = null;
    var vError = null;

    try {
        var qryPeople = aa.people.createPeopleModel().getOutput().getPeopleModel();
        qryPeople.setBusinessName(businessName)
        qryPeople.setContactType(contactType);
        qryPeople.setAuditStatus("A");
        qryPeople.setServiceProviderCode(aa.getServiceProviderCode());

        var r = aa.people.getPeopleByPeopleModel(qryPeople);
        if (r.getSuccess()) {
            peopResult = r.getOutput();
            if (peopResult.length == 0) {
                logDebug("Searched for REF contact, no matches found, returing null");
                peopResult = null
            }
        }
    }
    catch (vError) {
        logDebug("Runtime error occurred: " + vError);
    }
    return peopResult;
}
function getPublicUserInfo(userId) {
    var returnArray = new Array();

    var uObj;
    if (arguments.length > 0) {
        uObj = new USEROBJ();
        uObj.userId = userId;
        uObj.userModel = uObj.getUserModel();
        uObj.setUserModelAttributes();
    } else {
        uObj = new USEROBJ(publicUserID);
    }

    if (uObj.acctType == 'CITIZEN') {
        var salesAgentInfoArray = getAgentInfo(uObj.publicUserID, uObj);
        returnArray = getCntAsiInfoByPeopleSeqNum(uObj.peopleSequenceNumber);
    }

    return returnArray;
}

function getCntAsiInfoByPeopleSeqNum(peopleSequenceNumber) {
    var returnArray = new Array();

    var peopleModel = getOutput(aa.people.getPeople(peopleSequenceNumber), "");
    var subGroupArray = getTemplateValueByFormArrays(peopleModel.getTemplate(), null, null);
    //GetAllASI(subGroupArray);
    for (var subGroupName in subGroupArray) {
        var fieldArray = subGroupArray[subGroupName];
        for (var fld in fieldArray) {
            returnArray[fld] = fieldArray[fld];
        }
    }
    return returnArray;
}

function loadAppSpecific4ACA(thisArr) {
    //
    // Returns an associative array of App Specific Info
    // Optional second parameter, cap ID to load from
    //
    // uses capModel in this event


    var itemCap = capId;
    if (arguments.length >= 2) {
        itemCap = arguments[1]; // use cap ID specified in args

        var fAppSpecInfoObj = aa.appSpecificInfo.getByCapID(itemCap).getOutput();

        for (loopk in fAppSpecInfoObj) {
            if (useAppSpecificGroupName)
                thisArr[fAppSpecInfoObj[loopk].getCheckboxType() + "." + fAppSpecInfoObj[loopk].checkboxDesc] = fAppSpecInfoObj[loopk].checklistComment;
            else
                thisArr[fAppSpecInfoObj[loopk].checkboxDesc] = fAppSpecInfoObj[loopk].checklistComment;
        }
    }
    else {
        var capASI = cap.getAppSpecificInfoGroups();
        if (!capASI) {
            logDebug("No ASI for the CapModel");
        }
        else {
            var i = cap.getAppSpecificInfoGroups().iterator();

            while (i.hasNext()) {
                var group = i.next();
                var fields = group.getFields();
                if (fields != null) {
                    var iteFields = fields.iterator();
                    while (iteFields.hasNext()) {
                        var field = iteFields.next();

                        if (useAppSpecificGroupName)
                            thisArr[field.getCheckboxType() + "." + field.getCheckboxDesc()] = field.getChecklistComment();
                        else
                            thisArr[field.getCheckboxDesc()] = field.getChecklistComment();
                    }
                }
            }
        }
    }
}


function copyMailAddToContactForPU() {

    var publicUser = aa.env.getValue("PublicUserModel"); //get publicusermodel
    var publicUserBusiness = aa.proxyInvoker.newInstance("com.accela.v360.publicuser.PublicUserBusiness").getOutput();

    var pUserSeqNumber = publicUser.getUserSeqNum();
    //var pUserSeqNumber = 94415;

    try {
        if (pUserSeqNumber) {
            var refCon = getRefConByPublicUserSeq(pUserSeqNumber);

            if (refCon) {
                var peopleSequenceNumber = refCon.getContactSeqNumber()
                var peopleModel = getOutput(aa.people.getPeople(peopleSequenceNumber), "");
                var tmpl = peopleModel.getTemplate();

                var fvCASearchModel = aa.address.createContactAddressModel().getOutput();
                fvCASearchModel.setEntityID(parseInt(peopleSequenceNumber, 10));
                fvCASearchModel.setEntityType("CONTACT");
                var fvCAResult = aa.address.getContactAddressList(fvCASearchModel.getContactAddressModel());
                var fvCAOutput = fvCAResult.getOutput();
                if (fvCAOutput) {
                    for (var i in fvCAOutput) {
                        if (fvCAOutput[i].addressType == "Mailing") {
                            var compactAddress = refCon.getCompactAddress();
                            compactAddress.setAddressLine1(fvCAOutput[i].getAddressLine1());
                            compactAddress.setAddressLine2(fvCAOutput[i].getAddressLine2());
                            compactAddress.setAddressLine3(fvCAOutput[i].getAddressLine3());
                            compactAddress.setCity(fvCAOutput[i].getCity());
                            compactAddress.setState(fvCAOutput[i].getState());
                            compactAddress.setZip(fvCAOutput[i].getZip());
                            refCon.setCompactAddress(compactAddress);
                            var editContactResult = aa.people.editPeopleWithAttribute(refCon, refCon.getAttributes()); ;
                        }
                    }

                    peopleModel = getOutput(aa.people.getPeople(peopleSequenceNumber), "");
                    if (peopleModel.getTemplate() == null) {
                        if (tmpl != null) {
                            var e = tmpl.getEntityPKModel();
                            e.setEntitySeq1(peopleSequenceNumber * 1);
                            tmpl.setEntityPKModel(e);
                            peopleModel.setTemplate(tmpl);

                            aa.people.editPeople(peopleModel);
                        }
                    }
                }
            }
        }
    }
    catch (err) {
        logDebug("An error occured in copyMailAddToContactForPU : " + err);
    }
}

function getRefConByPublicUserSeq(pSeqNum) {

    var publicUserSeq = pSeqNum; //Public user sequence number
    var userSeqList = aa.util.newArrayList();
    userSeqList.add(aa.util.parseLong(publicUserSeq));
    var contactPeopleBiz = aa.proxyInvoker.newInstance("com.accela.pa.people.ContractorPeopleBusiness").getOutput()
    var contactors = contactPeopleBiz.getContractorPeopleListByUserSeqNBR(aa.getServiceProviderCode(), userSeqList, true);

    if (contactors) {
        if (contactors.size() > 0) {
            if (contactors.get(0)) {
                return contactors.get(0);
            }
        }
    }
}

function asaForDMVRequest() {

    try {
        //Added to resolve Defect 47387.
        removeAllFees(capId);
        // add fees

        if (AInfo["Add Lifetime to Driver License Re-Issue Immediately"] == "CHECKED") {
            addFee("FEE_DL_1", "FEE_LIFETM_DL_IMM_OPTIN", "FINAL", 1, "Y");
        }
        if (AInfo["Add Lifetime to Non-Driver License Re-Issue Immediately"] == "CHECKED") {
            addFee("FEE_DL_3", "FEE_LIFETM_DL_IMM_OPTIN", "FINAL", 1, "Y");
        }
        if (AInfo["Add Lifetime to Driver License on Renewal"] == "CHECKED") {
            addFee("FEE_DL_2", "FEE_LIFETM_DL_IMM_OPTIN", "FINAL", 1, "Y");
        }
        // associate contact

        refCon = getRefConByPublicUserSeq(aa.publicUser.getPublicUserByPUser(aa.env.getValue("CurrentUserID")).getOutput().getUserSeqNum());
        var refContactId = refCon.getContactSeqNumber() * 1;
        var refCon = getOutput(aa.people.getPeople(refContactId), " ");

        //Get reference contact address list so it copies down to the record
        var caSearchModel = aa.address.createContactAddressModel().getOutput();
        caSearchModel.setEntityID(refContactId);
        caSearchModel.setEntityType("CONTACT");
        var caResult = aa.address.getContactAddressList(caSearchModel.getContactAddressModel()).getOutput();
        if (caResult != null) {
            var caList = aa.util.newArrayList();
            for (var cax in caResult) {
                caList.add(caResult[cax].getContactAddressModel());
            }
            refCon.setContactAddressList(caList);
        }

        var linkRefContactResult = aa.people.createCapContactWithRefPeopleModel(capId, refCon);
        editContactType("Individual", "Applicant");
        editContactType("Organization", "Applicant");

    } catch (err) {
        logDebug(" ERROR : " + err.message + " In " + " Line " + err.lineNumber);
        logDebug(" Stack : " + err.stack);
    }
}

function ctrcaForDMVRequestOld() {

    try {

        var childId = null;

        // create children

        if (AInfo["Add Lifetime to Driver License Re-Issue Immediately"] == "CHECKED") {
            childId = createChild("Licenses", "Tag", "Document", "Driver License Immediate", "");
        }
        if (AInfo["Add Lifetime to Non-Driver License Re-Issue Immediately"] == "CHECKED") {
            childId = createChild("Licenses", "Tag", "Document", "Driver License Immediate", "");
        }
        if (AInfo["Add Lifetime to Driver License on Renewal"] == "CHECKED") {
            childId = createChild("Licenses", "Tag", "Document", "Driver License Renewal", "");
        }

        if (childId) {
            updateAppStatus("Active", "Active", childId);
            //transferFeesAndPayments(capId, childId);
        }

    } catch (err) {
        logDebug(" ERROR : " + err.message + " In " + " Line " + err.lineNumber);
        logDebug(" Stack : " + err.stack);
    }
}

//JIRA-47037
function ctrcaForDMVRequest() {
    try {
        var seasonPeriod = GetLicenseSeasonPeriod();
        var sYear = seasonPeriod[0].getFullYear();
        var seasonPeriod = GetDateRange(DEC_CONFIG, LICENSE_SEASON, sYear);
        var diff = dateDiff(new Date(), seasonPeriod[0]);
        var clacFromDt = dateAdd(convertDate(seasonPeriod[1]), 0);
        setLicExpirationDate(capId, "", clacFromDt);

        var uObj = new USEROBJ(publicUserID);
        salesAgentInfoArray = getAgentInfo(publicUserID, uObj);
        attachAgent(uObj);

        var childId = null;
        var recordType = "";
        var decCode = "000";
        // create children
        if (AInfo["Add Lifetime to Driver License Re-Issue Immediately"] == "CHECKED") {
            recordType = AA55_TAG_DRIV_LIC_IMM;
            feeCode = FEE_LIFETIME_DRIV_LIC_IMMED;
        }
        if (AInfo["Add Lifetime to Non-Driver License Re-Issue Immediately"] == "CHECKED") {
            recordType = AA55_TAG_DRIV_LIC_IMM;
            feeCode = FEE_LIFETIME_DRIV_LIC_IMM_NON;
        }
        if (AInfo["Add Lifetime to Driver License on Renewal"] == "CHECKED") {
            recordType = AA56_TAG_DRIV_LIC_REN;
            feeCode = FEE_LIFETIME_DRIV_LIC_RENEW;
        }
        var ata = recordType.split("/");
        childId = createChild(ata[0], ata[1], ata[2], ata[3], "");
        newfd = getFeeDefByCode(FEE_LIFETIME_DRIV_LIC_SCHDL, feeCode, "1", decCode);
        newfd.feeUnit = 1;
        newfd.version = "1";

        var code3commission = newfd.Code3commission + "";
        decCode = GetItemCode(code3commission + "");
        var codeDescription = GetItemCodedesc(decCode);

        closeTask("Issuance", "Approved", "", "");

        if (childId) {
            updateAppStatus("Active", "Active", childId);

            closeTaskForRec("Issuance", "Active", "", "", "", childId);
            activateTaskForRec("Report Game Harvest", "", childId);
            activateTaskForRec("Void Document", "", childId);
            activateTaskForRec("Revocation", "", childId);
            activateTaskForRec("Suspension", "", childId);

            if (diff > 0) {
                editFileDate(childId, seasonPeriod[0]);
                setLicExpirationDate(childId, dateAdd(null, 0));
            } else {
                editFileDate(childId, new Date());
                setLicExpirationDate(childId, dateAdd(null, 0));
            }

            var codeDescription = GetItemCodedesc(decCode);
            editAppName(codeDescription, childId);

            setSalesItemASI(childId, recordType, decCode, 1, null, null);

            var newDecDocId = GenerateDocumentNumber(childId.getCustomID());
            updateDocumentNumber(newDecDocId, childId);

            var arryTargetCapAttrib = new Array();
            arryTargetCapAttrib.push(new TargetCAPAttrib(childId, newfd));

            distributeFeesAndPayments(capId, arryTargetCapAttrib, salesAgentInfoArray);
        }

    } catch (err) {
        logDebug(" ERROR : " + err.message + " In " + " Line " + err.lineNumber);
        logDebug(" Stack : " + err.stack);
    }
}

function editContactType(existingType, newType) {
    //Function will change contact types from exsistingType to newType,
    //optional paramter capID{
    var updateCap = capId
    if (arguments.length == 3)
        updateCap = arguments[2]

    capContactResult = aa.people.getCapContactByCapID(updateCap);
    if (capContactResult.getSuccess()) {
        Contacts = capContactResult.getOutput();
        for (yy in Contacts) {
            var theContact = Contacts[yy].getCapContactModel();
            if (theContact.getContactType() == existingType) {
                theContact.setContactType(newType);
                aa.people.editCapContact(theContact);
                logDebug(" Contact for " + theContact.getFullName() + " Updated to " + newType);
            }
        }
    }
}
//Obsolete
function transferFeesAndPayments(sourceCapId, targetCapId) {
    //
    // Step 1: Unapply payments from the Source
    //
    var piresult = aa.finance.getPaymentByCapID(capId, null).getOutput()

    var feeSeqArray = new Array();
    var invoiceNbrArray = new Array();
    var feeAllocationArray = new Array();

    for (ik in piresult) {
        var thisPay = piresult[ik];
        var pfResult = aa.finance.getPaymentFeeItems(capId, null);
        if (pfResult.getSuccess()) {
            var pfObj = pfResult.getOutput();
            for (ij in pfObj)
                if (pfObj[ij].getPaymentSeqNbr() == thisPay.getPaymentSeqNbr()) {
                    feeSeqArray.push(pfObj[ij].getFeeSeqNbr());
                    invoiceNbrArray.push(pfObj[ij].getInvoiceNbr());
                    feeAllocationArray.push(pfObj[ij].getFeeAllocation());
                }
        }

        if (feeSeqArray.length > 0) {
            z = aa.finance.applyRefund(capId, thisPay, feeSeqArray, invoiceNbrArray, feeAllocationArray, "FeeStat", "InvStat", "123");
            if (z.getSuccess()) {
                logDebug("Refund applied");
            } else {
                logDebug("Error applying refund " + z.getErrorMessage());
            }
        }
    }

    //
    // Step 2: add the fees to the target and void from the source
    //

    feeA = loadFees()

    for (x in feeA) {
        thisFee = feeA[x];
        logDebug("status is " + thisFee.status)
        if (thisFee.status == "INVOICED") {
            addFee(thisFee.code, thisFee.sched, thisFee.period, thisFee.unit, "Y", targetCapId)
            voidResult = aa.finance.voidFeeItem(capId, thisFee.sequence);
            if (voidResult.getSuccess()) {
                logDebug("Fee item " + thisFee.code + "(" + thisFee.sequence + ") has been voided")
            }
            else {
                logDebug("**ERROR: voiding fee item " + thisFee.code + "(" + thisFee.sequence + ") " + voidResult.getErrorMessage());
            }

            var feeSeqArray = new Array();
            var paymentPeriodArray = new Array();

            feeSeqArray.push(thisFee.sequence);
            paymentPeriodArray.push(thisFee.period);
            var invoiceResult_L = aa.finance.createInvoice(capId, feeSeqArray, paymentPeriodArray);

            if (!invoiceResult_L.getSuccess())
                logDebug("**ERROR: Invoicing the fee items voided " + feeCapMessage + " was not successful.  Reason: " + invoiceResult.getErrorMessage());
        }

    }

    //
    // Step 3: transfer the funds from Source to Target
    //

    var unapplied = paymentGetNotAppliedTot()

    var xferResult = aa.finance.makeFundTransfer(capId, targetCapId, currentUserID, "", "", sysDate, sysDate, "", sysDate, unapplied, "NA", "Fund Transfer", "NA", "R", null, "", "NA", "");
    if (xferResult.getSuccess())
        logDebug("Successfully did fund transfer to : " + targetCapId.getCustomID());
    else
        logDebug("**ERROR: doing fund transfer to (" + targetCapId.getCustomID() + "): " + xferResult.getErrorMessage());

    //
    // Step 4: On the target, loop through payments then invoices to auto-apply
    //

    var piresult = aa.finance.getPaymentByCapID(targetCapId, null).getOutput()

    for (ik in piresult) {
        var feeSeqArray = new Array();
        var invoiceNbrArray = new Array();
        var feeAllocationArray = new Array();

        var thisPay = piresult[ik];
        var applyAmt = 0;
        var unallocatedAmt = thisPay.getAmountNotAllocated()

        if (unallocatedAmt > 0) {

            var invArray = aa.finance.getInvoiceByCapID(targetCapId, null).getOutput()

            for (var invCount in invArray) {
                var thisInvoice = invArray[invCount];
                var balDue = thisInvoice.getInvoiceModel().getBalanceDue();
                if (balDue > 0) {
                    feeT = aa.invoice.getFeeItemInvoiceByInvoiceNbr(thisInvoice.getInvNbr()).getOutput();

                    for (targetFeeNum in feeT) {
                        var thisTFee = feeT[targetFeeNum];

                        if (thisTFee.getFee() > unallocatedAmt)
                            applyAmt = unallocatedAmt;
                        else
                            applyAmt = thisTFee.getFee() // use balance here?

                        unallocatedAmt = unallocatedAmt - applyAmt;

                        feeSeqArray.push(thisTFee.getFeeSeqNbr());
                        invoiceNbrArray.push(thisInvoice.getInvNbr());
                        feeAllocationArray.push(applyAmt);
                    }
                }
            }

            applyResult = aa.finance.applyPayment(targetCapId, thisPay, feeSeqArray, invoiceNbrArray, feeAllocationArray, "PAYSTAT", "INVSTAT", "123")

            if (applyResult.getSuccess())
                logDebug("Successfully applied payment");
            else
                logDebug("**ERROR: applying payment to fee (" + thisTFee.getFeeDescription() + "): " + applyResult.getErrorMessage());

        }
    }
}
//JIRA-47037
function isValidRecForCreateRef() {
    var retvalue = true;
    var recTypeArray = new Array();
    recTypeArray.push("Licenses/Other/Sportsmen/DMV ID Request");
    recTypeArray.push("Licenses/Customer/Registration/Application");
    recTypeArray.push("Licenses/Sales/Upgrade/Lifetime");
    recTypeArray.push("Licenses/Sales/Void/Documents");
    recTypeArray.push("Licenses/Sales/Reprint/Documents");
    recTypeArray.push("Licenses/Sales/Application/Transfer");
    recTypeArray.push("Licenses/Other/Sales/Application");
    recTypeArray.push("Licenses/Other/Sportsmen/Game Harvest");

    for (y in recTypeArray) {
        if (appMatch(recTypeArray[y])) {
            retvalue = false;
            break;
        }
    }
    return retvalue;
}

function copyASIContactAppSpecificToRecordAppSpecific() {
    logDebug("ENTER: copyASIContactAppSpecificToRecordAppSpecific");

    if (publicUser) {

        var publicUserID = "" + aa.env.getValue("CurrentUserID");

        if (publicUserID.length > 0) {
            var pUserSeqNum = aa.util.parseLong(publicUserID.substr(10, publicUserID.length - 1));
            var s_publicUserResult = aa.publicUser.getPublicUser(pUserSeqNum);
            if (s_publicUserResult.getSuccess()) {
                var pUserObj = s_publicUserResult.getOutput();
                if (pUserObj.getAccountType() == "CITIZEN") {
                    MSG_SUSPENSION = "Customer privileges are suspended and licenses are not available for purchase. This issue can only be resolved by contacting DEC Law Enforcement during business hours at 518-402-8821.";
                }
            }
        }
    }
    var isNotValidToProceed = MSG_SUSPENSION;

    var uObj = new USEROBJ(publicUserID);

    var xArray = new Array();
    if (uObj.acctType == "CITIZEN") {
        //xArray = getApplicantArraybyPublicUserId(uObj.peopleSequenceNumber);
        xArray = getApplicantArrayEx();
    } else {
        xArray = getApplicantArrayEx();
    }

    var peopleSequenceNumber = null;
    var deceasedDate = null;
    var custProfileToCheckArray = new Array();

    for (ca in xArray) {
        var thisContact = xArray[ca];
        //First One is always Applicant

        //Copy People Tempalte Fields.   These are fields that the user may change on field entry, need to make 
        //sure that the new values are used in calculations on the page before they are updated to the reference contact
        editAppSpecific4ACA("A_FromACA", "Yes");
        editAppSpecific4ACA("A_email", thisContact["email"]);
        editAppSpecific4ACA("A_birthDate", formatMMDDYYYY(thisContact["birthDate"]));
        editAppSpecific4ACA("A_IsNYResident", thisContact["Are You New York Resident?"]);
        editAppSpecific4ACA("A_Driver_License_State", thisContact["driverLicenseState"]);
        editAppSpecific4ACA("A_Driver_License_Number", thisContact["driverLicenseNbr"]);
        editAppSpecific4ACA("A_Non_Driver_License_Number", thisContact["stateIDNbr"]);
        editAppSpecific4ACA("A_NY_Resident_Proof_Document", thisContact["NY Resident Proof Document"]);

        var strAnnual = null;
        var strPrev = null;
        var strLand = null;
        var strEduc = null;

        peopleSequenceNumber = thisContact["refcontactSeqNumber"]

        if (peopleSequenceNumber != null) {
            var peopleModel = getOutput(aa.people.getPeople(peopleSequenceNumber), "");

            deceasedDate = peopleModel.getDeceasedDate();

            //Copy All Asi Fields: asumption is identical subgroups are available in cap ASI
            var subGroupArray = getTemplateValueByFormArrays(peopleModel.getTemplate(), null, null);
            GetAllASI(subGroupArray);

            for (var subGroupName in subGroupArray) {
                var fieldArray = subGroupArray[subGroupName];
                if (subGroupName == "ADDITIONAL INFO") {
                    //editAppSpecific4ACA("A_IsNYResident", fieldArray["Are You New York Resident?"]);
                    editAppSpecific4ACA("A_Preference_Points", isNull(fieldArray["Preference Points"], '0'));
                    editAppSpecific4ACA("Preference Points", isNull(fieldArray["Preference Points"], '0'));
                    editAppSpecific4ACA("A_Parent_Driver_License_Number", fieldArray["Parent Driver License Number"]);
                    //editAppSpecific4ACA("A_NY_Resident_Proof_Document", fieldArray["NY Resident Proof Document"]);
                    continue;
                } else {
                    if (subGroupName == "APPEARANCE") {
                        editAppSpecific4ACA("A_Legally Blind", isNull(fieldArray["Legally Blind"], '0'));
                        editAppSpecific4ACA("A_Permanent Disability", isNull(fieldArray["Permanent Disability"], '0'));

                        custProfileToCheckArray.push(fieldArray["Height"]);
                        custProfileToCheckArray.push(fieldArray["Height - inches"]);
                        custProfileToCheckArray.push(fieldArray["Eye Color"]);
                        custProfileToCheckArray.push(fieldArray["Legally Blind"]);
                        custProfileToCheckArray.push(fieldArray["Permanent Disability"]);
                        continue;
                    } else {
                        //JIRA-15754
                        var isCurrentAffidavit = hasCurrentAffidavit(fieldArray["Affidavit Date"]);
                        if (isCurrentAffidavit) {
                            editAppSpecific4ACA("A_Military Serviceman", isNull(fieldArray["Military Serviceman"], '0'));
                        }
                        custProfileToCheckArray.push(fieldArray["Military Serviceman"]);
                        continue;
                    }
                }
            }

            //Copy All ASITs : asumption is identical ASITs with subgroups are available in cap ASIT
            subGroupArray = getTemplateValueByTableArrays(peopleModel.getTemplate());
            strAnnual = GetContactASITDelimitedString(subGroupArray["ANNUAL DISABILITY"]);
            strPrev = GetContactASITDelimitedString(subGroupArray["PREVIOUS LICENSE"]);
            strLand = GetContactASITDelimitedString(subGroupArray["LAND OWNER INFORMATION"]);
            strEduc = GetContactASITDelimitedString(subGroupArray["SPORTSMAN EDUCATION"]);
        }

        //----load ASITs
        editAppSpecific4ACA("A_Annual_Disability", strAnnual);
        editAppSpecific4ACA("A_Previous_License", strPrev);
        editAppSpecific4ACA("A_Land_Owner_Information", strLand);
        editAppSpecific4ACA("A_Sportsman_Education", strEduc);

        var asitModel;
        var new_asit;
        if (appTypeString == 'Licenses/Sales/Application/Hunting' || appTypeString == 'Licenses/Sales/Application/Hunting and Fishing') {
            if (!(typeof (LANDOWNERINFORMATION) == "object")) {
                var newLandOwnerInfo = GetTableValueArrayByDelimitedString("LANDOWNERINFORMATION", strLand)
                asitModel = cap.getAppSpecificTableGroupModel();
                new_asit = addASITable4ACAPageFlow(asitModel, "LAND OWNER INFORMATION", newLandOwnerInfo);
            }
        }
        //if (!(typeof (ANNUALDISABILITY) == "object")) {
        //    var newAnnualDiability = GetTableValueArrayByDelimitedString("ANNUALDISABILITY", strAnnual)
        //    asitModel = cap.getAppSpecificTableGroupModel();
        //    new_asit = addASITable4ACAPageFlow(asitModel, "ANNUAL DISABILITY", newAnnualDiability);
        //}
        //if (!(typeof (SPORTSMANEDUCATION) == "object")) {
        //    var newSportsmanDucat = GetTableValueArrayByDelimitedString("SPORTSMANEDUCATION", strEduc)
        //    asitModel = cap.getAppSpecificTableGroupModel();
        //    new_asit = addASITable4ACAPageFlow(asitModel, "SPORTSMAN EDUCATION", newSportsmanDucat);
        //}
        //if (!(typeof (PREVIOUSLICENSE) == "object")) {
        //    var newPreviousLic = GetTableValueArrayByDelimitedString("PREVIOUSLICENSE", strPrev)
        //    asitModel = cap.getAppSpecificTableGroupModel();
        //    new_asit = addASITable4ACAPageFlow(asitModel, "PREVIOUS LICENSE", newPreviousLic);
        //}

        //Contact Conditions Settings
        var contactCondArray = getContactCondutions(peopleSequenceNumber);
        editAppSpecific4ACA("A_Suspended", (isSuspension(contactCondArray) ? "Yes" : "No"));
        editAppSpecific4ACA("A_Revoked_Hunting", (isRevocationHunting(contactCondArray) ? "Yes" : "No"));
        editAppSpecific4ACA("A_Revoked_Trapping", (isRevocationTrapping(contactCondArray) ? "Yes" : "No"));
        editAppSpecific4ACA("A_Revoked_Fishing", (isRevocationFishing(contactCondArray) ? "Yes" : "No"));
        editAppSpecific4ACA("A_AgedIn", (isMarkForAgedInFulfillment(contactCondArray) ? "Yes" : "No"));
        editAppSpecific4ACA("A_NeedHuntEd", (isMarkForNeedHutEdFulfillment(contactCondArray) ? "Yes" : "No"));

        if (!isSuspension(contactCondArray)) {
            isNotValidToProceed = false;
        }
        break;
    }

    if (deceasedDate) {
        if (isNotValidToProceed) {
            isNotValidToProceed += MSG_DECEASED;
        }
        else {
            isNotValidToProceed = MSG_DECEASED;
        }
    }


    if (!isAgentAbleToSell(publicUserID)) {
        if (isNotValidToProceed) {
            isNotValidToProceed += MSG_NO_AGENT_SALES;
        }
        else {
            isNotValidToProceed = MSG_NO_AGENT_SALES;
        }
    }

    //JIRA-50367
    var isCustProfileLooksGood = false;
    for (var t in custProfileToCheckArray) {
        isCustProfileLooksGood = (isNull(custProfileToCheckArray[t], '') == '');
        if (isCustProfileLooksGood) {
            if (isNotValidToProceed) {
                isNotValidToProceed += "Information is missing from customer profile. Please update customer profile.";
            }
            else {
                isNotValidToProceed = "Information is missing from customer profile. Please update customer profile.";
            }
            break;
        }
    }

    // Defect 13354
    var isMultipleAddresses = false;
    var capContact = cap.getApplicantModel();
    if (capContact) {

        if (capContact.getRefContactNumber()) {
            var passport = isNull(aa.people.getPeople(capContact.getRefContactNumber()).getOutput().getPassportNumber(), null);
            var newpassport = isNull(cap.getApplicantModel().getPeople().getPassportNumber(), null);

            if ((passport && !newpassport) || (!passport && newpassport) || (passport && newpassport && passport != newpassport)) {
                if (isNotValidToProceed) {
                    isNotValidToProceed += MSG_DEC_ID_EDITED;
                }
                else {
                    isNotValidToProceed = MSG_DEC_ID_EDITED + " (" + passport + ") v. (" + newpassport + ")";
                }
            }
        }


        pmcal = capContact.getPeople().getContactAddressList();
        if (pmcal) {
            var addresses = pmcal.toArray();
            if (addresses.length > 1) {
                var addrTypeCount = new Array();
                for (var y in addresses) {
                    var thisAddr = addresses[y];
                    addrTypeCount[thisAddr.addressType] = 0;
                }

                for (var yy in addresses) {
                    thisAddr = addresses[yy];
                    addrTypeCount[thisAddr.addressType] += 1;
                }

                for (var z in addrTypeCount) {
                    if (addrTypeCount[z] > 1)
                        isMultipleAddresses = true;
                }
            }

            if (isMultipleAddresses) {
                if (isNotValidToProceed) {
                    isNotValidToProceed += MSG_TOO_MANY_ADDR
                }
                else {
                    isNotValidToProceed = MSG_TOO_MANY_ADDR;
                }
            }
        }
    }

    createActiveHoldingTable();
    loadAppSpecific4ACA(AInfo);
    var exmsg = '';
    if (controlString != 'ACA ONSUBMIT BEFORE EXPRESS P1') {
        if (isNull(AInfo["License Year"], '') == '') {
            exmsg += "Please enter license year.";
            if (isNotValidToProceed) {
                isNotValidToProceed += exmsg
            }
            else {
                isNotValidToProceed = exmsg;
            }
        } else {
            appTypeString = cap.getCapType().toString();
            var f = new form_OBJECT(GS2_SCRIPT, OPTZ_TYPE_ALLFEES);
            f.RecordType = appTypeString;
            if (appTypeString == 'Licenses/Sales/Application/Fishing' || appTypeString == 'Licenses/Sales/Application/Marine Registry' || appTypeString == 'Licenses/Sales/Application/Fishing C' || appTypeString == 'Licenses/Sales/Application/Marine Registry C') {
                f.SetFishSaleExcludes();
                SetExpressformForSelectedLics(f);
                if (f.MessageFish != "") {
                    exmsg += f.MessageFish;
                }
            }
            if (appTypeString == 'Licenses/Sales/Application/Hunting' || appTypeString == 'Licenses/Sales/Application/Hunting C') {
                f.SetHuntSaleExcludes();
                SetExpressformForSelectedLics(f);
                if (f.MessageHunter != "") {
                    exmsg += f.MessageHunter;
                }
            }
            if (appTypeString == 'Licenses/Sales/Application/Trapping' || appTypeString == 'Licenses/Sales/Application/Trapping C') {
                f.SetTrapSaleExcludes();

                SetExpressformForSelectedLics(f);
                if (f.MessageHunter != "") {
                    exmsg += f.MessageHunter;
                }
            }
            if (appTypeString == 'Licenses/Sales/Application/Lifetime' || appTypeString == 'Licenses/Sales/Application/Lifetime C') {
                f.SetLifeTimeSaleExcludes();
                SetExpressformForSelectedLics(f);
                if (f.MessageLifeTime != "") {
                    exmsg += f.MessageLifeTime;
                }
            }
            if (appTypeString == 'Licenses/Sales/Application/Hunting and Fishing' || appTypeString == 'Licenses/Sales/Application/Hunting and Fishing C') {
                f.SetHuntAndFishSaleExcludes();
                SetExpressformForSelectedLics(f);
                if (f.MessageFish != "" && f.MessageHunter != "") {
                    exmsg += f.MessageFish;
                }
            }
            if (appTypeString == 'Licenses/Sales/Application/Sporting') {
                SetExpressformForSelectedLics(f);
                if (f.MessageFish != "" && f.MessageHunter != "" && f.MessageLifeTime != "") {
                    exmsg += f.MessageFish;
                }
            }
            if (isNotValidToProceed) {
                isNotValidToProceed += exmsg
            }
            else {
                isNotValidToProceed = exmsg;
            }
        }
    }
    logDebug("EXIT: copyASIContactAppSpecificToRecordAppSpecific");

    return isNotValidToProceed;
}

//Start-All express record types for ASI_FISH,ASI_HUNT,ASI_LT and ASI_TRAP
//ACA ONSUBMIT After
function SetExpressformForSelectedLics(frm) {
    logDebug("ENTER: SetExpressformForSelectedLics");
    frm.Year = AInfo["License Year"];
    frm.DOB = AInfo["A_birthDate"];
    frm.Email = AInfo["A_email"];
    frm.IsNyResiDent = AInfo["A_IsNYResident"];
    frm.IsMilitaryServiceman = AInfo["A_Military Serviceman"];
    frm.IsNativeAmerican = AInfo["A_IsNativeAmerican"];
    frm.IsLegallyBlind = AInfo["A_Legally Blind"];
    frm.PreferencePoints = AInfo["A_Preference_Points"];
    frm.SetAnnualDisability(AInfo["A_Annual_Disability"]);
    frm.SetPriorLicense(AInfo["A_Previous_License"]);
    frm.SetSportsmanEducation(AInfo["A_Sportsman_Education"]);
    frm.SetLandOwnerInfo(AInfo["A_Land_Owner_Information"]);
    frm.SetActiveHoldingsInfo(AInfo["A_ActiveHoldings"]);
    frm.Inscription = AInfo["Inscription"];
    frm.IsPermanentDisabled = AInfo["A_Permanent Disability"];
    frm.DriverLicenseState = AInfo["A_Driver_License_State"];
    frm.DriverLicenseNumber = AInfo["A_Driver_License_Number"];
    frm.NonDriverLicenseNumber = AInfo["A_Non_Driver_License_Number"];

    var isFishSection = (appTypeString == 'Licenses/Sales/Application/Fishing' || appTypeString == 'Licenses/Sales/Application/Hunting and Fishing' || appTypeString == 'Licenses/Sales/Application/Marine Registry');
    isFishSection = isFishSection || (appTypeString == 'Licenses/Sales/Application/Sporting');
    isFishSection = isFishSection || (appTypeString == 'Licenses/Sales/Application/Fishing C' || appTypeString == 'Licenses/Sales/Application/Hunting and Fishing C' || appTypeString == 'Licenses/Sales/Application/Marine Registry C');
    isFishSection = isFishSection || (appTypeString == 'Licenses/Sales/Application/Sporting C');

    var isHuntSection = (appTypeString == 'Licenses/Sales/Application/Hunting' || appTypeString == 'Licenses/Sales/Application/Hunting and Fishing');
    isHuntSection = isHuntSection || (appTypeString == 'Licenses/Sales/Application/Sporting');
    isHuntSection = isHuntSection || (appTypeString == 'Licenses/Sales/Application/Hunting C' || appTypeString == 'Licenses/Sales/Application/Hunting and Fishing C');
    isHuntSection = isHuntSection || (appTypeString == 'Licenses/Sales/Application/Sporting C');

    var isLifetimeSection = (appTypeString == 'Licenses/Sales/Application/Lifetime');
    isLifetimeSection = isLifetimeSection || (appTypeString == 'Licenses/Sales/Application/Sporting');
    isLifetimeSection = isLifetimeSection || (appTypeString == 'Licenses/Sales/Application/Lifetime C');
    isLifetimeSection = isLifetimeSection || (appTypeString == 'Licenses/Sales/Application/Sporting C');

    var isTrapSection = (appTypeString == 'Licenses/Sales/Application/Trapping');
    isTrapSection = isTrapSection || (appTypeString == 'Licenses/Sales/Application/Sporting');
    isTrapSection = isTrapSection || (appTypeString == 'Licenses/Sales/Application/Trapping C');
    isTrapSection = isTrapSection || (appTypeString == 'Licenses/Sales/Application/Sporting C');

    if (isFishSection) {
        frm.SetSelected(LIC02_MARINE_REGISTRY, (AInfo["Marine Registry"] == "CHECKED"), 1);
        frm.SetSelected(LIC03_ONE_DAY_FISHING_LICENSE, (AInfo["One Day Fishing License"] == "CHECKED"), 1);
        frm.SetSelected(LIC26_SEVEN_DAY_FISHING_LICENSE, (AInfo["Seven Day Fishing License"] == "CHECKED"), 1);
        frm.SetSelected(LIC22_FRESHWATER_FISHING, (AInfo["Freshwater Fishing"] == "CHECKED"), 1);
        //3-5 Year
        //frm.SetSelected(LIC66_FRESHWATER_FISHING_3Y, (AInfo["3 Year Freshwater Fishing"] == "CHECKED"), 1);
        //frm.SetSelected(LIC67_FRESHWATER_FISHING_5Y, (AInfo["5 Year Freshwater Fishing"] == "CHECKED"), 1);
    }
    if (isHuntSection) {
        frm.SetSelected(LIC04_BOWHUNTING_PRIVILEGE, (AInfo["Bowhunting Privilege"] == "CHECKED"), 1);
        //3-5 Year
        //frm.SetSelected(LIC60_BOWHUNTING_PRIVILEGE_3Y, (AInfo["3 Year Bowhunting Privilege"] == "CHECKED"), 1);
        //frm.SetSelected(LIC61_BOWHUNTING_PRIVILEGE_5Y, (AInfo["5 Year Bowhunting Privilege"] == "CHECKED"), 1);
        frm.SetSelected(LIC05_DEER_MANAGEMENT_PERMIT, (AInfo["Deer Management Permit"] == "CHECKED"), 1);
        frm.SetSelected(LIC06_HUNTING_LICENSE, (AInfo["Hunting License"] == "CHECKED"), 1);
        //3-5 Year
        //frm.SetSelected(LIC58_HUNTING_LICENSE_3Y, (AInfo["3 Year Hunting License"] == "CHECKED"), 1);
        //frm.SetSelected(LIC59_HUNTING_LICENSE_5Y, (AInfo["5 Year Hunting License"] == "CHECKED"), 1);
        frm.SetSelected(LIC07_MUZZLELOADING_PRIVILEGE, (AInfo["Muzzleloading Privilege"] == "CHECKED"), 1);
        //3-5 Year
        //frm.SetSelected(LIC62_MUZZLELOADING_PRIVILEGE_3Y, (AInfo["3 Year Muzzleloading Privilege"] == "CHECKED"), 1);
        //frm.SetSelected(LIC63_MUZZLELOADING_PRIVILEGE_5Y, (AInfo["5 Year Muzzleloading Privilege"] == "CHECKED"), 1);
        frm.SetSelected(LIC08_TURKEY_PERMIT, (AInfo["Turkey Permit"] == "CHECKED"), 1);
        //3-5 Year
        //frm.SetSelected(LIC68_TURKEY_PERMIT_3Y, (AInfo["3 Year Turkey Permit"] == "CHECKED"), 1);
        //frm.SetSelected(LIC69_TURKEY_PERMIT_5Y, (AInfo["5 Year Turkey Permit"] == "CHECKED"), 1);
    }
    if (isLifetimeSection) {
        frm.SetSelected(LIC10_LIFETIME_FISHING, (AInfo["Lifetime Fishing"] == "CHECKED"), 1);
        frm.SetSelected(LIC13_LIFETIME_SPORTSMAN, (AInfo["Lifetime Sportsman"] == "CHECKED"), 1);
        frm.SetSelected(LIC12_LIFETIME_SMALL_AND_BIG_GAME, (AInfo["Lifetime Small & Big Game"] == "CHECKED"), 1);
        frm.SetSelected(LIC11_LIFETIME_MUZZLELOADING, (AInfo["Lifetime Muzzleloading"] == "CHECKED"), 1);
        frm.SetSelected(LIC09_LIFETIME_BOWHUNTING, (AInfo["Lifetime Bowhunting"] == "CHECKED"), 1);
        frm.SetSelected(LIC14_LIFETIME_TRAPPING, (AInfo["Lifetime Trapping"] == "CHECKED"), 1);
        frm.SetSelected(LIC45_LIFETIME_INSCRIPTION, (AInfo["Lifetime Inscription"] == "CHECKED"), 1);
        frm.SetSelected(LIC56_TAG_DRIV_LIC_IMM, (AInfo["Add Lifetime to Driver License Re-Issue Immediately"] == "CHECKED"), 1);
        frm.SetSelected(LIC57_TAG_DRIV_LIC_REN, (AInfo["Add Lifetime to Driver License on Renewal"] == "CHECKED"), 1);
    }
    if (isTrapSection) {
        frm.SetSelected(LIC15_TRAPPING_LICENSE, (AInfo["Trapping License"] == "CHECKED"), 1);
        //3-5 Year
        //frm.SetSelected(LIC64_TRAPPING_LICENSE_3Y, (AInfo["3 Year Trapping License"] == "CHECKED"), 1);
        //frm.SetSelected(LIC65_TRAPPING_LICENSE_5Y, (AInfo["5 Year Trapping License"] == "CHECKED"), 1);
    }
    var isBuySporting = (appTypeString == 'Licenses/Sales/Application/Sporting');
    isBuySporting = isBuySporting || (appTypeString == 'Licenses/Sales/Application/Sporting C');
    if (isBuySporting) {
        frm.SetSelected(LIC16_HABITAT_ACCESS_STAMP, (AInfo["Habitat/Access Stamp"] == "CHECKED"), 1);
        frm.SetSelected(LIC17_VENISON_DONATION, (AInfo["Venison Donation"] == "CHECKED"), 1);
        frm.SetSelected(LIC18_CONSERVATION_FUND, (AInfo["Conservation Fund"] == "CHECKED"), 1);
        frm.SetSelected(LIC19_TRAIL_SUPPORTER_PATCH, (AInfo["Trail Supporter Patch"] == "CHECKED"), 1);
        frm.SetSelected(LIC20_CONSERVATIONIST_MAGAZINE, (AInfo["Conservationist Magazine"] == "CHECKED"), 1);
        frm.SetSelected(LIC21_CONSERVATION_PATRON, (AInfo["Conservation Patron"] == "CHECKED"), 1);
        frm.SetSelected(LIC43_LIFETIME_CARD_REPLACE, (AInfo["Lifetime Card Replace"] == "CHECKED"), 1);
        frm.SetSelected(LIC44_SPORTSMAN_ED_CERTIFICATION, (AInfo["Sportsman Ed Certification"] == "CHECKED"), 1);
    }
    frm.ExecuteBoRuleEngine();
    logDebug("EXIT: SetExpressformForSelectedLics");
}
//ACA ONSUBMIT Before
function isValidBuyExpressRecord(pStep) {
    logDebug("ENTER: isValidBuyExpressRecord");
    var retMsg = '';
    var msg = '';
    if (pStep == 'Step1') {
        msg = verifyAnyExpressSalesSelect();
        retMsg += msg;
        if (appTypeString == 'Licenses/Sales/Application/Fishing' || appTypeString == 'Licenses/Sales/Application/Hunting and Fishing' || appTypeString == 'Licenses/Sales/Application/Sporting' || appTypeString == 'Licenses/Sales/Application/Marine Registry' || appTypeString == 'Licenses/Sales/Application/Fishing C' || appTypeString == 'Licenses/Sales/Application/Hunting and Fishing C' || appTypeString == 'Licenses/Sales/Application/Sporting C' || appTypeString == 'Licenses/Sales/Application/Marine Registry C') {
            logDebug("call validateFishingdates()...");
            msg = validateFishingdates();
            retMsg += msg;
        }
        if (appTypeString == 'Licenses/Sales/Application/Hunting' || appTypeString == 'Licenses/Sales/Application/Hunting and Fishing' || appTypeString == 'Licenses/Sales/Application/Sporting' || appTypeString == 'Licenses/Sales/Application/Hunting C' || appTypeString == 'Licenses/Sales/Application/Hunting and Fishing C' || appTypeString == 'Licenses/Sales/Application/Sporting C') {
            msg = verifyDMPinfo();
            if (msg != '') {
                retMsg += msg;
            }
            logDebug("call verifyLandOwnerInfo()...");
            msg = verifyLandOwnerInfo();
            if (msg != '') {
                retMsg += msg;
            }
        }
        if (appTypeString == 'Licenses/Sales/Application/Sporting' || appTypeString == 'Licenses/Sales/Application/Sporting C') {
            logDebug("Check ASI fields for valid numeric value...");
            if (!isValidIntegerNumber(AInfo["Quantity Trail Supporter Patch"])) {
                retMsg += 'Please enter valid integer number for Quantity Trail Supporter Patch.';
                retMsg += "<Br />";
            }
            if (!isValidIntegerNumber(AInfo["Quantity Habitat/Access Stamp"])) {
                retMsg += 'Please enter valid integer number for Quantity Habitat/Access Stamp.';
                retMsg += "<Br />";
            }
            if (!isValidIntegerNumber(AInfo["Quantity Venison Donation"])) {
                retMsg += 'Please enter valid integer number for Quantity Venison Donation.';
                retMsg += "<Br />";
            }
            if (!isValidIntegerNumber(AInfo["Quantity Conservation Patron"])) {
                retMsg += 'Please enter valid integer number for Quantity Conservation Patron.';
                retMsg += "<Br />";
            }
            if (!isValidIntegerNumber(AInfo["Quantity Conservation Fund"])) {
                retMsg += 'Please enter valid integer number for Quantity Conservation Fund.';
                retMsg += "<Br />";
            }
        }
    }
    logDebug("Exit: isValidBuyExpressRecord");
    return retMsg;
}

function verifyAnyExpressSalesSelect() {
    var retMsg = ''
    var isChecked = false;
    if (appTypeString == 'Licenses/Sales/Application/Hunting' || appTypeString == 'Licenses/Sales/Application/Hunting and Fishing' || appTypeString == 'Licenses/Sales/Application/Sporting' || appTypeString == 'Licenses/Sales/Application/Hunting C' || appTypeString == 'Licenses/Sales/Application/Hunting and Fishing C' || appTypeString == 'Licenses/Sales/Application/Sporting C') {
        isChecked = isChecked || (AInfo["Bowhunting Privilege"] == "CHECKED");
        //3-5 Year
        //isChecked = isChecked || (AInfo["3 Year Bowhunting Privilege"] == "CHECKED");
        //isChecked = isChecked || (AInfo["5 Year Bowhunting Privilege"] == "CHECKED");
        isChecked = isChecked || (AInfo["Deer Management Permit"] == "CHECKED");
        isChecked = isChecked || (AInfo["Hunting License"] == "CHECKED");
        //3-5 Year
        //isChecked = isChecked || (AInfo["3 Year Hunting License"] == "CHECKED");
        //isChecked = isChecked || (AInfo["5 Year Hunting License"] == "CHECKED");
        isChecked = isChecked || (AInfo["Muzzleloading Privilege"] == "CHECKED");
        //3-5 Year
        //isChecked = isChecked || (AInfo["3 Year Muzzleloading Privilege"] == "CHECKED");
        //isChecked = isChecked || (AInfo["5 Year Muzzleloading Privilege"] == "CHECKED");
        isChecked = isChecked || (AInfo["Turkey Permit"] == "CHECKED");
        //3-5 Year
        //isChecked = isChecked || (AInfo["3 Year Turkey Permit"] == "CHECKED");
        //isChecked = isChecked || (AInfo["5 Year Turkey Permit"] == "CHECKED");
    }
    if (appTypeString == 'Licenses/Sales/Application/Trapping' || appTypeString == 'Licenses/Sales/Application/Sporting' || appTypeString == 'Licenses/Sales/Application/Trapping C' || appTypeString == 'Licenses/Sales/Application/Sporting C') {
        isChecked = isChecked || (AInfo["Trapping License"] == "CHECKED");
        //3-5 Year
        //isChecked = isChecked || (AInfo["3 Year Trapping License"] == "CHECKED");
        //isChecked = isChecked || (AInfo["5 Year Trapping License"] == "CHECKED");
    }

    if (appTypeString == 'Licenses/Sales/Application/Fishing' || appTypeString == 'Licenses/Sales/Application/Hunting and Fishing' || appTypeString == 'Licenses/Sales/Application/Sporting' || appTypeString == 'Licenses/Sales/Application/Marine Registry' || appTypeString == 'Licenses/Sales/Application/Fishing C' || appTypeString == 'Licenses/Sales/Application/Hunting and Fishing C' || appTypeString == 'Licenses/Sales/Application/Sporting C' || appTypeString == 'Licenses/Sales/Application/Marine Registry C') {
        isChecked = isChecked || (AInfo["Freshwater Fishing"] == "CHECKED");
        isChecked = isChecked || (AInfo["One Day Fishing License"] == "CHECKED");
        isChecked = isChecked || (AInfo["Seven Day Fishing License"] == "CHECKED");
        isChecked = isChecked || (AInfo["Marine Registry"] == "CHECKED");
        //3-5 Year
        //isChecked = isChecked || (AInfo["3 Year Freshwater Fishing"] == "CHECKED");
        //isChecked = isChecked || (AInfo["5 Year Freshwater Fishing"] == "CHECKED");
    }
    if (appTypeString == 'Licenses/Sales/Application/Lifetime' || appTypeString == 'Licenses/Sales/Application/Sporting' || appTypeString == 'Licenses/Sales/Application/Lifetime C' || appTypeString == 'Licenses/Sales/Application/Sporting C') {
        isChecked = isChecked || (AInfo["Lifetime Bowhunting"] == "CHECKED");
        isChecked = isChecked || (AInfo["Lifetime Fishing"] == "CHECKED");
        isChecked = isChecked || (AInfo["Lifetime Muzzleloading"] == "CHECKED");
        isChecked = isChecked || (AInfo["Lifetime Small & Big Game"] == "CHECKED");
        isChecked = isChecked || (AInfo["Lifetime Sportsman"] == "CHECKED");
        isChecked = isChecked || (AInfo["Lifetime Trapping"] == "CHECKED");
        isChecked = isChecked || (AInfo["Lifetime Inscription"] == "CHECKED");
        isChecked = isChecked || (AInfo["Add Lifetime to Driver License Re-Issue Immediately"] == "CHECKED");
        isChecked = isChecked || (AInfo["Add Lifetime to Driver License on Renewal"] == "CHECKED");
    }
    if (appTypeString == 'Licenses/Sales/Application/Sporting' || appTypeString == 'Licenses/Sales/Application/Sporting C') {
        isChecked = isChecked || (AInfo["Habitat/Access Stamp"] == "CHECKED");
        isChecked = isChecked || (AInfo["Venison Donation"] == "CHECKED");
        isChecked = isChecked || (AInfo["Conservation Fund"] == "CHECKED");
        isChecked = isChecked || (AInfo["Trail Supporter Patch"] == "CHECKED");
        isChecked = isChecked || (AInfo["Conservationist Magazine"] == "CHECKED");
        isChecked = isChecked || (AInfo["Conservation Patron"] == "CHECKED");
        isChecked = isChecked || (AInfo["Lifetime Card Replace"] == "CHECKED");
        isChecked = isChecked || (AInfo["Sportsman Ed Certification"] == "CHECKED");
    }
    if (!isChecked) {
        retMsg += "Please select sales item.";
        retMsg += "<Br />";
    }
    return retMsg;

}
//End-All express record types for ASI_FISH,ASI_HUNT,ASI_LT and ASI_TRAP
//Transfer
function isValidUserForTransferLifetimeLicense(userId) {
    var isvalid = false;

    var uObj;
    if (arguments.length > 0) {
        uObj = new USEROBJ();
        uObj.userId = userId;
        uObj.userModel = uObj.getUserModel();
        uObj.setUserModelAttributes();
    } else {
        uObj = new USEROBJ(publicUserID);
    }
    isvalid = (uObj.acctType == 'CITIZEN');

    if (!isvalid) {
        var salesAgentInfoArray = getAgentInfo(uObj.publicUserID, uObj);
        if (salesAgentInfoArray != null) {
            isvalid = (salesAgentInfoArray["Agent Group"] == "NYSDEC HQ");
        }
    }
    return isvalid;
}
function getPeopleByDecID(decId) {
    var peopResult = null;
    var vError = null;
    try {
        var qryPeople = aa.people.createPeopleModel().getOutput().getPeopleModel();
        qryPeople.setPassportNumber(decId);

        var r = aa.people.getPeopleByPeopleModel(qryPeople);
        if (r.getSuccess()) {
            peopResult = r.getOutput();
            if (peopResult.length == 0) {
                logDebug("Searched for REF contact, no matches found, returing null");
                peopResult = null;
            } else {
                peopResult = peopResult[0];
            }
        }
    }
    catch (vError) {
        logDebug("Runtime error occurred: " + vError);
    }
    return peopResult;
}
//ACA ONLOAD TRANSFER
function isVerifyTransferLifetimeLicense() {
    logDebug("ENTER: isVerifyNYDECHQUser");
    var isNotValidToProceed = '';

    if (publicUser) {
        var publicUserID = "" + aa.env.getValue("CurrentUserID");
        if (publicUserID.length > 0) {
            var pUserSeqNum = aa.util.parseLong(publicUserID.substr(10, publicUserID.length - 1));
            var s_publicUserResult = aa.publicUser.getPublicUser(pUserSeqNum);
            if (s_publicUserResult.getSuccess()) {
                var pUserObj = s_publicUserResult.getOutput();
                if (pUserObj.getAccountType() == "CITIZEN") {
                    MSG_SUSPENSION = "Customer privileges are suspended and licenses are not available for purchase. This issue can only be resolved by contacting DEC Law Enforcement during business hours at 518-402-8821.";
                }
            }
        }
    }
    var isValidUser = isValidUserForTransferLifetimeLicense();
    if (!isValidUser) {
        var exMsg = "Not Valid NY DEC HQ User for Transfer Lifetime License";
        if (isNotValidToProceed) {
            isNotValidToProceed += '<br />';
            isNotValidToProceed += exMsg;
        }
        else {
            isNotValidToProceed = exMsg;
        }
    }



    var xArray = getApplicantArrayEx();
    var peopleSequenceNumber = null;
    var deceasedDate = null;

    for (ca in xArray) {
        var thisContact = xArray[ca];
        peopleSequenceNumber = thisContact["refcontactSeqNumber"]
        if (peopleSequenceNumber != null) {
            var peopleModel = getOutput(aa.people.getPeople(peopleSequenceNumber), "");
            deceasedDate = peopleModel.getDeceasedDate();
            //Copy All Asi Fields: asumption is identical subgroups are available in cap ASI
            //var subGroupArray = getTemplateValueByFormArrays(peopleModel.getTemplate(), null, null);
            //GetAllASI(subGroupArray);

            var availableActiveItems = getActiveHoldings(peopleSequenceNumber);
            var verifyLicArray = new Array();
            verifyLicArray.push(AA09_LIFETIME_BOWHUNTING);
            verifyLicArray.push(AA10_LIFETIME_FISHING);
            verifyLicArray.push(AA11_LIFETIME_MUZZLELOADING);
            verifyLicArray.push(AA12_LIFETIME_SMALL_AND_BIG_GAME);
            verifyLicArray.push(AA13_LIFETIME_SPORTSMAN);
            verifyLicArray.push(AA14_LIFETIME_TRAPPING);

            var isAvailableLT = false;
            for (var tidx in availableActiveItems) {
                var tObj = availableActiveItems[tidx];
                if (exists(tObj.RecordType, verifyLicArray)) {
                    isAvailableLT = true;
                    break;
                }
            }

            var txfrmsg = '';
            if (deceasedDate) {
                if (!isAvailableLT) {
                    txfrmsg += "User does not have Lifetime License";
                    txfrmsg += " so cannot continue Transfer.";
                }
            } else {
                if (!isAvailableLT) {
                    txfrmsg += "User does not have Lifetime License";
                    txfrmsg += " and/or ";
                    txfrmsg += " the selected Applicant is not deceased";
                } else {
                    txfrmsg += "The selected Applicant is not deceased";
                    txfrmsg += ", so cannot continue Transfer.";
                }
            }
            if (txfrmsg != '') {
                if (isNotValidToProceed) {
                    isNotValidToProceed += "<Br />";
                    isNotValidToProceed += txfrmsg;
                }
                else {
                    isNotValidToProceed = txfrmsg;
                }
            }
        }
        var contactCondArray = getContactCondutions(peopleSequenceNumber);
        if (isSuspension(contactCondArray)) {
            if (isNotValidToProceed) {
                isNotValidToProceed += '<br />';
                isNotValidToProceed += MSG_SUSPENSION;
            }
            else {
                isNotValidToProceed = MSG_SUSPENSION;
            }
        }
        break;
    }

    logDebug("EXIT: isVerifyNYDECHQUser");
    if (isNotValidToProceed == '') {
        isNotValidToProceed = false;
    }
    return isNotValidToProceed;
}
function addFeeAndSetAsitForTransferlifetime() {
    logDebug("ENTER: addFeeAndSetAsitForTransferlifetime");

    var selDocToTransfer = new Array();
    if ((typeof (LICENSESTOTRANSFER) == "object")) {
        for (y in LICENSESTOTRANSFER) {
            var isSelected = (LICENSESTOTRANSFER[y]["Select"] == 'Yes' || LICENSESTOTRANSFER[y]["Select"] == 'Y');
            if (isSelected) {
                selDocToTransfer.push(LICENSESTOTRANSFER[y]["Document ID"]);
            }
        }
    }

    removeAllFees(capId);
    addFeeWithVersion("FEE_TRANS_1", "FEE_TRANSFER_SCHDL", 1, "FINAL", (selDocToTransfer.length + ""), "N");
    logDebug("EXIT: addFeeAndSetAsitForTransferlifetime");
}
//ACA ONSUBMIT BEFORE TRANSFER
function isVerifyLifetimeLicense(pStep) {

    logDebug("ENTER: isVerifyLifetimeLicense");
    var retMsg = '';
    var isAvailableLT = false;

    //Verify Transfer Lifetime License To    
    var decId = AInfo["Transfer Lifetime License To"];
    var isExitUser = isValidDecIdForTansfer(decId);
    if (!isExitUser) {
        retMsg += "Customer ID to which transfering lifetime license(s) is not exit or is deceased.";
        retMsg += "<Br />";
    }
    //Started-Checking Transfer ID should not be equal to Applicant.
    var customerId = AInfo["Transfer Lifetime License To"];
    var xArray = getApplicantArrayEx();
    var peopleSequenceNumber = null;
    for (ca in xArray) {
        var thisContact = xArray[ca];
        peopleSequenceNumber = thisContact["refcontactSeqNumber"]
        if (peopleSequenceNumber != null && customerId != null) {
            if (customerId == peopleSequenceNumber) {
                retMsg += "Transfer ID to should not be equal to Applicant ID.";
                retMsg += "<Br />";
            }
            break;
        }
    }
    //Ended -Checking Transfer ID should not be equal to Applicant.
    //Verify any lifetime licenses
    var isAvailableLT = false;
    if ((typeof (ACTIVEHOLDINGS) == "object")) {
        var verifyLicArray = new Array();
        verifyLicArray.push(AA09_LIFETIME_BOWHUNTING);
        verifyLicArray.push(AA10_LIFETIME_FISHING);
        verifyLicArray.push(AA11_LIFETIME_MUZZLELOADING);
        verifyLicArray.push(AA12_LIFETIME_SMALL_AND_BIG_GAME);
        verifyLicArray.push(AA13_LIFETIME_SPORTSMAN);
        verifyLicArray.push(AA14_LIFETIME_TRAPPING);
        for (y in ACTIVEHOLDINGS) {
            logDebug(ACTIVEHOLDINGS[y]["RecordType"])
            if (exists(ACTIVEHOLDINGS[y]["RecordType"], verifyLicArray)) {
                isAvailableLT = true;
                break;
            }
        }
    }
    if (!isAvailableLT) {
        retMsg += "User do not have lifetime licenses";
        retMsg += "<Br />";
    }

    var isSelected = false;
    var hasLTBasePriv = false;
    var hasSelectedLTPriv = false;
    if ((typeof (LICENSESTOTRANSFER) == "object")) {
        for (y in LICENSESTOTRANSFER) {
            isSelected = isSelected || (LICENSESTOTRANSFER[y]["Select"] == 'Yes' || LICENSESTOTRANSFER[y]["Select"] == 'Y');

            if (LICENSESTOTRANSFER[y]["Select"] == 'Yes' || LICENSESTOTRANSFER[y]["Select"] == 'Y') {
                hasLTBasePriv = hasLTBasePriv || (LICENSESTOTRANSFER[y]["RecordType"] == AA12_LIFETIME_SMALL_AND_BIG_GAME);
                hasLTBasePriv = hasLTBasePriv || (LICENSESTOTRANSFER[y]["RecordType"] == AA13_LIFETIME_SPORTSMAN);

                hasSelectedLTPriv = hasSelectedLTPriv || (LICENSESTOTRANSFER[y]["RecordType"] == AA09_LIFETIME_BOWHUNTING);
                hasSelectedLTPriv = hasSelectedLTPriv || (LICENSESTOTRANSFER[y]["RecordType"] == AA11_LIFETIME_MUZZLELOADING);
            }
        }
    }
    if (!isSelected) {
        retMsg += 'Please select licenses to upgrade.';
        retMsg += '<Br />';
    } else if (!hasLTBasePriv && hasSelectedLTPriv) {
        var hasLTBasePriv = hasLifetimeBase(decId);
        if (!hasLTBasePriv) {
            retMsg += 'Customer ID to which transfering lifetime license(s) does not have lifetime base privilage.';
            retMsg += '<Br />';
        }
    }

    logDebug("EXIT: isVerifyLifetimeLicense");
    return retMsg;
}
function transferLifetimeLicenses() {
    logDebug("ENTER: transferLifetimeLicenses");
    try {

        var txfrCustomerId = AInfo["Transfer Lifetime License To"];

        var selDocToVoid = new Array();
        /*//This is not required
        if ((typeof (ACTIVEDOCUMENTS) == "object")) {
        var verifyLicArray = new Array();
        verifyLicArray.push(AA09_LIFETIME_BOWHUNTING);
        verifyLicArray.push(AA10_LIFETIME_FISHING);
        verifyLicArray.push(AA11_LIFETIME_MUZZLELOADING);
        verifyLicArray.push(AA12_LIFETIME_SMALL_AND_BIG_GAME);
        verifyLicArray.push(AA13_LIFETIME_SPORTSMAN);
        verifyLicArray.push(AA14_LIFETIME_TRAPPING);

        for (y in ACTIVEDOCUMENTS) {
        if (exists(ACTIVEDOCUMENTS[y]["RecordType"], verifyLicArray)) {
        //DO Nothing
        }
        else {
        selDocToVoid.push(ACTIVEDOCUMENTS[y]["Document ID"]);
        }
        }
        }
        */

        var selDocToTransfer = new Array();
        if ((typeof (LICENSESTOTRANSFER) == "object")) {
            for (y in LICENSESTOTRANSFER) {
                var isSelected = (LICENSESTOTRANSFER[y]["Select"] == 'Yes' || LICENSESTOTRANSFER[y]["Select"] == 'Y');
                if (isSelected) {
                    selDocToTransfer.push(LICENSESTOTRANSFER[y]["Document ID"]);
                }
            }
        }

        //Get the current DEC AGENT Public User as object and attach to the new record
        var uObj = new USEROBJ(publicUserID);
        salesAgentInfoArray = getAgentInfo(publicUserID, uObj);
        attachAgent(uObj);

        attachedContacts(txfrCustomerId);

        var custDob = null;
        var peopMd = getPeopleByDecID(txfrCustomerId);
        var peopleSequenceNumber = peopMd.getContactSeqNumber();
        var peopleModel = getOutput(aa.people.getPeople(peopleSequenceNumber), "");
        if (peopleModel != null) {
            if (peopleModel.getBirthDate() != null) {
                var bda = peopleModel.getBirthDate().toString().split('-');
                custDob = new Date((peopleModel.getBirthDate().getMonth() + 1) + "/" + peopleModel.getBirthDate().getDate() + "/" + bda[0]);
            }
        }

        var arryLic = new Array();
        for (y in selDocToTransfer) {
            var itemCapId = getCapId(selDocToTransfer[y]);
            var newLicId = closeLTlicenseAndCreateNew(itemCapId, capId, custDob)
            if (newLicId) {
                arryLic.push(newLicId);
                var newAInfo = new Array();

                var c = getContactObj(newLicId, "Individual");
                if (c && c.refSeqNumber) {
                    c.remove();
                    newAInfo.push(new NewLicDef("Source Document ID", selDocToTransfer[y]));
                    newAInfo.push(new NewLicDef("Source Customer ID", c.refSeqNumber));
                }
                attachedContacts(txfrCustomerId, newLicId);

                copyLicASI(newLicId, newAInfo);
            }
        }
        for (y in selDocToVoid) {
            var itemCapId = getCapId(selDocToVoid[y]);
            voidRec(itemCapId);
        }

        distributeFeesForTransfer(capId, arryLic, salesAgentInfoArray);
		
		//Build Tags to mail out will be print in nightly job
		var vToday = new Date();
		vToday.setHours(0);
		vToday.setMinutes(0);
		vToday.setSeconds(0);
		rebuildAllTagsforaRefContact(txfrCustomerId, vToday);

    }
    catch (err) {
        logDebug("**ERROR in transferLifetimeLicenses:" + err.message);
    }
    logDebug("EXIT: transferLifetimeLicenses");
}
function createTransferLicTable() {
    logDebug("ENTER: createUpgradeLicTable");
    var xArray = getApplicantArrayEx();
    var peopleSequenceNumber = null;
    for (ca in xArray) {
        var thisContact = xArray[ca];
        peopleSequenceNumber = thisContact["refcontactSeqNumber"]
        if (peopleSequenceNumber != null) {
            var asitModel;
            var new_asit;

            //if (!(typeof (LICENSESTOTRANSFER) == "object")) {
            var availableItems = GetLicsForTransfer(peopleSequenceNumber);
            var newAsitArray = GetLicesesTotransferAsitTableArray(availableItems);

            asitModel = cap.getAppSpecificTableGroupModel();
            new_asit = addASITable4ACAPageFlow(asitModel, "LICENSES TO TRANSFER", newAsitArray);
            //}
        }
        break;
    }
    logDebug("EXIT: createUpgradeLicTable");
}
function GetLicsForTransfer(peopleSequenceNumber) {
    logDebug("ENTER: GetLicsForTransfer");
    var availableActiveItems = new Array();
    var validActiveholdingsArray = new Array();
    validActiveholdingsArray.push(AA09_LIFETIME_BOWHUNTING);
    validActiveholdingsArray.push(AA10_LIFETIME_FISHING);
    validActiveholdingsArray.push(AA11_LIFETIME_MUZZLELOADING);
    validActiveholdingsArray.push(AA12_LIFETIME_SMALL_AND_BIG_GAME);
    validActiveholdingsArray.push(AA13_LIFETIME_SPORTSMAN);
    validActiveholdingsArray.push(AA14_LIFETIME_TRAPPING);

    var CC = new contactObj(null);
    CC.refSeqNumber = peopleSequenceNumber;
    var allContactCaps = CC.getCaps("Licenses/Lifetime/*/*");

    for (var ccp in allContactCaps) {
        var itemCapId = allContactCaps[ccp];
        var itemCap = aa.cap.getCap(itemCapId).getOutput();
        appTypeResult = itemCap.getCapType();
        appTypeString = appTypeResult.toString();
        if (exists(appTypeString, validActiveholdingsArray)) {
            var newActiveTag = new ACTIVE_ITEM(itemCapId, itemCap, appTypeString);
            if (newActiveTag.isActive()) {
                availableActiveItems.push(newActiveTag);
            }
        }
    }
    logDebug("EXIT: GetLicsForTransfer");

    return availableActiveItems;
}
function GetLicesesTotransferAsitTableArray(availableItems) {
    logDebug("ENTER: GetLicesesTotransferAsitTableArray");

    var readOnly = "N";
    var tempObject = new Array();
    var tempArray = new Array();

    for (var tidx in availableItems) {
        var tObj = availableItems[tidx];

        tempObject = new Array();
        var itemCode = (isNull(tObj.IsTag(), false) ? isNull(tObj.TagType, '') : isNull(tObj.ItemCode, ''));
        var fieldInfo = new asiTableValObj("Description", itemCode + ' ' + isNull(tObj.Description, ''), "Y");
        tempObject["Description"] = fieldInfo;
        fieldInfo = new asiTableValObj("Document ID", isNull(tObj.altId, ''), "Y");
        tempObject["Document ID"] = fieldInfo;
        fieldInfo = new asiTableValObj("License Year", isNull(tObj.LicenseYear, ''), "Y");
        tempObject["License Year"] = fieldInfo;
        fieldInfo = new asiTableValObj("Select", "N", "N");
        tempObject["Select"] = fieldInfo;
        fieldInfo = new asiTableValObj("RecordType", tObj.RecordType, "Y");
        tempObject["RecordType"] = fieldInfo;

        tempArray.push(tempObject);  // end of record
    }
    logDebug("EXIT: GetLicesesTotransferAsitTableArray");

    return tempArray;
}
function hasLifetimeBase(peopleSequenceNumber) {
    var isValid = false;

    var availableActiveItems = getActiveHoldings(peopleSequenceNumber, AInfo["License Year"]);
    var verifyLicArray = new Array();
    verifyLicArray.push(AA12_LIFETIME_SMALL_AND_BIG_GAME);
    verifyLicArray.push(AA13_LIFETIME_SPORTSMAN);

    for (var tidx in availableActiveItems) {
        var tObj = availableActiveItems[tidx];
        if (exists(tObj.RecordType, verifyLicArray)) {
            isValid = true;
            break;
        }
    }
    return isValid;
}
function isValidDecIdForTansfer(decId) {
    var isValid = false;
    try {
        if (decId != '') {
            var peopMd = getPeopleByDecID(decId);
            var peopleSequenceNumber = peopMd.getContactSeqNumber();
            var peopleModel = getOutput(aa.people.getPeople(peopleSequenceNumber), "");
            if (peopleModel != null) {
                isValid = true;
                var deceasedDate = peopleModel.getDeceasedDate();
                if (deceasedDate) {
                    isValid = false;
                }
            }
        }
    }
    catch (err) {
        logDebug("**WARNING in isValidDecIdForTansfer:" + err.message);
    }
    return isValid;
}
function closeLTlicenseAndCreateNew(itemCapId, parentCapId, custDob) {
    logDebug("ENTER: closeLTlicenseAndCreateNew " + itemCapId.getCustomID());
    var itemCap = aa.cap.getCap(itemCapId).getOutput();
    appTypeResult = itemCap.getCapType();
    appTypeString = appTypeResult.toString();
    var ats = appTypeString;
    var ata = ats.split("/");

    updateAppStatus("Closed", "Closed", itemCapId);
    closeTaskForRec("Void Document", "", "", "", "", itemCapId);
    closeTaskForRec("Report Game Harvest", "", "", "", "", itemCapId);
    closeTaskForRec("Revocation", "", "", "", "", itemCapId);
    closeTaskForRec("Suspension", "", "", "", "", itemCapId);

    // now create a new one, 
    var newLicId = createChildForDec(ata[0], ata[1], ata[2], ata[3], "", itemCapId);
    copyASIFields(itemCapId, newLicId);
    updateAppStatus("Active", "Active", newLicId);
    activateTaskForRec("Report Game Harvest", "", newLicId);
    activateTaskForRec("Void Document", "", newLicId);
    activateTaskForRec("Revocation", "", newLicId);
    activateTaskForRec("Suspension", "", newLicId);
    copyConditions(itemCapId, newLicId);

    //Keep same file Date for legacy privilages
    var openDt = itemCap.getFileDate();
    var effectiveDt = new Date(openDt.getMonth() + "/" + openDt.getDayOfMonth() + "/" + openDt.getYear());
    editFileDate(newLicId, jsDateToMMDDYYYY(effectiveDt));

    //copy the expiration information
    oldLicObj = new licenseObject(null, itemCapId);
    if (oldLicObj && oldLicObj != null) {
        setLicExpirationStatus(newLicId, "Active");

        var expDate = oldLicObj.b1ExpDate;
        if (custDob != null) {
            expDate = dateAddMonths(convertDate(custDob), (100 * 12));
        }
        var newExpDate = expDate;
        setLicExpirationDate(newLicId, null, newExpDate, null, true);
    }
    var newDecDocId = GenerateDocumentNumber(newLicId.getCustomID());
    updateDocumentNumber(newDecDocId, newLicId);

    var result = aa.cap.createAppHierarchy(capId, newLicId);
    logDebug("EXIT: voidDmpAndCreateNew");

    return newLicId;
}
function distributeFeesForTransfer(sourceCapId, arryLic, pSalesAgentInfoArray) {
    logDebug("ENTER: distributeFeesAndPayments");
    //logDebug("Elapsed Time: " + elapsed());

    //
    // Step 0: Make payment before distribution
    //
    //    logDebug("Step 0: Make payment before distribution");

    //    if (feeSeqList.length) {
    //        invoiceResult = aa.finance.createInvoice(capId, feeSeqList, paymentPeriodList);
    //        if (invoiceResult.getSuccess())
    //            logDebug("Invoicing assessed fee items is successful.");
    //        else
    //            logDebug("**ERROR: Invoicing the fee items assessed to app # " + capIDString + " was not successful.  Reason: " + invoiceResult.getErrorMessage());
    //    }


    //
    // Step 1: Unapply payments from the Source
    //
    logDebug("Step 1: Unapply payments from the Source");

    var piresult = aa.finance.getPaymentByCapID(capId, null).getOutput()

    var feeSeqArray = new Array();
    var invoiceNbrArray = new Array();
    var feeAllocationArray = new Array();

    for (ik in piresult) {
        var thisPay = piresult[ik];
        var pfResult = aa.finance.getPaymentFeeItems(capId, null);
        if (pfResult.getSuccess()) {
            var pfObj = pfResult.getOutput();
            for (ij in pfObj)
                if (pfObj[ij].getPaymentSeqNbr() == thisPay.getPaymentSeqNbr()) {
                    feeSeqArray.push(pfObj[ij].getFeeSeqNbr());
                    invoiceNbrArray.push(pfObj[ij].getInvoiceNbr());
                    feeAllocationArray.push(pfObj[ij].getFeeAllocation());
                }
        }


        if (feeSeqArray.length > 0) {
            z = aa.finance.applyRefund(capId, thisPay, feeSeqArray, invoiceNbrArray, feeAllocationArray, "FeeStat", "InvStat", "123");
            if (z.getSuccess())
                logDebug("Refund applied")
            else
                logDebug("Error applying refund " + z.getErrorMessage());
        }
    }

    //
    // Step 2: void from the source
    //
    logDebug("Step 2:  void from the source");

    feeA = loadFees()

    var feeCapMessage = "";
    var amtFeeTxfr = 0;
    var commissionCodeTxfr = '';
    for (x in feeA) {
        thisFee = feeA[x];
        logDebug("status is " + thisFee.status)
        if (thisFee.code == "FEE_TRANS_1") {
            amtFeeTxfr = thisFee.formula;
            commissionCodeTxfr = isNull(thisFee.accCodeL3, '');
        }
        if (thisFee.status == "INVOICED") {
            voidResult = aa.finance.voidFeeItem(capId, thisFee.sequence);
            if (voidResult.getSuccess()) {
                logDebug("Fee item " + thisFee.code + "(" + thisFee.sequence + ") has been voided")
            }
            else {
                logDebug("**ERROR: voiding fee item " + thisFee.code + "(" + thisFee.sequence + ") " + voidResult.getErrorMessage());
            }

            var feeSeqArray = new Array();
            var paymentPeriodArray = new Array();

            feeSeqArray.push(thisFee.sequence);
            paymentPeriodArray.push(thisFee.period);
            var invoiceResult_L = aa.finance.createInvoice(capId, feeSeqArray, paymentPeriodArray);

            if (!invoiceResult_L.getSuccess())
                logDebug("**ERROR: Invoicing the fee items voided " + feeCapMessage + " was not successful.  Reason: " + invoiceResult_L.getErrorMessage());
        }
    }

    //
    // Step 3: add the fees to the target and transfer the funds from Source to each Target cap
    //
    logDebug("Step 3: transfer the funds from Source to each Target cap");

    var perLicAmt = 0;
    if (arryLic.length && amtFeeTxfr > 0) {
        perLicAmt = (amtFeeTxfr / arryLic.length)
        perLicAmt = (Math.round(perLicAmt * 100) / 100);
    }

    var unapplied = paymentGetNotAppliedTot()

    //Distribution for licenses
    for (var item in arryLic) {
        var targetCapId = arryLic[item];

        var targetfeeSeq_L = new Array();    // invoicing fees
        var targetpaymentPeriod_L = new Array();   // invoicing pay period
        var feeSeqAndPeriodArray = new Array(); //return values for fees and period after added

        var amtAgentCharge = perLicAmt;
        if (item == arryLic.length - 1) {
            amtAgentCharge = amtFeeTxfr - (perLicAmt * (arryLic.length - 1));
            amtAgentCharge = (Math.round(amtAgentCharge * 100) / 100);
        }
        var cmnsPerc = GetCommissionByUser(commissionCodeTxfr + "", pSalesAgentInfoArray);

        var amtCommission = cmnsPerc == 0 ? 0 : (cmnsPerc * amtAgentCharge) / 100;
        amtCommission = (Math.round(amtCommission * 100) / 100);
        amtAgentCharge -= amtCommission;

        feeSeqAndPeriodArray = addFeeWithVersionAndReturnfeeSeq("AGENT_CHARGE", "FEE_TRANSFER_SCHDL", 1, "FINAL", amtAgentCharge, "Y", targetCapId)
        targetfeeSeq_L.push(feeSeqAndPeriodArray[0]);
        targetpaymentPeriod_L.push(feeSeqAndPeriodArray[1]);
        if (amtCommission > 0) {
            feeSeqAndPeriodArray = addFeeWithVersionAndReturnfeeSeq("COMMISSION", "FEE_TRANSFER_SCHDL", 1, "FINAL", amtCommission, "Y", targetCapId)
            targetfeeSeq_L.push(feeSeqAndPeriodArray[0]);
            targetpaymentPeriod_L.push(feeSeqAndPeriodArray[1]);
        }

        createInvoice(targetfeeSeq_L, targetpaymentPeriod_L, targetCapId);

        balanceDue = amtCommission + amtAgentCharge;

        //No need to check in dec case
        //balanceDue = parseFloat(parseFloat(targetfd.feeUnit) * parseFloat(targetfd.formula));
        //        if (unapplied < balanceDue) {
        //            logDebug("insufficient funds to do transfer from receipt record");
        //            return false;
        //        }

        var xferResult = aa.finance.makeFundTransfer(capId, targetCapId, currentUserID, "", "", sysDate, sysDate, "", sysDate, balanceDue, "NA", "Fund Transfer", "NA", "R", null, "", "NA", "");
        if (xferResult.getSuccess())
            logDebug("Successfully did fund transfer to : " + targetCapId.getCustomID());
        else
            logDebug("**ERROR: doing fund transfer to (" + targetCapId.getCustomID() + "): " + xferResult.getErrorMessage());

        //
        // Step 4: On the target, loop through payments then invoices to auto-apply
        //

        var piresult = aa.finance.getPaymentByCapID(targetCapId, null).getOutput()

        for (ik in piresult) {
            var feeSeqArray = new Array();
            var invoiceNbrArray = new Array();
            var feeAllocationArray = new Array();


            var thisPay = piresult[ik];
            var applyAmt = 0;
            var unallocatedAmt = thisPay.getAmountNotAllocated()

            if (unallocatedAmt > 0) {

                var invArray = aa.finance.getInvoiceByCapID(targetCapId, null).getOutput()

                for (var invCount in invArray) {
                    var thisInvoice = invArray[invCount];
                    var balDue = thisInvoice.getInvoiceModel().getBalanceDue();
                    if (balDue > 0) {
                        feeT = aa.invoice.getFeeItemInvoiceByInvoiceNbr(thisInvoice.getInvNbr()).getOutput();

                        for (targetFeeNum in feeT) {
                            var thisTFee = feeT[targetFeeNum];

                            if (thisTFee.getFee() > unallocatedAmt)
                                applyAmt = unallocatedAmt;
                            else
                                applyAmt = thisTFee.getFee()   // use balance here?

                            unallocatedAmt = unallocatedAmt - applyAmt;

                            feeSeqArray.push(thisTFee.getFeeSeqNbr());
                            invoiceNbrArray.push(thisInvoice.getInvNbr());
                            feeAllocationArray.push(applyAmt);
                        }
                    }
                }

                applyResult = aa.finance.applyPayment(targetCapId, thisPay, feeSeqArray, invoiceNbrArray, feeAllocationArray, "PAYSTAT", "INVSTAT", "123")

                if (applyResult.getSuccess())
                    logDebug("Successfully applied payment");
                else
                    logDebug("**ERROR: applying payment to fee (" + thisTFee.getFeeDescription() + "): " + applyResult.getErrorMessage());

            }
        }
    }

    //logDebug("Elapsed Time: " + elapsed());
    logDebug("EXIT: distributeFeesAndPayments");
}

function updateEffectiveDate() {
    logDebug("ENTER: updateEffectiveDate");
    try {
        var effectiveDt = AInfo["Effective Date"];
        var thisCap = capId;
        if (arguments.length == 1) {
            effectiveDt = arguments[0];
        }
        if (arguments.length == 2) {
            effectiveDt = arguments[0];
            thisCap = arguments[1];
        }

        var verifyLicArray = getValidLicToUpdateFileDate();
        if (exists(appTypeString, verifyLicArray)) {
            editFileDate(capId, effectiveDt);
            var clacFromDt = dateAdd(convertDate(effectiveDt), 0);
            setLicExpirationDate(capId, clacFromDt);
        }
        logDebug("EXIT: updateEffectiveDate");
    }
    catch (err) {
        logDebug("**ERROR in updateEffectiveDate:" + err.message);
    }
}

function createLegacyLoadLic() {
    logDebug("ENTER: createLegacyLoadLic");


    try {
        //Get Applicant information
        var peopleSequenceNumber = null;
        var contactSeqNumber = null;
        var custDob = null;

        //var capContact = getOutput(aa.people.getCapContactByCapID(capId));
        var xArray = getApplicantArrayEx(capId);
        for (ca in xArray) {
            var thisContact = xArray[ca];
            if (thisContact["contactType"] == "Individual") {
                contactSeqNumber = thisContact["contactSeqNumber"];
                break;
            }
        }
        //xArray = new Array();
        // JHS 10/9/2013 added test for null on contactSeqNumber
        var capContactArray = new Array();

        if (!contactSeqNumber) {
            logDebug("**WARNING createLegacyLoadLic could not fund an applicant/individual");
        }
        else {
            capContactArray = getOutput(aa.people.getCapContactByContactID(contactSeqNumber));
        }

        if (capContactArray) {
            for (yy in capContactArray) {
                //First One is always Applicant else check for contact type
                //var aArray = getApplicantInfoArray(capContactArray[yy], capId);
                //xArray.push(aArray);
                peopleSequenceNumber = capContactArray[yy].getCapContactModel().getRefContactNumber();
                var peopleModel = getOutput(aa.people.getPeople(peopleSequenceNumber), "");
                if (peopleModel != null) {
                    if (peopleModel.getBirthDate() != null) {
                        var bda = peopleModel.getBirthDate().toString().split('-');
                        custDob = new Date((peopleModel.getBirthDate().getMonth() + 1) + "/" + peopleModel.getBirthDate().getDate() + "/" + bda[0]);
                    }
                }
                break;
            }
        }

        if ((typeof (LICENSEINFORMATION) == "object")) {
            for (var y in LICENSEINFORMATION) {

                //loop through ASIT table and create licence record with respective record type
                var licType = LICENSEINFORMATION[y]["License Type"];

                if (licType == "Lifetime Bowhunting") {
                    recordType = "Licenses/Lifetime/Hunting/Bowhunting";
                }
                if (licType == "Lifetime Fishing") {
                    recordType = "Licenses/Lifetime/Fishing/Fishing License";
                }
                if (licType == "Lifetime Muzzleloading") {
                    recordType = "Licenses/Lifetime/Hunting/Muzzleloading";
                }
                if (licType == "Lifetime Small & Big Game") {
                    recordType = "Licenses/Lifetime/Hunting/Small & Big Game";
                }
                if (licType == "Lifetime Sportsman") {
                    recordType = "Licenses/Lifetime/Hunting/Sportsman";
                }
                if (licType == "Lifetime Trapping") {
                    recordType = "Licenses/Lifetime/Trapping/Trapping License";
                }

                var effectiveDt = LICENSEINFORMATION[y]["Effective Date"];
                var syear = LICENSEINFORMATION[y]["License Year"];
                var sYearDesc = "September 1, " + syear + " - August 31, " + (parseInt(syear, 10) + 1);
                var sNotes = LICENSEINFORMATION[y]["Notes"];

                var f = new form_OBJECT(GS2_SCRIPT, OPTZ_TYPE_ALLFEES);
                var seasonPeriod = GetLicenseSeasonPeriod();
                f.Year = seasonPeriod[0].getFullYear();
                f.IsNyResiDent = "Yes"; //logically is/was NYS resident
                f.DOB = jsDateToMMDDYYYY(custDob);

                f.ExecuteBoRuleEngine();

                var recArr = f.licObjARRAY;
                var ruleParams = f.getRulesParam();

                var decCode = "";
                var codeDescription = "";
                var feeschedule = "";
                for (var idx = 0; idx < recArr.length; idx++) {
                    var oLic = recArr[idx];
                    if (isNull(oLic.RecordType, '') == recordType) {
                        var newfd = getFeeCodeByRule(ruleParams, oLic.feeschedule, oLic.feeversion, oLic.FNfeeRule);
                        decCode = GetItemCode(newfd.Code3commission + "");
                        codeDescription = GetItemCodedesc(decCode);
                        feeschedule = oLic.feeschedule;
                        break;
                    }
                }

                var ata = recordType.split("/");
                var newLicId = issueSubLicense(ata[0], ata[1], ata[2], ata[3], "Active", capId);
                editAppName(codeDescription, newLicId);

                var newAInfo = new Array();
                newAInfo.push(new NewLicDef("Year", syear));
                newAInfo.push(new NewLicDef("Year Description", sYearDesc));
                newAInfo.push(new NewLicDef("Item Code", decCode));
                newAInfo.push(new NewLicDef("Quantity", "1"));
                newAInfo.push(new NewLicDef("Effective Date", effectiveDt));
                newAInfo.push(new NewLicDef("Notes", sNotes));
                copyLicASI(newLicId, newAInfo);

                var newDecDocId = GenerateDocumentNumber(newLicId.getCustomID(), "1004");
                updateDocumentNumber(newDecDocId, newLicId);

                editFileDate(newLicId, effectiveDt);

                //effectiveDt + 100Years
                var expDate = dateAddMonths(new Date(effectiveDt), (100 * 12));
                setLicExpirationDate(newLicId, "", expDate, null, true);

                //Add fee
                var feeCharge = LICENSEINFORMATION[y]["Fee"]
                addFeeWithVersion("AGENT_CHARGE", feeschedule, 1, "FINAL", feeCharge, "Y", newLicId);

                //Void Fee/Payment - No need
                //voidFeeForTransfer(newLicId);

                //To add payment for license added through Legacy Load. 
                //This payment will be used for upgrade lifetime functinality.
                makePaymentForLegacy(feeCharge, newLicId);

                //Build Tags to mail out will be print in nightly job
                updateDecID(peopleSequenceNumber)

                //Build Tags to mail out will be print in nightly job
                var vToday = new Date();
                vToday.setHours(0);
                vToday.setMinutes(0);
                vToday.setSeconds(0);
                rebuildAllTagsforaRefContact(peopleSequenceNumber, vToday);

                showMessage = true;
                var smsg = '';
                smsg += "<b><span style='color:red;'>";
                smsg += "DEC ID = " + peopleSequenceNumber;
                smsg += "<Br />";
                smsg += "Legacy Transaction Record ID = " + capId.getCustomID(); ;
                smsg += "<Br />";
                smsg += "</span></ b>";
                comment(smsg);
            }
        } else {
            logDebug("**ERROR in createLegacyLoadLic: No row ia table.");
        }
    }
    catch (err) {
        logDebug("**ERROR in createLegacyLoadLic:" + err.message);
    }
}
function voidFeeForTransfer(newLicId) {
    feeA = loadFees(newLicId)

    var feeCapMessage = "";
    for (x in feeA) {
        thisFee = feeA[x];
        logDebug("status is " + thisFee.status)
        if (thisFee.status == "INVOICED") {
            voidResult = aa.finance.voidFeeItem(newLicId, thisFee.sequence);
            if (voidResult.getSuccess()) {
                logDebug("Fee item " + thisFee.code + "(" + thisFee.sequence + ") has been voided")
            }
            else {
                logDebug("**ERROR: voiding fee item " + thisFee.code + "(" + thisFee.sequence + ") " + voidResult.getErrorMessage());
            }

            var feeSeqArray = new Array();
            var paymentPeriodArray = new Array();

            feeSeqArray.push(thisFee.sequence);
            paymentPeriodArray.push(thisFee.period);
            var invoiceResult_L = aa.finance.createInvoice(newLicId, feeSeqArray, paymentPeriodArray);

            if (!invoiceResult_L.getSuccess())
                logDebug("**ERROR: Invoicing the fee items voided " + feeCapMessage + " was not successful.  Reason: " + invoiceResult_L.getErrorMessage());
        }
    }
}
function getValidLicToUpdateFileDate() {
    var validRecTypeArray = new Array();     //   record types

    validRecTypeArray.push(AA09_LIFETIME_BOWHUNTING);
    validRecTypeArray.push(AA10_LIFETIME_FISHING);
    validRecTypeArray.push(AA11_LIFETIME_MUZZLELOADING);
    validRecTypeArray.push(AA12_LIFETIME_SMALL_AND_BIG_GAME);
    validRecTypeArray.push(AA13_LIFETIME_SPORTSMAN);
    validRecTypeArray.push(AA14_LIFETIME_TRAPPING);

    return validRecTypeArray;
}
function hasCurrentAffidavit(sAffidavitDate) {
    var retValue = true;
    if (isNull(sAffidavitDate, '')) {
        var dt = new Date(sAffidavitDate);
        var now = new Date();
        var yearDiff = now.getFullYear() - dt.getFullYear();
        retValue = (yearDiff <= 0);
    }
    return retValue;
}
function callWebServiceForANS(agentId) {
    try {
        if (agentId) {
            var sLink = lookup("DEC_CONFIG", "ANS_SERVICE");
            if (sLink) {
                var rs = aa.wsConsumer.consume(sLink, "regANS", ["DEC_ACH", agentId]);
                if (rs.getSuccess()) {
                    var resp = rs.getOutput();
                    logDebug("callWebServiceForANS: resp[0] = " + resp[0]);
                } else {
                    logDebug("callWebServiceForANS: web service call failed: " + rs.getErrorMessage());
                }
            }
        }
    }
    catch (vError) {
        logDebug("Runtime error occurred: " + vError);
    }
}
function verifyNewRegistrion() {
    var retmsg = '';
    var sdob = AInfo["Date of Birth"];
    var decid = AInfo["DECALS Customer Number"];
    var driverLicNumber = AInfo["Driver's License Number"];
    var decalRefNumber = "";
    var refContactId = "";

    if ((driverLicNumber == "" || driverLicNumber == null) && (decid == "" || decid == null)) {
        retmsg += "You have to either enter the combination of Date of Birth and Driver's License Number or Date of Birth and DEC Customer ID # to continue." + "<BR>";
    } else {

        var resultCount = searchCustomerBySql(sdob, driverLicNumber, decid);

        if (resultCount.length == 0) {
            retmsg += "No match is found for the given information. Please Register for a New Account using the link at the top of the page." + "<BR>";
        }
        if (resultCount.length == 1) {
            decalRefNumber = resultCount[0].sDecid;
            refContactId = resultCount[0].sRefConId;

            if (!decalRefNumber) {
                if (refContactId) {
                    decalRefNumber = refContactId;
                }
            }
            // validation to check public user id already exists with DEC ID
            var lDecalRefNumber = aa.util.parseLong(decalRefNumber);
            var publicUserListByContact = aa.publicUser.getPublicUserListByContactNBR(lDecalRefNumber);
            if (publicUserListByContact.getSuccess()) {
                var contactList = publicUserListByContact.getOutput();
                if (contactList.size() > 0) {
                    logDebug(contactList);
                    retmsg += "Public User Id already exists." + "<BR>";
                }
            }
            editAppSpecific4ACA("Internal Decid", decalRefNumber);
        }
        if (resultCount.length > 1) {
            retmsg += "Multiple match is found for the given information. Please enter your DEC Customer ID #." + "<BR>";
        }
        if (retmsg != '') {
            retmsg += '<Br />'
        }
    }
    return retmsg;
}
function searchCustomerBySql(birthDate, licNumber, decid) {
    var retArry = new Array();
    var counter = 0;
    var vError = '';
    var conn = null;
    var sStmt = null;
    var rSet = null;
    try {
        var sql = " Select G1_PASSPORT_NBR, G1_CONTACT_NBR from G3Contact ";
        sql += " WHERE SERV_PROV_CODE = '" + aa.getServiceProviderCode() + "' ";
        sql += " AND G1_CONTACT_TYPE  = 'Individual' ";
        if (isNull(licNumber, '') != '') {
            sql += " AND upper(G1_DRIVER_LICENSE_NBR) = upper('" + licNumber + "'" + ")";
        }
        if (isNull(birthDate, '') != '') {
            sql += " AND trunc(L1_BIRTH_DATE) = trunc(TO_dATE('" + birthDate + "', 'MM/DD/YYYY')) ";
        }
        if (decid != '' && decid != null) {
            sql += " AND G1_PASSPORT_NBR = '" + decid + "'";
        }
        sql += " AND rownum < 3";

        var initialContext = aa.proxyInvoker.newInstance("javax.naming.InitialContext", null).getOutput();
        var ds = initialContext.lookup("java:/AA");
        conn = ds.getConnection();

        sStmt = conn.prepareStatement(sql);
        rSet = sStmt.executeQuery();
        while (rSet.next()) {
            var sDecid = rSet.getString("G1_PASSPORT_NBR");
            var sRefConId = rSet.getString("G1_CONTACT_NBR");
            retArry.push({
                "sDecid": sDecid,
                "sRefConId": sRefConId
            });
            counter++;
            if (counter > 1) {
                break;
            }
        }
    }
    catch (vError) {
        logDebug("Runtime error occurred: " + vError);
    }
    closeDBQueryObject(rSet, sStmt, conn);
    return retArry;
}
// Function to validate the Public user creation process in the New Registration
function validatePublicUserCreation() {

    var newRegEmail = AInfo["E-mail Address"];
    var newRegUserName = AInfo["User Name"];
    var newRegPass = AInfo["Password"];
    var newRegPassAgain = AInfo["Type Password Again"];
    var retmsg = "";

    // check to see if the Password and confirm Password fields matches
    if (newRegPass && newRegPassAgain) {
        if (!newRegPass.equals(newRegPassAgain)) {
            retmsg += "Password field and Type Password Again field do not match with each other." + "<BR>";
        }
    }

    // Email Address validation 
    if (newRegEmail != null && newRegEmail != '') {
        var pattern = /^([a-zA-Z0-9_.-])+@([a-zA-Z0-9_.-])+\.([a-zA-Z])+([a-zA-Z])+/;
        if (!pattern.test(newRegEmail)) {
            retmsg += "Please enter a valid Email Address." + "<BR>";
        }
    }

    // check to see if public user exists already based on user Id
    var getUserResult = aa.publicUser.getPublicUserByUserId(newRegUserName);
    if (getUserResult.getSuccess() && getUserResult.getOutput()) {
        userModel = getUserResult.getOutput();
        retmsg += "Found an existing public user with User Id " + userModel.getUserID() + ". Please click on Login above, then enter your User Name and password to purchase a sporting license." + "<BR>";
    }

    // check to see if public user exists already based on email address
    var getUserResult = aa.publicUser.getPublicUserByEmail(newRegEmail);
    if (getUserResult.getSuccess() && getUserResult.getOutput()) {
        userModel = getUserResult.getOutput();
        retmsg += "Found an existing public user with email address " + newRegEmail + ". Please click on Login above, then enter your User Name and password to purchase a sporting license." + "<BR>";
    }
    return retmsg;
}
function createNewRegPublicUserFromContact() {
    var contact;
    var refContactNum;
    var userModel;
    var retmsg = "";
    var newRegUserName = AInfo["User Name"];
    var newRegEmail = AInfo["E-mail Address"];
    var newRegPassword = AInfo["Password"];
    var newRegSecurityQuestion = AInfo["Select a Security Question"];
    var newRegSecurityAnswer = AInfo["Answer"];
    var internalDecId = AInfo["Internal Decid"];
    var newRegFirstName = AInfo["First"];
    var newRegLastName = AInfo["Last"];

    logDebug("CreatePublicUserFromContact: creating new user");
    var publicUser = aa.publicUser.getPublicUserModel();
    publicUser.setFirstName(newRegFirstName);
    publicUser.setLastName(newRegLastName);
    publicUser.setEmail(newRegEmail);
    publicUser.setUserID(newRegUserName);
    publicUser.setPassword(getEncryptPassword(newRegPassword));
    //publicUser.setPassword("e8248cbe79a288ffec75d7300ad2e07172f487f6");
    publicUser.setAuditID("PublicUser");
    publicUser.setAuditStatus("A");

    var sSecurityQuestionMap = lookup("DD_SECURITY_QUESTIONS", newRegSecurityQuestion);
    publicUser.setPasswordRequestQuestion(sSecurityQuestionMap);
    publicUser.setPasswordRequestAnswer(newRegSecurityAnswer);

    var result = aa.publicUser.createPublicUser(publicUser);
    logDebug("result : " + result.getSuccess());
    if (result.getSuccess()) {
        logDebug("Created public user " + newRegUserName + "  sucessfully.");
        var userSeqNum = result.getOutput();
        var userModel = aa.publicUser.getPublicUser(userSeqNum).getOutput()

        // create for agency
        aa.publicUser.createPublicUserForAgency(userModel);

        // activate for agency
        var userPinBiz = aa.proxyInvoker.newInstance("com.accela.pa.pin.UserPINBusiness").getOutput()
        userPinBiz.updateActiveStatusAndLicenseIssueDate4PublicUser(aa.getServiceProviderCode(), userSeqNum, "ADMIN");

        // reset password
        /* var resetPasswordResult = aa.publicUser.resetPassword(newRegEmail);
        if (resetPasswordResult.getSuccess()) {
        var resetPassword = resetPasswordResult.getOutput();
        userModel.setPassword(resetPassword);
        logDebug("(contactObj) Reset password for " + newRegEmail + "  sucessfully.");
        } else {
        logDebug("(contactObj **WARNING: Reset password for  " + newRegEmail + "  failure:" + resetPasswordResult.getErrorMessage());
        }*/

        // send Activate email
        aa.publicUser.sendActivateEmail(userModel, true, true);

        // send another email
        aa.publicUser.sendPasswordEmail(userModel);

        if (internalDecId) {
            logDebug("(contactObj) CreatePublicUserFromContact: Linking this public user with reference contact : " + internalDecId);
            aa.licenseScript.associateContactWithPublicUser(userModel.getUserSeqNum(), internalDecId);

            attachedContacts(internalDecId);
            var peopleModel = getOutput(aa.people.getPeople(internalDecId), "");

            //Set passport number if it is null
            if (isNull(peopleModel.getPassportNumber(), '') == '') {
                peopleModel.setPassportNumber(internalDecId);
            }
            aa.people.editPeople(peopleModel);
        }
    } else {
        retmsg = "Warning creating public user " + newRegUserName + "  failure: " + result.getErrorMessage();
    }

    return retmsg;
}
function getEncryptPassword(sPassowrd) {
    var pwd = null;
    var result = aa.publicUser.encryptPassword(sPassowrd);
    if (result.getSuccess()) {
        pwd = result.getOutput();
    } else {
        logDebug("**WARNING: getEncryptPassword - " + result.getErrorMessage());
    }

    return pwd;
}
function GetSubmissionDateArray(rowsValueArray) {
    var submssionDtArray = new Array();
    for (var vv in rowsValueArray) {
        var tempArray = rowsValueArray[vv];
        for (var row in tempArray) {
            var tempObject = tempArray[row];
            for (var val in tempObject) {
                var fieldInfo = tempObject[val];
                //logDebug(fieldInfo.columnName +":" +isNull(fieldInfo.fieldValue, ''));
                if (fieldInfo.columnName == 'Submission Date')
                    submssionDtArray.push(fieldInfo.fieldValue);
            }
        }
    }
    return submssionDtArray;
}
Date.prototype.format = function (format) {
    var o = {
        "M+": this.getMonth() + 1, //month
        "d+": this.getDate(),    //day
        "h+": this.getHours(),   //hour
        "m+": this.getMinutes(), //minute
        "s+": this.getSeconds(), //second
        "q+": Math.floor((this.getMonth() + 3) / 3),  //quarter
        "S": this.getMilliseconds() //millisecond
    }

    if (/(y+)/.test(format)) format = format.replace(RegExp.$1,
    (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o) if (new RegExp("(" + k + ")").test(format))
        format = format.replace(RegExp.$1,
      RegExp.$1.length == 1 ? o[k] :
        ("00" + o[k]).substr(("" + o[k]).length));
    return format;
}
function addTimeLog() {
    logDebug("ENTER: addTimeLog");
    var now = new Date();
    var sKey = controlString;
    var sAction = null;

    var keyObj = getKeyActionByControlString(controlString);
    if (keyObj) {
        sKey = keyObj.Key;
        sAction = keyObj.Action;
    } else {
        sAction = "CTRCA";
    }
    var nNumericMsec = now.getTime();
    var sDateTimeValue = now.format("MM/dd/yyyy h:mm:ss");
    var nVisitIndex = getVisitIndex(sKey, sAction);

    var tableValueArray = {
        "Key": sKey,
        "Action": sAction,
        "Visit Index": nVisitIndex + "",
        "DateTime Value": sDateTimeValue,
        "Numeric msec": nNumericMsec + "",
        "controlString": controlString
    };

    //save the latest reprint log to ASIT.
    if (controlString == "ConvertToRealCapAfter") {
        addToASITable("TIME LOG", tableValueArray);
    } else {
        var newAsitArray = GetTimeLogAsitTableArray(tableValueArray);

        var asitModel = cap.getAppSpecificTableGroupModel();
        var new_asit = addASITable4ACAPageFlow(asitModel, "TIME LOG", newAsitArray);
    }
    logDebug("EXIT: addTimeLog");
}
function GetTimeLogAsitTableArray(tableValueArray) {
    logDebug("ENTER: GetTimeLogAsitTableArray");

    var readOnly = "N";
    var tempObject = new Array();
    var tempArray = new Array();

    var fieldInfo;
    if (typeof (TIMELOG) == "object") {
        for (y in TIMELOG) {
            tempObject = new Array();

            fieldInfo = new asiTableValObj("Key", TIMELOG[y]["Key"], readOnly);
            tempObject["Key"] = fieldInfo;
            fieldInfo = new asiTableValObj("Action", TIMELOG[y]["Action"], readOnly);
            tempObject["Action"] = fieldInfo;
            fieldInfo = new asiTableValObj("Visit Index", TIMELOG[y]["Visit Index"], readOnly);
            tempObject["Visit Index"] = fieldInfo;
            fieldInfo = new asiTableValObj("DateTime Value", TIMELOG[y]["DateTime Value"], readOnly);
            tempObject["DateTime Value"] = fieldInfo;
            fieldInfo = new asiTableValObj("Numeric msec", TIMELOG[y]["Numeric msec"], readOnly);
            tempObject["Numeric msec"] = fieldInfo;
            fieldInfo = new asiTableValObj("controlString", TIMELOG[y]["controlString"], readOnly);
            tempObject["controlString"] = fieldInfo;
            tempArray.push(tempObject);
        }
    }

    tempObject = new Array();

    fieldInfo = new asiTableValObj("Key", tableValueArray["Key"], readOnly);
    tempObject["Key"] = fieldInfo;
    fieldInfo = new asiTableValObj("Action", tableValueArray["Action"], readOnly);
    tempObject["Action"] = fieldInfo;
    fieldInfo = new asiTableValObj("Visit Index", tableValueArray["Visit Index"], readOnly);
    tempObject["Visit Index"] = fieldInfo;
    fieldInfo = new asiTableValObj("DateTime Value", tableValueArray["DateTime Value"], readOnly);
    tempObject["DateTime Value"] = fieldInfo;
    fieldInfo = new asiTableValObj("Numeric msec", tableValueArray["Numeric msec"], readOnly);
    tempObject["Numeric msec"] = fieldInfo;
    fieldInfo = new asiTableValObj("controlString", tableValueArray["controlString"], readOnly);
    tempObject["controlString"] = fieldInfo;

    tempArray.push(tempObject);  // end of record

    logDebug("EXIT: GetTimeLogAsitTableArray");
    return tempArray;
}
function getVisitIndex(sKey, sAction) {
    var nVisitIndex = 1;
    if (typeof (TIMELOG) == "object") {
        for (y in TIMELOG) {
            if (TIMELOG[y]["Key"] + TIMELOG[y]["Action"] == sKey + sAction) {
                nVisitIndex++;
            }
        }
    }
    return nVisitIndex;
}
function getApplicantArraybyPublicUserId(peopleSequenceNumber) {
    //TODO
    var aArray = new Array();
    return aArray;

    aArray["lastName"] = capContactObj.getPeople().lastName;
    aArray["firstName"] = capContactObj.getPeople().firstName;
    aArray["middleName"] = capContactObj.getPeople().middleName;
    aArray["businessName"] = capContactObj.getPeople().businessName;
    aArray["contactSeqNumber"] = capContactObj.getPeople().contactSeqNumber;
    if (capContactObj.getCapContactModel == undefined) {
        aArray["refcontactSeqNumber"] = capContactObj.getRefContactNumber();
    } else {
        aArray["refcontactSeqNumber"] = capContactObj.getCapContactModel().getRefContactNumber();
    }
    aArray["contactType"] = capContactObj.getPeople().contactType;
    aArray["relation"] = capContactObj.getPeople().relation;
    aArray["phone1"] = capContactObj.getPeople().phone1;
    aArray["phone2"] = capContactObj.getPeople().phone2;
    aArray["email"] = capContactObj.getPeople().email;
    aArray["addressLine1"] = capContactObj.getPeople().getCompactAddress().getAddressLine1();
    aArray["addressLine2"] = capContactObj.getPeople().getCompactAddress().getAddressLine2();
    aArray["city"] = capContactObj.getPeople().getCompactAddress().getCity();
    aArray["state"] = capContactObj.getPeople().getCompactAddress().getState();
    aArray["zip"] = capContactObj.getPeople().getCompactAddress().getZip();
    aArray["fax"] = capContactObj.getPeople().fax;
    aArray["notes"] = capContactObj.getPeople().notes;
    aArray["country"] = capContactObj.getPeople().getCompactAddress().getCountry();
    aArray["fullName"] = capContactObj.getPeople().fullName;
    aArray["gender"] = capContactObj.getPeople().gender;
    aArray["birthDate"] = capContactObj.getPeople().birthDate;
    aArray["driverLicenseNbr"] = capContactObj.getPeople().driverLicenseNbr;
    aArray["driverLicenseState"] = capContactObj.getPeople().driverLicenseState;
    aArray["deceasedDate"] = capContactObj.getPeople().deceasedDate;
    aArray["passportNumber"] = capContactObj.getPeople().passportNumber;
    aArray["stateIDNbr"] = capContactObj.getPeople().stateIDNbr;

    var pa;
    if (arguments.length == 1 && !cap.isCompleteCap() && controlString != "ApplicationSubmitAfter" && controlString != "ConvertToRealCapAfter") // using capModel to get contacts
    {
        logDebug("getApplicantInfoArray: retrieving ASI from capModel");

        var subGroupArray = getTemplateValueByFormArrays(capContactObj.people.getTemplate(), null, null);
        for (var subGroupName in subGroupArray) {
            var fieldArray = subGroupArray[subGroupName];
            for (var f in fieldArray) {
                aArray[f] = fieldArray[f];
            }
        }
    } else {
        logDebug("getApplicantInfoArray: retrieving from database");

        if (capContactObj.getCapContactModel().getPeople().getAttributes() != null) {
            pa = capContactObj.getCapContactModel().getPeople().getAttributes().toArray();
            for (xx1 in pa) {
                aArray[pa[xx1].attributeName] = pa[xx1].attributeValue;
            }
        }
    }

    return aArray;
}
function getKeyActionByControlString(controlString) {
    var tArray = new Array();
    if (appTypeString == 'Licenses/Customer/Registration/Application') {
        tArray['ACA ONLOAD USER CREATION'] = { 'Key': 'Registration >> Enter User Information', 'Action': 'Onload' };
        tArray['ACA ONLOAD REGISTER'] = { 'Key': 'Registration >> Account Claim', 'Action': 'Onload' };
        tArray['ACA ONSUBMIT BEFORE USER CREATION'] = { 'Key': 'Registration >> Enter User Information', 'Action': 'Before' };
        tArray['ACA ONSUBMIT BEFORE REGISTER'] = { 'Key': 'Registration >> Account Claim', 'Action': 'Before' };
        tArray['ACA ONSUBMIT AFTER USER CREATION'] = { 'Key': 'Registration >> Enter User Information', 'Action': 'After' };
        tArray['ACA ONSUBMIT AFTER REGISTER'] = { 'Key': 'Registration >> Account Claim', 'Action': 'After' };
    }
    if (appTypeString == 'Licenses/Other/Sportsmen/DMV ID Request') {
        tArray['ACA ONLOAD DMV REQ'] = { 'Key': 'DMV ID Request Details >> DMV Request Information', 'Action': 'Onload' };
        tArray['ACA ONSUBMIT BEFORE DMV REQ'] = { 'Key': 'DMV ID Request Details >> DMV Request Information', 'Action': 'Before' };
        tArray['ACA ONSUBMIT AFTER DMV REQ'] = { 'Key': 'DMV ID Request Details >> DMV Request Information', 'Action': 'After' };
    }

    if (appTypeString == 'Licenses/Sales/Reprint/Documents') {
        tArray['ACA ONLOAD PRINTSTEP1'] = { 'Key': 'Replace A license >> Replace a License', 'Action': 'Onload' };
        tArray['ACA ONSUBMIT AFTER CONTCTSELCT'] = { 'Key': 'Select Documents to Reprint >> Replace Documents', 'Action': 'Onload' };
        tArray['ACA ONSUBMIT BEFORE PRINTSTEP1'] = { 'Key': 'Replace A license >> Replace a License', 'Action': 'Before' };
        tArray['ACA ONSUBMIT BEFORE PRINTSELCT'] = { 'Key': 'Select Documents to Reprint >> Replace Documents', 'Action': 'Before' };
        tArray['ACA ONSUBMIT AFTER PRINTSTEP1'] = { 'Key': 'Replace A license >> Replace a License', 'Action': 'After' };
        tArray['ACA ONSUBMIT AFTER PRINTSELCT'] = { 'Key': 'Select Documents to Reprint >> Replace Documents', 'Action': 'After' };
    }
    if (appTypeString == 'Licenses/Sales/Application/Sporting') {
        tArray['ACA ONLOAD EXPRESS P1'] = { 'Key': 'License/permit Types >> Applicant Details', 'Action': 'Onload' };
        tArray['ACA ONLOAD EXPRESS P2'] = { 'Key': 'License/permit Types >> Select License Year', 'Action': 'Onload' };
        tArray['ACA ONLOAD EXPRS ITEM'] = { 'Key': 'License/permit Types >> Select License Type', 'Action': 'Onload' };
        tArray['ACA ONSUBMIT BEFORE EXPRESS P1'] = { 'Key': 'License/permit Types >> Applicant Details', 'Action': 'Before' };
        tArray['ACA ONSUBMIT BEFORE EXPRESS P2'] = { 'Key': 'License/permit Types >> Select License Year', 'Action': 'Before' };
        tArray['ACA ONSUBMIT BEFORE EXPRS ITEM'] = { 'Key': 'License/permit Types >> Select License Type', 'Action': 'Before' };
        tArray['ACA ONSUBMIT AFTER EXPRESS P1'] = { 'Key': 'License/permit Types >> Applicant Details', 'Action': 'After' };
        tArray['ACA ONSUBMIT AFTER EXPRESS P2'] = { 'Key': 'License/permit Types >> Select License Year', 'Action': 'After' };
        tArray['ACA ONSUBMIT AFTER EXPRS ITEM'] = { 'Key': 'License/permit Types >> Select License Type', 'Action': 'After' };
    }
    if (appTypeString == 'Licenses/Sales/Application/Sporting C') {
        tArray['ACA ONLOAD EXPRS ITEM'] = { 'Key': 'License/permit Types >> Select License Type', 'Action': 'Onload' };
        tArray['ACA ONLOAD EXPRESS P2'] = { 'Key': 'License/permit Types >> Select License Year', 'Action': 'Onload' };
        tArray['ACA ONSUBMIT BEFORE EXPRS ITEM'] = { 'Key': 'License/permit Types >> Select License Type', 'Action': 'Before' };
        tArray['ACA ONSUBMIT BEFORE EXPRESS P2'] = { 'Key': 'License/permit Types >> Select License Year', 'Action': 'Before' };
        tArray['ACA ONSUBMIT AFTER EXPRS ITEM'] = { 'Key': 'License/permit Types >> Select License Type', 'Action': 'After' };
        tArray['ACA ONSUBMIT AFTER EXPRESS P2'] = { 'Key': 'License/permit Types >> Select License Year', 'Action': 'After' };
    }
    if (appTypeString == 'Licenses/Sales/Application/Fishing' || appTypeString == 'Licenses/Sales/Application/Marine Registry') {
        tArray['ACA ONLOAD EXPRESS P2'] = { 'Key': 'License/permit Types >> Select License Year', 'Action': 'Onload' };
        tArray['ACA ONLOAD EXPRESS P1'] = { 'Key': 'License/permit Types >> Applicant Details', 'Action': 'Onload' };
        tArray['ACA ONLOAD EXPRS ITEM'] = { 'Key': 'License/permit Types >> Select License Type', 'Action': 'Onload' };
        tArray['ACA ONSUBMIT BEFORE EXPRESS P2'] = { 'Key': 'License/permit Types >> Select License Year', 'Action': 'Before' };
        tArray['ACA ONSUBMIT BEFORE EXPRESS P1'] = { 'Key': 'License/permit Types >> Applicant Details', 'Action': 'Before' };
        tArray['ACA ONSUBMIT BEFORE EXPRS ITEM'] = { 'Key': 'License/permit Types >> Select License Type', 'Action': 'Before' };
        tArray['ACA ONSUBMIT AFTER EXPRESS P2'] = { 'Key': 'License/permit Types >> Select License Year', 'Action': 'After' };
        tArray['ACA ONSUBMIT AFTER EXPRESS P1'] = { 'Key': 'License/permit Types >> Applicant Details', 'Action': 'After' };
        tArray['ACA ONSUBMIT AFTER EXPRS ITEM'] = { 'Key': 'License/permit Types >> Select License Type', 'Action': 'After' };
    }
    if (appTypeString == 'Licenses/Sales/Application/Fishing C' || appTypeString == 'Licenses/Sales/Application/Marine Registry C') {
        tArray['ACA ONLOAD EXPRS ITEM'] = { 'Key': 'License/permit Types >> Select License Type', 'Action': 'Onload' };
        tArray['ACA ONLOAD EXPRESS P2'] = { 'Key': 'License/permit Types >> Select License Year', 'Action': 'Onload' };
        tArray['ACA ONSUBMIT BEFORE EXPRS ITEM'] = { 'Key': 'License/permit Types >> Select License Type', 'Action': 'Before' };
        tArray['ACA ONSUBMIT BEFORE EXPRESS P2'] = { 'Key': 'License/permit Types >> Select License Year', 'Action': 'Before' };
        tArray['ACA ONSUBMIT AFTER EXPRS ITEM'] = { 'Key': 'License/permit Types >> Select License Type', 'Action': 'After' };
        tArray['ACA ONSUBMIT AFTER EXPRESS P2'] = { 'Key': 'License/permit Types >> Select License Year', 'Action': 'After' };
    }

    if (appTypeString == 'Licenses/Sales/Application/Hunting') {
        tArray['ACA ONLOAD EXPRESS P2'] = { 'Key': 'License/permit Types >> Select License Year', 'Action': 'Onload' };
        tArray['ACA ONLOAD EXPRS ITEM'] = { 'Key': 'License/permit Types >>  Select License Type', 'Action': 'Onload' };
        tArray['ACA ONLOAD EXPRESS P1'] = { 'Key': 'License/permit Types >> Applicant Details', 'Action': 'Onload' };
        tArray['ACA ONSUBMIT BEFORE EXPRESS P2'] = { 'Key': 'License/permit Types >> Select License Year', 'Action': 'Before' };
        tArray['ACA ONSUBMIT BEFORE EXPRS ITEM'] = { 'Key': 'License/permit Types >>  Select License Type', 'Action': 'Before' };
        tArray['ACA ONSUBMIT BEFORE EXPRESS P1'] = { 'Key': 'License/permit Types >> Applicant Details', 'Action': 'Before' };
        tArray['ACA ONSUBMIT AFTER EXPRESS P2'] = { 'Key': 'License/permit Types >> Select License Year', 'Action': 'After' };
        tArray['ACA ONSUBMIT AFTER EXPRS ITEM'] = { 'Key': 'License/permit Types >>  Select License Type', 'Action': 'After' };
        tArray['ACA ONSUBMIT AFTER EXPRESS P1'] = { 'Key': 'License/permit Types >> Applicant Details', 'Action': 'After' };
    }

    if (appTypeString == 'Licenses/Sales/Application/Hunting C') {
        tArray['ACA ONLOAD EXPRS ITEM'] = { 'Key': 'License/permit Types >> Select License Type', 'Action': 'Onload' };
        tArray['ACA ONLOAD EXPRESS P2'] = { 'Key': 'License/permit Types >> Select License Year', 'Action': 'Onload' };
        tArray['ACA ONSUBMIT BEFORE EXPRS ITEM'] = { 'Key': 'License/permit Types >> Select License Type', 'Action': 'Before' };
        tArray['ACA ONSUBMIT BEFORE EXPRESS P2'] = { 'Key': 'License/permit Types >> Select License Year', 'Action': 'Before' };
        tArray['ACA ONSUBMIT AFTER EXPRS ITEM'] = { 'Key': 'License/permit Types >> Select License Type', 'Action': 'After' };
        tArray['ACA ONSUBMIT AFTER EXPRESS P2'] = { 'Key': 'License/permit Types >> Select License Year', 'Action': 'After' };
    }
    if (appTypeString == 'Licenses/Sales/Application/Hunting and Fishing') {
        tArray['ACA ONLOAD EXPRESS P1'] = { 'Key': 'License/permit Types >> Applicant Details', 'Action': 'Onload' };
        tArray['ACA ONLOAD EXPRESS P2'] = { 'Key': 'License/permit Types >> Select License Year', 'Action': 'Onload' };
        tArray['ACA ONLOAD EXPRS ITEM'] = { 'Key': 'License/permit Types >> Select License Type', 'Action': 'Onload' };
        tArray['ACA ONSUBMIT BEFORE EXPRESS P1'] = { 'Key': 'License/permit Types >> Applicant Details', 'Action': 'Before' };
        tArray['ACA ONSUBMIT BEFORE EXPRESS P2'] = { 'Key': 'License/permit Types >> Select License Year', 'Action': 'Before' };
        tArray['ACA ONSUBMIT BEFORE EXPRS ITEM'] = { 'Key': 'License/permit Types >> Select License Type', 'Action': 'Before' };
        tArray['ACA ONSUBMIT AFTER EXPRESS P1'] = { 'Key': 'License/permit Types >> Applicant Details', 'Action': 'After' };
        tArray['ACA ONSUBMIT AFTER EXPRESS P2'] = { 'Key': 'License/permit Types >> Select License Year', 'Action': 'After' };
        tArray['ACA ONSUBMIT AFTER EXPRS ITEM'] = { 'Key': 'License/permit Types >> Select License Type', 'Action': 'After' };
    }
    if (appTypeString == 'Licenses/Sales/Application/Hunting and Fishing C') {
        tArray['ACA ONLOAD EXPRESS P2'] = { 'Key': 'License/permit Types >> Select License Year', 'Action': 'Onload' };
        tArray['ACA ONLOAD EXPRS ITEM'] = { 'Key': 'License/permit Types >> Select License Type', 'Action': 'Onload' };
        tArray['ACA ONSUBMIT BEFORE EXPRESS P2'] = { 'Key': 'License/permit Types >> Select License Year', 'Action': 'Before' };
        tArray['ACA ONSUBMIT BEFORE EXPRS ITEM'] = { 'Key': 'License/permit Types >> Select License Type', 'Action': 'Before' };
        tArray['ACA ONSUBMIT AFTER EXPRESS P2'] = { 'Key': 'License/permit Types >> Select License Year', 'Action': 'After' };
        tArray['ACA ONSUBMIT AFTER EXPRS ITEM'] = { 'Key': 'License/permit Types >> Select License Type', 'Action': 'After' };
    }
    if (appTypeString == 'Licenses/Annual/Application/NA') {
        tArray['ACA ONLOAD FILL CNTCT'] = { 'Key': 'Contact Details >> Applicant Details', 'Action': 'Onload' };
        tArray['ACA ONLOAD TBL UPDATE'] = { 'Key': 'Licensee Details >> Licensee Details', 'Action': 'Onload' };
        tArray['ACA ONLOAD SALESELECT'] = { 'Key': 'License/permit Types >> Select License Type', 'Action': 'Onload' };
        tArray['ACA ONLOAD FILL FROM CONTACT'] = { 'Key': 'Contact Details >> Applicant Details', 'Action': 'Before' };
        tArray['ACA ONSUBMIT BEFORE TBL UPDATE'] = { 'Key': 'Licensee Details >> Licensee Details', 'Action': 'Before' };
        tArray['ACA ONSUBMIT BEFORE SALESELECT'] = { 'Key': 'License/permit Types >> Select License Type', 'Action': 'Before' };
        tArray['ACA ONSUBMIT AFTER FILL CNTCT'] = { 'Key': 'Contact Details >> Applicant Details', 'Action': 'After' };
        tArray['ACA ONSUBMIT AFTER TBL UPDATE'] = { 'Key': 'Licensee Details >> Licensee Details', 'Action': 'After' };
        tArray['ACA ONSUBMIT AFTER SALESSELECT'] = { 'Key': 'License/permit Types >> Select License Type', 'Action': 'After' };
    }
    if (appTypeString == 'Licenses/Other/Sales/Application') {
        tArray['ACA ONLOAD OTHERSALES'] = { 'Key': 'Sales Item Selection >> Select Other Sales Item', 'Action': 'Onload' };
        tArray['ACA ONSUBMIT BEFORE OTHERSALES'] = { 'Key': 'Sales Item Selection >> Select Other Sales Item', 'Action': 'Before' };
        tArray['ACA ONSUBMIT AFTER OTHERSALES'] = { 'Key': 'Sales Item Selection >> Select Other Sales Item', 'Action': 'After' };
    }
    if (appTypeString == 'Licenses/Other/Sportsmen/Game Harvest') {
        tArray['ACA ONLOAD CARCASSTAG'] = { 'Key': 'Report Game Harvest >> Carcass Tag Information', 'Action': 'Onload' };
        tArray['ACA ONLOAD VERIFYTAG'] = { 'Key': 'Kill Information >> Kill Information', 'Action': 'Onload' };
        tArray['ACA ONSUBMIT BEFORE CARCASSTAG'] = { 'Key': 'Report Game Harvest >> Carcass Tag Information', 'Action': 'Before' };
        tArray['ACA ONSUBMIT BEFORE VERIFYTAG'] = { 'Key': 'Kill Information >> Kill Information', 'Action': 'Before' };
        tArray['ACA ONSUBMIT AFTER CARCASSTAG'] = { 'Key': 'Report Game Harvest >> Carcass Tag Information', 'Action': 'After' };
        tArray['ACA ONSUBMIT AFTER VERIFYTAG'] = { 'Key': 'Kill Information >> Kill Information', 'Action': 'After' };
    }
    if (appTypeString == 'Licenses/Other/Sportsmen/Profile') {
        tArray['ACA UPDATE ALSO KNOWN AS'] = { 'Key': 'Applicant Details >> Applicant Details', 'Action': 'Onload' };
        tArray['ACA ONLOAD TBL UPDATE'] = { 'Key': 'Sportsman Profile >> Sportsman Profile', 'Action': 'Onload' };
        tArray['ACA ONLOAD FILL FROM CONTACT'] = { 'Key': 'Applicant Details >> Applicant Details', 'Action': 'Before' };
        tArray['ACA ONSUBMIT BEFORE TBL UPDATE'] = { 'Key': 'Sportsman Profile >> Sportsman Profile', 'Action': 'Before' };
        tArray['ACA ONSUBMIT AFTER FILL CNTCT'] = { 'Key': 'Applicant Details >> Applicant Details', 'Action': 'After' };
        tArray['ACA ONSUBMIT AFTER TBL UPDATE'] = { 'Key': 'Sportsman Profile >> Sportsman Profile', 'Action': 'After' };
    }
    if (appTypeString == 'Licenses/Sales/Application/Transfer') {
        tArray['ACA ONLOAD TXFR P1'] = { 'Key': 'Contact Details >> Applicant Details', 'Action': 'Onload' };
        tArray['ACA ONLOAD TRANSFER'] = { 'Key': 'Licensee Details >> Selected License', 'Action': 'Onload' };
        tArray['ACA ONSUBMIT BEFORE TXFR P1'] = { 'Key': 'Contact Details >> Applicant Details', 'Action': 'Before' };
        tArray['ACA ONSUBMIT BEFORE TRANSFER'] = { 'Key': 'Licensee Details >> Selected License', 'Action': 'Before' };
        tArray['ACA ONSUBMIT AFTER TXFR P1'] = { 'Key': 'Contact Details >> Applicant Details', 'Action': 'After' };
        tArray['ACA ONSUBMIT AFTER TRANSFER'] = { 'Key': 'Licensee Details >> Selected License', 'Action': 'After' };
    }
    if (appTypeString == 'Licenses/Sales/Application/Trapping') {
        tArray['ACA ONLOAD EXPRESS P1'] = { 'Key': 'License/permit Types >> Applicant Details', 'Action': 'Onload' };
        tArray['ACA ONLOAD EXPRS ITEM'] = { 'Key': 'License/permit Types >> Select License Type', 'Action': 'Onload' };
        tArray['ACA ONLOAD EXPRESS P2'] = { 'Key': 'License/permit Types >> Select License Year', 'Action': 'Onload' };
        tArray['ACA ONSUBMIT BEFORE EXPRESS P1'] = { 'Key': 'License/permit Types >> Applicant Details', 'Action': 'Before' };
        tArray['ACA ONSUBMIT BEFORE EXPRS ITEM'] = { 'Key': 'License/permit Types >> Select License Type', 'Action': 'Before' };
        tArray['ACA ONSUBMIT BEFORE EXPRESS P2'] = { 'Key': 'License/permit Types >> Select License Year', 'Action': 'Before' };
        tArray['ACA ONSUBMIT AFTER EXPRESS P1'] = { 'Key': 'License/permit Types >> Applicant Details', 'Action': 'After' };
        tArray['ACA ONSUBMIT AFTER EXPRS ITEM'] = { 'Key': 'License/permit Types >> Select License Type', 'Action': 'After' };
        tArray['ACA ONSUBMIT AFTER EXPRESS P2'] = { 'Key': 'License/permit Types >> Select License Year', 'Action': 'After' };
    }
    if (appTypeString == 'Licenses/Sales/Application/Trapping C') {
        tArray['ACA ONLOAD EXPRESS P2'] = { 'Key': 'License/permit Types >> Select License Year', 'Action': 'Onload' };
        tArray['ACA ONLOAD EXPRS ITEM'] = { 'Key': 'License/permit Types >> Select License Type', 'Action': 'Onload' };
        tArray['ACA ONSUBMIT BEFORE EXPRESS P2'] = { 'Key': 'License/permit Types >> Select License Year', 'Action': 'Before' };
        tArray['ACA ONSUBMIT BEFORE EXPRS ITEM'] = { 'Key': 'License/permit Types >> Select License Type', 'Action': 'Before' };
        tArray['ACA ONSUBMIT AFTER EXPRESS P2'] = { 'Key': 'License/permit Types >> Select License Year', 'Action': 'After' };
        tArray['ACA ONSUBMIT AFTER EXPRS ITEM'] = { 'Key': 'License/permit Types >> Select License Type', 'Action': 'After' };
    }
    if (appTypeString == 'Licenses/Sales/Upgrade/Lifetime') {
        tArray['ACA ONLOAD UGRDCNT'] = { 'Key': 'Customer >> Applicant', 'Action': 'Onload' };
        tArray['ACA ONLOAD UGRDSTEP1'] = { 'Key': 'Upgrade Information >> Select License', 'Action': 'Onload' };
        tArray['ACA ONLOAD UGRDSTEP2'] = { 'Key': 'Upgrade Information >> Verify Tags', 'Action': 'Onload' };
        tArray['ACA ONSUBMIT BEFORE UGRDCNT'] = { 'Key': 'Customer >> Applicant', 'Action': 'Before' };
        tArray['ACA ONSUBMIT BEFORE UGRDSTEP1'] = { 'Key': 'Upgrade Information >> Select License', 'Action': 'Before' };
        tArray['ACA ONSUBMIT BEFORE UGRDSTEP2'] = { 'Key': 'Upgrade Information >> Verify Tags', 'Action': 'Before' };
        tArray['ACA ONSUBMIT AFTER UGRDCNT'] = { 'Key': 'Customer >> Applicant', 'Action': 'After' };
        tArray['ACA ONSUBMIT AFTER UGRDSTEP1'] = { 'Key': 'Upgrade Information >> Select License', 'Action': 'After' };
        tArray['ACA ONSUBMIT AFTER UGRDSTEP2'] = { 'Key': 'Upgrade Information >> Verify Tags', 'Action': 'After' };
    }
    if (appTypeString == 'Licenses/Sales/Void/Documents') {
        tArray['ACA ONLOAD VDSLSTEP1'] = { 'Key': 'Enter Customer >> Enter Customer', 'Action': 'Onload' };
        tArray['ACA ONLOAD VDSLSTEP2'] = { 'Key': 'Select documents to void >> Select documents to void', 'Action': 'Onload' };
        tArray['ACA ONSUBMIT BEFORE VDSLSTEP1'] = { 'Key': 'Enter Customer >> Enter Customer', 'Action': 'Before' };
        tArray['ACA ONSUBMIT BEFORE VDSLSTEP2'] = { 'Key': 'Select documents to void >> Select documents to void', 'Action': 'Before' };
        tArray['ACA ONSUBMIT AFTER VDSLSTEP1'] = { 'Key': 'Enter Customer >> Enter Customer', 'Action': 'After' };
        tArray['ACA ONSUBMIT AFTER VDSLSTEP2'] = { 'Key': 'Select documents to void >> Select documents to void', 'Action': 'After' };
    }
    if (appTypeString == 'Licenses/Sales/Application/Lifetime') {
        tArray['ACA ONLOAD EXPRS ITEM'] = { 'Key': 'License/permit Types >> Select License Type', 'Action': 'Onload' };
        tArray['ACA ONLOAD EXPRESS P2'] = { 'Key': 'License/permit Types >> Select License Year', 'Action': 'Onload' };
        tArray['ACA ONLOAD EXPRESS P1'] = { 'Key': 'License/permit Types >> Applicant Details', 'Action': 'Onload' };
        tArray['ACA ONSUBMIT BEFORE EXPRS ITEM'] = { 'Key': 'License/permit Types >> Select License Type', 'Action': 'Before' };
        tArray['ACA ONSUBMIT BEFORE EXPRESS P2'] = { 'Key': 'License/permit Types >> Select License Year', 'Action': 'Before' };
        tArray['ACA ONSUBMIT BEFORE EXPRESS P1'] = { 'Key': 'License/permit Types >> Applicant Details', 'Action': 'Before' };
        tArray['ACA ONSUBMIT AFTER EXPRS ITEM'] = { 'Key': 'License/permit Types >> Select License Type', 'Action': 'After' };
        tArray['ACA ONSUBMIT AFTER EXPRESS P2'] = { 'Key': 'License/permit Types >> Select License Year', 'Action': 'After' };
        tArray['ACA ONSUBMIT AFTER EXPRESS P1'] = { 'Key': 'License/permit Types >> Applicant Details', 'Action': 'After' };
    }
    if (appTypeString == 'Licenses/Sales/Application/Lifetime C') {
        tArray['ACA ONLOAD EXPRESS P2'] = { 'Key': 'License/permit Types >> Select License Year', 'Action': 'Onload' };
        tArray['ACA ONLOAD EXPRS ITEM'] = { 'Key': 'License/permit Types >> Select License Type', 'Action': 'Onload' };
        tArray['ACA ONSUBMIT BEFORE EXPRESS P2'] = { 'Key': 'License/permit Types >> Select License Year', 'Action': 'Before' };
        tArray['ACA ONSUBMIT BEFORE EXPRS ITEM'] = { 'Key': 'License/permit Types >> Select License Type', 'Action': 'Before' };
        tArray['ACA ONSUBMIT AFTER EXPRESS P2'] = { 'Key': 'License/permit Types >> Select License Year', 'Action': 'After' };
        tArray['ACA ONSUBMIT AFTER EXPRS ITEM'] = { 'Key': 'License/permit Types >> Select License Type', 'Action': 'After' };
    }

    return tArray[controlString];
}
function isExpressFlow() {
    var isValid = false;
    var verifyExpressArray = new Array();
    verifyExpressArray.push('Licenses/Sales/Application/Fishing');
    verifyExpressArray.push('Licenses/Sales/Application/Hunting');
    verifyExpressArray.push('Licenses/Sales/Application/Hunting and Fishing');
    verifyExpressArray.push('Licenses/Sales/Application/Trapping');
    verifyExpressArray.push('Licenses/Sales/Application/Lifetime');
    verifyExpressArray.push('Licenses/Sales/Application/Sporting');
    verifyExpressArray.push('Licenses/Sales/Application/Marine Registry');

    isValid = (exists(appTypeString, verifyExpressArray));
    return isValid;
}
function isPublicExpressFlow() {
    var isValid = false;
    var verifyExpressArray = new Array();
    verifyExpressArray.push('Licenses/Sales/Application/Fishing C');
    verifyExpressArray.push('Licenses/Sales/Application/Hunting C');
    verifyExpressArray.push('Licenses/Sales/Application/Hunting and Fishing C');
    verifyExpressArray.push('Licenses/Sales/Application/Trapping C');
    verifyExpressArray.push('Licenses/Sales/Application/Lifetime C');
    verifyExpressArray.push('Licenses/Sales/Application/Sporting C');
    verifyExpressArray.push('Licenses/Sales/Application/Marine Registry C');

    isValid = (exists(appTypeString, verifyExpressArray));
    return isValid;
}
function deleteContactASIT(peopleModel, groupName, subGroupName) {
    var appSpecificTableScript = aa.appSpecificTableScript.getAppSpecificTableModel(capId, subGroupName).getOutput();

    if (appSpecificTableScript) {
        var appSpecificTable = appSpecificTableScript.getAppSpecificTableModel();
        var tableFields = appSpecificTable.getTableFields();
        //var groupName = appSpecificTable.getGroupName();
        //Contact ASIT subGroupName is equal to cap ASIT subGroupName

        if (tableFields.size() == 0) {
            deleteASITTableValues(peopleModel.getTemplate(), subGroupName);
        }
    }
    else {
        logDebug("deleteContactASIT: Can't delete table " + subGroupName + " because it doesn't exist on the record");
    }
}
function deleteASITTableValues(templateModel, subGroupName) {
    var vError = null;
    try {
        var templateGroups = templateModel.getTemplateTables();
        var subGroups = templateGroups.get(0).getSubgroups();
        for (var subGroupIndex = 0; subGroupIndex < subGroups.size(); subGroupIndex++) {
            var subGroup = subGroups.get(subGroupIndex);
            if (subGroupName == subGroup.getSubgroupName()) {
                var flds = subGroup.fields;
                for (var fidx = 0; fidx < flds.size(); fidx++) {
                    var fld = flds.get(fidx);
                    var ccb = aa.proxyInvoker.newInstance("com.accela.aa.template.GenericTemplateDaoOracle").getOutput();
                    ccb.removeASITFieldValueByEntityType(fld);
                }
            }
        }
    }
    catch (vError) {
        logDebug("Runtime error occurred deleteASITTableValues: " + vError);
    }
}
function updateDecID(peopleSequenceNumber) {
    if (peopleSequenceNumber) {
        var peopleModel = getOutput(aa.people.getPeople(peopleSequenceNumber), "");

        //Set DEC ID/passport number
        if (isNull(peopleModel.getPassportNumber(), '') != peopleSequenceNumber + "") {
            peopleModel.setPassportNumber(peopleSequenceNumber);
        }

        aa.people.editPeople(peopleModel);
    }
}
function createActiveHoldingTableForTxfr() {
    logDebug("ENTER: createActiveHoldingTable");
    var xArray = getApplicantArrayEx();
    var peopleSequenceNumber = null;
    for (ca in xArray) {
        var thisContact = xArray[ca];
        peopleSequenceNumber = thisContact["refcontactSeqNumber"]
        if (peopleSequenceNumber != null) {
            var asitModel;
            var new_asit;
            var availableActiveItems = getActiveHoldings(peopleSequenceNumber);
            var newAsitArray = GetActiveHoldingsAsitTableArray(availableActiveItems);

            asitModel = cap.getAppSpecificTableGroupModel();
            new_asit = addASITable4ACAPageFlow(asitModel, "ACTIVE HOLDINGS", newAsitArray);

            var strAllHolding = GetASITDelimitedString("ACTIVEHOLDINGS", newAsitArray);
            editAppSpecific4ACA("A_ActiveHoldings", strAllHolding);
            editAppSpecific4ACA("A_PrintConsignedLines", isPrivPanleWithConsignedLinesFound(availableActiveItems) ? 'N' : 'Y');
        }
        break;
    }
    logDebug("EXIT: createActiveHoldingTable");
}
function closeDBQueryObject(rSet, sStmt, conn) {
    try {
        if (rSet) {
            rSet.close();
            rSet = null;
        }
    } catch (vError) {
        aa.print("Failed to close the database result set object." + vError);
    }
    try {
        if (sStmt) {
            sStmt.close();
            sStmt = null;
        }
    } catch (vError) {
        aa.print("Failed to close the database prepare statement object." + vError);
    }
    try {
        if (conn) {
            conn.close();
            conn = null;
        }
    } catch (vError) {
        aa.print("Failed to close the database connection." + vError);
    }
}
//To add payment for license added through Legacy Load. 
//This payment will be used for upgrade lifetime functinality.
function makePaymentForLegacy(feeAmount) {
    logDebug("ENTER: makePaymentForLegacy");

    var feeSeqNbr;
    itemCap = capId;
    if (arguments.length == 2) itemCap = arguments[1]; // use cap ID specified in args

    //get fee details
    //retrieve a list of invoices by capID
    iListResult = aa.finance.getInvoiceByCapID(itemCap, null);
    if (iListResult.getSuccess()) {
        iList = iListResult.getOutput();
        invNbr = "";
        feeAmount = "";
        iFound = false;

        //find invoice by matching fee sequence numbers with one passed in
        for (iNum in iList) {
            fList = aa.invoice.getFeeItemInvoiceByInvoiceNbr(iList[iNum].getInvNbr()).getOutput()
            for (fNum in fList)
                feeSeqNbr = fList[fNum].getFeeSeqNbr();
            //if (fList[fNum].getFeeSeqNbr() == feeSeqNbr) {
            invNbr = iList[iNum].getInvNbr();
            feeAmount = fList[fNum].getFee();
            iFound = true;
            logMessage("Invoice Number Found: " + invNbr);
            logMessage("Fee Amount: " + feeAmount);
            break;
            //}
        }
        if (!iFound) {
            logMessage("Invoice not found");
            return false;
        }
    }
    else {
        logDebug("Error: could not retrieve invoice list: " + iListResult.getErrorMessage());
        return false;
    }

    //prepare payment
    //create paymentscriptmodel
    p = aa.finance.createPaymentScriptModel();
    p.setAuditDate(aa.date.getCurrentDate());
    p.setAuditStatus("A");
    p.setCapID(itemCap);
    p.setCashierID(p.getAuditID());
    p.setPaymentSeqNbr(p.getPaymentSeqNbr());
    p.setPaymentAmount(feeAmount);
    p.setAmountNotAllocated(feeAmount);
    p.setPaymentChange(0);
    p.setPaymentComment("Legacy Load Auto-Deduct");
    p.setPaymentDate(aa.date.getCurrentDate());
    p.setPaymentMethod("System: For Legacy Load");
    p.setPaymentStatus("Paid");
    p.setAcctID("1004");

    //create payment
    presult = aa.finance.makePayment(p);
    if (presult.getSuccess()) {
        //get additional payment information
        pSeq = presult.getOutput();
        logDebug("Payment successful");
        pReturn = aa.finance.getPaymentByPK(itemCap, pSeq, currentUserID);
        if (pReturn.getSuccess()) {
            pR = pReturn.getOutput();
            logDebug("PaymentSeq: " + pR.getPaymentSeqNbr());
        }
        else {
            logDebug("Error retrieving payment, must apply payment manually: " + pReturn.getErrorMessage());
            return false;
        }

    }
    else {
        logDebug("error making payment: " + presult.getErrorMessage());
        return false;
    }

    //apply payment
    //need to figure out how to get payment script model of resulting payment, and paymentFeeStatus and paymentIvnStatus
    feeSeqNbrArray = new Array();
    feeSeqNbrArray.push(feeSeqNbr);

    invNbrArray = new Array();
    invNbrArray.push(invNbr);

    feeAllocArray = new Array();
    feeAllocArray.push(feeAmount);

    applyResult = aa.finance.applyPayment(itemCap, pR.getPaymentSeqNbr(), feeAmount, feeSeqNbrArray, invNbrArray, feeAllocArray, aa.date.getCurrentDate(), "Paid", "Paid", pR.getCashierID(), null);

    if (applyResult.getSuccess()) {
        //get additional payment information
        apply = applyResult.getOutput();
        logDebug("Apply Payment Successful");
    }
    else {
        logDebug("error applying funds: " + applyResult.getErrorMessage());
        return false;
    }

    //generate receipt
    receiptResult = aa.finance.generateReceipt(itemCap, aa.date.getCurrentDate(), pR.getPaymentSeqNbr(), pR.getCashierID(), null);

    if (receiptResult.getSuccess()) {
        receipt = receiptResult.getOutput();
        logDebug("Receipt successfully created: "); // + receipt.getReceiptNbr());
    }
    else {
        logDebug("error generating receipt: " + receiptResult.getErrorMessage());
        return false;
    }

    //everything committed successfully
    logDebug("Exit: makePaymentForLegacy");
    return true;
}
