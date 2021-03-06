var showMessage = true			// Set to true to see results in popup window
var showDebug = true			// Set to true to see debug messages in popup window
var message = "";				// Message String
var debug = "debug information: <br>";					// Debug String
var sReturnCode="0";
var br ="<BR>";

// to check the reason for void the fee items is valid?
var capId = getCapId();							// CapId object
//var cap = aa.cap.getCap(capId).getOutput();	// Cap object
var capIDString = capId.getCustomID();			// alternate cap id string
var reason  = aa.env.getValue("Reason");
var comment = aa.env.getValue("Comment");
var s_id1 = aa.env.getValue("PermitId1");
var s_id2 = aa.env.getValue("PermitId2");
var s_id3 = aa.env.getValue("PermitId3");
var statusDate = aa.env.getValue("StatusDate");

sReturnCode = checkReasonForVoidFee(reason);

var feeItemsSeqNbrArray = aa.env.getValue("FeeItemsSeqNbrArray"); //fee item list in string type
var invoiceNbrList = aa.env.getValue("InvoiceNbrArray");         //invoice number list in string type
  
logDebug("voiding fee for cap: " + capIDString);
logDebug("Void Fee Reason: " + reason);
logDebug("Void Fee comment: " + comment);
logDebug("Void Fee for Cap: "+ s_id1+"-"+s_id2 + "-" + s_id3);
logDebug("Status Date: "+ statusDate );

for(item in feeItemsSeqNbrArray)
{
  logDebug("fee item number: "+ feeItemsSeqNbrArray[item]);
}
  
for(inv in invoiceNbrList)
{
  logDebug("Invoice Number: "+ invoiceNbrList[inv]);
}
  
function checkReasonForVoidFee(reason)
{
if("Void Invoice" == reason)
{
 logMessage("The reason (" + reason +") is valid.<BR>");
 logDebug("The reason (" + reason +") is valid.<BR>");
 return "0"; // the reason is valid
}else
{

 logMessage("<font color='red'>ERROR: The reason (" + reason +") is not valid.</font><BR>");
 logDebug("<font color='red'> ERROR: The reason (" + reason +") is not valid.</font><BR>");
 return "-1"; // the reason is not valid and will stop void the fee
}
}

function getCapId()  {
    var s_id1 = aa.env.getValue("PermitId1");
    var s_id2 = aa.env.getValue("PermitId2");
    var s_id3 = aa.env.getValue("PermitId3");
    var s_capResult = aa.cap.getCapID(s_id1, s_id2, s_id3);
    if(s_capResult.getSuccess())
	{
	    return s_capResult.getOutput();
	}
    else
    {
      logMessage("**ERROR: Failed to get capId: " + s_capResult.getErrorMessage());
      return null;
    }
  }
  	
aa.env.setValue("ScriptReturnCode", sReturnCode);
if(debug.indexOf("ERROR") > 0 )
{
  aa.env.setValue("ScriptReturnMessage", debug);
}
else
{
  if(showDebug)
  {
     aa.env.setValue("ScriptReturnMessage", debug);
  }
  if(showMessage)
  {
     aa.env.setValue("ScriptReturnMessage", message);
  }
}


function logDebug(dstr)
{
	debug += dstr + br;
}
	
function logMessage(dstr)
{
	message += dstr + br;
}