#pragma strict


var source : AudioSource;
var clips : Object[];

private var postDelay : float = 1.0;
private var lastPlay : float = 1.0;

var running : boolean = false;

private var shipReactor : Reactor;

function Start () {
	clips = Resources.LoadAll("atc", typeof(AudioClip));
	Debug.Log("loaded " + clips.Length + " atc clips");
	source = gameObject.AddComponent("AudioSource");
	source.volume = 0.26f;
	
	shipReactor = GameObject.Find("TheShip").GetComponent.<Reactor>();
}


function FixedUpdate () {
	running = shipReactor.systemEnabled;
	
	if(source.isPlaying == false && running){
		if(lastPlay + postDelay < Time.fixedTime){
			lastPlay = Time.fixedTime;
			postDelay = Random.Range(0.5, 1.5);
			//queue a new sound
			source.clip = clips[ Mathf.FloorToInt(Random.Range(0, clips.Length)) ];
			source.Play();
		}
	}
}