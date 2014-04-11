#pragma strict

var maxSize : float = 100.0f;
var duration : float = 2.0f;
var sizeOverTime : AnimationCurve;
var alphaOverTime : AnimationCurve;

private var startTime : float;
private var exploding : boolean = false;
private var renderers : Renderer[];

var test : boolean = false;
function Start () {
	renderers = GetComponentsInChildren.<Renderer>();
}

function Explode(){
	startTime = Time.fixedTime;
	exploding = true;
}

function FixedUpdate () {
	if(test){
		test = false;
		Explode();
	}

	if(exploding){
		var t : float = (Time.fixedTime - startTime) / duration;
		transform.localScale = Vector3.one * sizeOverTime.Evaluate(t) * maxSize;
		for (var r : Renderer in renderers){
			r.material.color.a = alphaOverTime.Evaluate(t);
		}
		if(t > 1.0f){
			exploding = false;
			Destroy(gameObject);
		}
	}
	
}