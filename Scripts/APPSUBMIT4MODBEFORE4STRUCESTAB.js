var licProfList = aa.env.getValue("LicProfList");
var ApplicationTypeLevel1 = aa.env.getValue("ApplicationTypeLevel1");
var ApplicationTypeLevel2 = aa.env.getValue("ApplicationTypeLevel2");
var ApplicationTypeLevel3 = aa.env.getValue("ApplicationTypeLevel3");
var ApplicationTypeLevel4 = aa.env.getValue("ApplicationTypeLevel4");

//need verification fields
var documentType = "Photos";
var recordType1 = "Building";
var recordType2 = "testQ";
var recordType3 = "testQ";
var recordType4 = "demo";

//validate record type
if (recordType1.equals(ApplicationTypeLevel1) && recordType2.equals(ApplicationTypeLevel2) 
	&& recordType3.equals(ApplicationTypeLevel3) && recordType4.equals(ApplicationTypeLevel4))
{
	//Validate all license professional's document by cap.
	var result = validateAllLpDoc();
	if (result)
	{
		aa.print("The record have required document by associated LP.");
	}
	else
	{
		aa.print("The record not have required document by associated LP.");
	}
	
	aa.env.setValue("ScriptReturnCode","0");
	aa.env.setValue("ScriptReturnMessage", "ApplicationSubmitBefore/Before");
}


/*
 * Validate all license professional's document by cap.
 */
function validateAllLpDoc()
{
	//1, get all associated license professional document.
	var documentList = getAssociatedLpDoc();
	//2, validate document
	var result = validateDoc(documentList);
	
	return result;
}

/*
 * get all associated license professional document.
 */
function getAssociatedLpDoc()
{
	var allDocumentList = aa.util.newArrayList();
	
	//multiple license professional
	if (licProfList != null && !"".equals(licProfList))
	{
		for (var i = 0; i < licProfList.size(); i++)
		{
			var licProf = licProfList.get(i);
			//get document by entity for LP.
			var documentListResult = aa.document.getDocumentListByEntity(licProf.getLicSeqNbr(), "LICENSEPROFESSIONAL");
			var documentList = documentListResult.getOutput();
			
			allDocumentList.addAll(documentList);
		}
	}
	//single license professional
	else
	{
		var licSeqNbr = aa.env.getValue("CAEValidatedNumber");
		
		if (licSeqNbr != null && !"".equals(licSeqNbr))
		{
			//get document by entity for LP.
			var documentListResult = aa.document.getDocumentListByEntity(licSeqNbr, "LICENSEPROFESSIONAL");
			var documentList = documentListResult.getOutput();
			
			allDocumentList.addAll(documentList);
		}
	}
	
	return allDocumentList;
}


/*
 * Validate document.
 */
function validateDoc(documentList)
{
	var result = false;
	for (var i = 0; i < documentList.size(); i++)
	{
		var documentModel = documentList.get(i);
		
		if (documentType.equals(documentModel.getDocCategory()))
		{
			result = true;
			break;
		}
	}
	return result;
}

