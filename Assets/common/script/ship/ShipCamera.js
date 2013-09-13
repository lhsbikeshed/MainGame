#pragma strict

var previewCamera : Camera;

var shaking : boolean = false;
var shakeAmount : float = 0.05;

var cameras : Camera[];


private var originalPos  :Vector3;

function Start () {
	originalPos = transform.localPosition;
	
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

function setSkyboxState(state : boolean){

	if(state == true){
		//take all of the associated cameras and set to Do not clear
		for(var c : Camera in cameras){
			c.clearFlags = CameraClearFlags.Depth;
		}
	} else {
		for(var c : Camera in cameras){
			c.clearFlags = CameraClearFlags.Depth;
		}
		//take the last 2 cameras and set them to clear to skybox
		cameras[cameras.length -1].clearFlags = CameraClearFlags.Skybox;
		cameras[cameras.length -2].clearFlags = CameraClearFlags.Skybox;		
	}
}

