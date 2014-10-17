//
//	  UnityOSC - Open Sound Control interface for the Unity3d game engine	  
//
//	  Copyright (c) 2012 Jorge Garcia Martin
//
// 	  Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated 
// 	  documentation files (the "Software"), to deal in the Software without restriction, including without limitation
// 	  the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, 
// 	  and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// 
// 	  The above copyright notice and this permission notice shall be included in all copies or substantial portions 
// 	  of the Software.
//
// 	  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED 
// 	  TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL 
// 	  THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF 
// 	  CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
// 	  IN THE SOFTWARE.
//
//	  Inspired by http://www.unifycommunity.com/wiki/index.php?title=AManagerClass

using System;
using System.Net;
using System.Collections.Generic;
using System.Xml;
using System.IO;

using UnityEngine;
using UnityOSC;

/// <summary>
/// Models a log of a server composed by an OSCServer, a List of OSCPacket and a List of
/// strings that represent the current messages in the log.
/// </summary>
public struct ServerLog
{
	public OSCServer server;
	public List<OSCPacket> packets;
	public List<string> log;
}

/// <summary>
/// Models a log of a client composed by an OSCClient, a List of OSCMessage and a List of
/// strings that represent the current messages in the log.
/// </summary>
public struct ClientLog
{
	public OSCClient client;
	public List<OSCMessage> messages;
	public List<string> log;
}

/// <summary>
/// Handles all the OSC servers and clients of the current Unity game/application.
/// Tracks incoming and outgoing messages.
/// </summary>
public class OSCHandler : MonoBehaviour
{
	public class ScreenItem {
		public String screenName;
		public bool topMost = false;

		public ScreenItem(String n, bool topMost){
			this.screenName = n;
			this.topMost = topMost;
		}
	}

	#region Singleton Constructors
	static OSCHandler()
	{
	}

	OSCHandler()
	{
	}
	
	public static OSCHandler Instance 
	{
	    get 
		{
	        if (_instance == null) 
			{
				_instance = new GameObject ("OSCHandler").AddComponent<OSCHandler>();
				//added by tom 
				DontDestroyOnLoad(_instance);
	        }
	       
	        return _instance;
	    }
	}
	#endregion
	
	#region Member Variables
	private static OSCHandler _instance = null;
	private Dictionary<string, ClientLog> _clients = new Dictionary<string, ClientLog>();
	private Dictionary<string, ServerLog> _servers = new Dictionary<string, ServerLog>();
	
	private const int _loglength = 100;
	#endregion
	
	public Dictionary<string, List<ScreenItem>> clientScreens = new Dictionary<string, List<ScreenItem>>();	//this is a stack for each console. Map console name to list of screens
	public Dictionary<string, string> configItems = new Dictionary<string, string>();
	
	/// <summary>
	/// Initializes the OSC Handler.
	/// Here you can create the OSC servers and clientes.
	/// </summary>
	public void Init()
	{
		
		Debug.Log("attempting to load from file..");
		XmlDocument doc = new XmlDocument();
		doc.Load (Application.dataPath + Path.DirectorySeparatorChar + "config.xml");
		XmlNode root = doc.DocumentElement;
		System.Collections.IEnumerator en = root.GetEnumerator();
		Boolean testMode = false;
		XmlNode n;
		while(en.MoveNext()){
			n = (XmlNode) en.Current;
			if(n.Name == "testmode"){
				
				testMode = n.InnerXml == "true" ? true : false;
				Debug.Log ("Test mode: " + testMode);
			}else if(n.Name == "client"){
				String stationName = n.Attributes["name"].Value;
				String[] ipport = n.InnerXml.Split (':');
				if(testMode){
					ipport[0] = "127.0.0.1";
				}
				CreateClient(stationName, IPAddress.Parse(ipport[0]), int.Parse(ipport[1]));
				Debug.Log ("Created client: " + stationName + " - " +ipport[0] + ":" + ipport[1]);
			} else {
				Debug.Log ("loaded item: " + n.Name);
				configItems.Add (n.Name, n.InnerXml);
			}
					
				
		}
		
		//Initialize OSC clients (transmitters)
		//Example:		
		//CreateClient("EngineerStation", IPAddress.Parse(engineerIP), 12001);
		//CreateClient("PilotStation", IPAddress.Parse(pilotIP), 12002);
		//CreateClient("CaptainStation", IPAddress.Parse(captainIP), 12003);
		//CreateClient("TacticalStation", IPAddress.Parse(tacticalIP), 12004);
		//CreateClient("ModStation", IPAddress.Parse(modIP), 12005);
		//Initialize OSC servers (listeners)
		//Example:
		
		//CreateServer("AndroidPhone", 6666);	
		CreateServer("Clients", 12000);
		CreateServer("Joystick", 19999);
		
		clientScreens["EngineerStation"] = new List<ScreenItem>();
		clientScreens["EngineerStation"].Add(new ScreenItem("power", false));

		clientScreens["PilotStation"] = new List<ScreenItem>();
		clientScreens["PilotStation"].Add (new ScreenItem("docking", false));

		clientScreens["TacticalStation"] = new List<ScreenItem>();
		clientScreens["TacticalStation"].Add (new ScreenItem("weapons", false));

		clientScreens["CommsStation"] = new List<ScreenItem>();
		clientScreens["CommsStation"].Add (new ScreenItem("idleDisplay", false));
		

	}
	
	
	
	#region Properties
	public Dictionary<string, ClientLog> Clients
	{
		get
		{
			return _clients;
		}
	}
	
	public Dictionary<string, ServerLog> Servers
	{
		get
		{
			return _servers;
		}
	}
	#endregion
	
	#region Methods
	
	public void dieFuckerDie(){
		OnApplicationQuit();
	}
	
	/// <summary>
	/// Ensure that the instance is destroyed when the game is stopped in the Unity editor
	/// Close all the OSC clients and servers
	/// </summary>
	void OnApplicationQuit() 
	{
		Debug.Log ("Shutdown osc..");
		foreach(KeyValuePair<string,ClientLog> pair in _clients)
		{
			pair.Value.client.Close();
		}
		
		foreach(KeyValuePair<string,ServerLog> pair in _servers)
		{
			pair.Value.server.Close();
		}
			Debug.Log ("..done");
		_instance = null;
	}
	
	/// <summary>
	/// Creates an OSC Client (sends OSC messages) given an outgoing port and address.
	/// </summary>
	/// <param name="clientId">
	/// A <see cref="System.String"/>
	/// </param>
	/// <param name="destination">
	/// A <see cref="IPAddress"/>
	/// </param>
	/// <param name="port">
	/// A <see cref="System.Int32"/>
	/// </param>
	public void CreateClient(string clientId, IPAddress destination, int port)
	{
		ClientLog clientitem = new ClientLog();
		clientitem.client = new OSCClient(destination, port);
		clientitem.log = new List<string>();
		clientitem.messages = new List<OSCMessage>();
		
		_clients.Add(clientId, clientitem);
		
		// Send test message
		string testaddress = "/test/alive/";
		OSCMessage message = new OSCMessage(testaddress, destination.ToString());
		message.Append(port); message.Append("OK");
		
		_clients[clientId].log.Add(String.Concat(DateTime.UtcNow.ToString(),".",
		                                         FormatMilliseconds(DateTime.Now.Millisecond), " : ",
		                                         testaddress," ", DataToString(message.Data)));
		_clients[clientId].messages.Add(message);
		
		_clients[clientId].client.Send(message);
	}
	
	/// <summary>
	/// Creates an OSC Server (listens to upcoming OSC messages) given an incoming port.
	/// </summary>
	/// <param name="serverId">
	/// A <see cref="System.String"/>
	/// </param>
	/// <param name="port">
	/// A <see cref="System.Int32"/>
	/// </param>
	public void CreateServer(string serverId, int port)
	{
		ServerLog serveritem = new ServerLog();
		serveritem.server = new OSCServer(port);
		serveritem.log = new List<string>();
		serveritem.packets = new List<OSCPacket>();
		
		_servers.Add(serverId, serveritem);
	}
	
	public void SendMessageToAll(OSCMessage message){
		foreach(KeyValuePair<string,ClientLog> pair in _clients){
			SendMessageToClient(pair.Key, message);
		}
			

		/*
		SendMessageToClient("EngineerStation", message);
		SendMessageToClient("PilotStation", message);
		SendMessageToClient("CaptainStation", message);
		SendMessageToClient("TacticalStation", message);
		SendMessageToClient("ModStation", message);*/

	}
	
	/* revert to whatever was on client screen before
	 * if the screen on top of the stack is the one asking to revert then pop it
	 * if not then iterate over screen stack and remove it
	 */
	public void RevertClientScreen(String station, String callingName){
		List<ScreenItem> screenStack = clientScreens[station];

		for(int i = screenStack.Count -1; i >= 0; i--){
			if(screenStack[i].screenName == callingName){
				screenStack.RemoveAt(i);
				String screenName = screenStack[0].screenName;
				Debug.Log ("Reverting client screen for " + station + " to : " + callingName);
				try {
					
					OSCMessage msg = new OSCMessage("/clientscreen/" + station + "/changeTo");
					msg.Append<String>(screenName);
					
					SendMessageToClient (station, msg);
					
					
					
					
				} catch (KeyNotFoundException e ){
					Debug.Log ("Tried to revert client screen change and failed");
				}
			}
		}

	}

	public void ChangeClientScreen(String station, String screenName){
		ChangeClientScreen(station, screenName, false);
	}
	
	/* send a message to the client to change screens */
	public void ChangeClientScreen(String station, String screenName, bool topMost){
		try {

			//if the screen we want to display is topmost AND already exists in the stack then bring it to the front
			bool didWeRaiseScreen = false;
			if(topMost){
				for(int i = clientScreens[station].Count -1; i >= 0; i--){

					if(clientScreens[station][i].screenName == screenName){
						//promote to top of stack
						ScreenItem it = clientScreens[station][i];
						clientScreens[station].RemoveAt(i);
						clientScreens[station].Insert(0, it);
						didWeRaiseScreen  = true;
						Debug.Log ("raised screen " + screenName);
						OSCMessage msg = new OSCMessage("/clientscreen/" + station + "/changeTo");
						msg.Append<String>(screenName);
						
						SendMessageToClient (station, msg);
						break;
					}
				}
			}

			//if we didnt raise a screen to the top then insert the screen either on top of the stack
			// or at the next lowest point below the topmost items
			if(!didWeRaiseScreen){
				//if the screen is set to be topmost, then jsut stuff it at index 0
				//if it isnt then insert it below the topmost screens
				int index  = 0;
				if(!topMost){
					foreach(ScreenItem s in clientScreens[station]){
						if(s.topMost == false){
							break;
						} 
						index ++;

					}
				}
				Debug.Log ("inserting screen " + screenName + " at pos " + index  + " and it is topmost: " + topMost);
				clientScreens[station].Insert(index, new ScreenItem(screenName, topMost));

				//if we inserted at top of stack then tell the clients to change
				if(index == 0){

					OSCMessage msg = new OSCMessage("/clientscreen/" + station + "/changeTo");
					msg.Append<String>(screenName);
					
					SendMessageToClient (station, msg);
				}
			}


			
		} catch (KeyNotFoundException e ){
			Debug.Log ("Tried to send client screen change and failed");
		}
		
	}
	
	public void DisplayBannerAtClient(String station, String title, String text, int duration){
		OSCMessage m  = new OSCMessage("/clientscreen/showBanner");
		m.Append<String>(title);
		m.Append<String>(text);
		m.Append<int>(duration);
		SendMessageToClient(station, m);
	}
	
	
	/// <summary>
	/// Sends an OSC message to a specified client, given its clientId (defined at the OSC client construction),
	/// OSC address and a single value. Also updates the client log.
	/// </summary>
	/// <param name="clientId">
	/// A <see cref="System.String"/>
	/// </param>
	/// <param name="address">
	/// A <see cref="System.String"/>
	/// </param>
	/// <param name="value">
	/// A <see cref="T"/>
	/// </param>
	public void SendMessageToClient<T>(string clientId, string address, T value)
	{
		List<object> temp = new List<object>();
		temp.Add(value);
		
		SendMessageToClient(clientId, address, temp);
	}
	public void SendMessageToClient(string clientId, OSCMessage message)
	{	
		if(_clients.ContainsKey(clientId))
		{
			
			
			if(_clients[clientId].log.Count < _loglength)
			{
				_clients[clientId].log.Add(String.Concat(DateTime.UtcNow.ToString(),".",
				                                         FormatMilliseconds(DateTime.Now.Millisecond),
				                                         " : ", message.Address, " ", DataToString(message.Data)));
				_clients[clientId].messages.Add(message);
			}
			else
			{
				_clients[clientId].log.RemoveAt(0);
				_clients[clientId].messages.RemoveAt(0);
				
				_clients[clientId].log.Add(String.Concat(DateTime.UtcNow.ToString(),".",
				                                         FormatMilliseconds(DateTime.Now.Millisecond),
				                                         " : ", message.Address, " ", DataToString(message.Data)));
				_clients[clientId].messages.Add(message);
			}
			
			_clients[clientId].client.Send(message);
		}
		else
		{
			Debug.LogError(string.Format("Can't send OSC messages to {0}. Client doesn't exist.", clientId));
		}
	}
	/// <summary>
	/// Sends an OSC message to a specified client, given its clientId (defined at the OSC client construction),
	/// OSC address and a list of values. Also updates the client log.
	/// </summary>
	/// <param name="clientId">
	/// A <see cref="System.String"/>
	/// </param>
	/// <param name="address">
	/// A <see cref="System.String"/>
	/// </param>
	/// <param name="values">
	/// A <see cref="List<T>"/>
	/// </param>
	public void SendMessageToClient<T>(string clientId, string address, List<T> values)
	{	
		if(_clients.ContainsKey(clientId))
		{
			OSCMessage message = new OSCMessage(address);
		
			foreach(T msgvalue in values)
			{
				message.Append(msgvalue);
			}
			
			if(_clients[clientId].log.Count < _loglength)
			{
				//_clients[clientId].log.Add(String.Concat(DateTime.UtcNow.ToString(),".",
				//                                         FormatMilliseconds(DateTime.Now.Millisecond),
				 //                                        " : ", address, " ", DataToString(message.Data)));
				_clients[clientId].messages.Add(message);
			}
			else
			{
				//_clients[clientId].log.RemoveAt(0);
				_clients[clientId].messages.RemoveAt(0);
				
				//_clients[clientId].log.Add(String.Concat(DateTime.UtcNow.ToString(),".",
				 //                                        FormatMilliseconds(DateTime.Now.Millisecond),
				//                                         " : ", address, " ", DataToString(message.Data)));
				_clients[clientId].messages.Add(message);
			}
			
			_clients[clientId].client.Send(message);
		}
		else
		{
			Debug.LogError(string.Format("Can't send OSC messages to {0}. Client doesn't exist.", clientId));
		}
	}
	
	/// <summary>
	/// Updates clients and servers logs.
	/// </summary>
	public void UpdateLogs()
	{
		foreach(KeyValuePair<string,ServerLog> pair in _servers)
		{
			if(_servers[pair.Key].server.LastReceivedPacket != null)
			{
				//Initialization for the first packet received
				if(_servers[pair.Key].log.Count == 0)
				{	
					_servers[pair.Key].packets.Add(_servers[pair.Key].server.LastReceivedPacket);
						
					_servers[pair.Key].log.Add(String.Concat(DateTime.UtcNow.ToString(), ".",
					                                         FormatMilliseconds(DateTime.Now.Millisecond)," : ",
					                                         _servers[pair.Key].server.LastReceivedPacket.Address," ",
					                                         DataToString(_servers[pair.Key].server.LastReceivedPacket.Data)));
					break;
				}
				/*		
				if(_servers[pair.Key].server.LastReceivedPacket.TimeStamp
				   != _servers[pair.Key].packets[_servers[pair.Key].packets.Count - 1].TimeStamp)
				*/
				OSCPacket p = _servers[pair.Key].server.getPacket();
				if(p!=null)
				{	
					//_servers[pair.Key].server.LastReceivedPacket.readFromServer = true;
					if(_servers[pair.Key].log.Count > _loglength - 1)
					{
						_servers[pair.Key].log.RemoveAt(0);
						_servers[pair.Key].packets.RemoveAt(0);
					}
		
					_servers[pair.Key].packets.Add(p);
						
					_servers[pair.Key].log.Add(String.Concat(DateTime.UtcNow.ToString(), ".",
					                                         FormatMilliseconds(DateTime.Now.Millisecond)," : ",
					                                         p.Address," ",
					                                         DataToString(p.Data)));
				}
			}
		}
	}
	
	/// <summary>
	/// Converts a collection of object values to a concatenated string.
	/// </summary>
	/// <param name="data">
	/// A <see cref="List<System.Object>"/>
	/// </param>
	/// <returns>
	/// A <see cref="System.String"/>
	/// </returns>
	private string DataToString(List<object> data)
	{
		string buffer = "";
		
		for(int i = 0; i < data.Count; i++)
		{
			buffer += data[i].ToString() + " ";
		}
		
		buffer += "\n";
		
		return buffer;
	}
	
	/// <summary>
	/// Formats a milliseconds number to a 000 format. E.g. given 50, it outputs 050. Given 5, it outputs 005
	/// </summary>
	/// <param name="milliseconds">
	/// A <see cref="System.Int32"/>
	/// </param>
	/// <returns>
	/// A <see cref="System.String"/>
	/// </returns>
	private string FormatMilliseconds(int milliseconds)
	{	
		if(milliseconds < 100)
		{
			if(milliseconds < 10)
				return String.Concat("00",milliseconds.ToString());
			
			return String.Concat("0",milliseconds.ToString());
		}
		
		return milliseconds.ToString();
	}
			
	#endregion
}	

