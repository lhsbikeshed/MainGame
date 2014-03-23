#pragma strict

var target : Transform;
var chargeTime : float;
var duration : float = 1;
var sweepAngles : Vector3;	//how much we sweep the laser round when shooting
var sweepTime : float;		//how fast we sweep
var penetrating : boolean;	//should the beam stop at the target or continue past
var deliberatelyMiss : boolean = false; //should we deliberately miss our target?

var silent : boolean;
var chargeEffect : AudioClip;
var loopEffect : AudioClip;
var endEffect : AudioClip;

@HideInInspector

private var soundSource : AudioSource ;
private var haloLight : Light;
private var laserRenderer : LineRenderer;
private var laserTexture : Material;

private var startChargeTime : float;
private var startFireTime : float;

private var state : int = 0;	//0 off, 1 charging, 2 firing, 3 discharging

function Start () {
	haloLight = GetComponent.<Light>();
	laserRenderer = GetComponent.<LineRenderer>();
	laserTexture = laserRenderer.material;
	
	haloLight.intensity = 0.0;
	laserRenderer.enabled = false;
	soundSource = gameObject.AddComponent.<AudioSource>();
	soundSource.volume = 0.2f;
}

function Update () {
	if(state == 1){				//charging
		if(startChargeTime + chargeTime > Time.fixedTime){
			haloLight.intensity = (( Time.fixedTime - startChargeTime) / chargeTime) * 8.0;
		} else {
			state = 2;
			//laserRenderer.SetPosition(0, transform.position);
			//laserRenderer.SetPosition(1, target.position);
			laserRenderer.enabled = true;
			startFireTime = Time.fixedTime;
			if(!silent){
				soundSource.clip = loopEffect;
				soundSource.Play();
			}
		}
	} else if (state == 2){		//firing
		if(startFireTime + duration > Time.fixedTime){
		
			laserRenderer.SetPosition(0, transform.position);
			var tgtPos : Vector3 = target.position;
			if(deliberatelyMiss){
				tgtPos = Quaternion.Euler(-2.0f, -2.0f, 0) * tgtPos;
			} else {
				tgtPos = Vector3.Lerp( 	Quaternion.Euler(-sweepAngles.x, -sweepAngles.y, -sweepAngles.z) * tgtPos, 
										Quaternion.Euler(sweepAngles.x, sweepAngles.y, sweepAngles.z) * tgtPos,
										(Time.fixedTime - startFireTime) / duration);
			}
			if(penetrating){
				tgtPos = (tgtPos - transform.position) *  5000.0f;			
			}
			laserRenderer.SetPosition(1, tgtPos);
			laserTexture.mainTextureOffset.x -= 0.05;
		} else { 
			state = 0;
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

function setTarget(targetIn : Transform){
	if(state == 0){
		target = targetIn;
	}
}
function endFiring(){
}
function startFiring(){
	if(state == 0){
		state = 1;
		startChargeTime = Time.fixedTime;
		if(!silent && chargeEffect != null){
			soundSource.PlayClipAtPoint(chargeEffect, transform.position);
		}
	}
	
}