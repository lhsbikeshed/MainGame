using UnityEngine;
using System;


public class SkyboxCamera:MonoBehaviour{
	
	public Transform mainCamera;
	public Transform theShip;
	public float translateScale;
	
	public float distanceFogMultiplier = 5.0f;
	
	
	MapController mapController;
	
	
	float preRenderFogLevel = 0.0f;
	
	public void Awake() {
		mapController = GameObject.Find("SceneScripts").GetComponent<MapController>();
		GameObject.Find("SceneScripts").GetComponent<GenericScene>().skyboxCameraActive = true;
		
		theShip = GameObject.Find("TheShip").transform;
		//theShip.Find("camera").GetComponent.<Camera>().clearFlags = CameraClearFlags.Depth;
		//theShip.Find("cameraP").GetComponent.<Camera>().clearFlags = CameraClearFlags.Depth;
		theShip.GetComponentInChildren<ShipCamera>().setSkyboxState (true);
		mainCamera = theShip.Find("camera").transform;
	}
	
	//rotate and position the camera as the main camera moves
	public void Update() {
		transform.rotation = mainCamera.rotation;
		Vector3 basePos = new Vector3((float)mapController.sectorPos[0], (float)mapController.sectorPos[1], (float)mapController.sectorPos[2]) * mapController.cellSize;
		
		transform.position = (basePos + theShip.position) * translateScale;
		
	}
	
	public void OnPreRender(){
		preRenderFogLevel = RenderSettings.fogDensity;
		RenderSettings.fogDensity = RenderSettings.fogDensity * distanceFogMultiplier;
		
		
	}
	
	public void OnPostRender(){
		RenderSettings.fogDensity = preRenderFogLevel;
	}
}
