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
	
//----------------------Parameters-------------------------------------------------------------------------------------------------//

//It's not neccessary, you can provide it in notification template.
var from = "alex.zheng@beyondsoft.com";

//It's not neccessary, you can provide it in notification template.
var to = "felix.huang@achievo.com";

//It's not neccessary, you can provide it in notification template.
var cc = "ray.Xie@achievo.com";

//You must provide notification template name.
var emailTemplateName = "DOCUMENT UPLOAD AFTER";

//This is contact/LP id.
var entityID = "541333";

//If you provide contact id, this entity type variable is "REFCONTACT".
var entityType = "REFCONTACT";

//You must hard code an agency.
var servProvCode = "ADDEV";
var servProvCode = aa.env.getValue("servProvCode");

//You must hard code a cap id.
  var capID = "14CAP-00000-009DQ";
  //var capID = aa.env.getValue("capID");

//-------------------------------------------------------------------------------------------------------------------------------//

if(capID != null && capID != "")
{
var documentList = aa.env.getValue("DocumentModelList");
var currentTime = aa.date.getCurrentDate();
var year = currentTime.getYear()
var month = currentTime.getMonth();
var day = currentTime.getDayOfMonth();
var hour = currentTime.getHourOfDay();
var minute = currentTime.getMinute();
var second = currentTime.getSecond();
var params = aa.util.newHashtable();
params.put("$$servProvCode$$",servProvCode );
params.put("$$capID$$",capID);
params.put("$$uploadTime$$",month+"/"+day+"/"+year+"  "+hour+":"+minute+":"+second);
if(documentList.size() > 0)
{
var documentModel = documentList.get(0);
params.put("$$documentName$$","Document Name: " + documentModel.getFileName());
params.put("$$source$$","EDMS Source: " + documentModel.setSource());
params.put("$$description$$","Description: " + documentModel.setDocDescription());
}
aa.document.attachEmailToEntity(from,to,cc,emailTemplateName,params,null,entityID,entityType);
}

	
}


aa.env.setValue("ScriptReturnCode","0");
aa.env.setValue("ScriptReturnMessage", "successful");
main();