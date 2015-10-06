var cap = aa.env.getValue("CapModel");
var capId = cap.getCapID();
var sysDate = aa.date.getCurrentDate(); 
var currentUserID = aa.env.getValue("CurrentUserID");
var systemUserObj = aa.person.getUser(currentUserID).getOutput();

aa.capCondition.createCapConditionFromStdCondition(capId, 10012219);

function addAppCondition(cType, cStatus, cDesc, cComment, cImpact) {
    var addCapCondResult = aa.capCondition.addCapCondition(capId, cType, cDesc, cComment, sysDate, null, sysDate, null, null, cImpact, systemUserObj, systemUserObj, cStatus, currentUserID, "A")
    if (addCapCondResult.getSuccess()) {        
        logDebug("Successfully added condition (" + cImpact + ") " + cDesc);
    }
    else {
        logDebug("**ERROR: adding condition (" + cImpact + "): " + addCapCondResult.getErrorMessage());
    }
}

function getCapId(id1, id2, id3) {

    var s_capResult = aa.cap.getCapID(id1, id2, id3);
    if (s_capResult.getSuccess())
        return s_capResult.getOutput();
    else {
        logDebug("**ERROR: Failed to get capId: " + s_capResult.getErrorMessage());
        return null;
    }
}

function logDebug(debug)
{
    aa.print(debug);
}