using UnityEngine;
using System;
using System.Globalization;


public class ShipCamera:MonoBehaviour{
	
	public Camera previewCamera;
	
	public bool shaking = false;
	public float shakeAmount = 0.05f;
	
	
	//var singleCameraMode = false;
	
	public Camera[] cameras;
	public Camera canopyCamera;
	
	public bool useExternalCamera  = false;
	
	public Camera skyboxCamera;
	
	
	Vector3 originalPos;
	Vector3 guiCameraPos;
	
	float shakeTime;
	float shakeStart;
	bool timedShaking = false;

	float currentFov = 85f;
	
	public void Start() {
		
		//if(ratio > 1){
		int curWidth = Convert.ToInt32(OSCHandler.Instance.configItems["resolutionWidth"]);
		int curHeight = Convert.ToInt32(OSCHandler.Instance.configItems["resolutionHeight"]);
		if(OSCHandler.Instance.configItems["useChaseCam"] == "true"){
			UnityEngine.Debug.Log("using preview camera");
			useExternalCamera = true;
			
			Screen.SetResolution(curWidth * 2, curHeight, false);
		} else {
			useExternalCamera = false;
			Screen.SetResolution(curWidth, curHeight, false);
		}
		
			
		originalPos = transform.localPosition;
		guiCameraPos = canopyCamera.transform.localPosition;
		
		if(useExternalCamera){
			//move all cameras to the left and shrink width by half
			foreach(Camera c in cameras){
				var tmp_cs1 = c.rect;
                tmp_cs1.x = 0.0f;
                tmp_cs1.width = 0.5f;
                c.rect = tmp_cs1;
			}
			if(canopyCamera != null){ 
				var tmp_cs2 = canopyCamera.rect;
                tmp_cs2.x = 0.0f;
                tmp_cs2.width = 0.5f;
                canopyCamera.rect = tmp_cs2;
			}
		} else {
			foreach(Camera c in cameras){
				var tmp_cs3 = c.rect;
                tmp_cs3.x = 0.0f;
                tmp_cs3.width = 1.0f;
                c.rect = tmp_cs3;
			}
			if(canopyCamera != null){ 
				var tmp_cs4 = canopyCamera.rect;
                tmp_cs4.x = 0.0f;
                tmp_cs4.width = 1.0f;
                canopyCamera.rect = tmp_cs4;
			}
		}
		currentFov = cameras[0].fieldOfView;
		getSkyboxCamera();
	}
	
	public void getSkyboxCamera(){
		GameObject scam = GameObject.Find("skyboxCamera");
		if(scam != null){
	
			skyboxCamera = scam.GetComponent<Camera>();
			UnityEngine.Debug.Log("...found skybox camera");
		} else {
			skyboxCamera = null;
			UnityEngine.Debug.Log("no skybox camera in scene");
		}
	}
	
	public void OnLevelWasLoaded(int level) {
		
		getSkyboxCamera();
	}  
	
	
	public void Update() {
		if(shaking || timedShaking){
			transform.localPosition = originalPos + new Vector3(UnityEngine.Random.Range(-shakeAmount, shakeAmount), UnityEngine.Random.Range(-shakeAmount,shakeAmount),0.0f);
			previewCamera.transform.localPosition = transform.localPosition;
			//canopyCamera.transform.position = guiCameraPos + Vector3(Random.Range(-shakeAmount, shakeAmount), Random.Range(-shakeAmount,shakeAmount),0);
		} else {
			transform.localPosition = originalPos;
			previewCamera.transform.localPosition = transform.localPosition;
			//canopyCamera.transform.position = guiCameraPos;
		}
		
	
		
		
	}
	
	public void shakeFor(float seconds){
		shakeTime = seconds;
		shakeStart = Time.fixedTime;
		
	}
	
	public void setFovs(float fov){
		foreach(Camera c in cameras){
			c.fieldOfView = fov;
		}
		if(skyboxCamera != null){
			skyboxCamera.fieldOfView = fov;
		}
		currentFov = fov;
	}

	public float getFov(){
		return currentFov;
	}
	
	public void FixedUpdate(){
		if(shakeTime + shakeStart > Time.fixedTime){
			timedShaking = true;
		} else {
			timedShaking = false;
		}
	}
	
	public void setSkyboxState(bool state){
	
		if(state == true){
			UnityEngine.Debug.Log("ships camera set to skybox mode");
			getSkyboxCamera();
	
			//take all of the associated cameras and set to Do not clear
			foreach(Camera c in cameras){
				c.clearFlags = CameraClearFlags.Depth;
			}
			
			
		} else {
			UnityEngine.Debug.Log("Ships camera set to non-skybox mode");
			foreach(Camera c in cameras){
				c.clearFlags = CameraClearFlags.Depth;
				
				if(c.gameObject.name.EndsWith("P")){
					c.clearFlags = CameraClearFlags.Skybox;
				}
			}
			skyboxCamera = null;
			//take the last 2 cameras and set them to clear to skybox
	//		cameras[cameras.length -1].clearFlags = CameraClearFlags.Skybox;
	//		cameras[cameras.length -2].clearFlags = CameraClearFlags.Skybox;		
		}
	}


}