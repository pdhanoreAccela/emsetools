var docModelList = aa.env.getValue("DocumentModelList");
var serviceProviderCode = aa.env.getValue("ServiceProviderCode");
var capIDList = aa.env.getValue("CapIDList");
var uploadFrom = aa.env.getValue("UploadFrom");
var uploadStatus = aa.env.getValue("UploadStatus")
var ScriptReturnMessage;
var ScriptReturnCode;
var count = 0;
var categorys = aa.util.newArrayList();

var categoryTaskMap = aa.util.newHashMap();
categoryTaskMap.put("License Application","Application Acceptance,Building Review");
categoryTaskMap.put("Verify and Validate Application","Building Review");

var taskDisciplineMap = aa.util.newHashMap();
taskDisciplineMap.put("Application Acceptance","License,Parcels");
taskDisciplineMap.put("Building Review","License");

var limit = 3;
var degreeValue = "DISTRICT_AND_DISCIPLINE_MATCH";
var mailFrom = "Auto_Sender@Accela.com";
var mailCC = "ashley.zou@achievo.com";


if (docModelList != "" && docModelList != null) 
{
	var eligibleDocList = printDocInfo(docModelList);
	
	if (capIDList != "" && capIDList != null && eligibleDocList != null && eligibleDocList.size()>0)
	{
			if(capIDList.size() == 1)
			{
				doAutoAssign(capIDList.get(0), eligibleDocList);
			}
			else
			{
				// Inspection result page ===> Here has multiple capIDs. 
				 for (i = 0; i < eligibleDocList.size(); i++)
				 {
					var documentModel = eligibleDocList.get(i);
					var capID = documentModel.getCapID();
					var assignDocList = aa.util.newArrayList();
					assignDocList.add(documentModel);
					doAutoAssign(capID, assignDocList);
				 }
			}
	}

	aa.env.setValue("ScriptReturnMessage", "Upload document successfully");
	aa.env.setValue("ScriptReturnCode", "0");
} 
else 
{
	aa.env.setValue("ScriptReturnMessage", "No document being uploaded..")
	aa.env.setValue("ScriptReturnCode", "0");
}



/*
* print upload document info.
*/
function printDocInfo(docModelList) 
{
	var documentList = aa.util.newArrayList();
	var it = docModelList.iterator();
	while (it.hasNext()) 
	{
		var docModel = it.next();
		aa.print("File Name[" + count + "] is:" + docModel.getFileName());
		aa.print("File Type[" + count + "] is:" + docModel.getDocType());
		aa.print("EDMS Name[" + count + "] is:" + docModel.getSource());
		aa.print("Department[" + count + "] is:" + docModel.getDocDepartment());
		aa.print("Description[" + count + "] is:" + docModel.getDocDescription());
		aa.print("Category[" + count + "] is:" + docModel.getDocCategory());
		aa.print("Document Name[" + count + "] is:" + docModel.getDocName());
		aa.print(" ");
		count++;
		
		// If the doc category is the certain defined category, added.
		if(categoryTaskMap != null && categoryTaskMap.size() > 0)
		{
			var categoryIterator = categoryTaskMap.keySet().iterator();
			while(categoryIterator.hasNext())
			{
				var key = categoryIterator.next();
				if (key != null)
				{
					if (key.equals(docModel.getDocCategory())) 
					{
						documentList.add(docModel);
						if(!categorys.contains(key))
						{
							categorys.add(key);
						}
					}
				}
			}
		}
	}
	return documentList;
}


function doAutoAssign(capID, eligibleDocList)
{
	var activeTaskModelList = getActiveTask(capID);
	for (var i = 0; i < categorys.size(); i++)
	{
		// 1: Get active tasks of the current task.
		if (activeTaskModelList != "" && activeTaskModelList != null && activeTaskModelList.size()>0)
		{			
			// get all the documents for one defined category.
			var assignDocList = getNeedAssociateDocumentList(categorys.get(i), eligibleDocList);
			if(assignDocList != null && assignDocList.size()>0)
			{
				var tasksStr = categoryTaskMap.get(categorys.get(i));
				if(tasksStr != null && tasksStr != "")
				{
					var tasks = tasksStr.split(",");
					for(var k = 0; k < tasks.length; k++)
					{
						for (var j = 0; j < activeTaskModelList.size(); j++)
						{
							var taskItemModel = activeTaskModelList.get(j);
							var taskName = taskItemModel.getTaskDescription();
							if(tasks[k].equals(taskName))
							{
								// Create doc and task association to xdocument_entity table
								associateDoc2Task(assignDocList, taskItemModel);
								var disciplineList = aa.util.newArrayList();
								if (taskDisciplineMap != null && taskDisciplineMap.size() > 0)
								{
									var disciplineStr = taskDisciplineMap.get(taskName);
									if (disciplineStr!= null)
									{
										var disciplines = disciplineStr.split(",");
										for(var n = 0; n < disciplines.length; n++)
										{					
											disciplineList.add(disciplines[n]);
										}
									}
									// Map("key=disclipline1", "value=reviewers")
									var reviewersMap = getAutoAssignReviewers(capID, disciplineList);
									
									// 3: create doc and reviewer association to xdocument_entity table.
									associateReviewer2Doc(assignDocList, reviewersMap, taskItemModel);
									
									// 4: send notice email to reviewer: use doc id to get reviewers.
									sendEmail2RelatedReviewers(assignDocList,taskItemModel);
								}
							}
						}
					}
				}
			}
			
		}
	}
}


/*
 * Get active task .
 */
function getActiveTask(capID)
{
	var scriptResult = aa.document.getCapTaskByCapID(capID);
	if (scriptResult.getSuccess()) 
	{
		var taskItemModelList = scriptResult.getOutput();
		return taskItemModelList;
	} 
	else 
	{
		aa.print("ERROR: Get active task faild." + scriptResult.getErrorMessage());
		return null;
	}  
}


 function getNeedAssociateDocumentList(category, eligibleDocList)
 {
 	var assignDocList = aa.util.newArrayList();
 	for(var i = 0; i < eligibleDocList.size(); i++)
 	{
 		var docCategory = eligibleDocList.get(i).getDocCategory();
 		if(docCategory.equals(category))
 		{
 			assignDocList.add(eligibleDocList.get(i));
 		}
 	}
 	return assignDocList;
 }
 

/*
 * Associate document to task.
 */
function associateDoc2Task(eligibleDocList, needAssociateTaskList)
{
	var result = aa.document.associateDoc2Task(eligibleDocList, needAssociateTaskList);
	if(result.getSuccess())
	{
		var count = result.getOutput();
		aa.print("Assign tasks to documents successfully!");
		return count;
	}
	else
	{
		aa.print("ERROR: Failed to create document and task associations: " + result.getErrorMessage());
		return null;
	}
}



/*
 * Get auto assign reviewers by discipline.
 */
function getAutoAssignReviewers(capID,disciplineList)
{
	var result = aa.people.autoAssignReviewers(capID, disciplineList, limit, degreeValue);
	if(result.getSuccess())
	{
		var autoAssignReviewerMap = result.getOutput();
		return autoAssignReviewerMap;
	}
	else
	{
		aa.print("ERROR: Failed to get auto reviewers: " + result.getErrorMessage());
		return null;
	}
}

/*
 * associate reviewers to documents.
 */
function associateReviewer2Doc(assignDocList, reviewersMap, taskItemModel)
{
	var taskReviewers = aa.util.newArrayList();
	var taskName = taskItemModel.getTaskDescription();
	var disciplineStr = taskDisciplineMap.get(taskName);
	if(disciplineStr != null)
	{
		var disciplines = disciplineStr.split(",");
		if(reviewersMap != null && reviewersMap.size() > 0)
		{			
			for(var j = 0; j < disciplines.length; j++)
			{					
				var reviewersList = reviewersMap.get(disciplines[j]);
				if(reviewersList != null && reviewersList.size()>0)
				{
					taskReviewers.addAll(reviewersList);
				}
			}
			if (taskReviewers.size()>0)
			{
				var result = aa.document.associateReviewer2Doc(assignDocList, taskReviewers, taskItemModel);
				if(result.getSuccess())
				{
					aa.print("Assign reviewers to documents successfully for task " + taskName + "!");
				}
				else
				{
					aa.print("ERROR: Failed to assign reviewers to documents for task " + taskName + result.getErrorMessage());
				}
			}
		}
	}
}


/*
 * send email to related reviewers if we assign reviewers to document successfully.
 */
function sendEmail2RelatedReviewers(eligibleDocList,taskItemModel)
{
	for(var i = 0; i< eligibleDocList.size(); i++)
	{
		var docModel = eligibleDocList.get(i);
		var docID = docModel.getDocumentNo();
		// use document id to get the related reviewers.
		var result = aa.document.getRelatedReviewers(docID, taskItemModel);
		if(result.getSuccess())
		{
			var reviewers = result.getOutput();
			// send email to reviewers for every document
			if (reviewers != null && reviewers.size() > 0)
			{
				for (var j = 0; j < reviewers.size(); j++)
				{
					var userId = reviewers.get(j).getEntityID1();
					var subject = "Documents submission successfully, please help to review the document : " + docModel.getDocName();
					var emailContent = "This is an automated email notification.  Please do not reply to this email.";

					if(userId != null && userId != "")
					{		
						// use user id to get the user info and get the user email.
						var reviewerResult = aa.people.getSysUserByID(userId);
						if(reviewerResult.getSuccess())
						{
							reviewer = reviewerResult.getOutput();
							var emailTo = reviewer.getEmail();
							if(emailTo != null)
							{								
								sendEmail(emailTo,subject,emailContent);
							}
						}
					}
				}
			}
		}
	}
}

 /*
  * Send email.
  */
function sendEmail(userEmailTo,subject,emailContent)
{
	var result = aa.sendMail(mailFrom, userEmailTo, mailCC, subject, emailContent);
	if(result.getSuccess())
	{
		aa.log("Send email successfully!");
		return true;
	}
	else
	{
		aa.log("Fail to send mail.");
		return false;
	}
}

