var capID = getCapID();
var from = "ethan.mo@achievo.com";
var to = "ethan.mo@achievo.com";
var cc = "ethan.mo@achievo.com";
var fileNames = [];
var templateName = "Receipt Summary";

aa.document.sendEmailAndSaveAsDocument(from, to, cc, templateName, getParams(), capID, fileNames);

function getParams()
{
	var params = aa.util.newHashtable();
	addParameter(params, "$$sessionNbr$$", "");
	addParameter(params, "$$transNBR$$", "");
	addParameter(params, "$$permitNBR$$", getAltID());
	addParameter(params, "$$businessDate$$", aa.env.getValue("PaymentDate"));
	
	addParameter(params, "$$todayDate$$", aa.date.getCurrentDate().toString());
	addParameter(params, "$$permitFeeDue$$", "");
	addParameter(params, "$$adminFeeDue$$", "");
	addParameter(params, "$$totalAmtPaid$$", aa.env.getValue("PaymentTotalPaidAmount"));
	addParameter(params, "$$operateID$$", aa.env.getValue("PaymentCashierId"));
	addParameter(params, "$$cashDrawerID$$", aa.env.getValue("PaymentRegisterId"));
	addParameter(params, "$$feeItems$$", aa.env.getValue("FeeItemsList"));
	addParameter(params, "$$totalInvoice$$", "");
	addParameter(params, "$$totalPaid$$", "");
	
	addParameter(params, "$$balance$$", "");
	addParameter(params, "$$paymentMethodAndAmount$$", aa.env.getValue("PaymentTotalAvailableAmount"));
	addParameter(params, "$$changeDue$$", "");
	addParameter(params, "$$cashAmount$$", "");
	addParameter(params, "$$checkAmount$$", "");
	addParameter(params, "$$checkTendered$$", "");
	addParameter(params, "$$refNBR$$", "");
	return params;
}

function addParameter(pamaremeters, key, value)
{
	if(key != null)
	{
		if(value == null)
		{
			value = "";
		}
		
		pamaremeters.put(key, value);
	}
}

function getCapID()
{
    var id1 = aa.env.getValue("PermitId1");
    var id2 = aa.env.getValue("PermitId2");
    var id3 = aa.env.getValue("PermitId3");
    return aa.cap.createCapIDScriptModel(id1, id2, id3);
}

function getAltID()
{
	var altID = "";
	var capScriptModel = aa.cap.getCap(getCapID().getCapID());
	if(capScriptModel.getSuccess() && capScriptModel.getOutput() != null)
	{
		altID = capScriptModel.getOutput().getCapModel().getAltID();
	}
	return altID;
}

function getCapPrimaryContactEmail(capIDModel)
{
	var capContactResult = aa.cap.getCapPrimaryContact(capIDModel);
	if (capContactResult.getSuccess())
	{
		var capContact = capContactResult.getOutput();
		if (capContact != null && capContact.getPeople() != null && capContact.getPeople().getEmail())
		{
			return capContact.getPeople().getEmail();
		}
	}
  return "";
}

aa.env.setValue("ScriptReturnCode","0");
aa.env.setValue("ScriptReturnMessage","Examination available.");