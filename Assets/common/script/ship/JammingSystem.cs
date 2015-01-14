using UnityEngine;
using System;
using UnityOSC;


[System.Serializable]
public class JammingSystem: BaseSubsystem , JammingListener{
	
	JammingListener completeCallback;
	public bool running = false;
	
	public override void Start() {
		base.Start();
			completeCallback = this;
	}
	
	public void Update() {
	
	}
	
	public void startJammer(JammingListener cb,int diff){
		completeCallback = cb;
		
		OSCHandler.Instance.ChangeClientScreen("EngineerStation", "jamming", true);
		OSCMessage o = new OSCMessage("/system/jammer/setDifficulty");
		o.Append<int>(diff);
		OSCHandler.Instance.SendMessageToAll(o);
		running = true;
	}
	
	public void gotResult(int res){
		UnityEngine.Debug.Log("got result" + res);
		if(running){
			OSCHandler.Instance.RevertClientScreen("EngineerStation", "jamming");
			completeCallback.jammingResult(res);
			UnityEngine.Debug.Log("Done cb");
			completeCallback = this;
			running = false;
		}
	}
	
	public void jammingResult(int success){
		UnityEngine.Debug.Log("scanner finished with : " + success);
	}
	
	public override void processOSCMessage(OSCMessage message){
		string[] msgAddress = message.Address.Split(separator);
		// [1] = System, 2 = Subsystem name, 3 = operation
		string system = msgAddress[2];
		string target = msgAddress[3];
		switch(target){
			case "jamresult":
				int r = (int)message.Data[0];
				gotResult(r);
				break;
		}
		
	}
	
}
