var adapter 		= require('../../adapter-lib.js');
var dgram 			= require('dgram');
var connair 		= new adapter({
	"name": "Connair",
	"loglevel": 1,
	"description": "Schaltet Geräte über ein Connair-Gateway",
	"settingsFile": "connair.json"
});

process.on('message', function(data) {
	var status = data.status;
	var data = data.data;
	if(data.protocol.includes(":")){
		data.protocol = data.protocol.split(":");
	}else{
		data.protocol = [data.protocol];
	}
	switch(data.protocol[1]){
		case "elro":
			var msg = connair_create_msg_elro(status, data);
			break;
		case "intertec":
			var msg = connair_create_msg_intertec(status, data);
			break;
		case "brennenstuhl":
			var msg = connair_create_msg_brennenstuhl(status, data);
			break;
		case "intertechno":
			var msg = connair_create_msg_intertechno(status, data);
			break;
		case "raw":
			var msg = connair_create_msg_raw(status, data);
			break;
		default:
			var msg = "";
			connair.log.error("Falsches Protocol:" + data);
			break;
	}
	connair.settings.connairs.forEach(function(device){
		// dgram Klasse für UDP-Verbindungen
		var client = dgram.createSocket('udp4'); // Neuen Socket zum Client aufbauen
		client.send(msg, 0, msg.length, device.port, device.ip, function(err, bytes) 
		{
			connair.log.debug('UDP message sent to ' + device.ip +':'+ device.port +'; \n Folgendes wurde gesendet:' + msg); // Ausgabe der Nachricht
			client.close(); // Bei erfolgreichen Senden, die Verbindung zum CLient schließen
		});
	});
});

function connair_create_msg_elro(status, data) {

	sA=0;
	sG=0;
	sRepeat=10;
	sPause=5600;
	sTune=350;
	sSpeed=16;
	HEAD = "TXP:"+ sA +","+ sG +","+ sRepeat +","+ sPause +","+ sTune +",25,";
	TAIL = "1,"+ sSpeed +";";
	
	AN="1,3,1,3,1,3,3,1,";
	AUS="1,3,3,1,1,3,1,3,";
	bitLow=1;
	bitHgh=3;
	seqLow = bitLow + "," + bitHgh + "," + bitLow + "," + bitHgh + ",";
	seqHgh = bitLow + "," + bitHgh + "," + bitHgh + "," + bitLow + ",";
	bits = data.CodeOn;
	msg="";
	for(i=0; i < bits.length; i++) {
		bit = bits.substr(i,1);
		if( bit == "1") {
			msg = msg + seqLow;
		} else {
			msg = msg + seqHgh;
		}
	}
	msgM = msg;
	bits = data.CodeOff;
	msg="";
	for(i=0; i < bits.length; i++) {
		bit = bits.substr(i,1);
		if( bit == "1") {
			msg = msg + seqLow;
		} else {
			msg = msg + seqHgh;
		}
	}
	msgS = msg;
	if( status == 1) {
		return HEAD + msgM + msgS + AN + TAIL;
	} else {
		return HEAD + msgM + msgS + AUS + TAIL;
	}
}

function connair_create_msg_raw(status, data){
	if(status === 1){
		return data.CodeOn;
	}else{
		return data.CodeOff;
	}
}

function connair_create_msg_intertec(status, data) {
	console.log("Create ConnAir Message for Intertec device='"+ data.deviceid +"' action='"+ status +"'");
	var master = "00000"; 	//MasterDip
	var slave = "00000";	//SlaveDip
	var MasterDip = master.split("");
	var SlaveDip = slave.split("");
	var on = "11101";
	var off = "10111";
	var sRepeat=10;
	var sPause=5600;
	var sTakt=310;
	var msg = "TXP:0,0," + sRepeat + ","+ sPause +","+ sTakt +",25,";
	var seqHigh = "1,3,";
	var seqLow = "3,1,";

	var masterPart = "1" + MasterDip[0] + "1" + MasterDip[1] + "1" + MasterDip[2] + "1" + MasterDip[3] + "1" + MasterDip[4];
	var slavePart = "1" + SlaveDip[0] + "1" + SlaveDip[1] + "1" + SlaveDip[2] + "1" + SlaveDip[3] + "1" + SlaveDip[4];

	if(status == 1){
		var fullCode = masterPart + slavePart + on;
	}{
		var fullCode = masterPart + slavePart + off;
	}

	var fullCode = fullCode.split("");
	for (var i = 0; i < 25; i++) {
		if(fullCode[i] == 1){
			msg = msg + seqHigh;
		}else{
			msg = msg + seqLow;
		}
	}
	console.log(msg.slice(0, -1) + ",32;");
}

function connair_create_msg_intertechno(status, data) {

	sA=0;
	sG=0;
	sRepeat=12;
	sPause=11125;
	sTune=89;
	sSpeed=32; //erfahrung aus dem Forum auf 32 stellen http://forum.power-switch.eu/viewtopic.php?f=15&t=146
	uSleep=800000;
	HEAD = "TXP:"+ sA +","+ sG +","+ sRepeat +","+ sPause +","+ sTune +",25,";
	TAIL = "1,"+ sSpeed +",;";
	AN="12,4,4,12,12,4";
	AUS="12,4,4,12,4,12";
	bitLow=4;
	bitHgh=12;
	seqLow = bitHgh + "," + bitHgh + "," + bitLow + "," + bitLow + ",";
	seqHgh = bitHgh + "," + $bitLow + "," + bitHgh + "," + bitLow + ",";
	msgM="";
	switch (data.CodeOn.toUpperCase()) {
		case "A":
			msgM = seqHgh + seqHgh + seqHgh + seqHgh;
			break;
		case "B":
			msgM + seqLow + seqHgh + seqHgh + seqHgh;
			break;   
		case "C":
			msgM + seqHgh + seqLow + seqHgh + seqHgh;
			break; 
		case "D":
			msgM + seqLow + seqLow + seqHgh + seqHgh;
			break;
		case "E":
			msgM + seqHgh + seqHgh + seqLow + seqHgh;
			break;
		case "F":
			msgM + seqLow + seqHgh + seqLow + seqHgh;
			break;
		case "G":
			msgM + seqHgh + seqLow + seqLow + seqHgh;
			break;
		case "H":
			msgM + seqLow + seqLow + seqLow + seqHgh;
			break;
		case "I":
			msgM + seqHgh + seqHgh + seqHgh + seqLow;
			break;
		case "J":
			msgM + seqLow + seqHgh + seqHgh + seqLow;
			break;
		case "K":
			msgM + seqHgh + seqLow + seqHgh + seqLow;
			break;
		case "L":
			msgM + seqLow + seqLow + seqHgh + seqLow;
			break;
		case "M":
			msgM + seqHgh + seqHgh + seqLow + seqLow;
			break;
		case "N":
			msgM + seqLow + seqHgh + seqLow + seqLow;
			break;
		case "O":
			msgM + seqHgh + seqLow + seqLow + seqLow;
			break;
		case "P":
			msgM + seqLow + seqLow + seqLow + seqLow;
			break;
	}
	msgS="";   
	switch (data.CodeOff){
		case "1":
			msgS = seqHgh + seqHgh + seqHgh + seqHgh;
			break;
		case "2":
			msgS = seqLow + seqHgh + seqHgh + seqHgh;
			break;   
		case "3":
			msgS = seqHgh + seqLow + seqHgh + seqHgh;
			break; 
		case "4":
			msgS = seqLow + seqLow + seqHgh + seqHgh;
			break;
		case "5":
			msgS = seqHgh + seqHgh + seqLow + seqHgh;
			break;
		case "6":
			msgS = seqLow + seqHgh + seqLow + seqHgh;
			break;
		case "7":
			msgS = seqHgh + seqLow + seqLow + seqHgh;
			break;
		case "8":
			msgS = seqLow + seqLow + seqLow + seqHgh;
			break;
		case "9":
			msgS = seqHgh + seqHgh + seqHgh + seqLow;
			break;
		case "10":
			msgS = seqLow + seqHgh + seqHgh + seqLow;
			break;
		case "11":
			msgS = seqHgh + seqLow + seqHgh + seqLow;
			break;
		case "12":
			msgS = seqLow + seqLow + seqHgh + seqLow;
			break;
		case "13":
			msgS = seqHgh + seqHgh + seqLow + seqLow;
			break;
		case "14":
			msgS = seqLow + seqHgh + seqLow + seqLow;
			break;
		case "15":
			msgS = seqHgh + seqLow + seqLow + seqLow;
			break;
		case "16":
			msgS = seqLow + seqLow + seqLow + seqLow;
			break;
	}
	if(status == "ON") {
		return HEAD + bitLow + "," + msgM + msgS + seqHgh + seqLow + bitHgh + "," + AN + TAIL;
	} else {
		return HEAD + bitLow + "," + msgM + msgS + seqHgh + seqLow + bitHgh + "," + AUS + TAIL;
	}
}

function connair_create_msg_brennenstuhl(status, data) {
	console.log("Create ConnAir Message for Brennenstuhl device='"+ data.deviceid +"' action='"+ status +"'");  

	sA = 0;
	sG = 0;
	sRepeat = 10;
	sPause = 5600;
	sTune = 350;
	sBaud = "#baud#";
	sSpeed = 32;
	uSleep = 800000;
	// txversion=3;
	txversion = 1;
	HEAD = "TXP:"+ sA +","+ sG +","+ sRepeat +","+ sPause +","+ sTune +","+ sBaud +",";
	TAIL = ","+ txversion +",1,"+ sSpeed +",;";
	AN = "1,3,1,3,3";
	AUS = "3,1,1,3,1";
	bitLow = 1;
	bitHgh = 3;
	seqLow = bitHgh + "," + bitHgh + "," + bitLow + "," + bitLow + ",";
	seqHgh = bitHgh + "," + bitLow + "," + bitHgh + "," + bitLow + ",";
	bits = data.CodeOn;
	msg = "";
	for( i=0; i < bits.length; i++) {   
		bit = bits.substr(i,1);
		if(bit=="0") {
			msg = msg + seqLow;
		} else {
			msg = msg + seqHgh;
		}
	}
	msgM = msg;
	bits= data.CodeOff;
	msg="";
	for( i=0; i < bits.length; i++) {
		bit= bits.substr(i,1);
		if(bit=="0") {
			msg=msg + seqLow;
		} else {
			msg = msg + seqHgh;
		}
	}
	msgS = msg;
	if(status == 1) {
		return HEAD + bitLow + "," + msgM + msgS + bitHgh + "," + AN + TAIL;
	} else {
		return HEAD + bitLow + "," + msgM + msgS + bitHgh + "," + AUS + TAIL;
	}
}