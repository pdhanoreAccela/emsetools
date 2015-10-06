var username = aa.env.getValue("Username");
var publicUserModel = aa.publicUser.getPublicUserByUserId(username).getOutput();
var userSeqNum= publicUserModel.getUserSeqNum();
var returnCode = "-1";
var returnMessage = "Your license (" + username + ") is invalid.";
aa.env.setValue("ReturnCode", returnCode);
aa.env.setValue("ReturnMessage", returnMessage);
