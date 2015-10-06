var from = "alex.zheng@beyondsoft.com";
var to = "felix.huang@beyondsoft.com";
var cc = "Ray.Xie@beyondsoft.com";
var emailTemplateName = "REFERENCE CONTACT DOC DEMO";
var attachments = null;
var entityID = "542266";
var entityType = "REFCONTACT";

var servProvCode = aa.env.getValue("ServiceProviderCode");
var capID = aa.env.getValue("CapID");
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
aa.document.attachEmailToEntity(from,to,cc,emailTemplateName,params,attachments,entityID,entityType);
}