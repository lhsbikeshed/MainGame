#pragma strict

var theShip : Transform;

var currentLocation : Transform;
var lookAtShip : boolean;
var followingShip : boolean;

private var skyboxCamera : Camera;
private var useSkyboxCamera : boolean=  false;
private var depthSkyboxObject : Transform;


private var mapController : MapController;


function Start () {

	theShip = GameObject.Find("TheShip").transform;
	if(theShip.GetComponentInChildren.<ShipCamera>().useExternalCamera == true){
	
		
	
		//find out if this scene uses a skybox camera. If it does then attach a camera to it 
		//with same parameters as ours but depth -1
		//also alter current camera to cleartodepth
		var g : GenericScene = GameObject.Find("SceneScripts").GetComponent.<GenericScene>();
		if (g != null){
			
			if (g.skyboxCameraActive == true){
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
				
				
			}
			camera.rect.x = 0.5f;
			camera.rect.width = 0.5f;
			camera.rect.height = 1.0f;
		}
	
	
		theShip = GameObject.Find("TheShip").transform;
		resetToShip();
	} else {
		camera.depth = -1;
	}

}

function setLocation(t : Transform){
	transform.parent = t;
	transform.localPosition = Vector3.zero;
	followingShip = false;
}

function resetToShip(){
	if(transform.parent != null){
		transform.parent = null;
	}
	//transform.parent = GameObject.Find("DefaultDynamicCamera").transform;
	followingShip = true;
	transform.position = GameObject.Find("DefaultDynamicCamera").transform.position;
	transform.localPosition = Vector3.zero;
	transform.localRotation = Quaternion.identity;
	transform.LookAt(theShip);
	camera.fov = 60.0;
	lookAtShip = true;
}

function Update(){
	if(useSkyboxCamera){
		depthSkyboxObject.rotation = transform.rotation;
		var basePos : Vector3 = Vector3(mapController.sectorPos[0], mapController.sectorPos[1], mapController.sectorPos[2]) * mapController.cellSize;
	
		depthSkyboxObject.position = (basePos + transform.position) * 0.01f;
	
	}
	
	
}

function FixedUpdate () {
	//transform.position = currentLocation.position;
	//transform.rotation = currentLocation.rotation;
	if(lookAtShip){
		transform.LookAt(theShip);
		
	}
if(followingShip){
		transform.position = GameObject.Find("DefaultDynamicCamera").transform.position;
	}
}