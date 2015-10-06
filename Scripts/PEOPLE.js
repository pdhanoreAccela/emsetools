var peopleScript = aa.people.getPeople(5379);
if(peopleScript.getSuccess())
{
	var people = peopleScript.getOutput();
	var result = aa.people.editPeopleWithAttribute(people, null);
}