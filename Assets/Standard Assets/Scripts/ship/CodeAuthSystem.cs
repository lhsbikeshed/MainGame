using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using UnityOSC;

public class CodeAuthSystem : MonoBehaviour {

	public static CodeAuthSystem Instance;

	bool isRunning = false;

	List<AuthCodeListener> listeners = new List<AuthCodeListener>();

	float duration = 0f;
	float startTime = 0f;


	void Start () {
		Instance = this;
	}

	void FixedUpdate(){
		if(isRunning){
			if(startTime + duration < Time.fixedTime){
				//we have a time out
				isRunning = false;
				//tell the listeners
				foreach(AuthCodeListener l in listeners){
					l.authCodeReturn(CodeState.CODE_TIMEOUT);
				}
			}
		}
	}


	public void addListener(AuthCodeListener lis){
		Debug.Log ("added listener");
		listeners.Add (lis);

	}
	public void removeListener(AuthCodeListener lis){
		if(listeners.Contains(lis)){
			listeners.Remove(lis);
		}
	}

	void codeOk(){

		if(isRunning){
			foreach(AuthCodeListener l in listeners){
				l.authCodeReturn(CodeState.CODE_OK);
			}
		}
		isRunning = false;


	}

	void codeFail(){
		if(isRunning){
			foreach(AuthCodeListener l in listeners){
				l.authCodeReturn(CodeState.CODE_WRONG);
			}
		}
	}

	/* start the code sequence off*/
	public void startCodeRequest(string stationName, string text, string code, float duration){
		if(!isRunning){
			Debug.Log ("Starting code request..");
			this.duration = duration;
			startTime = Time.fixedTime;
			//switch the requested screen to the code one
			OSCHandler.Instance.ChangeClientScreen(stationName, "authdisplay", true);
			OSCMessage m = new OSCMessage("/system/authsystem/authParameters");
			m.Append(code);
			m.Append((long)(duration * 1000));
			m.Append (text);
			OSCHandler.Instance.SendMessageToClient(stationName, m);
			isRunning = true;
		}


	}
	/*cancel a running sequence*/
	public void stopCodeRequest(string stationName){
		if(isRunning){
			isRunning = false;
			OSCHandler.Instance.RevertClientScreen(stationName, "authdisplay");

		}

	}

	public void processOSCMessage(OSCMessage m){
		string[] parts = m.Address.Split('/');
		switch (parts[3]){
		case "codeFail":
			codeFail();
			break;
		case "codeOk":
			codeOk();
			break;
		case "codeOverride":
			codeOk ();
			break;
		}

	}



	public interface AuthCodeListener{
		 void authCodeReturn(CodeState state);
	}
	public enum CodeState {
		CODE_WAITING = 0,
		CODE_OK = 1,
		CODE_WRONG = 2,
		CODE_TIMEOUT = 3
	}
}
