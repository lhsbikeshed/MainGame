using UnityEngine;
using System;
using UnityOSC;


public class ShipsLaser:MonoBehaviour{
	public AudioClip chargeEffect;
	public AudioClip loopEffect;
	public AudioClip endEffect;
	
	//var missilePrefab : Transform;
	public float fireDuration;
	
	float fireTime;
	AudioSource soundSource ;
	Light haloLight;
	LineRenderer laserRenderer;
	Material laserTexture;
	
	int state; // 0 = off, 1 = firing
	Transform target;
	Transform theShip;
	public int weaponsPower = 2;
	
	public void Start() {
		laserRenderer = GetComponent<LineRenderer>();
		laserTexture = laserRenderer.material;
		theShip = transform.parent;
		
		laserRenderer.enabled = false;
		soundSource = gameObject.AddComponent<AudioSource>();
		soundSource.volume = 0.2f;
	}
	
	//fire at a target taking distance etc into account
	
	public void fireAtTarget(Transform targettedObject){
		OSCMessage msg = null ;
		if(targettedObject == null){
	
			msg = new OSCMessage("/tactical/weapons/noTarget");
			UnityEngine.Debug.Log("no target for firing");
			OSCHandler.Instance.SendMessageToClient("TacticalStation", msg);
			OSCHandler.Instance.DisplayBannerAtClient("TacticalStation", "No Target", "No Target Selected", 1000);
			return;
		}
		try{
			TargettableObject tscript = targettedObject.GetComponent<TargettableObject>();
			if(tscript.exploding == false && state == 0){
				
				float targetRange = (theShip.transform.position - targettedObject.position).magnitude;
				weaponsPower =  (int)UsefulShit.map((float)theShip.GetComponent<ShipCore>().getWeaponsPower(), 0.0f, 12.0f, 0f, 3f);
				float maxBeamRange = (float)(1000 + weaponsPower * 300);
				if(targetRange > maxBeamRange){
					msg = new OSCMessage("/tactical/weapons/targetRange");
					msg.Append<int>(tscript.targetId);
					OSCHandler.Instance.SendMessageToClient("TacticalStation", msg);
					OSCHandler.Instance.DisplayBannerAtClient("TacticalStation", "ERROR", "Target Out Of Range, current range: " + targetRange, 1000);
				} else {
					msg = new OSCMessage("/tactical/weapons/firingAtTarget");
					msg.Append<int>(tscript.targetId);
					OSCHandler.Instance.SendMessageToClient("TacticalStation", msg);
					float damage = (1.0f - Mathf.Clamp((int)(targetRange / maxBeamRange), 0,1)) * (  weaponsPower  / 3.0f) * tscript.baseDamage;
					
					
					tscript.GetShot(damage);
				
				
					state = 1;
					fireTime = Time.fixedTime;	
					target = targettedObject;
				}
				
			}
		} catch (NullReferenceException e){
			UnityEngine.Debug.Log("fucked target");
		}
	}
	
	/* for the npc ship to fire with, distance etc isnt important */
	public void npcFireAtTarget(Transform targettedObject){
		if(state  == 0){
			state = 1;
			fireTime = Time.fixedTime;	
			target = targettedObject;
			UnityEngine.Debug.Log("npc fire");
			TargettableObject tscript = targettedObject.GetComponent<TargettableObject>();
			tscript.GetShot(1.0f);
		}
	}
	
	public int getState(){
		return state;
	}
	
	public void Update() {
		if(target == null){
			state = 0;
		}
		if(state == 1){
			
			
			laserRenderer.SetPosition(0, transform.position);
			laserRenderer.SetPosition(1, target.position);
			var tmp_cs1 = laserTexture.mainTextureOffset;
            tmp_cs1.x -= 0.05f;
            laserTexture.mainTextureOffset = tmp_cs1;
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
}
