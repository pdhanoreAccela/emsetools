/*---- User intial parameters end ----*/

/*---- Inital environment parameters ----*/
var capIDModel = aa.env.getValue("CapID");
var servProvCode = aa.env.getValue("ServiceProviderCode");
/*---- Inital environment parameters end ----*/

function main()
{
		
	var documentList = aa.document.getDocumentListByEntity(capIDModel.toString(), "CAP").getOutput();
	
}

aa.env.setValue("ScriptReturnCode","0");
aa.env.setValue("ScriptReturnMessage", "test successful");
main();