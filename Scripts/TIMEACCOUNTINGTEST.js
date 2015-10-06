aa.print("WorkflowTaskUpdateBefore start:");

var id1 = "11CAP"; 
var id2 = "00000";
var id3 = "000LT";
var cap = aa.cap.getCap(id1, id2, id3).getOutput();
//get by cap id and workflow process id and step number
var stepNum = 12;
var processId = 8067;
// for inspection, please set value to the insepction sequence
var entityId = stepNum+":" + processId;
//It's a fixed value, for inspection, please set the value to "INSPECTION"
var entityType = "WORKFLOW";
var timeAccountings = aa.timeAccounting.getTimeLogModelByEntity(cap,entityId,entityType, "", "" ).getOutput();

if (timeAccountings != null && timeAccountings != '')
{
	for (var i = 0; i < timeAccountings.size(); i++)
	{
	    var timeLogModel = timeAccountings.get(i);
	    var timeLogSeq = timeLogModel.getTimeLogSeq() ;
	    aa.print("*****timeLogSeq:" + timeLogSeq);
	    var timeTypeSeq = timeLogModel.getTimeTypeSeq() ;
	    aa.print("*****timeTypeSeq:" + timeTypeSeq);
	    var timeGroupSeq = timeLogModel.getTimeGroupSeq() ;
	    aa.print("*****timeGroupSeq:" + timeGroupSeq);
	}
}
 var timeTypeSeq =  ;
 var timeGroupSeq = ;

aa.env.setValue("ScriptReturnCode","0");
aa.env.setValue("ScriptReturnMessage","WorkflowTaskUpdateBefore successful");

aa.print("WorkflowTaskUpdateBefore end:");