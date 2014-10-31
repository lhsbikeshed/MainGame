#pragma strict

public var jumpDestination : Vector3;
var jumpCountdown : float = 2.0f;
var preJumpScale : Vector3;

public var aiState : AIState =  aiState.IDLE;
public var target : Transform;

var test : boolean = false;

//lasers




//sounds
public var entrySound : AudioClip;


function Start () {
	preJumpScale = transform.localScale;


}

function Update () {

	if(test){
		test = false;
		startJump();
	}

	switch (aiState){
		case aiState.PREPARING_JUMP:
			doJumpPrep();
			break;
		case aiState.CHARGINGJUMP:
			doJumpCharge();
			break;
		case aiState.JUMPING:
			doJump();
			break;
		case aiState.TARGETTING:
			doTargetting();
			break;
		
	}

}

function aimAtTarget(target : Transform){
	this.target = target;
	
	aiState = aiState.TARGETTING;
	
}


function fireLaser(){
	var laser : LaserTurretBehaviour = GetComponentInChildren.<LaserTurretBehaviour>();
	laser.setTarget(target);
	laser.startFiring();
}

function setLaserPenetration(pen : boolean){
	var laser : LaserTurretBehaviour = GetComponentInChildren.<LaserTurretBehaviour>();
	laser.penetrating = pen;
}

function doTargetting(){
	//rotate toward target
	var dirToTarget : Vector3 = transform.position - target.position ;
	dirToTarget.Normalize();
	if(Vector3.Dot(dirToTarget, transform.forward) < -0.999f){
		
		aiState = aiState.TARGETREADY;
		jumpCountdown = 2.0f;
	} else {
		var q : Quaternion = Quaternion.LookRotation(target.position - transform.position);
		transform.rotation = Quaternion.RotateTowards(transform.rotation, q, 0.2f);

	}
}


//in this state slowly rotate toward the jump point
function doJumpPrep(){
	var dirToTarget : Vector3 = transform.position - jumpDestination ;
	dirToTarget.Normalize();
	if(Vector3.Dot(dirToTarget, transform.forward) < -0.999f){
		
		aiState = aiState.CHARGINGJUMP;
		jumpCountdown = 2.0f;
	} else {
		var q : Quaternion = Quaternion.LookRotation(jumpDestination - transform.position);
		transform.rotation = Quaternion.RotateTowards(transform.rotation, q, 0.4f);

	}


}

function doJumpCharge(){
	if(jumpCountdown > 0.0f){
		jumpCountdown -= Time.deltaTime;
	} else {
		aiState = aiState.JUMPING;
		
		
	}
		
}

function doJump(){
	var dist :float = (transform.position - jumpDestination).magnitude;
	if(dist < 5.0f){
		aiState = aiState.IDLE;
		transform.localScale = preJumpScale;
		var tempAs : AudioSource = UsefulShit.PlayClipAt(entrySound, transform.position);
		tempAs.pitch = Random.Range(0.8f, 1.2f);
		tempAs.volume = Random.Range(0.5f, 0.8f);
	} else {
		
		transform.position = Vector3.Lerp(transform.position, jumpDestination, 0.6f);
		var zStretch : float = dist / 2.0f;
		zStretch = Mathf.Clamp(1.0f + zStretch, 1.0f, 2f);
		zStretch = 3.0f - zStretch;
		var size = transform.localScale;
		size.z *= zStretch;
		
		transform.localScale = size;
	}
	
}


function startJump(){
	aiState = aiState.PREPARING_JUMP;
	
}



function OnDrawGizmos(){
	Gizmos.DrawSphere(jumpDestination, 20);
}

public enum AIState {
	IDLE, PREPARING_JUMP, CHARGINGJUMP, JUMPING, TARGETTING, TARGETREADY, FIRINGLAZOR
}