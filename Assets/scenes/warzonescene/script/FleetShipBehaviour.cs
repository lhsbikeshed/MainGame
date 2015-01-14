using UnityEngine;
using System;

public enum AIState {
	IDLE, PREPARING_JUMP, CHARGINGJUMP, JUMPING, TARGETTING, TARGETREADY, FIRINGLAZOR
}

public class FleetShipBehaviour:MonoBehaviour{
	
	public Vector3 jumpDestination;
	public float jumpCountdown = 2.0f;
	public Vector3 preJumpScale;
	
	public AIState aiState =  AIState.IDLE;
	public Transform target;
	
	public bool test = false;
	
	//lasers
	
	
	
	
	//sounds
	public AudioClip entrySound;
	
	
	public void Start() {
		preJumpScale = transform.localScale;
	
	
	}
	
	public void Update() {
	
		if(test){
			test = false;
			startJump();
		}
	
		switch (aiState){
		case AIState.PREPARING_JUMP:
				doJumpPrep();
				break;
		case AIState.CHARGINGJUMP:
				doJumpCharge();
				break;
		case AIState.JUMPING:
				doJump();
				break;
		case AIState.TARGETTING:
				doTargetting();
				break;
			
		}
	
	}
	
	public void aimAtTarget(Transform target){
		this.target = target;
		
		aiState = AIState.TARGETTING;
		
	}
	
	
	public void fireLaser(){
		LaserTurretBehaviour laser = GetComponentInChildren<LaserTurretBehaviour>();
		laser.setTarget(target);
		laser.startFiring();
	}
	
	public void setLaserPenetration(bool pen){
		LaserTurretBehaviour laser = GetComponentInChildren<LaserTurretBehaviour>();
		laser.penetrating = pen;
	}
	
	public void doTargetting(){
		//rotate toward target
		Vector3 dirToTarget = transform.position - target.position ;
		dirToTarget.Normalize();
		if(Vector3.Dot(dirToTarget, transform.forward) < -0.999f){
			
			aiState = AIState.TARGETREADY;
			jumpCountdown = 2.0f;
		} else {
			Quaternion q = Quaternion.LookRotation(target.position - transform.position);
			transform.rotation = Quaternion.RotateTowards(transform.rotation, q, 0.2f);
	
		}
	}
	
	
	//in this state slowly rotate toward the jump point
	public void doJumpPrep(){
		Vector3 dirToTarget = transform.position - jumpDestination ;
		dirToTarget.Normalize();
		if(Vector3.Dot(dirToTarget, transform.forward) < -0.999f){
			
			aiState = AIState.CHARGINGJUMP;
			jumpCountdown = 2.0f;
		} else {
			Quaternion q = Quaternion.LookRotation(jumpDestination - transform.position);
			transform.rotation = Quaternion.RotateTowards(transform.rotation, q, 0.4f);
	
		}
	
	
	}
	
	public void doJumpCharge(){
		if(jumpCountdown > 0.0f){
			jumpCountdown -= Time.deltaTime;
		} else {
			aiState = AIState.JUMPING;
			
			
		}
			
	}
	
	public void doJump(){
		float dist = (transform.position - jumpDestination).magnitude;
		if(dist < 5.0f){
			aiState = AIState.IDLE;
			transform.localScale = preJumpScale;
			AudioSource tempAs = UsefulShit.PlayClipAt(entrySound, transform.position);
			tempAs.pitch = UnityEngine.Random.Range(0.8f, 1.2f);
			tempAs.volume = UnityEngine.Random.Range(0.5f, 0.8f);
		} else {
			
			transform.position = Vector3.Lerp(transform.position, jumpDestination, 0.6f);
			float zStretch = dist / 2.0f;
			zStretch = Mathf.Clamp(1.0f + zStretch, 1.0f, 2f);
			zStretch = 3.0f - zStretch;
			Vector3 size = transform.localScale;
			size.z *= zStretch;
			
			transform.localScale = size;
		}
		
	}
	
	
	public void startJump(){
		aiState = AIState.PREPARING_JUMP;
		
	}
	
	
	
	public void OnDrawGizmos(){
		Gizmos.DrawSphere(jumpDestination, 20.0f);
}

}