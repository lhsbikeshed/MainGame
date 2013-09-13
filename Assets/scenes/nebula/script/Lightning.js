#pragma strict

public class Lightning extends DynamicFieldObjectBehaviour{
	var flashRate : float;
	var maxBrightness :float;
	private var flashTime : float;
	
	private var thisLight : Light;
	
	function Start () {
		thisLight = GetComponent.<Light>();
		thisLight.intensity = 0.0f;
	}	
	
	function Update () {
		
	}
	
	function resetTo( newpos : Vector3){
			transform.position = newpos;
	}
	
	function FixedUpdate(){
		
		if(Random.value <= flashRate / 10.0f){
			flashTime = Time.fixedTime;
		}
		
		if (flashTime + 0.2 > Time.fixedTime){
			thisLight.intensity = Mathf.Lerp(0,maxBrightness,(Time.fixedTime - flashTime) / 0.2);
		} else if (flashTime + 0.2 <= Time.fixedTime && flashTime + 1.0 < Time.fixedTime){
			thisLight.intensity = Mathf.Lerp(maxBrightness,0,(Time.fixedTime - flashTime - 0.2));
		}
		
	}	
}
