#pragma strict
public class EvilCloudBehaviour extends DynamicFieldObjectBehaviour{

	var alphaLevel : float; 
	var flashRate : float;	//chance that we do a lightning flash
	var numberOfPlanes : int;
	var flashing : boolean = false;
	
	
	
	
	private var meshRenderer : Renderer[];
	private var theShip :GameObject;
	private var flashTimer : float;
	var targetStrike : Transform;
	private var randomPts : Vector3[];
	private var lineRenderer : LineRenderer;
	private var lastPosSwitch : float = 0; //last time the bolt flickered;
	var testStrike : boolean = false;
	

	function Start () {
			meshRenderer = gameObject.GetComponentsInChildren.<Renderer>();
			theShip = GameObject.Find("TheShip");
			transform.LookAt(theShip.transform);
			var p : Transform = transform.Find("Plane");
			lineRenderer = GetComponent.<LineRenderer>();
			for(var i = 0; i < numberOfPlanes; i++){
				var b : Transform = Instantiate(p, Vector3(Random.Range(-2,2), Random.Range(-2,2),0), Quaternion.Euler(90,0,0));
				b.parent = transform;
				b.transform.localPosition =  Vector3(Random.Range(-10,10), Random.Range(-10,10), 0);	
				b.transform.localRotation = Quaternion.Euler(90,Random.Range(0,360),0);
				b.localScale = Vector3.one;
			}
	}	
	
	function strikeAtTarget(){
		flashing = true;
		flashTimer = Time.fixedTime;
		randomPts = new Vector3[10];
		
		
		for( var i = 0; i < 10; i++){
			randomPts[i] = Vector3.Slerp(transform.position, targetStrike.position, i / 10.0f);
			//now move that point outward from the line
			if(i < 9){
				randomPts[i] += Random.onUnitSphere * 150.0f;;
			}
			lineRenderer.SetPosition(i, randomPts[i]);
		}
		
		
	}
	
	function strikeAtRandom(){
		flashing = true;
		flashTimer = Time.fixedTime;
		randomPts = new Vector3[10];
		
		var targetPos : Vector3 = transform.position + Random.onUnitSphere * 2500.0f;
		for( var i = 0; i < 10; i++){
			randomPts[i] = Vector3.Slerp(transform.position, targetPos, i / 10.0f);
			//now move that point outward from the line
			randomPts[i] += Random.onUnitSphere * 150.0f;;
			
			lineRenderer.SetPosition(i, randomPts[i]);
		}
		
		
	}
	
	
	function Update () {
		if(testStrike){
		 	testStrike =false;
		 	strikeAtTarget();
		}
	
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
			col = 1 - (Time.fixedTime - flashTimer) / 1.2;
			col = Mathf.Clamp(col, 0,1);
			for (m in meshRenderer){
				m.material.SetColor("_TintColor", Color(col, col, col, alphaLevel));
			}
			if( col <= 0){
				flashing = false;
			}
			if(lastPosSwitch + 0.1f < Time.fixedTime){
				
				for( var i = 0; i < 10; i++){
					if(targetStrike != null){
						randomPts[i] = Vector3.Slerp(transform.position, targetStrike.position, i / 10.0f);
						if(i < 9){
							randomPts[i] += Random.onUnitSphere * 150.0f;;
						}
					} else {
						randomPts[i] += Random.onUnitSphere * 150.0f;;
					}
					lineRenderer.SetPosition(i, randomPts[i]);
				}
				lastPosSwitch = Time.fixedTime;	
			}
		}
		
		if(Random.value < flashRate){
			//targetStrike = GameObject.Find("TheShip").transform;
			
			strikeAtRandom();
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