aa.print("AutoPayAfter");

 
aa.print("PEOPLE_SEQUENCE_NBR =" + aa.env.getValue("PEOPLE_SEQUENCE_NBR "));
aa.print("PEOPLE_TYPE=" + aa.env.getValue("PEOPLE_TYPE"));
 
aa.env.setValue("ScriptReturnCode","0");
aa.env.setValue("ScriptReturnMessage","AutoPayAfter successful");