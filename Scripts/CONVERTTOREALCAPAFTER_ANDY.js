var capId = getCapId();							// CapId object
var capModel = aa.cap.getCap(capId).getOutput().getCapModel();

if(capModel != null && capModel != ""){
	var capAltID = capModel.getAltID();  //Record ID String
	capAltID = capAltID + ".01";
	var result = aa.cap.updateCapAltID(capId, capAltID);
        if(result.getSuccess())
         {
            aa.env.setValue("capAltID",capAltID);
         }
}

function getCapId() {
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