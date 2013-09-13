#pragma strict

#pragma strict

class VanBehaviour extends TargettableObject {
	
	var rotateAmount : Vector3;
	var rotating : boolean = true;
	var grappled : boolean = false;
	
	var hasBeenHacked : boolean = false;
	
	
	var sounds : AudioClip[];
	private var parts : ParticleSystem;
	
	private var randomSound : int = 0;
	private var theShip : GameObject;
	
	function Start () {
		super.Start();
		theShip = GameObject.Find("TheShip");
		randomSound = Random.Range(0,sounds.Length);
		parts = GetComponentInChildren.<ParticleSystem>();	
		scanCode = Mathf.FloorToInt(Random.Range(0, 10000));
		
		statNames = new String[2];
		statValues = new float[2];
		statNames[0] = "health";
		statNames[1] = "";
		
		GameObject.Find("TheShip").GetComponent.<TargettingSystem>().addObject(this);
		
	}
	
	function Update () {
	
		statValues[0] = health;
		statValues[1] = 0;
		
	}
	
	
	function FixedUpdate(){
		if(rotating){
			rigidbody.AddRelativeTorque(rotateAmount, ForceMode.Force);
		}
	}
	
	function OnTriggerEnter(c : Collider){
		if(c.gameObject.name == "TheShip" && !grappled){
			GameObject.Find("SceneScripts").GetComponent.<LostVanBehaviour>().foundShip();
			GetComponent.<VanBehaviour>().highlighted = true;
		}
	}
		
	/* just in case they actually fly right past */
	function OnTriggerExit(c : Collider){
		if(c.gameObject.name == "TheShip" && !grappled){
			GameObject.Find("SceneScripts").GetComponent.<LostVanBehaviour>().lostShip();
			GetComponent.<VanBehaviour>().highlighted = false;
		}
	}
	
	function gotGrappled(){
		grappled = true;
		rotating = false;
		GetComponent.<DynamicMapObject>().enabled = false;
		//if the ship hasnt been grappled yet then show the engineer the remote connection dialogue
		
		if(hasBeenHacked == false){
			OSCHandler.Instance.ChangeClientScreen("EngineerStation", "RemoteConnection");
			theShip.GetComponentInChildren.<GrapplingHook>().lockState = true;
		}
	}
	
	function releaseGrapple(){
		grappled = false;
		GetComponent.<DynamicMapObject>().enabled = true;
		var p : int[] = GameObject.Find("SceneScripts").GetComponent.<MapController>().sectorPos;
		GetComponent.<DynamicMapObject>().sectorCoord = p;
		
	}
	
	//strength is whatever the 
	function GetShot(damage : float){
		
	}
	
	function explode(){
		
	}
}




