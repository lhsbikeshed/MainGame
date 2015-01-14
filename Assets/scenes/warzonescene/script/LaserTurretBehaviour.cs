using UnityEngine;
using System;

public  enum GunState { OFF = 0, CHARGING = 1, FIRING = 2, DISHCHARGING = 3 };

public class LaserTurretBehaviour:MonoBehaviour{
	
	public Transform target;
	public float chargeTime;
	public float duration = 1.0f;
	public Vector3 sweepAngles;	//how much we sweep the laser round when shooting
	public float sweepTime;		//how fast we sweep
	public bool penetrating;	//should the beam stop at the target or continue past
	public bool deliberatelyMiss = false; //should we deliberately miss our target?
	
	public bool silent;
	public AudioClip chargeEffect;
	public AudioClip loopEffect;
	public AudioClip endEffect;
	
	[HideInInspector]
	
	AudioSource soundSource ;
	Light haloLight;
	LineRenderer laserRenderer;
	Material laserTexture;
	
	float startChargeTime;
	float startFireTime;
	
	public GunState state = (GunState)0;	//0 off, 1 charging, 2 firing, 3 discharging

	public void Start() {
		haloLight = GetComponent<Light>();
		laserRenderer = GetComponent<LineRenderer>();
		laserTexture = laserRenderer.material;
		
		haloLight.intensity = 0.0f;
		laserRenderer.enabled = false;
		soundSource = gameObject.AddComponent<AudioSource>();
		soundSource.volume = 0.2f;
	}
	
	public void Update() {
		if((int)state == 1){				//charging
			if(startChargeTime + chargeTime > Time.fixedTime){
				haloLight.intensity = (( Time.fixedTime - startChargeTime) / chargeTime) * 8.0f;
			} else {
				state = (GunState)2;
				//laserRenderer.SetPosition(0, transform.position);
				//laserRenderer.SetPosition(1, target.position);
				laserRenderer.enabled = true;
				startFireTime = Time.fixedTime;
				if(!silent){
					soundSource.Stop();
					soundSource.clip = loopEffect;
					soundSource.Play();
				}
			}
		} else if ((int)state == 2){		//firing
			if(startFireTime + duration > Time.fixedTime){
			
				laserRenderer.SetPosition(0, transform.position);
				Vector3 tgtPos = target.position;
				if(deliberatelyMiss){
					tgtPos = Quaternion.Euler(-2.0f, -2.0f, 0.0f) * tgtPos;
				} else {
					tgtPos = Vector3.Lerp( 	Quaternion.Euler(-sweepAngles.x, -sweepAngles.y, -sweepAngles.z) * tgtPos, 
											Quaternion.Euler(sweepAngles.x, sweepAngles.y, sweepAngles.z) * tgtPos,
											(Time.fixedTime - startFireTime) / duration);
				}
				if(penetrating){
					tgtPos = (tgtPos - transform.position) *  5000.0f;			
				}
				laserRenderer.SetPosition(1, tgtPos);
				var tmp_cs1 = laserTexture.mainTextureOffset;
                tmp_cs1.x -= 0.05f;
                laserTexture.mainTextureOffset = tmp_cs1;
			} else { 
				state = (GunState)0;
				laserRenderer.enabled = false;
				haloLight.intensity = 0.0f;
				if(!silent){
					soundSource.Stop();
					soundSource.clip = endEffect;
					soundSource.Play();
					//soundSource.PlayClipAtPoint(endEffect, transform.position);
				}
			}
		}
	
	}
	
	public void setTarget(Transform targetIn){
		if((int)state == 0){
			target = targetIn;
		}
	}
	public void endFiring(){
	}
	public void startFiring(){
		if((int)state == 0){
			state = (GunState)1;
			startChargeTime = Time.fixedTime;
			if(!silent && chargeEffect != null){
				//soundSource.PlayClipAtPoint(chargeEffect, transform.position);
				soundSource.clip = chargeEffect;
				soundSource.Play();
			}
		}
		
	}
}