#pragma strict

private var particles : ParticleSystem;
private var lights : BlinkenFlareBehaviour[];
private var audioEffects : AudioSource[];



function Start () {
	particles = GetComponent(ParticleSystem);
	particles.enableEmission = false;
	
	lights = GetComponentsInChildren.<BlinkenFlareBehaviour>();
	
	audioEffects = GetComponentsInChildren.<AudioSource>();
}

//amount of air in the chamber, from 0 - 1
function setAtmosphereLevel(level : float){

	for( var s : AudioSource in audioEffects){
		s.volume = level;
	}

}

function Update () {

}

function start(){
	particles.enableEmission = true;
	for (var l : BlinkenFlareBehaviour in lights){
		l.blinking = true;
	}
	audioEffects[1].Play();
	
}

function stop(){
	particles.enableEmission = false;
	for (var l : BlinkenFlareBehaviour in lights){
		l.blinking = false;
	}
}