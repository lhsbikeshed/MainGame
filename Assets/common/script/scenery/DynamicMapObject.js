#pragma strict

var sectorCoord : int[];
var isBig : boolean;		//things tagged as "isbig" can be seen from the adjacent sector
var sectorSize : int = 1;	//how many sectors around is this visible for? (for planets i guess)
var generateSkyBoxVersion : boolean = false ;// do we make a smaller clone in the skybox?
var skyboxDummy : Transform;
var originalPosition : Vector3;

@HideInInspector
var cols : Collider[] ;

private var mapController : MapController;
private var clone : GameObject;
private var skyboxCamera : SkyboxCamera;

function getSectorAsVec() : Vector3 {
	return Vector3(sectorCoord[0], sectorCoord[1], sectorCoord[2]);

}

function getWorldPosition(){
	return getSectorAsVec() * mapController.cellSize + originalPosition;
}

function setWorldPosition(pos : Vector3){
	sectorCoord[0] = pos.x / mapController.cellSize;
	sectorCoord[1] = pos.y / mapController.cellSize;
	sectorCoord[2] = pos.z / mapController.cellSize;
	
	originalPosition.x = pos.x % mapController.cellSize;
	originalPosition.y = pos.y % mapController.cellSize;
	originalPosition.z = pos.z % mapController.cellSize;
}
	

function Awake () {
	//gameObject.active = false;
	tag = "dynamic";
	cols = gameObject.GetComponentsInChildren.<Collider>();
	originalPosition = transform.position;
	mapController = GameObject.Find("SceneScripts").GetComponent.<MapController>();
	//sectorCoord[0] = 50;
	//sectorCoord[1] = 50;
	//sectorCoord[2] = 50;
									
	if(generateSkyBoxVersion || skyboxDummy != null){
		//mapController = GameObject.Find("SceneScripts").GetComponent.<MapController>();
		skyboxCamera = GameObject.Find("SkyboxCamera").GetComponent.<SkyboxCamera>();
	
		var cellSize  :float = mapController.cellSize;
		var scaleVal : float = skyboxCamera.translateScale;
		
		var newPos : Vector3 = Vector3( cellSize * sectorCoord[0], 
										cellSize * sectorCoord[1],
										cellSize * sectorCoord[2]) * scaleVal + transform.position * scaleVal;
			
		
		if(generateSkyBoxVersion && !gameObject.name.Contains("(Clone)")){
			clone = Instantiate(gameObject, newPos, transform.rotation);
			
			Destroy(clone.GetComponent.<DynamicMapObject>());
			clone.transform.localScale = transform.localScale * scaleVal;
			clone.SetActiveRecursively(true);
			clone.layer = 9;
			clone.tag = "";
			//remove all colliders, change layers
			for(var t : Transform in clone.GetComponentsInChildren.<Transform>()){
				t.gameObject.layer = 9;
				t.tag = "";
				var col : Collider = t.GetComponent.<Collider>();
				if(col != null){
					Destroy(col);
				}
			}
		
		}
		if(skyboxDummy != null){
			
			clone = Instantiate(skyboxDummy.gameObject, newPos, transform.rotation);
			
			clone.transform.localScale = transform.localScale * scaleVal;
			clone.SetActiveRecursively(true);
			clone.layer = 9;
			clone.tag = "";
			for(var t : Transform in clone.GetComponentsInChildren.<Transform>()){
				t.gameObject.layer = 9;
				t.tag = "";
				
			}
		}
	}
	mapController.addObject(gameObject);
	
	
	
}

function Activate() {
	//if(!gameObject.name.Contains("(Clone")){
		
		gameObject.SetActiveRecursively( true);
		var rItem :TargettableObject = GetComponent.<TargettableObject>();
		if(rItem != null){
			rItem.enabled = true;
		}
		for (var c : Collider in cols){
			c.enabled = true;
		}
		if(clone != null){
			clone.SetActiveRecursively(false);
		}
		
	//}
}

function Deactivate(){
	
	transform.position = Vector3(-10000, -10000, -10000);
		for (var c : Collider in cols){
			c.enabled = false;
		}
		
		var rItem :TargettableObject = GetComponent.<TargettableObject>();
		if(rItem != null){
			rItem.enabled = false;
		}
		gameObject.SetActiveRecursively(false);
		
		
		if(clone != null){
			clone.SetActiveRecursively(true);
		}
	
}

function FixedUpdate () {
	if(clone != null){
		clone.transform.rotation = transform.rotation;
	}
}