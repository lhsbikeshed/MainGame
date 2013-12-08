#pragma strict

var previewCamera : Camera;

var shaking : boolean = false;
var shakeAmount : float = 0.05;


var singleCameraMode = false;

var cameras : Camera[];
private var skyboxCamera : Camera;


private var originalPos  :Vector3;

function Start () {
	originalPos = transform.localPosition;
	
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
			
			if(c.gameObject.name.EndsWith("D")){
				c.clearFlags = CameraClearFlags.Skybox;
			}
		}
		
		//take the last 2 cameras and set them to clear to skybox
//		cameras[cameras.length -1].clearFlags = CameraClearFlags.Skybox;
//		cameras[cameras.length -2].clearFlags = CameraClearFlags.Skybox;		
	}
}

