#pragma strict

var previewCamera : Camera;

var shaking : boolean = false;
var shakeAmount : float = 0.05;


var singleCameraMode = false;

var cameras : Camera[];
var canopyCamera : Camera;

var useExternalCamera : boolean  = false;

private var skyboxCamera : Camera;


private var originalPos  :Vector3;



function Start () {
	var ratio : float = Screen.width / Screen.height;
	
	if(ratio > 1){
		Debug.Log("using preview camera");
		useExternalCamera = true;
	} else {
		useExternalCamera = false;
	}
		
	originalPos = transform.localPosition;
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
}

function OnLevelWasLoaded (level : int) {
	var scam : GameObject = GameObject.Find("skyboxCamera");
	if(scam != null){
		skyboxCamera = scam.GetComponent.<Camera>();
	} else {
		skyboxCamera = null;
	}
}  


function Update () {
	if(shaking){
		transform.localPosition = originalPos + Vector3(Random.Range(-shakeAmount, shakeAmount), Random.Range(-shakeAmount,shakeAmount),0);
		previewCamera.transform.localPosition = transform.localPosition;
	} else {
		transform.localPosition = originalPos;
		previewCamera.transform.localPosition = transform.localPosition;
	}
	

	
	
}

function setFovs(fov : float){
	for(var c : Camera in cameras){
		c.fov = fov;
	}
	if(skyboxCamera != null){
		skyboxCamera.fov = fov;
	}
}

function FixedUpdate(){
	
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
		
		//take the last 2 cameras and set them to clear to skybox
//		cameras[cameras.length -1].clearFlags = CameraClearFlags.Skybox;
//		cameras[cameras.length -2].clearFlags = CameraClearFlags.Skybox;		
	}
}

