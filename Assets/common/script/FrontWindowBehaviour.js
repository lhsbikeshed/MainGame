#pragma strict

/* controls the Behaviour of the front window
 * can be cracked if hit hard enough
 */

var crashTextures : Texture2D[];
var crackPrefab : Transform;
var airleakPrefab : Transform;

var airleakChance : float = 5.0;
var repairTime : float = 10.0;

var minSize : float = 0.01;
var maxSize : float = 0.1;
var minVel : float = 50;
var maxVel : float = 300;

var leaking : boolean = false;
var leakSound : AudioClip;

var coolDownTime : float = 0.4;
private var lastHitTime : float;

private var leakStartTime : float;
private var smashPos : Array;
private var particles: Array;
private var smashType : Array;
var cam : Camera;


private var planes : Array;
private var theShip : Transform;


function Start () {
	smashPos  = new Array();
	smashType = new Array();
	particles = new Array();
	
	planes = new Array();
	crackPrefab.gameObject.active = false;
	airleakPrefab.gameObject.active = false;
	theShip = GameObject.Find("TheShip").transform;
	
}

function FixedUpdate () {
	if(Input.GetKey("a") ){
		hitSomething(Random.Range(50,300));
	}
	if(leaking){
		/*if(leakStartTime + repairTime < Time.fixedTime){
			leaking = false;
			
			theShip.GetComponent.<MiscSystem>().leaking = false;
			for(var p : ParticleSystem in GetComponentsInChildren.<ParticleSystem>() ){
				
				Destroy(p.gameObject);
				
			}
		}*/
	
		
	}	
    
}

function spawnCrack(howHard : float){

		var rand : int = (map(howHard, minVel, maxVel, 0, crashTextures.Length));
		if(rand >= crashTextures.Length){
			rand = crashTextures.Length - 1;
		}
		Debug.Log(howHard + " " + rand);
		//Mathf.FloorToInt(Random.Range(0, crashTextures.Length));
		var p : Transform = transform.Instantiate(crackPrefab, Vector3.zero, Quaternion.identity);
		p.renderer.material.mainTexture = crashTextures[rand];
		p.parent = transform;
		p.transform.localPosition = Vector3(Random.Range(-.9,.9), Random.Range(-0.6, 0.6), 1.05);
		//p.transform.localRotation = Quaternion.Euler(270, Random.Range(0,360), 0);
		p.transform.rotation =  transform.rotation * Quaternion.Euler(90,0,0);  
		p.transform.localRotation *= Quaternion.Euler(0, Random.Range(0,360),0 );
		var sc : float = (rand + 1) / 4.0f * Mathf.Clamp( (howHard - minVel) * (maxSize - minSize) / (maxVel - minVel) + minSize , minSize, maxSize);
		p.transform.localScale = Vector3.one * sc; //Random.Range(0.01, 0.1);
		
		//5% chance of causing an air leak if its a big hit AND we arent leaking already
		if(rand == 2 && Random.Range(0,100) < airleakChance && leaking == false){
			var t : Transform = transform.Instantiate(airleakPrefab, Vector3.zero, Quaternion.identity);
			t.parent = p;
			t.localPosition = Vector3(-2.7,0,0);
			t.transform.rotation = transform.rotation;// * Quaternion.Euler(-180,0,0);
			theShip.GetComponent.<MiscSystem>().leaking = true;
			//particles.push(t);
			leaking = true;
			leakStartTime = Time.fixedTime;
			//AudioSource.PlayClipAtPoint(leakSound, transform.position);
			CabinEffects.Instance().QueueVoiceOver(leakSound,1);
		}
		planes.push(p);
}

function hitSomething(st : float){
	
//	var pos : Vector3 = Vector3(Random.Range(0,Screen.width), Random.Range(0,Screen.height),0);
//	var rotation : Quaternion = Quaternion.EulerAngles(0,0, Random.Range(0,360));
//	smashType.Push(Mathf.FloorToInt(Random.Range(0, crashTextures.Length)));
	
//	smashPos.Push(pos);
	if(lastHitTime + coolDownTime < Time.fixedTime){
		lastHitTime = Time.fixedTime;
		spawnCrack(st);
	}
}

function map(x : float, in_min : float, in_max : float, out_min : float, out_max : float) : float
{
  return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}