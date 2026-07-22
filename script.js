// -----------------------------
// Simulated Telemetry Data
// -----------------------------

let telemetry = {

    altitude: 0,
    temperature: 28,
    pressure: 1012,
    humidity: 52,
    velocity: 0,
    battery: 100,
    signal: -67,
    pitch: 0,
    roll: 0,
    yaw: 0,
};
let seconds = 0;
let altitudeLabels = [];
let altitudeData = [];
let missionStarted = false;
let phaseTimer = 0;
let missionPhase = "READY";
let ascentRate = 18;
let descentRate = 10;
let maxAltitude = 1000;
let latitude = 22.5726;
let longitude = 88.3639;
let temperatureLabels = [];
let temperatureData = [];
let missionPaused = false;
let pathCoordinates = [];
let flightPath;
let telemetryLog = [];
let pressureLabels = [];
let pressureData = [];
let batteryLabels = [];
let batteryData = [];
function updateTelemetry() {
    if (!missionStarted) return;
switch (missionPhase) {
    case "ASCENT":
        telemetry.altitude += ascentRate;
        telemetry.velocity = ascentRate;
        if (telemetry.altitude >= maxAltitude) {
            telemetry.altitude = maxAltitude;
            missionPhase = "APOGEE";
            updateMissionProgress(60, "APOGEE");
            addLog("📍 Apogee reached");
            phaseTimer = 0;
        }
        break;
    case "APOGEE":
        telemetry.velocity = 0;
        phaseTimer++;
        if (phaseTimer >= 2) {
            missionPhase = "DESCENT";
            document.getElementById("parachuteBtn").disabled = false;
            document.getElementById("separateBtn").disabled = true;
            updateMissionProgress(85, "DESCENT");
            addLog("🪂 Descent started");
        }
        break;
    case "DESCENT":
        telemetry.altitude -= descentRate;
        telemetry.velocity = -descentRate;
        if (telemetry.altitude <= 0) {
            telemetry.altitude = 0;
            telemetry.velocity = 0;
            missionPhase = "LANDED";
            updateMissionProgress(100, "MISSION COMPLETE");
            addLog("✅ Landing successful");
            missionStarted = false;
            document.getElementById("exportBtn").disabled = false;
            showSummary();
        }
        break;
        case "ABORTED":
        document.getElementById("missionPhase").style.color = "#ff1744";
        break;
}
if(missionStarted){
    telemetry.battery -= 0.5;
}
telemetry.pressure =1013 - telemetry.altitude * 0.11;
telemetry.temperature =30 - telemetry.altitude * 0.0065;
latitude += 0.00003;
longitude += 0.00002;
marker.setLatLng([latitude,longitude]);
pathCoordinates.push([latitude, longitude]);
flightPath.setLatLngs(pathCoordinates);
map.panTo([latitude,longitude]);
telemetryLog.push({
    time: seconds,
    altitude: telemetry.altitude,
    temperature: telemetry.temperature,
    pressure: telemetry.pressure,
    humidity: telemetry.humidity,
    velocity: telemetry.velocity,
    battery: telemetry.battery,
    latitude: latitude,
    longitude: longitude
});
telemetry.pitch = Math.sin(seconds / 5) * 15;
telemetry.roll = Math.cos(seconds / 6) * 10;
telemetry.yaw = (seconds * 8) % 360;
document.getElementById("pitchNeedle").style.transform =
`translateX(-50%) rotate(${telemetry.pitch}deg)`;
document.getElementById("rollNeedle").style.transform =
`translateX(-50%) rotate(${telemetry.roll}deg)`;
document.getElementById("yawNeedle").style.transform =
`translateX(-50%) rotate(${telemetry.yaw}deg)`;
}

function displayTelemetry(){
    document.getElementById("altitude").innerHTML = telemetry.altitude.toFixed(1) + " m";
    document.getElementById("temperature").innerHTML = telemetry.temperature.toFixed(1) + " °C";
    document.getElementById("pressure").innerHTML = telemetry.pressure.toFixed(1) + " hPa";
    document.getElementById("humidity").innerHTML = telemetry.humidity.toFixed(1) + " %";
    document.getElementById("velocity").innerHTML = telemetry.velocity.toFixed(1) + " m/s";
    document.getElementById("battery").innerHTML = telemetry.battery.toFixed(0) + "%";
    document.getElementById("batteryBar").value = telemetry.battery;
    document.getElementById("missionPhase").textContent = missionPhase;
    let battery = document.getElementById("battery");
    battery.innerHTML = telemetry.battery.toFixed(0)+"%";
    const state = document.getElementById("missionState");

    switch(missionPhase){
    case "READY":
    state.innerHTML = "Awaiting Launch Command";
    break;

    case "ASCENT":
    state.innerHTML = "Rocket Ascending";
    break;

    case "APOGEE":
    state.innerHTML = "Maximum Altitude Reached";
    break;

    case "DESCENT":
    state.innerHTML = "Parachute Deployment Active";
    break;

    case "LANDED":
    state.innerHTML = "Mission Completed Successfully";
    break;

    case "ABORTED":
    state.innerHTML = "Mission Terminated By Operator";
    break;
    }
pressureLabels.push(seconds);
pressureData.push(telemetry.pressure);
pressureChart.data.labels = pressureLabels;
pressureChart.data.datasets[0].data = pressureData;
pressureChart.update();
batteryLabels.push(seconds);
batteryData.push(telemetry.battery);
batteryChart.data.labels = batteryLabels;
batteryChart.data.datasets[0].data = batteryData;
batteryChart.update();
document.getElementById("pitch").innerHTML =
telemetry.pitch.toFixed(1) + "°";
document.getElementById("roll").innerHTML =
telemetry.roll.toFixed(1) + "°";
document.getElementById("yaw").innerHTML =
telemetry.yaw.toFixed(0) + "°";
if(telemetry.battery>60){
    battery.style.color="#4caf50";
}
else if(telemetry.battery>30){
    battery.style.color="#ffc107";
}
else{
    battery.style.color="#f44336";
}
updateErrorCode()
document.getElementById("latitudeValue").innerHTML = latitude.toFixed(6);
document.getElementById("longitudeValue").innerHTML = longitude.toFixed(6);
}
function updateErrorCode(){
    let code = "";
    // Digit 1 : Descent Rate
    if(missionPhase == "DESCENT" && (Math.abs(telemetry.velocity) < 8 ||
        Math.abs(telemetry.velocity) > 10))
        code += "1";
    else
        code += "0";
    // Digit 2 : GPS
    if(document.getElementById("gpsLock").innerHTML == "GPS LOCKED")
        code += "0";
    else
        code += "1";
    // Digit 3 : Payload Separation
    if(missionPhase == "DESCENT" || missionPhase == "LANDED")
        code += "0";
    else
        code += "1";
    // Digit 4 : Emergency Parachute
    code += "0";

    document.getElementById("errorCode").innerHTML = code;
    let status =
    document.getElementById("errorStatus");
    if(code=="0000"){
        status.innerHTML="All Systems Normal";
        status.style.color="#4caf50";
        updateRedundantButton();
    }
    else{
        status.innerHTML="Mission Fault Detected";
        status.style.color="#f44336";
        updateRedundantButton();
    }
}
function updateMissionClock(){
if(!missionStarted)
        return;
    seconds++;
altitudeLabels.push(seconds);
altitudeData.push(telemetry.altitude);
if(altitudeLabels.length > 20){
    altitudeLabels.shift();
    altitudeData.shift();
}

altitudeChart.update();
temperatureLabels.push(seconds);
temperatureData.push(telemetry.temperature);
if(temperatureLabels.length>20){
    temperatureLabels.shift();
    temperatureData.shift();
}

temperatureChart.update();
    
    let hrs = Math.floor(seconds/3600);
    let mins = Math.floor((seconds%3600)/60);
    let secs = seconds%60;

    let time =
        String(hrs).padStart(2,'0') + ":" +
        String(mins).padStart(2,'0') + ":" +
        String(secs).padStart(2,'0');

    document.getElementById("missionTime").innerHTML =
        "Mission Time : " + time;
}
const ctx = document.getElementById('altitudeChart').getContext('2d');
const altitudeChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: altitudeLabels,
        datasets: [{
            label: 'Altitude (m)',
            data: altitudeData,
            borderColor: '#4fc3f7',
            borderWidth: 2,
            tension: 0.3,
            fill: false,
            pointRadius: 0
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        scales: {
            x: {
                ticks: {
                    color: "white"
                }
            },
            y: {
                ticks: {
                    color: "white"
                }
            }
        },
        plugins: {
            legend: {
                labels: {
                    color: "white"
                }
            }
        }
    }
});

setInterval(function(){

    if(missionStarted && !missionPaused){
    updateTelemetry();
    displayTelemetry();
    updateMissionClock();

}

},1000);
function launchMission(){

    altitudeLabels = [];
    altitudeData = [];

    altitudeChart.data.labels = altitudeLabels;
    altitudeChart.data.datasets[0].data = altitudeData;
    altitudeChart.update();

    altitudeLabels.push(seconds);
    altitudeData.push(telemetry.altitude);

    if(missionStarted)
        return;

    missionStarted = true;
    missionPhase = "ASCENT";
    updateMissionProgress(10, "LAUNCH");
    addLog("🚀 Launch initiated");
    updateCommandStatus("Launch", "SUCCESS");
    document.getElementById("missionPhase").innerHTML = missionPhase;
    document.getElementById("launchBtn").disabled = true;
    document.getElementById("pauseBtn").disabled = false;
    document.getElementById("abortBtn").disabled = false;
    document.getElementById("resetBtn").disabled = false;
    document.getElementById("separateBtn").disabled = false;
    document.getElementById("parachuteBtn").disabled = true;
    updateRedundantButton();
}
function addLog(message){
    let now = new Date();
    let time = now.toLocaleTimeString();
    let log = document.getElementById("missionLog");
    log.innerHTML += `<div class="log-entry">[${time}] ${message}</div>`;
    log.scrollTop = log.scrollHeight;
}
const map = L.map('map').setView([22.5726,88.3639],15);
flightPath = L.polyline([],{
    color:"#4fc3f7",
    weight:3
}).addTo(map);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
    attribution:'© OpenStreetMap'
}).addTo(map);

const marker = L.marker([22.5726,88.3639]).addTo(map);
const tempCtx = document.getElementById("temperatureChart").getContext("2d");
const temperatureChart = new Chart(tempCtx,{

    type:"line",

    data:{
        labels:temperatureLabels,
        datasets:[{
            label:"Temperature (°C)",
            data:temperatureData,
            borderColor:"#ff9800",
            borderWidth:2,
            fill:false,
            tension:.3,
            pointRadius:0
        }]
    },

    options:{
        responsive:true,
        maintainAspectRatio:false,
        animation:false,
        plugins:{
            legend:{
                labels:{
                    color:"white"
                }
            }
        },

        scales:{
            x:{
                ticks:{
                    color:"white"
                }
            },
            y:{
                ticks:{
                    color:"white"
                }
            }
        }
    }
});
const pressureChart = new Chart(
    document.getElementById("pressureChart"),
    {
        type: "line",
        data: {
            labels: pressureLabels,
            datasets: [{
                label: "Pressure (hPa)",
                data: pressureData,
                borderColor: "#9c27b0",
                borderWidth: 2,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    }
);
const batteryChart = new Chart(
    document.getElementById("batteryChart"),
    {
        type: "line",
        data: {
            labels: batteryLabels,
            datasets: [{
                label: "Battery (%)",
                data: batteryData,
                borderColor: "#4caf50",
                borderWidth: 2,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales:{
                y:{
                    min:0,
                    max:100
                }
            }
        }
    }
);
function pauseMission(){
    if(!missionStarted)
        return;
    missionPaused = true;
    addLog("⏸ Mission paused");
    updateCommandStatus("Pause", "SUCCESS");
    document.getElementById("pauseBtn").disabled = true;
    document.getElementById("resumeBtn").disabled = false;
}
function resumeMission(){
    missionPaused = false;
    addLog("▶ Mission resumed");
    updateCommandStatus("Resume", "SUCCESS");
    document.getElementById("pauseBtn").disabled = false;
    document.getElementById("resumeBtn").disabled = true;
}
function resetMission(){
    missionStarted = false;
    missionPaused = false;
    seconds = 0;
    descentRate = 10;
    missionPhase = "READY";
    telemetry.altitude = 0;
    telemetry.temperature = 28;
    telemetry.pressure = 1013;
    telemetry.humidity = 52;
    telemetry.velocity = 0;
    telemetry.battery = 100;
    altitudeLabels = [];
    altitudeData = [];
    temperatureLabels = [];
    temperatureData = [];
    altitudeChart.data.labels = altitudeLabels;
    altitudeChart.data.datasets[0].data = altitudeData;
    altitudeChart.update();
    temperatureChart.data.labels = temperatureLabels;
    temperatureChart.data.datasets[0].data = temperatureData;
    temperatureChart.update();
    pathCoordinates = [];
    flightPath.setLatLngs([]);
    document.getElementById("missionLog").innerHTML = `
    <div class="log-entry system">
    System Ready...
    </div>
    `;
    latitude = 22.5726;
    longitude = 88.3639;
    phaseTimer = 0;
    marker.setLatLng([latitude, longitude]);
    map.setView([latitude, longitude], 15);
    updateMissionProgress(0, "READY");
    updateCommandStatus("Reset", "SUCCESS");
    displayTelemetry();

    document.getElementById("missionTime").innerHTML = "Mission Time : 00:00:00";
    document.getElementById("launchBtn").disabled = false;
    document.getElementById("pauseBtn").disabled = true;
    document.getElementById("resumeBtn").disabled = true;
    document.getElementById("resetBtn").disabled = true;
    document.getElementById("abortBtn").disabled = true;
    document.getElementById("separateBtn").disabled = true;
    document.getElementById("parachuteBtn").disabled = true;
    document.getElementById("pitch").innerHTML = "0°";
    document.getElementById("roll").innerHTML = "0°";
    document.getElementById("yaw").innerHTML = "0°";
    document.getElementById("pitchNeedle").style.transform =
    "translateX(-50%) rotate(0deg)";
    document.getElementById("rollNeedle").style.transform =
    "translateX(-50%) rotate(0deg)";
    document.getElementById("yawNeedle").style.transform =
    "translateX(-50%) rotate(0deg)";
    document.getElementById("errorCode").innerHTML = "0000";
    document.getElementById("errorStatus").innerHTML = "All Systems Normal";
    updateRedundantButton();
    telemetryLog = [];
    document.getElementById("exportBtn").disabled = true;
    document.getElementById("redundantBtn").disabled = true;
    pressureLabels = [];
    pressureData = [];
    pressureChart.data.labels = pressureLabels;
    pressureChart.data.datasets[0].data = pressureData;
    pressureChart.update();
    batteryLabels = [];
    batteryData = [];
    batteryChart.data.labels = batteryLabels;
    batteryChart.data.datasets[0].data = batteryData;
    batteryChart.update();
}
function abortMission(){

    if(!missionStarted)
        return;

    missionStarted = false;
    missionPaused = false;

    missionPhase = "ABORTED";
    updateMissionProgress(100, "MISSION ABORTED");
    addLog("❌ Mission aborted by operator");
    updateCommandStatus("Abort", "EXECUTED");
    document.getElementById("exportBtn").disabled = false;
    displayTelemetry();

    document.getElementById("launchBtn").disabled = true;
    document.getElementById("pauseBtn").disabled = true;
    document.getElementById("resumeBtn").disabled = true;
    document.getElementById("abortBtn").disabled = true;
    document.getElementById("resetBtn").disabled = false;

}
function showSummary(){

    document.getElementById("summaryStatus").innerHTML = missionPhase;
    document.getElementById("summaryTime").innerHTML = document.getElementById("missionTime").innerText;
    document.getElementById("summaryAltitude").innerHTML = maxAltitude + " m";
    document.getElementById("summaryBattery").innerHTML = telemetry.battery.toFixed(0) + "%";
    document.getElementById("summaryModal").style.display = "flex";
}

function closeSummary(){
    document.getElementById("summaryModal").style.display = "none";
}
function exportCSV(){

    let csv = "Time,Altitude,Temperature,Pressure,Humidity,Velocity,Battery,Latitude,Longitude\n";
    telemetryLog.forEach(row=>{
        csv +=`${row.time},${row.altitude},${row.temperature},${row.pressure},${row.humidity},${row.velocity},${row.battery},${row.latitude},${row.longitude}\n`;
    });
    const blob = new Blob([csv],{type:"text/csv"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mission_data.csv";
    a.click();
    URL.revokeObjectURL(url);
}
function updateMissionProgress(percent,text){
    document.getElementById("missionProgressBar").style.width = percent + "%";
    document.getElementById("progressText").innerHTML = text + " (" + percent + "%)";
}
function manualSeparation(){
    if(!missionStarted || missionPhase !== "ASCENT"){
        alert("Manual Separation can only be executed during ASCENT.");
        return;
    }

    addLog("📦 Manual Separation Executed");
    updateCommandStatus("Manual Separation", "SUCCESS");
    document.getElementById("missionState").innerHTML = "CanSat Successfully Separated";
    updateCommandStatus(
        "Manual Separation",
        "EXECUTED",
        "success"
    );
document.getElementById("separateBtn").disabled = true;
}
function deployParachute(){
    if(!missionStarted){
        alert("Mission has not started.");
        return;
    }
    if(missionPhase !== "DESCENT"){
        alert("Parachute can only be deployed during DESCENT.");
        return;
    }
    descentRate = 4;
    addLog("🪂 Emergency Parachute Deployed");
    updateCommandStatus("Deploy Parachute", "SUCCESS");
    updateCommandStatus(
        "Emergency Parachute",
        "DEPLOYED",
        "success"
    );
    document.getElementById("missionState").innerHTML = "Emergency Parachute Deployed";
    document.getElementById("parachuteBtn").disabled = true;
}
function redundantActivation(){
    if(!missionStarted){
        alert("Mission has not started.");
        return;
    }
    addLog("🛡 Backup System Activated");
    updateCommandStatus(
        "Redundant Activation",
        "BACKUP SYSTEM ONLINE",
        "success"
    );
    document.getElementById("missionState").innerHTML = "Backup System Active";
    document.getElementById("errorCode").innerHTML = "0000";
    document.getElementById("errorStatus").innerHTML = "All Systems Normal";
    document.getElementById("redundantBtn").disabled = true;
}
function updateRedundantButton(){
    const errorCode = document.getElementById("errorCode").innerHTML;
    document.getElementById("redundantBtn").disabled = (errorCode === "0000");
}
function exportChart(chart, name){
    const link = document.createElement("a");
    link.href = chart.toBase64Image();
    const now = new Date();
    const filename = `${name}_${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}_${now.getHours()}-${now.getMinutes()}.png`;
    link.download = filename;
    link.click();
}
function updateCommandStatus(command, status){
    document.getElementById("lastCommand").innerHTML = command;
    document.getElementById("commandStatus").innerHTML = status;
    document.getElementById("commandTime").innerHTML =
        new Date().toLocaleTimeString();
}
function updateCommandStatus(command, status){
    document.getElementById("lastCommand").innerHTML = command;
    const statusElement = document.getElementById("commandStatus");
    statusElement.innerHTML = status;
    if(status === "SUCCESS"){
        statusElement.style.color = "#3ddc84";
    }else if(status === "FAILED"){
        statusElement.style.color = "#ff4d4d";
    }else{
        statusElement.style.color = "#ffaa00";
    }
    document.getElementById("commandTime").innerHTML =
        new Date().toLocaleTimeString();
}
function syncPCTime(){
    const now = new Date();
    document.getElementById("missionTime").innerHTML =
        "Mission Time : " + now.toLocaleTimeString();
    addLog("🕒 PC Time Synchronized");
    updateCommandStatus("Sync PC Time", "SUCCESS");
}