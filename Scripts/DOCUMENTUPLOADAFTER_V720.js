/*------------------------------------------------------------------------------------------------------/
| BEGIN Event Specific Variables
/------------------------------------------------------------------------------------------------------*/
var docModelList = aa.env.getValue("DocumentModelList");
var serviceProviderCode = aa.env.getValue("ServiceProviderCode");
var capID = aa.env.getValue("CapID");
var callerId = aa.getAuditID();
var from = aa.env.getValue("From");
var uploadStatus = aa.env.getValue("UploadStatus");

var capIDList = aa.env.getValue("CapIDList");
var uploadFrom = aa.env.getValue("UploadFrom");

var ScriptReturnMessage;
var ScriptReturnCode;
var categorys = aa.util.newArrayList();

// category and task mapping relationship
var categoryTaskMap = aa.util.newHashMap();
categoryTaskMap.put("Apply PDF File","Application Acceptance,Building Review");
categoryTaskMap.put("Resubmitted PDF File","Building Review,Plan Review");
categoryTaskMap.put("Phia","Application Acceptance,Building Review,Final Processing");


//task and discipline mapping relationship
var taskDisciplineMap = aa.util.newHashMap();
taskDisciplineMap.put("Application Acceptance","License,Parcels");
taskDisciplineMap.put("Building Review","License,Parcels");
taskDisciplineMap.put("Final Processing","License,Parcels");


//report name configured in V360 admin report manager function
var reportName = "Project Manager"; 
var outputImageFormat = "GIF";
// max user size
var limit = 3;
//ONLY_DISTRICT, // matches the district but not matches the discipline
//ONLY_DISCIPLINE, // matches the discipline but not matches the district
//DISTRICT_AND_DISCIPLINE_MATCH, // matches both the discipline and the district
//ONLY_DISTRICT_OR_ONLY_DISCIPLINE_OR_DISTRICT_AND_DISCIPLINE_MATCH, // include ONLY_DISTRICT, ONLY_DISCIPLINE and FULL_MATCH
//ONLY_DISCIPLINE_OR_DISTRICT_AND_DISCIPLINE_MATCH; // include ONLY_DISCIPLINE and FULL_MATCH 
var degreeValue = "DISTRICT_AND_DISCIPLINE_MATCH";

/*------------------------------------------------------------------------------------------------------/
| END Event Specific Variables
/------------------------------------------------------------------------------------------------------*/

//Document begin count
var count = 1;   
//Mail from
var mailFrom = "Auto_Sender@Accela.com";
//Mail CC
var mailCC = "jacob.lu@achievo.com";     

aa.print("From is:" + from);
aa.print("CallerId is:" + callerId);
aa.print("ServiceProviderCode is:" + serviceProviderCode + "\n");

//If document list is not null
if(docModelList!="" && docModelList!=null)
{
	//Status reference to the value of column XDocument_Entity.Status, and we use it to filter the records which need not to auto assign reviewer.
	//For example, We want to auto assign reviewers to uploaded document when resubmit if the review status isn't "pass",
	//then we set it the value "pass". 
	var reviewStatus = "Pass";
	var originalDocStatus = "Resubmitted";
	var resubmitDocStatus = "Uploaded";

	//judge document operation status
	var docOperation = getDocOperation();
	if (docOperation == "OP_UPLOAD")
	{
  		afterUploadDocument();
	}
	else if (docOperation == "OP_CHECK_IN")
	{
  		afterCheckInDocument();
	}
	else if (docOperation == "OP_RESUBMIT")
	{
  		afterResubmitDocument();
	}
  
	if (uploadStatus == "false")
	{
		aa.env.setValue("ScriptReturnMessage", "Upload document failed");
		aa.env.setValue("ScriptReturnCode", "-1");
	}
	else
	{
		aa.env.setValue("ScriptReturnMessage", "Upload document successfully");
		aa.env.setValue("ScriptReturnCode", "0");
	}

	//print document info
	printDocumentInfo();
}
//else if no document was uploaded.
else
{
  aa.env.setValue("ScriptReturnMessage", "No document being uploaded..")
  aa.env.setValue("ScriptReturnCode","0");
}

//Judging document's operate.
function getDocOperation()
{
	var docModel = docModelList.get(0);
	if(docModel == null)
	{
		aa.print("docModel is null");
	}
	
	if(docModel.getCategoryByAction() == null || "".equals(docModel.getCategoryByAction()))
	{
		return "OP_UPLOAD";
	}
	//Judging it's check in
	else if("CHECK-IN".equals(docModel.getCategoryByAction()))
	{
		return "OP_CHECK_IN";
	}
	//Judging it's resubmit or normal upload.
	else if("RESUBMIT".equals(docModel.getCategoryByAction()))
	{
		return "OP_RESUBMIT";
	}
}

function printDocumentInfo()
{
	for (var j = 0; j < docModelList.size(); j++)
	{
		var docModel = docModelList.get(j);
		/*------------------------------------------------------------------------------------------------------/
		| BEGIN Print Common Info
		/------------------------------------------------------------------------------------------------------*/
		aa.print("Document Name["+count+"] is:" + docModel.getDocName());
		aa.print("File Name["+count+"] is:" + docModel.getFileName());
		aa.print("File Type["+count+"] is:" + docModel.getDocType());
		aa.print("EDMS Name["+count+"] is:" + docModel.getSource());
		aa.print("Department["+count+"] is:" + docModel.getDocDepartment());
		aa.print("Description["+count+"] is:" + docModel.getDocDescription());
		aa.print("Category["+count+"] is:" + docModel.getDocCategory() + "\n");
		/*------------------------------------------------------------------------------------------------------/
		| End Print Common Info
		/------------------------------------------------------------------------------------------------------*/
		
		//turn to next document.
		count++;
	}
}

/*
 * Judging it's normal upload.
 */
function afterUploadDocument()
{
	for (var j = 0; j < docModelList.size(); j++)
	{
		var docModel = docModelList.get(j);
		
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
						if(!categorys.contains(key))
						{
							categorys.add(key);
						}
					}
				}
			}
		}
	}
	
	if (capIDList != "" && capIDList != null)
	{
		if(capIDList.size() == 1)
		{
			doAutoAssign(capIDList.get(0), docModelList);
		}
		else
		{
			// Inspection result page ===> Here has multiple capIDs. 
			for (i = 0; i < docModelList.size(); i++)
			{
				var documentModel = docModelList.get(i);
				var capID = documentModel.getCapID();
				var assignDocList = aa.util.newArrayList();
				assignDocList.add(documentModel);
				doAutoAssign(capID, assignDocList);
			}
		}
	}
		
}

//auto assign
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
	if (scriptResult != null)
	{
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
	else
	{
		aa.print("ERROR: Get active task faild.");
		return null;
	} 
}


 function getNeedAssociateDocumentList(category, eligibleDocList)
 {
 	var assignDocList = aa.util.newArrayList();
 	for(var i = 0; i < eligibleDocList.size(); i++)
 	{
 		var docCategory = eligibleDocList.get(i).getDocCategory();
 		if(category.equals(docCategory))
 		{
 			assignDocList.add(eligibleDocList.get(i));
 		}
 	}
 	return assignDocList;
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
					//update document status after assign success
					for (var i = 0; i < assignDocList.size(); i++)
					{
						var assignDoc = assignDocList.get(i);
						assignDoc.setDocStatus("Assigned");
						var uploadDocNum = aa.document.updateDocument(assignDoc);
						if(uploadDocNum != null && uploadDocNum.getOutput() != null && uploadDocNum.getOutput() > 0)
						{
							aa.print("update document status to 'Assigned' successfully! ");
						}
					}
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
								var templateName = "RELATED_REVIEWERS";
								sendNotification(emailTo, templateName, getParamsForRelatedReviewers(docModel), null);
							}
						}
					}
				}
			}
		}
	}
}



/*
 * Judging it's check in
 */
function afterCheckInDocument()
{
	var it = docModelList.iterator();
	while(it.hasNext())
	{
		var docModel = it.next();
		if(docModel == null)
		{
			aa.print("docModel is null");
			break;
		}
		
		//get the original document of checkIn
		var originalDoc = aa.document.getDocumentByPK(docModel.getParentSeqNbr()).getOutput();
		
		// When document Check In, user can update document status in UI. But we can update it again in EMSE. 
		//1, Update document status (to Passed/Failed)
		updateDocumentStatus(originalDoc, docModel);
		
		//2, notice Applicant review result (failed or passed)
		noticeApplicant(originalDoc, docModel);
		
		//3, If review passed, Update workflow task status (to Completed)
		updateWorkflowTask(originalDoc);
	}
}

/*
 * Update document status (to Passed/Failed)
 */
function updateDocumentStatus(originalDoc, docModel)
{
	//review failed
	if (docModel.needResubmit())
	{
		//set document status as "Failed"
		originalDoc.setDocStatus("Failed");
	}
	else //review passed
	{
		//set document status as "Passed"
		originalDoc.setDocStatus("Passed");
	}
	//update document
	aa.document.updateDocument(originalDoc);
}

/*
 *	If review failed, send email with report and check-in document ACA URL to Applicant (designated contact type)
 *	If review passed, send review passed email to Applicant (designated contact type)
 */
function noticeApplicant(originalDoc, docModel)
{
	//get all contacts
	var contacts = aa.people.getCapContactByCapID(originalDoc.getCapID());	
	if(contacts.getSuccess())
	{
		//get cap model
		var capScriptModel = aa.cap.getCap(docModel.getCapID()).getOutput();
		for(var i = 0; i < contacts.getOutput().length; i++)
		{
			//get contact
			var contact = contacts.getOutput()[i].getCapContactModel();
			var contactType = contact.people.getContactType();
			var contactEmail = contact.people.getEmail();
			if("Applicant".equals(contactType))
			{
				//review failed		
				if(docModel.needResubmit())
				{
				
					var acaServer = "https://qa-server10.achievo.com/720/NYC";
					//get check-in document ACA URL
					var acaUrl = "";
					var acaUrlResult = aa.document.getACADocumentUrl(acaServer, docModel);
					if(acaUrlResult.getSuccess())
					{
						acaUrl = acaUrlResult.getOutput();
					}
					else
					{
						acaUrl = "System failed get ACA URL.";
						aa.env.setValue("ScriptReturnMessage", "System failed get ACA URL.");
					}
				
					var permit = aa.reportManager.hasPermission(reportName, callerId);
					if(permit.getOutput().booleanValue())
					{
						var report = aa.reportManager.getReportInfoModelByName(reportName);
						report = report.getOutput();
	
						var s_id1 = originalDoc.getCapID().getID1();
						var s_id2 = originalDoc.getCapID().getID2();
						var s_id3 = originalDoc.getCapID().getID3();
						
						//get cap id
						var capIDResult = aa.cap.getCapID(s_id1, s_id2, s_id3).getOutput();
						report.setCapId(capIDResult.toString());
						
						//get cap model
						var capResult = aa.cap.getCap(s_id1,s_id2,s_id3).getOutput();
						report.setModule(capResult.getCapModel().getModuleName()); // Setting the module
	
						//report parameters map, the map values Must be String types.
						var reportMap = aa.util.newHashMap();
						reportMap.put("P_SERV_PROV_CODE", serviceProviderCode);
						reportMap.put("P_DOC_SEQ_NBR", originalDoc.getDocumentNo() + "");
						reportMap.put("OUTPUTIMAGEFORMAT", outputImageFormat);
						
						report.getReportInfoModel().setReportParameters(reportMap);
	
						//get result for report 
						var reportResult = aa.reportManager.getReportResult(report);
						
						if(reportResult.getSuccess())
						{
							reportResult = reportResult.getOutput();
							
							//get report file for email
							var reportFile = aa.reportManager.storeReportToDisk(reportResult);
							reportFile = reportFile.getOutput();
							
							var templateName = "CHECK_IN_FAILED";
							var reportFiles = new Array();
							reportFiles[0] = reportFile;
							//get check-in template params
							var checkInParams = getParamsForCheckInFailed(originalDoc, acaUrl, contact, capScriptModel.getCapModel())
							sendNotification(contactEmail, templateName, checkInParams, reportFiles);
						}
						else
						{
							var templateName = "CHECK_IN_FAILED";
							//get check-in template params
							var checkInParams = getParamsForCheckInFailed(originalDoc, acaUrl, contact, capScriptModel.getCapModel())
							sendNotification(contactEmail, templateName, checkInParams, null);
							
							aa.env.setValue("ScriptReturnMessage", "System failed get report.");
						}
					}
					else
					{
						var templateName = "CHECK_IN_FAILED";
						//get check-in template params
						var checkInParams = getParamsForCheckInFailed(originalDoc, acaUrl, contact, capScriptModel.getCapModel())
						sendNotification(contactEmail, templateName, checkInParams, null);
						
						aa.env.setValue("ScriptReturnMessage", "You have no permission.");
					}
				}
				else //review passed
				{
					var templateName = "CHECK_IN_SUCCESS";
					//get check-in template params
					var checkInParams = getParamsForCheckInPassed(originalDoc, contact, capScriptModel.getCapModel());
					sendNotification(contactEmail, templateName, checkInParams, null);
				}
			
			}
		}
	}
}

/*
 * update work flow task
 */
function updateWorkflowTask(originalDoc)
{
	//get review tasks
	var result = aa.document.getRelatedReviewers(originalDoc.getDocumentNo(), null);
	if(result.getSuccess())
	{
		var reviewTasks = result.getOutput();
		if (reviewTasks != null && reviewTasks.size() > 0)
		{
			//get sysUserModel by callerId
			var sysUserModel = aa.people.getSysUserByID(callerId).getOutput();
			//get department
			var department = sysUserModel.getDeptOfUser();
		
			for (var i = 0; i < reviewTasks.size(); i++)
			{
				var reviewTask = reviewTasks.get(i);
				//check the review task is assign to current user or current department. 
				if (callerId.equals(reviewTask.getEntityID1()) 
				 || (department.equals(reviewTask.getEntityID()) && reviewTask.getEntityID1() == null ))
				{
				
					//If reviewTask.getEntityID2() and reviewTask.getEntityID3() is not null, the reviewTask is in the work flow. 
					if(reviewTask.getEntityID2() != null && reviewTask.getEntityID3() != null)
					{
						//get TaskItemModel
						var taskItemModel = aa.document.getTaskItemModel().getOutput();
						taskItemModel.setProcessID(reviewTask.getEntityID2());
						taskItemModel.setStepNumber(reviewTask.getEntityID3());
						
						//get all review Task in the work flow
						var reviewTaskInWorkflowResult = aa.document.getRelatedReviewers(null, taskItemModel);
					
						if(reviewTaskInWorkflowResult.getSuccess() && reviewTaskInWorkflowResult.getOutput() != null 
							&& reviewTaskInWorkflowResult.getOutput().size() > 0)
						{
							var isUpdateWorkflow = true;
							for(var j = 0; j < reviewTaskInWorkflowResult.getOutput().size(); j++)
							{
							
								var reviewTaskInWorkflow = reviewTaskInWorkflowResult.getOutput().get(j);
								if(! "reviewed".equals(reviewTaskInWorkflow.getStatus()))
								{
									isUpdateWorkflow = false;
									break;
								}
							}
							if(isUpdateWorkflow)
							{
								//get work flow
								var taskItemScript = aa.workflow.getTask(capID, reviewTask.getEntityID3(), reviewTask.getEntityID2());
								if(taskItemScript.getSuccess())
								{
									var taskItem = taskItemScript.getOutput().getTaskItem();
									//set disposition as "Passed". it is task status
									taskItem.setDisposition("Passed");
									//update work flow
									aa.workflow.editTask(taskItem,callerId);
								}
							}
						}
					}
				}
			}
		}
	}
	else
	{
		aa.print("ERROR: Failed to get reviewer tasks: " + result.getErrorMessage());
	}
}


/*
 * Judging it's resubmit
 */
function afterResubmitDocument()
{
	var it = docModelList.iterator();
	while(it.hasNext())
	{
		var docModel = it.next();
		if(docModel == null)
		{
			aa.print("docModel is null");
			break;
		}
		//Set resubmit document status as "Uploaded"
		docModel.setDocStatus(resubmitDocStatus);
		var affectResubmitDocNum = aa.document.updateDocument(docModel);
		if(affectResubmitDocNum != null && affectResubmitDocNum.getOutput() != null && affectResubmitDocNum.getOutput() > 0)
		{
			aa.print("The resubmit document status has been set to " + resubmitDocStatus);
		}
		//Get all original document associations by resubmit document model.
		var originalDocModel = aa.document.getOriginalDoc(docModel);
		if(originalDocModel != null && originalDocModel.getOutput() != null)
		{
		    //Set original document status as "Resubmitted"
			originalDocModel.getOutput().setDocStatus(originalDocStatus)
			var affectOriginalDocNum = aa.document.updateDocument(originalDocModel.getOutput());
			if(affectOriginalDocNum != null && affectOriginalDocNum.getOutput() != null && affectOriginalDocNum.getOutput() > 0)
			{
				aa.print("The original document status has been set to " + originalDocStatus);
			}
			var originalDocAssociationModels = aa.document.getRelatedReviewers(originalDocModel.getOutput().getDocumentNo(),null);
			if(originalDocAssociationModels != null && originalDocAssociationModels.getOutput() != null)
			{
				aa.print("Document["+count+"] is resubmit document. Below reviewers were auto assigned to it :");
				for(var j = 0; j<originalDocAssociationModels.getOutput().size(); j++)
				{
					var originalDocAssociationModel = originalDocAssociationModels.getOutput().get(j);
					//Filter records that the result is "Pass" and don't assign this reviewer review again.
					if(reviewStatus.equals(originalDocAssociationModel.getStatus()))
					{	
						continue;
					}
					//Get reviewer
					var reviewer = originalDocAssociationModel.getEntityID1();
					//Change the document sequence number from original to its own when we copy the original entity associations.
					originalDocAssociationModel.setDocumentID(docModel.getDocumentNo());
					//Set review status as null
					originalDocAssociationModel.setStatus(null);
					if(reviewer != null && reviewer != "")
					{
						//Add the associations as a new record for the resubmit document.
						var addedRecords = aa.document.assignReviewer(originalDocAssociationModel);	
						if(addedRecords.getOutput() > 0 )
						{
							aa.print(reviewer + "  has been auto assigned as reviewer successfully.");	
							// use user id to get the user info and get the user email.
							var reviewerResult = aa.people.getSysUserByID(reviewer);
							if(reviewerResult.getSuccess())
							{
								var emailTo = reviewerResult.getOutput().getEmail();
								if(emailTo != null)
								{								
									//sendEmail(emailTo,subject,emailContent,null);
									var templateName = "RESUBMIT_SUCCESS";
									//get cap model
									var capScriptModel = aa.cap.getCap(docModel.getCapID()).getOutput();
									//get resubmit template params
									var resubmitParams = getParamsForResubmit(docModel, capScriptModel.getCapModel(), reviewerResult.getOutput());
									sendNotification(emailTo, templateName, resubmitParams, null);
								}
								else
								{
									aa.print(reviewer + "  doesn't have email.");	
								}
							}
						}
						else
						{
							aa.print(reviewer + "  Auto assign failed \n");	
						}
					}
					
				}
			}
		}
	}
}


/*
 * get params for check-in passed
 */
function getParamsForCheckInPassed(originalDoc, contact, capModel)
{
	var params = aa.util.newHashtable();
	addParameter(params, "$$documentName$$", originalDoc.getDocName());
	addParameter(params, "$$capId$$", originalDoc.getCapID());
	addParameter(params, "$$applicantName$$", getPeopleFullName(contact.people));
	addParameter(params, "$$alternateID$$", capModel.getAltID());
	addParameter(params, "$$recordType$$", capModel.getAppTypeAlias());
	addParameter(params, "$$dueDate$$", aa.util.formatDate(aa.util.dateDiff(aa.util.now(), "DAY", 7), "yyyy-MM-dd hh:mm:ss"));
	return params;
}

/*
 * get params for check-in failed
 */
function getParamsForCheckInFailed(originalDoc, acaUrl, contact, capModel)
{
	var applicantName = "";
	if (contact != null && contact.people != null)
	{
	    applicantName = getPeopleFullName(contact.people);
	}
	var params = aa.util.newHashtable();
	addParameter(params, "$$acaUrl$$", acaUrl);
	addParameter(params, "$$documentName$$", originalDoc.getDocName());
	addParameter(params, "$$capId$$", originalDoc.getCapID());
	addParameter(params, "$$applicantName$$", applicantName);
	addParameter(params, "$$alternateID$$", capModel.getAltID());
	addParameter(params, "$$recordType$$", capModel.getAppTypeAlias());
	addParameter(params, "$$dueDate$$", aa.util.formatDate(aa.util.dateDiff(aa.util.now(), "DAY", 7), "yyyy-MM-dd hh:mm:ss"));
	return params;
}

/*
 * get params for related reviewers
 */
function getParamsForRelatedReviewers(docModel)
{
	var params = aa.util.newHashtable();
	addParameter(params, "$$documentName$$", docModel.getDocName());
	return params;
}

/*
 * get params for resubmit
 */
function getParamsForResubmit(docModel, capModel, reviewer)
{
	// use user id to get the user info and get the user Full Name.
	var reviewerResult = aa.people.getSysUserByID(callerId).getOutput();

	var params = aa.util.newHashtable();
	addParameter(params, "$$documentName$$", docModel.getDocName());
	addParameter(params, "$$reviewersName$$", getPeopleFullName(reviewer));
	addParameter(params, "$$reviewerName$$", getPeopleFullName(reviewerResult));
	addParameter(params, "$$alternateID$$", capModel.getAltID());
	addParameter(params, "$$recordType$$", capModel.getAppTypeAlias());
	addParameter(params, "$$documentUploadDate$$", docModel.getFileUpLoadDate());
	return params;
}

/*
 * add parameter
 */
function addParameter(pamaremeters, key, value)
{
	if(key != null)
	{
		if(value == null)
		{
			value = "";
		}
		pamaremeters.put(key, value);
	}
}

function getCapID()
{
	var cap_id = capIDList.get(0);
	var id1 = cap_id.getID1();
	var id2 = cap_id.getID2();
	var id3 = cap_id.getID3();
	return aa.cap.createCapIDScriptModel(id1, id2, id3);
}

/*
 * Get full name from PeopleModel.
 */
function getPeopleFullName(people) {
    var emptyString = /^\s*$/;
    var result = '';

    if (people != null) {
        result = people.getFullName();

        if (!result || emptyString.test(result)) {
            var firstName = people.getFirstName();
            var middleName = people.getMiddleName();
            var lastName = people.getLastName();

            if (firstName && !emptyString.test(firstName)) {
                result = firstName;
            }

            if (middleName && !emptyString.test(middleName)) {
                if (result && !emptyString.test(result)) {
                    result += ' ';
                }
                
                result += middleName;
            }

            if (lastName && !emptyString.test(lastName)) {
                if (result && !emptyString.test(result)) {
                    result += ' ';
                }

                result += lastName;
            }
        }
    }

    return result;
}

/*
 * Send notification
 */
function sendNotification(userEmailTo,templateName,params,reportFile)
{
	var result = null;
	result = aa.document.sendEmailAndSaveAsDocument(mailFrom, userEmailTo, mailCC, templateName, params, getCapID(), reportFile);
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