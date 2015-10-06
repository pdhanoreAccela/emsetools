aa.env.setValue("ScriptReturnCode","0");
aa.env.setValue("ScriptReturnMessage", "WorkflowTaskUpdateBefore successful");

/* -----------------------For newProcessCode, Select one from your own DB--------------------
SELECT   sprocess_group_code
    FROM sprocess_group
   WHERE serv_prov_code = ?
     AND parent_relation_seq_id = 0
     AND sd_stp_num = 0
     AND rec_status = 'A'
     AND sprocess_group_code NOT IN (
            SELECT constant_value
              FROM r1server_constant
             WHERE serv_prov_code = sprocess_group.serv_prov_code
               AND constant_name = 'ADHOC_WORKFLOW_NAME'
               AND rec_status = 'A')
     AND (module_name IS NULL OR module_name = ?)
ORDER BY sprocess_group_code
------------------------------------------------------------------------------------------------------*/

function getCapId(capId)  
{
    var s_id1 = capId[0];
    var s_id2 = capId[1];
    var s_id3 = capId[2];

    var s_capResult = aa.cap.getCapID(s_id1, s_id2, s_id3);
    if(s_capResult.getSuccess())
      return s_capResult.getOutput();
    else
    {
      logMessage("**ERROR: Failed to get capId: " + s_capResult.getErrorMessage());
      return null;
    }
}

var capArray = new Array("11CAP-00000-000FX","11CAP-00000-000FV");
for(var i=0;i<capArray.length;i++)
{
	var capId = new Array();
	capId = capArray[i].split("-");
	var capIdModel = getCapId(capId);
	var newProcessCode = "LINDA";
	var isReallyDelete = false;
  aa.workflow.deleteAndAssignWorkflow(capIdModel, newProcessCode, isReallyDelete);
}

