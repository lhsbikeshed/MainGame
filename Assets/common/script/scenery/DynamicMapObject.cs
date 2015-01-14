using UnityEngine;
using System;


public class DynamicMapObject:MonoBehaviour{
	
	public int[] sectorCoord;
	public bool isBig;		//things tagged as "isbig" can be seen from the adjacent sector
	public int sectorSize = 1;	//how many sectors around is this visible for? (for planets i guess)
	public bool generateSkyBoxVersion = false ;// do we make a smaller clone in the skybox?
	public Transform skyboxDummy;
	public Vector3 originalPosition;
	
	[HideInInspector]
	public Collider[] cols ;
	
	MapController mapController;
	GameObject clone;
	SkyboxCamera skyboxCamera;
	
	public Action ActivateFunction;
	public Action DeactivateFunction;
	
	
	
	public Vector3 getSectorAsVec() {
		return new Vector3((float)sectorCoord[0], (float)sectorCoord[1], (float)sectorCoord[2]);
	
	}
	
	public Vector3 getWorldPosition(){
		return getSectorAsVec() * mapController.cellSize + originalPosition;
	}
	
	public void setWorldPosition(Vector3 pos){
		sectorCoord[0] = (int)(pos.x / mapController.cellSize);
		sectorCoord[1] = (int)(pos.y / mapController.cellSize);
		sectorCoord[2] = (int)(pos.z / mapController.cellSize);
		
		originalPosition.x = pos.x % mapController.cellSize;
		originalPosition.y = pos.y % mapController.cellSize;
		originalPosition.z = pos.z % mapController.cellSize;
		mapController.updateObject(this.gameObject);
	}
		
	
	public void Awake() {
		ActivateFunction = DefaultActivation;
		DeactivateFunction = DefaultDeactivation;
		
		//gameObject.active = false;
		tag = "dynamic";
		cols = gameObject.GetComponentsInChildren<Collider>();
		originalPosition = transform.position;
		mapController = GameObject.Find("SceneScripts").GetComponent<MapController>();
		//sectorCoord[0] = 50;
		//sectorCoord[1] = 50;
		//sectorCoord[2] = 50;
										
		if(generateSkyBoxVersion || skyboxDummy != null){
			//mapController = GameObject.Find("SceneScripts").GetComponent.<MapController>();
			skyboxCamera = GameObject.Find("SkyboxCamera").GetComponent<SkyboxCamera>();
		
			float cellSize = (float)mapController.cellSize;
			float scaleVal = skyboxCamera.translateScale;
			
			Vector3 newPos = new Vector3( cellSize * sectorCoord[0], 
											cellSize * sectorCoord[1],
											cellSize * sectorCoord[2]) * scaleVal + transform.position * scaleVal;
				
			
			if(generateSkyBoxVersion && !gameObject.name.Contains("(Clone)")){
				clone = (GameObject)Instantiate(gameObject, newPos, transform.rotation);
				
				Destroy(clone.GetComponent<DynamicMapObject>());
				clone.transform.localScale = transform.localScale * scaleVal;
				clone.SetActiveRecursively(true);
				clone.layer = 9;
				clone.tag = "";
				//remove all colliders, change layers
				foreach(Transform t in clone.GetComponentsInChildren<Transform>()){
					t.gameObject.layer = 9;
					t.tag = "";
					Collider col = t.GetComponent<Collider>();
					if(col != null){
						Destroy(col);
					}
				}
			
			}
			if(skyboxDummy != null){
				
				clone = (GameObject)Instantiate(skyboxDummy.gameObject, newPos, transform.rotation);
				
				clone.transform.localScale = transform.localScale * scaleVal;
				clone.SetActiveRecursively(true);
				clone.layer = 9;
				clone.tag = "";
				foreach(Transform t in clone.GetComponentsInChildren<Transform>()){
					t.gameObject.layer = 9;
					t.tag = "";
					
				}
			}
		}
		mapController.addObject(gameObject);
		
		
		
	}
	/* default behaviours for active/deactive*/
	public void DefaultActivation(){
		gameObject.SetActiveRecursively( true);
		TargettableObject rItem = GetComponent<TargettableObject>();
		if(rItem != null){
			rItem.enabled = true;
		}
		foreach(Collider c in cols){
			c.enabled = true;
		}
		if(clone != null){
			clone.SetActiveRecursively(false);
		}
	}
	
	public void DefaultDeactivation(){
		transform.position = new Vector3(-10000.0f, -10000.0f, -10000.0f);
		foreach(Collider c in cols){
			c.enabled = false;
		}
		
		TargettableObject rItem = GetComponent<TargettableObject>();
		if(rItem != null){
			rItem.enabled = false;
		}
		gameObject.SetActiveRecursively(false);
		
		
		if(clone != null){
			clone.SetActiveRecursively(true);
		}
	}
	
	/* called by the map controller script */
	public void Activate() {
			ActivateFunction(); 
	}
	
	public void Deactivate(){
			DeactivateFunction();
	}
	
	public void FixedUpdate() {
		if(clone != null){
			clone.transform.rotation = transform.rotation;
		}
	}
}
