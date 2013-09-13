#pragma strict
interface JammingListener {

	 function jammingResult(res :int) ;
}

class JammingSystem extends BaseSubsystem implements JammingListener{
	
	private var completeCallback : JammingListener = this;
	var running : boolean = false;
	
	function Start () {
		super.Start();
	}
	
	function Update () {
	
	}
	
	function startJammer(cb : JammingListener){
		completeCallback = cb;
		
		OSCHandler.Instance.ChangeClientScreen("EngineerStation", "jamming");
		running = true;
	}
	
	function gotResult(res : int){
		Debug.Log("got result" + res);
		if(running){
			completeCallback.jammingResult(res);
			Debug.Log("Done cb");
			completeCallback = this;
			running = false;
		}
	}
	
	function jammingResult(success : int){
		Debug.Log("scanner finished with : " + success);
	}
	
	function processOSCMessage(message : OSCMessage){
		var msgAddress = message.Address.Split(separator);
		// [1] = System, 2 = Subsystem name, 3 = operation
		var system = msgAddress[2];
		var target = msgAddress[3];
		switch(target){
			case "jamresult":
				var r : int = message.Data[0];
				gotResult(r);
				break;
		}
		
	}
	
}