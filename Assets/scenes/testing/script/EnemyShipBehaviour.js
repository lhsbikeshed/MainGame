#pragma strict


class EnemyShipBehaviour extends TargettableObject {
	
	var theShip : Transform;
	var rotateSpeed : float  = 0.1f;
	
	var testing : boolean = false;
	var targetTest : boolean = false;
	var ang : float = 10.0f;
	var nextShotTime : float = 8.0f;
	var isActive : boolean = false;
	var difficulty : float = 1.0f;
	var scanTime : float = 15.0f;
	var reactorDetectTime : float = 5.0f;
	
	private var turrets : LaserTurretBehaviour[];
	private var dynObj : DynamicMapObject;
	
	private var warpEffects: ParticleSystem;
	private var scannerBeam : Transform;
	private var scannerRotation : Quaternion;
	private var scannerAnimationTime : float = 1.0f;
	
	
	
	enum AIState {  IDLE,		//do nothing at all, just wait for a jump signal
					JUMPING,	//jumping in
					SCANNING,	//scanning for player
					WAITING, 	//waiting
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
		dynObj = GetComponent.<DynamicMapObject>();
		dynObj.DeactivateFunction = function() { DynamicObjectDeactivate(); };
		dynObj.ActivateFunction = function() { DynamicObjectActivate(); };
		dynObj.Deactivate();
		
		warpEffects = transform.Find("warpeffects").GetComponent.<ParticleSystem>();
		scannerBeam = transform.Find("ScannerBeam");
		scannerBeam.gameObject.SetActiveRecursively(false);
	}
	
	
	
	function FixedUpdate(){
		if(testing){
			testing = false;
			JumpIn();
		}
		
		if(targetTest){
			targetTest = false;
			JumpOut();
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
				var miss : boolean = false;
				if(Random.Range(0.0f, 1.0f) > difficulty){
					miss = true;
				}
				for(var t : LaserTurretBehaviour in turrets){
					t.deliberatelyMiss = miss;
					t.penetrating = miss;
					t.startFiring();
					
				}
				
				if( !miss ){
					var diffMod : float = difficulty * 5.0f;
					theShip.GetComponent.<ship>().damageShip(Random.Range(7.0f, 12.0f + diffMod), "Destroyed by hostile fire");
				}
				
				nextShotTime =  Random.Range(6.0f, 15.0f);
				currentAIState = AIState.ORBITING;
				orbitTime = 0.0f;
				
			}
		} else if (currentAIState == AIState.SCANNING){
			if(scannerBeam.gameObject.active == false){
				EnableScanner();
			} else {
				//scannerBeam.localRotation = Quaternion.Euler(0, 1.0f, 0) * scannerBeam.localRotation;
				scannerAnimationTime -= Time.fixedDeltaTime;
				if(scannerAnimationTime < 0.0f){
					scannerAnimationTime = Random.Range(1.0f, 3.0f);
					scannerRotation = Quaternion.Euler(Random.onUnitSphere * 360);
				}
				scannerBeam.localRotation = Quaternion.Slerp(scannerBeam.localRotation, scannerRotation, 0.04f);
			
				//sit still and rotate around toward the players but very slowly. Send out a "scanning timer" value that is displayed on tactical
				//when that hits zero target the ship
				scanTime -= Time.fixedDeltaTime;
				
				if(scanTime < 0){		//undetected for scanTime, leave the area
					scanDone(true);
					
				}
				
				if(theShip.GetComponent.<Reactor>().systemEnabled ){
					reactorDetectTime -= Time.fixedDeltaTime;
				}
				if(reactorDetectTime < 0){	//if the reactor stays on for more than reactorDetectTime then target and shoot
					scanDone (false);
				}
				if(theShip.GetComponent.<ship>().acceleration.magnitude > 5.0f){	//if any point the ship accelerates too much then detect them
					scanDone (false);
				}
				if(theShip.rigidbody.angularVelocity.magnitude > 1.0f){				//if the ship rotates too much then attack
					scanDone(false);
				}
			}
		}
		
		
		
		
		rigidbody.AddForce( transform.TransformDirection(Vector3.forward) * 10 * throttle, ForceMode.Acceleration);
		
	}
	
	function EnableScanner(){
		yield WaitForSeconds(2.0);
		scannerBeam.gameObject.SetActiveRecursively(true);
	}
	
	/*the scan of pl{ayer ship is done, target them if they are still online */
	function scanDone(success : boolean){
		if(!success){
		
			currentAIState = AIState.HUNTING;
			setLockState(true);
			var toShip : Quaternion = Quaternion.LookRotation((theShip.position - transform.position).normalized, transform.up);
			scannerBeam.rotation = toShip;
			yield WaitForSeconds(2.0);
			//tell clients you were detected
			var m : OSCMessage = OSCMessage("/scene/warzone/youWereDetected");
			OSCHandler.Instance.SendMessageToAll(m);
			//turn off scanner beam
			scannerBeam.gameObject.SetActiveRecursively(false);
		} else {
			//jump out, nothing found
			scannerBeam.gameObject.SetActiveRecursively(false);
			JumpOut();
			
		}
		
	}		
	
	function setLockState( s : boolean ){
		var m : OSCMessage;
		if(s){
			weaponsTarget = theShip;
			//tell clients you have been targetted
			m = OSCMessage("/scene/warzone/youHaveBeenTargetted");
			OSCHandler.Instance.SendMessageToAll(m);
			//warn the ship that they have a weapons lock on them
			for(var t : LaserTurretBehaviour in turrets){
				t.setTarget(weaponsTarget);
			}
		} else {
			m  = OSCMessage("/scene/warzone/youWereUntargetted");
			OSCHandler.Instance.SendMessageToAll(m);
			weaponsTarget = null;
		}
	}
	
	function setWeaponState (s : boolean){
	}
	
	function JumpOut(){
		if(isActive){
			currentAIState = AIState.IDLE;
			warpEffects.Play();
			transform.Find("body").GetComponent.<MeshRenderer>().enabled = false;
			yield WaitForSeconds(1.2);
			dynObj.Deactivate();
			transform.Find("body").GetComponent.<MeshRenderer>().enabled = true;
		}
	}
	
	function JumpIn(){
		//work out a target jump pos in front of ship
		if(!isActive){
			dynObj.Activate();	//make the object active
			//move its sector coord to that of the ship
			var s : int[] = MapController._instance.sectorPos;
			dynObj.sectorCoord = s;
			//calculate a new local pos for the ship, 900 units directly in front of players
			var newPos : Vector3 = theShip.TransformDirection(Vector3.forward) * 300;
			transform.position = newPos;
			currentAIState = AIState.SCANNING;
			warpEffects.Play();
			
			reactorDetectTime = 5.0f;
			
		}
	
	}
	
	function DynamicObjectDeactivate(){
		Debug.Log("dyn");
		currentAIState = AIState.IDLE;
		transform.position = Vector3(-10000, -10000, -10000);
		for (var c : Collider in GetComponentsInChildren(Collider)){
			c.enabled = false;
		}
		
		var rItem :TargettableObject = GetComponent.<TargettableObject>();
		
		visibleAtClient = false;
		isActive = false;
		scanTime = 15.0f;
	}
	
	function DynamicObjectActivate(){
		var rItem :TargettableObject = GetComponent.<TargettableObject>();
		visibleAtClient = true;
		for (var c : Collider in GetComponentsInChildren(Collider)){
			c.enabled = true;
		}
		visibleAtClient = true;
		isActive = true;
	}

	
	function Update () {
		
	
	}

	function OnDrawGizmos(){
		if(targetPoint != null){
			Gizmos.DrawSphere(targetPoint, 10);
		}
	}

}