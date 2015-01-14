using UnityEngine;
using System;
using System.Globalization;


public class CreditRoller:MonoBehaviour{
	
	public Transform textPrefab;
	public Transform headerText;
	public Transform endText;
	
	public string[] textList;
	
	Transform[] textObjects;
	
	public bool scrolling = false;
	public float scrollSpeed = 1.0f;
	
	public void Start() {
	
		bool didWeWin = GameObject.Find("PersistentScripts").GetComponent<PersistentScene>().survivedTheGame;
		if(didWeWin){
			headerText.GetComponent<GUIText>().text = "WINNERS";
		}
		endText.gameObject.active = false;
		
		
		//now generate the 
		textObjects = new Transform[textList.Length];
		Vector3 pos = new Vector3(0.5f, -0.6f);
	
		for(int i = 0; i < textList.Length; i++){
		
			textObjects[i] = (UnityEngine.Transform)Instantiate(textPrefab, pos, Quaternion.identity);
			string text = textList[i];
			text = text.Replace("%pilotName%", PersistentScene._instance.pilotName);
			text = text.Replace("%tacticalName%", PersistentScene._instance.tacticalName);
			text = text.Replace("%engineerName%", PersistentScene._instance.engineerName);
			text = text.Replace("%captainName%", PersistentScene._instance.captainName);
			text = text.Replace("%gmName%", PersistentScene._instance.gmName);
			
			
			textObjects[i].GetComponent<GUIText>().text = text;
			if(textList[i].StartsWith("-")){
				textObjects[i].GetComponent<GUIText>().fontSize += 10;
				textObjects[i].GetComponent<GUIText>().fontStyle = FontStyle.Bold;
				pos.y -= 0.10f;
			} else {
				pos.y -= 0.15f;
			}
			
		}
	
	}
	
	public void FixedUpdate() {
		if(scrolling){
			var tmp_cs1 = headerText.position;
            tmp_cs1.y += scrollSpeed;
            headerText.position = tmp_cs1;
			foreach(Transform t in textObjects){
				var tmp_cs2 = t.position;
                tmp_cs2.y += scrollSpeed;
                t.position = tmp_cs2;
			}
		}
		if(textObjects[textObjects.Length - 1].position.y > 1.2f && endText.gameObject.active == false){
			UnityEngine.Debug.Log("Done");
			endText.gameObject.active = true;
		}
		
	
	}
}
