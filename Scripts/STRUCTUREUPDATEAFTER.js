aa.print("StructureUpdateAfter debug");aa.print("sourceSeqNbr="    	   	 +aa.env.getValue("sourceSeqNbr"));aa.print("seq="             	     +aa.env.getValue("seq"));aa.print("TimeGroupSeq="           +aa.env.getValue("id")); aa.print("TimeTypeSeq="            +aa.env.getValue("name"));aa.print("Reference="              +aa.env.getValue("group"));aa.print("DateLogged="             +aa.env.getValue("type")); aa.print("StartTime="              +aa.env.getValue("status"));aa.print("EndTime="                +aa.env.getValue("statusDate"));aa.print("TimeElapsed="      	     +aa.env.getValue("landUse")); aa.print("TotalMinutes="           +aa.env.getValue("totalFloorArea"));aa.print("Billable="               +aa.env.getValue("description")); aa.print("Materials="              +aa.env.getValue("coordinateX"));aa.print("MaterialsCost="          +aa.env.getValue("coordinateY")); aa.print("MileageStart="           +aa.env.getValue("frontDimension"));aa.print("MileageEnd="             +aa.env.getValue("sideDimension1"));aa.print("MilageTotal="            +aa.env.getValue("sideDimension2"));aa.print("VehicleId="              +aa.env.getValue("height"));aa.print("EntryRate="              +aa.env.getValue("totalFloors")); aa.print("EntryPct="               +aa.env.getValue("stFloorArea"));aa.print("EntryCost="              +aa.env.getValue("rooms")); aa.print("CreatedDate="            +aa.env.getValue("builtDate")); aa.print("CreatedBy="              +aa.env.getValue("garage")); aa.print("Notation="               +aa.env.getValue("pool")); aa.print("TimeGroupSeq="           +aa.env.getValue("baths"));aa.print("Recdate="                +aa.env.getValue("parcelArea"));aa.print("RecFulUser="             +aa.env.getValue("usedPercent"));aa.print("Recdate="                +aa.env.getValue("recFulName"));aa.print("Recdate="                +aa.env.getValue("recStatus"));var attributes = aa.env.getValue("attributeList");if(attributes !='' && attributes !=null){	var it=attributes.iterator();	while(it.hasNext())	{		var attributeModel=it.next();				aa.print("AttributeName:" + attributeModel.getG1AttributeName());		aa.print("AttributeValue:" + attributeModel.getG1AttributeValue());	}}aa.env.setValue("ScriptReturnCode","0");aa.env.setValue("ScriptReturnMessage", "StructureUpdateAfter successful");