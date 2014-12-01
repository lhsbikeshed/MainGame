#pragma strict

/*
*/



var entering = false;
var inTunnel = false;

private var theShip : Transform;
private var skyboxCamera : Transform;

var tunnel : TunnelController;

private var lightLevel = 1.0f;
private var previousAmbient : Color;
private var directionalLight : Light;
private var previousDirectional : float;

var disableList : ParticleSystem[];

function Start () {
	theShip = GameObject.Find("TheShip").transform;
	skyboxCamera = GameObject.Find("skyboxCamera").transform;
	directionalLight = GameObject.Find("Directional light").GetComponent.<Light>();
	

}

function tunnelEntered(){
	if(entering == false){
		entering = true;
		
		previousAmbient = RenderSettings.ambientLight;
		previousDirectional = directionalLight.intensity;
		for(var p in disableList){
			p.enableEmission = false;
		}
	}
	
}

function FixedUpdate () {
	if(entering){
		if(lightLevel >= 0.0f){
			lightLevel -= 0.001f;
			
			//begin darkening the world
			RenderSettings.ambientLight = previousAmbient * lightLevel;
			directionalLight.intensity = previousDirectional * lightLevel;
			
		} else {
			if(!inTunnel){
				entering = false;
				theShip.parent = null;
				tunnel.positionShipAtStart();
				inTunnel = true;
				gameObject.Find("SceneScripts").GetComponent.<CometScene>().enteredTunnel();
			}
		}
	}

}

function OnTriggerEnter(col : Collider){
	if(col.name == "TheShip" && entering == false){
		Debug.Log("Entered tunnel");
		tunnelEntered();
	}
}
