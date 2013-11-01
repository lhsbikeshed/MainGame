#pragma strict


/* speak a distance using attached sounds */
private var theShip : Transform;
var sounds : AudioClip[];
private var speaking : boolean = false;

public static var _instance : DistanceSpeaker;


function Start () {
	_instance = this;

}


public static function Instance() : DistanceSpeaker {
	
	return _instance;
}


function Update () {

}

function DistancePart(clip : int, fig : int){
	AudioSource.PlayClipAtPoint(sounds[clip], transform.position);
	yield WaitForSeconds(sounds[clip].length);
	if(fig == 1000){
		//Debug.Log(clip + "thousand");
		AudioSource.PlayClipAtPoint(sounds[11], transform.position);
		yield WaitForSeconds(sounds[11].length);
	} else if (fig == 100){
		//Debug.Log(clip + "hundred");
		
		AudioSource.PlayClipAtPoint(sounds[10], transform.position);
		yield WaitForSeconds(sounds[10].length);
		
	}
	
}


function SpeakDistance(distance : float, figures : int){
	SpeakDistance(distance, figures, true);
}

function SpeakDistance(distance : float, figures : int, metersSuffix : boolean){

	//figures == 1000 or 100
	var toSpeak : int;
	if(figures == 1000){
		toSpeak = Mathf.FloorToInt(distance / 1000.0f);
		if(toSpeak < 0 || toSpeak > 10){
			return;
		}
		if(!speaking){
			speaking = true;
			yield DistancePart(toSpeak, 1000);
			//metres
			if(metersSuffix){
				AudioSource.PlayClipAtPoint(sounds[12], transform.position);
				yield WaitForSeconds(sounds[12].length);
			}
			speaking = false;
		}
	} else if (figures == 100){
		var thousands : int = Mathf.FloorToInt(distance / 1000.0f);
		toSpeak = thousands;
		if(toSpeak < 0 || toSpeak > 10){
			return;
		}
		if(!speaking){
			speaking = true;
			if(toSpeak > 0){
				yield DistancePart(toSpeak, 1000);
			}
			var hundreds = distance - thousands * 1000;
			toSpeak = Mathf.FloorToInt(hundreds / 100.0f);
			
			if(toSpeak < 0 || toSpeak > 10){
				return;
			}
			if(toSpeak > 0){
				yield DistancePart(toSpeak, 100);
			}
			
			//metres
			if(metersSuffix){
				AudioSource.PlayClipAtPoint(sounds[12], transform.position);
				yield WaitForSeconds(sounds[12].length);
			}
			speaking = false;
		}
	} else if (figures == 10){
	} else if (figures == 1){
		speaking = true;
		var s : int = Mathf.FloorToInt(distance);
		AudioSource.PlayClipAtPoint(sounds[s], transform.position);
		yield WaitForSeconds(sounds[s].length);
		if(metersSuffix){
			AudioSource.PlayClipAtPoint(sounds[12], transform.position);
			yield WaitForSeconds(sounds[12].length);
		}
		speaking = false;
	}
	
	
}