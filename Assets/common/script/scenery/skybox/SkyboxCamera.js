#pragma strict

var mainCamera : Transform;
var theShip : Transform;
var translateScale : float;

var distanceFogMultiplier : float = 5.0f;


private var mapController : MapController;


private var preRenderFogLevel : float = 0.0f;

function Awake () {
	mapController = GameObject.Find("SceneScripts").GetComponent.<MapController>();
	GameObject.Find("SceneScripts").GetComponent.<GenericScene>().skyboxCameraActive = true;
	
	theShip = GameObject.Find("TheShip").transform;
	//theShip.Find("camera").GetComponent.<Camera>().clearFlags = CameraClearFlags.Depth;
	//theShip.Find("cameraP").GetComponent.<Camera>().clearFlags = CameraClearFlags.Depth;
	theShip.GetComponentInChildren.<ShipCamera>().setSkyboxState (true);
	mainCamera = theShip.Find("camera").transform;
}

//rotate and position the camera as the main camera moves
function Update () {
	transform.rotation = mainCamera.rotation;
	var basePos : Vector3 = Vector3(mapController.sectorPos[0], mapController.sectorPos[1], mapController.sectorPos[2]) * mapController.cellSize;
	
	transform.position = (basePos + theShip.position) * translateScale;
	
}

function OnPreRender(){
	preRenderFogLevel = RenderSettings.fogDensity;
	RenderSettings.fogDensity = RenderSettings.fogDensity * distanceFogMultiplier;
	
	
}

function OnPostRender(){
	RenderSettings.fogDensity = preRenderFogLevel;
}