aa.print("EstablishmentUpdateBefore debug");aa.print("sourceSeqNbr="    	   	 +aa.env.getValue("sourceSeqNbr"));aa.print("seq="             	   	 +aa.env.getValue("seq"));aa.print("TimeGroupSeq="           +aa.env.getValue("id")); aa.print("TimeTypeSeq="            +aa.env.getValue("name"));aa.print("Reference="              +aa.env.getValue("group"));aa.print("DateLogged="             +aa.env.getValue("type")); aa.print("StartTime="              +aa.env.getValue("status"));aa.print("EndTime="                +aa.env.getValue("statusDate"));aa.print("TimeElapsed="      	     +aa.env.getValue("landUse")); aa.print("TotalMinutes="           +aa.env.getValue("totalFloorArea"));aa.print("Billable="               +aa.env.getValue("description")); aa.print("Floor="              		 +aa.env.getValue("floor"));aa.print("Employees="           	 +aa.env.getValue("employees")); aa.print("ResidentialUnits="       +aa.env.getValue("residentialUnits"));aa.print("PercentStructure="       +aa.env.getValue("percentStructure"));aa.print("StructureTotalArea="     +aa.env.getValue("totalArea"));aa.print("CreateDate="             +aa.env.getValue("recDate"));aa.print("RecordStatus="           +aa.env.getValue("recStatus"));var attributes = aa.env.getValue("attributeList");if(attributes !='' && attributes !=null){	var it=attributes.iterator();	while(it.hasNext())	{		var attributeModel=it.next();				aa.print("AttributeName:" + attributeModel.getG1AttributeName());		aa.print("AttributeValue:" + attributeModel.getG1AttributeValue());	}}aa.env.setValue("ScriptReturnCode","0");aa.env.setValue("ScriptReturnMessage", "EstablishmentUpdateBefore successful");