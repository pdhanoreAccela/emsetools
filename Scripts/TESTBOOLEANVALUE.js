if(getValidateBoolean()=="true")                                                  
{
	aa.debug("it's ok", "true");
}
else
{
 	aa.debug("it's fail","false");
}
                                                  
function getValidateBoolean()                         
{                                                     
   var returnObject = aa.cap.testBooleanValue("test");
   if (returnObject.getSuccess())                     
   {
   	return returnObject.getOutput();
   }                                                                                              
}