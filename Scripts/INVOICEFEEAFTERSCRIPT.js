var startDate = new Date();
var startTime = startDate.getTime();
var message =	"";							// Message String
var debug = "";								// Debug String
var br = "<BR>";							// Break Tag
var feeSeqList = new Array();						// invoicing fee list
var paymentPeriodList = new Array();					// invoicing pay periods

logDebug(br + "EMSE Script Results");
var eventName = aa.env.getValue("EventName");
logDebug(br + "EventName: " + eventName);
var capId = getCapId();	
var servProvCode = capId.getServiceProviderCode()       		// Service Provider Code
var currentUserID = aa.env.getValue("CurrentUserID");   		// Current User
var capIDString = capId.getCustomID();
var statusDate  = aa.env.getValue("StatusDate");
var cfID = aa.env.getValue("CFID");
var cfToken  = aa.env.getValue("CFTOKEN");
showCapInfo();
if(statusDate != null)
{
    logDebug(br + "StatusDate: " + statusDate);
}
if(cfID != null)
{
    logDebug(br + "CFID: " + cfID);
}
if(cfToken != null)
{
    logDebug(br + "CFTOKEN: " + cfToken);
}
showInvoiceInfo();
showFeeItemInfo();

function showCapInfo()
{
    logDebug(br + "CapID; " + capId.toString());
    logDebug(br + "CustomID: " + capIDString);
    logDebug(br + "CurrentUserID: " + currentUserID);
}

function showInvoiceInfo()
{
    var invoiceNbrArray  = aa.env.getValue("InvoiceNbrArray");
    if(invoiceNbrArray != null && invoiceNbrArray.length  > 0)
    {
    	for(var i=0; i<invoiceNbrArray.length ; i++)
    	{
    	    logDebug(br + "Invoice Number: " + invoiceNbrArray[i]);
    	}
    }
}

function showFeeItemInfo()
{
    var feeItemsSeqNbrArray = aa.env.getValue("FeeItemsSeqNbrArray");
    if(feeItemsSeqNbrArray != null && feeItemsSeqNbrArray.length  > 0)
    {
        for(var i=0; i<feeItemsSeqNbrArray.length ; i++)
        {
            logDebug(br + "Fee Item Sequence Number: " + feeItemsSeqNbrArray[i]);
        }
    }
}	

function getCapId()  {

    var s_id1 = aa.env.getValue("PermitId1");
    var s_id2 = aa.env.getValue("PermitId2");
    var s_id3 = aa.env.getValue("PermitId3");

    var s_capResult = aa.cap.getCapID(s_id1, s_id2, s_id3);
    if(s_capResult.getSuccess())
      return s_capResult.getOutput();
    else
    {
      logMessage("**ERROR: Failed to get capId: " + s_capResult.getErrorMessage());
      return null;
    }
  }

aa.env.setValue("ScriptReturnMessage", debug);

function logMessage(dstr)
	{
	message+=dstr + br;
	}


function logDebug(dstr)
	{
	debug+=dstr + br;
	}