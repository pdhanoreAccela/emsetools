var contactModel = aa.env.getValue("Contact");
var newSelectedContactType = aa.env.getValue("selectedContactType");
var oldContactType = contactModel.getPeople().getContactType();

if("Business Owner".equals(newSelectedContactType))
{
                if (contantModel.getPeople().getEmail() != null)
                {
                                
                                aa.env.setValue("ScriptReturnCode", "0");
                                aa.env.setValue("ScriptReturnMessage", "Changed contact type to Business Owner.");
                }
                else
                {
                                aa.env.setValue("ScriptReturnCode", "-1");//return "-1" means change failed.
                                aa.env.setValue("ScriptReturnMessage", "Invalid contact type change.");
                }
                
}
else
{
                aa.env.setValue("ScriptReturnCode", "-1");//return "-1" means change failed.
                aa.env.setValue("ScriptReturnMessage", "Invalid contact type change.");
}