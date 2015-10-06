var providerEventModels = aa.env.getValue("providerEventModels");
var contactNbrArr = aa.env.getValue("contactNbrArr");
var isUndoAssignment = aa.env.getValue("isUndoAssignment");

function main()
{
aa.print(providerEventModels.size());
aa.print(contactNbrArr.length );
aa.print(isUndoAssignment );


}
main();
aa.env.setValue("ScriptReturnCode","0");
aa.env.setValue("ScriptReturnMessage","EMSE  successful");