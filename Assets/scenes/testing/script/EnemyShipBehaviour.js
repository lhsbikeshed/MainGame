#pragma strict


class EnemyShipBehaviour extends GeneralTrackableTarget {
	
	var theShip : Transform;
	var rotateSpeed : float  = 0.1f;
	
	var testing : boolean = false;
	var targetTest : boolean = false;
	var ang : float = 10.0f;
	
	private var turrets : LaserTurretBehaviour[];
	
	enum AIState { 	WAITING, 	//waiting
					HUNTING, 	//seeking out the ship
					ORBITING,	//orbit around 
					AIMING		//aiming at the target to shoot it					
					};	
					
	enum WeaponState { 	DISABLED, 	//wont target or shoot
						OFF, 		//targetting but not shooting
						CHARGING, 	//dur
						FIRING, 	//pewpew
						COOLDOWN };	//wait for cooldowntime below
	
	var currentWeaponState : WeaponState = WeaponState.OFF;				
	var currentAIState : AIState = AIState.WAITING;
	
	var weaponCooldown : float = 5.0f;
	var missileCooldown : float = 5.0f;
	var orbitRange : float = 200.0f;
	var throttle : float = 0.0f;
	
	private var targetPoint : Vector3;
	private var orbitTime : float;		//how long have we been orbiting our target?
	private var weaponsTarget : Transform;
	
	function Start () {
		theShip = GameObject.Find("TheShip").transform;
		//targetPoint = theShip.transform.position;
		turrets = GetComponentsInChildren.<LaserTurretBehaviour>();
		
	}
	
	function FixedUpdate(){
		if(testing){
			testing = false;
			currentAIState = AIState.HUNTING;
		}
		
		if(targetTest){
			targetTest = false;
			setLockState(true);
		}
	
		var direction : Vector3 = theShip.position - transform.position;
		var range : float = direction.magnitude;
		
		var angDiff = Vector3.Dot(transform.TransformDirection(Vector3.forward), direction.normalized);
		
		if(currentAIState == AIState.WAITING){
			//in waiting state just track the ship to scare them
			targetPoint = theShip.transform.position;
			
			var q : Quaternion = Quaternion.LookRotation(direction);
			transform.rotation = Quaternion.Slerp(transform.rotation, q, rotateSpeed);
			throttle = 0.0f;
		} else if (currentAIState == AIState.HUNTING){
			//fly toward the players until they are in range
			targetPoint = theShip.transform.position;
			var angledUp : Vector3 = transform.TransformDirection(Vector3.up);
			angledUp = Quaternion.Euler(0,0,20.0f * angDiff) * angledUp;
			
			var q2 : Quaternion = Quaternion.LookRotation(direction, angledUp);
			transform.rotation = Quaternion.Slerp(transform.rotation, q2, rotateSpeed);
			
			throttle = 4.0f * Mathf.Abs(angDiff);
			
			if(range <= orbitRange){
				currentAIState = AIState.ORBITING;
			}
		} else if (currentAIState == AIState.ORBITING){
			//get direction from target to ourselves
			orbitTime += Time.fixedDeltaTime;
			
			//take this direction and rotate it 10 degrees around on a plane formed by direction and our forward axis
			var ourFwd : Vector3 = transform.TransformDirection(Vector3.forward);
			var rotZ : Vector3 = Vector3.Cross(direction.normalized, ourFwd);
			var axisAngle : Quaternion = Quaternion.AngleAxis(ang, rotZ);
			
			targetPoint = axisAngle * (theShip.position + direction.normalized * (orbitRange * 0.9f));
			
			var angledUp2 : Vector3 = transform.TransformDirection(Vector3.up);
			angledUp2 = Quaternion.Euler(0,0,20.0f * -angDiff) * angledUp;
			
			var q3 : Quaternion = Quaternion.LookRotation(targetPoint - transform.position, angledUp2);
			transform.rotation = Quaternion.Slerp(transform.rotation, q3, rotateSpeed);
			throttle = 5.0f;
					
			if(range > orbitRange){
				currentAIState = AIState.HUNTING;
				orbitTime = 0;
			}
			if(orbitTime > 8.0f){
				currentAIState = AIState.AIMING;
			}
		} else if (currentAIState == AIState.AIMING){
			
			targetPoint = theShip.transform.position;
			
			var q4 : Quaternion = Quaternion.LookRotation(direction);
			transform.rotation = Quaternion.Slerp(transform.rotation, q4, rotateSpeed);
			throttle = 0.0f;
			
			if(angDiff > 0.95f && weaponsTarget != null){
				
				for(var t : LaserTurretBehaviour in turrets){
					t.startFiring();
				}
				currentAIState = AIState.ORBITING;
				orbitTime = 0.0f;
				
			}
		}
		rigidbody.AddForce( transform.TransformDirection(Vector3.forward) * 10 * throttle, ForceMode.Acceleration);
		
	}
	
	function setLockState( s : boolean ){
		if(s){
			weaponsTarget = theShip;
			//warn the ship that they have a weapons lock on them
			for(var t : LaserTurretBehaviour in turrets){
				t.setTarget(weaponsTarget);
			}
		} else {
			weaponsTarget = null;
		}
	}
	
	function setWeaponState (s : boolean){
	}
	
	function Update () {
		
	
	}

	function OnDrawGizmos(){
		if(targetPoint != null){
			Gizmos.DrawSphere(targetPoint, 10);
		}
	}

}