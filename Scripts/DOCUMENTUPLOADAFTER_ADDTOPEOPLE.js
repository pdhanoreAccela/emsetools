var refProfessionalId = "243173";
var capID = "14CAP-00000-00BBI";
var capDocResult = aa.document.getDocumentListByEntity(capID,"CAP");
if(capDocResult.getSuccess())
{
  if(capDocResult.getOutput().size() > 0)
  {
     for(index = 0; index < capDocResult.getOutput().size(); index++)
     {
          var documentModel = capDocResult.getOutput().get(index);
            documentModel.setUserName("testuser1");
          documentModel.setPassword("Password123");
	  documentModel.setModuleName("Building");

	if((documentModel.getSourceDocNbr()==null||documentModel.getSourceDocNbr()=="") && (documentModel.getSourceSpc()==null ||documentModel.getSourceSpc()==""))
	{
	  	var createDocResult = aa.document.createDocumentAssociation(documentModel, refProfessionalId, "REFCONTACT");
		if(createDocResult.getSuccess())
		{
			 aa.print("success!");
		}
		else
		{
			 aa.print("Fail!");      
		}	
	}
	else
	{
		aa.print("Fail!");   
	}

         
     }
  }
}
else
{
  aa.print("Get reference contact document failure!");
}



aa.env.setValue("ScriptReturnCode","0");
aa.env.setValue("ScriptReturnMessage","DocumentUploadAfter successful");