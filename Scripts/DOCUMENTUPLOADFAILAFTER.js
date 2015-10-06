var documentID=aa.env.getValue("documentID");
var documentName=aa.env.getValue("documentName");
var capID=aa.env.getValue("capID");
var customerID=aa.env.getValue("customerID");
var userEmail=aa.env.getValue("userEmail");
var firstName=aa.env.getValue("firstName");
var lastName=aa.env.getValue("lastName");
var subject= 'Document upload fail remander';
var content='Hi '+firstName+',Record Number:'+customerID+', Upload document('+documentName+') fail.'; 
aa.messageService.sendAnnouncement(userEmail,subject,content);
//send email
//aa.sendMail(FROM, TO, CC, SUBJECT, CONTENT);