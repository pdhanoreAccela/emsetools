aa.env.setValue("ScriptReturnCode","0");
aa.print("Edit Daily Contact Start:");

var contactModel = aa.env.getValue("Contact");
aa.people.editContactByCapContact(contactModel);

aa.print("Edit Daily Contact End:");
aa.env.setValue("ScriptReturnMessage", "Edit Daily Contact successful");