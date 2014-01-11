#pragma strict

var followShip : boolean = true;
var zoomOnEnter : boolean = false;
var startFov : float = 60.0;
var endFov : float = 15.0;
var fovChangeTime : float = 2.0;

var onLeaveReset : boolean = true;

private var fovChangeStart : float;
private var cam : DynamicCamera;
private var startZoom : boolean = false;

function Start () {
	//gameObject.tag = "CameraPoint";
	var d = GameObject.Find("DynamicCamera");
	if(d != null){
		cam = d.GetComponent.<DynamicCamera>();
	}
	//Debug.Log("Piss: " + GameObject.Find("DynamicCamera"));
}

function Update () {

}

function FixedUpdate(){
	if(zoomOnEnter && startZoom){
		cam.camera.fov = Mathf.Clamp( Mathf.Lerp(startFov, endFov, (Time.fixedTime - fovChangeStart) / fovChangeTime), startFov,endFov);
	}
}


function OnTriggerEnter(col : Collider){
	//Debug.Log(col.transform.name);
	if(col.gameObject.name == "TheShip"){
		if(cam == null){
			var d = GameObject.Find("DynamicCamera");
			if(d!= null){
				cam = d.GetComponent.<DynamicCamera>();
			}
		}
		if(cam!= null){
			Debug.Log("Switching to camera: " + transform.name);
			cam.setLocation(transform);
			cam.lookAtShip = followShip;
			if(!followShip){
				cam.transform.rotation = transform.rotation;
			}
			cam.camera.fov = startFov;
			fovChangeStart = Time.fixedTime;
			startZoom = true;
		}
		
	}
}
function OnTriggerExit(col : Collider){
	if(col.gameObject.name == "TheShip" && onLeaveReset){
		cam.resetToShip();
		startZoom = false;
	}
}