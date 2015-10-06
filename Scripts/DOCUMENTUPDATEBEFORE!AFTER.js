/*---- User intial parameters ----*/
var documentGroup = "ADVERTISEMENTS";
var requiredType = aa.util.newArrayList();
requiredType.add("agency certificate");
requiredType.add("Copy of Car registration");

var cond_type = "Required Documents";
var cond_name = "Required Documents to Pass Plan Review";
/*---- User intial parameters end ----*/

/*---- Inital environment parameters ----*/
var capIDModel = aa.env.getValue("CapID");
var servProvCode = aa.env.getValue("ServiceProviderCode");
/*---- Inital environment parameters end ----*/

function main()
{
	var documentList = aa.document.getDocumentListByEntity(capIDModel.toString(), "CAP").getOutput();
	var count = 0;
	if(documentList != null && documentList.size() > 0)
	{
		for(var i = 0; i < documentList.size(); i++)
		{
			var documentModel = documentList.get(i);
			var docStatus = documentModel.getDocStatus();
			var docReviewStatus = documentModel.getDocumentEntityAssociationModel().getStatus();
			documentModel.setDocStatus(docReviewStatus);
			aa.document.updateDocument(documentModel);
			
		}
	}
	
	
	
}

aa.env.setValue("ScriptReturnCode","0");
aa.env.setValue("ScriptReturnMessage", "successful");
main();