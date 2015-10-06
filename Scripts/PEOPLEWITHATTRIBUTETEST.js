var peopleObj = aa.people.createPeopleModel().getOutput();
peopleObj.setServiceProviderCode("ADDEV");
peopleObj.setContactSeqNumber("540103");
peopleObj.setContactType("Clerk");
aa.people.editPeopleWithAttribute(peopleObj.getPeopleModel(), null);
aa.print('123');