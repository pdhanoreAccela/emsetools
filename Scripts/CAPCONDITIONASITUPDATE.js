//var myCapId = "P14BP00227"
//var myCapId = "BLD14-00012";

//wfTask = "Invoicing";	
//wfStatus = "Invoice Fees";
aa.env.setValue("EventName","ApplicationConditionUpdateAfter");
//aa.env.setValue("EventName","WorkflowTaskUpdateAfter");
////aa.env.setValue("EventName","AssociateAssetToWorkOrderAfter");
//aa.env.setValue("EventName","ApplicationSubmitBefore");
//var myCapId = "DE-AIRSS-55555-5555";
//var myCapId = "P14BP00321";
var myCapId = "14CAP-00008738";
var chCapId = "14CAP-00008739";
var myUserId = "ADMIN";

var myCapIDModel = aa.cap.getCapID(myCapId).getOutput();
var chCapIDModel = aa.cap.getCapID(chCapId).getOutput();

wfTask="Admin Review";
wfStatus="Notes";

var conditionId = "239287";
var childCondId = "239288";	

var conditionObj=aa.capCondition.getCapCondition(myCapIDModel, conditionId).getOutput();
//var controlString = "ApplicationConditionAddAfter"; 	// Standard Choice Starting Point
//var controlString = "WorkflowTaskUpdateAfter"; 	// Standard Choice Starting Point
var controlString = "ApplicationConditionUpdateAfter"; 	// Standard Choice Starting Point
var preExecute = "PreExecuteForAfterEvents";  	// Standard choice to execute first (for globals, etc) (PreExecuteForAfterEvent or PreExecuteForBeforeEvents)


//var controlString = "ApplicationSubmitBefore"; 	// Standard Choice Starting Point
//var preExecute = "PreExecuteForBeforeEvents"  	// Standard choice to execute first (for globals, etc) (PreExecuteForAfterEvent or 

var runEvent = true; // set to false if you want to roll your own code here in script test
/* master script code don't touch */ var tmpID = aa.cap.getCapID(myCapId).getOutput(); if(tmpID != null){aa.env.setValue("PermitId1",tmpID.getID1()); 	aa.env.setValue("PermitId2",tmpID.getID2()); 	aa.env.setValue("PermitId3",tmpID.getID3());} aa.env.setValue("CurrentUserID",myUserId); var preExecute = "PreExecuteForAfterEvents";var documentOnly = false;var SCRIPT_VERSION = 3.0;var useSA = false;var SA = null;var SAScript = null;var bzr = aa.bizDomain.getBizDomainByValue("MULTI_SERVICE_SETTINGS","SUPER_AGENCY_FOR_EMSE"); if (bzr.getSuccess() && bzr.getOutput().getAuditStatus() != "I") { 	useSA = true; 		SA = bzr.getOutput().getDescription();	bzr = aa.bizDomain.getBizDomainByValue("MULTI_SERVICE_SETTINGS","SUPER_AGENCY_INCLUDE_SCRIPT"); 	if (bzr.getSuccess()) { SAScript = bzr.getOutput().getDescription(); }	}if (SA) {	eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS",SA));	eval(getScriptText("INCLUDES_ACCELA_GLOBALS",SA));	/* force for script test*/ showDebug = true; eval(getScriptText(SAScript,SA));	}else {	eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS"));	eval(getScriptText("INCLUDES_ACCELA_GLOBALS"));	}	eval(getScriptText("INCLUDES_CUSTOM"));if (documentOnly) {	doStandardChoiceActions(controlString,false,0);	aa.env.setValue("ScriptReturnCode", "0");	aa.env.setValue("ScriptReturnMessage", "Documentation Successful.  No actions executed.");	aa.abortScript();	}var prefix = lookup("EMSE_VARIABLE_BRANCH_PREFIX",vEventName);var controlFlagStdChoice = "EMSE_EXECUTE_OPTIONS";var doStdChoices = true;  var doScripts = false;var bzr = aa.bizDomain.getBizDomain(controlFlagStdChoice ).getOutput().size() > 0;if (bzr) {	var bvr1 = aa.bizDomain.getBizDomainByValue(controlFlagStdChoice ,"STD_CHOICE");	doStdChoices = bvr1.getSuccess() && bvr1.getOutput().getAuditStatus() != "I";	var bvr1 = aa.bizDomain.getBizDomainByValue(controlFlagStdChoice ,"SCRIPT");	doScripts = bvr1.getSuccess() && bvr1.getOutput().getAuditStatus() != "I";	}	function getScriptText(vScriptName){	var servProvCode = aa.getServiceProviderCode();	if (arguments.length > 1) servProvCode = arguments[1]; vScriptName = vScriptName.toUpperCase();		var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();	try {		var emseScript = emseBiz.getScriptByPK(servProvCode,vScriptName,"ADMIN");		return emseScript.getScriptText() + "";			} catch(err) {		return "";	}} logGlobals(AInfo); if (runEvent && doStdChoices) doStandardChoiceActions(controlString,true,0); if (runEvent && doScripts) doScriptActions(); var z = debug.replace(/<BR>/g,"\r");  aa.print(z);
//
// User code goes here

// ASIT Group Name & Update Field Name
var asitGroupName = "20140627ASIT SUBGROUP";
var asitFieldName = "Production";

/*
 * DEV_LYNDA_WACHT is not defined. Please remove it.
 * "4398" is old child condition id. Update to childCondId.
 * "P14BP00341" is old child alt id. Update to chCapId.
 */
editStdConditionASIT(conditionId, childCondId, chCapIDModel);
//editStdConditionASIT(conditionId);

function editStdConditionASIT(thisCondNumberPar, childCondId, chCapIDModel) { // optional cap ID 
	var itemCap = myCapIDModel; 
	var retMsg = "";
	var retStatus = true;
	var cSeqNbr=null;
	var nbrCondUpdated=0;
	var childArr = new Array();
	if (arguments.length == 4) itemCap = arguments[3]; // use cap ID specified in args
	var thisResultPar = aa.capCondition.getCapCondition(itemCap, thisCondNumberPar);
	if (thisResultPar.getSuccess()) {
		condCurrPar = thisResultPar.getOutput();
		templateModelPar = condCurrPar.getTemplateModel();
		if(templateModelPar!=null){
			var templateGroups = templateModelPar.getTemplateForms();
			var thisResultChild = aa.capCondition.getCapCondition(chCapIDModel, childCondId);
			if (thisResultChild.getSuccess()) {
				condCurrChild = thisResultChild.getOutput();
				templateModelChild = condCurrChild.getTemplateModel();
				if(templateModelChild != null){
					var allTableValue = getTemplateValueByTable(templateModelPar, asitGroupName, asitFieldName);
					var colNames = new Array();
					colNames[0] = asitFieldName;
					InsertTemplateTableRow(templateModelChild, asitGroupName, allTableValue, colNames) 
					condCurrChild.setTemplateModel(templateModelChild);
					var result = aa.capCondition.editCapCondition(condCurrChild);
					if (result.getSuccess())
					{
						aa.print("Success: Update condition num:" + result.getOutput());
					}
					else
					{
						aa.print("ERROR: " + result.getErrorMessage());
					}
					
					//setTemplateValueByTableRow(templateModelPar, "BUILDING CONDITION RECORD TYPE", "Record Type", ll, allTableValue[ll]);
				}
			}
		}		
	}
	return retStatus;
}

function getTemplateValueByTable(templateModel, subGroupName, fieldName) {
    var valueAttributes = getTableValueAttributesByName(templateModel.getTemplateTables(), subGroupName, fieldName);
    if (valueAttributes != null && valueAttributes.length > 0) {
        var values = new Array();
        for (var rowIndex = 0; rowIndex < valueAttributes.length; rowIndex++) {
            values.push(valueAttributes[rowIndex].getValue());
        }
        return values;
    }

    return null;
}

function getFieldAttributeByName(templateGroups, subGroupName, fieldName) {
    logDebug("ENTER: getFieldAttributeByName");
    if (templateGroups == null || templateGroups.size() == 0) {
        return null;
    }
    var subGroups = templateGroups.get(0).getSubgroups();
    for (var subGroupIndex = 0; subGroupIndex < subGroups.size(); subGroupIndex++) {
        var subGroup = subGroups.get(subGroupIndex);
        //logDebug(subGroup.getSubgroupName());
        if (subGroupName == subGroup.getSubgroupName()) {
            var fields = subGroup.getFields();
            for (var fieldIndex = 0; fieldIndex < fields.size(); fieldIndex++) {
                var field = fields.get(fieldIndex);
                //logDebug(field.getDisplayFieldName());
                if (field.getDisplayFieldName() == fieldName) {
                    return field;
                }
            }
        }
    }
    logDebug("EXIT: getFieldAttributeByName");
}

function InsertTemplateTableRow(templateModel, tableSubgroup, tablevalue, colNames) {
    logDebug("ENTER: InsertTemplateTableRow");

    var aTable = "";
    var copyStr = " aTable = tablevalue;"
    eval(copyStr);
    var templateGroups = templateModel.getTemplateTables();
    var subGroups = templateGroups.get(0).getSubgroups();
    //get the ASIT Group Name, set it to new row.
    var groupName = templateGroups.get(0).getGroupName();
	
    for (var subGroupIndex = 0; subGroupIndex < subGroups.size(); subGroupIndex++) {
        var subGroup = subGroups.get(subGroupIndex);
		// get the row index of old rows.
		var subGroupRowsSize = 0;
		if (subGroup.getRows() != null)
		{
			subGroupRowsSize =  subGroup.getRows().size();
		}	
		if (tableSubgroup == subGroup.getSubgroupName()) {
			var rows = aa.util.newArrayList();
			if (typeof (aTable) == "object") {
				for (var valuesInt = 0; valuesInt < tablevalue.length; valuesInt++) 
				{
					var fld = aa.util.newArrayList();
					for (var idx = 0; idx < colNames.length; idx++) 
					{
						logDebug("Vote for Pedro: " + tableSubgroup);
						var v = aa.proxyInvoker.newInstance("com.accela.aa.template.field.GenericTemplateTableValue").getOutput();
						v.setFieldName(colNames[idx]);
						//aTable[y][colNames[idx]] is incorrect.
                        v.setValue(tablevalue[valuesInt]);
						//v.setValue(aTable[y][colNames[idx]]);
						// required value when update DB.
						v.setRowIndex(subGroupRowsSize+valuesInt+1);
						v.setSubgroupName(tableSubgroup);
						v.setGroupName(groupName);
						fld.add(v);
					}
					var t = aa.proxyInvoker.newInstance("com.accela.aa.template.subgroup.TemplateRow").getOutput();
					t.setValues(fld);
					rows.add(t);
					logDebug("Row added");
				}
			}
			// add the old rows, or it will clear the old rows.
			if (subGroup.getRows() != null)
			{
				rows.addAll(subGroup.getRows());
			}	
		
			subGroup.setRows(rows);
			var rows = subGroup.getRows();
			logDebug(rows.size());
			if (rows == null || rows.size() == 0) {
				return null;
			}
        }
    }
    logDebug("EXIT: InsertTemplateTableRow");
}

function getTableValueAttributesByName(templateGroups, subGroupName, fieldName) {
    var field = getFieldAttributeByName(templateGroups, subGroupName, fieldName);
    if (field == null) {
        return null;
    }
    var subGroups = templateGroups.get(0).getSubgroups();
    for (var subGroupIndex = 0; subGroupIndex < subGroups.size(); subGroupIndex++) {
        var subGroup = subGroups.get(subGroupIndex);
        if (subGroupName == subGroup.getSubgroupName()) {
            var postion = subGroup.getFields().indexOf(field);
            var valueAttributes = new Array();
            var rows = subGroup.getRows();
            if (rows == null || rows.size() == 0) {
                return null;
            }
            for (var rowIndex = 0; rowIndex < rows.size(); rowIndex++) {
                valueAttributes.push(rows.get(rowIndex).getValues().get(postion));
            }
            return valueAttributes;
        }
    }
    return null;
}


//var retArr = new Array();
//retArr = getPimaContactInfo();
//logDebug("phone: " + retArr["contPhone"]);

function getPimaContactInfo() //optional capId
{
	var itemCap = capId;
	if (arguments.length == 1) itemCap = arguments[0];
	var retArray = false;
	var recdAlias = cap.getCapType().getAlias();
	var contBsnsName = lookup("REPORT_CONFIG", recdAlias+"|DepartmentContact");
	var retArray = new Array();
	if(!contBsnsName){
		logDebug("There is no Department Contact for " + recdAlias);
	}else{
		var conRes = aa.people.getPeopleByBusinessName(contBsnsName);
		contArray = conRes.getOutput();
		for (con in contArray){
			if(contArray[con]["contactType"].toUpperCase().equals("PC DEPARTMENT CONTACT")){
				var peopResult = aa.people.getPeople(contArray[con]["contactSeqNumber"]);
				if (peopResult.getSuccess()) {
					peopRes = peopResult.getOutput();
					logDebug("phone: " +  peopRes.getPhone3());
					retArray["contPhone"]=peopRes.getPhone3();
					var peopResAttr = aa.people.getPeopleAttributeByPeople(28, "URL");
					for (x in peopRes){
						if (typeof(peopRes[x])!="function"){
							logDebug(x + "     " + peopRes[x]);
						}
					}
					if (peopResAttr.getSuccess()) {
						peopResAttrOut = peopResAttr.getOutput();
						var peopResAttrOut=peopRes.getAttributes(); 
						logDebug("peopResAttrOut: " + peopResAttrOut);
						for (x in peopResAttrOut){
						  if (typeof(peopResAttrOut[x])!="function"){
							  logDebug(x + "     " + peopResAttrOut[x]);
							}
						}/*
						if (peopAttr != null) {
							for (var xx1 in peopAttr) {
								this.asi[peopAttr[xx1].attributeName] = peopAttr[xx1];
								logDebug(this.asi[peopAttr[xx1].attributeName]);
								this.validAttrs = true; 
								logDebug("This record has valid attributes");
							}
						}
						for (var subGroupName in gArray) {
							var fieldArray = gArray[subGroupName];
							//logDebug("subGroupName: "+subGroupName);
							if (subGroupName.toString().toUpperCase()==vAppSpecSubGroup.toString().toUpperCase()) {
								for (var fVal in fieldArray) {
									//logDebug(fVal + " : " + fieldArray[fVal]);
									if(fVal.toString().toUpperCase()==vAppSpecName.toString().toUpperCase()) {
										return fieldArray[fVal]
									}
								}
							}
						}
						//logDebug(contArray[con]["contactSeqNumber"]);
						//retArray["contWebsite"]=ccsm.;*/
					}
				}
			}
		}
	}
	return retArray;
}
//logDebug(appHasCondition("Required Documentation",null,dr,null)) ;


// end user code

aa.env.setValue("ScriptReturnCode", "1");  aa.env.setValue("ScriptReturnMessage", debug)