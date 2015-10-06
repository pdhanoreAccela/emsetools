//aa.env.setValue("PermitId1","10CAP");
//aa.env.setValue("PermitId2","00000");
//aa.env.setValue("PermitId3","003CX");
var br = "<BR>";
var debug = "";
var message = "";

logDebug("EMSE Script Results");
var capId = getCapId();

if(capId != null)
{
    showCapInfo();
    capDetailModel = getCapDetail();
}

 
function showCapInfo()
{
    logDebug("CapID: " + capId.toString());
    logDebug("AgencyID: " + capId.getServiceProviderCode());
}

function showCapDetail()
{
    var date = capDetailModel.getAppStatusDate();
    logDebug("Description: " + capDetailModel.getDisposition());
    logDebug("Total Fee: " + capDetailModel.getTotalFee());
    logDebug("Total Pay: " + capDetailModel.getTotalPay());
    logDebug("Balance: " + capDetailModel.getBalance());
    logDebug("App Status Date: " + date.getMonth() + "/" + date.getDayOfMonth() + "/" + date.getYear());
}

function getCapId()  
{
    var s_id1 = aa.env.getValue("PermitId1");
    var s_id2 = aa.env.getValue("PermitId2");
    var s_id3 = aa.env.getValue("PermitId3");

    var s_capResult = aa.cap.getCapIDModel(s_id1, s_id2, s_id3);
    if(s_capResult.getSuccess())
    {
      return s_capResult.getOutput();
    }  
    else 
    {
      aa.print("ERROR: Failed to get capId: " + s_capResult.getErrorMessage());
      return null;
    }
}

function getCapType()
{
    var capType = aa.env.getValue("ApplicationTypeLevel1");
    capType = capType + "/" + aa.env.getValue("ApplicationTypeLeve2");
    capType = capType + "/" + aa.env.getValue("ApplicationTypeLeve3");
    capType = capType + "/" + aa.env.getValue("ApplicationTypeLeve4");


}

function getCapDetail()
{
    var capDetailResult = aa.cap.getCapDetail(capId);
    if(capDetailResult.getSuccess())
    {
        return capDetailResult.getOutput();
    }
    else 
    {
      aa.print("ERROR: Failed to get capDetail: " + s_capDetailResult.getErrorMessage());
      return null;
    }

}
aa.env.setValue("ScriptReturnMessage", debug);

function logDebug(dstr)
	{
	debug+=dstr + br;
	}