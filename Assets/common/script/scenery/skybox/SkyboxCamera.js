#pragma strict

var mainCamera : Transform;
var theShip : Transform;
var translateScale : float;

private var mapController : MapController;


function Awake () {
	mapController = GameObject.Find("SceneScripts").GetComponent.<MapController>();
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