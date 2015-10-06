var DocumentID= aa.env.getValue("DocumentID");
var DocumentModel =aa.env.getValue("DocumentModel");
var associationModel= aa.env.getValue("DocumentEntityAssociationModel");

var str="Documentation fail.  No actions executed."+DocumentModel.getEntityId();
str= str+associationModel.getEntityType()+" "+associationModel.getEntityID2()
aa.env.setValue("ScriptReturnCode", "-1"); 
aa.env.setValue("ScriptReturnMessage", str);
