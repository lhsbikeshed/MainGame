#pragma strict

var theShip : Transform;

var currentLocation : Transform;
var lookAtShip : boolean;
var followingShip : boolean;
var useWebcam : boolean = false;


private var skyboxCamera : Camera;
private var useSkyboxCamera : boolean=  false;
private var depthSkyboxObject : Transform;


private var mapController : MapController;
 var followTransform : Transform;

 
  /* cabin camera controls*/
var canCabinCamBeUsed : boolean = false; 
private var lastCabinShow : float = 0.0f;
private var camDuration : float = 10.0f;
private var camStart : float = 0.0f;
private var camVisible : boolean = false;

function Awake () {
	DontDestroyOnLoad(this);
	if (OSCHandler.Instance.configItems["useChaseCam"] != "true"){
		Destroy (gameObject);
	} else {
		init();
	}
	
}

function OnLevelWasLoaded(scene :int){
	useSkyboxCamera = false;
	if (OSCHandler.Instance.configItems["useChaseCam"] == "true"){
		init();	
	}
	canCabinCamBeUsed = true;

}

/* reconfigure cameras for current scene
*/
function init(){
	var ts = GameObject.Find("TheShip");
	if(ts != null){
		theShip = ts.transform;
	}
	hideCabinCamera();
	
	//find out if this scene uses a skybox camera. If it does then attach a camera to it 
	//with same parameters as ours but depth -1
	//also alter current camera to cleartodepth
	
	

	var g : GenericScene = GameObject.Find("SceneScripts").GetComponent.<GenericScene>();
	if(g.skyboxCameraActive == true){
	
		useSkyboxCamera = true;
		//find current skyboxcam
		var sourceSkyboxObject = GameObject.Find("skyboxCamera");
		//create a new camera object for the depth bits
		var sbNew = new GameObject();			
		sbNew.AddComponent(Camera);
		sbNew.name = "ChaseCamSkybox";
		//sbNew.transform.parent = sbObject.transform;
		sbNew.transform.localPosition = Vector3.zero;
		sbNew.transform.localRotation = Quaternion.identity;
		sbNew.layer = 9;
		skyboxCamera = sbNew.GetComponent.<Camera>();
		skyboxCamera.cullingMask = 1 << LayerMask.NameToLayer("skybox") ;
		skyboxCamera.fov = camera.fov;
		skyboxCamera.depth = camera.depth;
		skyboxCamera.farClipPlane = 5500;
		camera.depth += 1;
		camera.clearFlags = CameraClearFlags.Depth;
		camera.cullingMask = camera.cullingMask & ~(1 << LayerMask.NameToLayer("skybox"));
		skyboxCamera.rect = camera.rect;
		skyboxCamera.clearFlags = CameraClearFlags.Skybox;
		depthSkyboxObject = sbNew.transform;
		//remember ref for mapcontroller for camera scaling
		mapController = GameObject.Find("SceneScripts").GetComponent.<MapController>();
		
		skyboxCamera.rect.width = 0.5f;
		skyboxCamera.rect.x = 0.5f;
		skyboxCamera.rect.height = 1.0f;
		sourceSkyboxObject.camera.rect.width = 0.5f;
		sourceSkyboxObject.camera.rect.x = 0.0f;
		
		
	
		camera.rect.x = 0.5f;
		camera.rect.width = 0.5f;
		camera.rect.height = 1.0f;
		if(theShip != null){
			resetToShip();
		}
	} else {
		camera.clearFlags = CameraClearFlags.Skybox;
		camera.depth = -1;
	}

		



	//setup the webcam plane	
	if(OSCHandler.Instance.configItems["useWebcam"] == "true"){
		useWebcam = true;
	
	
		
	} else {
		
	}
}

function setLocation(t : Transform){
//	transform.parent = t;
//	transform.localPosition = Vector3.zero;
	followTransform = t;
	followingShip = false;
	hideCabinCamera();
}

function resetToShip(){
	if (OSCHandler.Instance.configItems["useChaseCam"] == "false"){
		return;
	}
	if(transform.parent != null){
		transform.parent = null;
	}
	
	followingShip = true;
	transform.position = GameObject.Find("DefaultDynamicCamera").transform.position;
	transform.localPosition = Vector3.zero;
	transform.localRotation = Quaternion.identity;
	transform.LookAt(theShip);
	camera.fov = 60.0;
	lookAtShip = true;
	canCabinCamBeUsed = true;
}

function Update(){
	if(useSkyboxCamera){
		depthSkyboxObject.rotation = transform.rotation;
		var basePos : Vector3 = Vector3(mapController.sectorPos[0], mapController.sectorPos[1], mapController.sectorPos[2]) * mapController.cellSize;
	
		depthSkyboxObject.position = (basePos + transform.position) * 0.01f;
	
	}
	
	
}

/* tell cam system to show the camera stream */
function showCabinCamera(camNum : int, duration : float){
	if(canCabinCamBeUsed){
		var msg : OSCMessage = OSCMessage("/system/webcam/show");
		OSCHandler.Instance.SendMessageToAll(msg);
		camVisible = true;
		camStart = Time.fixedTime;
		camDuration = duration;
	}
}

function hideCabinCamera(){
	var msg : OSCMessage = OSCMessage("/system/webcam/hide");
	OSCHandler.Instance.SendMessageToAll(msg);
	camVisible = false;
}

function FixedUpdate () {
	
	if(canCabinCamBeUsed){
		if(lastCabinShow + 10.0f < Time.fixedTime){
			if(camVisible){
				hideCabinCamera();
			} else {
				showCabinCamera(0, 10.0f);
			}
			lastCabinShow = Time.fixedTime;
		}
	}
	
	if(camVisible){
		if(camStart + camDuration < Time.fixedTime){
			hideCabinCamera();
		}
	}
	
	
	if(followingShip){
		var t = GameObject.Find("DefaultDynamicCamera").transform;
		transform.position = t.position;
		transform.LookAt(theShip, t.TransformDirection(Vector3.up));
	} else {
		if(followTransform != null){
			transform.position = followTransform.position;
			if(lookAtShip){
				transform.LookAt(theShip, followTransform.TransformDirection(Vector3.up));
				
				
				
			} else {
				transform.rotation = followTransform.rotation;
			}
		}
	}
}