aa.print("InspectionResultModifyBefore debug");

aa.print("CurrentUserID=" + aa.env.getValue("CurrentUserID"));
aa.print("DepartmentLevel1=" + aa.env.getValue("DepartmentLevel1"));
aa.print("DepartmentLevel2=" + aa.env.getValue("DepartmentLevel2"));
aa.print("DepartmentLevel3=" + aa.env.getValue("DepartmentLevel3"));
aa.print("DepartmentLevel4=" + aa.env.getValue("DepartmentLevel4"));
aa.print("DepartmentLevel5=" + aa.env.getValue("DepartmentLevel5"));
aa.print("DepartmentLevel6=" + aa.env.getValue("DepartmentLevel6"));
aa.print("InspectionId=" + aa.env.getValue("InspectionId"));
aa.print("InspectionResult=" + aa.env.getValue("InspectionResult"));
aa.print("InspectionResultComment=" + aa.env.getValue("InspectionResultComment"));
aa.print("InspectionResultCommentId=" + aa.env.getValue("InspectionResultCommentId"));
aa.print("InspectionType=" + aa.env.getValue("InspectionType"));
aa.print("PermitId1=" + aa.env.getValue("PermitId1"));
aa.print("PermitId2=" + aa.env.getValue("PermitId2"));
aa.print("PermitId3=" + aa.env.getValue("PermitId3"));
aa.print("StaffFirstName=" + aa.env.getValue("StaffFirstName"));
aa.print("StaffLastName=" + aa.env.getValue("StaffLastName"));
aa.print("StaffMiddleName=" + aa.env.getValue("StaffMiddleName"));

aa.env.setValue("ScriptReturnCode","0");
aa.env.setValue("ScriptReturnMessage","InspectionResultModifyBefore successful");