var DocumentID= aa.env.getValue("DocumentID");
var DocumentModel =aa.env.getValue("DocumentModel");
var associationModel= aa.env.getValue("DocumentEntityAssociationModel");


aa.debug("publishcommentbefore@@@@@@@@@@@@@@@")
  aa.env.setValue("ScriptReturnMessage", "Prepare to publish document comments..")
  aa.env.setValue("ScriptReturnCode","0");