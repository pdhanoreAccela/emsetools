// build variables.
var capID = getCapId();
var altID = capID.getCustomID();
var currentUserID = aa.env.getValue("CurrentUserID"); 
var cap = aa.cap.getCap(capID).getOutput();      
var capType = cap.getCapType();

var contactNumber = getPhoneNumber();
var owenerNumber = getOwenerNumber();
var lpNumbers = getLPNumber();

var toNumber = '';

if(contactNumber){
	toNumber = contactNumber;
}

if(owenerNumber){
	toNumber += owenerNumber;
}

if(lpNumbers){
	toNumber += lpNumbers;
}

aa.print("capID:"+capID.toString());
aa.print('The to number is ' + toNumber);


var params = aa.communication.getI18nVariables().getOutput();
params.put('$$content$$', 'This is the test content');
params.put('$$capId$$', altID);
params.put('$$currentUser$$', currentUserID);
params.put('$$to$$', toNumber);

if(toNumber)
{
	aa.communication.sendMessages('Yummy', params, 'ApplicationSpecificInfoUpdateAfter',[['RECORD',altID]]);
}


aa.env.setValue("ScriptReturnCode","0");
aa.env.setValue("ScriptReturnMessage","ApplicationSpecificInfoUpdateAfter successful");

function getCapId() {
	var s_id1 = aa.env.getValue("PermitId1");
	var s_id2 = aa.env.getValue("PermitId2");
	var s_id3 = aa.env.getValue("PermitId3");
	var s_capResult = aa.cap.getCapID(s_id1, s_id2, s_id3);
	if (s_capResult.getSuccess()) {
		return s_capResult.getOutput();
	}else {
		aa.print("**ERROR: Failed to get capId: " + s_capResult.getErrorMessage());
		return null;
	}
}


function getPhoneNumber(){
	var capId = getCapId();
	var contacts = aa.people.getCapContactByCapID(capId).getOutput();
	
	var contact = null, number = null, people = null, numbers = null;
	var country = null, country2 = null, country3 = null;
	if(contacts){
		for(var i = 0, len = contacts.length; i < len; i++){
			contact = contacts[i];
			people = contact.getPeople();
			number = null;
			
			if(people){
				country1 = people.getPhone1CountryCode() || '';
				country2 = people.getPhone2CountryCode() || '';
				country3 = people.getPhone3CountryCode() || '';
				
				if(people.getPhone1()){ number = country1 + people.getPhone1();}
				if(people.getPhone2()){ number = country2 + people.getPhone2();}
				if(people.getPhone3()){ number = country3 + people.getPhone3();}
			}
			
			if(number){
				if(numbers == null){
					numbers = number;
				}
				else{
					numbers += number;
				}
				
				numbers += ';';
			}
		}
		
		if(numbers){
			aa.print('The contact numbers are: ' + numbers);
			return numbers;
		}
	}
	
	aa.print('No contact number got');
}

function getOwenerNumber(){
	var list = aa.owner.getOwnerByCapId(capID).getOutput() || [];
	var ownerModel = null;
	var number = null, numbers = null, country = null;
	for(var i = 0, len = list.length; i < len; i++){
		ownerModel = list[i];
		
		if(ownerModel.getPhone()){
			number = ownerModel.getPhone();
		}
		
		if(number){
			if(numbers == null){
				numbers = number;
			}
			else{
				numbers += number;
			}
			
			numbers += ';';
		}
	}
	
	if(numbers)
	{
		aa.print('The reference owner number is: ' + numbers);
		return numbers;
	}
	
	aa.print('No number for reference owner number has been retrieved.');
}

function getLPNumber(){
	var lpModels = aa.licenseProfessional.getLicenseProf(capID).getOutput();
	var numbers = null, number = null;
	var lpModel = null;
	var country = null, country2 = null, country3 = null;
	if(lpModels && lpModels.length > 0){
		for(var i = 0; i < lpModels.length; i++){
			number = null;
			lpModel = lpModels[i];
			
			country1 = lpModel.getPhone1CountryCode() || '';
			country2 = lpModel.getPhone2CountryCode() || '';
			country3 = lpModel.getPhone3CountryCode() || '';
			
			if(lpModel.getPhone1()){ number = country1 + lpModel.getPhone1();}
			if(lpModel.getPhone2()){ number = country2 +lpModel.getPhone2();}
			if(lpModel.getPhone3()){ number = country3 +lpModel.getPhone3();}
			
			if(number){
				if(numbers == null){
					numbers = number;
				}
				else{
					numbers += number;
				}
				
				numbers += ';';
			}
		}
	}
	
	if(numbers){
		aa.print('The lp numbers is: ' + numbers);
		return numbers;
	}
	
	aa.print('No lp numbers got.');
}