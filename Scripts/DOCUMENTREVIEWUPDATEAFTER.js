

		//Get document review model from event parameter.
		var documentReviewModel = aa.env.getValue("DocumentReviewModel");
		//Get document review task information from the review model.
		var servProvCode = documentReviewModel.getServiceProviderCode();
		var documentID = documentReviewModel.getDocumentID();
		var processID = documentReviewModel.getEntityID2();
		var stepNum = documentReviewModel.getEntityID3();
		// Get Cap ID Model
		//var capID = getCapID(documentReviewModel.getID1(),
		//documentReviewModel.getID2(), documentReviewModel.getID3());
		
		
		
		var from = "alvin.li@missionsky.com";
		var to = "feng.xuan@missionsky.com";
		var cc = "alvin.li@missionsky.com";
		var templateName = "DOCUMENT UPLOAD AFTER";
		var templateParams = null;
		//Whether use the pre-defined EMDS user name & password.
		var useDefaultUserPassword = true;
		//If useDefaultUserPassword = true, there is no need to set user name & password, but if useDefaultUserPassword = false, we need define EDMS user name & password.
		var EMDSUsername = null;
		var EMDSPassword = null;

		//Download the document from DB to disk.
		var downloadResult = aa.document.downloadFile2Disk(documentReviewModel, documentReviewModel.getModuleName(), EMDSUsername, EMDSPassword, useDefaultUserPassword);
		if(downloadResult.getSuccess())
		{
			var path = downloadResult.getOutput();
			var fileNames = new Array();
			fileNames[0] = path;
			//Send Email.
			var emailResult = aa.document.sendEmailByTemplateName(from, to, cc, templateName, templateParams, fileNames);
			if(emailResult.getSuccess())
			{
				aa.print("Successfully.");
			}
			else
			{
				aa.print(emailResult.getErrorMessage());
			}
		}