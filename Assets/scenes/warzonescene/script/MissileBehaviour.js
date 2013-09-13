#pragma strict

var sounds : AudioClip[];
private var parts : ParticleSystem;

private var randomSound : int = 0;
function Start () {
	randomSound = Random.Range(0,sounds.Length);
	parts = GetComponentInChildren.<ParticleSystem>();	

}

function Update () {

}

function silentDie(){
	yield WaitForSeconds(6);
	Destroy(gameObject);
}
function explode(){
	if(parts == null){
		parts = GetComponentInChildren.<ParticleSystem>();
	}
	parts.Play();
	AudioSource.PlayClipAtPoint(sounds[randomSound], transform.position);
	yield WaitForSeconds(6);
	Destroy(gameObject);
}