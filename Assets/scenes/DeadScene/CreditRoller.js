#pragma strict

var textPrefab : Transform;
var headerText : Transform;
var endText : Transform;

var textList : String[];

private var textObjects : Transform[];

var scrolling : boolean = false;
var scrollSpeed : float = 1.0f;

function Start () {

	var didWeWin : boolean = GameObject.Find("PersistentScripts").GetComponent.<PersistentScene>().survivedTheGame;
	if(didWeWin){
		headerText.GetComponent.<GUIText>().text = "WINNERS";
	}
	endText.gameObject.active = false;
	
	
	//now generate the 
	textObjects = new Transform[textList.length];
	var pos : Vector3 = Vector3(0.5f, -0.6f);

	for(var i = 0; i < textList.length; i++){
	
		textObjects[i] = Instantiate(textPrefab, pos, Quaternion.identity);
		var text : String = textList[i];
		text = text.Replace("%pilotName%", PersistentScene._instance.pilotName);
		text = text.Replace("%tacticalName%", PersistentScene._instance.tacticalName);
		text = text.Replace("%engineerName%", PersistentScene._instance.engineerName);
		text = text.Replace("%captainName%", PersistentScene._instance.captainName);
		text = text.Replace("%gmName%", PersistentScene._instance.gmName);
		
		
		textObjects[i].GetComponent.<GUIText>().text = text;
		if(textList[i].StartsWith("-")){
			textObjects[i].GetComponent.<GUIText>().fontSize = 22;
			textObjects[i].GetComponent.<GUIText>().fontStyle = FontStyle.Bold;
			pos.y -= 0.10f;
		} else {
			pos.y -= 0.15f;
		}
		
	}

}

function FixedUpdate () {
	if(scrolling){
		headerText.position.y += scrollSpeed;
		for (var t : Transform in textObjects){
			t.position.y += scrollSpeed;
		}
	}
	if(textObjects[textObjects.Length - 1].position.y > 1.2f && endText.gameObject.active == false){
		Debug.Log("Done");
		endText.gameObject.active = true;
	}
	

}