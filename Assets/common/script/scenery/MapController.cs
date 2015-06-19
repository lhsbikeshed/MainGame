using UnityEngine;
using System;
using System.Collections.Generic;
using UnityOSC;

public delegate void MapCellChangedEvent(int newX, int newY, int newZ);

public class MapController:MonoBehaviour{
	
	public GameObject ship;
	public int[] sectorPos;
	public int cellSize = 3000;
	
	List<GameObject> mapObjects;
	public GameObject jumpGate;
	GenericScene currentScene;
	PersistentScene ps;
	
	public static MapController _instance;
	
	public float universeScale = 0.02f;	//scale factor between large space and detail space
	public float iUniverseScale;			//scale factor between detail -> large space
	
	public  MapCellChangedEvent mapCellChanged;
	
	
	
	public void Awake() {
		iUniverseScale = 1f / universeScale;
	
		mapObjects = new System.Collections.Generic.List<GameObject>();
		ps = GameObject.Find("PersistentScripts").GetComponent<PersistentScene>();
		sectorPos = new int[3];
		ship = GameObject.Find("TheShip");
		
		currentScene = GameObject.Find("SceneScripts").GetComponent<GenericScene>();
		
		updateObjectList();
		_instance = this;
		

	}
	
	public void Start(){
		currentScene.MapSectorChanged(new Vector3 ( (float)sectorPos[0], (float)sectorPos[1], (float)sectorPos[2]), new Vector3 ( (float)sectorPos[0], (float)sectorPos[1], (float)sectorPos[2]) );
	}
	
	public void addObject(GameObject obj){
		if(!mapObjects.Contains(obj)){
			mapObjects.Add(obj);
		}
		testPosition(obj);
	}
	
	public void updateObject(GameObject obj){
		testPosition(obj);
	}
	
	public void removeObject(GameObject obj){
		mapObjects.Remove(obj);
	
	}

	
	public void updateObjectList(){
		//find all gameobjects that have DynamicMapObject attached
		//mapObjects = GameObject.FindGameObjectsWithTag("dynamic");
		foreach(GameObject dynObj in mapObjects){
			DynamicMapObject script = dynObj.GetComponent<DynamicMapObject>();
			if(dynObj.name == "JumpGate"){
				jumpGate = dynObj;
			}
			script.Deactivate();
			
		}
		//Debug.Log("Found " + mapObjects.size + " objects");
	}
	
	public Vector3 getSectorAsVec() {
		return new Vector3((float)sectorPos[0], (float)sectorPos[1], (float)sectorPos[2]);
	
	}
	
	
	
	public Vector3 getShipWorldPosition(){
		return getSectorAsVec() * cellSize + ship.transform.position;
	}
	
	
	public void OnDrawGizmo(){
		Gizmos.color = new Color(255.0f,255.0f,0.0f);
		Gizmos.DrawCube(Vector3.zero, Vector3.one * cellSize);
	}
	
	public void spawnGate(int[] pos){
		DynamicMapObject script = jumpGate.GetComponent<DynamicMapObject>();
		script.sectorCoord[0] = pos[0];
		script.sectorCoord[1] = pos[1];
		script.sectorCoord[2] = pos[2];
		//script.Activate();
		testPosition(jumpGate);
		
		//updateObjects();
		//fuck, forgot to tell the radar system
		ship.GetComponent<TargettingSystem>().clearHighlights();
		jumpGate.GetComponent<GeneralTrackableTarget>().highlighted = true;
		ship.GetComponent<TargettingSystem>().addObject(jumpGate);
	}
	
	public void spawnGate(){
			spawnGate(sectorPos);
			
			
	}
	
	public void updateObjects(){
	//activate all objects in this sector
		foreach(GameObject dynObj in mapObjects){
			
			testPosition(dynObj);
		}
		
	}
	
	public void testPosition(GameObject dynObj){
		DynamicMapObject script = dynObj.GetComponent<DynamicMapObject>();
		if(script.enabled == false){ return; };
		
		if(script.isBig == false){
			//if (ArrayUtility.ArrayEquals.<int>(script.sectorCoord,sectorPos)){
			bool ok = true;
			for(int i = 0; i < 3; i++){
				if(script.sectorCoord[i] != sectorPos[i]){
					ok = false;
					break;
				}
			}
			if(ok == true){		
				dynObj.transform.position = script.originalPosition	;
				script.Activate();
			} else {
				script.Deactivate();
			}
		} else {
			int difX = sectorPos[0] - script.sectorCoord[0] ;
			int difY = sectorPos[1] - script.sectorCoord[1] ;
			int difZ = sectorPos[2] - script.sectorCoord[2];
			int sectorSize = script.sectorSize;
			//Debug.Log(difX + " " + difY + " " + difZ);
	
			if(difX >= -sectorSize && difX <= sectorSize && difY >= -sectorSize && difY <= sectorSize && difZ >= -sectorSize && difZ <= sectorSize){
				dynObj.transform.position = script.originalPosition + new Vector3((float)(-difX * cellSize), (float)(-difY * cellSize), (float)(-difZ * cellSize));								
				script.Activate();
			} else {				
				script.Deactivate();
			}
		}	
					
	}
	
	
	public void Update() {
		//check that the ship isnt too far away from the game origin as this screws physics
		//if we are then translate EVERYTHING back to the origin
		//actually: should probably just reset the coordinate that went over 1500
		
		Vector3 currentPos = ship.transform.position;
		Vector3 correctionTransform = Vector3.zero;
		bool doCorrection = false;
		doCorrection = false;
		for(int i = 0; i < 3; i++){
			//did this coord element go over the sector edge?
			if (Mathf.Abs(currentPos[i]) > cellSize / 2){
				doCorrection = true;
				correctionTransform[i] = (cellSize) * Mathf.Sign(-currentPos[i]);
			}
		}
		if(doCorrection){
			Transform[] gameObjs = FindObjectsOfType(typeof(Transform)) as Transform[];
			
			foreach(Transform g in gameObjs){
					
				if(g.parent == null && g.gameObject.layer != 9 && g.GetComponent<GUITexture>() == null){
					Transform trailObj  = g.Find("trail(Clone)");
					Transform trailPrefab = null;
					bool newTrail = false;
					if(trailObj != null){
						trailObj.parent = null;
						
						IncomingMissile inc = g.GetComponent<IncomingMissile>();
						if(inc != null){
							trailPrefab = inc.trailPrefab;
							newTrail = true;
						}
					}

					
					TimedTrailRenderer[] trailList = g.GetComponentsInChildren<TimedTrailRenderer>();
					foreach(TimedTrailRenderer tr in trailList){
						tr.translateAll(correctionTransform);
					}
					g.position += correctionTransform;
					
					
					if(newTrail){
						trailObj = (UnityEngine.Transform)Instantiate(trailPrefab, g.position, g.rotation);
						trailObj.transform.parent = g.transform;
					}
					
						
								
				}
			}
			
			Vector3 oldPos = new Vector3 ( (float)sectorPos[0], (float)sectorPos[1], (float)sectorPos[2]) ;
			
			//find out which sector wall we crossed and change sector pos
			for(int i = 0; i < 3; i++){
				if(Mathf.Abs(correctionTransform[i]) > 0){
				
					sectorPos[i] += (int)(1 * Mathf.Sign(-correctionTransform[i])) ;
				}
			}
			//Debug.Log(sectorPos[0] +"," + sectorPos[1] + "," + sectorPos[2]);
			
			//let the current scene know we moved sectors
			currentScene.MapSectorChanged(oldPos, new Vector3 ( (float)sectorPos[0], (float)sectorPos[1], (float)sectorPos[2]) );


			if(mapCellChanged != null){
				mapCellChanged(sectorPos[0], sectorPos[1], sectorPos[2]);
			}
			//alert clients that we changed sector
			OSCMessage msg = new OSCMessage("/ship/sectorChanged");
			msg.Append<int>(sectorPos[0]);
			msg.Append<int>(sectorPos[1]);
			msg.Append<int>(sectorPos[2]);
			OSCHandler.Instance.SendMessageToAll(msg);
	
			
			updateObjects();
		}
		
	}

}
