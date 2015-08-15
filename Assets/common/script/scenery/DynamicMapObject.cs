using UnityEngine;
using System;

public delegate void OnActivateMethod(DynamicMapObject mo);
public delegate void OnDeactivateMethod(DynamicMapObject mo);

public class DynamicMapObject:MonoBehaviour{
	public bool isActive = true;
	public int[] sectorCoord;
	public bool isBig;		//things tagged as "isbig" can be seen from the adjacent sector
	public int sectorSize = 1;	//how many sectors around is this visible for? (for planets i guess)
	public Vector3 originalPosition;

	public OnActivateMethod OnActivate;
	public OnDeactivateMethod OnDeactivate;
	
	[HideInInspector]
	public Collider[] cols ;
	
	MapController mapController;
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
		mapController = MapController._instance;//GameObject.Find("SceneScripts").GetComponent<MapController>();

		mapController.addObject(gameObject);
		
		
		
	}
	/* default behaviours for active/deactive*/
	public void DefaultActivation(){
		gameObject.SetActive( true);
		TargettableObject rItem = GetComponent<TargettableObject>();
		if(rItem != null){
			rItem.enabled = true;
		}
		foreach(Collider c in cols){
			c.enabled = true;
		}
		isActive = true;

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
		gameObject.SetActive(false);
		isActive = false;
		

	}
	
	/* called by the map controller script */
	public void Activate() {
		ActivateFunction(); 
		if (OnActivate != null) {
			OnActivate(this);
		}
	}
	
	public void Deactivate(){
		DeactivateFunction();
		if (OnDeactivate != null) {
			OnDeactivate(this);
		}
	}
	
	public void FixedUpdate() {

	}
}
