#pragma strict
var chargeEffect : AudioClip;
var loopEffect : AudioClip;
var endEffect : AudioClip;

//var missilePrefab : Transform;
var fireDuration : float;

private var fireTime : float;
private var soundSource : AudioSource ;
private var haloLight : Light;
private var laserRenderer : LineRenderer;
private var laserTexture : Material;

private var state : int; // 0 = off, 1 = firing
private var target : Transform;
private var theShip : Transform;
var weaponsPower : int = 2;

function Start () {
	laserRenderer = GetComponent.<LineRenderer>();
	laserTexture = laserRenderer.material;
	theShip = transform.parent;
	
	laserRenderer.enabled = false;
	soundSource = gameObject.AddComponent.<AudioSource>();
	soundSource.volume = 0.2f;
}

//fire at a target taking distance etc into account

function fireAtTarget(targettedObject : Transform){
	var msg : OSCMessage ;
	if(targettedObject == null){

		msg = new OSCMessage("/tactical/weapons/noTarget");
		Debug.Log("no target for firing");
		OSCHandler.Instance.SendMessageToClient("TacticalStation", msg);
		OSCHandler.Instance.DisplayBannerAtClient("TacticalStation", "No Target", "No Target Selected", 1000);
		return;
	}

	var tscript : TargettableObject = targettedObject.GetComponent.<TargettableObject>();
	if(tscript.exploding == false && state == 0){
		
		var targetRange : float = (theShip.transform.position - targettedObject.position).magnitude;
		weaponsPower =  theShip.GetComponent.<ship>().weaponsPower;
		var maxBeamRange : float = 1000 + weaponsPower * 300;
		if(targetRange > maxBeamRange){
			msg = new OSCMessage("/tactical/weapons/targetRange");
			msg.Append.<int>(tscript.targetId);
			OSCHandler.Instance.SendMessageToClient("TacticalStation", msg);
			OSCHandler.Instance.DisplayBannerAtClient("TacticalStation", "ERROR", "Target Out Of Range, current range: " + targetRange, 1000);
		} else {
			msg = new OSCMessage("/tactical/weapons/firingAtTarget");
			msg.Append.<int>(tscript.targetId);
			OSCHandler.Instance.SendMessageToClient("TacticalStation", msg);
			var damage : float = (1.0 - Mathf.Clamp(targetRange / maxBeamRange, 0,1)) * (  weaponsPower  / 3.0f) * tscript.baseDamage;
			
			
			tscript.GetShot(damage);
		
		
			state = 1;
			fireTime = Time.fixedTime;	
			target = targettedObject;
		}
		
	}

}

/* for the npc ship to fire with, distance etc isnt important */
function npcFireAtTarget(targettedObject : Transform){
	if(state  == 0){
		state = 1;
		fireTime = Time.fixedTime;	
		target = targettedObject;
		Debug.Log("npc fire");
		var tscript : TargettableObject = targettedObject.GetComponent.<TargettableObject>();
		tscript.GetShot(1.0f);
	}
}

function getState() : int{
	return state;
}

function Update () {
	if(target == null){
		state = 0;
	}
	if(state == 1){
		
		
		laserRenderer.SetPosition(0, transform.position);
		laserRenderer.SetPosition(1, target.position);
		laserTexture.mainTextureOffset.x -= 0.05;
		if(laserRenderer.enabled == false){
			laserRenderer.enabled = true;
			soundSource.clip = loopEffect;
			soundSource.Play();
		}
		
		if(fireTime + fireDuration < Time.fixedTime){
			state = 0;
			soundSource.Stop();
			soundSource.clip = endEffect;
			soundSource.Play();
			laserRenderer.enabled = false;
		}
	} 

}