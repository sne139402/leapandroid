var originalCallVolume,
  originalRingerMode,
  currentPhoneNumber,
  textMessageRequested = false;

device.telephony.on('incomingCall', function (signal) {
  

  originalCallVolume = device.audio.ringerVolume,
  originalRingerMode = device.audio.ringerMode;

  console.info(signal);
  currentPhoneNumber = signal.phoneNumber;

  device.scheduler.setTimer({
    name: "checkingForInCallInputs", 
    time: 0,
    interval: 5*1000,
    exact: false
  },
    function () {
      checkIfPhoneShouldBeSilent();
    }
  );
});

device.telephony.on('idle', function () {
 
  device.scheduler.removeTimer("checkingForInCallInputs");

  returnToPhoneDefaults();
});

function checkIfPhoneShouldBeSilent() {
 

  device.ajax({
    url: 'http://androidcontroller.herokuapp.com/shouldibesilent',
    type: 'POST',
    dataType: 'json',
    data: '{"call":"incoming"}',
    headers: {'Content-Type':'application/json'}
  }, function onSuccess(body, textStatus, response) {
    var JSONResponse = JSON.parse(body);
    console.info('successfully received http response!');
   
    console.info(JSON.stringify(JSONResponse));
   

    if (JSONResponse.callSound === false) {
      device.notifications.createNotification('Busy request sent, sending a text').show();
      device.audio.ringerVolume = 0;

      if (!textMessageRequested) {
        textMessageRequested = true;
        device.messaging.sendSms({
          to: currentPhoneNumber,
          body: 'Sorry! I am not free at the moment. I'll call you back later.'
        },
        function (err) {
          console.log(err || 'sms was sent successfully');
        });
      }
    }
  }, function onError(textStatus, response) {
    var error = {};
    error.message = textStatus;
    error.statusCode = response.status;
    console.error('error: ',error);
  });
}

function returnToPhoneDefaults() {
  device.audio.ringerVolume = originalCallVolume;
  device.audio.ringerMode = originalRingerMode;
  textMessageRequested = false;

  device.ajax({
    url: 'http://yourappurlhere.com/call',
    type: 'POST',
    dataType: 'json',
    data: '{"action":"reset"}',
    headers: {'Content-Type':'application/json'}
  }, function onSuccess(body, textStatus, response) {
    var JSONResponse = JSON.parse(body);
    console.info('Successfully got a response after asking to reset the call state');
   
    console.info(JSON.stringify(JSONResponse));
  }, function onError(textStatus, response) {
    var error = {};
    error.message = textStatus;
    error.statusCode = response.status;
    console.error('error: ',error);
  });
}
