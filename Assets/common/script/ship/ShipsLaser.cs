using UnityEngine;
using System;
using UnityOSC;


public class ShipsLaser:MonoBehaviour{
	//public AudioClip chargeEffect;
	//public AudioClip loopEffect;
	//public AudioClip endEffect;


	//var missilePrefab : Transform;
	public float fireDuration;
	
	float fireTime;
	int state; // 0 = off, 1 = firing
	Transform target;
	Transform theShip;
	public int weaponsPower = 2;	//TODO; this should probably be a float

	public Transform[] turretPoints;
	public Transform currentTurretPoint;	

	public bool forPlayerShip = true;

	public void Start() {

		theShip = transform.parent;

		if(!forPlayerShip){
			foreach(AudioSource a in GetComponentsInChildren<AudioSource>()){
				a.spatialBlend = 1.0f;
			}
		}

	}
	
	//fire at a target taking distance etc into account
	
	public void fireAtTarget(Transform targettedObject){
		OSCMessage msg = null ;
		if(targettedObject == null){
			if(forPlayerShip){
				msg = new OSCMessage("/tactical/weapons/noTarget");
				UnityEngine.Debug.Log("no target for firing");
				OSCHandler.Instance.SendMessageToClient("TacticalStation", msg);
				OSCHandler.Instance.DisplayBannerAtClient("TacticalStation", "No Target", "No Target Selected", 1000);
			}
			return;
		}
		try{
			TargettableObject tscript = targettedObject.GetComponent<TargettableObject>();
			if(tscript.exploding == false && state == 0){
				
				float targetRange = (transform.position - targettedObject.position).magnitude;
				if(forPlayerShip){
					weaponsPower =  (int)UsefulShit.map((float)theShip.GetComponent<ShipCore>().getWeaponsPower(), 0.0f, 12.0f, 0f, 3f);
				} else {
					weaponsPower = 1;
				}
				float maxBeamRange = (float)(1000 + weaponsPower * 300);
				if(targetRange > maxBeamRange){
					if(forPlayerShip){
						msg = new OSCMessage("/tactical/weapons/targetRange");
						msg.Append<int>(tscript.targetId);
						OSCHandler.Instance.SendMessageToClient("TacticalStation", msg);
						OSCHandler.Instance.DisplayBannerAtClient("TacticalStation", "ERROR", "Target Out Of Range, current range: " + targetRange, 1000);
					}
				} else {
					if(forPlayerShip){
						msg = new OSCMessage("/tactical/weapons/firingAtTarget");
						msg.Append<int>(tscript.targetId);
						OSCHandler.Instance.SendMessageToClient("TacticalStation", msg);
					}
					float damage = (1.0f - Mathf.Clamp((int)(targetRange / maxBeamRange), 0,1)) * (  weaponsPower  / 3.0f) * tscript.baseDamage;
					
					
					//tscript.ApplyDamage(DamageTypes.DAMAGE_LASER, damage);
				
				
					state = 1;
					fireTime = Time.fixedTime;	
					target = targettedObject;
					//figure out which turret to use
					float minAngle = 2;
					Transform bestTurret = turretPoints[0];

					foreach (Transform t in turretPoints){
						Vector3 turretDirection = transform.TransformDirection(t.forward);
						Vector3 targetDirection = (targettedObject.position - t.position ).normalized;

						float angle = Vector3.Dot (turretDirection, targetDirection);
//						Debug.Log ("an: " + t.name + " - "  + angle);
						if(angle > 0 && angle < minAngle){
							minAngle = angle;
							bestTurret = t;
						}
					}
					currentTurretPoint = bestTurret;

					bestTurret.GetComponentInChildren<ParticleSystem>().Stop();
					bestTurret.GetComponentInChildren<ParticleSystem>().Play();

					bestTurret.GetComponentInChildren<AudioSource>().Play();

				}
				
			}
		} catch (NullReferenceException e){
			UnityEngine.Debug.Log("fucked target");
		}
	}

	
	public int getState(){
		return state;
	}
	
	public void FixedUpdate() {
		if(target == null){
			state = 0;
		}
		if(state == 1){
			TargettableObject tscript = target.GetComponent<TargettableObject>();
			float dist = (target.position - transform.position).magnitude;
			float distModifier = 1.0f - Mathf.Clamp((int)(dist / (float)(1000 + weaponsPower * 300)), 0,1);
			float damage = distModifier* (  weaponsPower  / 12.0f) * tscript.baseDamage;

			//TODO do damage calcs better
			tscript.ApplyDamage(DamageTypes.DAMAGE_LASER, damage / 15f);

			currentTurretPoint.Find("GunParticles").transform.LookAt(target.transform);

			if(fireTime + fireDuration < Time.fixedTime){
				state = 0;

			
			}
		} 
	
	}
}
