#pragma strict

var previewCamera : Camera;

var shaking : boolean = false;
var shakeAmount : float = 0.05;


//var singleCameraMode = false;

var cameras : Camera[];
var canopyCamera : Camera;

var useExternalCamera : boolean  = false;

var skyboxCamera : Camera;


private var originalPos  :Vector3;
private var guiCameraPos : Vector3;

private var shakeTime : float;
private var shakeStart : float;
private var timedShaking : boolean = false;

function Start () {
	var ratio : float = Screen.width / Screen.height;
	
	//if(ratio > 1){
	var curWidth : int = Convert.ToInt32(OSCHandler.Instance.configItems["resolutionWidth"]);
	var curHeight : int = Convert.ToInt32(OSCHandler.Instance.configItems["resolutionHeight"]);
	if(OSCHandler.Instance.configItems["useChaseCam"] == "true"){
		Debug.Log("using preview camera");
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
		for(var c : Camera in cameras){
			c.rect.x = 0;
			c.rect.width = 0.5f;
		}
		if(canopyCamera){ 
			canopyCamera.rect.x = 0;
			canopyCamera.rect.width = 0.5f;
		}
	} else {
		for(var c : Camera in cameras){
			c.rect.x = 0;
			c.rect.width = 1.0f;
		}
		if(canopyCamera){ 
			canopyCamera.rect.x = 0;
			canopyCamera.rect.width = 1.0f;
		}
	}
	
	getSkyboxCamera();
}

function getSkyboxCamera(){
	var scam : GameObject = GameObject.Find("skyboxCamera");
	if(scam != null){

		skyboxCamera = scam.GetComponent.<Camera>();
	} else {
		skyboxCamera = null;
		Debug.Log("no skybox camera in scene");
	}
}

function OnLevelWasLoaded (level : int) {
	
	getSkyboxCamera();
}  


function Update () {
	if(shaking || timedShaking){
		transform.localPosition = originalPos + Vector3(Random.Range(-shakeAmount, shakeAmount), Random.Range(-shakeAmount,shakeAmount),0);
		previewCamera.transform.localPosition = transform.localPosition;
		//canopyCamera.transform.position = guiCameraPos + Vector3(Random.Range(-shakeAmount, shakeAmount), Random.Range(-shakeAmount,shakeAmount),0);
	} else {
		transform.localPosition = originalPos;
		previewCamera.transform.localPosition = transform.localPosition;
		//canopyCamera.transform.position = guiCameraPos;
	}
	

	
	
}

function shakeFor(seconds : float){
	shakeTime = seconds;
	shakeStart = Time.fixedTime;
	
}

function setFovs(fov : float){
	for(var c : Camera in cameras){
		c.fieldOfView = fov;
	}
	if(skyboxCamera != null){
		skyboxCamera.fieldOfView = fov;
	}
}

function FixedUpdate(){
	if(shakeTime + shakeStart > Time.fixedTime){
		timedShaking = true;
	} else {
		timedShaking = false;
	}
}

function setSkyboxState(state : boolean){

	if(state == true){
		//take all of the associated cameras and set to Do not clear
		for(var c : Camera in cameras){
			c.clearFlags = CameraClearFlags.Depth;
		}
		
		
	} else {
		for(var c : Camera in cameras){
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

