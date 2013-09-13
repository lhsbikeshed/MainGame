#pragma strict
public class GasCloudBehaviour extends DynamicFieldObjectBehaviour{

	var alphaLevel : float; 
	var flashRate : float;	//chance that we do a lightning flash
	var numberOfPlanes : int;
	var flashing : boolean = false;
	
	
	
	
	private var meshRenderer : Renderer[];
	private var theShip :GameObject;
	private var flashTimer : float;
	

	function Start () {
			meshRenderer = gameObject.GetComponentsInChildren.<Renderer>();
			theShip = GameObject.Find("TheShip");
			transform.LookAt(theShip.transform);
			var p : Transform = transform.Find("Plane");
			
			for(var i = 0; i < numberOfPlanes; i++){
				var b : Transform = Instantiate(p, Vector3(Random.Range(-2,2), Random.Range(-2,2),0), Quaternion.Euler(90,0,0));
				b.parent = transform;
				b.transform.localPosition =  Vector3(Random.Range(-10,10), Random.Range(-10,10), 0);	
				b.transform.localRotation = Quaternion.Euler(90,Random.Range(0,360),0);
				b.localScale = Vector3.one;
			}
	}	
	
	function Update () {
		//transform.LookAt(theShip.transform);
		var dist : float = Vector3.Distance(theShip.transform.position, transform.position);
		if (dist < 800){
			alphaLevel = ((dist - 500) / 300.0f);
			if(alphaLevel < 0.0f) { alphaLevel = 0.0f; }
			for (m in meshRenderer){
				m.material.SetColor("_TintColor",  Color(1.0,1.0,1.0, alphaLevel));
			}
		}
		
		if(flashing){
			var col : float;
			col = 1 - (Time.fixedTime - flashTimer) / 1.6;
			col = Mathf.Clamp(col, 0,1);
			for (m in meshRenderer){
				m.material.SetColor("_TintColor", Color(col, col, col, alphaLevel));
			}
			if( col <= 0){
				flashing = false;
			}
		}
		
		if(Random.value < flashRate){
			lightningFlash();
		}
		
			
	}
	
	function resetTo( newpos : Vector3){
		for (m in meshRenderer){
				m.material.SetColor("_TintColor",  Color(1.0,1.0,1.0, 1.0));
		}
		transform.position = newpos;
		//transform.LookAt(theShip.transform);
		alphaLevel = 1.0f;
	
	}
	
	function lightningFlash(){
		if(!flashing){
			flashing = true;
			flashTimer = Time.fixedTime;
		}
	}
	
}