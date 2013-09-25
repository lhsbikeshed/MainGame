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


function Start () {
	laserRenderer = GetComponent.<LineRenderer>();
	laserTexture = laserRenderer.material;
	
	
	laserRenderer.enabled = false;
	soundSource = gameObject.AddComponent.<AudioSource>();
	soundSource.volume = 0.2f;
}

//fire at a fixed position
function fireAtTarget(pos : Transform){
	
	if (state == 0){
		state = 1;
		fireTime = Time.fixedTime;	
		target = pos;
		
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